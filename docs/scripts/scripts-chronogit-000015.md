Title: DiffViewer.tsx
ID: scripts-chronogit-000015
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: diff-viewer
Updated: 2026-05-07
Revision: 1

---

@role:diff-renderer
@subsystem:diff-viewer
@entity:script:chronogit-app/src/components/DiffViewer.tsx
@entity:/chronogit-app/src/components/DiffViewer.tsx
@semantic:diff-viewer
@semantic:line-selection
@semantic:diff-rendering
@semantic:interactive-diff
@semantic:workspace-components
@state:active

# DiffViewer.tsx

**Date:** 2026-05-07
**Summary:** Interactive visual diff rendering component for ChronoGit. Responsible for rendering line-oriented diff surfaces with line classification, selectable line interaction, normalized newline handling, and deterministic visual diff presentation.
**Keywords:** diff viewer, diff rendering, line selection, git diff, interactive diff, patch viewer
**Tags:** scripts, frontend, react, diff, git, ui, workspace

Interactive diff rendering surface for ChronoGit.

---

## Purpose

`DiffViewer.tsx` provides visual rendering for Git diff content.

Responsibilities include:

- rendering line-by-line diffs
- classifying diff lines visually
- rendering selectable diff lines
- normalizing newline formats
- rendering stable line numbering
- supporting line-based interaction workflows

This component acts as the foundational interactive diff rendering surface within ChronoGit.

---

# Architectural Role

This file provides the presentation layer for textual diff visualization.

It separates:

- diff rendering
- line classification
- interaction rendering
- line selection visualization

from:

- Git generation
- backend diff computation
- repository orchestration
- LLM interpretation
- persistence logic

---

# Imported Dependencies

Imports:

- `diffLineClass`

from:

    ../lib/diffUtils

Purpose:

Determines CSS classification for diff lines based on textual diff content.

---

# Exported Function

## Export

Exports:

    renderPrettyDiff

Signature:

    renderPrettyDiff(
      diff: string,
      selectedLines: Set<number>,
      onToggleLine: (line: number) => void
    )

---

# Function Purpose

Provides interactive structured rendering of Git diff text.

Supports:

- visual classification
- line numbering
- line selection
- operator interaction

---

# Parameters

## diff

Type:

    string

Purpose:

Raw diff text content to render.

Expected to contain standard line-oriented Git diff output.

---

## selectedLines

Type:

    Set<number>

Purpose:

Tracks currently selected diff line numbers.

Used for visual selection highlighting.

---

## onToggleLine

Type:

    (line: number) => void

Purpose:

External callback for toggling selected line state.

Allows parent orchestration layers to control selection ownership.

---

# Empty Diff Handling

## Condition

If:

    !diff.trim()

Then renders:

    No diff for this file.

inside:

    diff-placeholder

---

## Purpose

Provides deterministic fallback rendering when no diff content exists.

Prevents rendering empty interactive surfaces.

---

# Newline Normalization

## Logic

Transforms:

- `\r\n`
- `\r`

into:

- `\n`

Implementation:

    diff.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

---

## Purpose

Provides deterministic line splitting behavior across platforms.

Supports:

- Windows newline normalization
- Unix newline normalization
- stable line indexing

---

# Line Splitting

## Implementation

Uses:

    split("\n")

Purpose:

Converts normalized diff text into line arrays for rendering.

---

# Root Diff Container

## Container

Renders:

    <div className="diff-pretty">

Purpose:

Primary structured diff rendering surface.

---

# Line Rendering Loop

## Iteration

Uses:

    lines.map(...)

Purpose:

Renders each diff line individually.

---

# Line Numbering

## Calculation

Defines:

    const lineNumber = index + 1;

Purpose:

Provides stable 1-based visual line numbering.

---

# Line Container

## Structure

Each line renders as:

    <div ...>

Purpose:

Acts as interactive diff line surface.

---

# Stable React Keys

## Key Generation

Uses:

    key={`${index}-${line.slice(0, 18)}`}

Purpose:

Provides semi-stable React reconciliation identity.

Combines:

- line index
- line content prefix

---

# Diff Classification

## CSS Class Resolution

Uses:

    diffLineClass(line)

Purpose:

Determines semantic visual classification of diff lines.

Likely categories include:

- additions
- removals
- metadata
- unchanged lines
- hunk headers

Classification logic exists externally in:

    diffUtils

---

# Selection Highlighting

## Conditional Styling

If line exists in:

    selectedLines

Then adds:

    diff-line--selected

Purpose:

Provides operator-visible line selection state.

---

# Line Click Handling

## Interaction

Each line supports:

    onClick={() => onToggleLine(lineNumber)}

Purpose:

Allows interactive line-based selection workflows.

---

# Selection Ownership Model

This component does not own selection state.

Selection is externally managed.

This creates:

- deterministic rendering
- centralized state ownership
- predictable interaction flows

---

# Line Number Rendering

## Structure

Renders:

    <span className="diff-line__num">

Purpose:

Displays stable visible line numbers.

---

# Line Text Rendering

## Structure

Renders:

    <code className="diff-line__text">

Purpose:

Displays raw diff line text in monospace formatting.

---

# Empty Line Preservation

## Logic

Uses:

    line || " "

Purpose:

Preserves visual rendering of blank lines.

Without this, empty lines could collapse visually.

---

# Deterministic Characteristics

The component is deterministic relative to:

- diff text
- selected line state
- operator interaction

No asynchronous behavior exists.

No backend interaction exists.

---

# Separation of Concerns

This component handles:

- visual diff rendering
- interaction surfaces
- line visualization
- line numbering

It does not handle:

- Git diff generation
- repository mutation
- persistence
- backend orchestration
- semantic explanation
- patch application

---

# Interactive Diff Doctrine

This component reflects ChronoGit’s educational and operator-centric Git doctrine.

The operator can:

- inspect changes visually
- interact with specific lines
- build contextual understanding
- create future line-scoped workflows

---

# Potential Higher-Level Usage

The line-selection system suggests integration potential with:

- hunk explanation
- line-specific LLM analysis
- partial staging
- selective restoration
- semantic diff explanation
- educational overlays
- provenance mapping

This file provides the rendering foundation for those systems.

---

# CSS Dependency

The component relies on external CSS classes including:

- diff-placeholder
- diff-pretty
- diff-line--selected
- diff-line__num
- diff-line__text

Additional classes are dynamically returned from:

    diffLineClass(...)

Visual styling is entirely externalized.

---

# React Characteristics

This file:

- contains no hooks
- contains no internal state
- contains no effects
- acts as a pure render function

---

# Accessibility Characteristics

Uses semantic rendering elements:

- div
- span
- code

No keyboard navigation or ARIA attributes currently exist.

Interaction is currently pointer-oriented.

---

# Performance Characteristics

Rendering complexity scales linearly with:

    number_of_diff_lines

No virtualization currently exists.

Very large diffs may produce large DOM trees.

---

# Potential Future Expansion

Potential future enhancements include:

- syntax-aware diff rendering
- virtualization
- keyboard navigation
- line-range selection
- hunk collapsing
- inline explanations
- blame overlays
- semantic annotations
- file metadata rendering
- patch export
- partial commit integration

None currently exist.

---

# Design Characteristics

The component is:

- deterministic
- interactive
- presentation-focused
- line-oriented
- reusable
- externally controlled

---

# Verification Notes

This document is based on full-file inspection of:

- `src/components/DiffViewer.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
