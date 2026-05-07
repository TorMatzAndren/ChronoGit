Title: FlowStripPanel.tsx
ID: scripts-chronogit-000025
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: workflow-visualization
Updated: 2026-05-07
Revision: 1

---

@role:ui-panel
@subsystem:workflow-visualization
@entity:script:chronogit-app/src/panels/FlowStripPanel.tsx
@entity:/chronogit-app/src/panels/FlowStripPanel.tsx
@semantic:git-workflow
@semantic:commit-boundary
@semantic:workflow-education
@semantic:state-progression
@semantic:beginner-guidance
@state:active

# FlowStripPanel.tsx

**Date:** 2026-05-07
**Summary:** Compact visual workflow strip representing ChronoGit’s staged Git progression model from working files → prepared changes → snapshot boundary.
**Keywords:** workflow strip, Git flow, snapshot pipeline, staged workflow, beginner guidance
**Tags:** scripts, frontend, react, workflow, git-education, staged-changes, visualization

Compact workflow visualization component for ChronoGit.

---

## Purpose

`FlowStripPanel.tsx` provides a simplified visual representation of ChronoGit’s Git workflow progression model.

The component visualizes the transition pipeline:

    Working files
        →
    Prepared changes
        →
    Snapshot

This component is part of ChronoGit’s educational UI doctrine.

---

# Architectural Role

This component belongs to ChronoGit’s workflow-education and state-progression visualization layer.

It is intentionally minimal and deterministic.

Responsibilities include:

- visualizing Git workflow stages
- reinforcing commit-boundary understanding
- surfacing current workflow counts
- guiding users toward snapshot/preflight flow
- teaching Git staging concepts visually

The component performs no Git operations.

---

# Props Definition

Defines:

    type Props

Fields:

- `workingCount`
- `stagedCount`

---

## workingCount

Type:

    number

Purpose:

Represents the number of working-tree changes not yet staged/prepared.

Displayed in the first workflow step.

---

## stagedCount

Type:

    number

Purpose:

Represents the number of staged/prepared changes ready for snapshot creation.

Displayed in:

- prepared changes stage
- snapshot stage guidance

---

# Root Container

Renders:

    <section className="flow-strip flow-strip--compact">

Purpose:

Defines the compact workflow visualization strip.

---

# Workflow Structure

The component renders three sequential stages separated by directional arrows.

Workflow model:

    Working files
        →
    Prepared changes
        →
    Snapshot

This mirrors ChronoGit’s educational Git abstraction model.

---

# Stage 1 — Working Files

## Rendering

Displays:

    Working files

Subtext:

    {workingCount} not prepared

---

## Purpose

Represents files currently modified in the working tree but not yet staged.

Educational mapping:

- Git worktree
- unstaged changes
- pre-index mutation state

---

# Arrow Separators

## Rendering

Uses:

    <div className="flow-arrow">→</div>

between stages.

---

## Purpose

Visually communicates workflow progression and directional movement through Git state transitions.

---

# Stage 2 — Prepared Changes

## Rendering

Displays:

    Prepared changes

Subtext:

    {stagedCount} ready for snapshot

---

## Purpose

Represents staged/indexed files ready for commit creation.

Educational mapping:

- Git index
- staged changes
- commit boundary preparation

ChronoGit intentionally uses:

    Prepared changes

instead of raw Git terminology for beginner accessibility.

---

# Stage 3 — Snapshot

## Rendering

Displays:

    Snapshot

Subtext logic:

If:

    stagedCount

is nonzero:

    Review preflight next

Otherwise:

    Prepare files first

---

## Purpose

Represents the commit/snapshot creation phase.

This stage is intentionally locked/passive.

Class:

    flow-step--locked

indicates that snapshot creation is gated behind staging/preflight flow.

---

# Educational Workflow Doctrine

This component is one of the clearest representations of ChronoGit’s beginner-first Git abstraction model.

Core mapping:

| ChronoGit Term    | Git Reality          |
|-------------------|----------------------|
| Working files     | worktree changes     |
| Prepared changes  | staged/index         |
| Snapshot          | commit               |

The component reinforces:

- commits are boundary objects
- staging is explicit
- commits are not automatic
- working-tree edits are separate from snapshots

---

# Truth and Projection Boundaries

## Truth Inputs

Truth inputs:

- workingCount
- stagedCount

These are externally derived from Git status truth.

---

## Projection Layer

Projection includes:

- simplified terminology
- directional workflow visualization
- commit-boundary guidance
- educational sequencing

---

## Mutation Behavior

This component performs no mutation.

No Git commands execute here.

No workflow state changes occur here.

It is purely representational.

---

# React Characteristics

This component:

- is fully prop-driven
- contains no local state
- contains no hooks
- contains no async logic
- contains no backend interaction
- performs no persistence
- performs no effects

It is a pure deterministic render surface.

---

# Visual Workflow Semantics

## Sequential Design

The arrows visually encode:

- process progression
- staging workflow
- commit pipeline flow

This reduces conceptual ambiguity for new Git users.

---

## Locked Snapshot Stage

The final stage uses:

    flow-step--locked

Purpose:

Visually communicates that snapshot creation is not immediate and requires deliberate progression.

---

# CSS Dependencies

Depends on CSS classes including:

- flow-strip
- flow-strip--compact
- flow-step
- flow-step--locked
- flow-arrow

Styling responsibilities likely include:

- horizontal workflow layout
- step spacing
- visual emphasis
- progression arrows
- locked-state appearance

No component-local CSS file is imported.

---

# Separation of Concerns

This component handles:

- workflow visualization
- educational Git projection
- stage-count display
- progression guidance

It does not handle:

- Git state calculation
- staging operations
- snapshot creation
- preflight logic
- file mutation
- remote synchronization
- persistence
- logging
- advisory systems

---

# Current Known Gaps

- No clickable workflow steps exist.
- No animation or transition feedback exists.
- No warning visualization exists.
- No conflict visibility exists.
- No branch awareness exists.
- No remote-state integration exists.
- No progress percentages exist.
- No operation-state awareness exists.
- No drag/drop or interaction exists.
- No accessibility narration exists beyond text labels.

---

# Potential Future Expansion

Potential future improvements include:

- clickable workflow navigation
- animated progression states
- risk/warning overlays
- conflict indicators
- operation-state visualization
- remote synchronization integration
- commit-preview integration
- branch-aware workflow rendering
- timeline visualization
- educational tooltips
- workflow history integration

None currently exist.

---

# Design Characteristics

The component is:

- educational
- minimal
- deterministic
- beginner-oriented
- projection-focused
- non-interactive
- visually sequential

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/FlowStripPanel.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
