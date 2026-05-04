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

export default function App() {
  const [gitVersion, setGitVersion] = useState("Checking Git...");
  const [data, setData] = useState<GitStatusResponse | null>(null);
  const [message, setMessage] = useState("");
  const [busyPath, setBusyPath] = useState("");
  const [expandedPath, setExpandedPath] = useState("");
  const [showPreflight, setShowPreflight] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");

  async function refresh() {
    const result = await invoke<GitStatusResponse>("git_status", { repoPath });
    setData(result);
  }

  useEffect(() => {
    invoke<string>("detect_git")
      .then(setGitVersion)
      .catch((err) => setGitVersion(`Git error: ${err}`));

    refresh().catch((err) => setMessage(`Status error: ${err}`));
  }, []);

  async function runAction(action: "git_stage" | "git_unstage" | "git_restore", path: string) {
    if (action === "git_restore") {
      const ok = confirm(
        `Restore means: discard local changes.\n\nPath:\n${path}\n\nChronoGit will ask Git to restore this file from the last committed snapshot. Continue?`
      );
      if (!ok) return;
    }

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
    } catch (err) {
      setMessage(`Commit failed: ${err}`);
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

        <div className="status-box">
          <div className="status-box__label">Git</div>
          <div>{gitVersion}</div>
          <div className="status-box__label">Branch</div>
          <div>{data.branch}</div>
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
          Review snapshot ({data.staged.length})
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
                Confirm snapshot
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
