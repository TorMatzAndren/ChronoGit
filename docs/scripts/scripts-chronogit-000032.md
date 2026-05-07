Title: StatusPanel.tsx
ID: scripts-chronogit-000032
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: status-surface
Updated: 2026-05-07
Revision: 1

---

@role:ui-panel
@subsystem:status-surface
@entity:script:chronogit-app/src/panels/StatusPanel.tsx
@entity:/chronogit-app/src/panels/StatusPanel.tsx
@semantic:status-panel
@semantic:git-state-surface
@semantic:refresh-control
@semantic:educational-ui
@semantic:app-state-refresh
@semantic:branch-awareness
@semantic:git-version-display
@state:active

# StatusPanel.tsx

**Date:** 2026-05-07
**Summary:** Compact status surface for ChronoGit. Displays Git version, active branch, last refresh state, and refresh controls with educational tooltip support and optional inline help content.
**Keywords:** status panel, git version, branch status, refresh state, repository refresh, educational UI
**Tags:** scripts, frontend, react, git, status, refresh, workspace

Compact application and repository state summary panel for ChronoGit.

---

## Purpose

`StatusPanel.tsx` provides a small high-level repository/application status surface.

Responsibilities include:

- displaying Git version
- displaying current branch
- displaying refresh state
- exposing refresh controls
- rendering beginner-oriented tooltip guidance
- rendering optional contextual help content

This panel acts as a compact operational status and refresh surface.

---

# Architectural Role

This component belongs to ChronoGit’s status projection and refresh-control layer.

It does not load repository state itself.

It does not query Git directly.

It does not mutate repository files.

It receives already-derived application/repository state from parent orchestration and projects it into a compact UI surface.

---

# Imported Types

Imports:

- `ReactNode`

from:

    react

Purpose:

Allows arbitrary inline help content injection through props.

---

# Props Type

Defines:

    type Props

Fields:

- `gitVersion`
- `branch`
- `lastRefresh`
- `onRefresh`
- `beginnerTitle`
- `actionHelp`

---

## gitVersion

Type:

    string

Purpose:

Displays currently detected Git version.

---

## branch

Type:

    string

Purpose:

Displays currently active branch.

---

## lastRefresh

Type:

    string

Purpose:

Displays latest refresh state or refresh timestamp text.

If empty, fallback text is rendered.

---

## onRefresh

Type:

    () => void

Purpose:

Requests refresh/reload of application state.

The component itself performs no reload logic.

---

## beginnerTitle

Type:

    (text: string) => string | undefined

Purpose:

Provides tooltip/title generation for beginner help surfaces.

Used by the refresh button.

---

## actionHelp

Type:

    ReactNode

Purpose:

Allows external injection of contextual help UI beside refresh controls.

This supports composable help surfaces.

---

# StatusPanel Component

## Export

Exports:

    StatusPanel

---

# Root Container

Renders:

    <div className="status-box">

Purpose:

Primary compact status surface container.

---

# Git Version Section

Renders label:

    Git

Displays:

    gitVersion

Purpose:

Shows detected Git runtime version.

---

# Branch Section

Renders label:

    Branch

Displays:

    branch

Purpose:

Shows currently active branch name.

---

# State Section

Renders label:

    State

Displays:

    lastRefresh || "not refreshed yet"

Purpose:

Shows refresh status or refresh timestamp information.

Fallback:

    not refreshed yet

---

# Refresh Controls

Container:

    button-with-help

Contains:

- refresh button
- optional help node

---

# Refresh Button

Class:

    status-refresh-button

Text:

    Refresh app state

Invokes:

    onRefresh

Purpose:

Requests reload of repository/application truth surfaces.

---

# Beginner Tooltip

Refresh button title uses:

    beginnerTitle(...)

Tooltip text:

    Refresh app state

    Reloads repository status, remote awareness, and Time Machine history. This does not change files.

Purpose:

Provides educational explanation of refresh behavior.

---

# actionHelp Injection Surface

Renders:

    {actionHelp}

Purpose:

Allows parent-level injection of contextual help UI beside the refresh button.

This makes the panel extensible without embedding help-system logic directly.

---

# Truth, Projection, Mutation, and Advisory Boundaries

## Truth Inputs

Truth inputs include:

- `gitVersion`
- `branch`
- `lastRefresh`

These are externally managed.

The component itself performs no Git inspection.

---

## Projection Logic

Projection logic includes:

- refresh fallback text
- label rendering
- tooltip rendering
- inline help projection

---

## Mutation Requests

The only mutation-style request is:

    onRefresh

However:

- the component does not itself mutate repository files
- refresh is described as non-mutating
- tooltip explicitly states files are not changed

---

## Advisory Systems

No LLM advisory system exists.

Educational behavior is limited to tooltip guidance and optional injected help UI.

---

# Refresh Doctrine

The tooltip explicitly reinforces ChronoGit’s truth-refresh doctrine:

Refreshing should:

- reload repository truth
- reload remote awareness
- reload Time Machine history
- avoid mutating files

This distinguishes inspection from mutation.

---

# Time Machine Awareness

The tooltip explicitly references:

    Time Machine history

This connects the panel to ChronoGit’s historical inspection architecture.

---

# React Characteristics

This component:

- is fully prop-driven
- contains no hooks
- contains no local state
- performs no async work
- performs no backend calls
- performs no persistence

It is a pure status projection surface.

---

# CSS Dependencies

Depends on CSS classes:

- status-box
- status-box__label
- button-with-help
- status-refresh-button

No component-local stylesheet is imported.

---

# Current Known Gaps

- No remote-awareness display exists directly in this panel.
- No repository path display exists.
- No operation-state display exists.
- No conflict-state display exists.
- No refresh spinner/loading state exists.
- No refresh duration metrics exist.
- No Git executable path visibility exists.
- No Git health/error state exists.
- No refresh failure handling exists.
- No detached HEAD visibility exists.
- No Time Machine statistics exist.
- No auto-refresh visibility exists.
- No local-vs-remote freshness distinction exists.

---

# Potential Future Expansion

Potential future improvements include:

- refresh timestamps
- refresh duration metrics
- loading indicator
- operation-state banner
- conflict detection surface
- repository health indicator
- Git executable diagnostics
- auto-refresh visibility
- refresh failure notifications
- repository path display
- remote synchronization summary
- Time Machine statistics
- inline diagnostic actions
- background refresh queue visibility

None currently exist.

---

# Design Characteristics

The panel is:

- compact
- informational
- refresh-oriented
- educational
- composable
- deterministic in rendering
- non-mutating by design

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/StatusPanel.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
