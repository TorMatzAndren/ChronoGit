Title: chronogitWorkspaceTypes.ts
ID: scripts-chronogit-000004
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: workspace-ui
Updated: 2026-05-07
Revision: 1

---

@role:type-system
@subsystem:workspace-ui
@entity:script:chronogit-app/src/core/chronogitWorkspaceTypes.ts
@entity:/chronogit-app/src/core/chronogitWorkspaceTypes.ts
@semantic:workspace-layout
@semantic:panel-registry
@semantic:workspace-tabs
@semantic:panel-coordinates
@semantic:workspace-state
@semantic:type-contract
@state:active

# chronogitWorkspaceTypes.ts

**Date:** 2026-05-07  
**Summary:** Core workspace type contract definitions for ChronoGit. Defines the canonical panel type registry, workspace panel instance geometry structure, and workspace tab composition model used by the frontend workspace system.  
**Keywords:** workspace types, panel registry, panel coordinates, workspace tabs, layout model, type contracts  
**Tags:** scripts, types, workspace-ui, layout, panels, workspace

Core workspace type contract definitions for ChronoGit.

---

## Purpose

`chronogitWorkspaceTypes.ts` defines the foundational frontend workspace type system for ChronoGit.

It establishes:

- allowed workspace panel types
- panel geometry contracts
- workspace tab structure
- panel instance identity model

This file acts as a canonical type-contract layer for workspace rendering and panel composition systems.

---

## Architectural Role

This file is a structural contract surface.

It does not execute runtime logic.

It does not render UI directly.

It does not mutate state.

It defines the shared type boundaries used by the workspace system.

The file establishes deterministic structure for:

- panel identity
- workspace layout
- workspace tab organization
- coordinate-based panel projection

---

## PanelType

Defines:

- `PanelType`

As a TypeScript string union.

---

## Registered Panel Types

Current valid panel identifiers:

- `repository`
- `git-status`
- `remote-status`
- `branches`
- `local-llm`
- `current-state`
- `commit-preflight`
- `change-lists`
- `time-machine`
- `remote-actions`
- `system-log`
- `llm-log`
- `notes`
- `empty`

This union acts as the canonical workspace panel registry identifier surface.

---

## PanelSize

Defines:

- `PanelSize`

Current valid value:

- `free`

---

## PanelSize Architectural Meaning

The current implementation suggests a free-layout workspace model rather than fixed grid presets.

However:

- no sizing logic exists in this file
- no constraints are enforced here
- no snapping/grid behavior is defined here

This is currently a type-level placeholder/contract surface only.

---

## PanelInstance

Defines:

- `PanelInstance`

Represents one instantiated workspace panel.

---

## PanelInstance Fields

### Identity

- `id: string`

Unique runtime panel identifier.

---

### Panel Classification

- `type: PanelType`

Defines which panel implementation/render surface should be projected.

---

### Human Label

- `title: string`

Frontend-visible panel title.

---

### Geometry

- `x: number`
- `y: number`
- `w: number`
- `h: number`

Represents free-layout panel coordinates and dimensions.

This file does not define:

- coordinate units
- scaling system
- snapping rules
- persistence logic
- collision logic
- viewport logic

It only defines the structural geometry contract.

---

## WorkspaceTab

Defines:

- `WorkspaceTab`

Represents one workspace tab containing multiple panel instances.

---

## WorkspaceTab Fields

### Identity

- `id: string`

Unique tab identifier.

---

### Human Label

- `name: string`

Frontend-visible workspace tab name.

---

### Panel Collection

- `panels: PanelInstance[]`

Ordered collection of panel instances belonging to the workspace tab.

This establishes the workspace composition structure.

---

## Inputs

This file defines type contracts only.

No runtime inputs exist.

---

## Outputs

This file exports:

- `PanelType`
- `PanelSize`
- `PanelInstance`
- `WorkspaceTab`

These are consumed by frontend rendering and workspace-management systems.

---

## Truth, Projection, Mutation, and Advisory Boundaries

### Truth Surfaces

This file defines structural truth contracts for workspace layout state.

### Projection Systems

Defines the allowable projection structure for workspace panels.

### Mutation Systems

None.

No state mutation exists in this file.

### Rendering Systems

Indirectly participates in rendering through type enforcement.

### Persistence Systems

Indirectly participates in workspace persistence through geometry/state contracts.

### Cognition Systems

None.

### Advisory Systems

None.

---

## Design Characteristics

The workspace model is currently:

- free-layout oriented
- coordinate-based
- panel-instance oriented
- tab-composition oriented
- string-union controlled

The panel registry is statically typed rather than dynamically discovered.

---

## Dependencies

No imports.

Pure type-definition file.

---

## Current Known Gaps

- `PanelSize` currently contains only `free`
- no grid-layout abstraction exists
- no viewport abstraction exists
- no z-index/layer ordering exists
- no panel minimization/maximization state exists
- no persistence metadata exists
- no docking model exists
- no resize constraints exist
- no runtime validation exists
- no semantic metadata exists for panel categories or capabilities

---

## Verification Notes

This document is based on full-file inspection of:

- `src/core/chronogitWorkspaceTypes.ts`

No behavior outside directly verified source has been documented.

---

## Status

active
