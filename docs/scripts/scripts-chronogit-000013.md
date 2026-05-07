Title: ChronoDropdown.tsx
ID: scripts-chronogit-000013
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: workspace-components
Updated: 2026-05-07
Revision: 1

---

@role:ui-component
@subsystem:workspace-components
@entity:script:chronogit-app/src/components/ChronoDropdown.tsx
@entity:/chronogit-app/src/components/ChronoDropdown.tsx
@semantic:dropdown
@semantic:workspace-components
@semantic:searchable-selector
@semantic:interactive-ui
@semantic:selection-surface
@semantic:component-library
@state:active

# ChronoDropdown.tsx

**Date:** 2026-05-07
**Summary:** Searchable interactive dropdown component used for deterministic selection workflows within the ChronoGit workspace UI. Supports filtering, selection rendering, outside-click closing behavior, and structured option metadata.
**Keywords:** dropdown, selector, searchable dropdown, workspace ui, component library, option selector
**Tags:** scripts, frontend, react, ui, dropdown, components, workspace

Searchable dropdown component for ChronoGit workspace interfaces.

---

## Purpose

`ChronoDropdown.tsx` provides a reusable searchable dropdown UI component.

Responsibilities include:

- rendering selectable option lists
- rendering current selection state
- filtering options via text search
- handling open/close interaction state
- handling external click dismissal
- propagating deterministic value selection events

This component acts as a shared workspace selection primitive.

---

# Architectural Role

This file provides a reusable selection interface layer for ChronoGit.

It separates:

- searchable selection behavior
- dropdown interaction logic
- option filtering
- menu rendering

from:

- Git logic
- repository state
- backend orchestration
- application business rules

---

# Imported Dependencies

Imports:

- `useEffect`
- `useRef`
- `useState`

from:

    react

---

# ChronoDropdownOption Type

## Definition

Defines:

    type ChronoDropdownOption

Fields:

- `value`
- `title`
- `subtitle`

---

## value

Type:

    string

Purpose:

Canonical selection value.

Acts as the deterministic identity of the option.

---

## title

Type:

    string

Purpose:

Primary human-readable display label.

---

## subtitle

Type:

    string | undefined

Purpose:

Optional secondary descriptive text.

Used for contextual clarification within the dropdown UI.

---

# Props Type

## Definition

Defines:

    type Props

Fields:

- `value`
- `options`
- `onChange`
- `label`
- `placeholder`
- `className`

---

## value

Type:

    string

Purpose:

Currently selected option value.

Acts as the controlled selection state.

---

## options

Type:

    ChronoDropdownOption[]

Purpose:

Full selectable option set.

---

## onChange

Type:

    (value: string) => void

Purpose:

External selection callback invoked when the user selects a new option.

---

## label

Type:

    string

Purpose:

Fallback visible label when no selected option exists.

---

## placeholder

Type:

    string

Default:

    "Search..."

Purpose:

Placeholder text rendered inside the search input.

---

## className

Type:

    string

Default:

    ""

Purpose:

Optional external CSS extension class.

Allows contextual styling augmentation.

---

# ChronoDropdown Component

## Export

Exports:

    ChronoDropdown

Signature:

    ChronoDropdown({...})

---

# Internal State

## rootRef

Definition:

    useRef<HTMLDivElement | null>(null)

Purpose:

Tracks the root dropdown container.

Used for outside-click detection.

---

## open

Definition:

    const [open, setOpen] = useState(false)

Purpose:

Tracks dropdown menu visibility state.

---

## query

Definition:

    const [query, setQuery] = useState("")

Purpose:

Tracks current search/filter input value.

---

# Selected Option Resolution

## selected

Definition:

    options.find((option) => option.value === value)

Purpose:

Resolves the currently selected option object.

Used for:

- title rendering
- subtitle rendering
- selected-state visualization

---

# Filtering Logic

## filtered

Definition:

    options.filter(...)

Purpose:

Creates dynamically filtered option lists based on search input.

---

## Filtering Behavior

The component:

- trims whitespace
- converts search text to lowercase
- performs substring matching
- searches across:
  - title
  - subtitle
  - value

---

## Search Surface

The searchable text surface is:

    `${option.title} ${option.subtitle || ""} ${option.value}`

This allows broad fuzzy-style filtering across multiple metadata fields.

---

# Outside Click Detection

## useEffect

Registers:

    pointerdown

listener on:

    window

Purpose:

Automatically closes the dropdown when the user clicks outside the component boundary.

---

## Boundary Detection

Uses:

    rootRef.current?.contains(...)

Purpose:

Determines whether the interaction occurred inside or outside the dropdown root container.

---

## Cleanup Behavior

Removes event listener during component cleanup.

This prevents listener accumulation and memory leakage.

---

# Render Structure

## Root Container

Renders:

    <div className={`cg-unified-dropdown ${className}`}>

Purpose:

Top-level dropdown boundary container.

Receives optional external class augmentation.

---

# Dropdown Toggle Button

## Button

Renders:

    <button
      type="button"
      className="cg-unified-dropdown__button"
    >

Purpose:

Primary dropdown interaction surface.

Toggles menu open/closed state.

---

## Toggle Logic

Behavior:

    setOpen((current) => !current)

Purpose:

Inverts menu visibility state.

---

# Selection Display

## Primary Display

Renders:

    <strong>{selected?.title || label}</strong>

Purpose:

Displays selected title or fallback label.

---

## Secondary Display

Renders:

    <em>{selected?.subtitle || selected?.value || value}</em>

Purpose:

Displays secondary contextual selection metadata.

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

# Search Input

## Input

Renders:

    <input autoFocus ... />

Purpose:

Allows dynamic filtering of options.

---

## autoFocus

Behavior:

Automatically focuses the search field when the dropdown opens.

Improves rapid keyboard-driven selection workflows.

---

# Option List Rendering

## Filtered Rendering

Maps over:

    filtered

Purpose:

Renders matching options.

---

# Option Button Rendering

Each option renders as:

    <button type="button">

Purpose:

Provides interactive selectable entries.

---

# Selected State Styling

Selected option receives:

    cg-unified-dropdown__item--selected

Purpose:

Allows visual indication of active selection state.

---

# Selection Behavior

On selection:

- invokes `onChange(option.value)`
- clears query state
- closes dropdown

Sequence:

    onChange(...)
    setQuery("")
    setOpen(false)

---

# Empty State

If no options match:

Renders:

    No matches.

inside:

    cg-unified-dropdown__empty

Purpose:

Provides deterministic empty-search feedback.

---

# Deterministic Characteristics

The component is deterministic relative to:

- props
- internal state
- user interaction

No backend calls exist.

No asynchronous external dependencies exist.

---

# Separation of Concerns

This component handles:

- selection UI
- filtering UI
- interaction state

It does not handle:

- persistence
- repository logic
- Git operations
- Tauri integration
- network behavior

---

# CSS Dependency

The component relies on external CSS classes:

- cg-unified-dropdown
- cg-unified-dropdown__button
- cg-unified-dropdown__menu
- cg-unified-dropdown__list
- cg-unified-dropdown__item
- cg-unified-dropdown__item--selected
- cg-unified-dropdown__empty

Visual behavior is delegated entirely to CSS.

---

# Accessibility Characteristics

Accessibility-oriented behavior includes:

- semantic button usage
- keyboard-focusable controls
- explicit button types
- aria-compatible structure foundation

No advanced ARIA attributes currently exist.

---

# Interaction Model

The component supports:

- click-driven interaction
- search-driven filtering
- dynamic selection
- external dismissal

No keyboard navigation logic currently exists.

---

# Potential Future Expansion

Potential future enhancements include:

- keyboard navigation
- arrow-key selection
- enter-key activation
- escape-key closing
- virtualization for large lists
- grouped options
- icons
- multi-select mode
- async option loading
- deterministic focus restoration
- accessibility ARIA expansion

None currently exist.

---

# Design Characteristics

The component is:

- reusable
- composable
- deterministic
- interactive
- presentation-oriented
- state-localized

---

# Verification Notes

This document is based on full-file inspection of:

- `src/components/ChronoDropdown.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
