Title: SnapshotPreflightModal.tsx
ID: scripts-chronogit-000018
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: snapshot-workflow
Updated: 2026-05-07
Revision: 1

---

@role:ui-component
@subsystem:snapshot-workflow
@entity:script:chronogit-app/src/components/SnapshotPreflightModal.tsx
@entity:/chronogit-app/src/components/SnapshotPreflightModal.tsx
@semantic:snapshot-preflight
@semantic:commit-boundary
@semantic:git-commit
@semantic:prepared-files
@semantic:danger-detection
@semantic:educational-ui
@state:active

# SnapshotPreflightModal.tsx

**Date:** 2026-05-07
**Summary:** Commit/snapshot preflight modal that visualizes the exact staged commit boundary, risk warnings, remote consequences, and commit metadata before a Git commit operation executes.
**Keywords:** snapshot preflight, git commit modal, commit boundary, staged files, commit warnings, educational git ui
**Tags:** scripts, frontend, react, git, snapshot, commit, modal, preflight

Preflight verification modal for ChronoGit snapshot creation.

---

## Purpose

`SnapshotPreflightModal.tsx` provides the final verification surface before ChronoGit creates a Git commit.

Responsibilities include:

- visualizing staged commit boundaries
- displaying insertion/deletion statistics
- exposing included files
- showing risk warnings
- enforcing commit message entry
- communicating remote consequences
- exposing beginner/pro terminology translation
- blocking commits under critical conditions

This component acts as the final human verification checkpoint before repository mutation occurs.

---

# Architectural Role

This component is part of ChronoGit’s deterministic snapshot workflow.

It exists between:

- staged Git state
- operator intent

and:

- irreversible Git history mutation

The modal therefore functions as a safety boundary surface rather than a generic UI dialog.

---

# Imported Runtime Types

Imports:

- `CommitPreflight`
- `FileChange`
- `GitRemoteStatus`

from:

    ../core/chronogitRuntimeTypes

These types provide structured Git truth data.

---

# SnapshotImpact Type

## Definition

Defines:

    type SnapshotImpact

Structure:

    {
      label: string;
      text: string;
    } | null

Purpose:

Represents higher-level impact classification or warnings associated with the next snapshot/commit.

---

# Props Type

## Definition

Defines:

    type Props

Contains all runtime state required for deterministic commit preview rendering.

---

# Important Props

## beginnerMode

Type:

    boolean

Purpose:

Controls educational beginner/pro terminology translation.

---

## commitPreflight

Type:

    CommitPreflight | null

Purpose:

Provides deterministic staged-file statistics.

Includes:

- staged file count
- insertion count
- deletion count

---

## staged

Type:

    FileChange[]

Purpose:

Represents files that will be included in the next snapshot.

Acts as the actual commit boundary truth surface.

---

## preflightWarnings

Type:

    FileChange[]

Purpose:

Represents staged files classified as potentially dangerous or risky.

---

## hasCritical

Type:

    boolean

Purpose:

Determines whether snapshot creation must be blocked.

Used to disable commit execution.

---

## snapshotImpact

Type:

    SnapshotImpact

Purpose:

Provides higher-level commit impact explanation.

---

## remote

Type:

    GitRemoteStatus | null

Purpose:

Provides remote synchronization context.

Used for consequence explanation.

---

## commitMessage

Type:

    string

Purpose:

Stores operator-provided commit message.

---

## setCommitMessage

Type:

    (message: string) => void

Purpose:

Updates commit message state.

---

## onCancel

Type:

    () => void

Purpose:

Cancels snapshot creation.

---

## onConfirm

Type:

    () => void

Purpose:

Executes snapshot creation workflow.

---

## snapshotRemoteSentence

Type:

    (remote: GitRemoteStatus | null) => string

Purpose:

Produces explanatory text describing how the snapshot relates to the remote repository state.

---

## ui

Type:

    (
      beginnerMode: boolean,
      beginner: string,
      pro: string
    ) => string

Purpose:

Provides dual-language UI terminology selection.

This reflects ChronoGit’s educational UI doctrine.

---

# SnapshotPreflightModal Component

## Export

Exports:

    SnapshotPreflightModal

---

# Overlay Structure

## Root Overlay

Renders:

    <div className="preflight-overlay">

Purpose:

Fullscreen modal interaction boundary.

---

# Modal Container

## Modal

Renders:

    <div className="preflight-modal">

Purpose:

Primary snapshot verification container.

---

# Modal Title

## Heading

Uses:

    ui(beginnerMode, "Snapshot Preflight", "git commit preflight")

Purpose:

Translates terminology depending on user experience level.

---

# Educational Terminology Layer

The component intentionally supports:

- beginner terminology
- Git-native terminology

Examples:

Beginner:

    Snapshot
    Prepared files

Advanced:

    git commit
    index/staged files

This allows educational onboarding without changing actual Git behavior.

---

# Commit Boundary Explanation

## Introductory Text

Renders:

    "Only prepared files will be included."

or:

    "Only index/staged files are committed."

Purpose:

Clarifies exact Git commit boundary semantics.

This is a core ChronoGit educational principle.

---

# Snapshot Boundary Box

## Boundary Container

Renders:

    snapshot-boundary-box

Purpose:

Central visualization area for the next snapshot/commit.

---

# Boundary Heading

Uses:

    "Next snapshot contains"

or:

    "git diff --cached --stat"

Purpose:

Bridges beginner and advanced Git concepts.

---

# Snapshot Statistics Grid

## Grid

Renders:

    snapshot-boundary-grid

Displays:

- staged files
- insertions
- deletions

---

# File Count

Uses:

    commitPreflight?.staged_files ?? staged.length

Purpose:

Displays deterministic commit file count.

Falls back to staged array length if preflight data is unavailable.

---

# Insertions

Uses:

    commitPreflight?.insertions ?? 0

Purpose:

Displays added line count.

---

# Deletions

Uses:

    commitPreflight?.deletions ?? 0

Purpose:

Displays removed line count.

---

# Remote Consequence Rendering

## Remote Sentence

Uses:

    snapshotRemoteSentence(remote)

Purpose:

Explains how the next snapshot relates to remote synchronization state.

This helps operators understand:

- local-only commits
- ahead/behind states
- synchronization implications

---

# Snapshot Impact Warning

## Conditional Rendering

Only renders if:

    snapshotImpact

exists.

---

# Structure

Displays:

- impact label
- impact text

Purpose:

Provides higher-level semantic explanation about snapshot scale or risk.

---

# Included Files Section

## Heading

Renders:

    Included files ({staged.length})

Purpose:

Displays exact commit boundary file count.

---

# File Iteration

Uses:

    staged.map(...)

Purpose:

Renders every file included in the next commit.

---

# Stable Identity

Uses:

    key={file.path}

Purpose:

Provides stable React reconciliation identity.

---

# File Rendering

Each file renders as:

    ✔ {file.path}

Purpose:

Provides direct human-readable commit inclusion visibility.

---

# Preflight Warnings

## Conditional Rendering

Warnings render only if:

    preflightWarnings.length

is non-zero.

---

# Warning Rendering

Each warning displays:

- file path
- risk classification

Format:

    ⚠ {file.path} — {file.risk}

Purpose:

Exposes potentially dangerous commit contents.

---

# Safe State Rendering

If no warnings exist:

Renders:

    No dangerous prepared files detected.

Purpose:

Provides deterministic safe-state confirmation.

---

# Commit Message Input

## Input

Renders:

    <input className="preflight-input">

Purpose:

Collects commit message text.

---

# Input Behavior

Updates:

    commitMessage

via:

    setCommitMessage(...)

Purpose:

Maintains controlled input state.

---

# Placeholder Translation

Uses:

    ui(beginnerMode, "Describe this snapshot...", "commit message")

Purpose:

Maintains educational beginner/pro terminology mapping.

---

# Action Buttons

## Container

Renders:

    preflight-actions

Purpose:

Contains commit workflow actions.

---

# Cancel Button

Invokes:

    onCancel

Purpose:

Aborts snapshot creation workflow.

---

# Confirm Button

Invokes:

    onConfirm

Purpose:

Executes commit creation.

---

# Confirm Button Label

Uses:

    "Create snapshot"

or:

    "git commit"

depending on beginner mode.

---

# Commit Blocking Rules

The confirm button becomes disabled if:

- commit message is empty
- critical warnings exist

Implementation:

    !commitMessage.trim() || hasCritical

Purpose:

Prevents unsafe or incomplete commit creation.

---

# Deterministic Characteristics

This component is deterministic relative to:

- staged files
- preflight analysis
- remote state
- commit message
- warning classifications

No Git logic exists internally.

No mutation occurs directly inside the component.

---

# Commit Boundary Philosophy

This component embodies a major ChronoGit doctrine:

The user must visually understand exactly what a commit contains before it is created.

This is intended to counteract common beginner confusion around:

- staged vs unstaged files
- commit boundaries
- hidden Git state
- unintended commits

---

# Safety Philosophy

This component intentionally inserts:

- friction
- visibility
- consequence awareness

before history mutation.

ChronoGit treats commits as important repository timeline events rather than casual save actions.

---

# Educational Git Translation Layer

This component strongly reflects ChronoGit’s:

    Beginner ↔ Advanced

dual-language architecture.

It translates Git concepts without hiding Git truth.

Examples:

- Snapshot ↔ Commit
- Prepared ↔ Staged
- Snapshot contains ↔ git diff --cached --stat

This preserves educational progression.

---

# Separation of Concerns

This component handles:

- rendering
- visualization
- commit confirmation UI
- warning display
- educational terminology

It does not handle:

- Git execution
- staging
- commit creation
- risk classification
- repository mutation
- remote synchronization

---

# CSS Dependencies

Depends on external CSS classes including:

- preflight-overlay
- preflight-modal
- snapshot-boundary-box
- snapshot-boundary-grid
- snapshot-impact-warning
- preflight-list
- preflight-item
- preflight-warnings
- warning-item
- preflight-input
- preflight-actions
- confirm

All styling is externalized.

---

# Accessibility Characteristics

Uses semantic elements including:

- button
- input
- div
- h2
- h3
- p

No advanced accessibility systems currently exist.

---

# React Characteristics

This component:

- is fully prop-driven
- contains no local state
- performs no async operations
- contains no side-effect hooks
- acts as a pure rendering surface

---

# Potential Future Expansion

Potential future improvements include:

- diff previews
- hunk previews
- file collapse/expand
- semantic risk categories
- keyboard navigation
- commit template suggestions
- accessibility improvements
- syntax highlighting
- signed-commit visibility
- branch target visibility
- patch export previews

None currently exist.

---

# Design Characteristics

The component is:

- deterministic
- educational
- safety-oriented
- commit-boundary-focused
- repository-aware
- beginner-compatible

---

# Verification Notes

This document is based on full-file inspection of:

- `src/components/SnapshotPreflightModal.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
