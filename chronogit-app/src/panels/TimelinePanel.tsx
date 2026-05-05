import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

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

type ExplainDiffResult = {
  model: string;
  explanation: string;
  tdp_before_watts: string;
  tdp_active_watts: string;
  tdp_reset_watts: string;
};

type ConfirmAction = {
  title: string;
  body: string;
  confirmLabel: string;
  danger: boolean;
  action: () => Promise<void>;
  requiredText?: string;
  requiredTextLabel?: string;
};

type LlmLogEntry = {
  id: string;
  timestamp: string;
  source: "diff" | "ui" | "remote" | "preflight";
  model: string;
  title: string;
  content: string;
};

function diffLineClass(line: string): string {
  if (line.startsWith("+++") || line.startsWith("---")) return "diff-line diff-line--file";
  if (line.startsWith("@@")) return "diff-line diff-line--hunk";
  if (line.startsWith("+")) return "diff-line diff-line--add";
  if (line.startsWith("-")) return "diff-line diff-line--remove";
  if (line.startsWith("diff --git")) return "diff-line diff-line--header";
  return "diff-line";
}

function renderPrettyDiff(
  diff: string,
  selectedLines: Set<number> = new Set(),
  onToggleLine?: (lineNumber: number) => void,
) {
  if (!diff || !diff.trim()) {
    return <div className="diff-placeholder">No diff for this file.</div>;
  }

  const lines = diff.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  return (
    <div className="diff-pretty">
      {lines.map((line, index) => {
        const lineNumber = index + 1;
        const selected = selectedLines.has(lineNumber);

        return (
          <div
            className={`${diffLineClass(line)} ${selected ? "diff-line--selected" : ""} ${onToggleLine ? "diff-line--selectable" : ""}`}
            key={`${index}-${line.slice(0, 24)}`}
            onClick={onToggleLine ? () => onToggleLine(lineNumber) : undefined}
            title={onToggleLine ? "Click to select this complete diff hunk for focused copy/explanation." : undefined}
          >
            <span className="diff-line__num">{lineNumber}</span>
            <code className="diff-line__text">{line || " "}</code>
          </div>
        );
      })}
    </div>
  );
}

export function TimelinePanel({
  repoPath,
  refreshTick,
  setConfirmAction,
  llmEngine,
  llmModel,
  appendLlmEntry,
  beginnerMode,
}: {
  repoPath: string;
  refreshTick: number;
  setConfirmAction: (action: ConfirmAction | null) => void;
  llmEngine: string;
  llmModel: string;
  appendLlmEntry: (entry: Omit<LlmLogEntry, "id" | "timestamp">) => void;
  beginnerMode: boolean;
}) {
  const [history, setHistory] = useState<HistoryCommit[]>([]);
  const [selected, setSelected] = useState<HistoryCommit | null>(null);
  const [changedFiles, setChangedFiles] = useState<ChangedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ChangedFile | null>(null);
  const [diff, setDiff] = useState("");
  const [compareBase, setCompareBase] = useState<HistoryCommit | null>(null);
  const [comparison, setComparison] = useState<CommitComparison | null>(null);
  const [focusProjection, setFocusProjection] = useState<FocusProjection>({ kind: "none" });
  const [selectedDiffLines, setSelectedDiffLines] = useState<Set<number>>(new Set());
  const [explainText, setExplainText] = useState("");
  const [explainStatus, setExplainStatus] = useState("");
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainBusy, setExplainBusy] = useState(false);
  const [error, setError] = useState("");

  function focusTerm(beginnerText: string, advancedText: string) {
    return beginnerMode ? beginnerText : advancedText;
  }

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
      setSelectedDiffLines(new Set());
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
      setSelectedDiffLines(new Set());
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

    if (hunkStart < 0 || !lines[hunkStart]?.startsWith("@@")) {
      return [lineNumber];
    }

    let hunkEnd = hunkStart;
    while (hunkEnd + 1 < lines.length) {
      const next = lines[hunkEnd + 1] || "";
      if (next.startsWith("@@") || next.startsWith("diff --git")) break;
      hunkEnd += 1;
    }

    const numbers: number[] = [];
    for (let current = hunkStart + 1; current <= hunkEnd + 1; current += 1) {
      numbers.push(current);
    }

    return numbers;
  }

  function toggleDiffLine(lineNumber: number) {
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
    return [...selectedDiffLines]
      .sort((left, right) => left - right)
      .map((lineNumber) => `${lineNumber}: ${lines[lineNumber - 1] ?? ""}`)
      .join("\n");
  }

  async function copySelectedDiffLines() {



    const selectedText = selectedDiffText();
    if (!selectedText.trim()) return;

    await navigator.clipboard.writeText(selectedText);
    setExplainStatus(`Copied ${selectedDiffLines.size} selected diff line(s).`);
  }

  async function explainSelectedDiffLines() {
    const selectedText = selectedDiffText();
    if (!selectedText.trim()) {
      setError("Selected diff explanation blocked: no diff lines selected.");
      return;
    }

    try {
      setExplainBusy(true);
      setExplainStatus(`Local ${llmModel} is explaining ${selectedDiffLines.size} selected diff line(s)...`);

      appendLlmEntry({
        source: "diff",
        model: llmModel,
        title: "Selected diff explanation started",
        content: `Explaining ${selectedDiffLines.size} selected diff line(s). Waiting for local model response...`,
      });

      const focusTitle = comparison
        ? `Selected lines from A ↔ B: ${comparison.left_label} → ${comparison.right_label}`
        : selectedFile
          ? `Selected lines from ${selectedFile.path}`
          : "Selected diff lines";

      const result = await invoke<ExplainDiffResult>("explain_diff_with_ollama", {
        model: llmModel,
        diff: [
          "CHRONOGIT SELECTED DIFF LINES ONLY",
          "This is a selected subset of a larger diff.",
          "Explain only the selected lines. Do not infer hidden context.",
          "",
          selectedText,
        ].join("\n"),
        filePath: selectedFile?.path || "selected-diff-lines.patch",
        commitHash: selected?.short_hash ?? comparison?.right_label ?? "selection",
        commitMessage: focusTitle,
      });

      setExplainStatus(`Local ${result.model} finished explaining selected lines.`);
      appendLlmEntry({
        source: "diff",
        model: result.model,
        title: focusTitle,
        content: result.explanation || "LLM returned empty selected-line explanation.",
      });

      setError("");
    } catch (err) {
      appendLlmEntry({
        source: "diff",
        model: llmModel,
        title: "Selected diff explanation failed",
        content: String(err),
      });
      setError(`Selected diff explanation failed: ${err}`);
    } finally {
      setExplainBusy(false);
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
      setSelectedDiffLines(new Set());
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

      <div className={`focus-surface focus-surface--${focusProjection.kind}`}>
        <div className="focus-surface__main">
          <div className="focus-surface__eyebrow">Focus Mode</div>

          <h3>
            {focusProjection.kind === "comparison"
              ? focusTerm("Snapshot comparison", "A ↔ B commit comparison")
              : focusProjection.kind === "file"
                ? focusTerm("File inspection", "File diff focus")
                : focusProjection.kind === "commit"
                  ? focusTerm("Snapshot inspection", "Commit focus")
                  : "No focused inspection"}
          </h3>

          <p>
            {focusProjection.kind === "comparison"
              ? `Comparing ${focusProjection.comparison.left_label} → ${focusProjection.comparison.right_label}`
              : focusProjection.kind === "file"
                ? `Inspecting ${focusProjection.file.path} in ${focusProjection.commit.short_hash}`
                : focusProjection.kind === "commit"
                  ? `Inspecting ${focusProjection.commit.short_hash} — ${focusProjection.commit.message}`
                  : "Select a snapshot, file, or comparison to project deeper Git truth here."}
          </p>
        </div>

        <div className="focus-surface__facts">
          {focusProjection.kind === "comparison" ? (
            <>
              <span><strong>{focusProjection.comparison.changed_files.length}</strong>{focusTerm("changed files", "files")}</span>
              <span><strong>+{focusProjection.comparison.insertions}</strong>{focusTerm("added lines", "insertions")}</span>
              <span><strong>-{focusProjection.comparison.deletions}</strong>{focusTerm("removed lines", "deletions")}</span>
            </>
          ) : focusProjection.kind === "file" ? (
            <>
              <span><strong>{focusProjection.file.status}</strong>{focusTerm("change type", "status")}</span>
              <span><strong>{focusProjection.commit.short_hash}</strong>{focusTerm("snapshot", "commit")}</span>
            </>
          ) : focusProjection.kind === "commit" ? (
            <>
              <span><strong>{changedFiles.length}</strong>{focusTerm("changed files", "files")}</span>
              <span><strong>{focusProjection.commit.short_hash}</strong>{focusTerm("snapshot", "commit")}</span>
            </>
          ) : (
            <span><strong>—</strong>waiting for selection</span>
          )}
        </div>

        <div className="focus-surface__actions">
          <button disabled={!selected} onClick={markCompareBase}>
            {focusTerm("Use this as snapshot A", "Set A")}
          </button>
          <button disabled={!compareBase || !selected || compareBase.hash === selected?.hash} onClick={compareToSelected}>
            {focusTerm("Compare selected as snapshot B", "Compare A → B")}
          </button>
          <button disabled={!compareBase && !comparison} onClick={clearComparison}>
            {focusTerm("Clear comparison", "Clear A/B")}
          </button>
        </div>

        <div className="focus-surface__hint">
          {compareBase
            ? `A is ${compareBase.short_hash} — ${compareBase.message}`
            : focusTerm(
                "Beginner path: choose a snapshot as A, then choose another as B.",
                "Advanced path: select A, select B, inspect git diff A B."
              )}
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
                  disabled={selectedDiffLines.size === 0}
                  onClick={explainSelectedDiffLines}
                >
                  Explain selected hunk lines ({selectedDiffLines.size})
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
                <button
                  disabled={selectedDiffLines.size === 0}
                  onClick={copySelectedDiffLines}
                >
                  Copy selected hunk lines ({selectedDiffLines.size})
                </button>
                <button
                  disabled={selectedDiffLines.size === 0 || explainBusy || !llmModel}
                  onClick={explainSelectedDiffLines}
                >
                  {explainBusy ? `${llmModel} is thinking...` : `Explain selected hunk lines (${selectedDiffLines.size})`}
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

          {selected ? renderPrettyDiff(diff, selectedDiffLines, toggleDiffLine) : <div className="diff-placeholder">Select a snapshot to inspect changed files.</div>}
        </div>
      </div>
    </section>
  );
}
