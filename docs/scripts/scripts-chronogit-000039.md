Title: branchTopology.ts
ID: scripts-chronogit-000039
Date: 2026-05-08
Author: Matz
Type: scripts
Subsystem: branch-workflow
Updated: 2026-05-08
Revision: 1

---

@role:semantic-transformer
@subsystem:branch-workflow
@entity:script:chronogit-app/src/core/branchTopology.ts
@entity:/chronogit-app/src/core/branchTopology.ts
@entity:script:chronogit-app/src/core/chronogitRuntimeTypes.ts
@entity:script:chronogit-app/src/panels/BranchPanel.tsx
@semantic:branch-topology
@semantic:git-branch-graph
@semantic:deterministic-projection
@semantic:timeline-model
@semantic:branch-lanes
@semantic:commit-parent-analysis
@semantic:branch-graph-summary
@state:active

# branchTopology.ts

**Date:** 2026-05-08
**Summary:** Deterministic branch graph topology transformer for ChronoGit. Converts backend `BranchGraph` truth into bounded frontend topology lanes, commit projection rows, active lane membership, parent lane relationships, ref mappings, merge visibility, local/remote branch summaries, and explanatory branch graph lines.
**Keywords:** branch topology, branch graph, git refs, commit parents, branch lanes, deterministic projection, branch visualization
**Tags:** scripts, frontend, typescript, branch-workflow, branch-graph, topology, git, projection

Deterministic branch graph topology transformer for ChronoGit.

---

## Purpose

`branchTopology.ts` transforms backend branch graph truth into a frontend branch topology projection.

It consumes:

- `BranchGraph`
- `BranchGraphCommit`
- `BranchGraphRef`

from:

    chronogitRuntimeTypes.ts

It outputs a structured topology model used by:

    BranchPanel.tsx

The module does not query Git.

The module does not render UI.

The module does not mutate repository state.

It transforms already-loaded branch graph data into a deterministic visual model.

---

## Architectural Role

This file is part of ChronoGit’s branch-workflow projection layer.

It sits between backend branch graph truth and UI rendering.

The pipeline is:

    git_branch_graph backend command
    → BranchGraph runtime type
    → buildBranchTopology()
    → BranchTopology projection
    → BranchGraphView rendering in BranchPanel.tsx

This is a semantic transformation layer, not a raw truth source.

---

## Imported Dependencies

Imports types:

- `BranchGraph`
- `BranchGraphCommit`
- `BranchGraphRef`

from:

    ./chronogitRuntimeTypes

No runtime imports are used.

---

## Exported Types

## TopologyLane

Defines one rendered branch lane.

Fields:

- `lane`
- `label`
- `kind`
- `targetShortHash`

Purpose:

Represents a local or remote branch/ref lane selected for topology projection.

---

## TopologyCommit

Defines one projected commit row.

Fields:

- `hash`
- `shortHash`
- `subject`
- `author`
- `date`
- `isHead`
- `isMerge`
- `nodeLane`
- `activeLanes`
- `parentLanes`
- `refs`

Purpose:

Represents a commit with lane placement, branch reachability, parent-lane relations, attached refs, merge status, and HEAD status.

---

## BranchTopologySummary

Defines deterministic branch graph summary data.

Fields:

- `currentHead`
- `branchTipCount`
- `localOnlyBranches`
- `remoteBranches`
- `activeBranchLabels`
- `mergeCommitCount`
- `explanationLines`

Purpose:

Provides compact structured summary and deterministic explanatory text for UI display.

---

## BranchTopology

Defines the complete topology projection.

Fields:

- `lanes`
- `commits`
- `summary`

Purpose:

This is the main output of `buildBranchTopology`.

---

# refPriority Helper

## Signature

    function refPriority(ref: BranchGraphRef)

Purpose:

Assigns deterministic priority to refs for lane ordering.

---

## Priority Rules

Returns:

- `0` for local refs
- `1` for remote refs
- `2` for tag refs
- `3` for all other refs

This makes local branches sort before remote branches, tags, and other refs.

---

# choosePrimaryLane Helper

## Signature

    function choosePrimaryLane(
      commit: BranchGraphCommit,
      lanes: TopologyLane[],
      reachableByLane: Map<number, Set<string>>,
      tipLaneByShortHash: Map<string, number>,
    )

Purpose:

Chooses the main rendered lane for a commit.

---

## Selection Rules

1. If the commit short hash is a branch/ref tip, return that tip lane.
2. Otherwise return the first lane whose reachable commit set contains the commit hash.
3. Fallback to lane `0`.

This creates stable lane placement without needing a full graphical Git layout engine.

---

# reachableFrom Helper

## Signature

    function reachableFrom(
      startShortHash: string,
      commitByHash: Map<string, BranchGraphCommit>,
      commitByShortHash: Map<string, BranchGraphCommit>,
    )

Purpose:

Computes all commits reachable from a starting ref target by walking parent hashes.

---

## Behavior

1. Looks up the starting commit by short hash.
2. Returns an empty set if no start commit is found.
3. Uses a stack to walk backwards through parent commits.
4. Tracks visited full hashes in a `Set`.
5. Returns all reachable commit hashes.

This provides lane membership data.

---

# buildBranchTopology

## Signature

    export function buildBranchTopology(
      graph: BranchGraph,
      maxLanes = 8,
      maxCommits = 32,
    ): BranchTopology

Purpose:

Builds a deterministic topology projection from backend branch graph data.

---

## Inputs

Input:

- `graph`

Optional bounds:

- `maxLanes`
- `maxCommits`

Default bounds:

- `maxLanes = 8`
- `maxCommits = 32`

These bounds keep the UI projection compact and predictable.

---

## Commit Maps

Builds:

- `commitByHash`
- `commitByShortHash`

Purpose:

Supports lookup by both full commit hash and short hash.

---

## Ref Mapping

Builds:

    refsByShortHash

Purpose:

Maps each ref target short hash to all refs pointing at that commit.

This allows rendered commits to display attached ref pills.

---

## Lane Selection

Lane refs are selected from `graph.refs`.

Rules:

1. include only local and remote refs
2. sort by `refPriority`
3. break priority ties with `name.localeCompare`
4. limit to `maxLanes`

Tags and other refs are not used as topology lanes.

They may still appear as commit refs if attached through `refsByShortHash`.

---

## Lane Construction

Each selected lane contains:

- numeric lane index
- ref display label
- ref kind
- target short hash

Lane indices are assigned by sorted order.

---

## Reachability Construction

For each lane:

- computes all commits reachable from the lane target
- stores the result in `reachableByLane`
- stores the lane tip in `tipLaneByShortHash`

This lets each commit know which lanes contain it.

---

## Commit Projection

Projects up to `maxCommits` commits from:

    graph.commits.slice(0, maxCommits)

For each commit, it calculates:

- `activeLanes`
- `nodeLane`
- `parentLanes`
- attached refs
- merge state
- HEAD state

---

## activeLanes

`activeLanes` contains every lane whose reachable set includes the commit hash.

This indicates which branch/ref lanes contain the commit.

---

## nodeLane

`nodeLane` is selected through:

    choosePrimaryLane

This is the lane where the commit node itself should be rendered.

---

## parentLanes

`parentLanes` maps each parent hash to its primary lane.

Missing parent commits are ignored.

Purpose:

Used by UI rendering to mark parent lane relationships and merge directions.

---

## Merge Detection

A commit is marked as merge when:

    commit.parents.length > 1

This is structural detection from backend parent data.

---

## Current HEAD Detection

Current HEAD is selected from projected commits:

    commits.find((commit) => commit.isHead)

If HEAD is outside the projected commit window, `currentHead` is absent.

---

## Local-Only Branch Detection

Local-only branches are derived from lanes.

A local branch is treated as local-only when no remote lane label ends with:

    /<local branch label>

This is a frontend heuristic based on visible lane labels.

It is useful for display but should not be treated as authoritative upstream truth.

---

## Remote Branch Detection

Remote branches are all lanes whose kind is:

    remote

The output is a list of remote lane labels.

---

## Active Branch Labels

If current HEAD is visible, active branch labels are all lane labels whose lane index appears in:

    currentHead.activeLanes

If HEAD is not visible, the list is empty.

---

## Merge Commit Count

Counts projected commits where:

    isMerge === true

This count is limited to the current projected graph window.

---

## Explanation Lines

Builds deterministic explanation strings describing:

- visible HEAD commit
- branches containing the current commit
- visible local-only branches
- visible remote tracking lanes
- visible merge commit count

These lines are deterministic UI explanations.

They are not LLM-generated.

---

## Output

Returns:

- `lanes`
- `commits`
- `summary`

as a `BranchTopology`.

---

## Truth and Projection Boundaries

## Truth Inputs

Truth input comes from backend-generated `BranchGraph`.

This file does not verify Git state itself.

---

## Projection Logic

Projection logic includes:

- lane selection
- lane ordering
- reachable commit analysis
- primary lane assignment
- parent lane assignment
- local-only branch display heuristic
- active branch label derivation
- merge count derivation
- deterministic explanation line generation

---

## Mutation Boundary

This file performs no mutation.

It does not call Git.

It does not call Tauri.

It does not write storage.

It does not alter branch state.

---

## Rendering Boundary

This file performs no rendering.

Rendering happens in:

    BranchPanel.tsx

---

## Advisory Boundary

This file does not use LLMs.

All explanations are deterministic strings produced from structured graph data.

---

# Design Characteristics

The transformer is:

- deterministic
- bounded
- frontend-only
- type-driven
- branch-graph aware
- commit-parent aware
- lane-oriented
- projection-focused
- local-first
- non-mutating

---

# Limitations

Current limitations include:

- lane layout is simple and not a full Git graph renderer
- local-only branch detection is based on remote label suffix matching
- only local and remote refs become lanes
- tags and other refs do not become lanes
- graph is bounded to default 8 lanes and 32 commits
- commits outside the bounded window cannot contribute visible HEAD/topology details
- parent commits missing from the bounded graph cannot produce parent lanes
- fallback lane is `0` when no better match is found
- no merge-base computation is performed
- no branch coloring is assigned here
- no graph minimization/crossing reduction is performed

---

# Related Files

Consumes types from:

- `chronogit-app/src/core/chronogitRuntimeTypes.ts`

Consumed by:

- `chronogit-app/src/panels/BranchPanel.tsx`

Backend source of branch graph data:

- `chronogit-app/src-tauri/src/lib.rs`

Root orchestration wiring:

- `chronogit-app/src/App.tsx`

---

# Verification Notes

This document is based on full-file inspection of:

- `src/core/branchTopology.ts`

This is a new script documentation entry created for the branch topology transformer.

No behavior outside directly visible source logic has been documented.

---

# Status

active
