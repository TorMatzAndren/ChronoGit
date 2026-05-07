Title: RemoteStatusPanel.tsx
ID: scripts-chronogit-000030
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: remote-workflow
Updated: 2026-05-07
Revision: 1

---

@role:ui-panel
@subsystem:remote-workflow
@entity:script:chronogit-app/src/panels/RemoteStatusPanel.tsx
@entity:/chronogit-app/src/panels/RemoteStatusPanel.tsx
@semantic:remote-status
@semantic:remote-awareness-ui
@semantic:branch-state
@semantic:upstream-tracking
@semantic:ahead-behind
@semantic:remote-url
@semantic:git-truth-projection
@state:active

# RemoteStatusPanel.tsx

**Date:** 2026-05-07
**Summary:** Compact remote status panel for ChronoGit. Displays remote synchronization label, active branch, upstream tracking branch, ahead/behind counts, and remote URL from structured Git remote status truth.
**Keywords:** remote status, upstream branch, ahead behind, remote url, git remote, synchronization state
**Tags:** scripts, frontend, react, git, remote-status, upstream, branch

Compact remote synchronization status panel for ChronoGit.

---

## Purpose

`RemoteStatusPanel.tsx` provides a compact projection of repository remote-tracking state.

Responsibilities include:

- displaying remote synchronization label
- displaying active branch
- displaying upstream branch
- displaying ahead/behind counts
- displaying remote URL
- providing local-only fallback text when remote data is missing

This panel acts as a focused remote truth summary.

---

# Architectural Role

This component belongs to ChronoGit’s remote-awareness UI layer.

It does not execute remote operations.

It does not fetch remote data.

It does not mutate Git state.

It receives already-derived remote truth from parent orchestration and projects it into a small status panel.

---

# Imported Runtime Types

Imports:

- `GitRemoteStatus`

from:

    ../core/chronogitRuntimeTypes

---

# Props Type

Defines:

    type Props

Fields:

- `branch`
- `remote`
- `remoteLabel`

---

## branch

Type:

    string

Purpose:

Fallback active branch name when remote branch data is unavailable.

---

## remote

Type:

    GitRemoteStatus | null

Purpose:

Structured remote status truth.

May be null when remote status has not loaded or no remote state is available.

---

## remoteLabel

Type:

    (remote: GitRemoteStatus | null) => string

Purpose:

Produces compact remote synchronization label from remote status data.

The label-generation logic is owned outside this component.

---

# RemoteStatusPanel Component

## Export

Exports:

    RemoteStatusPanel

---

# Root Container

Renders:

    <div className="cg-panel-content">

Purpose:

Standard ChronoGit panel content wrapper.

No component-specific CSS import exists.

---

# Remote Label Heading

Renders:

    <h3>{remoteLabel(remote)}</h3>

Purpose:

Displays the primary remote synchronization state.

Examples may include:

- LOCAL ONLY
- IN SYNC
- AHEAD
- BEHIND
- DIVERGED

Actual labels depend on external `remoteLabel` implementation.

---

# Branch Display

Renders:

    <strong>Branch:</strong> {remote?.branch || branch || "unknown"}

Purpose:

Displays active branch identity.

Fallback order:

1. `remote.branch`
2. `branch`
3. `unknown`

---

# Upstream Display

Renders:

    <strong>Upstream:</strong> {remote?.upstream || "none"}

Purpose:

Displays configured upstream tracking branch.

Fallback:

    none

---

# Ahead / Behind Display

Renders:

    +{remote?.ahead ?? 0} / -{remote?.behind ?? 0}

Purpose:

Displays synchronization counts relative to upstream.

Fallback values:

- ahead: `0`
- behind: `0`

---

# Remote URL Display

Renders:

    <code>{remote?.remote_url || "No remote URL detected"}</code>

Purpose:

Displays configured remote URL when present.

Fallback:

    No remote URL detected

---

# Truth, Projection, Mutation, and Advisory Boundaries

## Truth Inputs

Truth inputs include:

- `remote`
- `branch`

These are provided by parent orchestration.

The panel does not query Git.

---

## Projection Logic

Projection logic includes:

- remote label rendering
- fallback branch selection
- upstream fallback
- ahead/behind fallback counts
- remote URL fallback

---

## Mutation Systems

None.

This panel performs no remote mutation.

It does not fetch, push, pull, rebase, or modify repository state.

---

## Preview Systems

None.

This panel does not preview remote operations.

Remote preview behavior exists in separate remote workflow components.

---

## Advisory Systems

None.

No LLM explanation is invoked here.

---

# Relationship to Remote Workflow

This panel is a read-only remote-status surface.

It complements but does not replace:

- remote action panels
- remote preview panels
- merge-safety systems
- guarded push/pull workflows

---

# Relationship to Git Truth

The component displays structured Git remote state already extracted elsewhere.

It does not treat UI state as authoritative over Git.

It only projects supplied Git-derived values.

---

# Local-Only Behavior

If no remote URL is available, the component explicitly renders:

    No remote URL detected

If no upstream exists, it renders:

    none

This supports ChronoGit’s local-only repository visibility doctrine.

---

# React Characteristics

This component:

- is fully prop-driven
- contains no hooks
- contains no local state
- performs no async work
- performs no backend calls
- performs no persistence

It is a pure render projection component.

---

# CSS Dependencies

Uses CSS class:

- cg-panel-content

No component-specific stylesheet is imported.

Additional styling is inherited from global/app styles.

---

# Current Known Gaps

- No beginner/pro terminology mapping exists in this panel.
- No remote name is displayed separately.
- No `has_remote` boolean is shown.
- No `is_diverged` boolean is shown directly.
- No `is_clean` state is shown directly.
- No fetch timestamp is displayed.
- No remote preview/action buttons exist here.
- No operation-state/conflict visibility exists.
- No advisory explanation button exists.
- No copy button exists for remote URL.
- No remote URL sanitization/redaction is performed before display.

---

# Potential Future Expansion

Potential future improvements include:

- remote name display
- upstream health display
- fetch timestamp
- copy remote URL button
- remote URL redaction options
- branch tracking warnings
- detached HEAD handling
- no-upstream setup guidance
- direct link to remote actions panel
- local-only repository guidance
- advisory explanation button
- remote status history

None currently exist.

---

# Design Characteristics

The panel is:

- compact
- read-only
- remote-aware
- truth-projection focused
- local-only aware
- deterministic in fallback behavior

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/RemoteStatusPanel.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
