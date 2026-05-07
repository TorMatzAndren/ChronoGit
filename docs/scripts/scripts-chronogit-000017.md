Title: RepoDropdown.tsx
ID: scripts-chronogit-000017
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: workspace-components
Updated: 2026-05-07
Revision: 1

---

@role:ui-component
@subsystem:workspace-components
@entity:script:chronogit-app/src/components/RepoDropdown.tsx
@entity:/chronogit-app/src/components/RepoDropdown.tsx
@semantic:repository-selector
@semantic:workspace-components
@semantic:git-repositories
@semantic:interactive-ui
@semantic:beginner-mode
@semantic:repository-navigation
@state:active

# RepoDropdown.tsx

**Date:** 2026-05-07
**Summary:** Interactive searchable repository selection dropdown used for choosing which local Git repository ChronoGit should inspect and operate against.
**Keywords:** repository dropdown, repo selector, git repository selection, workspace ui, searchable dropdown
**Tags:** scripts, frontend, react, ui, repository-selection, dropdown, workspace

Searchable repository selection component for ChronoGit.

---

## Purpose

`RepoDropdown.tsx` provides a repository-selection interface for ChronoGit.

Responsibilities include:

- rendering repository selections
- supporting repository switching
- providing searchable repository filtering
- displaying repository metadata
- exposing beginner-friendly repository explanations
- handling dropdown interaction behavior

This component acts as the repository navigation surface for ChronoGit workspace operations.

---

# Architectural Role

This component provides the UI boundary between:

- repository discovery
- repository selection
- workspace repository switching

and:

- Git backend execution
- repository scanning logic
- persistence systems
- workspace orchestration

It is a frontend interaction layer only.

---

# Imported Dependencies

Imports:

- `useEffect`
- `useRef`
- `useState`

from:

    react

Imports type:

- `RepoInfo`

from:

    ../core/chronogitRuntimeTypes

---

# Props Type

## Definition

Defines:

    type Props

Fields:

- `value`
- `repos`
- `onChange`
- `beginnerMode`

---

## value

Type:

    string

Purpose:

Currently selected repository path.

Acts as the active repository identity.

---

## repos

Type:

    RepoInfo[]

Purpose:

List of available repositories.

Provides repository metadata for rendering and selection.

---

## onChange

Type:

    (repoPath: string) => void

Purpose:

Callback invoked when the operator selects a new repository.

---

## beginnerMode

Type:

    boolean

Purpose:

Controls explanatory tooltip rendering behavior.

---

# RepoDropdown Component

## Export

Exports:

    RepoDropdown

Signature:

    RepoDropdown({...})

---

# Internal State

## rootRef

Definition:

    useRef<HTMLDivElement | null>(null)

Purpose:

Tracks dropdown root container.

Used for outside-click detection.

---

## open

Definition:

    const [open, setOpen] = useState(false)

Purpose:

Tracks dropdown visibility state.

---

## query

Definition:

    const [query, setQuery] = useState("")

Purpose:

Stores repository search/filter query text.

---

# Selected Repository Resolution

## selectedRepo

Definition:

    repos.find((repo) => repo.path === value)

Purpose:

Finds the currently selected repository object.

Provides:

- repository name
- repository path

for rendering.

---

# Repository Filtering

## filteredRepos

Definition:

    repos.filter(...)

Purpose:

Filters repository list using search query matching.

---

# Search Behavior

Searches against:

- repository name
- repository path

Implementation:

    `${repo.name} ${repo.path}`

Matching is:

- case-insensitive
- substring-based

---

# Query Normalization

Uses:

    query.trim().toLowerCase()

Purpose:

Normalizes search input.

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

Detects interactions outside the dropdown.

---

# Cleanup Behavior

Removes event listener during cleanup.

Prevents listener accumulation.

---

# Root Container

## Structure

Renders:

    <div className="cg-repo-dropdown">

Purpose:

Primary dropdown boundary container.

---

# Toggle Button

## Button

Renders:

    <button type="button" className="cg-repo-dropdown__button">

Purpose:

Primary interaction surface for opening and closing the repository selector.

---

# Toggle Behavior

Uses:

    setOpen((current) => !current)

Purpose:

Inverts dropdown visibility state.

---

# Beginner Mode Tooltip

## title Attribute

Uses:

    beginnerMode
      ? "Select which local Git repository ChronoGit should inspect."
      : "repo selector"

Purpose:

Provides explanatory tooltip text for beginners while allowing concise advanced labeling.

This reflects ChronoGit’s educational UI doctrine.

---

# Current Repository Display

## Name Rendering

Renders:

    {selectedRepo?.name || "Selected repository"}

Purpose:

Displays selected repository name.

Fallback exists if repository metadata is unavailable.

---

## Path Rendering

Renders:

    {value}

Purpose:

Displays selected repository path.

---

# Visibility Indicator

## Indicator

Renders:

    ▲
    ▼

Purpose:

Displays dropdown open/closed state.

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

    cg-repo-dropdown__menu

Purpose:

Primary dropdown menu surface.

---

# Search Input

## Input

Renders:

    <input>

Features:

- autoFocus
- live query updates
- placeholder text

---

# Input Behavior

Updates:

    query

via:

    setQuery(event.target.value)

Purpose:

Provides live repository filtering.

---

# Repository List

## List Container

Renders:

    cg-repo-dropdown__list

Purpose:

Contains filtered repository entries.

---

# Repository Iteration

Uses:

    filteredRepos.map(...)

Purpose:

Renders filtered repository selection entries.

---

# Stable Identity

Uses:

    key={repo.path}

Purpose:

Provides stable React reconciliation identity.

Repository path acts as canonical repository identity.

---

# Active Repository Styling

If:

    repo.path === value

Then applies:

- cg-repo-dropdown__item--active
- cg-repo-dropdown__item--selected

Purpose:

Visually identifies active repository.

---

# Repository Selection Behavior

On selection:

- invokes `onChange(repo.path)`
- clears query
- closes dropdown

Sequence:

    onChange(...)
    setQuery("")
    setOpen(false)

---

# Empty Search State

If no repositories match:

Renders:

    No repositories match this search.

Purpose:

Provides deterministic empty-result feedback.

---

# Deterministic Characteristics

This component is deterministic relative to:

- repository list
- selected repository
- search query
- local interaction state

No asynchronous behavior exists internally.

No backend operations are performed directly.

---

# Repository Identity Model

Repository identity is based on:

    repo.path

This path acts as:

- selection identity
- React key
- switching target

ChronoGit therefore treats repository filesystem paths as canonical repository truth surfaces.

---

# Educational UI Doctrine

This component reflects ChronoGit’s educational beginner-mode philosophy.

The UI attempts to explain:

- what the selector does
- why repository selection matters

without altering underlying functionality.

---

# Separation of Concerns

This component handles:

- repository selection UI
- repository filtering
- dropdown interaction
- selection rendering

It does not handle:

- repository scanning
- Git execution
- repository validation
- workspace persistence
- backend mutation

---

# CSS Dependency

The component depends on external CSS classes including:

- cg-repo-dropdown
- cg-repo-dropdown__button
- cg-repo-dropdown__menu
- cg-repo-dropdown__list
- cg-repo-dropdown__item
- cg-repo-dropdown__item--active
- cg-repo-dropdown__item--selected
- cg-repo-dropdown__empty

All styling is externalized.

---

# Accessibility Characteristics

Uses semantic interactive elements:

- button
- input
- div
- strong
- span
- em

No advanced keyboard navigation or ARIA systems currently exist.

Interaction is primarily pointer-driven.

---

# React Characteristics

This component:

- uses local state
- uses refs
- uses effects
- uses controlled props
- performs deterministic filtering
- contains no backend integration

---

# Potential Future Expansion

Potential future improvements include:

- keyboard navigation
- fuzzy search
- repository grouping
- pinned repositories
- recently opened repositories
- repository status indicators
- repository icons
- multi-root repository support
- accessibility ARIA improvements
- filesystem health indicators

None currently exist.

---

# Design Characteristics

The component is:

- deterministic
- searchable
- repository-centric
- reusable
- educational
- workspace-oriented

---

# Verification Notes

This document is based on full-file inspection of:

- `src/components/RepoDropdown.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
