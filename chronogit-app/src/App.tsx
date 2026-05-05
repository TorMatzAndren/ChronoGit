import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import jarriLogo from "./assets/jarri-logo.png";

type FileChange = {
  path: string;
  index_status: string;
  worktree_status: string;
  status: string;
  risk: string;
  staged: boolean;
  explanation: string;
};

type GitStatusResponse = {
  branch: string;
  staged: FileChange[];
  working: FileChange[];
};

type RepoInfo = {
  path: string;
  name: string;
  root: string;
};

type GitRemoteStatus = {
  repo_path: string;
  branch: string;
  upstream: string | null;
  remote: string | null;
  remote_url: string | null;
  ahead: number;
  behind: number;
  has_remote: boolean;
  is_diverged: boolean;
  is_clean: boolean;
};

type GitOperationState = {
  rebase_in_progress: boolean;
  merge_in_progress: boolean;
  cherry_pick_in_progress: boolean;
  revert_in_progress: boolean;
  conflicted_files: string[];
  warning: string;
};

type CommitResult = {
  ok: boolean;
  message: string;
  commit_hash: string;
};

type CommitPreflight = {
  staged_files: number;
  insertions: number;
  deletions: number;
  is_empty: boolean;
};

type HistoryCommit = {
  hash: string;
  short_hash: string;
  author: string;
  timestamp: string;
  message: string;
};

type ChangedFile = {
  path: string;
  status: string;
};

type DiffResult = {
  commit_hash: string;
  diff: string;
};

type CommitComparison = {
  left_commit: string;
  right_commit: string;
  left_label: string;
  right_label: string;
  changed_files: ChangedFile[];
  insertions: number;
  deletions: number;
  diff: string;
};

type FocusProjection =
  | { kind: "none" }
  | { kind: "commit"; commit: HistoryCommit }
  | { kind: "file"; commit: HistoryCommit; file: ChangedFile }
  | { kind: "comparison"; comparison: CommitComparison };

type RemotePullResult = {
  ok: boolean;
  message: string;
  stdout: string;
  stderr: string;
};

type RemotePushResult = {
  ok: boolean;
  message: string;
  stdout: string;
  stderr: string;
};

type MergeSafetyPrediction = {
  classification: string;
  risk_level: string;
  summary: string;
  local_touched_files: number;
  remote_touched_files: number;
  local_files: string[];
  remote_files: string[];
  shared_files: string[];
  working_changes: number;
  warning: string;
};

type RemoteOperationPreview = {
  operation: string;
  repo_path: string;
  branch: string;
  upstream: string | null;
  remote: string | null;
  ahead: number;
  behind: number;
  commit_count: number;
  commits: string[];
  changed_files: ChangedFile[];
  consequence: string;
  warning: string;
  merge_safety: MergeSafetyPrediction;
};

type ExplainDiffResult = {
  model: string;
  explanation: string;
  tdp_before_watts: string;
  tdp_active_watts: string;
  tdp_reset_watts: string;
};

type ExplainContext = {
  kind: string;
  title: string;
  plainText: string;
  rawTruth: string;
};

type LocalModel = {
  name: string;
  engine: string;
  size: number;
  modified_at: string;
  family: string;
  parameter_size: string;
  quantization_level: string;
};



function classifySnapshotImpact(preflight: CommitPreflight | null) {
  if (!preflight) return null;

  const churn = preflight.insertions + preflight.deletions;
  const flags: string[] = [];

  if (churn >= 500) flags.push("Large snapshot");
  if (preflight.insertions >= preflight.deletions * 5 && preflight.insertions >= 100) flags.push("Additive-heavy");
  if (preflight.deletions >= 50) flags.push("Deletion-heavy");

  if (!flags.length) return null;

  return {
    label: flags.join(" · "),
    text:
      churn >= 500
        ? "This snapshot contains a large amount of changed text. Review the included files before creating history."
        : "This snapshot has an unusual change shape. Review the included files before creating history.",
  };
}

function snapshotRemoteSentence(remote: GitRemoteStatus | null) {
  if (!remote || !remote.has_remote) {
    return "No remote is attached. This snapshot stays only on this computer.";
  }

  if (remote.is_diverged) {
    return `Remote context: your branch is diverged (+${remote.ahead} / -${remote.behind}). This snapshot still remains local until pushed.`;
  }

  if (remote.ahead > 0) {
    return `Remote context: you already have ${remote.ahead} local snapshot(s) not uploaded. This new snapshot will increase that local-ahead count.`;
  }

  if (remote.behind > 0) {
    return `Remote context: the remote has ${remote.behind} snapshot(s) you do not have locally. Consider reviewing before sharing new work.`;
  }

  return "Remote context: local and remote are currently in sync. This new snapshot still remains local until pushed.";
}


function beginnerHelpTitle(title: string, body: string) {
  return `${title}\n\n${body}`;
}

function maybeBeginnerTitle(enabled: boolean, title: string, body: string) {
  return enabled ? beginnerHelpTitle(title, body) : undefined;
}

function mergeClassificationCondition(preview: RemoteOperationPreview) {
  if (preview.merge_safety.working_changes > 0) return "Working tree not clean";
  return "No extra condition flags.";
}

function guardedRemoteToken(preview: RemoteOperationPreview) {
  if (preview.merge_safety.risk_level === "HIGH") return "override";
  return "confirm";
}

function remoteSafetyGateTitle(preview: RemoteOperationPreview) {
  if (preview.operation === "download_updates_preview") {
    if (preview.merge_safety.risk_level === "HIGH") return "Download blocked by default";
    if (preview.merge_safety.risk_level === "MEDIUM") return "Download needs review first";
    return "Download appears low-risk";
  }

  if (preview.operation === "upload_snapshots_preview") {
    if (preview.behind > 0) return "Upload does not resolve divergence";
    return "Upload appears straightforward";
  }

  return "Remote action needs review";
}

function remoteSafetyGateText(preview: RemoteOperationPreview) {
  if (preview.operation === "download_updates_preview") {
    if (preview.merge_safety.risk_level === "HIGH") return "Do not perform a real download/merge yet unless this is intentional. Same-path overlap and dirty working state can cause conflict.";
    if (preview.merge_safety.risk_level === "MEDIUM") return "Review before real download. Clean or snapshot working changes first if possible.";
    return "No same-path overlap or dirty working state was detected. Git remains authoritative.";
  }

  if (preview.operation === "upload_snapshots_preview") {
    if (preview.behind > 0) return "You can upload local snapshots, but the branch will still be diverged because remote-only snapshots also exist.";
    return "Upload would publish local snapshots to the configured remote. Working files are not changed by upload.";
  }

  return "Preview only.";
}

function remoteRecommendedAction(preview: RemoteOperationPreview) {
  if (preview.operation === "download_updates_preview") {
    if (preview.merge_safety.risk_level === "HIGH") return "Recommended: stop, clean/snapshot working changes, inspect overlap, then intentionally override only if you mean it.";
    if (preview.merge_safety.risk_level === "MEDIUM") return "Recommended: clean or snapshot local working changes before download/merge.";
    return "Recommended: safe to consider real download when ready.";
  }

  if (preview.operation === "upload_snapshots_preview") {
    if (preview.behind > 0) return "Recommended: understand remote-only work before treating upload as synchronization.";
    return "Recommended: safe to consider real upload if these snapshots should be shared.";
  }

  return "Recommended: review Git truth before acting.";
}

function guardedRemoteActionTitle(preview: RemoteOperationPreview) {
  const action = preview.operation === "download_updates_preview" ? "Download updates" : "Upload snapshots";
  if (preview.merge_safety.risk_level === "HIGH") return `${action}: high-risk override required`;
  if (preview.merge_safety.risk_level === "MEDIUM") return `${action}: confirmation required`;
  return `${action}: low-risk confirmation`;
}

function guardedRemoteActionBody(preview: RemoteOperationPreview) {
  const action = preview.operation === "download_updates_preview" ? "download/merge remote updates" : "upload local snapshots";

  return [
    `Requested action: ${action}`,
    ``,
    `Risk: ${preview.merge_safety.risk_level}`,
    `Classification: ${preview.merge_safety.classification}`,
    `Condition: ${mergeClassificationCondition(preview)}`,
    `Ahead / behind: +${preview.ahead} / -${preview.behind}`,
    ``,
    `Safety summary:`,
    preview.merge_safety.summary,
    ``,
    `Warning:`,
    preview.merge_safety.warning,
    ``,
    preview.operation === "download_updates_preview"
      ? `Important: confirming this will run git pull --rebase --autostash. If Git reports a conflict, use Abort rebase before trying another strategy.`
      : `Important: this first confirmation only acknowledges the upload preview. No Git push happens until you press Execute push after acknowledgement.`,
  ].join("\n");
}

function guardedRemoteActionLabel(preview: RemoteOperationPreview) {
  if (preview.merge_safety.risk_level === "HIGH") return "I understand: override high-risk gate";
  if (preview.merge_safety.risk_level === "MEDIUM") return "Confirm medium-risk intention";
  return "Confirm low-risk intention";
}

function guardedRemoteActionPolicy(preview: RemoteOperationPreview) {
  if (preview.merge_safety.risk_level === "HIGH") return "Blocked by default. Intentional override requires typing override.";
  if (preview.merge_safety.risk_level === "MEDIUM") return "Proceed with caution: explicit confirmation required.";
  return "Low-risk. Confirmation is still shown because remote actions affect shared history or local files.";
}


function remoteStateLabel(remote: GitRemoteStatus | null) {
  if (!remote || !remote.has_remote) return "LOCAL ONLY";
  if (remote.is_diverged) return "DIVERGED";
  if (remote.ahead > 0) return "AHEAD";
  if (remote.behind > 0) return "BEHIND";
  return "IN SYNC";
}

function remoteStateClass(remote: GitRemoteStatus | null) {
  return remoteStateLabel(remote).toLowerCase().replace(/ /g, "-");
}

function remoteTruthText(remote: GitRemoteStatus | null) {
  if (!remote || !remote.has_remote) return "LOCAL";
  if (remote.is_diverged) return `+${remote.ahead}/-${remote.behind}`;
  if (remote.ahead > 0) return `+${remote.ahead}`;
  if (remote.behind > 0) return `-${remote.behind}`;
  return "SYNC";
}

function explainRemoteHuman(remote: GitRemoteStatus | null) {
  if (!remote || !remote.has_remote) {
    return "This project is local-only right now. Commits stay on this computer unless a remote is later added and pushed.";
  }

  if (remote.is_diverged) {
    return "Both your local branch and the remote have commits the other side does not have.";
  }

  if (remote.ahead > 0) {
    return "You have local commits that are not uploaded to the remote.";
  }

  if (remote.behind > 0) {
    return "The remote has commits that you do not have locally yet.";
  }

  return "Your local branch and its remote tracking branch are in sync.";
}

function group(changes: FileChange[]) {
  const grouped: Record<string, FileChange[]> = {
    critical: [],
    danger: [],
    evidence: [],
    review: [],
    normal: [],
  };

  for (const change of changes) {
    if (!grouped[change.risk]) grouped.review.push(change);
    else grouped[change.risk].push(change);
  }

  return grouped;
}

function riskTitle(risk: string) {
  switch (risk) {
    case "critical": return "Critical / conflicts";
    case "danger": return "Danger / destructive";
    case "evidence": return "Evidence / backup files";
    case "review": return "Needs review";
    default: return "Safe changes";
  }
}

function plainStatus(change: FileChange) {
  if (change.staged) {
    if (change.status === "added") return "Prepared new file";
    if (change.status === "modified") return "Prepared edit";
    if (change.status === "deleted") return "Prepared deletion";
    return "Prepared change";
  }

  if (change.status === "untracked") return "New unprepared file";
  if (change.status === "modified") return "Edited but not prepared";
  if (change.status === "deleted") return "Deleted but not prepared";
  return "Working folder change";
}

function explainEntry(change: FileChange) {
  if (change.status === "untracked" && change.risk === "evidence") {
    return [
      "This file is untracked and looks like a backup or temporary artifact.",
      "It exists in your folder, but it is not part of Git history.",
      "Prepare it only if you intentionally want this backup-like file saved.",
      "Usually safe choice: leave it unprepared, delete it manually if unwanted, or later add ignore rules.",
    ];
  }

  if (change.status === "untracked") {
    return [
      "This file is untracked.",
      "Git sees it in your folder, but it is not part of project history yet.",
      "If you do nothing, it will not be included in the next snapshot.",
      "Click “Prepare for commit” if this is real project material you want saved.",
    ];
  }

  if (change.status === "modified" && change.staged) {
    return [
      "This tracked file has been edited and is already prepared.",
      "If you create a snapshot now, this edited version will be included.",
      "You can remove it from the next commit without deleting the file.",
    ];
  }

  if (change.status === "modified") {
    return [
      "This tracked file has changed since the last snapshot.",
      "It is still only a working-folder change.",
      "Prepare it if you want this edit included in the next snapshot.",
      "Restore/discard will throw away your local edit and return the file to the last committed version.",
    ];
  }

  if (change.status === "added") {
    return [
      "This is a new file that has been prepared for commit.",
      "If you create a snapshot now, Git will start tracking it in history.",
      "You can remove it from the next commit without deleting the file.",
    ];
  }

  if (change.status === "deleted") {
    return [
      "This is a tracked file deletion.",
      "If prepared and committed, the next snapshot records that the file was removed.",
      "Only prepare or commit deletions when the removal is intentional.",
    ];
  }

  if (change.status === "conflict") {
    return [
      "This file is in conflict.",
      "Git could not automatically combine changes.",
      "You must resolve the file manually before ChronoGit should allow a commit.",
    ];
  }

  return ["Review this Git change before preparing or committing it."];
}



function diffLineClass(line: string): string {
  if (line.startsWith("+++") || line.startsWith("---")) return "diff-line diff-line--file";
  if (line.startsWith("@@")) return "diff-line diff-line--hunk";
  if (line.startsWith("+")) return "diff-line diff-line--add";
  if (line.startsWith("-")) return "diff-line diff-line--remove";
  if (line.startsWith("diff --git")) return "diff-line diff-line--header";
  return "diff-line";
}

function renderPrettyDiff(diff: string) {
  if (!diff || !diff.trim()) {
    return <div className="diff-placeholder">No diff for this file.</div>;
  }

  const lines = diff.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  return (
    <div className="diff-pretty">
      {lines.map((line, index) => (
        <div className={diffLineClass(line)} key={`${index}-${line.slice(0, 24)}`}>
          <span className="diff-line__num">{index + 1}</span>
          <code className="diff-line__text">{line || " "}</code>
        </div>
      ))}
    </div>
  );
}


type ConfirmAction = {
  title: string;
  body: string;
  confirmLabel: string;
  danger: boolean;
  action: () => Promise<void>;
  requiredText?: string;
  requiredTextLabel?: string;
};

type SystemLogEntry = {
  id: string;
  date: string;
  time: string;
  level: "info" | "warning" | "error" | "action";
  message: string;
};

type LlmLogEntry = {
  id: string;
  timestamp: string;
  source: "diff" | "ui" | "remote" | "preflight";
  model: string;
  title: string;
  content: string;
};

function Timeline({
  repoPath,
  refreshTick,
  setConfirmAction,
  llmEngine,
  llmModel,
  appendLlmEntry,
}: {
  repoPath: string;
  refreshTick: number;
  setConfirmAction: (action: ConfirmAction | null) => void;
  llmEngine: string;
  llmModel: string;
  appendLlmEntry: (entry: Omit<LlmLogEntry, "id" | "timestamp">) => void;
}) {
  const [history, setHistory] = useState<HistoryCommit[]>([]);
  const [selected, setSelected] = useState<HistoryCommit | null>(null);
  const [changedFiles, setChangedFiles] = useState<ChangedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ChangedFile | null>(null);
  const [diff, setDiff] = useState("");
  const [compareBase, setCompareBase] = useState<HistoryCommit | null>(null);
  const [comparison, setComparison] = useState<CommitComparison | null>(null);
  const [focusProjection, setFocusProjection] = useState<FocusProjection>({ kind: "none" });
  const [explainText, setExplainText] = useState("");
  const [explainStatus, setExplainStatus] = useState("");
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainBusy, setExplainBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadHistory() {
    try {
      const result = await invoke<HistoryCommit[]>("git_history", { repoPath });
      setHistory(result);
      setError("");

      if (result.length > 0) {
        await selectSnapshot(result[0]);
      }
    } catch (err) {
      setError(`History failed: ${err}`);
    }
  }

  async function selectSnapshot(commit: HistoryCommit) {
    try {
      setSelected(commit);
      setSelectedFile(null);
      setComparison(null);
      setFocusProjection({ kind: "commit", commit });
      setDiff("Select a changed file to view its diff, or choose A ↔ B comparison.");
      setExplainText("");
      setExplainStatus("");
      setExplainOpen(false);
      setExplainOpen(false);
      setExplainStatus("");
      const files = await invoke<ChangedFile[]>("git_changed_files_from_commit", {
        repoPath,
        commitHash: commit.hash,
      });
      setChangedFiles(files);
      setError("");
    } catch (err) {
      setChangedFiles([]);
      setDiff("");
      setError(`Changed-file list failed: ${err}`);
    }
  }

  function markCompareBase() {
    if (!selected) return;

    setCompareBase(selected);
    setComparison(null);
    setSelectedFile(null);
    setDiff(`Comparison base selected: ${selected.short_hash} — ${selected.message}\n\nNow select another snapshot and click “Compare to selected”.`);
  }

  async function compareToSelected() {
    if (!compareBase || !selected) return;

    if (compareBase.hash === selected.hash) {
      setError("A ↔ B comparison needs two different snapshots.");
      return;
    }

    try {
      setExplainText("");
      setExplainStatus("");
      setExplainOpen(false);
      setSelectedFile(null);
      setDiff("Loading A ↔ B comparison...");
      const result = await invoke<CommitComparison>("git_compare_commits", {
        repoPath,
        leftCommit: compareBase.hash,
        rightCommit: selected.hash,
      });

      setComparison(result);
      setFocusProjection({ kind: "comparison", comparison: result });
      setDiff(result.diff.trim() || "No diff between these two snapshots.");
      setError("");
    } catch (err) {
      setComparison(null);
      setDiff("");
      setError(`A ↔ B comparison failed: ${err}`);
    }
  }

  async function explainComparison() {
    if (!comparison || !comparison.diff.trim()) return;

    try {
      setExplainBusy(true);
      setExplainStatus(`Local ${llmModel} is explaining A ↔ B comparison.`);
      const result = await invoke<ExplainDiffResult>("explain_comparison_with_ollama", {
        model: llmModel,
        leftLabel: comparison.left_label,
        rightLabel: comparison.right_label,
        fileCount: comparison.changed_files.length,
        insertions: comparison.insertions,
        deletions: comparison.deletions,
        changedFilesText: comparison.changed_files.map((file) => `${file.status} ${file.path}`).join("\n"),
        diff: comparison.diff,
      });

      setExplainStatus(`Local ${result.model} finished. GPU TDP: ${result.tdp_before_watts}W → ${result.tdp_active_watts}W → ${result.tdp_reset_watts}W.`);
      appendLlmEntry({
        source: "diff",
        model: result.model,
        title: `A ↔ B comparison: ${comparison.left_label} → ${comparison.right_label}`,
        content: result.explanation || "Local LLM returned an empty explanation.",
      });
      setError("");
    } catch (err) {
      setError(`A ↔ B LLM explanation failed: ${err}`);
    } finally {
      setExplainBusy(false);
    }
  }

  function clearComparison() {
    setCompareBase(null);
    setComparison(null);
    setFocusProjection(selected ? { kind: "commit", commit: selected } : { kind: "none" });
    setSelectedFile(null);
    setDiff(selected ? "Select a changed file to view its diff, or choose A ↔ B comparison." : "");
  }

  async function selectFile(file: ChangedFile) {
    if (!selected) return;

    try {
      setSelectedFile(file);
      setFocusProjection({ kind: "file", commit: selected, file });
      setDiff("Loading file diff...");
      setExplainText("");
      setExplainStatus("");
      setExplainOpen(false);
      const result = await invoke<DiffResult>("git_diff_file_from_commit", {
        repoPath,
        commitHash: selected.hash,
        path: file.path,
      });
      setDiff(result.diff.trim() || "No diff for this file.");
      setError("");
    } catch (err) {
      setDiff("");
      setError(`File diff failed: ${err}`);
    }
  }

  async function explainSelectedDiff() {
    if (!selectedFile || !diff.trim() || diff === "Loading file diff...") return;

    try {
      setExplainBusy(true);
      setExplainStatus(`Local ${llmModel} is running through ${llmEngine}. GPU TDP guard requested: 60% during job, reset afterward.`);
      setExplainText(`Waiting for local ${llmModel}...`);
      const result = await invoke<ExplainDiffResult>("explain_diff_with_ollama", {
        model: llmModel,
        diff,
        filePath: selectedFile.path,
        commitHash: selected?.short_hash ?? "unknown",
        commitMessage: selected?.message ?? "unknown",
      });
      setExplainStatus(`Local ${result.model} finished. GPU TDP: ${result.tdp_before_watts}W → ${result.tdp_active_watts}W → ${result.tdp_reset_watts}W.`);
      setExplainText(result.explanation || "Qwen returned an empty explanation.");
      appendLlmEntry({
        source: "diff",
        model: result.model,
        title: selectedFile ? `Diff explanation: ${selectedFile.path}` : "Diff explanation",
        content: result.explanation || "Qwen returned an empty explanation.",
      });
      setExplainOpen(false);
      setError("");
    } catch (err) {
      setExplainText("");
      setExplainStatus("");
      setExplainOpen(false);
      setError(`Local LLM explanation failed: ${err}`);
    } finally {
      setExplainBusy(false);
    }
  }

  async function restoreSelectedFile() {
    if (!selected || !selectedFile) return;

    const snapshot = selected;
    const file = selectedFile;

    setConfirmAction({
      title: "Restore file from old snapshot",
      body: `ChronoGit will restore this file from an older snapshot into your working folder.\n\nFile:\n${file.path}\n\nSnapshot:\n${snapshot.short_hash} — ${snapshot.message}\n\nThis modifies your working folder. It does NOT commit automatically. Review before preparing or committing.`,
      confirmLabel: "Restore file from snapshot",
      danger: true,
      action: async () => {
        try {
          const result = await invoke<string>("git_restore_file_from_commit", {
            repoPath,
            commitHash: snapshot.hash,
            path: file.path,
          });
          setError("");
          setDiff(`${result}\n\nThe file has been restored into your working folder. Review it before preparing or committing.`);
        } catch (err) {
          setError(`Restore from snapshot failed: ${err}`);
        }
      },
    });
  }

  useEffect(() => {
    loadHistory();
  }, [refreshTick]);


  return (
    <section className="timeline-panel">
      <div className="timeline-header">
        <div>
          <h2>Time Machine</h2>
          <p>Pick a snapshot, then pick a file to view what changed in that snapshot.</p>
        </div>
        <button onClick={loadHistory}>Refresh history</button>
      </div>

      {error ? <div className="message">{error}</div> : null}

      <div className={`focus-projection focus-projection--${focusProjection.kind}`}>
        <strong>Focus</strong>
        <span>
          {focusProjection.kind === "comparison"
            ? `Comparing ${focusProjection.comparison.left_label} → ${focusProjection.comparison.right_label}`
            : focusProjection.kind === "file"
              ? `Inspecting ${focusProjection.file.path} in ${focusProjection.commit.short_hash}`
              : focusProjection.kind === "commit"
                ? `Inspecting snapshot ${focusProjection.commit.short_hash} — ${focusProjection.commit.message}`
                : "No focused inspection selected yet."}
        </span>
      </div>

      <div className="comparison-toolbar">
        <div>
          <strong>A ↔ B comparison</strong>
          <span>
            {compareBase
              ? `A is ${compareBase.short_hash} — ${compareBase.message}`
              : "Choose a snapshot as A, then compare another snapshot as B."}
          </span>
        </div>

        <div className="comparison-toolbar__actions">
          <button disabled={!selected} onClick={markCompareBase}>
            Compare from here
          </button>
          <button disabled={!compareBase || !selected || compareBase.hash === selected?.hash} onClick={compareToSelected}>
            Compare to selected
          </button>
          <button disabled={!compareBase && !comparison} onClick={clearComparison}>
            Clear comparison
          </button>
        </div>
      </div>

      <div className="timeline-layout timeline-layout--three">
        <div className="timeline-list">
          {history.map((commit) => (
            <button
              key={commit.hash}
              className={`timeline-commit ${selected?.hash === commit.hash ? "timeline-commit--selected" : ""}`}
              onClick={() => selectSnapshot(commit)}
            >
              <span className="timeline-hash">{commit.short_hash}</span>
              <span className="timeline-message">{commit.message}</span>
              <span className="timeline-meta">{commit.author} · {commit.timestamp}</span>
            </button>
          ))}
        </div>

        <div className="timeline-files">
          <div className="diff-title">
            {selected ? `Changed files in snapshot ${selected.short_hash}` : "Changed files"}
          </div>

          {selected ? (
            changedFiles.length ? (
              changedFiles.map((file) => (
                <button
                  key={`${file.status}-${file.path}`}
                  className={`timeline-file ${selectedFile?.path === file.path ? "timeline-file--selected" : ""}`}
                  onClick={() => selectFile(file)}
                >
                  <span>{file.status}</span>
                  <strong>{file.path}</strong>
                </button>
              ))
            ) : (
              <div className="timeline-empty">No file changes recorded in this snapshot.</div>
            )
          ) : (
            <div className="timeline-empty">Select a snapshot first.</div>
          )}
        </div>

        <div className="diff-viewer">
          <div className="diff-title">
            {comparison
              ? `A ↔ B comparison: ${comparison.left_label} → ${comparison.right_label}`
              : selectedFile
                ? `File diff: ${selectedFile.path}`
                : "No file selected"}
          </div>

          {selected ? (
            <div className="diff-scope-card">
              <div>
                <strong>Diff scope</strong>
                <span>{comparison ? "Snapshot A vs Snapshot B" : selectedFile ? "Selected snapshot vs parent" : "No file selected yet"}</span>
              </div>
              <div>
                <strong>Snapshot</strong>
                <span>{comparison ? `${comparison.left_label} → ${comparison.right_label}` : `${selected.short_hash} · ${selected.message}`}</span>
              </div>
              <div>
                <strong>File</strong>
                <span>{comparison ? `${comparison.changed_files.length} changed file(s) in comparison` : selectedFile ? selectedFile.path : "Select a changed file to inspect its patch"}</span>
              </div>
            </div>
          ) : null}

          {comparison ? (
            <div className="comparison-summary">
              <div><strong>{comparison.changed_files.length}</strong><span>changed files</span></div>
              <div><strong>+{comparison.insertions}</strong><span>insertions</span></div>
              <div><strong>-{comparison.deletions}</strong><span>deletions</span></div>
            </div>
          ) : null}

          {comparison ? (
            <div className="diff-actions">
              <div className="diff-action-row">
                <button onClick={explainComparison} disabled={explainBusy || !comparison.diff.trim() || !llmModel}>
                  {explainBusy ? `${llmModel} is thinking...` : `Ask ${llmModel} to explain A ↔ B`}
                </button>
                <button
                  disabled={!comparison.diff.trim()}
                  onClick={async () => {
                    await navigator.clipboard.writeText(comparison.diff);
                    setExplainStatus("Complete A ↔ B diff copied to clipboard.");
                  }}
                >
                  Copy complete diff
                </button>
              </div>
            </div>
          ) : selectedFile ? (
            <div className="diff-actions">
              <div className="diff-action-row">
                <button onClick={explainSelectedDiff} disabled={explainBusy || !diff.trim() || !llmModel}>
                  {explainBusy ? `${llmModel} is thinking...` : `Ask ${llmModel} to explain this diff`}
                </button>
                <button className="danger-button" onClick={restoreSelectedFile}>
                  Restore this file from selected snapshot
                </button>
              </div>
            </div>
          ) : null}

          {false ? (
            <div className="ollama-chat">
              <div className="ollama-chat__title">Local LLM · Experimental explanation</div>
              {explainStatus ? <div className="ollama-chat__status">{explainStatus}</div> : null}
              <div className="ollama-chat__warning">
                Local LLM output is advisory. The Git diff remains the truth. Verify claims against changed lines.
              </div>
              {explainText ? (
                <div className="ollama-chat__read-row">
                  <button onClick={() => setExplainOpen((value) => !value)}>
                    {explainOpen ? "Hide Qwen explanation" : "Read Qwen explanation"}
                  </button>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(explainText);
                      setExplainStatus("Qwen explanation copied to clipboard.");
                    }}
                  >
                    Copy result
                  </button>
                  <button onClick={explainSelectedDiff} disabled={explainBusy}>
                    Ask again
                  </button>
                </div>
              ) : null}
              {explainText && explainOpen ? <pre>{explainText}</pre> : null}
            </div>
          ) : null}

          {selected ? renderPrettyDiff(diff) : <div className="diff-placeholder">Select a snapshot to inspect changed files.</div>}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [gitVersion, setGitVersion] = useState("Checking Git...");
  const [data, setData] = useState<GitStatusResponse | null>(null);
  const [lastRefresh, setLastRefresh] = useState("");
  const [message, setMessage] = useState("");
  const [busyPath, setBusyPath] = useState("");
  const [expandedPath, setExpandedPath] = useState("");
  const [showPreflight, setShowPreflight] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [commitPreflight, setCommitPreflight] = useState<CommitPreflight | null>(null);
  const [historyRefreshTick, setHistoryRefreshTick] = useState(0);
  const [repoPath, setRepoPath] = useState(() => localStorage.getItem("chronogit_repo_path") || "/home/dretski/projects/ChronoGit");
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [remoteStatus, setRemoteStatus] = useState<GitRemoteStatus | null>(null);
  const [operationState, setOperationState] = useState<GitOperationState | null>(null);
  const [beginnerMode, setBeginnerMode] = useState(() => localStorage.getItem("chronogit_beginner_mode") !== "off");
  const [llmEngine, setLlmEngine] = useState(() => localStorage.getItem("chronogit_llm_engine") || "ollama");
  const [llmModel, setLlmModel] = useState(() => localStorage.getItem("chronogit_llm_model") || "qwen3:8b");
  const [localModels, setLocalModels] = useState<LocalModel[]>([]);
  const [uiExplainTitle, setUiExplainTitle] = useState("");
  const [uiExplainStatus, setUiExplainStatus] = useState("");
  const [uiExplainText, setUiExplainText] = useState("");
  const [uiExplainOpen, setUiExplainOpen] = useState(false);
  const [uiExplainBusy, setUiExplainBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [systemLog, setSystemLog] = useState<SystemLogEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("chronogit_system_log") || "[]");
    } catch {
      return [];
    }
  });
  const [systemLogFilter, setSystemLogFilter] = useState<"all" | "info" | "action" | "warning" | "error">("all");
  const [llmLog, setLlmLog] = useState<LlmLogEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("chronogit_llm_log") || "[]");
    } catch {
      return [];
    }
  });
  const [lastAction, setLastAction] = useState("No file-changing action performed in this session.");
  const [remotePreview, setRemotePreview] = useState<RemoteOperationPreview | null>(null);
  const [armedRemoteUploadKey, setArmedRemoteUploadKey] = useState("");
  const [remoteBusy, setRemoteBusy] = useState("");
  const autoRefreshBusyRef = useRef(false);
  const lastKnownStateSignatureRef = useRef("");

  function remotePreviewKey(preview: RemoteOperationPreview) {
    return [
      preview.operation,
      preview.branch,
      preview.upstream || "none",
      preview.ahead,
      preview.behind,
      preview.commit_count,
      preview.changed_files.map((file) => `${file.status}:${file.path}`).join("|"),
    ].join("::");
  }

  function isUploadPreviewArmed(preview: RemoteOperationPreview) {
    return preview.operation === "upload_snapshots_preview" && armedRemoteUploadKey === remotePreviewKey(preview);
  }



  function gitStateSignature(
    status: GitStatusResponse,
    remote: GitRemoteStatus | null,
    operation: GitOperationState | null,
  ) {
    return JSON.stringify({
      branch: status.branch,
      staged: status.staged.map((file) => [
        file.path,
        file.index_status,
        file.worktree_status,
        file.status,
        file.risk,
        file.staged,
      ]),
      working: status.working.map((file) => [
        file.path,
        file.index_status,
        file.worktree_status,
        file.status,
        file.risk,
        file.staged,
      ]),
      remote: remote
        ? {
            branch: remote.branch,
            upstream: remote.upstream,
            ahead: remote.ahead,
            behind: remote.behind,
            has_remote: remote.has_remote,
            is_diverged: remote.is_diverged,
            is_clean: remote.is_clean,
          }
        : null,
      operation: operation
        ? {
            rebase_in_progress: operation.rebase_in_progress,
            merge_in_progress: operation.merge_in_progress,
            cherry_pick_in_progress: operation.cherry_pick_in_progress,
            revert_in_progress: operation.revert_in_progress,
            conflicted_files: operation.conflicted_files,
          }
        : null,
    });
  }

  function appendSystemLog(level: SystemLogEntry["level"], messageText: string) {
    const trimmed = messageText.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();
    const isRefreshStart = lower === "refreshing chronogit state...";
    const isRefreshComplete = lower === "chronogit state and time machine refreshed.";

    // Do not spam the durable system log with transient refresh-start messages.
    if (isRefreshStart) return;

    setSystemLog((entries) => {
      const recent = entries.slice(-8);

      // Collapse repeated refresh-complete messages and exact repeated messages.
      if (isRefreshComplete && recent.some((entry) => entry.message === trimmed)) {
        return entries;
      }

      if (entries.length && entries[entries.length - 1].message === trimmed) {
        return entries;
      }

      return [
        ...entries.slice(-119),
        (() => {
          const now = new Date();

          const date = now.toLocaleDateString(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });

          const time = now.toLocaleTimeString();

          return {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            date,
            time,
            level,
            message: trimmed,
          };
        })(),
      ];
    });
  }

  function appendLlmEntry(entry: Omit<LlmLogEntry, "id" | "timestamp">) {
    const content = entry.content.trim();
    if (!content) return;

    setLlmLog((entries) => [
      ...entries.slice(-49),
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timestamp: new Date().toLocaleTimeString(),
        ...entry,
        content,
      },
    ]);
  }

  function logLevelFromMessage(messageText: string): SystemLogEntry["level"] {
    const lower = messageText.toLowerCase();

    if (lower.includes("failed") || lower.includes("error") || lower.includes("blocked")) return "error";
    if (lower.includes("warning") || lower.includes("danger") || lower.includes("risk")) return "warning";
    if (lower.includes("created") || lower.includes("prepared") || lower.includes("removed") || lower.includes("restored") || lower.includes("fetched") || lower.includes("downloaded")) return "action";
    return "info";
  }

  async function refresh(path = repoPath) {
    const [statusResult, remoteResult, operationResult] = await Promise.all([
      invoke<GitStatusResponse>("git_status", { repoPath: path }),
      invoke<GitRemoteStatus>("git_remote_status", { repoPath: path }),
      invoke<GitOperationState>("git_operation_state", { repoPath: path }),
    ]);

    setData(statusResult);
    setRemoteStatus(remoteResult);
    setOperationState(operationResult);
    lastKnownStateSignatureRef.current = gitStateSignature(statusResult, remoteResult, operationResult);
    setLastRefresh(new Date().toLocaleTimeString());
  }

  async function loadRepos() {
    try {
      const result = await invoke<RepoInfo[]>("discover_git_repos");
      setRepos(result);

      if (result.length > 0 && !result.some((repo) => repo.path === repoPath)) {
        setRepoPath(result[0].path);
        localStorage.setItem("chronogit_repo_path", result[0].path);
      }
    } catch (err) {
      setMessage(`Repository discovery failed: ${err}`);
    }
  }

  useEffect(() => {
    invoke<string>("detect_git")
      .then(setGitVersion)
      .catch((err) => setGitVersion(`Git error: ${err}`));

    refresh().catch((err) => setMessage(`Status error: ${err}`));
    void loadRepos();
  }, []);

  useEffect(() => {
    localStorage.setItem("chronogit_repo_path", repoPath);
    refresh(repoPath).catch((err) => setMessage(`Status error: ${err}`));
    setHistoryRefreshTick((value) => value + 1);
  }, [repoPath]);

  useEffect(() => {
    localStorage.setItem("chronogit_llm_engine", llmEngine);
    void loadLocalModels(llmEngine);
  }, [llmEngine]);

  useEffect(() => {
    localStorage.setItem("chronogit_llm_model", llmModel);
  }, [llmModel]);

  useEffect(() => {
    localStorage.setItem("chronogit_beginner_mode", beginnerMode ? "on" : "off");
  }, [beginnerMode]);

  useEffect(() => {
    if (message.trim()) {
      appendSystemLog(logLevelFromMessage(message), message);
    }
  }, [message]);


  useEffect(() => {
    localStorage.setItem("chronogit_system_log", JSON.stringify(systemLog));
  }, [systemLog]);

  useEffect(() => {
    localStorage.setItem("chronogit_llm_log", JSON.stringify(llmLog));
  }, [llmLog]);


  useEffect(() => {
    const timer = window.setInterval(async () => {
      if (autoRefreshBusyRef.current) return;
      if (busyPath || remoteBusy || confirmAction || showPreflight) return;

      try {
        autoRefreshBusyRef.current = true;

        const [statusResult, remoteResult, operationResult] = await Promise.all([
          invoke<GitStatusResponse>("git_status", { repoPath }),
          invoke<GitRemoteStatus>("git_remote_status", { repoPath }),
          invoke<GitOperationState>("git_operation_state", { repoPath }),
        ]);

        const nextSignature = gitStateSignature(statusResult, remoteResult, operationResult);

        if (!lastKnownStateSignatureRef.current) {
          lastKnownStateSignatureRef.current = nextSignature;
          return;
        }

        if (nextSignature !== lastKnownStateSignatureRef.current) {
          lastKnownStateSignatureRef.current = nextSignature;
          setData(statusResult);
          setRemoteStatus(remoteResult);
          setOperationState(operationResult);
          setLastRefresh(new Date().toLocaleTimeString());
          setHistoryRefreshTick((value) => value + 1);
          appendSystemLog("info", "Auto-refresh detected repository changes.");
        }
      } catch (err) {
        appendSystemLog("warning", `Auto-refresh skipped: ${err}`);
      } finally {
        autoRefreshBusyRef.current = false;
      }
    }, 2500);

    return () => window.clearInterval(timer);
  }, [repoPath, busyPath, remoteBusy, confirmAction, showPreflight]);


  async function executeAction(action: "git_stage" | "git_unstage" | "git_restore" | "git_remove_untracked" | "git_ignore_path", path: string) {
    try {
      setBusyPath(path);
      setMessage("");
      const result = await invoke<string>(action, { repoPath, path });
      setMessage(result);
      setLastAction(`${result}. Recovery depends on the action: committed history can be inspected in Time Machine; uncommitted discarded/untracked deletions may need manual re-editing or external backups.`);
      await refresh();
    } catch (err) {
      setMessage(`Action failed: ${err}`);
    } finally {
      setBusyPath("");
    }
  }

  async function runAction(action: "git_stage" | "git_unstage" | "git_restore" | "git_remove_untracked" | "git_ignore_path", path: string) {
    if (action === "git_restore") {
      setConfirmAction({
        title: "Restore / discard local change",
        body: `ChronoGit will ask Git to restore this file from the last committed snapshot. This discards your local working-folder edit.\n\nPath:\n${path}`,
        confirmLabel: "Restore / discard",
        danger: true,
        action: async () => executeAction(action, path),
      });
      return;
    }

    if (action === "git_remove_untracked") {
      setConfirmAction({
        title: "Remove untracked file",
        body: `This file is not in Git history. Removing it deletes it from the working folder.\n\nPath:\n${path}`,
        confirmLabel: "Remove file",
        danger: true,
        action: async () => executeAction(action, path),
      });
      return;
    }

    if (action === "git_ignore_path") {
      setConfirmAction({
        title: "Add path to .gitignore",
        body: `ChronoGit will add this path to .gitignore so Git stops showing it as an untracked file.\n\nPath:\n${path}`,
        confirmLabel: "Add to .gitignore",
        danger: false,
        action: async () => executeAction(action, path),
      });
      return;
    }

    await executeAction(action, path);
  }

  async function openSnapshotPreflight() {
    try {
      setMessage("");
      const result = await invoke<CommitPreflight>("git_commit_preflight", { repoPath });
      setCommitPreflight(result);
      setShowPreflight(true);
    } catch (err) {
      setMessage(`Preflight failed: ${err}`);
    }
  }

  async function confirmSnapshot() {
    try {
      setMessage("");
      const result = await invoke<CommitResult>("git_commit", {
        repoPath,
        message: commitMessage,
      });

      setMessage(result.message);
      setLastAction(`${result.message}. This snapshot is now visible in local Time Machine history. It is not uploaded unless you push separately.`);
      setCommitMessage("");
      setShowPreflight(false);
      await refresh();
      setHistoryRefreshTick((value) => value + 1);
    } catch (err) {
      setMessage(`SNAPSHOT FAILED: ${err}`);
    }
  }


  async function fetchRemoteKnowledge() {
    try {
      setRemoteBusy("fetch");
      setMessage("");
      const result = await invoke<string>("git_fetch_remote", { repoPath });
      setMessage(result);
      setLastAction(`${result} This updated remote-tracking knowledge only; it did not change working files.`);
      await refresh();
    } catch (err) {
      setMessage(`Fetch remote knowledge failed: ${err}`);
    } finally {
      setRemoteBusy("");
    }
  }

  async function loadRemotePreview(kind: "push" | "pull") {
    try {
      setRemoteBusy(kind);
      setMessage("");
      const command = kind === "push" ? "git_push_preview" : "git_pull_preview";
      const result = await invoke<RemoteOperationPreview>(command, { repoPath });
      setRemotePreview(result);
      setArmedRemoteUploadKey("");
    } catch (err) {
      setRemotePreview(null);
      setMessage(`${kind === "push" ? "Upload" : "Download"} preview failed: ${err}`);
    } finally {
      setRemoteBusy("");
    }
  }



  async function executePush(preview: RemoteOperationPreview) {
    try {
      setRemoteBusy("push_execute");
      setMessage("Running git push...");
      const result = await invoke<RemotePushResult>("git_push_execute", {
        repoPath,
        overrideToken: guardedRemoteToken(preview),
      });

      setRemotePreview(null);
      setArmedRemoteUploadKey("");
      setMessage(`${result.message}${result.stdout ? ` stdout: ${result.stdout}` : ""}${result.stderr ? ` stderr: ${result.stderr}` : ""}`);
      setLastAction(`${result.message} This shared local snapshots with the configured remote; inspect Remote state after refresh.`);
      await refresh();
      setHistoryRefreshTick((value) => value + 1);
    } catch (err) {
      setMessage(`Upload snapshots failed: ${err}`);
      setLastAction("Upload snapshots failed. ChronoGit did not force push. Fetch remote knowledge and preview again before choosing another action.");
    } finally {
      setRemoteBusy("");
    }
  }

  async function executePullRebase(preview: RemoteOperationPreview) {
    try {
      setRemoteBusy("pull_execute");
      setMessage("Running git pull --rebase --autostash...");
      const result = await invoke<RemotePullResult>("git_pull_rebase_execute", {
        repoPath,
        overrideToken: guardedRemoteToken(preview),
      });

      setRemotePreview(null);
      setMessage(`${result.message}${result.stdout ? ` stdout: ${result.stdout}` : ""}${result.stderr ? ` stderr: ${result.stderr}` : ""}`);
      setLastAction(`${result.message} This may have changed local files/history; inspect Working, Prepared, and Time Machine before continuing.`);
      await refresh();
      setHistoryRefreshTick((value) => value + 1);
    } catch (err) {
      setMessage(`Download updates failed: ${err}`);
      setLastAction("Download updates failed. If a rebase is in progress, use Abort rebase before trying another strategy.");
    } finally {
      setRemoteBusy("");
    }
  }

  async function abortRebase() {
    try {
      setRemoteBusy("abort_rebase");
      const result = await invoke<string>("git_rebase_abort", { repoPath });
      setRemotePreview(null);
      setArmedRemoteUploadKey("");
      setMessage(result);
      setLastAction(result);
      await refresh();
      setHistoryRefreshTick((value) => value + 1);
    } catch (err) {
      setMessage(`Abort rebase failed: ${err}`);
    } finally {
      setRemoteBusy("");
    }
  }

  async function refreshAppState() {
    try {
      setMessage("Refreshing ChronoGit state...");
      await refresh();
      setHistoryRefreshTick((value) => value + 1);
      setMessage("ChronoGit state and Time Machine refreshed.");
    } catch (err) {
      setMessage(`Refresh failed: ${err}`);
    }
  }

  async function loadLocalModels(engine = llmEngine) {
    try {
      const models = await invoke<LocalModel[]>("list_local_llm_models", { engine });
      setLocalModels(models);

      if (models.length > 0 && !models.some((model) => model.name === llmModel)) {
        setLlmModel(models[0].name);
        localStorage.setItem("chronogit_llm_model", models[0].name);
      }
    } catch (err) {
      setLocalModels([]);
      setMessage(`Local LLM model discovery failed: ${err}`);
    }
  }

  async function explainUiContext(context: ExplainContext) {
    if (!llmModel) {
      setMessage("Local LLM unavailable: no model selected.");
      return;
    }

    try {
      setUiExplainBusy(true);
      setUiExplainTitle(context.title);
      setUiExplainOpen(true);
      setUiExplainStatus(`Local ${llmModel} is explaining: ${context.title}`);
      setUiExplainText("Waiting for local LLM explanation...");

      const result = await invoke<ExplainDiffResult>("explain_context_with_ollama", {
        model: llmModel,
        kind: context.kind,
        title: context.title,
        plainText: context.plainText,
        rawTruth: context.rawTruth,
      });

      setUiExplainStatus(`Local ${result.model} finished. GPU TDP: ${result.tdp_before_watts}W → ${result.tdp_active_watts}W → ${result.tdp_reset_watts}W.`);
      setUiExplainText(result.explanation || "Local LLM returned an empty explanation.");
      appendLlmEntry({
        source: context.kind === "preflight" ? "preflight" : context.kind === "remote" ? "remote" : "ui",
        model: result.model,
        title: context.title,
        content: result.explanation || "Local LLM returned an empty explanation.",
      });
      setUiExplainOpen(false);
    } catch (err) {
      setUiExplainStatus(`Local LLM explanation failed: ${err}`);
      setUiExplainText("");
    } finally {
      setUiExplainBusy(false);
    }
  }


  function operationStateLabel(state: GitOperationState | null) {
    if (!state) return "UNKNOWN";
    if (state.conflicted_files.length > 0) return "CONFLICTS";
    if (state.rebase_in_progress) return "REBASE IN PROGRESS";
    if (state.merge_in_progress) return "MERGE IN PROGRESS";
    if (state.cherry_pick_in_progress) return "CHERRY-PICK IN PROGRESS";
    if (state.revert_in_progress) return "REVERT IN PROGRESS";
    return "CLEAR";
  }

  function operationStateClass(state: GitOperationState | null) {
    return operationStateLabel(state).toLowerCase().replace(/ /g, "-");
  }

  function hasInterruptedOperation(state: GitOperationState | null) {
    if (!state) return false;
    return (
      state.rebase_in_progress ||
      state.merge_in_progress ||
      state.cherry_pick_in_progress ||
      state.revert_in_progress ||
      state.conflicted_files.length > 0
    );
  }

  function beginnerTitle(text: string) {
    return beginnerMode ? text : undefined;
  }

  function ActionExplainButton({
    title,
    plainText,
  }: {
    title: string;
    plainText: string;
    rawTruth?: string;
    kind?: string;
  }) {
    if (!beginnerMode) return null;

    return (
      <span
        className="explain-action-button"
        title={`${title}\n\n${plainText}`}
        aria-label={title}
      >
        ?
      </span>
    );
  }

  function renderCard(change: FileChange) {
    const expanded = expandedPath === `${change.path}:${change.staged}`;

    return (
      <article className={`change-card change-card--${change.risk}`} key={`${change.path}-${change.index_status}-${change.worktree_status}-${change.staged}`}>
        <div className="change-card__top">
          <div>
            <div className="change-card__path">{change.path}</div>
            <div className="change-card__plain">{plainStatus(change)}</div>
          </div>
          <div className={`risk-pill risk-pill--${change.risk}`}>{change.risk}</div>
        </div>

        <div className="change-card__explain">{change.explanation}</div>

        <div className="change-card__meta">
          <span>
            Git index/worktree: {change.index_status === " " ? "·" : change.index_status}
            {change.worktree_status === " " ? "·" : change.worktree_status}
          </span>
          <span>{change.staged ? "Prepared for next commit" : "Still only in working folder"}</span>
        </div>

        {expanded ? (
          <div className="explain-box">
            <div className="explain-box__title">What does this mean?</div>
            {explainEntry(change).map((line, index) => <p key={index}>{line}</p>)}
          </div>
        ) : null}

        <div className="change-card__actions">
          <button onClick={() => setExpandedPath(expanded ? "" : `${change.path}:${change.staged}`)}>
            {expanded ? "Hide explanation" : "Explain"}
          </button>

          <button
            disabled={uiExplainBusy || !llmModel}
            onClick={() => explainUiContext({
              kind: "file_status",
              title: `Explain file state: ${change.path}`,
              plainText: `${plainStatus(change)}. Risk: ${change.risk}. ${change.explanation}`,
              rawTruth: JSON.stringify(change, null, 2),
            })}
          >
            Ask LLM
          </button>

          {!change.staged ? (
            <>
              <button title={beginnerTitle("Prepare for commit\n\nMarks this file for the next snapshot. It does not commit yet.")} disabled={busyPath === change.path} onClick={() => runAction("git_stage", change.path)}>
                Prepare for commit
              </button>
              <ActionExplainButton
                title="Explain Prepare for commit"
                plainText="Prepare for commit means stage this file so it will be included in the next Git snapshot."
                rawTruth={JSON.stringify(change, null, 2)}
              />
            </>
          ) : (
            <>
              <button title={beginnerTitle("Remove from next commit\n\nTakes this file out of the next snapshot. Your file stays changed in the working folder.")} disabled={busyPath === change.path} onClick={() => runAction("git_unstage", change.path)}>
                Remove from next commit
              </button>
              <ActionExplainButton
                title="Explain Remove from next commit"
                plainText="Remove from next commit means unstage this file. It stays in the working folder, but will not be included if you commit now."
                rawTruth={JSON.stringify(change, null, 2)}
              />
            </>
          )}

          {!change.staged && change.status !== "untracked" ? (
            <>
              <button className="danger-button" title={beginnerTitle("Restore / discard\n\nDestructive: throws away this file's local working-folder changes and returns it to the last committed version.")} disabled={busyPath === change.path} onClick={() => runAction("git_restore", change.path)}>
                Restore / discard
              </button>
              <ActionExplainButton
                title="Explain Restore / discard"
                plainText="Restore / discard throws away this file's local working-folder changes and returns it to the last committed version."
                rawTruth={JSON.stringify(change, null, 2)}
                kind="destructive_button"
              />
            </>
          ) : null}

          {!change.staged && change.status === "untracked" ? (
            <>
              <button className="danger-button" title={beginnerTitle("Remove untracked file\n\nDestructive: deletes a file Git does not track. Git cannot restore it from history.")} disabled={busyPath === change.path} onClick={() => runAction("git_remove_untracked", change.path)}>
                Remove untracked file
              </button>
              <ActionExplainButton
                title="Explain Remove untracked file"
                plainText="Remove untracked file deletes a file that is not in Git history. This is destructive because Git cannot restore it from a previous commit."
                rawTruth={JSON.stringify(change, null, 2)}
                kind="destructive_button"
              />
              <button title={beginnerTitle("Add to .gitignore\n\nKeeps the file on disk but tells Git to stop showing it as untracked.")} disabled={busyPath === change.path} onClick={() => runAction("git_ignore_path", change.path)}>
                Add to .gitignore
              </button>
              <ActionExplainButton
                title="Explain Add to .gitignore"
                plainText="Add to .gitignore tells Git to stop showing this untracked path in normal status output."
                rawTruth={JSON.stringify(change, null, 2)}
              />
            </>
          ) : null}
        </div>
      </article>
    );
  }

  function renderGrouped(items: FileChange[]) {
    const grouped = group(items);
    return ["critical", "danger", "evidence", "review", "normal"].map((risk) => {
      const rows = grouped[risk];
      if (!rows.length) return null;

      return (
        <section className="risk-section" key={risk}>
          <h3>{riskTitle(risk)} <span>{rows.length}</span></h3>
          {rows.map(renderCard)}
        </section>
      );
    });
  }

  if (!data) return <main className="app-shell">Loading ChronoGit...</main>;

  const totalChanges = data.staged.length + data.working.length;
  const preflightWarnings = data.staged.filter((file) =>
    file.risk === "danger" || file.risk === "critical" || file.risk === "evidence"
  );
  const hasCritical = data.staged.some((file) => file.risk === "critical");
  const selectedModel = localModels.find((model) => model.name === llmModel);
  const snapshotImpact = classifySnapshotImpact(commitPreflight);
  const visibleSystemLog = systemLogFilter === "all"
    ? systemLog
    : systemLog.filter((entry) => entry.level === systemLogFilter);

  return (
    <main className="app-shell">
      <header className="hero hero--compact">
        <div className="product-title-card">
          <button
            className="brand-link-button brand-link-button--logo"
            title="Open Jarri website in your default browser"
            onClick={async () => {
              const result = await invoke<string>("open_external_url", { url: "http://jarri.systems" });
              setMessage(result);
            }}
          >
            <img src={jarriLogo} alt="Jarri" className="jarri-logo jarri-logo--large" />
          </button>

          <div className="product-title-text">
            <h1>ChronoGit</h1>

            <button
              className="github-link"
              title="Open GitHub profile in your default browser"
              onClick={async () => {
                const result = await invoke<string>("open_external_url", { url: "https://github.com/TorMatzAndren" });
                setMessage(result);
              }}
            >
              GitHub ↗
            </button>
          </div>
        </div>

        <div className="hero-side">
          <div className="beginner-main-card">
            <div className="beginner-main-card__title">Mode</div>
            <button
              className={`beginner-toggle ${beginnerMode ? "beginner-toggle--on" : "beginner-toggle--off"}`}
              onClick={() => setBeginnerMode((value) => !value)}
            >
              Beginner mode: {beginnerMode ? "ON" : "OFF"}
            </button>
            <div className="beginner-main-card__note">
              {beginnerMode
                ? "Shows teaching hints, hover help, and plain-language Git meaning."
                : "Compact expert view. Raw Git truth stays visible."}
            </div>
          </div>

          <div className="repo-main-card">
            <div className="repo-main-card__title">Repository</div>
            <div className="repo-main-card__note">Select a discovered local Git project.</div>

            <select
              value={repoPath}
              onChange={(event) => setRepoPath(event.target.value)}
            >
              {repos.length ? (
                repos.map((repo) => (
                  <option key={repo.path} value={repo.path}>
                    {repo.name} · {repo.path}
                  </option>
                ))
              ) : (
                <option value={repoPath}>{repoPath}</option>
              )}
            </select>

            <div className="repo-main-card__path">{repoPath}</div>

            <button className="status-refresh-button" title={beginnerTitle("Scan repositories\n\nSearches safe local folders for Git projects and updates the repository selector.")} onClick={loadRepos}>
              Scan repositories
            </button>
          </div>

          <div className="status-box">
            <div className="status-box__label">Git</div>
            <div>{gitVersion}</div>
            <div className="status-box__label">Branch</div>
            <div>{data.branch}</div>
            <div className="status-box__label">State</div>
            <div>{lastRefresh || "not refreshed yet"}</div>
            <div className="button-with-help">
              <button className="status-refresh-button" title={beginnerTitle("Refresh app state\n\nReloads repository status, remote awareness, and Time Machine history. This does not change files.")} onClick={refreshAppState}>
                Refresh app state
              </button>
              <ActionExplainButton
                title="Explain Refresh app state"
                plainText="Refresh app state reloads ChronoGit's view of Git status and Time Machine history from local Git truth."
                rawTruth="Refresh reads local repository status and history again. It does not change files."
              />
            </div>
          </div>

          <div className={`remote-main-card remote-main-card--${remoteStateClass(remoteStatus)}`}>
            <div className="remote-main-card__title">Remote</div>
            <div className="remote-main-card__state">{remoteStateLabel(remoteStatus)}</div>
            <div className="remote-main-card__line">
              Branch: <span>{remoteStatus?.branch || data.branch}</span>
            </div>
            <div className="remote-main-card__line">
              Upstream: <span>{remoteStatus?.upstream || "none"}</span>
            </div>
            <div className="remote-main-card__line">
              Ahead / behind: <span>+{remoteStatus?.ahead ?? 0} / -{remoteStatus?.behind ?? 0}</span>
            </div>
            <div className="remote-main-card__url">
              {remoteStatus?.remote_url || "No remote URL detected"}
            </div>
          </div>

          <div className="llm-main-card">
            <div className="llm-main-card__title">Local LLM</div>
            <div className="llm-main-card__note">Local-only explain layer. No cloud API.</div>

            <div className="llm-main-card__controls">
              <label>
                Engine
                <select
                  value={llmEngine}
                  onChange={(event) => setLlmEngine(event.target.value)}
                >
                  <option value="ollama">Ollama</option>
                </select>
              </label>

              <label>
                Model
                <select
                  value={llmModel}
                  onChange={(event) => setLlmModel(event.target.value)}
                >
                  {localModels.length ? (
                    localModels.map((model) => (
                      <option key={model.name} value={model.name}>
                        {model.name} · {model.parameter_size} · {model.quantization_level}
                      </option>
                    ))
                  ) : (
                    <option value={llmModel}>{llmModel || "No models discovered"}</option>
                  )}
                </select>
              </label>
            </div>

            <div className="llm-main-card__meta">
              {selectedModel
                ? `${selectedModel.family} · ${selectedModel.parameter_size} · ${selectedModel.quantization_level} · ${(selectedModel.size / 1024 / 1024 / 1024).toFixed(1)} GB`
                : "Model metadata unavailable"}
            </div>

            <div className="button-with-help">
              <button className="status-refresh-button" title={beginnerTitle("Scan installed models\n\nAsks the selected local LLM engine which models are installed on this computer.")} onClick={() => loadLocalModels()}>
                Scan installed models
              </button>
              <ActionExplainButton
                title="Explain Scan installed models"
                plainText="Scan installed models asks the selected local LLM engine which models are available on this computer."
                rawTruth="For Ollama, ChronoGit queries the local API at 127.0.0.1:11434/api/tags."
              />
            </div>
          </div>
        </div>
      </header>

      <section className="state-dashboard">
        <section className={`truth-strip truth-strip--${remoteStateClass(remoteStatus)}`}>
          <div title="Working-folder changes are files changed on disk but not prepared for the next commit."><strong>Working</strong><span>{data.working.length}</span></div>
          <div title="Prepared changes are staged files that will be included if you commit now."><strong>Prepared</strong><span>{data.staged.length}</span></div>
          <div title="Remote shows whether your local branch is synced with its remote tracking branch."><strong>Remote</strong><span>{remoteTruthText(remoteStatus)}</span></div>
          <div title="State summarizes the local/remote relationship."><strong>State</strong><span>{remoteStateLabel(remoteStatus)}</span></div>
        </section>

        <div className="current-state-card">
          <div>
            <div className="current-state-card__label">Current state</div>
            <h2>{remoteStateLabel(remoteStatus)}</h2>
            <p>{explainRemoteHuman(remoteStatus)}</p>
          </div>

          <div className="current-state-card__facts">
            <span><strong>Repo</strong>{repos.find((repo) => repo.path === repoPath)?.name || "Selected repository"}</span>
            <span><strong>Branch</strong>{remoteStatus?.branch || data.branch}</span>
            <span><strong>Upstream</strong>{remoteStatus?.upstream || "none"}</span>
          </div>

          <div className="current-state-card__last">
            <strong>Last action</strong>
            <span>{lastAction}</span>
          </div>
        </div>
      </section>

      {operationState && hasInterruptedOperation(operationState) ? (
        <section className={`operation-state-banner operation-state-banner--${operationStateClass(operationState)}`}>
          <div>
            <strong>Git operation state: {operationStateLabel(operationState)}</strong>
            <span>{operationState.warning}</span>
          </div>

          {operationState.conflicted_files.length ? (
            <div className="operation-state-banner__files">
              {operationState.conflicted_files.map((file) => (
                <code key={file}>{file}</code>
              ))}
            </div>
          ) : null}

          {operationState.rebase_in_progress ? (
            <button className="danger-button" disabled={remoteBusy !== ""} onClick={abortRebase}>
              Abort rebase
            </button>
          ) : null}
        </section>
      ) : null}

      <section className="flow-strip flow-strip--compact">
        <div className="flow-step">
          <strong>Working files</strong>
          <span>{data.working.length} not prepared</span>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-step">
          <strong>Prepared changes</strong>
          <span>{data.staged.length} ready for snapshot</span>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-step flow-step--locked">
          <strong>Snapshot</strong>
          <span>{data.staged.length ? "Review preflight next" : "Prepare files first"}</span>
        </div>
      </section>

      <section className="ui-explain-shortcuts">
        <button
          disabled={uiExplainBusy || !llmModel}
          onClick={() => explainUiContext({
            kind: "git_flow",
            title: "Explain ChronoGit flow",
            plainText: "ChronoGit presents Git as Working files → Prepared changes → Snapshot.",
            rawTruth: "Working files are local disk changes. Prepared changes are staged files. Snapshot means Git commit.",
          })}
        >
          Ask LLM: explain Git flow
        </button>
        <button
          disabled={uiExplainBusy || !llmModel}
          onClick={() => explainUiContext({
            kind: "time_machine",
            title: "Explain Time Machine",
            plainText: "Time Machine lets users inspect earlier Git snapshots, changed files, file diffs, and restore selected files.",
            rawTruth: "Snapshot list is commit history. Changed files are detected per selected snapshot. File diff shows the patch for one selected file. Restore only restores one selected file into the working folder; it does not commit automatically and does not reset the whole repository.",
          })}
        >
          Ask LLM: explain Time Machine
        </button>
      </section>



      <section className="preflight-card">
        <div>
          <h2>Commit Preflight</h2>
          <p>Jarri safety mode is active. ChronoGit reviews prepared files before any snapshot is created.</p>
        </div>
        <div className="preflight-card__actions">
          <button
            disabled={uiExplainBusy || !llmModel}
            onClick={() => explainUiContext({
              kind: "preflight",
              title: "Explain Snapshot Preflight",
              plainText: "Snapshot Preflight reviews only files prepared for the next commit. Files still in the working folder are not included in the commit.",
              rawTruth: JSON.stringify({
                staged_count: data.staged.length,
                working_count: data.working.length,
                staged: data.staged,
                rule: "Only staged (prepared) files will be included in the commit. Working-folder files are excluded."
              }, null, 2),
            })}
          >
            Ask LLM
          </button>
          <button title={beginnerTitle("Review snapshot / Git commit\n\nOpens preflight before creating a commit. Only prepared files will be included.")} disabled={data.staged.length === 0} onClick={openSnapshotPreflight}>
            Review snapshot / Git commit ({data.staged.length})
          </button>
          <ActionExplainButton
            title="Explain Review snapshot / Git commit"
            plainText="Review snapshot opens the commit preflight. Only prepared files will be included in the Git commit."
            rawTruth={JSON.stringify({
              staged_count: data.staged.length,
              working_count: data.working.length,
              rule: "Only staged/prepared files are included in the commit."
            }, null, 2)}
          />
        </div>
      </section>

      <section className="summary-grid">
        <div className="summary-card">
          <div className="summary-card__number">{data.working.length}</div>
          <div>working changes</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__number">{data.staged.length}</div>
          <div>prepared changes</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__number">{totalChanges}</div>
          <div>total visible changes</div>
        </div>
      </section>

      <section className="columns">
        <div className="panel">
          <div className="panel__header">
            <h2>Prepared for next commit</h2>
            <p>These files are already staged. If you commit now, they become part of history.</p>
          </div>
          {data.staged.length ? renderGrouped(data.staged) : <div className="empty">Nothing prepared yet.</div>}
        </div>

        <div className="panel">
          <div className="panel__header">
            <h2>Working folder changes</h2>
            <p>These changes exist on disk, but are not part of the next commit unless prepared.</p>
          </div>
          {data.working.length ? renderGrouped(data.working) : <div className="empty">Working folder is clean.</div>}
        </div>
      </section>

      {false ? (
        <section className="ui-explain-panel">
          <div className="ui-explain-panel__header">
            <div>
              <div className="ui-explain-panel__eyebrow">Local LLM · UI explanation</div>
              <h2>{uiExplainTitle || "ChronoGit explanation"}</h2>
            </div>
            <div className="ui-explain-panel__actions">
              <button onClick={() => setUiExplainOpen((value) => !value)}>
                {uiExplainOpen ? "Hide explanation" : "Read explanation"}
              </button>
              {uiExplainText ? (
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(uiExplainText);
                    setUiExplainStatus("UI explanation copied to clipboard.");
                  }}
                >
                  Copy result
                </button>
              ) : null}
            </div>
          </div>

          {uiExplainStatus ? <div className="ui-explain-panel__status">{uiExplainStatus}</div> : null}
          <div className="ui-explain-panel__warning">
            Local LLM output is advisory. ChronoGit UI state and Git output remain authoritative.
          </div>
          {uiExplainText && uiExplainOpen ? <pre>{uiExplainText}</pre> : null}
        </section>
      ) : null}

      <Timeline
        repoPath={repoPath}
        refreshTick={historyRefreshTick}
        setConfirmAction={setConfirmAction}
        llmEngine={llmEngine}
        llmModel={llmModel}
        appendLlmEntry={appendLlmEntry}
      />


      <section className="remote-actions-panel">
        <div className="remote-actions-panel__header">
          <div>
            <h2>Remote synchronization preview</h2>
            <p>Fetch updates remote knowledge. Upload/download previews do not push, pull, merge, or modify working files.</p>
          </div>
          <div className="remote-actions-panel__buttons">
            <button title={beginnerTitle("Fetch remote knowledge\n\nUpdates Git's knowledge of the remote branch. Does not change working files, merge, pull, or push.")} disabled={remoteBusy !== ""} onClick={fetchRemoteKnowledge}>
              {remoteBusy === "fetch" ? "Fetching..." : "Fetch remote knowledge"}
            </button>
            <button title={beginnerTitle("Upload snapshots preview\n\nShows local commits that would be shared. Preview only: does not push.")} disabled={remoteBusy !== ""} onClick={() => loadRemotePreview("push")}>
              {remoteBusy === "push" ? "Checking..." : "Upload snapshots (preview)"}
            </button>
            <button title={beginnerTitle("Download updates preview\n\nShows remote commits that could be downloaded. Preview only: does not pull or merge.")} disabled={remoteBusy !== ""} onClick={() => loadRemotePreview("pull")}>
              {remoteBusy === "pull" ? "Checking..." : "Download updates (preview)"}
            </button>
            <button title={beginnerTitle("Abort rebase\n\nUse only if Git started a rebase and the download/merge failed or conflicted.")} disabled={remoteBusy !== ""} className="danger-button" onClick={abortRebase}>
              {remoteBusy === "abort_rebase" ? "Aborting..." : "Abort rebase"}
            </button>
          </div>
        </div>

        {beginnerMode ? (
          <div className="remote-beginner-help">
            <strong>Remote help:</strong> Fetch only updates knowledge. Upload shares local snapshots. Download brings remote snapshots into this branch. Rebase tries to replay your local snapshots after remote updates. Abort rebase is the emergency stop if Git reports a failed/conflicted rebase.
          </div>
        ) : null}

        {remotePreview ? (
          <div className="remote-preview-box">
            <div className="remote-preview-box__truth">
              <div><strong title={maybeBeginnerTitle(beginnerMode, "Operation", "This is the remote preview type. Upload preview means local snapshots that could be shared. Download preview means remote snapshots that could be brought into this branch.")}>Operation</strong><span>{remotePreview.operation}</span></div>
              <div><strong title={maybeBeginnerTitle(beginnerMode, "Branch", "The local branch being compared against its configured upstream branch.")}>Branch</strong><span>{remotePreview.branch}</span></div>
              <div><strong title={maybeBeginnerTitle(beginnerMode, "Upstream", "The remote-tracking branch Git uses as the comparison target for ahead/behind.")}>Upstream</strong><span>{remotePreview.upstream || "none"}</span></div>
              <div><strong title={maybeBeginnerTitle(beginnerMode, "Ahead / Behind", "Ahead means local snapshots not on the remote. Behind means remote snapshots not in your local branch. If both are nonzero, the branch is diverged.")}>Ahead / Behind</strong><span>+{remotePreview.ahead} / -{remotePreview.behind}</span></div>
            </div>

            <div className="remote-preview-box__message">
              <strong>Consequence</strong>
              <span>{remotePreview.consequence}</span>
            </div>

            <div className="remote-preview-box__warning">
              <strong title={maybeBeginnerTitle(beginnerMode, "Warning", "This explains the main risk or limitation of the selected remote direction.")}>Warning</strong>
              <span>{remotePreview.warning}</span>
            </div>

            <div className="remote-merge-safety">
              <div>
                <strong title={maybeBeginnerTitle(beginnerMode, "Safe merge prediction", "ChronoGit compares local-only and remote-only touched paths before any real merge. This is a prediction only; Git remains the authority.")}>Safe merge prediction</strong>
                <span>{remotePreview.merge_safety.classification}</span>
              </div>
              <p>{remotePreview.merge_safety.summary}</p>
              <p>{remotePreview.merge_safety.warning}</p>

              <div className="merge-condition-line">
                <strong title={maybeBeginnerTitle(beginnerMode, "Condition", "Extra state that changes risk. For example, a dirty working tree means uncommitted local changes exist.")}>Condition</strong>
                <span>{mergeClassificationCondition(remotePreview)}</span>
              </div>

              <div className="remote-merge-safety__facts">
                <div
                  className={`merge-risk merge-risk--${remotePreview.merge_safety.risk_level.toLowerCase()}`}
                  title={maybeBeginnerTitle(beginnerMode, "Risk", "LOW means no overlap and clean working tree. MEDIUM means either overlap or dirty working tree. HIGH means overlap plus dirty working tree. Intentional override may be allowed, but never silently.")}
                >
                  RISK: {remotePreview.merge_safety.risk_level}
                </div>
                <code title={maybeBeginnerTitle(beginnerMode, "Local touched", "Number of unique paths touched by local-only commits.")}>local touched: {remotePreview.merge_safety.local_touched_files}</code>
                <code title={maybeBeginnerTitle(beginnerMode, "Remote touched", "Number of unique paths touched by remote-only commits.")}>remote touched: {remotePreview.merge_safety.remote_touched_files}</code>
                <code title={maybeBeginnerTitle(beginnerMode, "Working changes", "Current uncommitted changes in the working folder. These are not local snapshots yet and can make remote actions harder to reason about.")}>working changes: {remotePreview.merge_safety.working_changes}</code>
              </div>

              <div className="path-overlap-analysis">
                <h3 title={maybeBeginnerTitle(beginnerMode, "Path overlap analysis", "Shows why ChronoGit thinks a merge is likely clean or risky. No overlap means local and remote commits touched different paths.")}>Path overlap analysis</h3>
                <div className="path-overlap-analysis__grid">
                  <div>
                    <strong title={maybeBeginnerTitle(beginnerMode, "Local-only paths", "Files touched by commits that exist locally but not on the remote.")}>Local-only paths</strong>
                    {remotePreview.merge_safety.local_files.length ? (
                      remotePreview.merge_safety.local_files.map((file) => <code key={`local-${file}`}>{file}</code>)
                    ) : (
                      <span>No local-only paths.</span>
                    )}
                  </div>
                  <div>
                    <strong title={maybeBeginnerTitle(beginnerMode, "Remote-only paths", "Files touched by commits that exist on the remote but not in this local branch.")}>Remote-only paths</strong>
                    {remotePreview.merge_safety.remote_files.length ? (
                      remotePreview.merge_safety.remote_files.map((file) => <code key={`remote-${file}`}>{file}</code>)
                    ) : (
                      <span>No remote-only paths.</span>
                    )}
                  </div>
                  <div>
                    <strong title={maybeBeginnerTitle(beginnerMode, "Overlap", "Paths touched by both local-only and remote-only commits. Overlap increases merge conflict risk.")}>Overlap</strong>
                    {remotePreview.merge_safety.shared_files.length ? (
                      remotePreview.merge_safety.shared_files.map((file) => <code className="path-overlap-analysis__danger" key={`shared-${file}`}>{file}</code>)
                    ) : (
                      <span>No same-path overlap detected.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className={`remote-safety-gate remote-safety-gate--${remotePreview.merge_safety.risk_level.toLowerCase()}`}>
                <strong>{remoteSafetyGateTitle(remotePreview)}</strong>
                <span>{remoteSafetyGateText(remotePreview)}</span>
                <em>{remoteRecommendedAction(remotePreview)}</em>
                <div className="remote-safety-gate__policy">{guardedRemoteActionPolicy(remotePreview)}</div>
                {remotePreview.operation === "upload_snapshots_preview" ? (
                  <div className={`remote-upload-arm-state ${isUploadPreviewArmed(remotePreview) ? "remote-upload-arm-state--armed" : ""}`}>
                    {isUploadPreviewArmed(remotePreview)
                      ? "Step 2 ready: this exact preview is acknowledged. Execute push is now available."
                      : "Step 1: acknowledge this preview. No push happens in step 1."}
                  </div>
                ) : null}
                <button
                  className={remotePreview.merge_safety.risk_level === "HIGH" ? "danger-button" : ""}
                  onClick={() => {
                    const preview = remotePreview;
                    const uploadArmed = isUploadPreviewArmed(preview);

                    setConfirmAction({
                      title: preview.operation === "upload_snapshots_preview" && uploadArmed
                        ? "Execute push: final confirmation"
                        : guardedRemoteActionTitle(preview),
                      body: preview.operation === "upload_snapshots_preview" && uploadArmed
                        ? [
                            "Requested action: execute git push",
                            "",
                            `Risk: ${preview.merge_safety.risk_level}`,
                            `Classification: ${preview.merge_safety.classification}`,
                            `Ahead / behind: +${preview.ahead} / -${preview.behind}`,
                            "",
                            "This will upload local snapshots to the configured remote.",
                            "ChronoGit will not force push, pull, merge, or rebase.",
                            "Working files should not be changed by this action.",
                          ].join("\n")
                        : guardedRemoteActionBody(preview),
                      confirmLabel: preview.operation === "upload_snapshots_preview" && uploadArmed
                        ? "Execute git push"
                        : preview.operation === "upload_snapshots_preview"
                          ? "Acknowledge preview only"
                          : guardedRemoteActionLabel(preview),
                      danger: preview.merge_safety.risk_level === "HIGH",
                      requiredText: preview.merge_safety.risk_level === "HIGH" ? "override" : undefined,
                      requiredTextLabel: preview.merge_safety.risk_level === "HIGH" ? "Type override to intentionally continue despite HIGH risk." : undefined,
                      action: async () => {
                        if (preview.operation === "download_updates_preview") {
                          await executePullRebase(preview);
                          return;
                        }

                        if (!uploadArmed) {
                          setArmedRemoteUploadKey(remotePreviewKey(preview));
                          setLastAction("Upload preview acknowledged. No push executed. Execute push is now available for this exact preview.");
                          setMessage("Upload preview acknowledged. No push executed. Execute push is now available for this exact preview.");
                          return;
                        }

                        await executePush(preview);
                      },
                    });
                    setConfirmText("");
                  }}
                >
                  {remotePreview.operation === "upload_snapshots_preview" && isUploadPreviewArmed(remotePreview)
                    ? "Execute push (safe)"
                    : remotePreview.operation === "upload_snapshots_preview"
                      ? "Acknowledge preview only"
                      : remotePreview.merge_safety.risk_level === "HIGH"
                        ? "Override high-risk gate"
                        : remotePreview.merge_safety.risk_level === "MEDIUM"
                          ? "Confirm intention"
                          : "Confirm low-risk intention"}
                </button>
              </div>
            </div>

            <div className="remote-preview-columns">
              <div>
                <h3 title={maybeBeginnerTitle(beginnerMode, "Snapshots", "Commits in the selected direction only. Upload preview shows local-only snapshots. Download preview shows remote-only snapshots.")}>Snapshots ({remotePreview.commit_count})</h3>
                {remotePreview.commits.length ? (
                  remotePreview.commits.map((commit) => <code key={commit}>{commit}</code>)
                ) : (
                  <span className="remote-preview-empty">No snapshots in this direction.</span>
                )}
              </div>

              <div>
                <h3 title={maybeBeginnerTitle(beginnerMode, "Files that differ", "Files touched by snapshots in the selected direction only. This is not a full tree diff.")}>Files that differ ({remotePreview.changed_files.length})</h3>
                {remotePreview.changed_files.length ? (
                  remotePreview.changed_files.map((file) => (
                    <code key={`${file.status}-${file.path}`}>{file.status} {file.path}</code>
                  ))
                ) : (
                  <span className="remote-preview-empty">No file differences in this direction.</span>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>


      <section className="chrono-log-dock">
        <div className="chrono-log-pane">
          <div className="chrono-log-pane__header chrono-log-pane__header--with-filters">
            <div>
              <h2>System Log</h2>
              <span>Deterministic ChronoGit events only.</span>
            </div>

            <div className="system-log-filters">
              {(["all", "action", "warning", "error", "info"] as const).map((filter) => (
                <button
                  key={filter}
                  className={systemLogFilter === filter ? "system-log-filter system-log-filter--active" : "system-log-filter"}
                  onClick={() => setSystemLogFilter(filter)}
                >
                  {filter}
                </button>
              ))}
              <button onClick={() => { setSystemLog([]); localStorage.removeItem("chronogit_system_log"); }}>Clear</button>
            </div>
          </div>

          <div className="chrono-log-pane__body">
            {visibleSystemLog.length ? (
              [...visibleSystemLog].reverse().map((entry) => (
                <article className={`system-log-entry system-log-entry--${entry.level}`} key={entry.id}>
                  <div className="system-log-entry__time">
  <span className="system-log-entry__date">{entry.date}</span>
  <span className="system-log-entry__clock">{entry.time}</span>
</div>
                  <strong>{entry.level}</strong>
                  <p>{entry.message}</p>
                  <div className="system-log-entry__actions">
  <button
    title={beginnerMode ? "Copy this exact system log message to clipboard." : undefined}
    onClick={() => navigator.clipboard.writeText(entry.message)}
  >
    Copy
  </button>
  <button
    title={beginnerMode ? "Ask the local LLM to explain this exact system event. This does not change anything in your repository." : undefined}
    disabled={uiExplainBusy || !llmModel}
    onClick={() => explainUiContext({
      kind: "system_log",
      title: `Explain system log entry`,
      plainText: entry.message,
      rawTruth: JSON.stringify(entry, null, 2),
    })}
  >
    Explain
  </button>
</div>
                </article>
              ))
            ) : (
              <div className="chrono-log-empty">
                {systemLogFilter === "all"
                  ? "No system events in this session yet."
                  : `No ${systemLogFilter} system events in this session.`}
              </div>
            )}
          </div>
        </div>

        <div className="chrono-log-pane">
          <div className="chrono-log-pane__header">
            <div>
              <h2>LLM Responses</h2>
              <span>Advisory explanations only. Git remains authoritative.</span>
            </div>
            <button onClick={() => { setLlmLog([]); localStorage.removeItem("chronogit_llm_log"); }}>Clear</button>
          </div>

          <div className="chrono-log-pane__body chrono-log-pane__body--llm">
            {llmLog.length ? (
              [...llmLog].reverse().map((entry) => (
                <article className="llm-log-entry" key={entry.id}>
                  <div className="llm-log-entry__meta">
                    <span>{entry.timestamp}</span>
                    <strong>{entry.source}</strong>
                    <code>{entry.model}</code>
                  </div>
                  <h3>{entry.title}</h3>
                  <pre>{entry.content}</pre>
                  <button onClick={() => navigator.clipboard.writeText(entry.content)}>Copy message</button>
                </article>
              ))
            ) : (
              <div className="chrono-log-empty">No LLM responses in this session yet.</div>
            )}
          </div>
        </div>
      </section>

      {confirmAction ? (
        <div className="confirm-overlay">
          <div className={`confirm-modal ${confirmAction.danger ? "confirm-modal--danger" : ""}`}>
            <div className="confirm-modal__eyebrow">
              {confirmAction.danger ? "Destructive action" : "Confirmation"}
            </div>
            <h2>{confirmAction.title}</h2>
            <pre>{confirmAction.body}</pre>

            <div className="confirm-modal__actions">
              <button onClick={() => { setConfirmAction(null); setConfirmText(""); }}>Cancel</button>
              {confirmAction.requiredText ? (
                <label className="confirm-required-text">
                  <span>{confirmAction.requiredTextLabel || `Type ${confirmAction.requiredText} to continue.`}</span>
                  <input
                    value={confirmText}
                    onChange={(event) => setConfirmText(event.target.value)}
                    placeholder={confirmAction.requiredText}
                  />
                </label>
              ) : null}

              <button
                className={confirmAction.danger ? "danger-button" : "confirm"}
                disabled={Boolean(confirmAction.requiredText && confirmText.trim() !== confirmAction.requiredText)}
                onClick={async () => {
                  const actionToRun = confirmAction.action;
                  setConfirmAction(null);
                  setConfirmText("");
                  await actionToRun();
                }}
              >
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPreflight ? (
        <div className="preflight-overlay">
          <div className="preflight-modal">
            <h2>Snapshot Preflight</h2>
            <p>You are about to create a Git snapshot. Only prepared files will be included.</p>

            <div className="snapshot-boundary-box">
              <h3>Next snapshot contains:</h3>
              <div className="snapshot-boundary-grid">
                <div><strong>{commitPreflight?.staged_files ?? data.staged.length}</strong><span>files</span></div>
                <div><strong>+{commitPreflight?.insertions ?? 0}</strong><span>insertions</span></div>
                <div><strong>-{commitPreflight?.deletions ?? 0}</strong><span>deletions</span></div>
              </div>
              <p>This creates a LOCAL snapshot only. It does not upload, push, or share anything.</p>
              <p>{snapshotRemoteSentence(remoteStatus)}</p>
              {snapshotImpact ? (
                <div className="snapshot-impact-warning">
                  <strong>{snapshotImpact.label}</strong>
                  <span>{snapshotImpact.text}</span>
                </div>
              ) : (
                <div className="snapshot-impact-ok">
                  <strong>No large-impact warning</strong>
                  <span>This snapshot is below ChronoGit's deterministic size-risk thresholds.</span>
                </div>
              )}
            </div>

            <h3>Included files ({data.staged.length})</h3>
            <div className="preflight-list">
              {data.staged.map((file) => (
                <div key={file.path} className="preflight-item">✔ {file.path}</div>
              ))}
            </div>

            {preflightWarnings.length > 0 ? (
              <>
                <h3>Warnings ({preflightWarnings.length})</h3>
                <div className="preflight-warnings">
                  {preflightWarnings.map((file) => (
                    <div key={file.path} className="warning-item">⚠ {file.path} — {file.risk}</div>
                  ))}
                </div>
              </>
            ) : (
              <p>No dangerous prepared files detected.</p>
            )}

            <h3>Commit message</h3>
            <input
              className="preflight-input"
              value={commitMessage}
              onChange={(event) => setCommitMessage(event.target.value)}
              placeholder="Describe this snapshot..."
            />

            <div className="preflight-actions">
              <button onClick={() => setShowPreflight(false)}>Cancel</button>
              <button
                className="confirm"
                disabled={!commitMessage.trim() || hasCritical}
                onClick={confirmSnapshot}
              >
                Create snapshot (Git commit)
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
