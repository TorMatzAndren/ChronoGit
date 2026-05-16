Title: ChangeListsPanel.tsx
ID: scripts-chronogit-000022
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: change-lists
Updated: 2026-05-16
Revision: 2

---

@role:ui-panel
@subsystem:change-lists
@entity:script:chronogit-app/src/panels/ChangeListsPanel.tsx
@entity:/chronogit-app/src/panels/ChangeListsPanel.tsx
@semantic:git-status-ui
@semantic:file-change-list
@semantic:staged-files
@semantic:working-tree
@semantic:file-mutation-actions
@semantic:risk-grouping
@semantic:llm-explain-ui
@semantic:bulk-unstage
@semantic:folder-recovery
@semantic:staged-prefix-recovery
@semantic:educational-ui
@state:active

# ChangeListsPanel.tsx

**Date:** 2026-05-07
**Summary:** File change list panel for ChronoGit. Renders staged and working-tree file changes, groups them by risk class, exposes file-level Git actions, supports grouped staged-folder recovery workflows, provides inline explanations, and supports advisory LLM explanation requests for individual file states.
**Keywords:** change lists, staged files, working tree, file actions, git status, risk grouping, file state explanation
**Tags:** scripts, frontend, react, git-status, file-actions, staged-files, working-tree, llm

File-level Git status and action panel for ChronoGit.

---

## Purpose

`ChangeListsPanel.tsx` provides the primary file-change inspection and action surface for ChronoGit.

Responsibilities include:

- displaying staged/prepared files
- displaying working-folder changes
- grouping file changes by risk level
- rendering file-level explanations
- toggling inline explanation boxes
- requesting local LLM explanations for file state
- dispatching file-level Git actions
- exposing destructive actions through parent-controlled workflows

This panel is the main frontend projection of file-level Git status.

---

# Architectural Role

This component belongs to ChronoGit’s Git status projection and file-action layer.

It does not execute Git directly.

It receives structured `FileChange` data from parent state and sends action requests through callback props.

It acts as:

- file status rendering surface
- risk grouping projection layer
- file action dispatcher
- educational explanation surface
- LLM explanation trigger surface

---

# Imported Dependencies

Imports:

- `useState`

from:

    react

Imports runtime types:

- `ExplainContext`
- `FileChange`

from:

    ../core/chronogitRuntimeTypes

---

# FileAction Type

## Definition

Defines allowed file action identifiers:

- `git_stage`
- `git_unstage`
- `git_restore`
- `git_remove_untracked`
- `git_ignore_path`

These strings map to backend-capable file action commands through parent orchestration.

---

# Props Type

## Definition

Defines:

    type Props

Fields:

- `beginnerMode`
- `staged`
- `working`
- `busyPath`
- `uiExplainBusy`
- `llmModel`
- `runFileAction`
- `explainUiContext`
- `ui`

---

## beginnerMode

Type:

    boolean

Purpose:

Controls beginner/pro terminology rendering.

---

## staged

Type:

    FileChange[]

Purpose:

Structured list of files currently prepared for the next commit.

---

## working

Type:

    FileChange[]

Purpose:

Structured list of working-folder changes not necessarily prepared for commit.

---

## busyPath

Type:

    string

Purpose:

Identifies file path currently undergoing an action.

Used to disable relevant file action buttons.

---

## uiExplainBusy

Type:

    boolean

Purpose:

Indicates whether UI explanation generation is currently busy.

Used to disable LLM explanation buttons.

---

## llmModel

Type:

    string

Purpose:

Current selected local LLM model.

If missing, LLM explanation buttons are disabled.

---

## runFileAction

Type:

    (action: FileAction, path: string) => Promise<void>

Purpose:

Dispatches file-level Git action requests to parent orchestration.

---

## explainUiContext

Type:

    (context: ExplainContext) => Promise<void>

Purpose:

Dispatches advisory LLM explanation requests for file state.

---

## ui

Type:

    (beginnerMode: boolean, beginner: string, pro: string) => string

Purpose:

Provides beginner/pro terminology selection.

---

# plainStatus Helper

## Signature

    function plainStatus(change: FileChange)

Purpose:

Converts structured file state into beginner-readable human status text.

---

## Staged State Mapping

When `change.staged` is true:

- `added` → `Prepared new file`
- `modified` → `Prepared edit`
- `deleted` → `Prepared deletion`
- fallback → `Prepared change`

---

## Working State Mapping

When `change.staged` is false:

- `untracked` → `New unprepared file`
- `modified` → `Edited but not prepared`
- `deleted` → `Deleted but not prepared`
- `conflict` → `Conflict`
- fallback → `Working folder change`

---

## Role

This helper is a projection helper.

It does not alter Git truth.

It translates structured Git state into human-readable status language.

---

# riskTitle Helper

## Signature

    function riskTitle(risk: string)

Purpose:

Maps risk identifiers to section titles.

---

## Risk Title Mapping

Mappings:

- `critical` → `Critical / conflicts`
- `danger` → `Danger / destructive`
- `evidence` → `Evidence / backup files`
- `review` → `Needs review`
- fallback → `Safe changes`

---

# group Helper

## Signature

    function group(changes: FileChange[])

Purpose:

Groups changes by risk class.

---

## Group Buckets

Predefined buckets:

- `critical`
- `danger`
- `evidence`
- `review`
- `normal`

Unknown risk keys fall back into:

- `review`

---

## Role

This creates deterministic risk-ordered rendering groups.

It is a frontend projection layer over backend-provided risk metadata.

---

# ChangeCard Component

## Purpose

`ChangeCard` renders one changed file and its available actions.

It displays:

- file path
- plain-language status
- risk pill
- backend explanation text
- optional expanded explanation box
- file action buttons
- LLM explanation button

---

# ChangeCard Props

Inputs include:

- `beginnerMode`
- `change`
- `busyPath`
- `expanded`
- `onToggleExpanded`
- `uiExplainBusy`
- `llmModel`
- `runFileAction`
- `explainUiContext`
- `ui`

---

# ChangeCard Root

Root element:

    <article>

Class format:

    change-card change-card--<risk>

Purpose:

Allows risk-specific visual styling.

---

# File Identity Display

Displays:

- `change.path`
- `plainStatus(change)`

This surfaces both raw path identity and beginner-readable state.

---

# Risk Pill

Class format:

    risk-pill risk-pill--<risk>

Displays:

    change.risk

Purpose:

Makes backend risk classification visible.

---

# Backend Explanation Display

Renders:

    change.explanation

Purpose:

Displays structured explanation generated by backend classification.

---

# Expanded Explanation Box

Conditional on:

    expanded

Renders:

- beginner/pro heading
- plain status
- risk
- Git index/worktree status codes

---

# Git Status Code Display

Displays:

    change.index_status || "·"
    change.worktree_status || "·"

Purpose:

Preserves low-level Git status truth for inspection.

---

# Local Explanation Toggle

Button toggles expanded inline explanation.

Label uses beginner/pro terminology:

- `Explain`
- `Hide explanation`
- `explain`
- `hide`

---

# Advisory LLM Explanation Button

Invokes:

    explainUiContext(...)

Context payload:

- kind: `file_status`
- title: `Explain file state: <path>`
- plainText: plain status, risk, explanation
- rawTruth: JSON serialized `FileChange`

---

## LLM Button Disable Logic

Disabled when:

- `uiExplainBusy`
- no `llmModel`

Purpose:

Prevents explanation requests when local LLM explanation is unavailable or busy.

---

# Stage / Unstage Action

If file is not staged:

Action:

    git_stage

Label:

- `Prepare for commit`
- `git add`

If file is staged:

Action:

    git_unstage`

Label:

- `Remove from next commit`
- `git reset`

Note:

The label says `git reset`, but the action string is `git_unstage`. Backend implementation may use a different Git command. This document records the visible source behavior only.

---

# Restore / Discard Action

Shown when:

- file is not staged
- file status is not `untracked`

Action:

    git_restore

Button class:

    danger-button

Purpose:

Allows discarding working-folder changes.

Actual confirmation behavior is owned by parent orchestration.

---

# Untracked File Actions

Shown when:

- file is not staged
- file status is `untracked`

Actions:

- `git_remove_untracked`
- `git_ignore_path`

---

## Remove Untracked File

Button class:

    danger-button

Label:

- `Remove untracked file`
- `rm`

Purpose:

Requests removal of untracked file through parent action flow.

---

## Add to .gitignore

Action:

    git_ignore_path

Label:

- `Add to .gitignore`
- `append .gitignore`

Purpose:

Requests appending the file path to `.gitignore`.

---

# Busy Path Behavior

File action buttons are disabled when:

    busyPath === change.path

Purpose:

Prevents repeated actions against the same path while an operation is in progress.

---

# ChangeListsPanel Component

## Export

Exports:

    ChangeListsPanel

---

# Internal State

## expandedPath

Definition:

    const [expandedPath, setExpandedPath] = useState("")

Purpose:

Tracks which file card currently has expanded inline explanation.

Only one expanded card is tracked at a time.

---

# renderGroupedChanges

## Purpose

Renders file changes grouped by risk.

---

## Risk Render Order

Groups render in this fixed order:

- `critical`
- `danger`
- `evidence`
- `review`
- `normal`

This ensures higher-risk changes appear before safer changes.

---

## Empty Group Behavior

If a risk group has no rows:

    return null

The group is not rendered.

---

# Risk Section Rendering

Each group renders:

- `risk-section`
- heading from `riskTitle(risk)`
- row count
- one `ChangeCard` per change

---

# Expanded Key

Expansion key:

    `${change.path}:${change.staged}`

Purpose:

Distinguishes staged and working versions of the same path.

---

# Root Panel Layout

Root element:

    <div className="cg-panel-content cg-change-lists">

Contains two major sections:

- prepared/staged files
- working-folder changes

---

# Prepared Files Section

Heading:

- beginner: `Prepared for next commit`
- pro: `index / staged`

If no staged files:

    Nothing prepared.

---

# Working Folder Section

Heading:

- beginner: `Working folder changes`
- pro: `worktree`

If no working files:

    Working folder clean.

---

# Truth, Projection, Mutation, and Advisory Boundaries

## Truth Inputs

Truth inputs are:

- `staged`
- `working`
- `FileChange` structures

These are supplied by parent orchestration.

---

## Projection Logic

Projection logic includes:

- plain status mapping
- risk grouping
- risk headings
- expanded explanation boxes
- staged/working section split

---

## Mutation Requests

Mutation request surfaces include:

- stage
- unstage
- restore/discard
- remove untracked
- add to .gitignore

The component does not execute mutations directly.

---

## Advisory Systems

Advisory systems include:

- inline explanation box
- local LLM explanation request

LLM output is requested through parent orchestration and remains advisory.

---

# Safety Systems

Safety surfaces include:

- visible risk pills
- risk-ordered grouping
- danger-button styling
- busy-path disabling
- no direct mutation execution
- parent-controlled destructive workflows
- critical/conflict grouping
- backend explanation display

---

# Educational UI Doctrine

This panel strongly reflects ChronoGit’s beginner/pro dual-language model.

Beginner terms include:

- Prepared for next commit
- Working folder changes
- Prepare for commit
- Remove from next commit
- Restore / discard

Advanced terms include:

- index / staged
- worktree
- git add
- git reset
- git restore

The same Git truth is displayed with different terminology depending on mode.

---

# Separation of Concerns

This component handles:

- rendering
- grouping
- local expansion state
- action dispatch
- LLM explanation dispatch

It does not handle:

- Git execution
- backend invocation
- confirmation modal logic
- risk classification generation
- persistence
- remote synchronization
- commit creation

---

# CSS Dependencies

Depends on external CSS classes including:

- cg-panel-content
- cg-change-lists
- risk-section
- change-card
- change-card--<risk>
- change-card__top
- change-card__path
- change-card__plain
- risk-pill
- risk-pill--<risk>
- change-card__explain
- explain-box
- change-card__actions
- danger-button

All styling is externalized.

---

# React Characteristics

This component:

- uses local state
- contains a nested `ChangeCard` component
- is mostly prop-driven
- performs no direct async backend work
- dispatches async callbacks through props

---

# Current Known Gaps

- Only one expanded explanation card can be open at a time.
- No search/filtering exists within change lists.
- No sorting controls exist beyond fixed risk group order.
- No file diff preview exists in this panel.
- No batch actions exist.
- No partial staging exists.
- No keyboard navigation exists.
- The advanced unstage button label uses `git reset` while the action identifier is `git_unstage`.
- Unknown risk values fall into review grouping but display their original risk value on the card.
- No pagination or virtualization exists for very large change sets.

---

# Potential Future Expansion

Potential future improvements include:

- inline diff preview
- file search
- batch staging
- partial hunk staging
- line-level explanations
- conflict-resolution guidance
- risk filters
- file-type grouping
- dependency-file highlighting
- generated-file detection
- backup/export actions
- keyboard navigation
- multi-select workflows

None currently exist.

---

# Design Characteristics

The panel is:

- Git-status focused
- risk-aware
- educational
- action-oriented
- mutation-delegating
- LLM-advisory capable
- deterministic in grouping structure

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/ChangeListsPanel.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---


---

# 2026-05-16 Update: Bulk Staged-Folder Recovery Workflow

This update documents the staged-folder recovery workflow added after accidental bulk staging edge cases were discovered during real repository usage.

The panel now supports grouped staged-folder recovery through:

    git_unstage_prefix

This allows users to remove large staged folder trees from the next commit without deleting underlying files.

The feature exists primarily as a safety and recovery workflow.

---

# Expanded FileAction Type

Additional action:

    git_unstage_prefix

Purpose:

Requests grouped staged-prefix recovery from parent orchestration.

This action differs from:

    git_unstage

because it targets multiple staged files sharing a path prefix.

---

# topFolder Helper

## Signature

    function topFolder(path: string)

Purpose:

Extracts the highest-level folder prefix from a file path.

---

## Behavior

The helper:

- strips surrounding quotes
- splits on `/`
- ignores empty segments
- returns:

    <top-folder>/

for nested paths

Returns empty string for:

- root files
- single-segment paths

---

## Role

This helper exists specifically to support grouped staged-folder cognition.

It is projection-only.

It does not mutate Git state.

---

# stagedFolderGroups Helper

## Signature

    function stagedFolderGroups(staged: FileChange[])

Purpose:

Detects unusually large staged folder groups that may represent accidental staging events.

---

## Internal Grouping

Uses:

    Map<string, FileChange[]>

Grouping key:

    topFolder(change.path)

---

## Inclusion Rules

Folders are only surfaced when:

    rows.length >= 5

Purpose:

Avoids noisy UI for small staged groups while still surfacing dangerous bulk-stage situations.

---

## Sorting Behavior

Groups are sorted descending by staged-file count.

Largest staged folder appears first.

---

# folderGroups State Projection

Inside `ChangeListsPanel`:

    const folderGroups = stagedFolderGroups(staged);

Purpose:

Creates a deterministic staged-folder recovery projection derived from staged Git truth.

---

# Bulk Recovery Section

## Rendering Conditions

The bulk recovery section renders only when:

    folderGroups.length > 0

---

## Purpose

The section exists to help users recover from accidental bulk staging situations.

Example cases include:

- downloaded media libraries
- generated output folders
- backups
- extracted archives
- temporary build folders

---

## UI Text

The section explicitly explains:

    You can remove a whole folder from the next commit without deleting the files.

This distinction is important because users may incorrectly assume unstaging removes files from disk.

---

# Bulk Recovery Actions

Each folder group renders:

- folder name
- staged file count
- grouped recovery button

Action:

    runFileAction("git_unstage_prefix", folder)

---

## Safety Characteristics

The grouped recovery workflow:

- only removes files from staging
- does not delete files
- does not restore working tree contents
- does not mutate unstaged file contents

This is intentionally recovery-oriented rather than destructive.

---

# Edge-Case Origin

This workflow originated from real-world accidental staging of large MP3 download folders during ChronoGit testing.

The resulting UX doctrine is:

    user mistakes are valuable edge-case discovery opportunities

The feature therefore exists as a hardened recovery surface rather than a theoretical Git abstraction.

---

# Updated Architectural Role

The panel now acts not only as a file-status viewer, but also as:

- accidental staging recovery surface
- grouped staging cognition layer
- bulk staged-folder safety workflow

This expands the panel from purely per-file interaction into grouped workflow recovery.

---

# Updated Mutation Boundaries

New delegated mutation request:

    git_unstage_prefix

The component still performs no direct Git execution itself.

All mutation requests remain parent-controlled.

---

# Updated Safety Systems

Additional safety surfaces now include:

- grouped staged-folder detection
- large-folder recovery warnings
- staged-file count visibility
- recovery-oriented language
- deterministic grouped recovery workflow

---

# Updated Known Gaps

Known gaps after this update:

- no nested folder hierarchy visualization
- no partial grouped unstage selection
- no file-extension grouping
- no automatic generated-folder detection
- no staged-size estimation
- no explicit "accidental bulk stage" heuristic scoring
- no inline confirmation dialog for grouped recovery
- no undo surface after grouped unstage
- no preview of affected files before grouped recovery

---

# Verification Notes for 2026-05-16 Update

This update is based on full-file inspection of:

- `src/panels/ChangeListsPanel.tsx`

The update specifically documents:

- grouped staged-folder detection
- staged prefix grouping
- bulk unstage workflows
- accidental staging recovery surfaces
- `git_unstage_prefix` action routing

No undocumented behavior has been inferred beyond directly visible source logic.

# Status

active
