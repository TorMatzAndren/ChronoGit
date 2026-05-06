type ExplainContext = {
  kind: string;
  title: string;
  plainText: string;
  rawTruth: string;
};

type Props = {
  disabled: boolean;
  explainUiContext: (context: ExplainContext) => void;
};

export function UiExplainShortcutsPanel({ disabled, explainUiContext }: Props) {
  return (
    <section className="ui-explain-shortcuts">
      <button
        disabled={disabled}
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
        disabled={disabled}
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
  );
}
