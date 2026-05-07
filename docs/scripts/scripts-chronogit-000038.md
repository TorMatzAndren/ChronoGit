Title: UiExplainShortcutsPanel.tsx
ID: scripts-chronogit-000038
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: ui-explanation
Updated: 2026-05-07
Revision: 1

---

@role:ui-panel
@subsystem:ui-explanation
@entity:script:chronogit-app/src/panels/UiExplainShortcutsPanel.tsx
@entity:/chronogit-app/src/panels/UiExplainShortcutsPanel.tsx
@semantic:llm-shortcuts
@semantic:git-education
@semantic:ui-explanation
@semantic:beginner-mode
@semantic:llm-context
@semantic:teaching-surface
@state:active

# UiExplainShortcutsPanel.tsx

**Date:** 2026-05-07
**Summary:** Lightweight educational shortcut panel that sends predefined Git and ChronoGit explanation contexts into the local LLM explanation system.
**Keywords:** LLM shortcuts, Git explanation, Time Machine explanation, UI education, local LLM
**Tags:** scripts, frontend, react, llm, git, education, explanation, shortcuts

Educational LLM shortcut surface for ChronoGit.

---

## Purpose

`UiExplainShortcutsPanel.tsx` provides predefined educational explanation triggers for the local LLM system.

Responsibilities include:

- exposing quick educational explanation buttons
- generating structured explanation contexts
- teaching ChronoGit Git-flow concepts
- teaching Time Machine concepts
- forwarding explanation requests into the external LLM explanation pipeline

This component acts as a lightweight educational shortcut layer.

---

# Architectural Role

This component belongs to ChronoGit’s:

- educational UI layer
- beginner Git teaching layer
- local LLM explanation surface
- structured explanation-context system

It does not:

- invoke Git
- load repository state
- inspect diffs
- inspect commits
- render LLM responses

It only emits structured explanation requests.

---

# Local ExplainContext Type

Defines:

    ExplainContext

Fields:

- `kind`
- `title`
- `plainText`
- `rawTruth`

---

# ExplainContext Purpose

Represents a structured explanation request payload.

This object is forwarded into:

    explainUiContext(...)

The receiving system is responsible for:

- LLM invocation
- persistence
- streaming
- rendering
- logging
- explanation lifecycle

---

# ExplainContext Fields

## kind

Type:

    string

Purpose:

Semantic category of explanation request.

Examples:

- `git_flow`
- `time_machine`

---

## title

Type:

    string

Purpose:

Human-readable explanation title.

Used for:

- LLM logs
- UI display
- explanation grouping

---

## plainText

Type:

    string

Purpose:

Simplified human explanation text.

Represents the beginner-facing conceptual layer.

---

## rawTruth

Type:

    string

Purpose:

Deterministic Git/system truth explanation.

Represents the authoritative operational meaning behind the simplified explanation.

---

# Props Type

Defines:

    type Props

Fields:

- `disabled`
- `explainUiContext`

---

## disabled

Type:

    boolean

Purpose:

Disables shortcut buttons.

Used when the LLM system is unavailable or busy.

---

## explainUiContext

Type:

    (context: ExplainContext) => void

Purpose:

External explanation dispatch function.

This component delegates all LLM behavior externally.

---

# UiExplainShortcutsPanel Component

## Export

Exports:

    UiExplainShortcutsPanel

---

# Root Container

Renders:

    <section className="ui-explain-shortcuts">

Purpose:

Container for educational explanation shortcut actions.

---

# Git Flow Explanation Shortcut

## Button Purpose

Provides a beginner explanation of ChronoGit’s Git flow abstraction.

---

## Button Text

Renders:

    Ask LLM: explain Git flow

---

## Generated ExplainContext

### kind

    git_flow

### title

    Explain ChronoGit flow

### plainText

    ChronoGit presents Git as Working files → Prepared changes → Snapshot.

### rawTruth

    Working files are local disk changes. Prepared changes are staged files. Snapshot means Git commit.

---

# Educational Intent

This explanation teaches ChronoGit’s simplified Git mental model:

    Working files → Prepared changes → Snapshot

This is one of ChronoGit’s central beginner abstractions.

---

# Time Machine Explanation Shortcut

## Button Purpose

Provides an explanation of ChronoGit’s Time Machine subsystem.

---

## Button Text

Renders:

    Ask LLM: explain Time Machine

---

## Generated ExplainContext

### kind

    time_machine

### title

    Explain Time Machine

### plainText

    Time Machine lets users inspect earlier Git snapshots, changed files, file diffs, and restore selected files.

### rawTruth

    Snapshot list is commit history. Changed files are detected per selected snapshot. File diff shows the patch for one selected file. Restore only restores one selected file into the working folder; it does not commit automatically and does not reset the whole repository.

---

# Time Machine Doctrine

This explanation reinforces important ChronoGit safety doctrine:

- restore affects only one selected file
- restore modifies working folder only
- restore does not auto-commit
- restore does not reset repository state
- commit history is the authoritative snapshot timeline

---

# Educational Layer Separation

The component explicitly separates:

## Beginner Explanation

Contained in:

    plainText

Simple conceptual framing.

---

## Deterministic Truth

Contained in:

    rawTruth

Operationally precise Git/system behavior.

---

# ChronoGit Teaching Doctrine

This component embodies a core ChronoGit principle:

- simplify Git mentally
- preserve underlying truth
- never replace Git semantics with fake abstractions
- use LLMs as educational overlays rather than truth sources

---

# LLM Boundary

This component does not:

- run the LLM
- stream responses
- parse responses
- verify responses
- persist responses
- render responses

It only creates explanation requests.

---

# Mutation Boundary

This component performs no repository mutations.

No Git commands are executed.

No filesystem mutations occur.

---

# Git Boundary

This component does not inspect Git state.

All explanations are static predefined educational contexts.

---

# React Characteristics

This component:

- contains no hooks
- contains no local state
- contains no async work
- contains no persistence
- contains no backend calls
- is fully prop-driven

---

# Deterministic Characteristics

The generated explanation payloads are fully deterministic.

The only non-deterministic component is the downstream LLM response system.

---

# CSS Dependency

Depends on:

- `ui-explain-shortcuts`

No additional styling logic exists internally.

---

# Current Known Gaps

- No dynamic explanation generation exists.
- No repository-aware educational contexts exist.
- No diff-aware shortcuts exist.
- No branch-awareness exists.
- No remote-awareness exists.
- No operation-state awareness exists.
- No localization system exists.
- No beginner/pro toggle exists.
- No loading indicators exist.
- No explanation queue exists.
- No explanation categories beyond two static shortcuts exist.

---

# Potential Future Expansion

Potential future additions include:

- remote-state explanation shortcuts
- merge conflict explanation shortcuts
- branch explanation shortcuts
- staged vs working explanation shortcuts
- detached HEAD explanation shortcuts
- rebase explanation shortcuts
- commit-boundary explanation shortcuts
- contextual shortcut generation
- diff-aware explanation templates
- operation-state educational warnings
- beginner-mode conditional visibility
- explanation history integration

None currently exist.

---

# Design Characteristics

The component is:

- educational
- deterministic
- beginner-oriented
- lightweight
- non-mutating
- LLM-integrated
- truth-aware

---

# Verification Notes

This document is based on direct inspection of:

- `src/panels/UiExplainShortcutsPanel.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
