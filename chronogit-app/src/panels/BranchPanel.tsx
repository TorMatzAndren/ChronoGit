import { useState } from "react";
import type { BranchInfo, BranchOverview } from "../core/chronogitRuntimeTypes";

type Props = {
  beginnerMode: boolean;
  branchOverview: BranchOverview | null;
  loadBranchOverview: () => Promise<void>;
  createBranch: (branchName: string) => Promise<void>;
  requestSwitchBranch: (branch: BranchInfo) => void;
  ui: (beginnerMode: boolean, beginner: string, pro: string) => string;
};

function branchState(branch: BranchInfo) {
  if (branch.is_detached) return "detached";
  if (branch.ahead > 0 && branch.behind > 0) return "diverged";
  if (branch.ahead > 0) return "ahead";
  if (branch.behind > 0) return "behind";
  return "in sync";
}

function BranchRow({
  branch,
  requestSwitchBranch,
  beginnerMode,
  ui,
}: {
  branch: BranchInfo;
  requestSwitchBranch: (branch: BranchInfo) => void;
  beginnerMode: boolean;
  ui: (beginnerMode: boolean, beginner: string, pro: string) => string;
}) {
  return (
    <article className={branch.is_current ? "branch-row branch-row--current" : "branch-row"}>
      <div>
        <strong>{branch.name}</strong>
        <span>{branch.full_name}</span>
      </div>
      <code>{branch.short_hash}</code>
      <span>{branch.upstream || "no upstream"}</span>
      <em>{branchState(branch)} · +{branch.ahead} / -{branch.behind}</em>
      <button
        disabled={branch.is_current || branch.is_remote || branch.is_detached}
        onClick={() => requestSwitchBranch(branch)}
        title={
          branch.is_current
            ? "Already on this branch."
            : branch.is_remote
              ? "Remote branches are read-only here. Create or checkout a local branch first."
              : "Switch active timeline to this local branch."
        }
      >
        {ui(beginnerMode, "Switch timeline", "git checkout")}
      </button>
    </article>
  );
}

export function BranchPanel({
  beginnerMode,
  branchOverview,
  loadBranchOverview,
  createBranch,
  requestSwitchBranch,
  ui,
}: Props) {
  const [branchName, setBranchName] = useState("");
  const [creating, setCreating] = useState(false);

  async function requestCreateBranch() {
    const name = branchName.trim();
    if (!name) return;

    try {
      setCreating(true);
      await createBranch(name);
      setBranchName("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="cg-panel-content branch-panel">
      <section className="branch-panel__header">
        <div>
          <h3>{ui(beginnerMode, "Branch timelines", "git branch graph roots")}</h3>
          <p>
            {ui(
              beginnerMode,
              "A branch is a named timeline pointer. It lets history split and later rejoin.",
              "Branches are refs pointing at commits. Current branch is HEAD unless detached.",
            )}
          </p>
        </div>
        <button onClick={() => { void loadBranchOverview(); }}>
          {ui(beginnerMode, "Refresh branches", "git for-each-ref")}
        </button>
      </section>

      <section className="branch-create-box">
        <div>
          <strong>{ui(beginnerMode, "Create new timeline branch", "git branch <name>")}</strong>
          <span>
            {ui(
              beginnerMode,
              "Creates a branch pointer at the current snapshot. It does not switch branches or change files.",
              "Runs git branch <name>. No checkout, no worktree mutation.",
            )}
          </span>
        </div>
        <input
          value={branchName}
          onChange={(event) => setBranchName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void requestCreateBranch();
          }}
          placeholder="branch-name"
        />
        <button disabled={!branchName.trim() || creating} onClick={() => { void requestCreateBranch(); }}>
          {creating ? "Creating..." : ui(beginnerMode, "Create branch", "git branch")}
        </button>
      </section>

      {branchOverview ? (
        <>
          <section className={branchOverview.detached_head ? "branch-callout branch-callout--warning" : "branch-callout"}>
            <strong>{branchOverview.current_branch}</strong>
            <span>
              {branchOverview.detached_head
                ? "Detached HEAD: you are looking at a commit directly, not a named branch."
                : "Current branch / active timeline pointer."}
            </span>
          </section>

          <section className="branch-panel__section">
            <h4>Local branches ({branchOverview.local_branches.length})</h4>
            {branchOverview.local_branches.length
              ? branchOverview.local_branches.map((branch) => (
                  <BranchRow
                    key={branch.full_name}
                    branch={branch}
                    requestSwitchBranch={requestSwitchBranch}
                    beginnerMode={beginnerMode}
                    ui={ui}
                  />
                ))
              : <p>No local branches detected.</p>}
          </section>

          <section className="branch-panel__section">
            <h4>Remote branches ({branchOverview.remote_branches.length})</h4>
            {branchOverview.remote_branches.length
              ? branchOverview.remote_branches.map((branch) => (
                  <BranchRow
                    key={branch.full_name}
                    branch={branch}
                    requestSwitchBranch={requestSwitchBranch}
                    beginnerMode={beginnerMode}
                    ui={ui}
                  />
                ))
              : <p>No remote branches detected.</p>}
          </section>
        </>
      ) : (
        <p>No branch overview loaded.</p>
      )}
    </div>
  );
}
