Title: BranchPanel.tsx
ID: scripts-chronogit-000021
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: branch-workflow
Updated: 2026-05-07
Revision: 1

---

@role:ui-panel
@subsystem:branch-workflow
@entity:script:chronogit-app/src/panels/BranchPanel.tsx
@entity:/chronogit-app/src/panels/BranchPanel.tsx
@semantic:branch-awareness-ui
@semantic:branch-switching
@semantic:branch-creation
@semantic:git-branching
@semantic:timeline-model
@semantic:self-repository-guard
@semantic:educational-ui
@state:active

# BranchPanel.tsx

**Date:** 2026-05-07
**Summary:** Branch workflow panel for ChronoGit. Renders local and remote branch timelines, branch state summaries, branch creation controls, guarded branch-switch requests, detached HEAD visibility, and self-repository switching warnings.
**Keywords:** branch panel, git branches, branch overview, branch switching, branch creation, detached head, branch timeline
**Tags:** scripts, frontend, react, branches, git, timeline, workspace-panel

Branch timeline inspection and branch workflow panel for ChronoGit.

---

## Purpose

`BranchPanel.tsx` provides the frontend panel surface for ChronoGit branch awareness and branch workflows.

Responsibilities include:

- displaying current branch overview
- displaying local branches
- displaying remote branches
- classifying branch ahead/behind state
- creating new branch pointers
- requesting guarded branch switching
- warning about self-repository branch switching
- explaining branch concepts in beginner/pro terminology

This panel treats branches as named timeline pointers.

---

# Architectural Role

This component is part of ChronoGit’s branch-awareness and timeline workflow layer.

It does not execute Git commands directly.

It receives branch truth and mutation callbacks from higher-level orchestration.

It acts as a projection and interaction surface for branch state.

---

# Imported Dependencies

Imports:

- `useState`

from:

    react

Imports runtime types:

- `BranchInfo`
- `BranchOverview`

from:

    ../core/chronogitRuntimeTypes

---

# Props Type

## Definition

Defines:

    type Props

Fields:

- `beginnerMode`
- `repoPath`
- `branchOverview`
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

## loadBranchOverview

Type:

    () => Promise<void>

Purpose:

Refreshes branch overview from the parent orchestration layer.

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

# BranchRow Component

## Purpose

`BranchRow` renders one branch row.

It displays:

- branch name
- full ref name
- short hash
- upstream
- branch state
- ahead/behind counts
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
- `branchState(branch)`
- `+ahead / -behind`

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

Reloads branch overview truth.

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

# Truth and Projection Boundaries

## Truth Inputs

Truth comes from:

- `branchOverview`
- `BranchInfo` entries
- `repoPath`

provided by parent orchestration.

---

## Projection Logic

Projection logic includes:

- branch state classification
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

The underlying behavior remains unchanged.

---

# Separation of Concerns

This component handles:

- branch rendering
- branch state projection
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

All styling is externalized.

---

# React Characteristics

This component:

- uses local state for input and creation activity
- uses a nested row component
- is mostly prop-driven
- performs no direct backend calls
- performs async callback orchestration through props

---

# Potential Future Expansion

Potential future improvements include:

- branch deletion UI
- branch rename UI
- branch graph visualization
- upstream set/unset controls
- local checkout from remote branch
- dirty-tree preflight display
- branch protection markers
- merge/rebase branch workflows
- recent branch indicators
- branch search/filtering
- keyboard navigation
- stronger self-repository detection from backend truth instead of path substring

None currently exist.

---

# Design Characteristics

The panel is:

- branch-aware
- educational
- timeline-oriented
- safety-conscious
- projection-focused
- mutation-delegating
- beginner/pro dual-language capable

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/BranchPanel.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
