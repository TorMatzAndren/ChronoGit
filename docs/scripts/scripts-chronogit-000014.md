Title: ConfirmModal.tsx
ID: scripts-chronogit-000014
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: workspace-components
Updated: 2026-05-07
Revision: 1

---

@role:ui-component
@subsystem:workspace-components
@entity:script:chronogit-app/src/components/ConfirmModal.tsx
@entity:/chronogit-app/src/components/ConfirmModal.tsx
@semantic:confirmation-modal
@semantic:danger-confirmation
@semantic:interaction-guard
@semantic:workspace-components
@semantic:operator-confirmation
@state:active

# ConfirmModal.tsx

**Date:** 2026-05-07
**Summary:** Modal confirmation component used for guarded user operations inside ChronoGit. Supports destructive action signaling, typed confirmation validation, explicit operator acknowledgement, and asynchronous confirmation workflows.
**Keywords:** confirm modal, danger confirmation, typed confirmation, modal dialog, guarded actions
**Tags:** scripts, frontend, react, modal, confirmation, ui, workspace

Guarded confirmation modal component for ChronoGit operations.

---

## Purpose

`ConfirmModal.tsx` provides a reusable modal confirmation surface for operator-sensitive actions.

Responsibilities include:

- rendering confirmation overlays
- rendering action descriptions
- rendering danger-state UI
- validating typed confirmation requirements
- handling confirm/cancel interaction workflows
- guarding destructive actions

This component acts as a reusable operator confirmation barrier.

---

# Architectural Role

This file provides the UI layer for guarded execution workflows.

It separates:

- operator acknowledgement
- confirmation rendering
- interaction validation
- typed confirmation enforcement

from:

- Git execution
- backend mutation
- repository orchestration
- persistence logic

---

# Imported Dependencies

Imports:

- `ConfirmAction`

from:

    ../core/chronogitRuntimeTypes

---

# Props Type

## Definition

Defines:

    type Props

Fields:

- `action`
- `confirmText`
- `setConfirmText`
- `onCancel`
- `onConfirm`

---

## action

Type:

    ConfirmAction

Purpose:

Structured confirmation action definition.

Contains:

- title
- body
- confirmation label
- danger state
- optional typed confirmation requirements
- executable action metadata

---

## confirmText

Type:

    string

Purpose:

Current operator-entered typed confirmation value.

Acts as controlled input state.

---

## setConfirmText

Type:

    (text: string) => void

Purpose:

Updates typed confirmation state.

---

## onCancel

Type:

    () => void

Purpose:

Closes or aborts the confirmation workflow.

---

## onConfirm

Type:

    () => Promise<void>

Purpose:

Executes the guarded confirmation workflow.

Asynchronous by design.

---

# ConfirmModal Component

## Export

Exports:

    ConfirmModal

Signature:

    ConfirmModal({...})

---

# Root Overlay

## Overlay Container

Renders:

    <div className="confirm-overlay">

Purpose:

Full-screen modal overlay boundary.

Acts as:

- visual isolation layer
- interaction focus layer
- modal backdrop surface

---

# Modal Container

## Modal Body

Renders:

    <div className={`confirm-modal ...`}>

Purpose:

Primary confirmation dialog container.

---

# Danger State Styling

If:

    action.danger === true

Then:

    confirm-modal--danger

is added.

Purpose:

Provides elevated visual signaling for destructive operations.

---

# Eyebrow Indicator

## Eyebrow Rendering

Renders:

    Destructive action

or:

    Confirmation

depending on danger state.

Purpose:

Provides immediate contextual severity classification.

---

# Title Rendering

## Heading

Renders:

    <h2>{action.title}</h2>

Purpose:

Displays operator-facing action title.

---

# Body Rendering

## Body

Renders:

    <pre>{action.body}</pre>

Purpose:

Displays structured confirmation details.

Use of `<pre>` preserves formatting and whitespace.

This suggests confirmation messages may contain:

- multiline summaries
- command-like text
- structured operation descriptions
- deterministic execution previews

---

# Typed Confirmation Workflow

## Conditional Rendering

Typed confirmation UI only renders if:

    action.requiredText

exists.

---

# Required Text Label

Renders:

    action.requiredTextLabel

or fallback:

    Type X to continue.

Purpose:

Provides explicit operator instruction for destructive actions.

---

# Confirmation Input

## Input

Renders:

    <input ... />

Purpose:

Captures typed operator acknowledgement text.

---

## Placeholder

Uses:

    action.requiredText

Purpose:

Displays expected confirmation phrase.

---

# Action Buttons

## Container

Renders:

    <div className="confirm-modal__actions">

Purpose:

Groups confirmation workflow controls.

---

# Cancel Button

## Cancel Action

Renders:

    <button onClick={onCancel}>

Purpose:

Allows aborting the operation.

---

# Confirm Button

## Confirm Button

Renders:

    <button ...>

Purpose:

Executes guarded action workflow.

---

# Danger Styling

If:

    action.danger === true

Uses:

    danger-button

Else:

    confirm

Purpose:

Allows differentiated styling between destructive and standard operations.

---

# Confirmation Validation

## Disabled State Logic

Button becomes disabled if:

- `requiredText` exists
- entered text does not exactly match required text

Validation:

    confirmText.trim() !== action.requiredText

Purpose:

Prevents accidental destructive execution.

---

# Exact Match Doctrine

Validation requires deterministic exact text matching.

This reflects ChronoGit’s explicit operator acknowledgement doctrine.

The operator must intentionally type the required phrase.

---

# Confirm Execution

## Execution Wrapper

Behavior:

    void onConfirm();

Purpose:

Executes asynchronous confirmation workflow.

Use of `void` intentionally discards returned Promise result handling inside the event callback.

---

# Deterministic Characteristics

This component is deterministic relative to:

- props
- local input state
- user interaction

No hidden state exists.

No backend mutation exists inside the component itself.

---

# Separation of Concerns

This component handles:

- modal rendering
- confirmation validation
- operator acknowledgement
- guarded interaction

It does not handle:

- Git mutation
- repository state
- persistence
- backend orchestration
- network logic
- actual execution semantics

---

# Confirmation Doctrine

This component reflects ChronoGit’s operational doctrine:

- dangerous actions must be explicit
- operator acknowledgement must be intentional
- destructive behavior must be visible
- mutation boundaries must be surfaced clearly

---

# Safety Characteristics

The component supports:

- visual danger signaling
- typed confirmation barriers
- explicit cancel paths
- disabled execution until validated

These patterns reduce accidental destructive execution.

---

# UI Semantics

Uses semantic HTML elements:

- div
- h2
- pre
- label
- input
- button

This maintains predictable structural rendering.

---

# CSS Dependency

The component relies on external CSS classes including:

- confirm-overlay
- confirm-modal
- confirm-modal--danger
- confirm-modal__eyebrow
- confirm-required-text
- confirm-modal__actions
- danger-button
- confirm

All styling behavior is externalized.

---

# No Internal State

This component does not use:

- useState
- useEffect
- refs

All state is externally controlled via props.

This makes the component fully controlled and predictable.

---

# Controlled Component Design

Input state is externally owned.

This allows parent orchestration layers to control:

- confirmation lifecycle
- reset behavior
- modal persistence
- action coordination

---

# Potential Future Expansion

Potential future enhancements include:

- escape-key cancellation
- focus trapping
- keyboard navigation
- loading states
- progress indicators
- asynchronous error display
- countdown confirmation
- multiple confirmation stages
- audit logging integration
- operation provenance surfaces

None currently exist.

---

# Design Characteristics

The component is:

- reusable
- deterministic
- guarded
- operator-oriented
- interaction-focused
- safety-oriented

---

# Verification Notes

This document is based on full-file inspection of:

- `src/components/ConfirmModal.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
