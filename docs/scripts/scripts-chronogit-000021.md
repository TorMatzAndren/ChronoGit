Title: BranchPanel.tsx
ID: scripts-chronogit-000021
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: branch-workflow
Updated: 2026-05-08
Revision: 2

---

@role:ui-panel
@subsystem:branch-workflow
@entity:script:chronogit-app/src/panels/BranchPanel.tsx
@entity:/chronogit-app/src/panels/BranchPanel.tsx
@entity:script:chronogit-app/src/core/branchTopology.ts
@entity:/chronogit-app/src/core/branchTopology.ts
@semantic:branch-awareness-ui
@semantic:branch-switching
@semantic:branch-creation
@semantic:git-branching
@semantic:git-branch-graph
@semantic:branch-topology
@semantic:timeline-model
@semantic:self-repository-guard
@semantic:educational-ui
@semantic:deterministic-projection
@state:active

# BranchPanel.tsx

**Date:** 2026-05-07
**Summary:** Branch workflow panel for ChronoGit. Renders local and remote branch timelines, branch state summaries, branch creation controls, guarded branch-switch requests, detached HEAD visibility, self-repository switching warnings, and deterministic branch topology projection from backend branch graph data.
**Keywords:** branch panel, git branches, branch overview, branch graph, branch topology, branch switching, branch creation, detached head, branch timeline
**Tags:** scripts, frontend, react, branches, git, branch-graph, branch-topology, timeline, workspace-panel

Branch timeline inspection, branch graph projection, and branch workflow panel for ChronoGit.

---

## Purpose

`BranchPanel.tsx` provides the frontend panel surface for ChronoGit branch awareness and branch workflows.

Responsibilities include:

- displaying current branch overview
- displaying local branches
- displaying remote branches
- classifying branch ahead/behind state
- displaying branch tracking labels
- creating new branch pointers
- requesting guarded branch switching
- warning about self-repository branch switching
- rendering branch graph/topology data
- explaining branch graph state through deterministic summary lines
- explaining branch concepts in beginner/pro terminology

This panel treats branches as named timeline pointers and projects backend branch graph data into an educational visual topology surface.

---

## Architectural Role

This component is part of ChronoGit’s branch-awareness and timeline workflow layer.

It does not execute Git commands directly.

It receives branch truth and mutation callbacks from higher-level orchestration.

It receives branch graph data from parent orchestration and transforms it through `buildBranchTopology`.

It acts as a projection and interaction surface for:

- branch overview state
- branch tracking state
- branch creation intent
- branch switch intent
- branch graph topology

---

## Imported Dependencies

Imports React hooks:

- `useMemo`
- `useState`

from:

    react

Imports branch topology transformer:

- `buildBranchTopology`

from:

    ../core/branchTopology

Imports runtime types:

- `BranchGraph`
- `BranchInfo`
- `BranchOverview`

from:

    ../core/chronogitRuntimeTypes

---

## Props Type

## Definition

Defines:

    type Props

Fields:

- `beginnerMode`
- `repoPath`
- `branchOverview`
- `branchGraph`
- `loadBranchOverview`
- `createBranch`
- `requestSwitchBranch`
- `ui`

---

## beginnerMode

Type:

    boolean

Purpose:

Controls beginner/pro terminology rendering.

---

## repoPath

Type:

    string

Purpose:

Current repository path.

Used here to detect whether ChronoGit appears to be inspecting its own source repository.

---

## branchOverview

Type:

    BranchOverview | null

Purpose:

Structured branch state loaded from backend truth.

Contains:

- current branch
- detached HEAD state
- local branches
- remote branches

---

## branchGraph

Type:

    BranchGraph | null

Purpose:

Structured branch graph state loaded from backend truth.

Consumed by:

- `BranchGraphView`
- `buildBranchTopology`

Used to render the deterministic branch topology projection.

---

## loadBranchOverview

Type:

    () => Promise<void>

Purpose:

Refreshes branch overview and related branch data from the parent orchestration layer.

In current App wiring, this callback refreshes both overview and graph state.

---

## createBranch

Type:

    (branchName: string) => Promise<void>

Purpose:

Requests creation of a new local branch through parent orchestration.

---

## requestSwitchBranch

Type:

    (branch: BranchInfo) => void

Purpose:

Requests guarded switching to a selected local branch.

The function name indicates that switching is not performed immediately inside this component.

---

## ui

Type:

    (beginnerMode: boolean, beginner: string, pro: string) => string

Purpose:

Provides dual-language UI terminology selection.

---

# branchState Helper

## Signature

    function branchState(branch: BranchInfo)

Purpose:

Classifies branch synchronization state from branch metadata.

---

## Classification Rules

Returns:

- `detached` if `branch.is_detached`
- `diverged` if `ahead > 0` and `behind > 0`
- `ahead` if `ahead > 0`
- `behind` if `behind > 0`
- `in sync` otherwise

---

## Classification Role

This is a frontend projection helper.

It does not query Git.

It derives display state from already-loaded branch truth.

---

# branchTrackingLabel Helper

## Signature

    function branchTrackingLabel(branch: BranchInfo)

Purpose:

Builds a compact branch tracking label for branch rows.

---

## Label Rules

Returns:

- `detached HEAD` for detached entries
- `remote tracking ref` for remote branches
- `local only` for local branches without upstream
- `<state> · +ahead / -behind` for local branches with upstream

This improves branch row readability over always showing ahead/behind counts.

---

# refKindLabel Helper

## Signature

    function refKindLabel(kind: string)

Purpose:

Maps raw ref kind strings into display labels.

---

## Label Rules

Returns:

- `local` for local refs
- `remote` for remote refs
- `tag` for tag refs
- `ref` for all other values

Used in branch topology lane labels and ref pills.

---

# shortDate Helper

## Signature

    function shortDate(value: string)

Purpose:

Converts ISO-like timestamp strings into compact display timestamps.

---

## Behavior

Matches values beginning with:

    YYYY-MM-DDTHH:MM

Returns:

    YYYY-MM-DD HH:MM

If the value does not match, returns the original value unchanged.

---

# laneRelation Helper

## Signature

    function laneRelation(currentLane: number, parentLane: number)

Purpose:

Classifies relation between a commit node lane and one of its parent lanes.

---

## Return Values

Returns:

- `straight` if parent lane equals current lane
- `left` if parent lane is lower than current lane
- `right` if parent lane is higher than current lane

Used to mark merge-left and merge-right CSS classes.

---

# BranchGraphView Component

## Purpose

`BranchGraphView` renders the branch topology projection.

It receives backend-shaped `BranchGraph` data and transforms it through:

    buildBranchTopology(branchGraph, 8, 32)

This creates a bounded graph projection with:

- up to 8 lanes
- up to 32 commits

---

## Memoization

Uses:

    useMemo

to rebuild topology only when `branchGraph` changes.

---

## Null Graph Rendering

If no topology exists, renders:

    Branch topology
    No graph data loaded.

This is a visible empty-state surface.

---

## Topology Rendering

When topology exists, renders:

- graph header
- commit count
- lane count
- deterministic explanation lines
- lane heads
- commit rows
- commit node markers
- active lane markers
- parent lane markers
- merge relation markers
- HEAD marker
- ref pills
- merge pill
- newest pill

---

## Topology Header

Displays:

    Branch topology

and:

    Deterministic lane view derived from commit parents and branch refs.

Also displays:

    <commit count> commits · <lane count> lanes

---

## Branch Topology Explainer

Renders:

    What this graph means

Then renders every line from:

    topology.summary.explanationLines

These lines are generated by `branchTopology.ts`, not by an LLM.

This is deterministic explanatory UI.

---

## Lane Heads

Renders one lane label per topology lane.

Each lane label includes:

- ref kind label
- ref name

CSS class includes:

    branch-lane-label--<kind>

---

## Commit Row Rendering

Each topology commit row renders:

- lane cells
- short hash
- HEAD marker
- ref pills
- merge marker
- newest marker
- commit subject
- author
- compact date

Current HEAD row gets:

    branch-topology-row--head

---

## Lane Cell Rendering

Each lane cell can receive CSS classes:

- `branch-topology-cell`
- `branch-topology-cell--active`
- `branch-topology-cell--parent`
- `branch-topology-cell--node`
- `branch-topology-cell--merge-left`
- `branch-topology-cell--merge-right`
- `branch-topology-cell--head`

Rendered symbols:

- `◆` for merge commit node
- `●` for normal commit node
- `│` for active or parent lane without node
- empty string otherwise

---

## Empty Lane Rendering

If topology has no lanes, renders:

    No branch refs available for topology lanes.

---

# BranchRow Component

## Purpose

`BranchRow` renders one branch row.

It displays:

- branch name
- full ref name
- short hash
- upstream
- tracking label
- branch switch action

---

## BranchRow Props

Fields:

- `branch`
- `requestSwitchBranch`
- `beginnerMode`
- `ui`

---

# Branch Row Rendering

## Root Element

Renders:

    <article>

Class:

    branch-row

Current branch modifier:

    branch-row--current

---

## Displayed Branch Data

Each row displays:

- `branch.name`
- `branch.full_name`
- `branch.short_hash`
- `branch.upstream || "no upstream"`
- `branchTrackingLabel(branch)`

---

# Branch Switch Button

## Button State

Disabled when:

- branch is current
- branch is remote
- branch is detached

Implementation:

    disabled={branch.is_current || branch.is_remote || branch.is_detached}

---

## Switch Handler

When enabled, invokes:

    requestSwitchBranch(branch)

Purpose:

Delegates branch switching to parent-controlled guarded workflow.

---

## Button Label

Uses:

    ui(beginnerMode, "Switch timeline", "git checkout")

This maps beginner-friendly timeline language to the raw Git command concept.

---

# Branch Switch Tooltips

Tooltip behavior:

- current branch: `Already on this branch.`
- remote branch: `Remote branches are read-only here. Create or checkout a local branch first.`
- local branch: `Switch active timeline to this local branch.`

This provides beginner-safe branch operation guidance.

---

# BranchPanel Component

## Export

Exports:

    BranchPanel

---

# Internal State

## branchName

Definition:

    const [branchName, setBranchName] = useState("")

Purpose:

Stores branch-name input for branch creation.

---

## creating

Definition:

    const [creating, setCreating] = useState(false)

Purpose:

Tracks branch creation request activity.

Used to disable repeated create actions and show creating state.

---

# requestCreateBranch

## Purpose

Handles branch creation workflow from the panel.

---

## Behavior

1. trims branch name
2. returns early if empty
3. sets creating state true
4. awaits `createBranch(name)`
5. clears input after successful completion
6. sets creating state false in finally block

---

## Important Boundary

Branch name validation and Git execution are not performed here.

This panel delegates actual branch creation behavior to parent/backend layers.

---

# Root Panel Container

Renders:

    <div className="cg-panel-content branch-panel">

Purpose:

Panel content wrapper for branch workflow UI.

---

# Header Section

## Structure

Renders:

    branch-panel__header

Contains:

- title
- explanatory paragraph
- refresh button

---

# Header Title

Uses:

    ui(beginnerMode, "Branch timelines", "git branch graph roots")

Purpose:

Maps beginner timeline language to advanced Git branch/ref language.

---

# Branch Explanation

Beginner text:

    A branch is a named timeline pointer. It lets history split and later rejoin.

Advanced text:

    Branches are refs pointing at commits. Current branch is HEAD unless detached.

This directly reflects ChronoGit’s educational Git doctrine.

---

# Refresh Branches Button

Invokes:

    loadBranchOverview()

Label:

- `Refresh branches`
- `git for-each-ref`

depending on mode.

Purpose:

Reloads branch overview and, through parent wiring, branch graph truth.

---

# Self-Repository Warning

## Condition

Renders warning when:

    repoPath.includes("/ChronoGit")

---

## Warning Purpose

Warns when ChronoGit appears to inspect its own source repository.

Text explains that switching branches while ChronoGit is running can replace app source or binary underneath the program.

Recommended alternatives:

- use a separate test repository
- close ChronoGit and switch manually

---

## Important Boundary

This panel only displays a warning.

The backend also contains a stronger self-repository switching guard.

This panel is an early explanatory safety surface.

---

# Branch Creation Box

## Container

Renders:

    branch-create-box

Purpose:

Provides branch creation workflow UI.

---

## Branch Creation Explanation

Beginner text:

    Creates a branch pointer at the current snapshot. It does not switch branches or change files.

Advanced text:

    Runs git branch <name>. No checkout, no worktree mutation.

This clarifies that branch creation is not branch switching.

---

## Branch Name Input

Controlled by:

    branchName

Updates via:

    setBranchName(event.target.value)

Placeholder:

    branch-name

---

## Enter Key Behavior

If key is:

    Enter

then invokes:

    requestCreateBranch()

---

## Create Button

Disabled when:

- branch name is empty after trim
- creation is already in progress

Label:

- `Creating...` while active
- otherwise beginner/pro label from `ui`

---

# Branch Overview Rendering

If `branchOverview` exists, the panel renders:

- current branch callout
- local branch section
- remote branch section
- branch graph/topology view

If `branchOverview` is null:

    No branch overview loaded.

---

# Current Branch Callout

Class:

- `branch-callout`
- `branch-callout--warning` when detached HEAD

Displays:

- `branchOverview.current_branch`
- detached HEAD explanation or current branch explanation

---

# Detached HEAD Handling

When detached:

Displays:

    Detached HEAD: you are looking at a commit directly, not a named branch.

Purpose:

Makes detached state visible to the operator.

---

# Local Branch Section

Heading:

    Local branches (<count>)

Renders:

- `BranchRow` for each local branch
- fallback: `No local branches detected.`

---

# Remote Branch Section

Heading:

    Remote branches (<count>)

Renders:

- `BranchRow` for each remote branch
- fallback: `No remote branches detected.`

Remote rows cannot be switched directly because `BranchRow` disables branch switching for remote branches.

---

# Branch Graph Section

After local and remote branch rows, renders:

    <BranchGraphView branchGraph={branchGraph} />

This makes the branch graph an integrated branch-workflow surface rather than a separate panel.

---

# Truth and Projection Boundaries

## Truth Inputs

Truth comes from:

- `branchOverview`
- `branchGraph`
- `BranchInfo` entries
- `repoPath`

provided by parent orchestration.

---

## Projection Logic

Projection logic includes:

- branch state classification
- branch tracking label generation
- ref kind label generation
- date shortening
- lane relation classification
- topology rendering
- current-row highlighting
- beginner/pro terminology
- self-repository warning
- detached HEAD warning

---

## Mutation Requests

Mutation requests include:

- branch creation request
- branch switch request

Actual mutation does not occur inside this component.

---

## Deterministic Topology Projection

Branch graph projection is deterministic:

    BranchGraph → buildBranchTopology → BranchGraphView rendering

The panel does not infer graph truth from DOM state.

The panel does not ask an LLM to explain branch graph state.

The explanation lines are deterministic strings generated from structured topology data.

---

# Safety Systems

Safety surfaces include:

- disabled switch for current branches
- disabled switch for remote branches
- disabled switch for detached entries
- self-repository switching warning
- creating-state button lock
- empty branch name block
- branch creation explanation
- branch switching tooltip explanations
- detached HEAD callout
- local-only branch label
- remote tracking ref label
- deterministic graph explanation

---

# Educational UI Doctrine

This component strongly reflects ChronoGit’s beginner/pro language model.

Beginner mode explains branches as timelines.

Advanced mode exposes Git terminology such as:

- refs
- commits
- HEAD
- detached
- git branch
- git checkout
- git for-each-ref
- branch graph roots

The underlying behavior remains unchanged.

The topology surface is educational because it shows branches as visible lanes derived from commit parents and refs.

---

# Separation of Concerns

This component handles:

- branch rendering
- branch state projection
- branch topology projection
- branch graph visual rendering
- branch creation UI
- branch switch request UI
- warnings
- educational explanations

It does not handle:

- Git command execution
- backend invocation
- branch validation
- dirty working tree checks
- actual checkout
- persistence
- repository scanning
- branch graph extraction
- topology construction internals

Topology construction is delegated to:

    branchTopology.ts

---

# CSS Dependencies

Depends on external CSS classes including:

- cg-panel-content
- branch-panel
- branch-panel__header
- branch-callout
- branch-callout--warning
- branch-create-box
- branch-panel__section
- branch-row
- branch-row--current
- branch-graph
- branch-graph__header
- branch-topology-explainer
- branch-topology
- branch-topology__lane-heads
- branch-lane-label
- branch-topology-row
- branch-topology-row--head
- branch-topology-row__lanes
- branch-topology-row__body
- branch-topology-row__top
- branch-topology-cell
- branch-ref-pill

All styling is externalized.

---

# React Characteristics

This component:

- uses local state for input and creation activity
- uses memoization for branch topology transformation
- uses nested row and graph components
- is mostly prop-driven
- performs no direct backend calls
- performs async callback orchestration through props
- renders deterministic graph UI from supplied graph truth

---

# Potential Future Expansion

Potential future improvements include:

- branch deletion UI
- branch rename UI
- upstream set/unset controls
- local checkout from remote branch
- dirty-tree preflight display
- branch protection markers
- merge/rebase branch workflows
- recent branch indicators
- branch search/filtering
- keyboard navigation
- stronger self-repository detection from backend truth instead of path substring
- richer graph lane layout
- graph zoom/collapse controls
- graph filtering by local/remote/tag
- visible ahead/behind overlays on lanes
- explicit merge-base visualization
- branch topology extraction into a dedicated panel if the view grows too large

---

# Design Characteristics

The panel is:

- branch-aware
- graph-aware
- topology-aware
- educational
- timeline-oriented
- safety-conscious
- projection-focused
- mutation-delegating
- deterministic-explanation capable
- beginner/pro dual-language capable

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/BranchPanel.tsx`

This revision documents newly present branch topology behavior:

- `BranchGraphView`
- `branchGraph` prop
- `buildBranchTopology` integration
- deterministic topology explanation rendering
- branch graph lane/cell/ref-pills rendering

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
