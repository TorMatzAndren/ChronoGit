Title: BeginnerModePanel.tsx
ID: scripts-chronogit-000020
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: educational-ui
Updated: 2026-05-07
Revision: 1

---

@role:ui-component
@subsystem:educational-ui
@entity:script:chronogit-app/src/panels/BeginnerModePanel.tsx
@entity:/chronogit-app/src/panels/BeginnerModePanel.tsx
@semantic:beginner-mode
@semantic:educational-ui
@semantic:git-learning
@semantic:ui-mode-switching
@semantic:workspace-panels
@state:active

# BeginnerModePanel.tsx

**Date:** 2026-05-07
**Summary:** Minimal UI panel for toggling ChronoGit’s educational beginner-mode layer between teaching-oriented and compact expert-oriented presentation modes.
**Keywords:** beginner mode, educational ui, git learning, expert mode, teaching hints
**Tags:** scripts, frontend, react, ui, beginner-mode, educational-layer, workspace

Educational mode toggle panel for ChronoGit.

---

## Purpose

`BeginnerModePanel.tsx` provides a dedicated UI surface for enabling or disabling ChronoGit’s educational beginner-mode layer.

Responsibilities include:

- exposing beginner-mode state
- toggling educational UI behavior
- communicating current UI philosophy
- describing beginner vs expert presentation modes

This component acts as a high-level UX philosophy toggle rather than a Git feature surface.

---

# Architectural Role

This component represents one of ChronoGit’s core design doctrines:

Git truth remains identical while the explanatory surface adapts to user experience level.

The panel therefore controls:

- educational verbosity
- terminology translation
- guidance density

without changing actual Git behavior.

---

# Props Type

## Definition

Defines:

    type Props

Fields:

- `beginnerMode`
- `onToggle`

---

# beginnerMode

Type:

    boolean

Purpose:

Represents whether educational beginner-mode presentation is enabled.

---

# onToggle

Type:

    () => void

Purpose:

Callback used to switch between beginner and expert UI presentation modes.

---

# BeginnerModePanel Component

## Export

Exports:

    BeginnerModePanel

---

# Root Container

## Main Card

Renders:

    <div className="beginner-main-card">

Purpose:

Primary container for the educational-mode surface.

---

# Title Rendering

## Title

Renders:

    Mode

Purpose:

Identifies the panel as a UI operating-mode selector.

---

# Toggle Button

## Button

Renders:

    <button>

Purpose:

Primary interaction surface for switching UI presentation modes.

---

# Dynamic Button Styling

## Conditional Classes

Uses:

    beginner-toggle--on
    beginner-toggle--off

depending on:

    beginnerMode

Purpose:

Visually communicates current operating mode.

---

# Toggle Interaction

## onClick

Invokes:

    onToggle

Purpose:

Switches between beginner and expert presentation modes.

The component itself performs no state mutation.

---

# Toggle Label

## Rendered Text

Displays:

    Beginner mode: ON

or:

    Beginner mode: OFF

depending on current state.

Purpose:

Provides immediate visibility into current UI mode.

---

# Explanatory Note

## Conditional Rendering

Uses ternary logic based on:

    beginnerMode

---

# Beginner Explanation

When enabled:

Displays:

    "Shows teaching hints, hover help, and plain-language Git meaning."

Purpose:

Explains the educational augmentation layer.

---

# Expert Explanation

When disabled:

Displays:

    "Compact expert view. Raw Git truth stays visible."

Purpose:

Clarifies that disabling beginner mode:

- reduces explanatory verbosity
- preserves direct Git visibility

This reinforces ChronoGit’s truth-surface philosophy.

---

# Educational UI Doctrine

This component directly embodies one of ChronoGit’s foundational principles:

Do not hide Git truth from beginners.

Instead:

- explain Git
- translate terminology
- expose meaning
- gradually reduce scaffolding

The system therefore attempts to teach Git rather than replace Git.

---

# Terminology Philosophy

ChronoGit’s beginner mode intentionally maps concepts such as:

- Snapshot ↔ Commit
- Prepared ↔ Staged
- Timeline ↔ History
- Restore ↔ Checkout/Reset semantics

This panel controls access to those explanatory surfaces.

---

# Truth Philosophy

A major statement exists directly in the component text:

    "Raw Git truth stays visible."

This reflects a core ChronoGit architectural doctrine:

The UI may simplify language, but must never falsify or obscure underlying Git state.

---

# Deterministic Characteristics

This component is fully deterministic.

Output depends exclusively on:

- `beginnerMode`

No:

- async behavior
- backend interaction
- local state
- side effects
- repository operations

exist.

---

# State Ownership

This component does not own state.

It is fully controlled externally through props.

This makes the component:

- predictable
- composable
- reusable

---

# Interaction Characteristics

The component contains a single user interaction:

- mode toggle button

No advanced interaction systems currently exist.

---

# CSS Dependencies

Depends on external CSS classes including:

- beginner-main-card
- beginner-main-card__title
- beginner-main-card__note
- beginner-toggle
- beginner-toggle--on
- beginner-toggle--off

All styling is externalized.

---

# Accessibility Characteristics

Uses semantic elements including:

- button
- div

No advanced ARIA or accessibility systems currently exist.

---

# React Characteristics

This component:

- is fully prop-driven
- contains no hooks
- contains no local state
- performs no async operations
- acts as a pure render surface

---

# UI Philosophy Significance

Although technically small, this component represents a major ChronoGit identity decision.

ChronoGit is intentionally designed as:

- educational
- transparent
- truth-oriented
- beginner-compatible

rather than:

- abstracted
- hidden-state-driven
- Git-obscuring

This panel exposes that philosophy explicitly.

---

# Separation of Concerns

This component handles:

- mode visualization
- educational-mode explanation
- toggle interaction UI

It does not handle:

- persistence
- terminology translation logic
- Git operations
- repository state
- configuration storage

---

# Potential Future Expansion

Potential future improvements include:

- multi-level expertise modes
- contextual onboarding
- tutorial integration
- progressive disclosure systems
- hover glossary systems
- Git concept explanations
- educational telemetry
- workspace-specific teaching overlays
- accessibility enhancements

None currently exist.

---

# Design Characteristics

The component is:

- minimal
- deterministic
- educational
- philosophy-oriented
- low-complexity
- truth-centric

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/BeginnerModePanel.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
