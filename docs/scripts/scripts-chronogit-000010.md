Title: TabBar.tsx
ID: scripts-chronogit-000010
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: tabs
Updated: 2026-05-07
Revision: 1

---

@role:tab-ui
@subsystem:tabs
@entity:script:chronogit-app/src/tabs/TabBar.tsx
@entity:/chronogit-app/src/tabs/TabBar.tsx
@semantic:workspace-tabs
@semantic:tab-navigation
@semantic:tab-selection
@semantic:tab-management
@semantic:workspace-navigation
@semantic:tab-rename
@semantic:tab-close
@semantic:tab-add
@state:active

# TabBar.tsx

**Date:** 2026-05-07
**Summary:** Workspace tab navigation component for ChronoGit. Provides tab rendering, active-tab selection, tab rename controls, tab closing behavior, and new-tab creation controls for the multi-workspace layout system.
**Keywords:** tabs, workspace tabs, tab navigation, tab management, workspace navigation, tab UI
**Tags:** scripts, frontend, tabs, workspace, navigation, ui, workspace-layout

Workspace tab navigation surface for ChronoGit.

---

## Purpose

`TabBar.tsx` provides the workspace tab management UI for ChronoGit.

Responsibilities include:

- rendering workspace tabs
- active tab highlighting
- tab selection
- tab renaming
- tab closing
- new-tab creation

This component acts as the navigation layer for multiple workspace layouts.

---

## Architectural Role

This file provides the workspace-level navigation surface.

It allows ChronoGit to maintain multiple independent workspace tabs containing separate panel layouts.

The component itself does not manage workspace state.

It only renders and dispatches workspace tab interactions.

---

## Imported Dependencies

Imports:

- `WorkspaceTab`
- `TabBar.css`

---

## CSS Dependency

Imports:

    ./TabBar.css

All visual styling for the tab system is externalized into CSS.

---

# Component Structure

## Exported Component

Exports:

    TabBar

Signature:

    export function TabBar(...)

The component is fully prop-driven.

No internal React state exists.

---

# Props Contract

## Workspace State Props

Props:

- `tabs`
- `activeTabId`

Purpose:

Provide current workspace tab state and active-tab identity.

---

## Interaction Props

Interaction callbacks:

- `onSelectTab`
- `onAddTab`
- `onRenameTab`
- `onCloseTab`

Purpose:

Dispatch workspace tab actions to higher-level state management systems.

---

# Root Navigation Element

## Root Element

Rendered root:

    <nav className="chronogit-tabbar">

Accessibility attribute:

    aria-label="ChronoGit workspace tabs"

Purpose:

Defines the tab system as a navigation surface.

---

# Tabs Container

## Tabs Wrapper

Class:

    chronogit-tabbar__tabs

Purpose:

Contains the rendered workspace tab list.

---

# Tab Rendering

## Dynamic Tab Mapping

Tabs rendered through:

    tabs.map(...)

Each workspace tab becomes a rendered tab entry.

---

## Tab Root Element

Class:

    chronogit-tab

Conditional modifier:

    chronogit-tab--active

---

## Active Tab Detection

Active state logic:

    tab.id === activeTabId

Purpose:

Visually identifies the active workspace tab.

---

# Tab Selection

## Select Button

Class:

    chronogit-tab__select

Handler:

    onSelectTab(tab.id)

Rendered text:

    tab.name

Purpose:

Activates the selected workspace tab.

---

# Tab Rename Control

## Rename Button

Class:

    chronogit-tab__rename

Rendered symbol:

    ✎

Title attribute:

    Rename tab

Handler:

    onRenameTab(tab.id)

Purpose:

Triggers tab rename workflow.

---

# Tab Close Control

## Close Button

Class:

    chronogit-tab__close

Rendered symbol:

    ×

Purpose:

Closes workspace tabs.

---

## Close Protection

Condition:

    tabs.length <= 1

Behavior:

- button disabled
- alternate tooltip shown

---

## Last Tab Protection

Tooltip when blocked:

    Cannot close the last tab

Normal tooltip:

    Close tab

Purpose:

Prevents the workspace system from reaching zero tabs.

---

## Close Handler

Handler:

    onCloseTab(tab.id)

The component itself does not remove tabs directly.

---

# Add Tab Control

## Add Button

Class:

    chronogit-tabbar__add

Rendered text:

    + New Tab

Handler:

    onAddTab

Purpose:

Creates a new workspace tab.

---

# Stateless Design

The component contains:

- no React state
- no reducers
- no persistence
- no internal tab logic

All behavior is externally orchestrated.

---

# Relationship to Workspace System

This component acts as the navigation interface for:

- workspace layouts
- panel groups
- active workspace switching

Actual workspace rendering occurs elsewhere.

---

# Relationship to Shell Layer

This component is embedded into:

    ChronoGitShell.tsx

The shell delegates tab rendering and interaction to this component.

---

# Relationship to Workspace Types

The component depends on:

    WorkspaceTab

from:

    chronogitWorkspaceTypes.ts

This establishes structural coupling between the tab UI and workspace-state schema.

---

# Interaction Model

The tab system exposes four interaction domains:

- select
- rename
- close
- create

All actual state mutation occurs externally.

---

# UI Characteristics

The component provides:

- active-tab visibility
- multi-tab navigation
- protected minimum-tab behavior
- inline rename access
- inline close access

---

# Accessibility Characteristics

Visible accessibility support includes:

- semantic `<nav>`
- explicit aria-label
- button title attributes
- disabled-state handling

No keyboard-navigation handling is visible in this file.

---

# No Persistence Layer

This component does not:

- store tab state
- serialize workspaces
- persist layouts
- manage storage

It is purely presentational and interaction-oriented.

---

# No Layout Logic

This file does not:

- position panels
- manage workspace canvas layout
- normalize state
- manage floating windows

Those responsibilities exist elsewhere.

---

# Dependencies

Imports:

- `../core/chronogitWorkspaceTypes`
- `./TabBar.css`

No backend dependency exists.

No Tauri dependency exists.

No Git dependency exists.

---

# Design Characteristics

The tab system is:

- stateless
- prop-driven
- navigation-focused
- workspace-oriented
- minimal in logic
- deterministic in rendering structure

---

# Current Known Gaps

- No drag-reordering exists for tabs.
- No tab duplication exists.
- No tab persistence logic exists locally.
- No keyboard shortcut handling exists.
- No tab overflow management exists.
- No tab grouping exists.
- No tab icons exist.
- No dirty-state indicators exist.
- No per-tab repository indicators exist.
- No context menu behavior exists.
- No tab pinning exists.

---

# Verification Notes

This document is based on full-file inspection of:

- `src/tabs/TabBar.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
