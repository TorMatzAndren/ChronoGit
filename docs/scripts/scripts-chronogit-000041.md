Title: workspaceState.ts
ID: scripts-chronogit-000041
Date: 2026-05-16
Author: Matz
Type: scripts
Subsystem: workspace-ui
Updated: 2026-05-16
Revision: 1

---

@role:state-transformer
@subsystem:workspace-ui
@entity:script:chronogit-app/src/core/workspaceState.ts
@entity:/chronogit-app/src/core/workspaceState.ts
@entity:script:chronogit-app/src/core/chronogitWorkspaceTypes.ts
@entity:script:chronogit-app/src/core/workspaceLayout.ts
@semantic:workspace-state
@semantic:tab-management
@semantic:panel-management
@semantic:panel-layout
@semantic:deterministic-state-transform
@semantic:workspace-ui
@state:active

# workspaceState.ts

**Date:** 2026-05-16
**Summary:** Pure workspace state transformation helper module for ChronoGit. Provides deterministic functions for repository path updates, active-tab mutation, tab creation/renaming/closing, panel creation/closing, and snapped panel move/resize operations.
**Keywords:** workspace state, tabs, panels, layout, state transformer, workspace UI, panel movement, panel resize
**Tags:** scripts, frontend, typescript, workspace-ui, state, layout, panels, tabs

Pure workspace state transformation helper module for ChronoGit.

---

## Purpose

`workspaceState.ts` contains reusable pure state transformation helpers for ChronoGit workspace state.

It operates on an `AppStateLike` structure containing:

- active tab ID
- beginner mode flag
- repository path
- workspace tabs

The file exists to move workspace mutation logic out of root UI components and into deterministic helper functions.

---

## Architectural Role

This module is part of the workspace UI state layer.

It does not render UI.

It does not call the backend.

It does not query Git.

It does not persist state.

It transforms supplied state objects into new state objects.

The broader flow is:

    App workspace state
    → workspaceState helper
    → updated App workspace state
    → rendered workspace panels

---

## Imported Dependencies

Imports types from:

    ./chronogitWorkspaceTypes

Imported types:

- `PanelType`
- `WorkspaceTab`

Imports layout helpers from:

    ./workspaceLayout

Imported helpers:

- `makePanel`
- `snap`

---

## AppStateLike

Internal type:

    type AppStateLike

Fields:

- `activeTabId`
- `beginnerMode`
- `repoPath`
- `tabs`

Purpose:

Defines the minimum state shape required by this module.

The helper functions do not require the full application component state.

---

# Exported State Functions

## setRepoPath

Signature:

    setRepoPath(state, repoPath)

Purpose:

Returns a new state object with updated repository path.

Behavior:

- preserves all existing state
- replaces `repoPath`

No refresh or backend call occurs here.

---

## updateActiveTab

Signature:

    updateActiveTab(state, mutator)

Purpose:

Applies a tab mutator to the currently active tab.

Behavior:

- maps all tabs
- applies `mutator` only where `tab.id === state.activeTabId`
- preserves other tabs unchanged

This is the shared primitive used by several panel helpers.

---

## addTab

Signature:

    addTab(state)

Purpose:

Creates a new workspace tab and makes it active.

Behavior:

- generates an ID from current time and random suffix
- creates a tab named `Tab N`
- initializes it with one `current-state` panel
- sets `activeTabId` to the new tab

Panel creation uses:

    makePanel("current-state")

---

## renameTab

Signature:

    renameTab(state, tabId, name)

Purpose:

Returns state with the selected tab renamed.

Behavior:

- maps tabs
- replaces `name` only on matching `tabId`
- preserves all panel layout state

---

## closeTab

Signature:

    closeTab(state, tabId)

Purpose:

Closes a workspace tab when more than one tab exists.

Behavior:

- refuses to close the last remaining tab
- removes matching tab
- if the active tab was closed, activates the first remaining tab
- otherwise preserves current active tab

---

## addPanel

Signature:

    addPanel(state, type)

Purpose:

Adds a new panel to the active tab.

Behavior:

- delegates active-tab mutation to `updateActiveTab`
- appends `makePanel(type, tab.panels.length)`

Panel defaults and positioning are owned by `workspaceLayout.ts`.

---

## closePanel

Signature:

    closePanel(state, panelId)

Purpose:

Closes a panel in the active tab.

Behavior:

- refuses to remove the last remaining panel in a tab
- removes matching panel otherwise

This preserves a minimum visible workspace surface.

---

## movePanel

Signature:

    movePanel(state, panelId, x, y)

Purpose:

Moves a panel inside the active tab.

Behavior:

- clamps coordinates to zero or greater
- snaps coordinates through `snap`
- updates only the matching panel

This keeps panel movement aligned to the ChronoGit layout grid.

---

## resizePanel

Signature:

    resizePanel(state, panelId, w, h)

Purpose:

Resizes a panel inside the active tab.

Behavior:

- clamps width to minimum `240`
- clamps height to minimum `140`
- snaps dimensions through `snap`
- updates only the matching panel

This keeps panel sizing bounded and grid-aligned.

---

# Mutation Boundary

This module does not mutate the supplied state object in place.

Every exported function returns a new state object.

The functions are suitable for React state updates.

---

# Backend Boundary

This module performs no backend calls.

No Tauri commands are invoked.

No Git commands are executed.

---

# Persistence Boundary

This module does not read or write localStorage.

Persistence is owned by the root application layer.

---

# Layout Boundary

This module delegates panel construction and grid snapping to:

- `makePanel`
- `snap`

It does not define panel defaults itself.

---

# Deterministic Characteristics

Most transformations are deterministic given the same inputs.

Exception:

- `addTab` generates a time/random-based tab ID

The generated ID exists only to prevent UI key collisions.

---

# Current Known Gaps

- `addTab` uses `Date.now()` and `Math.random()`, so IDs are not reproducible.
- `closeTab` always falls back to the first remaining tab rather than nearest neighbor.
- `addPanel` does not check whether a panel of the same type already exists.
- No helper exists here for `openOrAddPanel`.
- No helper exists for reordering panels.
- No helper exists for moving panels between tabs.
- Minimum panel dimensions are hardcoded here rather than imported from a shared constant.
- The module is currently a helper layer only; adoption by `App.tsx` may be partial.

---

# Verification Notes

This document is based on full-file inspection of:

- `src/core/workspaceState.ts`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
