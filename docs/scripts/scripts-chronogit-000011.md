Title: panelRegistry.ts
ID: scripts-chronogit-000011
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: panel-registry
Updated: 2026-05-07
Revision: 1

---

@role:panel-registry
@subsystem:panel-registry
@entity:script:chronogit-app/src/panels/panelRegistry.ts
@entity:/chronogit-app/src/panels/panelRegistry.ts
@semantic:panel-registry
@semantic:workspace-panels
@semantic:panel-definition
@semantic:panel-catalog
@semantic:workspace-layout
@semantic:panel-metadata
@semantic:panel-resolution
@state:active

# panelRegistry.ts

**Date:** 2026-05-07
**Summary:** Canonical panel registry and panel metadata layer for ChronoGit. Defines all known workspace panel types, user-facing titles, descriptions, and panel lookup behavior used throughout the workspace layout and panel orchestration systems.
**Keywords:** panel registry, panel metadata, workspace panels, panel catalog, panel definitions, workspace layout
**Tags:** scripts, frontend, workspace, panels, registry, metadata, layout-system

Canonical panel registry for ChronoGit workspace panels.

---

## Purpose

`panelRegistry.ts` defines the authoritative registry of known ChronoGit workspace panels.

Responsibilities include:

- defining available panel types
- defining user-facing panel titles
- defining panel descriptions
- resolving panel definitions from panel type identifiers

This file acts as the canonical panel catalog for the workspace system.

---

## Architectural Role

This file provides the metadata layer for workspace panels.

It separates:

- panel identity
- display naming
- user-facing descriptions

from:

- actual panel implementation
- layout rendering
- workspace persistence

---

## Imported Dependencies

Imports:

- `PanelType`

from:

    ../core/chronogitWorkspaceTypes

This creates coupling between the panel registry and the canonical workspace panel-type schema.

---

# PanelDefinition Type

## Definition

Defines:

    export type PanelDefinition

Fields:

- `type`
- `title`
- `description`

---

## Purpose

Represents the canonical metadata structure for workspace panels.

This metadata is used for:

- UI naming
- layout creation
- panel selection
- fallback resolution
- workspace orchestration

---

# PANEL_REGISTRY

## Registry Export

Exports:

    PANEL_REGISTRY

Type:

    PanelDefinition[]

Purpose:

Defines the complete list of recognized workspace panel types.

---

# Registered Panels

## current-state

Definition:

- type: `current-state`
- title: `Current State`
- description: `Human Git state summary.`

Purpose:

Human-readable Git truth overview panel.

---

## commit-preflight

Definition:

- type: `commit-preflight`
- title: `Commit Preflight`
- description: `Prepared-file commit boundary.`

Purpose:

Commit-boundary inspection and staged snapshot overview.

---

## change-lists

Definition:

- type: `change-lists`
- title: `Change Lists`
- description: `Working and prepared files with actions.`

Purpose:

Working-tree and staged-file mutation surface.

---

## time-machine

Definition:

- type: `time-machine`
- title: `Time Machine`
- description: `History, file diffs, A/B comparison, restore.`

Purpose:

Historical Git inspection and comparison subsystem.

---

## remote-actions

Definition:

- type: `remote-actions`
- title: `Remote Actions`
- description: `Fetch, push/pull preview, guarded sync.`

Purpose:

Remote synchronization and guarded remote workflow surface.

---

## remote-status

Definition:

- type: `remote-status`
- title: `Remote Status`
- description: `Ahead/behind and upstream truth.`

Purpose:

Remote-state truth visualization.

---

## branches

Definition:

- type: `branches`
- title: `Branches`
- description: `Read-only branch timelines and upstream truth.`

Purpose:

Branch topology and branch-truth inspection.

---

## local-llm

Definition:

- type: `local-llm`
- title: `Local LLM`
- description: `Local model selector and explanation controls.`

Purpose:

Local-only Ollama/LLM orchestration surface.

---

## system-log

Definition:

- type: `system-log`
- title: `System Log`
- description: `Deterministic session events.`

Purpose:

ChronoGit operational/system-event truth surface.

---

## llm-log

Definition:

- type: `llm-log`
- title: `LLM Log`
- description: `Advisory local LLM responses.`

Purpose:

Persistent local LLM advisory history surface.

---

## notes

Definition:

- type: `notes`
- title: `Notes`
- description: `Freeform operator notes placeholder.`

Purpose:

Operator note-taking and future freeform annotation surface.

---

## empty

Definition:

- type: `empty`
- title: `Empty`
- description: `Blank panel slot.`

Purpose:

Fallback/placeholder workspace panel.

---

# Panel Resolution

## panelDefinition()

Exports:

    panelDefinition(type)

Purpose:

Resolves a `PanelDefinition` from a `PanelType`.

---

## Resolution Logic

Lookup logic:

    PANEL_REGISTRY.find(...)

Fallback behavior:

    PANEL_REGISTRY[PANEL_REGISTRY.length - 1]

This means unresolved panel types fall back to the final registry entry.

Current final entry:

    empty

---

## Fallback Characteristics

Unknown panel types therefore resolve to:

- type: `empty`
- title: `Empty`
- description: `Blank panel slot.`

This creates graceful fallback behavior for invalid or unknown panel references.

---

# Registry Characteristics

The registry acts as:

- canonical panel catalog
- metadata authority
- workspace panel resolver
- UI naming source

---

# Relationship to Workspace Layout

This file is directly consumed by layout/orchestration systems such as:

- workspace layout generation
- panel creation
- panel normalization
- title resolution

---

# Relationship to Workspace Types

This registry depends on:

    PanelType

as the canonical allowed panel-type union.

This ensures registry entries remain type-bound to valid workspace panel identifiers.

---

# Separation of Concerns

This file contains:

- metadata only

It does not contain:

- React components
- rendering logic
- panel implementations
- persistence logic
- workspace state
- backend logic

---

# UI Doctrine Reflected

Panel descriptions emphasize:

- Git truth
- guarded mutation
- deterministic visibility
- advisory LLM behavior
- local-only operation

This reflects broader ChronoGit/Jarri doctrine.

---

# Registry as Truth Surface

This file effectively defines the currently recognized workspace vocabulary.

Adding new panels requires registry expansion here.

This makes the registry a structural truth surface for workspace capabilities.

---

# No Dynamic Registration

Panel registration is fully static.

No runtime plugin system exists.

No dynamic panel discovery exists.

---

# Dependencies

Imports:

- `../core/chronogitWorkspaceTypes`

No backend dependencies exist.

No Tauri dependencies exist.

No Git dependencies exist.

---

# Design Characteristics

The panel registry is:

- static
- deterministic
- metadata-oriented
- workspace-authoritative
- centralized
- type-bound

---

# Current Known Gaps

- No dynamic/plugin panel registration exists.
- No panel categorization/grouping exists.
- No panel icon metadata exists.
- No panel capability flags exist.
- No hidden/internal panel distinction exists.
- No localization/internationalization exists.
- No panel versioning exists.
- No panel permission model exists.
- No runtime panel loading exists.
- No panel deprecation mechanism exists.

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/panelRegistry.ts`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
