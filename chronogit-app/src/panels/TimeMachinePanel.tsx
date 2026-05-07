import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { renderPrettyDiff } from "../components/DiffViewer";
import { backupPatchFile, openLogBackupFolder } from "../core/persistence";
import type {
  ChangedFile,
  CommitComparison,
  CommitResult,
  ConfirmAction,
  DiffResult,
  ExplainDiffResult,
  FileLineage,
  HistoryCommit,
  LlmLogEntry,
} from "../core/chronogitRuntimeTypes";

function ui(beginnerMode: boolean, beginner: string, pro: string) {
  return beginnerMode ? beginner : pro;
}

export function TimeMachinePanel({
  repoPath,
  refreshTick,
  beginnerMode,
  llmModel,
  appendLlmEntry,
  setConfirmAction,
}: {
  repoPath: string;
  refreshTick: number;
  beginnerMode: boolean;
  llmModel: string;
  appendLlmEntry: (entry: Omit<LlmLogEntry, "id" | "timestamp">) => void;
  setConfirmAction: (action: ConfirmAction | null) => void;
}) {
  const [history, setHistory] = useState<HistoryCommit[]>([]);
  const [selected, setSelected] = useState<HistoryCommit | null>(null);
  const [changedFiles, setChangedFiles] = useState<ChangedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ChangedFile | null>(null);
  const [diff, setDiff] = useState("");
  const [compareBase, setCompareBase] = useState<HistoryCommit | null>(null);
  const [compareTargetFilePath, setCompareTargetFilePath] = useState("");
  const [comparison, setComparison] = useState<CommitComparison | null>(null);
  const [lineage, setLineage] = useState<FileLineage | null>(null);
  const [selectedDiffLines, setSelectedDiffLines] = useState<Set<number>>(new Set());
  const [renameSnapshotOpen, setRenameSnapshotOpen] = useState(false);
  const [renameSnapshotText, setRenameSnapshotText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const timelineCommitRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => { void loadHistory(); }, [refreshTick, repoPath]);

  async function loadHistory() {
    try {
      const result = await invoke<HistoryCommit[]>("git_history", { repoPath });
      setHistory(result);
      setError("");
      if (result.length) await selectSnapshot(result[0]);
    } catch (err) {
      setError(`History failed: ${err}`);
    }
  }

  async function selectSnapshot(commit: HistoryCommit) {
    setSelected(commit);
    setSelectedFile(null);
    setComparison(null);
    setLineage(null);
    setSelectedDiffLines(new Set());
    setDiff("Select a changed file to view its diff, or choose A ↔ B comparison.");
    const files = await invoke<ChangedFile[]>("git_changed_files_from_commit", { repoPath, commitHash: commit.hash });
    setChangedFiles(files);
  }

  async function selectFile(file: ChangedFile) {
    if (!selected) return;

    try {
      setSelectedFile(file);
      setComparison(null);
      setSelectedDiffLines(new Set());
      setDiff("Loading file diff...");

      const [diffResult, lineageResult] = await Promise.all([
        invoke<DiffResult>("git_diff_file_from_commit", { repoPath, commitHash: selected.hash, path: file.path }),
        invoke<FileLineage>("git_file_lineage", { repoPath, path: file.path }),
      ]);

      setDiff(diffResult.diff.trim() || "No diff for this file.");
      setLineage(lineageResult);
      setError("");
    } catch (err) {
      setLineage(null);
      setDiff("");
      setError(`File inspection failed: ${err}`);
    }
  }

  async function compareToSelected() {
    if (!compareBase || !selected || compareBase.hash === selected.hash) return;
    setSelectedFile(null);
    setLineage(null);
    setSelectedDiffLines(new Set());
    setDiff("Loading older snapshot → newer target comparison...");
    const result = await invoke<CommitComparison>("git_compare_commits", { repoPath, leftCommit: selected.hash, rightCommit: compareBase.hash });
    setComparison(result);
    setDiff(result.diff.trim() || "No diff between these two snapshots.");
  }

  function lineageHashes() {
    return new Set(lineage?.commits.map((entry) => entry.hash) || []);
  }

  function lineageEntryForCommit(commitHash: string) {
    return lineage?.commits.find((entry) => entry.hash === commitHash) || null;
  }

  async function jumpToCommitHash(commitHash: string) {
    const commit = history.find((item) => item.hash === commitHash);

    if (!commit) {
      setError(`Jump failed: commit ${commitHash.slice(0, 12)} is not loaded in the Time Machine history list.`);
      return;
    }

    await selectSnapshot(commit);

    window.setTimeout(() => {
      timelineCommitRefs.current[commitHash]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      timelineCommitRefs.current[commitHash]?.focus();
    }, 0);
  }

  function lineageStatusLabel(status: string) {
    if (status === "A") return "introduced selected file";
    if (status === "D") return "removed selected file";
    if (status.startsWith("R")) return "renamed selected file";
    if (status.startsWith("C")) return "copied selected file";
    if (status === "M") return "modified selected file";
    return `touched selected file (${status})`;
  }

  function hunkLineNumbersForLine(lineNumber: number) {
    if (!diff.trim()) return [lineNumber];

    const lines = diff.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    const index = lineNumber - 1;

    if (index < 0 || index >= lines.length) return [lineNumber];

    let hunkStart = index;
    while (hunkStart >= 0) {
      const line = lines[hunkStart] || "";
      if (line.startsWith("@@")) break;
      if (line.startsWith("diff --git")) return [lineNumber];
      hunkStart -= 1;
    }

    if (hunkStart < 0 || !lines[hunkStart]?.startsWith("@@")) return [lineNumber];

    let hunkEnd = hunkStart;
    while (hunkEnd + 1 < lines.length) {
      const next = lines[hunkEnd + 1] || "";
      if (next.startsWith("@@") || next.startsWith("diff --git")) break;
      hunkEnd += 1;
    }

    const numbers: number[] = [];
    for (let current = hunkStart + 1; current <= hunkEnd + 1; current += 1) numbers.push(current);
    return numbers;
  }

  function toggleLine(lineNumber: number) {
    const hunkLines = hunkLineNumbersForLine(lineNumber);

    setSelectedDiffLines((current) => {
      const next = new Set(current);
      const fullySelected = hunkLines.every((line) => next.has(line));

      for (const line of hunkLines) {
        if (fullySelected) next.delete(line);
        else next.add(line);
      }

      return next;
    });
  }

  function selectedDiffText() {
    if (!diff.trim() || selectedDiffLines.size === 0) return "";
    const lines = diff.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    return [...selectedDiffLines].sort((a, b) => a - b).map((line) => `${line}: ${lines[line - 1] ?? ""}`).join("\n");
  }

  async function explainCurrentDiff() {
    if (!llmModel || !diff.trim()) return;
    setBusy(true);
    try {
      const title = comparison ? `A ↔ B comparison: ${comparison.left_label} → ${comparison.right_label}` : selectedFile ? `Diff explanation: ${selectedFile.path}` : "Diff explanation";
      const result = await invoke<ExplainDiffResult>("explain_diff_with_ollama", {
        model: llmModel,
        diff: selectedDiffText() || diff,
        filePath: selectedFile?.path || "comparison.patch",
        commitHash: selected?.short_hash || "unknown",
        commitMessage: title,
      });
      appendLlmEntry({ source: "diff", model: result.model, title, content: result.explanation || "Local LLM returned an empty explanation." });
    } catch (err) {
      setError(`Local LLM explanation failed: ${err}`);
    } finally {
      setBusy(false);
    }
  }

  
  async function explainSelectedHunkLines() {
    const selectedText = selectedDiffText();
    if (!llmModel || !selectedText.trim()) {
      setError("Selected hunk explanation blocked: no selected diff lines.");
      return;
    }

    try {
      setBusy(true);
      const title = comparison
        ? `Selected hunk lines: ${comparison.left_label} → ${comparison.right_label}`
        : selectedFile
          ? `Selected hunk lines: ${selectedFile.path}`
          : "Selected hunk lines";

      const result = await invoke<ExplainDiffResult>("explain_diff_with_ollama", {
        model: llmModel,
        diff: [
          "CHRONOGIT SELECTED DIFF LINES ONLY",
          "Explain only these selected hunk lines. Do not infer hidden context.",
          "",
          selectedText,
        ].join("\n"),
        filePath: selectedFile?.path || "selected-hunk-lines.patch",
        commitHash: selected?.short_hash || "selection",
        commitMessage: title,
      });

      appendLlmEntry({
        source: "diff",
        model: result.model,
        title,
        content: result.explanation || "Local LLM returned an empty selected-hunk explanation.",
      });
      setError("");
    } catch (err) {
      setError(`Selected hunk explanation failed: ${err}`);
    } finally {
      setBusy(false);
    }
  }

  function openRenameLatestSnapshot() {
    if (!selected || !history.length || selected.hash !== history[0].hash) return;
    setRenameSnapshotText(selected.message);
    setRenameSnapshotOpen(true);
  }

  function cancelRenameLatestSnapshot() {
    setRenameSnapshotOpen(false);
    setRenameSnapshotText("");
  }

  async function requestRenameLatestSnapshot() {
    if (!selected || !history.length || selected.hash !== history[0].hash) return;

    const currentMessage = selected.message;
    const nextMessage = renameSnapshotText.trim();

    if (!nextMessage || nextMessage === currentMessage) {
      cancelRenameLatestSnapshot();
      return;
    }

    cancelRenameLatestSnapshot();

    setConfirmAction({
      title: "Rename latest snapshot message",
      body: [
        "This amends the latest Git commit message.",
        "",
        "Git truth:",
        "- This rewrites the latest commit object.",
        "- The commit hash will change.",
        "- This is safest before pushing.",
        "",
        `Current message: ${currentMessage}`,
        `New message: ${nextMessage}`,
      ].join("\n"),
      confirmLabel: ui(beginnerMode, "Rename latest snapshot", "git commit --amend"),
      danger: true,
      action: async () => {
        const result = await invoke<CommitResult>("git_amend_latest_commit_message", {
          repoPath,
          message: nextMessage,
        });

        setError("");
        setDiff(`${result.message}\n\nRefresh history to inspect the new snapshot hash.`);
        await loadHistory();
      },
    });
  }

  async function backupCurrentDiffAsPatch() {
    const rawDiff = diff.trim();

    if (!rawDiff || rawDiff === "Loading file diff..." || rawDiff.startsWith("Select a changed file")) {
      setError("Patch backup blocked: no real Git diff is currently loaded.");
      return;
    }

    try {
      const filenameStem = comparison
        ? `chronogit-comparison-${comparison.left_commit.slice(0, 12)}-${comparison.right_commit.slice(0, 12)}`
        : selectedFile && selected
          ? `chronogit-diff-${selected.short_hash}-${selectedFile.path.split("/").pop() || "file"}`
          : "chronogit-diff";

      const path = await backupPatchFile(filenameStem, diff);
      setError("");
      appendLlmEntry({
        source: "diff",
        model: "system",
        title: "Patch backup created",
        content: `Raw patch backup written to:\n${path}`,
      });
    } catch (err) {
      setError(`Patch backup failed: ${err}`);
    }
  }

  async function openPatchBackupFolder() {
    try {
      const path = await openLogBackupFolder();
      setError(`Opened backup folder: ${path}`);
    } catch (err) {
      setError(`Open backup folder failed: ${err}`);
    }
  }

async function restoreSelectedFile() {
    if (!selected || !selectedFile) return;
    const snapshot = selected;
    const file = selectedFile;
    setConfirmAction({
      title: "Restore file from old snapshot",
      body: `This restores one file from an older snapshot into your working folder.\n\nFile:\n${file.path}\n\nSnapshot:\n${snapshot.short_hash} — ${snapshot.message}`,
      confirmLabel: ui(beginnerMode, "Restore file from snapshot", "git restore --source"),
      danger: true,
      action: async () => {
        const result = await invoke<string>("git_restore_file_from_commit", { repoPath, commitHash: snapshot.hash, path: file.path });
        setDiff(`${result}\n\nThe file has been restored into your working folder. Review it before committing.`);
      },
    });
  }

  return (
    <div className="timeline-panel">
      <div className="timeline-header">
        <div><h2>{ui(beginnerMode, "Time Machine", "git log / git diff")}</h2><p>{ui(beginnerMode, "Pick a snapshot, then inspect files and diffs.", "Select commits and inspect patches.")}</p></div>
        <button onClick={loadHistory}>{ui(beginnerMode, "Refresh history", "git log")}</button>
      </div>
      {error ? <div className="message">{error}</div> : null}
      <div className="focus-surface">
        <strong>{comparison ? "Older snapshot → newer target comparison" : selectedFile ? selectedFile.path : selected ? `${selected.short_hash} — ${selected.message}` : "No focused inspection"}</strong>
        <div className={lineage ? "file-lineage-summary" : "file-lineage-summary file-lineage-summary--empty"}>
          <span><strong>{lineage?.commits.length ?? 0}</strong> {lineage ? `commits touched ${lineage.path}` : "no file lineage selected"}</span>

          <button
            type="button"
            disabled={!lineage?.first_commit}
            onClick={() => {
              const target = lineage?.first_commit;
              if (target) void jumpToCommitHash(target.hash);
            }}
            title="Jump to the first visible commit for this file lineage."
          >
            <strong>First</strong> {lineage?.first_commit ? `${lineage.first_commit.short_hash} · ${lineage.first_commit.message}` : "—"}
          </button>

          <button
            type="button"
            disabled={!lineage?.last_commit}
            onClick={() => {
              const target = lineage?.last_commit;
              if (target) void jumpToCommitHash(target.hash);
            }}
            title="Jump to the latest visible commit for this file lineage."
          >
            <strong>Last</strong> {lineage?.last_commit ? `${lineage.last_commit.short_hash} · ${lineage.last_commit.message}` : "—"}
          </button>

          <button
            type="button"
            disabled={!lineage?.rename_events.length}
            onClick={() => {
              const target = lineage?.rename_events[0];
              if (target) void jumpToCommitHash(target.hash);
            }}
            title="Jump to the first visible rename event for this file lineage."
          >
            <strong>Rename</strong> {lineage ? (lineage.renamed ? `${lineage.rename_events.length} event(s)` : "none detected") : "—"}
          </button>

          <button
            type="button"
            disabled={!lineage?.deleted}
            onClick={() => {
              const target = lineage?.commits.find((entry) => entry.status === "D");
              if (target) void jumpToCommitHash(target.hash);
            }}
            title="Jump to the deletion commit for this file lineage."
          >
            <strong>Deleted</strong> {lineage ? (lineage.deleted ? "yes" : "no") : "—"}
          </button>
        </div>
        <div className="comparison-target-strip">
          <span>
            <strong>Newer target</strong>
            {compareBase
              ? `${compareBase.short_hash} — ${compareBase.message}${compareTargetFilePath ? ` · ${compareTargetFilePath}` : ""}`
              : "not set"}
          </span>
          <span>
            <strong>Older candidate</strong>
            {selected
              ? `${selected.short_hash} — ${selected.message}${selectedFile?.path ? ` · ${selectedFile.path}` : ""}`
              : "not selected"}
          </span>
        </div>
        <div className="focus-surface__actions">
          <button
            disabled={!selected}
            onClick={() => {
              setCompareBase(selected);
              setCompareTargetFilePath(selectedFile?.path || "");
            }}
            title="Use the currently selected snapshot as the newer target you want to compare against."
          >
            Use as newer target
          </button>
          <button
            disabled={!compareBase || !selected || compareBase.hash === selected.hash}
            onClick={compareToSelected}
            title="Compare the currently selected older snapshot against the saved newer target."
          >
            Compare selected older snapshot → target
          </button>
          <button
            disabled={!compareBase && !comparison}
            onClick={() => { setCompareBase(null); setCompareTargetFilePath(""); setComparison(null); }}
            title="Clear the saved comparison target."
          >
            Clear target
          </button>
          <button
            className="danger-button"
            disabled={!selected || !history.length || selected.hash !== history[0].hash}
            onClick={openRenameLatestSnapshot}
            title={ui(beginnerMode, "Only the latest local snapshot can be renamed safely here.", "git commit --amend only applies to HEAD")}
          >
            {ui(beginnerMode, "Rename latest snapshot", "amend HEAD message")}
          </button>
        </div>
      </div>
      {renameSnapshotOpen ? (
        <div className="confirm-overlay">
          <div className="confirm-modal confirm-modal--danger">
            <div className="confirm-modal__eyebrow">History rewrite</div>
            <h2>Rename latest snapshot</h2>
            <pre>{[
              "This prepares a rename of the latest Git commit message.",
              "",
              "ChronoGit will ask for final confirmation before running git commit --amend.",
              "Only the latest snapshot can be renamed here.",
            ].join("\n")}</pre>
            <label className="confirm-required-text">
              <span>New snapshot message</span>
              <input
                autoFocus
                value={renameSnapshotText}
                onChange={(event) => setRenameSnapshotText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void requestRenameLatestSnapshot();
                  if (event.key === "Escape") cancelRenameLatestSnapshot();
                }}
                placeholder="Snapshot message"
              />
            </label>
            <div className="confirm-modal__actions">
              <button onClick={cancelRenameLatestSnapshot}>Cancel</button>
              <button
                className="danger-button"
                disabled={!renameSnapshotText.trim() || renameSnapshotText.trim() === selected?.message}
                onClick={() => void requestRenameLatestSnapshot()}
              >
                Continue to safety confirmation
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="timeline-layout timeline-layout--three">
        <div className="timeline-list">
          {history.map((commit) => {
            const hashes = lineageHashes();
            const lineageEntry = lineageEntryForCommit(commit.hash);
            const touchesLineageFile = hashes.has(commit.hash);

            return (
              <button
                key={commit.hash}
                ref={(element) => {
                  timelineCommitRefs.current[commit.hash] = element;
                }}
                className={[
                  "timeline-commit",
                  selected?.hash === commit.hash ? "timeline-commit--selected" : "",
                  touchesLineageFile ? "timeline-commit--lineage" : "",
                  lineageEntry?.status === "A" ? "timeline-commit--lineage-first" : "",
                  lineageEntry?.status === "D" ? "timeline-commit--lineage-deleted" : "",
                  lineageEntry?.status.startsWith("R") ? "timeline-commit--lineage-rename" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => selectSnapshot(commit)}
                title={lineageEntry ? lineageStatusLabel(lineageEntry.status) : undefined}
              >
                <span className="timeline-hash">{commit.short_hash}</span>
                <span className="timeline-message">{commit.message}</span>
                <span className="timeline-meta">{commit.author} · {commit.timestamp}</span>
                <span className="timeline-lineage-slot">
                  {lineageEntry ? <span className="timeline-lineage-pill">{lineageStatusLabel(lineageEntry.status)}</span> : null}
                </span>
              </button>
            );
          })}
        </div>
        <div className="timeline-files"><div className="diff-title">{selected ? `Changed files in ${selected.short_hash}` : "Changed files"}</div>{changedFiles.length ? changedFiles.map((file) => <button key={`${file.status}-${file.path}`} className={selectedFile?.path === file.path ? "timeline-file timeline-file--selected" : "timeline-file"} onClick={() => selectFile(file)}><span>{file.status}</span><strong>{file.path}</strong></button>) : <div className="timeline-empty">Select a snapshot first.</div>}</div>
        <div className="diff-viewer">
          <div className="diff-title">{comparison ? `${comparison.left_label} → ${comparison.right_label}` : selectedFile ? selectedFile.path : "No file selected"}</div>
          <div className="diff-actions">
            <button disabled={busy || !diff.trim()} onClick={explainCurrentDiff}>
              {llmModel ? `Ask ${llmModel} to explain this diff` : "Ask local LLM to explain this diff"}
            </button>
            <button disabled={selectedDiffLines.size === 0} onClick={() => navigator.clipboard.writeText(selectedDiffText())}>
              Copy selected hunk lines ({selectedDiffLines.size})
            </button>
            <button disabled={busy || selectedDiffLines.size === 0} onClick={explainSelectedHunkLines}>
              Explain selected hunk lines ({selectedDiffLines.size})
            </button>
            <button disabled={!diff.trim() || diff.startsWith("Select a changed file") || diff === "Loading file diff..."} onClick={() => { void backupCurrentDiffAsPatch(); }}>
              Backup current diff as .patch
            </button>
            <button onClick={() => { void openPatchBackupFolder(); }}>
              Open backup folder
            </button>
            <button disabled={!selectedFile} className="danger-button" onClick={restoreSelectedFile}>
              Restore file
            </button>
          </div>
          {renderPrettyDiff(diff, selectedDiffLines, toggleLine)}
        </div>
      </div>
    </div>
  );
}

