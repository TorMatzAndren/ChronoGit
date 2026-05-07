Title: TruthStripPanel.tsx
ID: scripts-chronogit-000037
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: truth-strip
Updated: 2026-05-07
Revision: 1

---

@role:ui-panel
@subsystem:truth-strip
@entity:script:chronogit-app/src/panels/TruthStripPanel.tsx
@entity:/chronogit-app/src/panels/TruthStripPanel.tsx
@semantic:truth-strip
@semantic:git-state-summary
@semantic:working-tree
@semantic:staged-files
@semantic:remote-awareness
@semantic:remote-state
@semantic:educational-ui
@state:active

# TruthStripPanel.tsx

**Date:** 2026-05-07
**Summary:** Compact truth-strip panel for ChronoGit. Displays working change count, prepared/staged change count, remote truth text, and local/remote state label using externally supplied remote classification helpers.
**Keywords:** truth strip, git state, working changes, prepared changes, remote truth, remote state
**Tags:** scripts, frontend, react, git, truth-strip, remote-status, state-summary

Compact Git truth summary strip for ChronoGit.

---

## Purpose

`TruthStripPanel.tsx` provides a compact horizontal truth surface for key Git repository state.

Responsibilities include:

- displaying working-folder change count
- displaying prepared/staged change count
- displaying remote truth text
- displaying local/remote state label
- applying remote-state CSS classification
- providing hover explanations for core Git concepts

This panel acts as a lightweight always-readable Git state strip.

---

# Architectural Role

This component belongs to ChronoGit’s truth-surface and Git state projection layer.

It does not query Git.

It does not calculate remote state internally.

It does not mutate repository state.

It receives externally supplied values and helper functions, then projects them into a compact UI strip.

---

# Local GitRemoteStatus Type

Defines local type:

    GitRemoteStatus

Fields:

- `repo_path`
- `branch`
- `upstream`
- `remote`
- `remote_url`
- `ahead`
- `behind`
- `has_remote`
- `is_diverged`
- `is_clean`

---

# Type Ownership Note

This file defines a local `GitRemoteStatus` type instead of importing the shared runtime type from:

    ../core/chronogitRuntimeTypes

This duplicates the remote status structure.

Future canonicalization should prefer the shared runtime type unless this component intentionally needs an isolated local shape.

---

# Props Type

Defines:

    type Props

Fields:

- `workingCount`
- `stagedCount`
- `remoteStatus`
- `remoteStateClass`
- `remoteStateLabel`
- `remoteTruthText`

---

## workingCount

Type:

    number

Purpose:

Number of working-folder changes.

Represents changed files on disk that are not necessarily prepared for commit.

---

## stagedCount

Type:

    number

Purpose:

Number of prepared/staged changes.

Represents files that will be included if a commit is created now.

---

## remoteStatus

Type:

    GitRemoteStatus | null

Purpose:

Structured remote state object, or null when remote state is unavailable.

---

## remoteStateClass

Type:

    (remote: GitRemoteStatus | null) => string

Purpose:

External helper that maps remote state into a CSS classification suffix.

Used in root class:

    truth-strip--<remoteStateClass>

---

## remoteStateLabel

Type:

    (remote: GitRemoteStatus | null) => string

Purpose:

External helper that maps remote state into a compact human-readable state label.

---

## remoteTruthText

Type:

    (remote: GitRemoteStatus | null) => string

Purpose:

External helper that maps remote state into a detailed remote truth text display.

---

# TruthStripPanel Component

## Export

Exports:

    TruthStripPanel

---

# Root Container

Renders:

    <section className={`truth-strip truth-strip--${remoteStateClass(remoteStatus)}`}>

Purpose:

Primary truth-strip surface.

Remote state classification is projected into CSS class naming.

---

# Remote State Styling Boundary

The component does not decide what the remote state means.

It delegates classification to:

    remoteStateClass(remoteStatus)

This keeps remote-state semantics external.

---

# Working Cell

Renders:

- label: `Working`
- value: `workingCount`

Tooltip:

    Working-folder changes are files changed on disk but not prepared for the next commit.

Purpose:

Shows current worktree change count and explains working-folder semantics.

---

# Prepared Cell

Renders:

- label: `Prepared`
- value: `stagedCount`

Tooltip:

    Prepared changes are staged files that will be included if you commit now.

Purpose:

Shows staged/index change count and explains commit-boundary semantics.

---

# Remote Cell

Renders:

- label: `Remote`
- value: `remoteTruthText(remoteStatus)`

Tooltip:

    Remote shows whether your local branch is synced with its remote tracking branch.

Purpose:

Displays externally generated remote truth text.

---

# State Cell

Renders:

- label: `State`
- value: `remoteStateLabel(remoteStatus)`

Tooltip:

    State summarizes the local/remote relationship.

Purpose:

Displays externally generated local/remote relationship label.

---

# Truth, Projection, Mutation, and Advisory Boundaries

## Truth Inputs

Truth inputs include:

- working count
- staged count
- remote status object

These are externally derived.

The component does not inspect Git.

---

## Projection Logic

Projection responsibilities include:

- displaying counts
- displaying remote text
- displaying state label
- applying remote-state CSS class suffix
- providing hover explanations

---

## Mutation Systems

None.

This component exposes no buttons and performs no mutations.

---

## Advisory Systems

No LLM advisory system exists.

The only explanatory behavior is static hover text.

---

# Educational UI Doctrine

This panel provides compact teaching hints directly in title attributes.

It explains:

- working-folder changes
- prepared/staged changes
- remote tracking state
- local/remote relationship

This supports ChronoGit’s beginner-friendly Git truth model.

---

# Local-Remote Truth Doctrine

This component reinforces core ChronoGit concepts:

- local working changes are separate from staged/prepared changes
- prepared changes define commit contents
- remote state is a relationship between local branch and tracking branch
- status labels are projections of Git-derived truth

---

# Separation of Concerns

This component handles:

- compact rendering
- CSS class projection
- static tooltips
- state strip layout

It does not handle:

- Git status loading
- remote status classification
- remote command execution
- persistence
- LLM explanation
- mutation workflows
- panel orchestration

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

Depends on CSS classes including:

- truth-strip
- truth-strip--<remote-state>
  
Expected state-specific classes are supplied indirectly by `remoteStateClass`.

---

# Current Known Gaps

- Local `GitRemoteStatus` type duplicates central runtime type.
- No imported shared runtime type is used.
- No advanced accessibility attributes exist beyond native title tooltips.
- No click-through actions exist.
- No branch name is displayed.
- No upstream name is displayed directly.
- No remote URL is displayed.
- No ahead/behind counts are displayed directly unless included by `remoteTruthText`.
- No conflict/operation-state indicator exists.
- No LLM explanation hook exists.
- No loading state exists.
- No timestamp/freshness indicator exists.

---

# Potential Future Expansion

Potential future improvements include:

- use shared `GitRemoteStatus` runtime type
- branch/upstream display
- explicit ahead/behind counters
- operation-state indicator
- conflict warning indicator
- stale refresh indicator
- click-through panel navigation
- accessible tooltip replacement
- remote URL copy action
- compact risk badge
- integration with RemoteActionsPanel
- Chrono-Field truth node projection

None currently exist.

---

# Design Characteristics

The component is:

- compact
- truth-oriented
- educational
- read-only
- deterministic
- remote-aware
- projection-focused

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/TruthStripPanel.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
