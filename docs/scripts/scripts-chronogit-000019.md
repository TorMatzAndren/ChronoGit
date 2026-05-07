Title: diffUtils.ts
ID: scripts-chronogit-000019
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: diff-rendering
Updated: 2026-05-07
Revision: 1

---

@role:utility-library
@subsystem:diff-rendering
@entity:script:chronogit-app/src/lib/diffUtils.ts
@entity:/chronogit-app/src/lib/diffUtils.ts
@semantic:git-diff
@semantic:diff-rendering
@semantic:visual-classification
@semantic:ui-utilities
@semantic:patch-visualization
@state:active

# diffUtils.ts

**Date:** 2026-05-07
**Summary:** Minimal deterministic utility layer for classifying Git diff lines into semantic CSS rendering categories.
**Keywords:** diff rendering, git diff parser, css classification, patch visualization, diff styling
**Tags:** scripts, frontend, utility, git, diff, rendering, classification

Utility helpers for Git diff visualization.

---

## Purpose

`diffUtils.ts` provides deterministic visual classification logic for Git diff rendering.

Responsibilities include:

- identifying diff metadata lines
- identifying hunk boundaries
- identifying additions
- identifying removals
- mapping diff structures into CSS classes

This file acts as a lightweight semantic rendering bridge between raw Git diff text and ChronoGit’s visual diff presentation layer.

---

# Architectural Role

This utility exists between:

- raw textual Git patch output

and:

- styled visual diff rendering

It provides semantic interpretation of line prefixes without mutating diff content itself.

---

# Exported Functions

Exports:

    diffLineClass

---

# diffLineClass

## Signature

    diffLineClass(line: string): string

---

# Purpose

Determines which CSS rendering class should be applied to a specific diff line.

Classification is based entirely on Git diff line prefixes.

---

# Input

## line

Type:

    string

Purpose:

Represents a single line from a Git diff or patch.

---

# Output

Returns:

    string

Purpose:

Provides CSS class names for semantic visual styling.

---

# Classification Order

Classification occurs sequentially using prefix checks.

Order is important.

The first matching condition terminates evaluation.

---

# File Metadata Classification

## Logic

Checks:

    line.startsWith("+++")
    line.startsWith("---")

Returns:

    "diff-line diff-line--file"

---

# Purpose

Identifies Git diff file metadata lines.

Examples:

    +++ b/file.ts
    --- a/file.ts

These represent file-version markers rather than actual content additions/removals.

---

# Hunk Classification

## Logic

Checks:

    line.startsWith("@@")

Returns:

    "diff-line diff-line--hunk"

---

# Purpose

Identifies Git diff hunk boundary markers.

Examples:

    @@ -10,5 +10,8 @@

These indicate line-range transitions inside the patch.

---

# Addition Classification

## Logic

Checks:

    line.startsWith("+")

Returns:

    "diff-line diff-line--add"

---

# Purpose

Identifies inserted/additional lines in the patch.

Examples:

    + const value = 1;

---

# Important Ordering Detail

Addition detection occurs after:

- `+++`

classification.

This prevents Git file metadata markers from being incorrectly classified as inserted source lines.

---

# Removal Classification

## Logic

Checks:

    line.startsWith("-")

Returns:

    "diff-line diff-line--remove"

---

# Purpose

Identifies removed/deleted lines in the patch.

Examples:

    - const value = 0;

---

# Important Ordering Detail

Removal detection occurs after:

- `---`

classification.

This prevents file metadata markers from being incorrectly classified as deleted source lines.

---

# Git Header Classification

## Logic

Checks:

    line.startsWith("diff --git")

Returns:

    "diff-line diff-line--header"

---

# Purpose

Identifies Git diff file-section headers.

Examples:

    diff --git a/file.ts b/file.ts

These represent structural patch boundaries.

---

# Default Classification

## Fallback

Returns:

    "diff-line"

---

# Purpose

Represents unclassified/default diff lines.

Typically includes:

- unchanged context lines
- whitespace
- neutral patch content

---

# Deterministic Characteristics

This utility is fully deterministic.

Output depends exclusively on:

- exact string prefix evaluation

No:

- regex parsing
- mutation
- async behavior
- side effects
- state
- heuristics

exist.

---

# Git Diff Assumptions

The utility assumes standard Git unified diff formatting.

Recognized structures include:

- diff headers
- file markers
- hunk markers
- additions
- removals

No advanced patch parsing exists.

---

# CSS Coupling

This utility is tightly coupled to ChronoGit diff CSS classes.

Expected CSS classes include:

- diff-line
- diff-line--file
- diff-line--hunk
- diff-line--add
- diff-line--remove
- diff-line--header

Visual rendering depends on external CSS definitions.

---

# Usage Context

This utility is intended for use by:

- DiffViewer
- patch rendering surfaces
- Time Machine panels
- commit comparison viewers
- file history rendering systems

---

# Performance Characteristics

This utility is computationally lightweight.

Operations consist solely of:

- sequential string prefix comparisons

No allocations beyond return strings occur.

---

# Semantic Philosophy

ChronoGit intentionally separates:

- diff semantic interpretation

from:

- visual rendering

This utility represents the semantic classification layer.

The rendering layer consumes the resulting CSS classes separately.

---

# Separation of Concerns

This utility handles:

- line classification
- semantic diff categorization
- rendering hint generation

It does not handle:

- patch parsing
- syntax highlighting
- line selection
- Git execution
- file loading
- patch generation

---

# React Independence

This file contains:

- no React code
- no hooks
- no state
- no components

It is framework-light utility logic.

---

# Potential Future Expansion

Potential future improvements include:

- rename detection styling
- binary patch classification
- whitespace-change classification
- inline-word diff support
- syntax-aware rendering hooks
- moved-code highlighting
- patch warning markers
- conflict marker classification

None currently exist.

---

# Design Characteristics

The utility is:

- deterministic
- lightweight
- Git-specific
- rendering-oriented
- side-effect-free
- easily composable

---

# Verification Notes

This document is based on full-file inspection of:

- `src/lib/diffUtils.ts`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
