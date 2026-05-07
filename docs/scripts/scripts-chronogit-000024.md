Title: CurrentStatePanel.tsx
ID: scripts-chronogit-000024
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: current-state
Updated: 2026-05-07
Revision: 1

---

@role:ui-panel
@subsystem:current-state
@entity:script:chronogit-app/src/panels/CurrentStatePanel.tsx
@entity:/chronogit-app/src/panels/CurrentStatePanel.tsx
@semantic:git-state-summary
@semantic:remote-status
@semantic:branch-state
@semantic:last-action
@semantic:session-feedback
@semantic:educational-ui
@state:active

# CurrentStatePanel.tsx

**Date:** 2026-05-07
**Summary:** Lightweight Git state summary panel for ChronoGit. Displays current remote synchronization state, human-readable remote explanation, active branch, last mutation/action summary, and latest status message using beginner/pro terminology projection.
**Keywords:** current state, remote status, branch summary, last action, Git overview
**Tags:** scripts, frontend, react, git-state, remote-status, branch, summary-panel

Compact Git state overview panel for ChronoGit.

---

## Purpose

`CurrentStatePanel.tsx` provides a lightweight summary projection of the current Git workspace state.

Responsibilities include:

- displaying remote synchronization state
- displaying human-readable remote interpretation
- displaying current branch identity
- displaying last action/mutation summary
- displaying latest informational message
- supporting beginner/pro terminology rendering

This panel functions as a compact high-level status surface.

---

# Architectural Role

This component belongs to ChronoGit’s state-summary and session-feedback layer.

It is a pure projection component.

It does not execute Git operations.

It does not mutate application state.

It receives already-derived Git and session state from parent orchestration and renders that information into a compact overview surface.

---

# Imported Runtime Types

Imports:

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
- `branch`
- `remote`
- `lastAction`
- `message`
- `remoteLabel`
- `remoteHuman`
- `ui`

---

## beginnerMode

Type:

    boolean

Purpose:

Controls beginner/pro terminology projection.

---

## branch

Type:

    string

Purpose:

Current active branch identifier.

Displayed as the current HEAD branch.

---

## remote

Type:

    GitRemoteStatus | null

Purpose:

Structured remote synchronization state.

Used to generate remote labels and human-readable explanations.

---

## lastAction

Type:

    string

Purpose:

Describes the latest mutation or workflow action performed in the session.

---

## message

Type:

    string

Purpose:

Displays the latest status or informational message.

---

## remoteLabel

Type:

    (remote: GitRemoteStatus | null) => string

Purpose:

Produces compact remote synchronization labels.

Examples may include:

- IN SYNC
- AHEAD
- BEHIND
- DIVERGED
- LOCAL ONLY

Actual label generation logic exists outside this component.

---

## remoteHuman

Type:

    (remote: GitRemoteStatus | null) => string

Purpose:

Produces human-readable explanation text for the current remote state.

This is part of ChronoGit’s educational projection layer.

---

## ui

Type:

    (beginnerMode: boolean, beginner: string, pro: string) => string

Purpose:

Provides beginner/pro terminology switching.

---

# Root Container

Renders:

    <div className="cg-panel-content">

Purpose:

Standard ChronoGit panel content wrapper.

---

# Remote State Heading

## Rendering

Displays:

    remoteLabel(remote)

inside:

    <h3>

Purpose:

Provides the highest-level synchronization state summary.

This is the primary status surface in the panel.

---

# Human Remote Explanation

## Rendering

Displays:

    remoteHuman(remote)

inside:

    <p>

Purpose:

Provides educational interpretation of remote synchronization state.

This separates:

- raw synchronization classification
from:
- human-readable meaning

---

# Branch Display

## Rendering

Displays:

- beginner: `Branch`
- pro: `HEAD branch`

Value:

    branch || "unknown"

---

## Purpose

Shows the currently active Git branch.

Fallback behavior:

If branch is empty or falsy:

    unknown

is displayed.

---

# Last Action Display

## Rendering

Displays:

- beginner: `Last action`
- pro: `last mutation`

Value:

    lastAction

---

## Purpose

Provides lightweight session mutation history visibility.

This is not a full audit log.

It is a compact latest-action surface.

---

# Message Display

## Rendering

Displays:

- beginner: `Message`
- pro: `last message`

Value:

    message || "No message yet."

---

## Purpose

Displays latest informational or workflow message.

Fallback behavior:

If no message exists:

    No message yet.

is displayed.

---

# Truth, Projection, Mutation, and Advisory Boundaries

## Truth Inputs

Truth inputs include:

- branch
- remote
- lastAction
- message

These are supplied externally by parent orchestration.

---

## Projection Logic

Projection logic includes:

- beginner/pro terminology selection
- remote label rendering
- remote human explanation rendering
- fallback text handling

---

## Mutation Behavior

This component performs no mutation.

No Git commands execute here.

No application state is modified here.

---

## Advisory Systems

This component does not directly interact with advisory LLM systems.

However, the human-readable remote explanation system contributes to ChronoGit’s educational/advisory UI doctrine.

---

# Educational UI Doctrine

This panel reflects ChronoGit’s beginner/pro dual-language model.

Examples:

- `Branch` vs `HEAD branch`
- `Last action` vs `last mutation`
- `Message` vs `last message`

The same Git/session truth is presented through different terminology layers.

---

# Separation of Concerns

This component handles:

- compact state rendering
- educational terminology projection
- remote-state summary display

It does not handle:

- Git execution
- remote classification generation
- branch detection
- logging
- persistence
- remote synchronization
- mutation workflows
- advisory LLM invocation

---

# CSS Dependencies

Depends on external CSS including:

- cg-panel-content

Additional inherited styling likely affects:

- h3
- p
- strong

No component-specific CSS file is imported.

---

# React Characteristics

This component:

- is fully prop-driven
- contains no local state
- contains no hooks
- contains no async logic
- contains no effects
- performs no backend calls

It is a pure render projection component.

---

# Current Known Gaps

- No visual status indicators/icons exist.
- No direct remote metrics are displayed.
- No ahead/behind counts are shown directly.
- No clickable actions exist.
- No branch switching exists.
- No timestamp exists for last action/message.
- No operation-state visibility exists.
- No merge/rebase/conflict visibility exists.
- No loading states exist.
- No structured formatting exists for long messages.

---

# Potential Future Expansion

Potential future improvements include:

- remote synchronization metrics
- ahead/behind counters
- operation-state badges
- branch graph summary
- clickable remote details
- conflict visibility
- last action timestamps
- structured event summaries
- session timeline integration
- warning severity indicators
- health-state coloring

None currently exist.

---

# Design Characteristics

The panel is:

- lightweight
- projection-focused
- educational
- non-interactive
- state-summary oriented
- deterministic in rendering

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/CurrentStatePanel.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
