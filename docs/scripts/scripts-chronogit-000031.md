Title: RepositoryPanel.tsx
ID: scripts-chronogit-000031
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: repository-selection
Updated: 2026-05-07
Revision: 1

---

@role:ui-panel
@subsystem:repository-selection
@entity:script:chronogit-app/src/panels/RepositoryPanel.tsx
@entity:/chronogit-app/src/panels/RepositoryPanel.tsx
@semantic:repository-selection
@semantic:repository-discovery
@semantic:local-git-projects
@semantic:repository-scan
@semantic:repository-switching
@semantic:educational-ui
@semantic:local-repository-awareness
@state:active

# RepositoryPanel.tsx

**Date:** 2026-05-07
**Summary:** Repository selection panel for ChronoGit. Provides local repository selection, discovered repository listing, repository path visibility, and repository scan trigger functionality with beginner-oriented tooltip support.
**Keywords:** repository selection, repository scan, local git projects, git repository discovery, repository switching
**Tags:** scripts, frontend, react, git, repository, repository-scan, workspace

Repository selection and repository discovery panel for ChronoGit.

---

## Purpose

`RepositoryPanel.tsx` provides a compact repository-selection interface for ChronoGit.

Responsibilities include:

- displaying current repository
- listing discovered local Git repositories
- allowing repository switching
- displaying selected repository path
- triggering repository discovery scans
- exposing beginner-oriented tooltip guidance

This panel acts as a repository-awareness and repository-selection surface.

---

# Architectural Role

This component belongs to ChronoGit’s repository-selection and local repository discovery layer.

It does not scan repositories itself.

It does not query the filesystem directly.

It does not validate Git repositories locally.

It receives already-discovered repository truth from parent orchestration and projects it into a small repository-selection interface.

---

# Local RepoInfo Type

Defines local type:

    type RepoInfo

Fields:

- `path`
- `name`
- `root`

---

## path

Type:

    string

Purpose:

Absolute or canonical repository path.

Used as:

- option value
- display path
- selection identity

---

## name

Type:

    string

Purpose:

Human-readable repository name.

Displayed in repository selector.

---

## root

Type:

    string

Purpose:

Repository root path.

This field exists in the local type definition but is not used by this component.

---

# Props Type

Defines:

    type Props

Fields:

- `repoPath`
- `repos`
- `onRepoChange`
- `onScanRepos`
- `beginnerTitle`

---

## repoPath

Type:

    string

Purpose:

Currently selected repository path.

Used as:

- select value
- displayed active path

---

## repos

Type:

    RepoInfo[]

Purpose:

List of discovered repositories.

Used to populate repository selector options.

---

## onRepoChange

Type:

    (repoPath: string) => void

Purpose:

Requests repository selection change.

Triggered when the user selects another repository from the dropdown.

---

## onScanRepos

Type:

    () => void

Purpose:

Requests repository discovery scan.

The component itself does not perform scanning.

---

## beginnerTitle

Type:

    (text: string) => string | undefined

Purpose:

Provides tooltip/title text generation for beginner help surfaces.

Used only on the scan button.

---

# RepositoryPanel Component

## Export

Exports:

    RepositoryPanel

---

# Root Container

Renders:

    <div className="repo-main-card">

Purpose:

Primary repository panel container.

---

# Title Section

Renders:

    Repository

Purpose:

Defines the panel purpose.

---

# Introductory Note

Renders:

    Select a discovered local Git project.

Purpose:

Explains the role of the repository selector.

This note assumes repositories have already been discovered externally.

---

# Repository Selector

Renders:

    <select>

Controlled by:

    repoPath

Selection changes invoke:

    onRepoChange(event.target.value)

---

# Repository Option Rendering

If repositories exist:

    repos.map(...)

Each option displays:

    {repo.name} · {repo.path}

---

## Option Key

Uses:

    repo.path

as React key.

---

## Option Value

Uses:

    repo.path

as selected value identity.

---

# Empty Repository Fallback

If no repositories exist:

Renders fallback option:

    <option value={repoPath}>{repoPath}</option>

Purpose:

Allows current repository path visibility even when repository discovery data is unavailable.

---

# Repository Path Display

Renders:

    <div className="repo-main-card__path">{repoPath}</div>

Purpose:

Displays currently selected repository path separately from the dropdown.

This improves visibility for long or truncated select entries.

---

# Scan Button

Button class:

    status-refresh-button

Text:

    Scan repositories

Invokes:

    onScanRepos

Purpose:

Requests repository discovery refresh.

---

# Beginner Tooltip

Button title uses:

    beginnerTitle(...)

Tooltip text:

    Scan repositories

    Searches safe local folders for Git projects and updates the repository selector.

Purpose:

Provides educational explanation of repository scanning behavior.

---

# Truth, Projection, Mutation, and Advisory Boundaries

## Truth Inputs

Truth inputs include:

- `repoPath`
- `repos`

These are externally managed.

The panel itself does not inspect repositories.

---

## Projection Logic

Projection logic includes:

- repository option rendering
- current repository display
- repository fallback rendering
- tooltip text projection

---

## Mutation Requests

Mutation requests include:

- repository selection change
- repository scan request

Actual filesystem scanning and repository validation are delegated externally.

---

## Advisory Systems

No LLM advisory system exists in this component.

The only educational/advisory behavior is beginner tooltip support.

---

# Repository Discovery Doctrine

This panel reflects ChronoGit’s repository-awareness doctrine:

Repositories should be:

- explicitly selected
- visible
- local-first
- discoverable through controlled scans
- not hidden behind implicit workspace assumptions

---

# Local-Only Design

The panel explicitly describes:

    local Git project

This reinforces ChronoGit’s local-first architecture.

No cloud or remote repository browsing exists here.

---

# React Characteristics

This component:

- is fully prop-driven
- contains no hooks
- contains no local state
- performs no async work
- performs no backend calls
- performs no persistence
- performs no repository validation

It is a pure repository-selection projection surface.

---

# CSS Dependencies

Depends on CSS classes:

- repo-main-card
- repo-main-card__title
- repo-main-card__note
- repo-main-card__path
- status-refresh-button

No component-local stylesheet is imported.

---

# Current Known Gaps

- Local `RepoInfo` type duplicates runtime repository type structures elsewhere.
- `root` field is unused.
- No repository search/filter exists.
- No repository grouping exists.
- No repository validation status exists.
- No repository scan progress indicator exists.
- No repository scan timestamp exists.
- No scan cancellation exists.
- No error display exists.
- No repository health state exists.
- No remote-awareness integration exists.
- No repository favorite/pinning exists.
- No multi-repository workspace logic exists.
- No detached repository warning exists.
- No self-repository warning exists.

---

# Potential Future Expansion

Potential future improvements include:

- searchable repository selector
- repository health indicators
- scan progress surface
- repository grouping
- repository tags
- repository favorites/pinning
- recent repository history
- scan scope configuration
- repository validation warnings
- repository size statistics
- repository last-opened tracking
- remote synchronization awareness
- self-repository mutation warnings
- repository iconography

None currently exist.

---

# Design Characteristics

The panel is:

- compact
- repository-aware
- local-first
- educational
- selection-oriented
- deterministic in rendering
- filesystem-abstraction oriented

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/RepositoryPanel.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
