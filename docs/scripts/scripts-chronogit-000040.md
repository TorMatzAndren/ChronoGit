Title: HelpHint.tsx
ID: scripts-chronogit-000040
Date: 2026-05-16
Author: Matz
Type: scripts
Subsystem: workspace-components
Updated: 2026-05-16
Revision: 1

---

@role:ui-component
@subsystem:workspace-components
@entity:script:chronogit-app/src/components/HelpHint.tsx
@entity:/chronogit-app/src/components/HelpHint.tsx
@semantic:help-hint
@semantic:beginner-guidance
@semantic:contextual-help
@semantic:interactive-ui
@semantic:workspace-components
@semantic:teaching-surface
@state:active

# HelpHint.tsx

**Date:** 2026-05-16
**Summary:** Reusable contextual help-hint component for ChronoGit. Renders a compact question-mark button, toggles an explanatory popup, supports left/right alignment, and dismisses itself when the user clicks outside the component.
**Keywords:** help hint, contextual help, beginner guidance, popup help, workspace component, teaching surface
**Tags:** scripts, frontend, react, ui, help, beginner-mode, education, workspace-components

Reusable contextual help-hint component for ChronoGit.

---

## Purpose

`HelpHint.tsx` provides a small reusable contextual help surface.

Responsibilities include:

- rendering a compact help button
- toggling an explanatory popup
- displaying a title and arbitrary React children
- supporting compact display mode
- supporting left/right popup alignment
- dismissing the popup when the user clicks outside the component

This component exists to make beginner-facing explanation available near confusing Git concepts without permanently expanding the UI.

---

## Architectural Role

This component belongs to ChronoGit’s workspace component layer.

It is used by panels that need inline educational hints, especially where raw Git concepts require explanation.

It does not:

- call the backend
- invoke Git
- mutate repository state
- persist UI state
- invoke LLM systems
- decide explanation content itself

It only renders and controls a local popup surface.

---

## Imported Dependencies

Imports React hooks:

- `useEffect`
- `useRef`
- `useState`

from:

    react

---

## Props Type

Defines:

    type Props

Fields:

- `title`
- `children`
- `compact`
- `align`

---

## title

Type:

    string

Purpose:

Human-readable title shown both as the button tooltip and as the popup heading.

---

## children

Type:

    React.ReactNode

Purpose:

Popup body content supplied by the caller.

This lets each panel provide its own deterministic educational explanation.

---

## compact

Type:

    boolean | undefined

Default:

    false

Purpose:

Adds compact styling when true.

CSS class:

    cg-help-hint--compact

---

## align

Type:

    "left" | "right" | undefined

Default:

    "left"

Purpose:

Controls popup alignment.

CSS classes:

- `cg-help-hint--left`
- `cg-help-hint--right`

---

# HelpHint Component

## Export

Exports:

    HelpHint

---

## Internal Refs

Defines:

    rootRef

Type:

    HTMLDivElement | null

Purpose:

Tracks the root element so outside-click detection can determine whether a pointer event happened outside the component.

---

## Internal State

Defines:

    open

Purpose:

Tracks whether the popup is currently visible.

---

## Outside Click Handling

Uses:

    useEffect

to register a global `pointerdown` listener on `window`.

Behavior:

- if the pointer target is outside `rootRef`, the popup closes
- the listener is removed when the component unmounts

This keeps popup behavior local and deterministic.

---

## Root Rendering

Renders:

    <div>

with classes:

- `cg-help-hint`
- `cg-help-hint--compact` when compact
- `cg-help-hint--right` when right aligned
- `cg-help-hint--left` otherwise

The root element receives:

    ref={rootRef}

---

## Help Button

Renders:

    <button type="button">

CSS class:

    cg-help-hint__button

Button text:

    ?

Behavior:

- toggles popup open/closed
- uses `title` as native tooltip text

---

## Popup Rendering

When `open` is true, renders:

    <div className="cg-help-hint__popup">

The popup contains:

- `<strong>{title}</strong>`
- `<div>{children}</div>`

The component does not sanitize, transform, or generate the child content.

---

# Mutation Boundary

This component performs no repository mutation.

No Git commands are executed.

No filesystem writes occur.

---

# Backend Boundary

This component performs no Tauri invocation.

It has no backend dependency.

---

# LLM Boundary

This component does not call or configure LLM systems.

It can explain LLM-related UI if the caller supplies such content, but the component itself has no LLM behavior.

---

# Deterministic Characteristics

The component is deterministic with respect to its props and pointer events.

The only state transition is local popup visibility.

---

# CSS Dependency

Depends on external CSS classes:

- `cg-help-hint`
- `cg-help-hint--compact`
- `cg-help-hint--left`
- `cg-help-hint--right`
- `cg-help-hint__button`
- `cg-help-hint__popup`

All styling is externalized.

---

# Current Known Gaps

- No keyboard Escape handling exists.
- No focus trapping exists.
- No ARIA-expanded attribute exists.
- No portal rendering exists.
- Popup positioning is CSS-dependent.
- No animation logic exists.
- No persisted open/closed state exists.

---

# Potential Future Expansion

Potential future additions include:

- Escape-key close handling
- ARIA attributes
- focus return behavior
- portal-based overflow-safe positioning
- preferred placement detection
- small/medium/large hint variants
- richer keyboard navigation

None currently exist.

---

# Design Characteristics

The component is:

- lightweight
- reusable
- local-state-only
- beginner-guidance oriented
- non-mutating
- backend-free
- LLM-free
- panel-agnostic

---

# Verification Notes

This document is based on full-file inspection of:

- `src/components/HelpHint.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
