import { useMemo, useState, type ReactNode } from "react";
import { buildBranchTopology } from "../core/branchTopology";
import { ChronoDropdown } from "../components/ChronoDropdown";
import { inspectBranchRelationship } from "../core/gitActions";
import type { BranchGraph, BranchInfo, BranchOverview, BranchRelationshipPreview } from "../core/chronogitRuntimeTypes";

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


function BranchSubpanel({
  title,
  subtitle,
  defaultOpen,
  important,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen: boolean;
  important?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={important ? "branch-subpanel branch-subpanel--important" : "branch-subpanel"}>
      <button
        type="button"
        className="branch-subpanel__header"
        onClick={() => setOpen((value) => !value)}
      >
        <span>
          <strong>{title}</strong>
          {subtitle ? <em>{subtitle}</em> : null}
        </span>
        <b>{open ? "Collapse" : "Expand"}</b>
      </button>

      {open ? (
        <div className="branch-subpanel__body">
          {children}
        </div>
      ) : null}
    </section>
  );
}


function relationshipVerdictTitle(relationship: BranchRelationshipPreview) {
  if (relationship.classification === "IDENTICAL") return "Timelines are already aligned";
  if (relationship.classification === "FAST_FORWARD_LEFT") return "Safe fast-forward available";
  if (relationship.classification === "FAST_FORWARD_RIGHT") return "Reverse fast-forward available";
  if (relationship.classification === "DIVERGED_CLEAN_PATHS") return "Diverged, but changed paths appear separate";
  if (relationship.classification === "DIVERGED_SHARED_PATHS") return "Diverged with shared touched paths";
  if (relationship.classification === "HIGH_RISK") return "High-risk relationship";
  return relationship.classification.replace(/_/g, " ");
}

function relationshipInterpretation(relationship: BranchRelationshipPreview) {
  if (relationship.shared_touched_files.length > 0) {
    return "Review shared touched paths before any merge/rebase operation. Shared paths do not guarantee a conflict, but they are the primary collision surface.";
  }

  if (relationship.can_fast_forward_left || relationship.can_fast_forward_right) {
    return "This relationship looks like a fast-forward case. One timeline can move to the other without creating a merge commit.";
  }

  if (relationship.left_ahead > 0 && relationship.right_ahead > 0) {
    return "Both timelines contain unique commits. Review intent and changed files before deciding how to rejoin them.";
  }

  return "No obvious collision surface is visible from this preview.";
}

function RelationshipEvidenceGroup({
  title,
  files,
  defaultOpen,
  important,
}: {
  title: string;
  files: string[];
  defaultOpen: boolean;
  important?: boolean;
}) {
  return (
    <BranchSubpanel
      title={`${title} (${files.length})`}
      subtitle={files.length ? "Changed path evidence" : "No paths in this group"}
      defaultOpen={defaultOpen}
      important={important}
    >
      <div className={important ? "relationship-evidence relationship-evidence--important" : "relationship-evidence"}>
        {files.length ? (
          files.map((file) => <code key={`${title}-${file}`}>{file}</code>)
        ) : (
          <span>No files detected.</span>
        )}
      </div>
    </BranchSubpanel>
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
  const [leftBranch, setLeftBranch] = useState("");
  const [rightBranch, setRightBranch] = useState("");
  const [relationshipBusy, setRelationshipBusy] = useState(false);
  const [relationshipError, setRelationshipError] = useState("");
  const [relationship, setRelationship] = useState<BranchRelationshipPreview | null>(null);

  const inspectableBranches = branchOverview
    ? [...branchOverview.local_branches, ...branchOverview.remote_branches]
        .filter((branch) => !branch.is_detached)
    : [];

  const branchDropdownOptions = inspectableBranches.map((branch) => ({
    value: branch.name,
    title: branch.name,
    subtitle: `${branch.is_remote ? "remote" : "local"} · ${branch.full_name}`,
    badge: branchTrackingLabel(branch),
  }));

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

  async function requestRelationshipPreview() {
    const left = leftBranch.trim();
    const right = rightBranch.trim();

    if (!left || !right || left === right) return;

    try {
      setRelationshipBusy(true);
      setRelationshipError("");
      setRelationship(await inspectBranchRelationship(repoPath, left, right));
    } catch (err) {
      setRelationship(null);
      setRelationshipError(String(err));
    } finally {
      setRelationshipBusy(false);
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

      <BranchSubpanel
        title={ui(beginnerMode, "Create new timeline branch", "Create branch")}
        subtitle={ui(beginnerMode, "Create a branch pointer without switching timelines.", "git branch <name> · no checkout")}
        defaultOpen={false}
      >
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
      </BranchSubpanel>


      <BranchSubpanel
        title={ui(beginnerMode, "Timeline Relationship Inspector", "Branch relationship preview")}
        subtitle={ui(beginnerMode, "Understand two timelines before merge/rebase/switch decisions.", "merge-base · rev-list · changed path overlap")}
        defaultOpen={true}
        important
      >
        <section className="branch-relationship-box">
          <div>
            <strong>{ui(beginnerMode, "Inspect timeline relationship", "branch relationship preview")}</strong>
            <span>
                {ui(
                  beginnerMode,
                  "Compare two branch timelines before doing anything dangerous. This does not switch, merge, or modify files.",
                  "Runs deterministic branch/ref inspection only. No checkout, merge, rebase, or working-tree mutation.",
                )}
            </span>
          </div>

          <ChronoDropdown
            value={leftBranch}
            options={branchDropdownOptions}
            placeholder="Left branch"
            searchPlaceholder="Search left branch..."
            emptyText="No branches match this search."
            onChange={setLeftBranch}
            className="branch-ref-dropdown"
          />

          <ChronoDropdown
            value={rightBranch}
            options={branchDropdownOptions}
            placeholder="Right branch"
            searchPlaceholder="Search right branch..."
            emptyText="No branches match this search."
            onChange={setRightBranch}
            className="branch-ref-dropdown"
          />

          <button
            disabled={!leftBranch || !rightBranch || leftBranch === rightBranch || relationshipBusy}
            onClick={() => { void requestRelationshipPreview(); }}
          >
            {relationshipBusy ? "Inspecting..." : ui(beginnerMode, "Inspect relationship", "git merge-base / rev-list")}
          </button>
        </section>

        {relationshipError ? (
          <section className="branch-callout branch-callout--warning">
            <strong>Relationship preview failed</strong>
            <span>{relationshipError}</span>
          </section>
        ) : null}

        {relationship ? (
          <section className={`branch-relationship-result branch-relationship-result--${relationship.risk_level.toLowerCase()}`}>
            <div className="relationship-verdict-card">
              <div>
                <span className="cg-eyebrow">Relationship verdict</span>
                <h3>{relationshipVerdictTitle(relationship)}</h3>
                <p>{relationship.summary}</p>
              </div>
              <em className={`relationship-risk relationship-risk--${relationship.risk_level.toLowerCase()}`}>
                {relationship.risk_level} risk
              </em>
            </div>

            <div className="relationship-flow-strip">
              <div>
                <strong>{relationship.left_branch}</strong>
                <span>+{relationship.left_ahead} unique commits</span>
              </div>
              <b>merge base</b>
              <div>
                <strong>{relationship.right_branch}</strong>
                <span>+{relationship.right_ahead} unique commits</span>
              </div>
            </div>

            <div className="branch-relationship-grid">
              <div><strong>{relationship.left_ahead}</strong><span>left-only commits</span></div>
              <div><strong>{relationship.right_ahead}</strong><span>right-only commits</span></div>
              <div className={relationship.shared_touched_files.length ? "relationship-metric--warning" : ""}>
                <strong>{relationship.shared_touched_files.length}</strong><span>shared touched paths</span>
              </div>
              <div><strong>{relationship.working_changes}</strong><span>working changes</span></div>
            </div>

            <section className={relationship.shared_touched_files.length ? "relationship-interpretation relationship-interpretation--warning" : "relationship-interpretation"}>
              <strong>Recommended interpretation</strong>
              <span>{relationshipInterpretation(relationship)}</span>
              <span>{relationship.warning}</span>
            </section>

            <div className="relationship-evidence-grid">
              <RelationshipEvidenceGroup
                title="Shared touched files"
                files={relationship.shared_touched_files}
                defaultOpen={relationship.shared_touched_files.length > 0}
                important={relationship.shared_touched_files.length > 0}
              />
              <RelationshipEvidenceGroup
                title="Left-only files"
                files={relationship.left_only_files}
                defaultOpen={false}
              />
              <RelationshipEvidenceGroup
                title="Right-only files"
                files={relationship.right_only_files}
                defaultOpen={false}
              />
            </div>

            <BranchSubpanel
              title="Technical evidence"
              subtitle="Commit hashes used for deterministic relationship inspection."
              defaultOpen={false}
            >
              <div className="branch-relationship-meta">
                <span><strong>Merge base</strong><code>{relationship.merge_base.slice(0, 12)}</code></span>
                <span><strong>Left HEAD</strong><code>{relationship.left_head.slice(0, 12)}</code></span>
                <span><strong>Right HEAD</strong><code>{relationship.right_head.slice(0, 12)}</code></span>
              </div>
            </BranchSubpanel>
          </section>
        ) : null}
      </BranchSubpanel>

      {branchOverview ? (
        <>
          <BranchSubpanel
            title={ui(beginnerMode, "Current timeline", "HEAD / current branch")}
            subtitle={branchOverview.detached_head ? "Detached HEAD" : "Active branch pointer"}
            defaultOpen={true}
          >
            <section className={branchOverview.detached_head ? "branch-callout branch-callout--warning" : "branch-callout"}>
              <strong>{branchOverview.current_branch}</strong>
              <span>
                {branchOverview.detached_head
                  ? "Detached HEAD: you are looking at a commit directly, not a named branch."
                  : "Current branch / active timeline pointer."}
              </span>
            </section>
          </BranchSubpanel>

          <BranchSubpanel
            title={`Local branches (${branchOverview.local_branches.length})`}
            subtitle="Writable local timeline pointers."
            defaultOpen={true}
          >
            <section className="branch-panel__section">
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
          </BranchSubpanel>

          <BranchSubpanel
            title={`Remote branches (${branchOverview.remote_branches.length})`}
            subtitle="Read-only remote tracking references."
            defaultOpen={false}
          >
            <section className="branch-panel__section">
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
          </BranchSubpanel>

          <BranchSubpanel
            title={ui(beginnerMode, "Branch topology", "Branch graph")}
            subtitle="Visual timeline shape derived from commit parents and refs."
            defaultOpen={true}
          >
            <BranchGraphView branchGraph={branchGraph} />
          </BranchSubpanel>
        </>
      ) : (
        <p>No branch overview loaded.</p>
      )}
    </div>
  );
}
