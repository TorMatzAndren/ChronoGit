import type { ReactNode } from "react";

type FileChange = {
  path: string;
  index_status: string;
  worktree_status: string;
  status: string;
  risk: string;
  staged: boolean;
  explanation: string;
};

type ExplainContext = {
  kind: string;
  title: string;
  plainText: string;
  rawTruth: string;
};

type Props = {
  staged: FileChange[];
  working: FileChange[];
  disabled: boolean;
  explainUiContext: (context: ExplainContext) => void;
  openSnapshotPreflight: () => void;
  beginnerTitle: (text: string) => string | undefined;
  actionHelp: ReactNode;
};

export function CommitPreflightPanel({
  staged,
  working,
  disabled,
  explainUiContext,
  openSnapshotPreflight,
  beginnerTitle,
  actionHelp,
}: Props) {
  return (
    <section className="preflight-card">
      <div>
        <h2>Commit Preflight</h2>
        <p>Jarri safety mode is active. ChronoGit reviews prepared files before any snapshot is created.</p>
      </div>
      <div className="preflight-card__actions">
        <button
          disabled={disabled}
          onClick={() => explainUiContext({
            kind: "preflight",
            title: "Explain Snapshot Preflight",
            plainText: "Snapshot Preflight reviews only files prepared for the next commit. Files still in the working folder are not included in the commit.",
            rawTruth: JSON.stringify({
              staged_count: staged.length,
              working_count: working.length,
              staged,
              rule: "Only staged (prepared) files will be included in the commit. Working-folder files are excluded."
            }, null, 2),
          })}
        >
          Ask LLM
        </button>
        <button
          title={beginnerTitle("Review snapshot / Git commit\n\nOpens preflight before creating a commit. Only prepared files will be included.")}
          disabled={staged.length === 0}
          onClick={openSnapshotPreflight}
        >
          Review snapshot / Git commit ({staged.length})
        </button>
        {actionHelp}
      </div>
    </section>
  );
}
