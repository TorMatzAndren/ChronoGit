import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

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

type CommitResult = {
  ok: boolean;
  message: string;
  commit_hash: string;
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

type ExplainDiffResult = {
  model: string;
  explanation: string;
  tdp_before_watts: string;
  tdp_active_watts: string;
  tdp_reset_watts: string;
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

const repoPath = "/home/dretski/projects/ChronoGit";

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
};

function Timeline({
  refreshTick,
  setConfirmAction,
  llmEngine,
  llmModel,
}: {
  refreshTick: number;
  setConfirmAction: (action: ConfirmAction | null) => void;
  llmEngine: string;
  llmModel: string;
}) {
  const [history, setHistory] = useState<HistoryCommit[]>([]);
  const [selected, setSelected] = useState<HistoryCommit | null>(null);
  const [changedFiles, setChangedFiles] = useState<ChangedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ChangedFile | null>(null);
  const [diff, setDiff] = useState("");
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
      setDiff("Select a changed file to view its diff.");
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

  async function selectFile(file: ChangedFile) {
    if (!selected) return;

    try {
      setSelectedFile(file);
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
      setExplainOpen(true);
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
            {selectedFile ? `File diff: ${selectedFile.path}` : "No file selected"}
          </div>

          {selectedFile ? (
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

          {(explainText || explainStatus) ? (
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
  const [historyRefreshTick, setHistoryRefreshTick] = useState(0);
  const [llmEngine, setLlmEngine] = useState(() => localStorage.getItem("chronogit_llm_engine") || "ollama");
  const [llmModel, setLlmModel] = useState(() => localStorage.getItem("chronogit_llm_model") || "qwen3:8b");
  const [localModels, setLocalModels] = useState<LocalModel[]>([]);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  async function refresh() {
    const result = await invoke<GitStatusResponse>("git_status", { repoPath });
    setData(result);
    setLastRefresh(new Date().toLocaleTimeString());
  }

  useEffect(() => {
    invoke<string>("detect_git")
      .then(setGitVersion)
      .catch((err) => setGitVersion(`Git error: ${err}`));

    refresh().catch((err) => setMessage(`Status error: ${err}`));
  }, []);

  useEffect(() => {
    localStorage.setItem("chronogit_llm_engine", llmEngine);
    void loadLocalModels(llmEngine);
  }, [llmEngine]);

  useEffect(() => {
    localStorage.setItem("chronogit_llm_model", llmModel);
  }, [llmModel]);

  async function executeAction(action: "git_stage" | "git_unstage" | "git_restore" | "git_remove_untracked" | "git_ignore_path", path: string) {
    try {
      setBusyPath(path);
      setMessage("");
      const result = await invoke<string>(action, { repoPath, path });
      setMessage(result);
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

  async function confirmSnapshot() {
    try {
      setMessage("");
      const result = await invoke<CommitResult>("git_commit", {
        repoPath,
        message: commitMessage,
      });

      setMessage(result.message);
      setCommitMessage("");
      setShowPreflight(false);
      await refresh();
      setHistoryRefreshTick((value) => value + 1);
    } catch (err) {
      setMessage(`SNAPSHOT FAILED: ${err}`);
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

          {!change.staged ? (
            <button disabled={busyPath === change.path} onClick={() => runAction("git_stage", change.path)}>
              Prepare for commit
            </button>
          ) : (
            <button disabled={busyPath === change.path} onClick={() => runAction("git_unstage", change.path)}>
              Remove from next commit
            </button>
          )}

          {!change.staged && change.status !== "untracked" ? (
            <button className="danger-button" disabled={busyPath === change.path} onClick={() => runAction("git_restore", change.path)}>
              Restore / discard
            </button>
          ) : null}

          {!change.staged && change.status === "untracked" ? (
            <>
              <button className="danger-button" disabled={busyPath === change.path} onClick={() => runAction("git_remove_untracked", change.path)}>
                Remove untracked file
              </button>
              <button disabled={busyPath === change.path} onClick={() => runAction("git_ignore_path", change.path)}>
                Add to .gitignore
              </button>
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

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <div className="eyebrow">Local-only Git time machine</div>
          <h1>ChronoGit</h1>
          <p className="hero-text">
            ChronoGit explains Git as a safe flow: working files become prepared changes,
            and prepared changes become a snapshot when committed.
          </p>
        </div>

        <div className="hero-side">
          <div className="status-box">
            <div className="status-box__label">Git</div>
            <div>{gitVersion}</div>
            <div className="status-box__label">Branch</div>
            <div>{data.branch}</div>
            <div className="status-box__label">State</div>
            <div>{lastRefresh || "not refreshed yet"}</div>
            <button className="status-refresh-button" onClick={refreshAppState}>
              Refresh app state
            </button>
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

            <button className="status-refresh-button" onClick={() => loadLocalModels()}>
              Scan installed models
            </button>
          </div>
        </div>
      </header>

      <section className="learning-note">
        <strong>Beginner rule:</strong> Preparing a file does not commit it. It only marks it for the next snapshot.
        Removing a file from the next commit does not delete it. Restore/discard is the dangerous action.
      </section>

      <section className="flow-strip">
        <div className="flow-step">
          <strong>1. Working files</strong>
          <span>Files changed in your folder, but not necessarily part of the next snapshot.</span>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-step">
          <strong>2. Prepared changes</strong>
          <span>These are staged. They will be included if you commit now.</span>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-step flow-step--locked">
          <strong>3. Snapshot</strong>
          <span>Commit must pass Jarri safety preflight first.</span>
        </div>
      </section>

      {message ? <div className="message">{message}</div> : null}

      <section className="preflight-card">
        <div>
          <h2>Commit Preflight</h2>
          <p>Jarri safety mode is active. ChronoGit reviews prepared files before any snapshot is created.</p>
        </div>
        <button disabled={data.staged.length === 0} onClick={() => setShowPreflight(true)}>
          Review snapshot / Git commit ({data.staged.length})
        </button>
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

      <Timeline
        refreshTick={historyRefreshTick}
        setConfirmAction={setConfirmAction}
        llmEngine={llmEngine}
        llmModel={llmModel}
      />

      {confirmAction ? (
        <div className="confirm-overlay">
          <div className={`confirm-modal ${confirmAction.danger ? "confirm-modal--danger" : ""}`}>
            <div className="confirm-modal__eyebrow">
              {confirmAction.danger ? "Destructive action" : "Confirmation"}
            </div>
            <h2>{confirmAction.title}</h2>
            <pre>{confirmAction.body}</pre>

            <div className="confirm-modal__actions">
              <button onClick={() => setConfirmAction(null)}>Cancel</button>
              <button
                className={confirmAction.danger ? "danger-button" : "confirm"}
                onClick={async () => {
                  const actionToRun = confirmAction.action;
                  setConfirmAction(null);
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
