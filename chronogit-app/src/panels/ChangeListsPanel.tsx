import { useState } from "react";
import type { ExplainContext, FileChange } from "../core/chronogitRuntimeTypes";

type FileAction =
  | "git_stage"
  | "git_unstage"
  | "git_unstage_prefix"
  | "git_restore"
  | "git_remove_untracked"
  | "git_ignore_path";

type Props = {
  beginnerMode: boolean;
  staged: FileChange[];
  working: FileChange[];
  busyPath: string;
  uiExplainBusy: boolean;
  llmModel: string;
  runFileAction: (action: FileAction, path: string) => Promise<void>;
  explainUiContext: (context: ExplainContext) => Promise<void>;
  ui: (beginnerMode: boolean, beginner: string, pro: string) => string;
};

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
  if (change.status === "conflict") return "Conflict";
  return "Working folder change";
}

function riskTitle(risk: string) {
  if (risk === "critical") return "Critical / conflicts";
  if (risk === "danger") return "Danger / destructive";
  if (risk === "evidence") return "Evidence / backup files";
  if (risk === "review") return "Needs review";
  return "Safe changes";
}

function group(changes: FileChange[]) {
  const grouped: Record<string, FileChange[]> = { critical: [], danger: [], evidence: [], review: [], normal: [] };
  for (const change of changes) {
    if (grouped[change.risk]) grouped[change.risk].push(change);
    else grouped.review.push(change);
  }
  return grouped;
}


function topFolder(path: string) {
  const cleaned = path.replace(/^"+|"+$/g, "");
  const parts = cleaned.split("/").filter(Boolean);

  if (parts.length <= 1) {
    return "";
  }

  return `${parts[0]}/`;
}

function stagedFolderGroups(staged: FileChange[]) {
  const grouped = new Map<string, FileChange[]>();

  for (const change of staged) {
    const folder = topFolder(change.path);

    if (!folder) continue;

    const current = grouped.get(folder) || [];
    current.push(change);
    grouped.set(folder, current);
  }

  return Array.from(grouped.entries())
    .filter(([, rows]) => rows.length >= 5)
    .sort((a, b) => b[1].length - a[1].length);
}


function ChangeCard({
  beginnerMode,
  change,
  busyPath,
  expanded,
  onToggleExpanded,
  uiExplainBusy,
  llmModel,
  runFileAction,
  explainUiContext,
  ui,
}: {
  beginnerMode: boolean;
  change: FileChange;
  busyPath: string;
  expanded: boolean;
  onToggleExpanded: () => void;
  uiExplainBusy: boolean;
  llmModel: string;
  runFileAction: (action: FileAction, path: string) => Promise<void>;
  explainUiContext: (context: ExplainContext) => Promise<void>;
  ui: (beginnerMode: boolean, beginner: string, pro: string) => string;
}) {
  return (
    <article className={`change-card change-card--${change.risk}`} key={`${change.path}-${change.status}-${change.staged}`}>
      <div className="change-card__top">
        <div>
          <div className="change-card__path">{change.path}</div>
          <div className="change-card__plain">{plainStatus(change)}</div>
        </div>
        <div className={`risk-pill risk-pill--${change.risk}`}>{change.risk}</div>
      </div>

      <div className="change-card__explain">{change.explanation}</div>

      {expanded ? (
        <div className="explain-box">
          <strong>{ui(beginnerMode, "What this means", "git status interpretation")}</strong>
          <p>{plainStatus(change)}. Risk: {change.risk}. Git index/worktree: {change.index_status || "·"}{change.worktree_status || "·"}.</p>
        </div>
      ) : null}

      <div className="change-card__actions">
        <button onClick={onToggleExpanded}>
          {ui(beginnerMode, expanded ? "Hide explanation" : "Explain", expanded ? "hide" : "explain")}
        </button>

        <button disabled={uiExplainBusy || !llmModel} onClick={() => explainUiContext({
          kind: "file_status",
          title: `Explain file state: ${change.path}`,
          plainText: `${plainStatus(change)}. Risk: ${change.risk}. ${change.explanation}`,
          rawTruth: JSON.stringify(change, null, 2),
        })}>
          {ui(beginnerMode, "Ask LLM", "explain_context")}
        </button>

        {!change.staged ? (
          <button disabled={busyPath === change.path} onClick={() => runFileAction("git_stage", change.path)}>
            {ui(beginnerMode, "Prepare for commit", "git add")}
          </button>
        ) : (
          <button disabled={busyPath === change.path} onClick={() => runFileAction("git_unstage", change.path)}>
            {ui(beginnerMode, "Remove from next commit", "git reset")}
          </button>
        )}

        {!change.staged && change.status !== "untracked" ? (
          <button className="danger-button" disabled={busyPath === change.path} onClick={() => runFileAction("git_restore", change.path)}>
            {ui(beginnerMode, "Restore / discard", "git restore")}
          </button>
        ) : null}

        {!change.staged && change.status === "untracked" ? (
          <>
            <button className="danger-button" disabled={busyPath === change.path} onClick={() => runFileAction("git_remove_untracked", change.path)}>
              {ui(beginnerMode, "Remove untracked file", "rm")}
            </button>
            <button disabled={busyPath === change.path} onClick={() => runFileAction("git_ignore_path", change.path)}>
              {ui(beginnerMode, "Add to .gitignore", "append .gitignore")}
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}

export function ChangeListsPanel({
  beginnerMode,
  staged,
  working,
  busyPath,
  uiExplainBusy,
  llmModel,
  runFileAction,
  explainUiContext,
  ui,
}: Props) {
  const [expandedPath, setExpandedPath] = useState("");
  const folderGroups = stagedFolderGroups(staged);

  function renderGroupedChanges(items: FileChange[]) {
    const grouped = group(items);

    return ["critical", "danger", "evidence", "review", "normal"].map((risk) => {
      const rows = grouped[risk];
      if (!rows.length) return null;

      return (
        <section className="risk-section" key={risk}>
          <h3>{riskTitle(risk)} <span>{rows.length}</span></h3>
          {rows.map((change) => {
            const key = `${change.path}:${change.staged}`;
            return (
              <ChangeCard
                key={`${change.path}-${change.status}-${change.staged}`}
                beginnerMode={beginnerMode}
                change={change}
                busyPath={busyPath}
                expanded={expandedPath === key}
                onToggleExpanded={() => setExpandedPath(expandedPath === key ? "" : key)}
                uiExplainBusy={uiExplainBusy}
                llmModel={llmModel}
                runFileAction={runFileAction}
                explainUiContext={explainUiContext}
                ui={ui}
              />
            );
          })}
        </section>
      );
    });
  }

  return (
    <div className="cg-panel-content cg-change-lists">
      <div>
        <h3>{ui(beginnerMode, "Prepared for next commit", "index / staged")}</h3>

        {folderGroups.length ? (
          <section className="bulk-change-actions">
            <strong>Large prepared folders</strong>
            <span>
              These folders contain many prepared files. You can remove a whole folder from the next commit without deleting the files.
            </span>

            {folderGroups.map(([folder, rows]) => (
              <article key={folder}>
                <div>
                  <b>{folder}</b>
                  <span>{rows.length} prepared files</span>
                </div>
                <button
                  type="button"
                  onClick={() => runFileAction("git_unstage_prefix", folder)}
                >
                  Remove folder from next commit
                </button>
              </article>
            ))}
          </section>
        ) : null}

        {staged.length ? renderGroupedChanges(staged) : <p>Nothing prepared.</p>}
      </div>
      <div>
        <h3>{ui(beginnerMode, "Working folder changes", "worktree")}</h3>
        {working.length ? renderGroupedChanges(working) : <p>Working folder clean.</p>}
      </div>
    </div>
  );
}
