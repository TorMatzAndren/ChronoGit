Title: ChronoGit Focus Architecture – Contextual Truth Projection and Layered Inspection Model
ID: chronogit-docs-000003
Date: 2026-05-05
Author: Matz
Type: docs
Subsystem: chronogit
Updated: 2026-05-05
Revision: 1

---

@role:system-doc
@subsystem:chronogit
@scope:focus-architecture
@scope:interaction-model
@scope:layered-ui
@scope:context-projection
@scope:temporal-inspection
@scope:state-projection
@scope:ux-doctrine
@scope:jarri-alignment

@entity:doc:chronogit-docs-000003
@entity:/home/dretski/projects/ChronoGit/docs/docs/chronogit-docs-000003.md
@entity:doc:chronogit-docs-000001
@entity:doc:chronogit-docs-000002
@entity:script:ui_focus_state
@entity:script:ui_focus_router
@entity:script:ui_focus_projection

@semantic:focus-mode
@semantic:contextual-truth
@semantic:layered-inspection
@semantic:state-projection
@semantic:temporal-context
@semantic:interaction-scope

@state:defined
@state:planned
@state:foundational

@truth:interaction-model
@truth:ui-architecture
@truth:state-projection

@risk:ui-clutter
@risk:panel-explosion
@risk:context-mixing
@risk:misleading-projections

---

# ChronoGit Focus Architecture – Contextual Truth Projection and Layered Inspection Model

**Date:** 2026-05-05  
**Summary:** Defines the Focus Architecture for ChronoGit, introducing a layered interaction model where system truth is not displayed statically but revealed contextually based on user intent. Focus Mode acts as a deterministic projection layer on top of the Git State Model, enabling deep inspection without UI clutter or loss of clarity.  
**Keywords:** Focus Mode, ChronoGit, UI architecture, Git inspection, contextual UI, layered interaction  
**Tags:** docs, chronogit, focus, architecture, ux, system-doc, layered-ui

---

## Purpose

This document defines how ChronoGit presents and reveals system truth through interaction.

It establishes:

- Focus Mode as a first-class system concept  
- layered UI architecture  
- deterministic context projection rules  
- relationship to Git State Model  
- relationship to Documentation Contract  

---

## Core Principle

ChronoGit does not show all information at once.

ChronoGit shows:

> exactly the part of system truth required for the current decision

---

## Problem Statement

Traditional Git tools scale by adding UI:

- panels  
- tabs  
- dashboards  

This leads to:

- clutter  
- cognitive overload  
- unclear decision surfaces  

This violates ChronoGit principles:

- clarity  
- determinism  
- safety-first interaction  

---

## Definition: Focus Mode

Focus Mode is defined as:

> a deterministic projection of system truth scoped to a single user intent

Focus Mode is:

- not a panel  
- not a modal  
- not a separate feature  

It is:

> an interaction layer

---

## Relation to Git State Model

The Git State Model defines:

- Working state  
- Prepared state  
- Snapshot history  
- Temporal relationships  

Focus Mode defines:

> which part of that model is currently active

Examples:

Click file → FileChange projection  
Click commit → HistoryState projection  
Select A + B → Temporal comparison projection  
Click log → System event projection  

---

## Relation to Documentation Contract

The Documentation Contract defines:

- explicit structure  
- entity traceability  
- deterministic behavior  

Therefore Focus Mode must:

- map to documented entities  
- expose real system structure  
- never invent hidden context  
- remain verifiable  

Focus Mode is:

> a projection of documented truth, not UI abstraction

---

## Layered Architecture

ChronoGit operates on three layers:

---

### 1. Surface Layer (Persistent)

Always visible:

- working state  
- prepared state  
- remote state  
- commit flow  
- system log  

Purpose:

- orientation  
- immediate decision context  

---

### 2. Focus Layer (Contextual)

Triggered by user interaction.

Examples:

- commit inspection  
- file inspection  
- remote preview expansion  
- log explanation  

Behavior:

- replaces or expands part of the UI  
- scoped to a single object or relation  

---

### 3. Deep Analysis Layer (On Demand)

Advanced inspection surfaces:

- A ↔ B comparison  
- file evolution  
- LLM-assisted reasoning  
- future graph projections  

Behavior:

- only visible when explicitly requested  
- never persistent  

---

## Focus Triggers

Focus Mode is activated by:

- selecting a file  
- selecting a commit  
- selecting multiple commits  
- interacting with a log entry  
- interacting with remote preview  

Each trigger defines:

- focus type  
- focus entity  
- projection rules  

---

## Focus Projection Model

A Focus Projection must include:

focus_type  
target_entity  
context_scope  
data_sources  
derived_data  
explanation_surface  

Example:

focus_type: commit  
target_entity: commit_hash  
context_scope: snapshot  
data_sources: git log, git diff  
derived_data: changed files, stats  
explanation_surface: optional LLM  

---

## Non-Negotiable Rules

Focus Mode must:

- never hide relevant state  
- never mix unrelated contexts  
- never persist beyond user intent  
- never duplicate surface data unnecessarily  
- never introduce undocumented behavior  

---

## UI Behavior Rules

- Focus replaces clutter, not adds to it  
- Focus must be reversible instantly  
- Focus must clearly indicate scope  
- Focus must show comparison boundaries  

---

## Temporal Focus

ChronoGit supports temporal focus:

- commit vs parent  
- commit A vs commit B (planned)  
- file evolution across commits (planned)  

Temporal focus must always declare:

- comparison type  
- reference points  

---

## LLM Integration in Focus

LLM explanations are allowed only inside Focus context.

Rules:

- must use visible context only  
- must not invent relationships  
- must be scoped to current focus  
- must not override Git truth  

LLM becomes:

> an optional interpretation layer inside Focus

---

## Future Extensions

Focus Architecture enables:

- A ↔ B commit comparison  
- file evolution view  
- minimal commit graph visualization  
- conflict resolution assistance  
- contextual safety explanation  

---

## Anti-Patterns (Explicitly Forbidden)

- permanent panel for every feature  
- global dashboards of all data  
- hidden state transitions  
- implicit comparisons  
- mixed-context views  

---

## Strategic Role

Focus Mode is the solution to:

- UI scaling  
- feature growth  
- complexity management  

It ensures:

- ChronoGit remains simple at surface  
- ChronoGit remains powerful at depth  

---

## Relation to Jarri

Focus Architecture aligns with:

- Pipeline → layered truth extraction  
- Chrono-Field → contextual visualization  
- Documentation → canonical truth surfaces  

Focus Mode is:

> the UI equivalent of Jarri’s layered cognition model

---

## Final Principle

ChronoGit evolves under this rule:

> Do not show more  
> Show deeper when asked

---

## Status

@role:summary

Focus Architecture is:

- defined  
- aligned with existing models  
- ready for implementation  

This becomes the foundation for all future ChronoGit UI evolution.
