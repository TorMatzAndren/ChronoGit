import { useEffect, useState } from "react";
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
  const [comparison, setComparison] = useState<CommitComparison | null>(null);
  const [selectedDiffLines, setSelectedDiffLines] = useState<Set<number>>(new Set());
  const [renameSnapshotOpen, setRenameSnapshotOpen] = useState(false);
  const [renameSnapshotText, setRenameSnapshotText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
    setSelectedDiffLines(new Set());
    setDiff("Select a changed file to view its diff, or choose A ↔ B comparison.");
    const files = await invoke<ChangedFile[]>("git_changed_files_from_commit", { repoPath, commitHash: commit.hash });
    setChangedFiles(files);
  }

  async function selectFile(file: ChangedFile) {
    if (!selected) return;
    setSelectedFile(file);
    setComparison(null);
    setSelectedDiffLines(new Set());
    setDiff("Loading file diff...");
    const result = await invoke<DiffResult>("git_diff_file_from_commit", { repoPath, commitHash: selected.hash, path: file.path });
    setDiff(result.diff.trim() || "No diff for this file.");
  }

  async function compareToSelected() {
    if (!compareBase || !selected || compareBase.hash === selected.hash) return;
    setSelectedFile(null);
    setSelectedDiffLines(new Set());
    setDiff("Loading A ↔ B comparison...");
    const result = await invoke<CommitComparison>("git_compare_commits", { repoPath, leftCommit: compareBase.hash, rightCommit: selected.hash });
    setComparison(result);
    setDiff(result.diff.trim() || "No diff between these two snapshots.");
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
        <strong>{comparison ? "A ↔ B comparison" : selectedFile ? selectedFile.path : selected ? `${selected.short_hash} — ${selected.message}` : "No focused inspection"}</strong>
        <div className="focus-surface__actions">
          <button disabled={!selected} onClick={() => setCompareBase(selected)}>Set A</button>
          <button disabled={!compareBase || !selected || compareBase.hash === selected.hash} onClick={compareToSelected}>Compare A → B</button>
          <button disabled={!compareBase && !comparison} onClick={() => { setCompareBase(null); setComparison(null); }}>Clear A/B</button>
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
        <div className="timeline-list">{history.map((commit) => <button key={commit.hash} className={selected?.hash === commit.hash ? "timeline-commit timeline-commit--selected" : "timeline-commit"} onClick={() => selectSnapshot(commit)}><span className="timeline-hash">{commit.short_hash}</span><span className="timeline-message">{commit.message}</span><span className="timeline-meta">{commit.author} · {commit.timestamp}</span></button>)}</div>
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

