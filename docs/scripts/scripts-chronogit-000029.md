Title: RemoteActionsPanel.tsx
ID: scripts-chronogit-000029
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: remote-workflow
Updated: 2026-05-07
Revision: 1

---

@role:ui-panel
@subsystem:remote-workflow
@entity:script:chronogit-app/src/panels/RemoteActionsPanel.tsx
@entity:/chronogit-app/src/panels/RemoteActionsPanel.tsx
@semantic:remote-actions
@semantic:remote-preview
@semantic:remote-safety-gate
@semantic:remote-sync
@semantic:merge-safety-prediction
@semantic:push-workflow
@semantic:pull-rebase-workflow
@semantic:confirmation-flow
@semantic:llm-explain-ui
@semantic:educational-ui
@state:active

# RemoteActionsPanel.tsx

**Date:** 2026-05-07
**Summary:** Remote workflow panel for ChronoGit. Provides fetch, push preview, pull/rebase preview, rebase abort access, remote preview truth rendering, merge-safety visualization, guarded confirmation flow, two-step upload acknowledgement, and advisory LLM explanation requests.
**Keywords:** remote actions, git fetch, git push preview, git pull preview, remote safety gate, merge safety, guarded sync
**Tags:** scripts, frontend, react, git, remote, push, pull, rebase, safety-gate

Remote preview and guarded remote action panel for ChronoGit.

---

## Purpose

`RemoteActionsPanel.tsx` provides ChronoGit’s primary frontend surface for remote repository workflows.

Responsibilities include:

- fetching remote knowledge
- loading upload/push previews
- loading download/pull previews
- exposing rebase abort control
- rendering remote operation preview truth
- rendering merge-safety predictions
- explaining remote operation consequences
- gating remote execution through confirmations
- requiring high-risk override text
- supporting two-step upload acknowledgement
- requesting advisory LLM explanation of remote previews

This panel is a remote-operation safety and preview surface.

---

# Architectural Role

This component belongs to ChronoGit’s remote workflow and remote safety-gate layer.

It does not execute Git commands directly.

It receives remote preview truth from parent/backend orchestration and dispatches remote operation requests through callbacks.

It functions as:

- remote preview projection layer
- guarded mutation request surface
- merge-safety visualization layer
- remote action confirmation router
- educational explanation surface

---

# Imported Runtime Types

Imports:

- `ConfirmAction`
- `ExplainContext`
- `RemoteOperationPreview`

from:

    ../core/chronogitRuntimeTypes

---

# Props Type

## Definition

Defines:

    type Props

Fields:

- `beginnerMode`
- `remoteBusy`
- `remotePreview`
- `fetchRemoteKnowledge`
- `loadRemotePreview`
- `abortRebase`
- `isUploadPreviewArmed`
- `setConfirmAction`
- `setConfirmText`
- `setArmedRemoteUploadKey`
- `setLastAction`
- `setMessage`
- `executePush`
- `executePullRebase`
- `explainUiContext`
- `uiExplainBusy`
- `llmModel`

---

## beginnerMode

Type:

    boolean

Purpose:

Controls beginner/pro terminology rendering.

---

## remoteBusy

Type:

    string

Purpose:

Indicates whether a remote action is currently active.

Used to disable top-level remote action buttons.

---

## remotePreview

Type:

    RemoteOperationPreview | null

Purpose:

Structured remote preview truth to render.

Null means no preview is currently loaded.

---

## fetchRemoteKnowledge

Type:

    () => Promise<void>

Purpose:

Requests remote-tracking knowledge refresh.

---

## loadRemotePreview

Type:

    (kind: "push" | "pull") => Promise<void>

Purpose:

Requests remote operation preview generation.

---

## abortRebase

Type:

    () => Promise<void>

Purpose:

Requests rebase abort workflow.

---

## isUploadPreviewArmed

Type:

    (preview: RemoteOperationPreview) => boolean

Purpose:

Determines whether the current upload preview has already been acknowledged and armed.

This supports two-step push execution.

---

## setConfirmAction

Type:

    (action: ConfirmAction | null) => void

Purpose:

Routes guarded remote actions through the shared confirmation modal.

---

## setConfirmText

Type:

    (text: string) => void

Purpose:

Resets or controls typed confirmation state.

---

## setArmedRemoteUploadKey

Type:

    (key: string) => void

Purpose:

Arms a specific upload preview after acknowledgement.

---

## setLastAction

Type:

    (text: string) => void

Purpose:

Updates session action summary text.

---

## setMessage

Type:

    (text: string) => void

Purpose:

Updates user-facing session message.

---

## executePush

Type:

    (preview: RemoteOperationPreview) => Promise<void>

Purpose:

Requests actual push execution after safety gating.

---

## executePullRebase

Type:

    (preview: RemoteOperationPreview) => Promise<void>

Purpose:

Requests actual pull/rebase execution after safety gating.

---

## explainUiContext

Type:

    (context: ExplainContext) => Promise<void>

Purpose:

Requests advisory LLM explanation for remote preview state.

---

## uiExplainBusy

Type:

    boolean

Purpose:

Disables advisory explanation requests while busy.

---

## llmModel

Type:

    string

Purpose:

Selected local LLM model.

If missing, the advisory explanation button is disabled.

---

# Local ui Helper

## Signature

    function ui(beginnerMode: boolean, beginner: string, pro: string)

Purpose:

Provides local beginner/pro terminology selection.

This component uses a local helper instead of receiving `ui` from props.

---

# mergeClassificationCondition

## Signature

    function mergeClassificationCondition(preview: RemoteOperationPreview)

Purpose:

Produces a short condition string for guarded remote confirmation bodies.

---

## Logic

If:

    preview.merge_safety.working_changes > 0

returns:

    Working tree not clean

Otherwise:

    No extra condition flags.

---

# remoteSafetyGateTitle

## Signature

    function remoteSafetyGateTitle(preview: RemoteOperationPreview)

Purpose:

Generates user-facing title text for remote safety gate state.

---

## Download Preview Titles

For operation:

    download_updates_preview

Rules:

- HIGH risk → `Download blocked by default`
- MEDIUM risk → `Download needs review first`
- otherwise → `Download appears low-risk`

---

## Upload Preview Titles

For upload preview:

- if `behind > 0` → `Upload does not resolve divergence`
- otherwise → `Upload appears straightforward`

---

# remoteSafetyGateText

## Signature

    function remoteSafetyGateText(preview: RemoteOperationPreview)

Purpose:

Generates explanatory safety-gate text for remote preview state.

---

## Download Preview Text

Rules:

- HIGH risk → same-path overlap and dirty working state can cause conflict
- MEDIUM risk → review first, clean/snapshot working changes if possible
- LOW risk → no same-path overlap or dirty working state detected

---

## Upload Preview Text

Rules:

- behind > 0 → upload can publish local commits but remote-only commits still exist
- otherwise → upload would publish local snapshots and working files should not change

---

# guardedRemoteActionTitle

## Signature

    function guardedRemoteActionTitle(preview: RemoteOperationPreview)

Purpose:

Generates confirmation modal title for guarded remote actions.

---

## Action Name Selection

If operation is download preview:

    Download updates

Otherwise:

    Upload snapshots

---

## Risk-Specific Titles

Rules:

- HIGH → `<action>: high-risk override required`
- MEDIUM → `<action>: confirmation required`
- LOW → `<action>: low-risk confirmation`

---

# guardedRemoteActionBody

## Signature

    function guardedRemoteActionBody(preview: RemoteOperationPreview)

Purpose:

Creates structured multiline confirmation text for remote operation confirmation.

---

## Body Includes

The generated body includes:

- requested action
- risk level
- classification
- merge/working condition
- ahead/behind state
- safety summary
- warning text

This body is intentionally structured and audit-like.

---

# guardedRemoteActionLabel

## Signature

    function guardedRemoteActionLabel(preview: RemoteOperationPreview)

Purpose:

Creates confirmation button labels based on merge-safety risk.

---

## Labels

Rules:

- HIGH → `I understand: override high-risk gate`
- MEDIUM → `Confirm medium-risk intention`
- LOW → `Confirm low-risk intention`

---

# remotePreviewKey

## Signature

    function remotePreviewKey(preview: RemoteOperationPreview)

Purpose:

Generates a deterministic string identity for a specific remote preview.

---

## Key Components

The key includes:

- operation
- branch
- upstream
- ahead count
- behind count
- commit count
- changed file status/path list

---

## Role

This key is used to arm exactly one upload preview.

If preview content changes, the key changes.

This prevents acknowledging one preview and accidentally executing another.

---

# RemoteActionsPanel Component

## Export

Exports:

    RemoteActionsPanel

---

# Root Container

Renders:

    <div className="cg-panel-content remote-actions-panel">

Purpose:

Panel root for remote workflow UI.

---

# Remote Action Buttons

Container:

    remote-actions-panel__buttons

Contains:

- Fetch remote knowledge
- Upload snapshots preview
- Download updates preview
- Abort rebase

---

## Busy State

All top-level remote action buttons are disabled when:

    remoteBusy !== ""

Purpose:

Prevents overlapping remote operations.

---

# Fetch Remote Knowledge

Button label:

- beginner: `Fetch remote knowledge`
- pro: `git fetch`

Invokes:

    fetchRemoteKnowledge

Purpose:

Updates remote-tracking information without executing push or pull.

---

# Upload Preview

Button label:

- beginner: `Upload snapshots preview`
- pro: `git push --dry-run`

Invokes:

    loadRemotePreview("push")

Purpose:

Loads preview of local commits to upload.

Note:

The label says dry-run, but this component only calls preview orchestration. Actual backend behavior must be verified in backend docs.

---

# Download Preview

Button label:

- beginner: `Download updates preview`
- pro: `git pull preview`

Invokes:

    loadRemotePreview("pull")

Purpose:

Loads preview of remote commits to download/rebase.

---

# Abort Rebase

Button class:

    danger-button

Label:

- beginner: `Abort rebase`
- pro: `git rebase --abort`

Invokes:

    abortRebase

Purpose:

Exposes recovery path for interrupted rebase states.

---

# Empty Preview State

If no preview exists:

    No remote preview loaded.

---

# Remote Preview Box

If `remotePreview` exists, renders:

    remote-preview-box

This becomes the main preview truth surface.

---

# Preview Truth Grid

Class:

    remote-preview-box__truth

Displays:

- operation
- branch
- upstream
- ahead/behind

Purpose:

Shows raw preview metadata before any remote mutation.

---

# Consequence Message

Displays:

    remotePreview.consequence

Purpose:

Explains what has or has not happened in the preview state.

---

# Warning Message

Displays:

    remotePreview.warning

Purpose:

Surfaces backend preview warning text.

---

# Merge Safety Section

Class:

    remote-merge-safety

Displays:

- merge safety classification
- summary
- warning
- risk level badge

---

## Risk Badge

Class format:

    merge-risk merge-risk--<risk_level_lowercase>

Text:

    RISK: <risk_level>

Purpose:

Visually exposes backend merge-safety prediction.

---

# Remote Safety Gate

Class format:

    remote-safety-gate remote-safety-gate--<risk_level_lowercase>

Displays:

- gate title
- gate text
- optional upload acknowledgement status
- LLM explanation button
- guarded action button

---

# Upload Acknowledgement State

Only applies when:

    remotePreview.operation === "upload_snapshots_preview"

Displays:

- `Preview acknowledged. Execute push is available.`
or:
- `Acknowledge preview first. No push happens yet.`

depending on:

    isUploadPreviewArmed(remotePreview)

---

# Advisory LLM Explanation

Button disabled when:

- `uiExplainBusy`
- no `llmModel`

Invokes:

    explainUiContext(...)

Context payload:

- kind: `remote`
- title: `Explain remote preview`
- plainText: preview consequence and warning
- rawTruth: JSON serialized remote preview

Purpose:

Requests local advisory explanation of remote preview state.

---

# Guarded Remote Confirmation Button

Clicking the guarded button constructs a `ConfirmAction`.

This routes remote execution through the shared confirmation modal.

---

# Confirmation Title Logic

If upload preview is already armed:

    Execute push: final confirmation

Otherwise:

    guardedRemoteActionTitle(preview)

---

# Confirmation Body Logic

If upload preview is already armed:

    This will upload local snapshots to the configured remote.
    ChronoGit will not force push.

Otherwise:

    guardedRemoteActionBody(preview)

---

# Confirmation Label Logic

If upload is already armed:

- beginner: `Execute upload`
- pro: `git push`

If upload is not armed:

- beginner: `Acknowledge preview only`
- pro: `ack preview`

If download preview:

    guardedRemoteActionLabel(preview)

---

# Confirmation Danger Logic

Danger is true when:

    preview.merge_safety.risk_level === "HIGH"

---

# Required Text Logic

If risk is HIGH:

    requiredText = "override"

Label:

    Type override to intentionally continue despite HIGH risk.

Purpose:

Adds explicit operator confirmation for high-risk remote workflows.

---

# Confirmed Action Behavior

Inside confirmation action:

## Download Preview

If:

    preview.operation === "download_updates_preview"

then:

    executePullRebase(preview)

---

## Upload Preview Not Armed

If upload preview is not armed:

- sets armed upload preview key
- sets last action to preview acknowledgement
- sets message explaining that push is now available
- does not execute push

This is the two-step upload safety gate.

---

## Upload Preview Armed

If upload preview is already armed:

    executePush(preview)

This performs the actual push through parent orchestration.

---

# Confirm Text Reset

After setting confirmation action:

    setConfirmText("")

Purpose:

Clears any stale typed confirmation state.

---

# Guarded Button Label

Button text reflects operation state:

- armed upload → execute upload/git push
- unarmed upload → acknowledge preview only/ack preview
- download → confirm download intention/git pull --rebase --autostash

---

# Preview Columns

Class:

    remote-preview-columns

Displays two columns:

- snapshots
- files

---

## Snapshots Column

Heading:

    Snapshots (<commit_count>)

Renders each commit as:

    <code>

using commit text as key.

---

## Files Column

Heading:

    Files (<changed_files.length>)

Renders each changed file as:

    <status> <path>

Key:

    `${file.status}-${file.path}`

---

# Truth, Projection, Mutation, and Advisory Boundaries

## Truth Inputs

Truth comes from:

- remotePreview
- remoteBusy
- parent orchestration callbacks

The preview itself is backend-derived structured state.

---

## Projection Logic

Projection logic includes:

- safety gate titles
- safety gate text
- risk badge classes
- confirmation body formatting
- upload acknowledgement text
- preview key generation

---

## Mutation Requests

Mutation requests include:

- fetch remote knowledge
- load preview
- abort rebase
- execute push
- execute pull/rebase

Actual Git mutation is delegated upward/backend.

---

## Preview Systems

Preview is central to this panel.

Remote operations are intentionally separated into:

- preview
- acknowledge/confirm
- execute

---

## Advisory Systems

Advisory system:

- local LLM explanation request for remote preview

LLM output remains advisory.

---

# Safety Systems

Safety surfaces include:

- busy-state disabling
- remote preview before execution
- merge-safety visualization
- risk badge
- high-risk typed override
- confirmation modal routing
- two-step upload acknowledgement
- exact-preview arming key
- no direct push from preview button
- danger styling for abort/high-risk paths
- explicit statement that force push is not used

---

# Remote Workflow Doctrine

This panel implements ChronoGit’s remote-safety doctrine:

Remote actions should not be blind.

The operator must see:

- what operation is being considered
- what commits are involved
- what files are involved
- whether local and remote have diverged
- whether merge risk exists
- what confirmation level is required

before mutation.

---

# Upload Safety Doctrine

Upload is intentionally two-step:

1. acknowledge preview
2. execute upload only for the exact acknowledged preview

This prevents accidental push after stale or changing remote preview state.

---

# Download Safety Doctrine

Download/pull-rebase requires confirmation and risk review.

For HIGH risk, typed override is required.

This reflects the fact that download/rebase may alter local history/worktree state.

---

# Separation of Concerns

This component handles:

- remote workflow rendering
- preview projection
- confirmation action construction
- advisory explanation request dispatch
- upload arming state coordination

It does not handle:

- Git command execution
- backend invocation
- remote preview computation
- merge-safety computation
- persistent logging
- actual confirmation modal rendering

---

# CSS Dependencies

Depends on external CSS classes including:

- cg-panel-content
- remote-actions-panel
- remote-actions-panel__buttons
- danger-button
- remote-preview-box
- remote-preview-box__truth
- remote-preview-box__message
- remote-preview-box__warning
- remote-merge-safety
- merge-risk
- merge-risk--low
- merge-risk--medium
- merge-risk--high
- remote-safety-gate
- remote-safety-gate--low
- remote-safety-gate--medium
- remote-safety-gate--high
- remote-preview-columns

No component-local CSS import exists.

---

# React Characteristics

This component:

- is prop-driven
- contains no hooks
- contains no local state
- constructs confirmation actions inline
- performs no direct backend calls
- dispatches async callbacks through props

---

# Current Known Gaps

- Local `ui` helper is defined inside this file instead of reused from app-level UI helper.
- Upload preview advanced label says `git push --dry-run`, but the component itself does not verify backend dry-run behavior.
- Pull preview advanced label says `git pull preview`, which is conceptual rather than a direct Git command.
- No cancellation of in-flight remote preview exists.
- No refresh timestamp is shown for remote preview.
- No remote URL is displayed.
- No branch protection visibility exists.
- No force-push option exists.
- No merge-base detail is shown.
- No per-file conflict probability detail exists.
- No stale preview expiry timer exists.
- No explicit operation-state banner exists inside this panel.

---

# Potential Future Expansion

Potential future improvements include:

- remote URL display
- preview timestamp and staleness detection
- merge-base visualization
- remote/local commit graph
- branch protection indicators
- per-file conflict risk explanations
- remote fetch result detail
- push dry-run backend verification surfacing
- preview invalidation on repository state change
- improved operation-state integration
- upstream configuration workflows
- remote branch creation workflows
- safer pull strategy selection

None currently exist.

---

# Design Characteristics

The panel is:

- remote-aware
- preview-first
- safety-gated
- educational
- mutation-delegating
- risk-visible
- LLM-advisory capable
- deterministic in preview rendering

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/RemoteActionsPanel.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
