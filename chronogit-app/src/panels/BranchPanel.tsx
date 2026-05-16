import { useMemo, useState, type ReactNode } from "react";
import { buildBranchTopology } from "../core/branchTopology";
import { ChronoDropdown } from "../components/ChronoDropdown";
import { HelpHint } from "../components/HelpHint";
import { executeBranchMerge, inspectBranchRelationship, previewBranchMerge } from "../core/gitActions";
import type { BranchGraph, BranchInfo, BranchMergePreview, BranchOverview, BranchRelationshipPreview } from "../core/chronogitRuntimeTypes";
import type { PanelType } from "../core/chronogitWorkspaceTypes";

type Props = {
  beginnerMode: boolean;
  repoPath: string;
  branchOverview: BranchOverview | null;
  branchGraph: BranchGraph | null;
  loadBranchOverview: () => Promise<void>;
  createBranch: (branchName: string) => Promise<void>;
  requestSwitchBranch: (branch: BranchInfo) => void;
  openOrAddPanel: (type: PanelType) => void;
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


function relationshipMetricExplanation(
  metric: "left" | "right" | "shared" | "working"
) {
  if (metric == "left") {
    return "Commits that only exist on the left branch timeline.";
  }

  if (metric == "right") {
    return "Commits that only exist on the right branch timeline.";
  }

  if (metric == "shared") {
    return "Files touched by BOTH branches. These are the most likely merge collision surfaces.";
  }

  return "Uncommitted local file modifications currently detected in the repository.";
}

function relationshipBeginnerSummary(
  relationship: BranchRelationshipPreview
) {
  if (relationship.classification === "IDENTICAL") {
    return "Both branches currently point to the exact same history. Nothing would change if you switched between them.";
  }

  if (
    relationship.classification === "FAST_FORWARD_LEFT" ||
    relationship.classification === "FAST_FORWARD_RIGHT"
  ) {
    return "One branch is simply ahead of the other. Git can move the older timeline forward without creating a merge commit.";
  }

  if (relationship.shared_touched_files.length > 0) {
    return "Both branches modified some of the same files. This increases the chance of merge conflicts and requires careful review.";
  }

  if (
    relationship.left_ahead > 0 &&
    relationship.right_ahead > 0
  ) {
    return "Both branches evolved separately with their own commits. Git will probably need a merge commit or rebase strategy.";
  }

  return "This relationship appears structurally safe, but review the evidence before merging or rebasing.";
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


function describeMergeIntent(preview: BranchMergePreview): {
  title: string;
  explanation: string;
  safety: string;
} {
  if (preview.mode === "FAST_FORWARD") {
    return {
      title: "Bring newer changes into the current timeline",
      explanation: "Git can safely move the current timeline forward without creating an extra merge commit.",
      safety: "This is usually the safest and simplest merge type.",
    };
  }

  if (preview.mode === "NORMAL_MERGE") {
    return {
      title: "Combine two separate lines of work",
      explanation: "Both branches contain unique commits. Git will combine them into one shared timeline.",
      safety: "Git will probably create a merge commit to record the combination.",
    };
  }

  if (preview.mode === "RISKY_MERGE") {
    return {
      title: "Combine timelines with overlapping file changes",
      explanation: "Both branches changed some of the same files. Git may ask you to resolve conflicts manually.",
      safety: "Review carefully before continuing.",
    };
  }

  return {
    title: "Current timeline already contains these changes",
    explanation: "Nothing new needs to be merged from the selected branch.",
    safety: "No merge operation is required.",
  };
}


function mergeTopologyRisk(preview: BranchMergePreview) {
  if (preview.mode === "FAST_FORWARD") return "LOW";
  if (preview.mode === "NORMAL_MERGE") return "MEDIUM";
  if (preview.mode === "RISKY_MERGE") return "HIGH";
  return preview.risk_level;
}

function mergeBlockedByLocalWork(preview: BranchMergePreview) {
  return preview.blockers.some((blocker) =>
    blocker.toLowerCase().includes("working tree")
  );
}

function mergeReadinessTitle(preview: BranchMergePreview) {
  if (mergeBlockedByLocalWork(preview)) {
    return "You still have unsaved local work";
  }

  if (!preview.allowed) {
    return "ChronoGit blocked this merge";
  }

  return "Ready to merge";
}

function mergeReadinessExplanation(preview: BranchMergePreview) {
  if (mergeBlockedByLocalWork(preview)) {
    return "Some files have been changed locally but are not safely stored in Git yet. Commit them, discard them, or set them aside before merging.";
  }

  return preview.warning;
}

export function BranchPanel({
  beginnerMode,
  repoPath,
  branchOverview,
  branchGraph,
  loadBranchOverview,
  createBranch,
  requestSwitchBranch,
  openOrAddPanel,
  ui,
}: Props) {
  const [branchName, setBranchName] = useState("");
  const [creating, setCreating] = useState(false);
  const [leftBranch, setLeftBranch] = useState("");
  const [rightBranch, setRightBranch] = useState("");
  const [incomingMergeBranch, setIncomingMergeBranch] = useState("");
  const [relationshipBusy, setRelationshipBusy] = useState(false);
  const [relationshipError, setRelationshipError] = useState("");
  const [relationship, setRelationship] = useState<BranchRelationshipPreview | null>(null);
  const [mergePreviewBusy, setMergePreviewBusy] = useState(false);
  const [mergeExecuteBusy, setMergeExecuteBusy] = useState(false);
  const [mergeError, setMergeError] = useState("");
  const [mergeConfirmation, setMergeConfirmation] = useState("");
  const [mergePreview, setMergePreview] = useState<BranchMergePreview | null>(null);

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


  async function requestMergePreview() {
    const target = incomingMergeBranch.trim();

    if (!target) return;

    try {
      setMergePreviewBusy(true);
      setMergeError("");
      setMergeConfirmation("");
      setMergePreview(await previewBranchMerge(repoPath, target));
    } catch (err) {
      setMergePreview(null);
      setMergeError(String(err));
    } finally {
      setMergePreviewBusy(false);
    }
  }

  async function requestMergeExecute() {
    if (!mergePreview) return;

    try {
      setMergeExecuteBusy(true);
      setMergeError("");
      await executeBranchMerge(repoPath, mergePreview.target_branch, mergeConfirmation);
      setMergePreview(null);
      setRelationship(null);
      setMergeConfirmation("");
      await loadBranchOverview();
    } catch (err) {
      setMergeError(String(err));
    } finally {
      setMergeExecuteBusy(false);
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
        defaultOpen={false}
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
                <div className="relationship-heading-row">
                  <span className="cg-eyebrow">Relationship verdict</span>

                  <HelpHint
                    title="What is a branch relationship?"
                    compact
                  >
                    ChronoGit compares two branches and explains whether one can safely move forward, whether both have separate work, and whether Git may have trouble combining them.
                  </HelpHint>
                </div>
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
              <div
                title={relationshipMetricExplanation("left")}
                className="relationship-metric-card"
              >
                <strong>{relationship.left_ahead}</strong>
                <span>left-only commits</span>
                <em>{relationshipMetricExplanation("left")}</em>
              </div>

              <div
                title={relationshipMetricExplanation("right")}
                className="relationship-metric-card"
              >
                <strong>{relationship.right_ahead}</strong>
                <span>right-only commits</span>
                <em>{relationshipMetricExplanation("right")}</em>
              </div>

              <div
                title={relationshipMetricExplanation("shared")}
                className={
                  relationship.shared_touched_files.length
                    ? "relationship-metric-card relationship-metric--warning"
                    : "relationship-metric-card"
                }
              >
                <strong>{relationship.shared_touched_files.length}</strong>
                <span>
                  shared touched paths

                  <HelpHint
                    title="What are shared touched paths?"
                    compact
                  >
                    These are files changed on both branches. Git may have trouble combining those changes automatically, so they deserve extra attention.
                  </HelpHint>
                </span>
                <em>{relationshipMetricExplanation("shared")}</em>
              </div>

              <div
                title={relationshipMetricExplanation("working")}
                className="relationship-metric-card"
              >
                <strong>{relationship.working_changes}</strong>
                <span>working changes</span>
                <em>{relationshipMetricExplanation("working")}</em>
              </div>
            </div>

            <section className="relationship-beginner-box">
              <div className="relationship-heading-row">
                <strong>What this means in practice</strong>

                <HelpHint
                  title="Why does ChronoGit explain this?"
                  compact
                >
                  ChronoGit tries to explain what Git is likely to do in plain language, instead of only showing hashes, counts, and technical labels.
                </HelpHint>
              </div>
              <span>{relationshipBeginnerSummary(relationship)}</span>
            </section>

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

      <BranchSubpanel
        title={ui(beginnerMode, "Merge into current timeline", "git merge into current branch")}
        subtitle={ui(
          beginnerMode,
          "Choose one incoming branch and preview merging it into the branch you are currently standing on.",
          "Destination is current HEAD branch. Source is selected incoming branch."
        )}
        defaultOpen={true}
        important
      >
        <section className="branch-merge-direction-card">
          <div>
            <span className="cg-eyebrow">Merge direction</span>
            <strong>{branchOverview?.current_branch || "unknown current branch"} ← incoming branch</strong>
            <p>
              ChronoGit always merges <strong>into the current active branch</strong>.
              Pick the branch you want to bring in, then preview before executing anything.
            </p>
          </div>

          <ChronoDropdown
            value={incomingMergeBranch}
            options={branchDropdownOptions.filter((option) => option.value !== branchOverview?.current_branch)}
            placeholder="Incoming branch"
            searchPlaceholder="Search branch to merge in..."
            emptyText="No mergeable branches match this search."
            onChange={setIncomingMergeBranch}
            className="branch-ref-dropdown"
          />

          <button
            disabled={!incomingMergeBranch || mergePreviewBusy || mergeExecuteBusy}
            onClick={() => { void requestMergePreview(); }}
            title="Preview merging the selected incoming branch into the current active branch."
          >
            {mergePreviewBusy ? "Previewing..." : ui(beginnerMode, "Preview merge", "git merge preview")}
          </button>
        </section>

        {mergeError ? (
          <section className="branch-callout branch-callout--warning">
            <strong>Merge preview / execution failed</strong>
            <span>{mergeError}</span>
          </section>
        ) : null}

        {mergePreview ? (
          <section className={`branch-merge-preview branch-merge-preview--${mergePreview.risk_level.toLowerCase()}`}>
            {(() => {
              const intent = describeMergeIntent(mergePreview);

              return (
                <div className="relationship-verdict-card">
                  <div>
                    <span className="cg-eyebrow">What you are about to do</span>

                    <h3>{intent.title}</h3>

                    <p>
                      Bring changes from{" "}
                      <strong>{mergePreview.target_branch}</strong>
                      {" "}into your current timeline{" "}
                      <strong>{mergePreview.current_branch}</strong>.
                    </p>

                    <p>{intent.explanation}</p>

                    <p className="merge-human-summary">
                      {intent.safety}
                    </p>
                  </div>

                  <em className={`relationship-risk relationship-risk--${mergeTopologyRisk(mergePreview).toLowerCase()}`}>
                    merge: {mergeTopologyRisk(mergePreview)} risk
                  </em>
                </div>
              );
            })()}

            <section className={mergePreview.allowed ? "relationship-interpretation" : "relationship-interpretation relationship-interpretation--warning"}>
              <strong>{mergeReadinessTitle(mergePreview)}</strong>

              <span>{mergeReadinessExplanation(mergePreview)}</span>

              {!mergePreview.allowed && mergeBlockedByLocalWork(mergePreview) ? (
                <section className="merge-action-recommendations">
                  <strong>Recommended next steps</strong>

                  <ol>
                    <li>
                      <b>Review current local changes.</b>
                      Make sure you know which files are modified before merging.
                      <button type="button" onClick={() => openOrAddPanel("change-lists")}>
                        Open Change Lists
                      </button>
                    </li>
                    <li>
                      <b>Commit the work you want to keep.</b>
                      This safely stores your current edits in Git before the merge.
                      <button type="button" onClick={() => openOrAddPanel("commit-preflight")}>
                        Open Commit Preflight
                      </button>
                    </li>
                    <li>
                      <b>Discard only changes you truly do not want.</b>
                      Discarding local edits can permanently remove work.
                      <button type="button" onClick={() => openOrAddPanel("change-lists")}>
                        Open Change Lists
                      </button>
                    </li>
                    <li>
                      <b>Stash support is not implemented here yet.</b>
                      ChronoGit is not pretending that option exists in this panel until it does.
                      <button type="button" disabled>
                        Stash unavailable
                      </button>
                    </li>
                  </ol>

                  <span className="merge-readiness-note">
                    The selected merge itself may be safe, but ChronoGit will not mix it with unfinished local file edits.
                  </span>
                </section>
              ) : null}
            </section>

            {mergePreview.blockers.length ? (
              <div className="relationship-evidence relationship-evidence--important">
                {mergePreview.blockers.map((blocker) => <code key={blocker}>{blocker}</code>)}
              </div>
            ) : null}

            {mergePreview.allowed ? (
              <section className="branch-merge-confirm">
                <label>
                  Type <strong>{mergePreview.required_confirmation}</strong> to merge
                  <input
                    value={mergeConfirmation}
                    onChange={(event) => setMergeConfirmation(event.target.value)}
                    placeholder={mergePreview.required_confirmation}
                  />
                </label>
                <button
                  className={mergePreview.risk_level === "HIGH" ? "danger-button" : "confirm"}
                  disabled={mergeConfirmation.trim() !== mergePreview.required_confirmation || mergeExecuteBusy}
                  onClick={() => { void requestMergeExecute(); }}
                >
                  {mergeExecuteBusy ? "Merging..." : ui(beginnerMode, "Execute merge", "git merge")}
                </button>
              </section>
            ) : null}
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
