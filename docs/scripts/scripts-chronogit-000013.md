Title: ChronoDropdown.tsx
ID: scripts-chronogit-000013
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: workspace-components
Updated: 2026-05-16
Revision: 2

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
@semantic:branch-selection
@semantic:relationship-selection
@semantic:merge-selection
@semantic:component-library
@state:active

# ChronoDropdown.tsx

**Date:** 2026-05-07
**Summary:** Searchable interactive dropdown component used for deterministic selection workflows within the ChronoGit workspace UI. Supports filtering, structured branch/merge selection, outside-click dismissal, searchable relationship selection, badge rendering, and reusable deterministic workflow navigation surfaces.
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


---

# 2026-05-16 Update: Branch Workflow and Merge Selection Expansion

This update documents the expanded operational role of `ChronoDropdown.tsx` after ChronoGit’s branch cognition and merge workflow expansion.

The component is now a core reusable selection surface for:

- branch relationship inspection
- merge-target selection
- searchable branch workflows
- semantic branch comparison UX

The component still remains backend-free and presentation-oriented.

---

# Expanded ChronoDropdownOption Type

## New badge Field

Additional field:

    badge?: string

Purpose:

Allows lightweight semantic metadata rendering beside dropdown options.

The badge participates in:

- search indexing
- fallback secondary rendering

This is useful for branch-selection workflows where small semantic indicators improve usability.

---

# Updated Filtering Surface

Filtering logic now searches across:

- title
- subtitle
- badge

Implementation surface:

    `${option.title} ${option.subtitle || ""} ${option.badge || ""}`

This expanded search surface improves branch workflow discoverability.

---

# Updated Placeholder Semantics

The component now separates:

- selection placeholder
- search placeholder

through:

- `placeholder`
- `searchPlaceholder`

This distinction is important for branch/merge workflows where:

- closed control text
- active search guidance

serve different UX roles.

---

# searchPlaceholder

Type:

    string | undefined

Default:

    "Search..."

Purpose:

Controls text inside the active search input.

This differs from the main selection placeholder shown before selection.

---

# emptyText

Type:

    string | undefined

Default:

    "No matches."

Purpose:

Allows workflow-specific empty-state messaging.

This is especially useful in branch workflows where filtered branch sets may legitimately be empty.

---

# Updated Selection Display Semantics

The component now prefers:

- subtitle
- badge
- value

in that order for secondary metadata rendering.

Implementation:

    option.subtitle || option.badge || option.value

This allows concise semantic labeling without requiring long subtitles.

---

# Branch Workflow Role

`ChronoDropdown` is now heavily used by:

    BranchPanel.tsx

for:

- left branch selection
- right branch selection
- incoming merge branch selection

This makes the component part of ChronoGit’s branch cognition workflow layer.

---

# Screenshot-Friendly UI Role

The component intentionally avoids native operating-system dropdown widgets.

Reasons include:

- deterministic styling
- predictable screenshots
- controlled interaction behavior
- workspace-consistent rendering
- portable visual cognition

This is important for ChronoGit documentation, demos, and educational workflows.

---

# Deterministic Selection Surface

The component now acts as a deterministic branch-selection primitive.

It supports:

- semantic branch inspection
- merge target selection
- branch comparison
- searchable workflow navigation

without embedding Git logic itself.

---

# Updated Known Gaps

Known gaps after this update:

- no keyboard arrow navigation
- no Enter-key selection
- no Escape-key close behavior
- no focus restoration
- no grouped-option rendering
- no virtualization for large branch sets
- no async option loading
- no multi-select support
- no ARIA-expanded attributes
- no typeahead navigation memory

---

# Verification Notes for 2026-05-16 Update

This update is based on full-file inspection of:

- `src/components/ChronoDropdown.tsx`

The update specifically documents:

- badge support
- expanded search surface
- searchPlaceholder separation
- branch workflow usage
- merge selection role
- deterministic selection semantics

No undocumented behavior has been inferred beyond directly visible source logic.

# Status

active
