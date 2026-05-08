import type { BranchGraph, BranchGraphCommit, BranchGraphRef } from "./chronogitRuntimeTypes";

export type TopologyLane = {
  lane: number;
  label: string;
  kind: BranchGraphRef["kind"];
  targetShortHash: string;
};

export type TopologyCommit = {
  hash: string;
  shortHash: string;
  subject: string;
  author: string;
  date: string;
  isHead: boolean;
  isMerge: boolean;
  nodeLane: number;
  activeLanes: number[];
  parentLanes: number[];
  refs: BranchGraphRef[];
};

export type BranchTopologySummary = {
  currentHead?: TopologyCommit;
  branchTipCount: number;
  localOnlyBranches: string[];
  remoteBranches: string[];
  activeBranchLabels: string[];
  mergeCommitCount: number;
  explanationLines: string[];
};

export type BranchTopology = {
  lanes: TopologyLane[];
  commits: TopologyCommit[];
  summary: BranchTopologySummary;
};

function refPriority(ref: BranchGraphRef) {
  if (ref.kind === "local") return 0;
  if (ref.kind === "remote") return 1;
  if (ref.kind === "tag") return 2;
  return 3;
}

function choosePrimaryLane(
  commit: BranchGraphCommit,
  lanes: TopologyLane[],
  reachableByLane: Map<number, Set<string>>,
  tipLaneByShortHash: Map<string, number>,
) {
  const tipLane = tipLaneByShortHash.get(commit.short_hash);
  if (tipLane !== undefined) return tipLane;

  for (const lane of lanes) {
    if (reachableByLane.get(lane.lane)?.has(commit.hash)) {
      return lane.lane;
    }
  }

  return 0;
}

function reachableFrom(
  startShortHash: string,
  commitByHash: Map<string, BranchGraphCommit>,
  commitByShortHash: Map<string, BranchGraphCommit>,
) {
  const seen = new Set<string>();
  const start = commitByShortHash.get(startShortHash);
  if (!start) return seen;

  const stack = [start.hash];

  while (stack.length) {
    const hash = stack.pop();
    if (!hash || seen.has(hash)) continue;

    seen.add(hash);

    const commit = commitByHash.get(hash);
    if (!commit) continue;

    for (const parent of commit.parents) {
      if (!seen.has(parent)) stack.push(parent);
    }
  }

  return seen;
}

export function buildBranchTopology(graph: BranchGraph, maxLanes = 8, maxCommits = 32): BranchTopology {
  const commitByHash = new Map(graph.commits.map((commit) => [commit.hash, commit]));
  const commitByShortHash = new Map(graph.commits.map((commit) => [commit.short_hash, commit]));

  const refsByShortHash = new Map<string, BranchGraphRef[]>();
  for (const ref of graph.refs) {
    const existing = refsByShortHash.get(ref.target_short_hash) || [];
    existing.push(ref);
    refsByShortHash.set(ref.target_short_hash, existing);
  }

  const laneRefs = [...graph.refs]
    .filter((ref) => ref.kind === "local" || ref.kind === "remote")
    .sort((a, b) => {
      const priority = refPriority(a) - refPriority(b);
      if (priority !== 0) return priority;
      return a.name.localeCompare(b.name);
    })
    .slice(0, maxLanes);

  const lanes: TopologyLane[] = laneRefs.map((ref, index) => ({
    lane: index,
    label: ref.name,
    kind: ref.kind,
    targetShortHash: ref.target_short_hash,
  }));

  const reachableByLane = new Map<number, Set<string>>();
  const tipLaneByShortHash = new Map<string, number>();

  for (const lane of lanes) {
    reachableByLane.set(lane.lane, reachableFrom(lane.targetShortHash, commitByHash, commitByShortHash));
    tipLaneByShortHash.set(lane.targetShortHash, lane.lane);
  }

  const commits = graph.commits.slice(0, maxCommits).map((commit) => {
    const activeLanes = lanes
      .filter((lane) => reachableByLane.get(lane.lane)?.has(commit.hash))
      .map((lane) => lane.lane);

    const nodeLane = choosePrimaryLane(commit, lanes, reachableByLane, tipLaneByShortHash);

    const parentLanes = commit.parents
      .map((parentHash) => {
        const parent = commitByHash.get(parentHash);
        return parent ? choosePrimaryLane(parent, lanes, reachableByLane, tipLaneByShortHash) : null;
      })
      .filter((lane): lane is number => lane !== null);

    return {
      hash: commit.hash,
      shortHash: commit.short_hash,
      subject: commit.subject,
      author: commit.author,
      date: commit.date,
      isHead: commit.is_head,
      isMerge: commit.parents.length > 1,
      nodeLane,
      activeLanes,
      parentLanes,
      refs: refsByShortHash.get(commit.short_hash) || [],
    };
  });

  const currentHead = commits.find((commit) => commit.isHead);
  const localOnlyBranches = lanes
    .filter((lane) => lane.kind === "local")
    .filter((lane) => !lanes.some((candidate) =>
      candidate.kind === "remote" && candidate.label.endsWith(`/${lane.label}`)
    ))
    .map((lane) => lane.label);

  const remoteBranches = lanes
    .filter((lane) => lane.kind === "remote")
    .map((lane) => lane.label);

  const activeBranchLabels = currentHead
    ? lanes
        .filter((lane) => currentHead.activeLanes.includes(lane.lane))
        .map((lane) => lane.label)
    : [];

  const mergeCommitCount = commits.filter((commit) => commit.isMerge).length;

  const explanationLines = [
    currentHead
      ? `HEAD is currently on commit ${currentHead.shortHash}: ${currentHead.subject}`
      : "HEAD is not visible in the current graph window.",
    activeBranchLabels.length
      ? `The current commit belongs to: ${activeBranchLabels.join(", ")}.`
      : "No visible branch lane contains the current commit.",
    localOnlyBranches.length
      ? `Local-only branch(es): ${localOnlyBranches.join(", ")}. These are not connected to a remote tracking branch here.`
      : "No local-only branch lane is visible.",
    remoteBranches.length
      ? `Remote tracking lane(s): ${remoteBranches.join(", ")}. These are read-only mirrors of remote branch state.`
      : "No remote tracking lane is visible.",
    mergeCommitCount > 0
      ? `${mergeCommitCount} merge commit(s) are visible in this graph window.`
      : "No merge commits are visible in this graph window.",
  ];

  return {
    lanes,
    commits,
    summary: {
      currentHead,
      branchTipCount: lanes.length,
      localOnlyBranches,
      remoteBranches,
      activeBranchLabels,
      mergeCommitCount,
      explanationLines,
    },
  };
}
