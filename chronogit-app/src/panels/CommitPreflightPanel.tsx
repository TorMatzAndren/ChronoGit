import type {
  ExplainContext,
  FileChange,
  GitRemoteStatus,
} from "../core/chronogitRuntimeTypes";

type Props = {
  beginnerMode: boolean;
  staged: FileChange[];
  working: FileChange[];
  remote: GitRemoteStatus | null;
  llmModel: string;
  uiExplainBusy: boolean;
  explainUiContext: (context: ExplainContext) => Promise<void>;
  openSnapshotPreflight: () => Promise<void>;
  snapshotRemoteSentence: (remote: GitRemoteStatus | null) => string;
  ui: (beginnerMode: boolean, beginner: string, pro: string) => string;
};

export function CommitPreflightPanel({
  beginnerMode,
  staged,
  working,
  remote,
  llmModel,
  uiExplainBusy,
  explainUiContext,
  openSnapshotPreflight,
  snapshotRemoteSentence,
  ui,
}: Props) {
  const stagedCount = staged.length;
  const workingCount = working.length;
  const totalCount = stagedCount + workingCount;
  const riskyPrepared = staged.filter((file) => ["critical", "danger", "evidence"].includes(file.risk));

  return (
    <div className="cg-panel-content cg-preflight-panel">
      <section className="cg-surface-card cg-surface-card--hero">
        <div>
          <div className="cg-eyebrow">{ui(beginnerMode, "Commit boundary", "index boundary")}</div>
          <h3>{ui(beginnerMode, "Next snapshot contains", "git diff --cached --stat")}</h3>
          <p>
            {ui(
              beginnerMode,
              "Only prepared files are included. Working-folder changes stay outside this snapshot.",
              "Only index/staged paths are committed. Worktree paths are excluded.",
            )}
          </p>
        </div>

        <div className="cg-action-row">
          <button disabled={uiExplainBusy || !llmModel} onClick={() => explainUiContext({
            kind: "preflight",
            title: "Explain Snapshot Preflight",
            plainText: "Snapshot Preflight reviews only files prepared for the next commit.",
            rawTruth: JSON.stringify({ staged, working }, null, 2),
          })}>
            {ui(beginnerMode, "Ask LLM", "explain_context")}
          </button>
          <button className="confirm" disabled={!stagedCount} onClick={openSnapshotPreflight}>
            {ui(beginnerMode, `Review snapshot / Git commit (${stagedCount})`, "git commit")}
          </button>
        </div>
      </section>

      <section className="cg-metric-grid">
        <div className="cg-metric-card">
          <strong>{stagedCount}</strong>
          <span>{ui(beginnerMode, "prepared files", "staged files")}</span>
        </div>
        <div className="cg-metric-card">
          <strong>{workingCount}</strong>
          <span>{ui(beginnerMode, "excluded working changes", "worktree excluded")}</span>
        </div>
        <div className="cg-metric-card">
          <strong>{riskyPrepared.length}</strong>
          <span>{ui(beginnerMode, "prepared warnings", "risk flags")}</span>
        </div>
        <div className="cg-metric-card">
          <strong>{totalCount}</strong>
          <span>{ui(beginnerMode, "visible changes", "status entries")}</span>
        </div>
      </section>

      <section className={riskyPrepared.length ? "cg-status-callout cg-status-callout--warning" : "cg-status-callout cg-status-callout--ok"}>
        <strong>
          {riskyPrepared.length
            ? ui(beginnerMode, "Review prepared warnings before committing", "risk flags in index")
            : ui(beginnerMode, "No dangerous prepared files detected", "index risk clean")}
        </strong>
        <span>
          {riskyPrepared.length
            ? riskyPrepared.map((file) => `${file.risk}: ${file.path}`).join(" · ")
            : snapshotRemoteSentence(remote)}
        </span>
      </section>
    </div>
  );
}
