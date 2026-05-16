Title: BranchPanel.tsx
ID: scripts-chronogit-000021
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: branch-workflow
Updated: 2026-05-16
Revision: 3

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
@semantic:contextual-help
@semantic:workflow-navigation
@semantic:merge-risk-explanation
@semantic:merge-preview
@semantic:merge-readiness
@semantic:branch-relationship-inspector
@state:active

# BranchPanel.tsx

**Date:** 2026-05-07
**Summary:** Branch workflow panel for ChronoGit. Renders local and remote branch timelines, branch state summaries, guarded branch creation/switch requests, deterministic branch topology projection, branch relationship inspection, merge readiness previews, guided merge blocker navigation, structured merge-risk LLM explanations, and merge execution controls.
**Keywords:** branch panel, git branches, branch overview, branch graph, branch topology, branch switching, branch creation, branch relationship, merge preview, merge readiness, merge risk, local LLM, detached head, branch timeline
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


---

# 2026-05-16 Update: Branch Relationship, Merge Readiness, and Merge-Risk Explanation

This update documents the expanded BranchPanel behavior visible in the inspected source revision.

The panel now acts as a branch decision-support surface, not only a branch list and topology renderer.

New responsibilities include:

- branch relationship inspection
- semantic relationship verdict rendering
- shared touched path surfacing
- collapsible relationship evidence groups
- beginner-oriented relationship interpretation
- merge direction preview
- merge readiness explanation
- merge blocker explanation
- deterministic navigation to supporting panels
- structured merge-risk LLM explanation dispatch
- merge execution confirmation controls
- contextual help hints for confusing branch concepts

---

## New Imported Components

The panel now imports:

    ChronoDropdown
    HelpHint

from:

    ../components/ChronoDropdown
    ../components/HelpHint

`ChronoDropdown` provides custom searchable branch selection without relying on native OS select widgets.

`HelpHint` provides inline beginner-facing explanations beside complex branch relationship and shared-path concepts.

---

## New Imported Git Action Wrappers

The panel now imports:

    compareCommits
    executeBranchMerge
    explainMergeRiskWithOllama
    inspectBranchRelationship
    previewBranchMerge

from:

    ../core/gitActions

These wrappers move backend invocation out of the component body while allowing BranchPanel to orchestrate branch/merge workflows.

---

## Expanded Runtime Type Dependencies

The panel now consumes:

- `BranchMergePreview`
- `BranchRelationshipPreview`
- `LlmLogEntry`

in addition to the previous branch overview and graph types.

This reflects the panel’s move from branch display to branch/merge cognition.

---

## Expanded Props

New props include:

- `openOrAddPanel`
- `llmModel`
- `appendLlmEntry`

---

## openOrAddPanel

Type:

    (type: PanelType) => void

Purpose:

Allows BranchPanel to route the user to the correct supporting panel without directly owning workspace layout.

Used for:

- opening Change Lists when local work blocks a merge
- opening Commit Preflight when current work should be committed
- opening Time Machine for manual inspection
- opening LLM Log after merge-risk explanation completion

This keeps BranchPanel as an intent source while App.tsx remains the workspace orchestration owner.

---

## llmModel

Type:

    string

Purpose:

Identifies the selected local LLM model used for merge-risk explanation.

If no model is selected, the merge-risk explanation button is disabled.

---

## appendLlmEntry

Type:

    (entry: Omit<LlmLogEntry, "id" | "timestamp">) => void

Purpose:

Allows BranchPanel to write merge-risk explanation results into the central LLM log.

The panel does not render the LLM answer inline.

---

# BranchSubpanel Component

## Purpose

`BranchSubpanel` provides collapsible sections inside the BranchPanel.

It receives:

- `title`
- `subtitle`
- `defaultOpen`
- `important`
- `children`

This reduces monolithic vertical UI pressure and lets important sections remain visible while lower-priority evidence can collapse.

---

## Important Modifier

When `important` is true, the root receives:

    branch-subpanel--important

Used for high-value branch relationship and merge sections.

---

# Relationship Inspector

The panel now contains a Timeline Relationship Inspector.

Purpose:

Compare two branch timelines before dangerous branch operations.

It uses two `ChronoDropdown` selectors:

- left branch
- right branch

and invokes:

    inspectBranchRelationship(repoPath, left, right)

The operation is preview-only.

It does not:

- switch branches
- merge branches
- rebase
- mutate files

---

## Relationship Preview State

State includes:

- `leftBranch`
- `rightBranch`
- `relationshipBusy`
- `relationshipError`
- `relationship`

---

## requestRelationshipPreview

Purpose:

Loads deterministic relationship truth from the backend.

Behavior:

1. trims left and right branch names
2. returns early when either side is empty or both are equal
3. sets busy and clears error
4. invokes `inspectBranchRelationship`
5. stores `BranchRelationshipPreview`
6. clears result and stores error on failure
7. resets busy in finally

---

# Relationship Verdict Helpers

New relationship helpers include:

- `relationshipVerdictTitle`
- `relationshipMetricExplanation`
- `relationshipBeginnerSummary`
- `relationshipInterpretation`

These convert backend relationship truth into beginner-readable operational meaning.

---

## relationshipVerdictTitle

Maps classifications such as:

- `IDENTICAL`
- `FAST_FORWARD_LEFT`
- `FAST_FORWARD_RIGHT`
- `DIVERGED_CLEAN_PATHS`
- `DIVERGED_SHARED_PATHS`
- `HIGH_RISK`

into readable verdict headings.

---

## relationshipMetricExplanation

Explains relationship metrics:

- left-only commits
- right-only commits
- shared touched paths
- working changes

This supports both native `title` hints and visible metric card text.

---

## relationshipBeginnerSummary

Produces practical beginner explanations of the relationship result.

Examples include:

- branches already aligned
- fast-forward case
- shared touched files requiring review
- both branches evolved separately

---

## relationshipInterpretation

Produces recommended operational interpretation.

The key safety rule is:

    shared touched paths do not guarantee conflict, but they identify the main collision surface.

---

# Relationship Evidence Groups

`RelationshipEvidenceGroup` renders collapsible file evidence lists using `BranchSubpanel`.

Evidence groups include:

- shared touched files
- left-only files
- right-only files

Shared touched files default open when present and can be marked important.

---

# Merge Preview Workflow

The panel now includes a dedicated merge-into-current-timeline workflow.

It clearly establishes direction:

    current branch ← incoming branch

This is important because Git users often confuse source and destination branch direction.

---

## Merge Preview State

State includes:

- `incomingMergeBranch`
- `mergePreviewBusy`
- `mergeExecuteBusy`
- `mergeExplainBusy`
- `mergeError`
- `mergeConfirmation`
- `mergePreview`

---

## requestMergePreview

Purpose:

Loads merge preview truth for the selected incoming branch.

Behavior:

1. trims selected incoming branch
2. returns early if empty
3. sets preview busy
4. clears merge error and confirmation text
5. invokes `previewBranchMerge(repoPath, target)`
6. stores `BranchMergePreview`
7. clears preview and stores error on failure
8. resets busy in finally

---

# Merge Intent Helpers

Merge helpers include:

- `describeMergeIntent`
- `mergeTopologyRisk`
- `mergeBlockedByLocalWork`
- `mergeReadinessTitle`
- `mergeReadinessExplanation`

---

## describeMergeIntent

Maps merge mode into plain-language intent.

Modes handled include:

- `FAST_FORWARD`
- `NORMAL_MERGE`
- `RISKY_MERGE`
- already-contained cases

The helper explains what the user is about to do before execution is possible.

---

## mergeTopologyRisk

Maps preview mode into visible risk level.

Rules:

- `FAST_FORWARD` → LOW
- `NORMAL_MERGE` → MEDIUM
- `RISKY_MERGE` → HIGH
- fallback to backend risk level

---

## mergeBlockedByLocalWork

Detects whether blockers include working-tree local work.

This supports the distinction between:

- topology/merge risk
- local workspace readiness

---

## mergeReadinessTitle

Provides readable readiness headings:

- `You still have unsaved local work`
- `ChronoGit blocked this merge`
- `Ready to merge`

---

## mergeReadinessExplanation

Explains why a merge is blocked or ready.

When local work blocks merging, it tells the user to commit, discard, or set work aside before merging.

---

# Merge Blocker Navigation

When a merge is blocked by local work, the panel displays recommended next steps:

- Review current local changes
- Commit work to keep
- Discard only unwanted changes
- Stash unavailable

Buttons route to deterministic panels:

- Change Lists
- Commit Preflight

The stash option is disabled because stash support is not implemented in this panel.

This avoids fake affordances.

---

# Shared Files Review

When shared touched files exist, the panel displays a review section.

It tells the user:

    Both timelines changed some of the same files.
    This does not always mean a conflict.
    It is worth inspecting before merge.

Actions include:

- ask selected local LLM to explain merge risk
- open Time Machine for manual inspection

---

# Structured Merge-Risk LLM Explanation

## explainMergeRisk

Purpose:

Generates a structured merge-risk explanation and writes it to the LLM log.

Behavior:

1. requires existing `mergePreview`
2. requires selected `llmModel`
3. sets merge explanation busy
4. clears merge error
5. calls `compareCommits` for current branch versus target branch
6. builds a structured merge preview text block
7. calls `explainMergeRiskWithOllama`
8. appends result to LLM log
9. opens or adds the LLM Log panel
10. stores error on failure
11. resets busy in finally

---

## Structured Preview Design

The merge-risk LLM request intentionally avoids raw code diff text.

It sends:

- current branch
- incoming branch
- merge mode
- ChronoGit risk label
- changed file count
- insertion count
- deletion count
- shared touched file count
- shared touched file list
- changed file list

This prevents the LLM from drifting into project-specific implementation advice when the task is merge-risk explanation.

---

## LLM Boundary

BranchPanel does not treat LLM output as Git truth.

The LLM explanation is advisory and is routed to the LLM Log.

Git preview data remains authoritative.

---

# Merge Execution Workflow

## requestMergeExecute

Purpose:

Executes the previewed merge only after required confirmation text is entered.

Behavior:

1. returns if no merge preview exists
2. sets merge execute busy
3. clears merge error
4. invokes `executeBranchMerge`
5. clears merge preview and relationship result on success
6. clears confirmation input
7. refreshes branch overview
8. stores error on failure
9. resets busy in finally

---

## Confirmation Gate

When `mergePreview.allowed` is true, the panel renders a confirmation section.

The user must type:

    merge

or:

    override

depending on backend-provided `required_confirmation`.

Execution button remains disabled until the typed text matches exactly.

High-risk merges receive danger styling.

---

# HelpHint Integration

The panel uses `HelpHint` for contextual explanations including:

- what a branch relationship means
- what shared touched paths mean
- why ChronoGit explains relationship state

These hints keep important information visible without expanding the entire panel.

---

# ChronoDropdown Integration

The panel uses `ChronoDropdown` for:

- left branch selection
- right branch selection
- incoming merge branch selection

This avoids native OS dropdown behavior and supports screenshot-friendly custom UI.

---

# Updated Mutation Boundary

BranchPanel still does not directly run Git commands.

It delegates through frontend action wrappers and parent callbacks.

However, it now orchestrates higher-risk branch workflows through typed wrappers:

- relationship preview
- merge preview
- merge execution
- comparison loading for explanation
- merge-risk LLM explanation dispatch

Actual Git execution remains in backend command code.

---

# Updated Safety Systems

New safety surfaces include:

- collapsible relationship/merge subpanels
- relationship verdict hierarchy
- shared touched path warnings
- local-work blocker interpretation
- deterministic navigation to supporting panels
- disabled unimplemented stash option
- merge direction explanation
- confirmation text gate
- merge-risk LLM explanation button
- manual Time Machine inspection bridge

---

# Updated Known Gaps

Known gaps after this update:

- no inline conflict resolver in BranchPanel
- no automatic same-line conflict prediction
- no direct merge-tree simulation view
- no branch relationship result persistence
- no automatic Time Machine comparison preloading
- no stash workflow despite disabled guidance
- no keyboard navigation for relationship selection
- no branch deletion/rename workflow
- no upstream branch creation from remote refs

---

# Verification Notes for 2026-05-16 Update

This update section is based on full-file inspection of:

- `src/panels/BranchPanel.tsx`

It documents directly visible behavior in the inspected source:

- `ChronoDropdown` usage
- `HelpHint` usage
- branch relationship preview
- merge preview
- merge execution
- structured merge-risk LLM explanation
- merge blocker navigation
- collapsible branch subpanels

No undocumented behavior has been inferred beyond directly visible source logic.

# Status

active
