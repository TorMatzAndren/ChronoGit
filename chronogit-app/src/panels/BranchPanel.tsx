import { useMemo, useState } from "react";
import { buildBranchTopology } from "../core/branchTopology";
import type { BranchGraph, BranchInfo, BranchOverview } from "../core/chronogitRuntimeTypes";

type Props = {
  beginnerMode: boolean;
  repoPath: string;
  branchOverview: BranchOverview | null;
  branchGraph: BranchGraph | null;
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

function branchTrackingLabel(branch: BranchInfo) {
  if (branch.is_detached) return "detached HEAD";
  if (branch.is_remote) return "remote tracking ref";
  if (!branch.upstream) return "local only";
  return `${branchState(branch)} · +${branch.ahead} / -${branch.behind}`;
}

function refKindLabel(kind: string) {
  if (kind === "local") return "local";
  if (kind === "remote") return "remote";
  if (kind === "tag") return "tag";
  return "ref";
}

function shortDate(value: string) {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return match ? `${match[1]} ${match[2]}` : value;
}

function laneRelation(currentLane: number, parentLane: number) {
  if (parentLane === currentLane) return "straight";
  if (parentLane < currentLane) return "left";
  return "right";
}

function BranchGraphView({ branchGraph }: { branchGraph: BranchGraph | null }) {
  const topology = useMemo(
    () => branchGraph ? buildBranchTopology(branchGraph, 8, 32) : null,
    [branchGraph],
  );

  if (!topology) {
    return (
      <section className="branch-graph">
        <div className="branch-graph__header">
          <h4>Branch topology</h4>
          <span>No graph data loaded.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="branch-graph">
      <div className="branch-graph__header">
        <div>
          <h4>Branch topology</h4>
          <span>Deterministic lane view derived from commit parents and branch refs.</span>
        </div>
        <strong>{topology.commits.length} commits · {topology.lanes.length} lanes</strong>
      </div>

      <div className="branch-topology-explainer">
        <strong>What this graph means</strong>
        {topology.summary.explanationLines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>

      {topology.lanes.length ? (
        <div className="branch-topology" style={{ ["--branch-lanes" as string]: topology.lanes.length }}>
          <div className="branch-topology__lane-heads">
            {topology.lanes.map((lane) => (
              <span className={`branch-lane-label branch-lane-label--${lane.kind}`} key={`${lane.kind}-${lane.label}`}>
                <strong>{refKindLabel(lane.kind)}</strong>
                <em>{lane.label}</em>
              </span>
            ))}
          </div>

          {topology.commits.map((commit, index) => (
            <article
              className={commit.isHead ? "branch-topology-row branch-topology-row--head" : "branch-topology-row"}
              key={commit.hash}
            >
              <div className="branch-topology-row__lanes">
                {topology.lanes.map((lane) => {
                  const active = commit.activeLanes.includes(lane.lane);
                  const node = commit.nodeLane === lane.lane;
                  const parent = commit.parentLanes.includes(lane.lane);
                  const parentRelations = commit.parentLanes.map((parentLane) =>
                    laneRelation(commit.nodeLane, parentLane)
                  );
                  const mergeLeft = node && parentRelations.includes("left");
                  const mergeRight = node && parentRelations.includes("right");

                  return (
                    <span
                      className={[
                        "branch-topology-cell",
                        active ? "branch-topology-cell--active" : "",
                        parent ? "branch-topology-cell--parent" : "",
                        node ? "branch-topology-cell--node" : "",
                        mergeLeft ? "branch-topology-cell--merge-left" : "",
                        mergeRight ? "branch-topology-cell--merge-right" : "",
                        commit.isHead && node ? "branch-topology-cell--head" : "",
                      ].filter(Boolean).join(" ")}
                      key={`${commit.hash}-${lane.lane}`}
                    >
                      {node ? (commit.isMerge ? "◆" : "●") : active || parent ? "│" : ""}
                    </span>
                  );
                })}
              </div>

              <div className="branch-topology-row__body">
                <div className="branch-topology-row__top">
                  <code>{commit.shortHash}</code>
                  {commit.isHead ? <strong>HEAD</strong> : null}
                  {commit.refs.map((ref) => (
                    <span className={`branch-ref-pill branch-ref-pill--${ref.kind}`} key={ref.full_name}>
                      {refKindLabel(ref.kind)} · {ref.name}
                    </span>
                  ))}
                  {commit.isMerge ? <span className="branch-ref-pill branch-ref-pill--merge">merge</span> : null}
                  {index === 0 ? <span className="branch-ref-pill branch-ref-pill--decorated">newest</span> : null}
                </div>

                <strong>{commit.subject}</strong>
                <span>{commit.author} · {shortDate(commit.date)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p>No branch refs available for topology lanes.</p>
      )}
    </section>
  );
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
      <em>{branchTrackingLabel(branch)}</em>
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
  repoPath,
  branchOverview,
  branchGraph,
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

      {repoPath.includes("/ChronoGit") ? (
        <section className="branch-callout branch-callout--warning">
          <strong>Self-repository branch switching is guarded</strong>
          <span>
            ChronoGit is currently inspecting its own source repository. Switching this repository while ChronoGit is running can replace the app source/binary underneath the program. Use a separate test repository for branch switching, or close ChronoGit and switch manually.
          </span>
        </section>
      ) : null}

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

          <BranchGraphView branchGraph={branchGraph} />
        </>
      ) : (
        <p>No branch overview loaded.</p>
      )}
    </div>
  );
}
