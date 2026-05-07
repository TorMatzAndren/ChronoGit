Title: CommitPreflightPanel.tsx
ID: scripts-chronogit-000023
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: snapshot-workflow
Updated: 2026-05-07
Revision: 1

---

@role:ui-panel
@subsystem:snapshot-workflow
@entity:script:chronogit-app/src/panels/CommitPreflightPanel.tsx
@entity:/chronogit-app/src/panels/CommitPreflightPanel.tsx
@semantic:commit-preflight
@semantic:commit-boundary
@semantic:staged-files
@semantic:working-tree
@semantic:snapshot-review
@semantic:risk-summary
@semantic:llm-explain-ui
@semantic:educational-ui
@state:active

# CommitPreflightPanel.tsx

**Date:** 2026-05-07
**Summary:** Commit boundary overview panel for ChronoGit. Summarizes staged versus working-tree changes, highlights risky prepared files, provides advisory LLM explanation access, and opens the full snapshot preflight modal before commit creation.
**Keywords:** commit preflight, staged files, commit boundary, snapshot review, risk warnings, working tree excluded
**Tags:** scripts, frontend, react, git, commit, snapshot, preflight, staged-files

Commit boundary overview panel for ChronoGit.

---

## Purpose

`CommitPreflightPanel.tsx` provides a compact commit/snapshot boundary overview before a full preflight modal is opened.

Responsibilities include:

- showing what is prepared for the next commit
- showing what working-folder changes are excluded
- counting visible changes
- counting risky prepared files
- surfacing prepared-file warnings
- opening the snapshot preflight modal
- requesting advisory LLM explanation of the preflight state
- presenting beginner/pro terminology

This panel is an early review surface before the final snapshot confirmation modal.

---

# Architectural Role

This component belongs to ChronoGit’s snapshot workflow and commit-boundary projection layer.

It does not execute commits directly.

It does not mutate Git state.

It receives staged and working-tree truth from parent orchestration and projects that truth into a commit-boundary summary.

---

# Imported Runtime Types

Imports:

- `ExplainContext`
- `FileChange`
- `GitRemoteStatus`

from:

    ../core/chronogitRuntimeTypes

---

# Props Type

## Definition

Defines:

    type Props

Fields:

- `beginnerMode`
- `staged`
- `working`
- `remote`
- `llmModel`
- `uiExplainBusy`
- `explainUiContext`
- `openSnapshotPreflight`
- `snapshotRemoteSentence`
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

List of files currently prepared for the next commit.

This is the primary commit-boundary input.

---

## working

Type:

    FileChange[]

Purpose:

List of working-folder changes visible in Git status.

These are explicitly presented as excluded from the next commit unless prepared.

---

## remote

Type:

    GitRemoteStatus | null

Purpose:

Remote synchronization state used to explain snapshot remote consequences.

---

## llmModel

Type:

    string

Purpose:

Current local LLM model selection.

When empty, the LLM explanation button is disabled.

---

## uiExplainBusy

Type:

    boolean

Purpose:

Indicates whether UI explanation generation is busy.

Disables advisory LLM explanation requests while active.

---

## explainUiContext

Type:

    (context: ExplainContext) => Promise<void>

Purpose:

Requests advisory LLM explanation for the current preflight state.

---

## openSnapshotPreflight

Type:

    () => Promise<void>

Purpose:

Opens the full snapshot preflight modal through parent orchestration.

---

## snapshotRemoteSentence

Type:

    (remote: GitRemoteStatus | null) => string

Purpose:

Produces remote-consequence explanation text.

---

## ui

Type:

    (beginnerMode: boolean, beginner: string, pro: string) => string

Purpose:

Maps beginner-facing terminology to advanced Git terminology.

---

# Derived State

## stagedCount

Definition:

    const stagedCount = staged.length

Purpose:

Counts prepared files included in the next commit.

---

## workingCount

Definition:

    const workingCount = working.length

Purpose:

Counts working-tree changes excluded from the next commit.

---

## totalCount

Definition:

    const totalCount = stagedCount + workingCount

Purpose:

Counts all visible file changes.

---

## riskyPrepared

Definition:

    staged.filter((file) => ["critical", "danger", "evidence"].includes(file.risk))

Purpose:

Identifies staged files requiring attention before commit creation.

Risk categories included:

- `critical`
- `danger`
- `evidence`

---

# Root Panel Container

Renders:

    <div className="cg-panel-content cg-preflight-panel">

Purpose:

Panel content wrapper for the commit preflight overview.

---

# Hero Surface

## Container

Renders:

    cg-surface-card cg-surface-card--hero

Purpose:

Primary explanatory surface for the commit boundary.

---

## Eyebrow

Displays:

- beginner: `Commit boundary`
- pro: `index boundary`

Purpose:

Introduces the boundary between prepared and unprepared changes.

---

## Heading

Displays:

- beginner: `Next snapshot contains`
- pro: `git diff --cached --stat`

Purpose:

Maps the educational snapshot concept to the raw Git staged-diff concept.

---

## Explanation Text

Beginner text:

    Only prepared files are included. Working-folder changes stay outside this snapshot.

Advanced text:

    Only index/staged paths are committed. Worktree paths are excluded.

Purpose:

Clarifies Git’s staged/index commit boundary.

---

# Action Row

## LLM Explanation Button

Disabled when:

- `uiExplainBusy`
- no `llmModel`

Invokes:

    explainUiContext(...)

Context payload:

- kind: `preflight`
- title: `Explain Snapshot Preflight`
- plainText: `Snapshot Preflight reviews only files prepared for the next commit.`
- rawTruth: JSON serialized `staged` and `working`

Purpose:

Requests advisory explanation from the local LLM.

---

## Snapshot Review Button

Class:

    confirm

Disabled when:

    !stagedCount

Invokes:

    openSnapshotPreflight

Purpose:

Opens the full preflight modal only when at least one file is staged.

---

## Snapshot Review Label

Beginner label:

    Review snapshot / Git commit (<stagedCount>)

Advanced label:

    git commit

---

# Metric Grid

## Container

Renders:

    cg-metric-grid

Purpose:

Summarizes commit boundary state.

---

## Metric: Prepared Files

Displays:

- `stagedCount`
- beginner: `prepared files`
- pro: `staged files`

---

## Metric: Excluded Working Changes

Displays:

- `workingCount`
- beginner: `excluded working changes`
- pro: `worktree excluded`

---

## Metric: Prepared Warnings

Displays:

- `riskyPrepared.length`
- beginner: `prepared warnings`
- pro: `risk flags`

---

## Metric: Visible Changes

Displays:

- `totalCount`
- beginner: `visible changes`
- pro: `status entries`

---

# Status Callout

## Class Selection

If risky prepared files exist:

    cg-status-callout cg-status-callout--warning

Otherwise:

    cg-status-callout cg-status-callout--ok

Purpose:

Provides immediate visual commit readiness feedback.

---

## Warning Title

When risky prepared files exist:

- beginner: `Review prepared warnings before committing`
- pro: `risk flags in index`

---

## Clean Title

When no risky prepared files exist:

- beginner: `No dangerous prepared files detected`
- pro: `index risk clean`

---

# Warning Detail Text

If risky prepared files exist, displays joined risk/path text:

    <risk>: <path> · <risk>: <path>

Purpose:

Summarizes staged warning files directly inside the panel.

---

# Clean Remote Context

If no risky prepared files exist, displays:

    snapshotRemoteSentence(remote)

Purpose:

Shows local/remote consequence context when risk warnings do not occupy the callout.

---

# Truth, Projection, Mutation, and Advisory Boundaries

## Truth Inputs

Truth inputs:

- `staged`
- `working`
- `remote`

These are supplied by parent orchestration from backend-derived Git state.

---

## Projection Logic

Projection logic includes:

- staged count
- working count
- total count
- risky prepared filtering
- beginner/pro terminology mapping
- callout class selection
- warning summary text

---

## Mutation Systems

This component does not execute mutation.

It only exposes a button to open the snapshot preflight workflow.

Commit execution is handled elsewhere.

---

## Preview Systems

This panel is a preview/summary surface for commit boundaries.

The full preflight modal performs deeper final review.

---

## Advisory Systems

Advisory behavior includes:

- local LLM preflight explanation request

LLM explanation is not authoritative.

---

# Safety Systems

Safety surfaces include:

- disabled commit review when no staged files exist
- risky prepared-file warning count
- warning callout for staged danger/evidence/critical files
- explicit staged/worktree boundary explanation
- remote consequence explanation when clean
- LLM button disabled when unavailable or busy

---

# Educational UI Doctrine

This panel expresses ChronoGit’s beginner/pro dual-language model.

It teaches:

- prepared files vs staged/index files
- working-folder changes vs worktree
- snapshots vs commits
- commit boundary visibility

without hiding raw Git meaning.

---

# Separation of Concerns

This component handles:

- commit-boundary rendering
- metric projection
- warning summary
- LLM explanation request dispatch
- preflight modal opening dispatch

It does not handle:

- Git command execution
- staged-state creation
- commit creation
- risk classification generation
- backend invocation
- persistence
- remote synchronization

---

# CSS Dependencies

Depends on external CSS classes including:

- cg-panel-content
- cg-preflight-panel
- cg-surface-card
- cg-surface-card--hero
- cg-eyebrow
- cg-action-row
- confirm
- cg-metric-grid
- cg-metric-card
- cg-status-callout
- cg-status-callout--warning
- cg-status-callout--ok

All styling is externalized.

---

# React Characteristics

This component:

- is fully prop-driven
- contains no local state
- contains no effects
- performs no direct backend calls
- dispatches async callbacks through props

---

# Current Known Gaps

- Risk categories are hardcoded to `critical`, `danger`, and `evidence`.
- No direct file list is shown here; only counts and warning summaries.
- No diff preview exists in this panel.
- No commit message field exists here; it is owned by the modal.
- No signed-commit or author visibility exists.
- No branch target display exists.
- No detailed preflight statistics beyond counts exist here.
- No explicit loading state exists for opening preflight.
- No explicit LLM explanation progress surface exists here beyond button disabling.

---

# Potential Future Expansion

Potential future improvements include:

- staged file preview list
- commit message draft preview
- branch/HEAD target visibility
- author/signature visibility
- signed commit status
- hunk-level preflight
- generated-file highlighting
- dependency-file highlighting
- commit size thresholds
- semantic risk scoring
- preflight provenance record

None currently exist.

---

# Design Characteristics

The panel is:

- commit-boundary focused
- educational
- risk-aware
- preview-oriented
- mutation-delegating
- LLM-advisory capable
- deterministic in metrics

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/CommitPreflightPanel.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
