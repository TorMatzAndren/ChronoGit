Title: PanelDropdown.tsx
ID: scripts-chronogit-000016
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: workspace-components
Updated: 2026-05-07
Revision: 1

---

@role:ui-component
@subsystem:workspace-components
@entity:script:chronogit-app/src/components/PanelDropdown.tsx
@entity:/chronogit-app/src/components/PanelDropdown.tsx
@semantic:panel-selector
@semantic:workspace-panels
@semantic:panel-registry
@semantic:interactive-ui
@semantic:workspace-components
@semantic:beginner-mode
@state:active

# PanelDropdown.tsx

**Date:** 2026-05-07
**Summary:** Interactive panel selection dropdown used for selecting workspace panel types inside ChronoGit. Integrates directly with the canonical panel registry and supports dual beginner/advanced explanatory rendering behavior.
**Keywords:** panel dropdown, panel selector, workspace panels, panel registry, beginner mode, workspace ui
**Tags:** scripts, frontend, react, ui, panels, dropdown, workspace

Workspace panel selection component for ChronoGit.

---

## Purpose

`PanelDropdown.tsx` provides a reusable panel-selection interface for workspace layouts.

Responsibilities include:

- rendering selectable panel types
- exposing panel registry definitions
- supporting panel replacement workflows
- rendering beginner-mode explanations
- rendering advanced/internal panel identities
- handling dropdown interaction state

This component acts as the UI bridge between workspace layout surfaces and the canonical panel registry.

---

# Architectural Role

This file provides the interactive selection layer for panel type assignment.

It separates:

- panel selection UI
- registry rendering
- dropdown interaction logic
- beginner-mode explanatory rendering

from:

- workspace persistence
- panel layout orchestration
- repository logic
- Git execution
- backend systems

---

# Imported Dependencies

Imports:

- `useEffect`
- `useRef`
- `useState`

from:

    react

Imports type:

- `PanelType`

from:

    ../core/chronogitWorkspaceTypes

Imports:

- `PANEL_REGISTRY`

from:

    ../panels/panelRegistry

---

# Props Type

## Definition

Defines:

    type Props

Fields:

- `value`
- `onChange`
- `beginnerMode`

---

## value

Type:

    PanelType

Purpose:

Currently selected panel type.

Acts as the controlled selection identity.

---

## onChange

Type:

    (type: PanelType) => void

Purpose:

External callback invoked when the operator selects a different panel type.

---

## beginnerMode

Type:

    boolean

Purpose:

Controls explanatory rendering behavior.

Determines whether:

- beginner-friendly descriptions
or:
- raw internal panel identifiers

are displayed.

---

# PanelDropdown Component

## Export

Exports:

    PanelDropdown

Signature:

    PanelDropdown({...})

---

# Internal State

## rootRef

Definition:

    useRef<HTMLDivElement | null>(null)

Purpose:

Tracks root dropdown container.

Used for outside-click detection.

---

## open

Definition:

    const [open, setOpen] = useState(false)

Purpose:

Tracks dropdown visibility state.

---

# Selected Panel Resolution

## selected

Definition:

    PANEL_REGISTRY.find(...)

Fallback:

    PANEL_REGISTRY[0]

Purpose:

Resolves currently selected panel definition.

Provides:

- title
- metadata
- display rendering

---

# Registry Dependency

This component depends directly on:

    PANEL_REGISTRY

as the canonical source of panel definitions.

This means:

- all selectable panels originate from the registry
- UI options remain synchronized with registry truth
- panel identity is centralized

---

# Outside Click Detection

## useEffect

Registers:

    pointerdown

listener on:

    window

Purpose:

Automatically closes the dropdown when clicking outside the component boundary.

---

# Boundary Detection

Uses:

    rootRef.current?.contains(...)

Purpose:

Determines whether the interaction occurred outside the dropdown root.

---

# Cleanup Behavior

Removes event listener during component cleanup.

Prevents listener accumulation.

---

# Root Container

## Structure

Renders:

    <div className="cg-panel-dropdown">

Purpose:

Primary dropdown boundary container.

---

# Toggle Button

## Button

Renders:

    <button type="button" className="cg-panel-dropdown__button">

Purpose:

Primary interaction surface for opening and closing the panel selector.

---

# Toggle Behavior

Uses:

    setOpen((current) => !current)

Purpose:

Inverts dropdown visibility state.

---

# Current Selection Display

## Title Rendering

Renders:

    {selected.title}

Purpose:

Displays currently selected panel title.

---

# Open/Closed Indicator

## Indicator

Renders:

    ▲
    ▼

Purpose:

Displays dropdown visibility state.

---

# Conditional Menu Rendering

Menu renders only when:

    open === true

Implementation:

    {open ? (...) : null}

---

# Menu Structure

## Menu Container

Renders:

    cg-panel-dropdown__menu

Purpose:

Top-level dropdown menu surface.

---

## List Container

Renders:

    cg-panel-dropdown__list

Purpose:

Groups selectable panel entries.

---

# Registry Iteration

## Iteration

Uses:

    PANEL_REGISTRY.map(...)

Purpose:

Renders all registered workspace panel types.

This creates a deterministic registry-driven selection surface.

---

# Panel Item Rendering

Each panel renders as:

    <button type="button">

Purpose:

Provides interactive panel selection entries.

---

# Stable Identity

Uses:

    key={panel.type}

Purpose:

Ensures stable React reconciliation identity.

---

# Active Selection Styling

If:

    panel.type === value

Then adds:

    cg-panel-dropdown__item--active

Purpose:

Visually identifies current active panel type.

---

# Beginner Mode Behavior

## title Attribute

Uses:

    beginnerMode
      ? panel.description
      : panel.type

Purpose:

Provides either:

- human explanation
or:
- internal panel identifier

depending on operator mode.

---

# Subtitle Rendering

Renders:

    beginnerMode
      ? panel.description
      : panel.type

Purpose:

Implements ChronoGit’s dual-language doctrine:

- beginner educational language
- advanced/internal terminology

without changing actual system behavior.

---

# Selection Behavior

On selection:

- invokes `onChange(panel.type)`
- closes dropdown

Sequence:

    onChange(...)
    setOpen(false)

---

# Deterministic Characteristics

This component is deterministic relative to:

- registry contents
- props
- local interaction state

No asynchronous behavior exists.

No backend dependencies exist.

---

# Beginner/Advanced Doctrine

This component directly reflects ChronoGit’s educational Git doctrine.

The same system surface can expose:

- explanatory human language
or:
- raw technical identities

without changing underlying truth structures.

This allows:

- gradual operator learning
- transparent system understanding
- reduced intimidation for beginners

while preserving deterministic internal naming.

---

# Registry-Centric Design

The dropdown is fully registry-driven.

This means:

- adding panels to the registry automatically updates the selector
- no duplicated panel definitions exist locally
- selection behavior remains synchronized with workspace architecture

---

# Separation of Concerns

This component handles:

- panel selection UI
- registry rendering
- dropdown interaction

It does not handle:

- panel rendering
- layout persistence
- workspace orchestration
- backend mutation
- Git logic

---

# CSS Dependency

The component depends on external CSS classes including:

- cg-panel-dropdown
- cg-panel-dropdown__button
- cg-panel-dropdown__menu
- cg-panel-dropdown__list
- cg-panel-dropdown__item
- cg-panel-dropdown__item--active

All styling is externalized.

---

# Accessibility Characteristics

Uses semantic interactive elements:

- button
- div
- strong
- span

No advanced keyboard navigation or ARIA attributes currently exist.

Interaction is primarily pointer-driven.

---

# React Characteristics

This component:

- uses local state
- uses refs
- uses effects
- uses controlled props
- contains no backend integration

---

# Potential Future Expansion

Potential future enhancements include:

- keyboard navigation
- grouped panel categories
- icons
- search/filtering
- drag-to-insert workflows
- pinned favorites
- recently used panels
- accessibility ARIA expansion
- panel previews
- workspace templates

None currently exist.

---

# Design Characteristics

The component is:

- registry-driven
- deterministic
- reusable
- educational
- interactive
- workspace-oriented

---

# Verification Notes

This document is based on full-file inspection of:

- `src/components/PanelDropdown.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
