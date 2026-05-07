Title: workspaceLayout.ts
ID: scripts-chronogit-000006
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: workspace-ui
Updated: 2026-05-07
Revision: 1

---

@role:workspace-layout
@subsystem:workspace-ui
@entity:script:chronogit-app/src/core/workspaceLayout.ts
@entity:/chronogit-app/src/core/workspaceLayout.ts
@semantic:workspace-layout
@semantic:panel-instantiation
@semantic:panel-normalization
@semantic:workspace-state-normalization
@semantic:panel-default-sizing
@semantic:workspace-persistence
@semantic:panel-registry
@semantic:grid-layout
@semantic:frontend-state-repair
@state:active

# workspaceLayout.ts

**Date:** 2026-05-07
**Summary:** Workspace layout and normalization utility layer for ChronoGit. Defines panel instantiation helpers, panel title resolution, grid snapping, persisted workspace-state normalization, default panel geometry rules, and frontend recovery logic for malformed or incomplete saved workspace data.
**Keywords:** workspace layout, panel normalization, workspace persistence, panel geometry, grid snapping, state normalization, panel registry, workspace recovery
**Tags:** scripts, workspace-ui, layout, persistence, normalization, frontend-state, panels

Workspace layout orchestration and normalization layer for ChronoGit.

---

## Purpose

`workspaceLayout.ts` defines the frontend workspace layout utility layer used by ChronoGit.

It is responsible for:

- panel instantiation
- default panel geometry
- panel title resolution
- persisted workspace-state normalization
- malformed-state recovery
- grid snapping support

This file does not render UI directly.

It provides deterministic workspace layout construction and repair helpers used by the frontend runtime.

---

## Architectural Role

This file acts as the normalization and geometry layer between:

- raw persisted workspace state
- panel registry metadata
- runtime workspace rendering

It transforms incomplete or malformed layout state into valid workspace structures.

It is part of the workspace persistence and reconstruction pipeline.

---

## Imported Dependencies

Imports:

- `PANEL_REGISTRY`
- `PanelInstance`
- `PanelType`
- `WorkspaceTab`

`PANEL_REGISTRY` is used as the authoritative title lookup source for panel types.

---

## Grid System

### GRID Constant

Code:

    const GRID = 12;

Defines the workspace snapping grid size.

Used by:

- `snap()`

---

## Grid Snapping

### snap()

Signature:

    export function snap(value: number)

Rounds numeric positions/sizes to the nearest grid boundary.

Formula:

    Math.round(value / GRID) * GRID

Used to stabilize panel positioning and alignment.

---

## Panel Title Resolution

### titleFor()

Signature:

    export function titleFor(type: PanelType)

Looks up panel display titles through `PANEL_REGISTRY`.

Returns:

- matching registry title
- fallback `"Panel"` if type is missing

This establishes the registry as the authoritative frontend panel-title source.

---

## Panel Instantiation

### makePanel()

Signature:

    export function makePanel(type: PanelType, index = 0)

Creates default `PanelInstance` structures.

Generated fields:

- `id`
- `type`
- `title`
- `x`
- `y`
- `w`
- `h`

---

## Panel ID Generation

Panel IDs are generated using:

    panel-${Date.now()}-${Math.random().toString(16).slice(2)}

This creates runtime-unique frontend panel IDs.

IDs are not deterministic across sessions.

---

## Default Panel Placement

Default offsets:

    x: 24 + index * 32
    y: 24 + index * 32

New panels cascade diagonally across the workspace.

This avoids exact overlap during repeated panel creation.

---

## Default Panel Sizing Rules

Special width rules:

- `change-lists` → `860`
- `time-machine` → `1040`
- `remote-actions` → `860`
- `commit-preflight` → `520`
- default → `390`

Special height rules:

- `change-lists` → `420`
- `time-machine` → `620`
- `remote-actions` → `520`
- default → `240`

The layout system encodes semantic expectations about panel complexity and required screen space.

---

## Panel Normalization

### normalizePanel()

Signature:

    export function normalizePanel(panel, index)

Repairs and normalizes partially valid panel structures.

Input type:

    Partial<PanelInstance>

Returns:

    PanelInstance

---

## Panel Type Recovery

Missing panel types fall back to:

    "empty"

This prevents malformed persisted state from crashing the workspace.

---

## Panel Property Recovery Rules

### ID Recovery

Fallback:

    panel-${Date.now()}-${index}

### Title Recovery

Uses:

    titleFor(type)

### Position Recovery

Fallback offsets:

    24 + index * 32

### Width Recovery

Minimum width:

    240

Invalid widths fall back to:

    makePanel(type, index).w

### Height Recovery

Minimum height:

    140

Invalid heights fall back to:

    makePanel(type, index).h

---

## Numeric Validation

Numeric fields use:

    Number.isFinite(...)

This prevents invalid persisted values such as:

- `NaN`
- `Infinity`
- non-number values

from entering runtime layout state.

---

## Workspace State Normalization

### normalizeState()

Signature:

    export function normalizeState(input, defaultStateFactory)

Normalizes persisted workspace state into a valid runtime structure.

This is the primary frontend recovery boundary for corrupted or incomplete workspace persistence.

---

## Default State Recovery

If input is:

- missing
- non-object
- missing tabs
- empty tabs array

then:

    defaultStateFactory()

is returned.

This establishes the default-state factory as the authoritative workspace bootstrap source.

---

## WorkspaceTab Normalization

Each tab is normalized into:

- `id`
- `name`
- `panels`

Fallback rules:

### Missing Tab ID

    tab-${tabIndex}

### Missing Tab Name

    Tab ${tabIndex + 1}

---

## Empty Panel Recovery

If a tab contains:

- no panels
- invalid panels array

then a default panel is inserted:

    makePanel("current-state")

This guarantees every tab contains at least one valid panel instance.

---

## Active Tab Recovery

`activeTabId` is validated against normalized tabs.

If invalid:

    tabs[0].id

becomes the active tab.

This prevents broken active-tab references.

---

## Beginner Mode Recovery

Logic:

    beginnerMode: raw.beginnerMode !== false

Behavior:

- defaults to `true`
- only explicit `false` disables beginner mode

This establishes beginner mode as the frontend default behavior.

---

## Repository Path Recovery

Fallback repository path:

    "/home/dretski/projects/ChronoGit"

Used when persisted workspace state lacks a valid repository path.

This is currently a hardcoded development-oriented fallback path.

---

## Persistence and Recovery Role

This file forms part of ChronoGit’s persistence recovery layer.

It ensures malformed workspace state does not propagate directly into:

- rendering systems
- drag systems
- panel systems
- panel orchestration systems

It acts as a frontend repair boundary.

---

## Inputs

Primary inputs:

- persisted workspace state
- partial panel structures
- panel types
- numeric geometry values
- panel registry metadata

---

## Outputs

Exports:

- `snap`
- `titleFor`
- `makePanel`
- `normalizePanel`
- `normalizeState`

Returns normalized frontend workspace structures.

---

## Truth, Projection, Mutation, and Recovery Boundaries

### Truth Surfaces

This file does not establish Git truth.

It establishes normalized frontend workspace state.

### Projection Systems

Supports projection of:

- workspace tabs
- panel geometry
- panel placement
- panel titles

### Mutation Systems

Does not mutate Git state.

Only transforms frontend runtime structures.

### Recovery Systems

Primary responsibility:

- malformed-state repair
- persistence normalization
- missing-value recovery
- invalid-number containment

### Rendering Systems

No rendering occurs here.

Rendering systems consume normalized output from this layer.

---

## Relationship to PANEL_REGISTRY

`PANEL_REGISTRY` acts as the authoritative panel metadata source.

This file derives:

- display titles

from registry entries.

No duplicate title source exists here.

---

## Design Characteristics

The layout system is:

- normalization-first
- persistence-aware
- repair-oriented
- panel-registry-driven
- geometry-aware
- grid-aligned
- fallback-heavy
- frontend-local

---

## Dependencies

Imports:

- `../panels/panelRegistry`
- `./chronogitWorkspaceTypes`

No backend dependencies exist.

No Tauri calls exist.

---

## Current Known Gaps

- Panel IDs are runtime-generated and not deterministic across sessions.
- `Math.random()` is used for panel IDs.
- Hardcoded geometry values are embedded directly in the file.
- Hardcoded fallback repository path points to a developer-specific location.
- No viewport-boundary clamping exists.
- No collision avoidance exists beyond diagonal offsets.
- No workspace scaling or zoom awareness exists.
- `snap()` exists but is not directly used within this file.
- No schema versioning exists for persisted workspace state.
- No migration layer exists for future layout structure changes.

---

## Verification Notes

This document is based on full-file inspection of:

- `src/core/workspaceLayout.ts`

No undocumented behavior has been inferred beyond directly visible source logic.

---

## Status

active
