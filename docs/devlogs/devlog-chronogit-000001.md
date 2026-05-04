Title: ChronoGit Breaks Out of Workspace – From Basic Git Panel to Standalone Deterministic Git Time Machine
ID: devlog-chronogit-000001
Date: 2026-05-04
Author: Matz
Type: devlog
Subsystem: chronogit
Updated: 2026-05-04
Revision: 2

---

@role:devlog
@subsystem:chronogit
@scope:system-evolution
@scope:workspace-origin
@scope:ui-backend-separation
@scope:git-abstraction
@scope:deterministic-design
@scope:local-first
@scope:tauri-architecture
@scope:llm-integration
@entity:chronogit-app/src/App.tsx
@entity:chronogit-app/src/App.css
@entity:chronogit-app/src-tauri/src/lib.rs
@entity:/opt/jarri/ui/workspace/app/src/panels/GitPanel.tsx
@state:active

# ChronoGit Breaks Out of Workspace

**Date:** 2026-05-04  
**Summary:** ChronoGit originated as an evolution of a basic Git panel inside Jarri Workspace. During development, it became clear that the model, abstractions, and capabilities exceeded the scope of a panel, leading to its transformation into a standalone system with a deterministic UI/backend architecture, temporal inspection, and local LLM integration.

---

## Origin: Workspace Git Panel

ChronoGit did not begin as a standalone idea.

It started as:

- a **basic Git panel** inside Jarri Workspace
- focused on:
  - status display
  - simple file actions
  - minimal user guidance

However, during iteration, several pressures emerged:

- Git complexity required **explanation**, not just display
- Safety required **structured control**, not raw commands
- Temporal inspection (history/diff) did not fit cleanly into a panel
- LLM integration introduced a **new dimension of interaction**

This created a mismatch:

> The Git panel was no longer a panel — it was becoming a system.

---

## Breakaway Decision

At a certain point, continuing inside Workspace would:

- constrain UX design
- complicate architecture
- blur system boundaries inside Jarri

Instead, the decision was made to:

→ extract and formalize the system as **ChronoGit**

This allowed:

- independent UI design
- strict execution boundary
- cleaner mental model
- potential standalone distribution (binary app)

---

## Core Concept Shift

The key abstraction shift carried over from Workspace and was fully realized here:

Working files → Prepared changes → Snapshot

This replaced raw Git terminology with:

- Prepare for commit
- Remove from next commit
- Restore / discard
- Create snapshot

This model became:

- the UI language
- the backend contract
- the teaching layer

---

## Architectural Separation

ChronoGit formalized a strict split:

### UI Layer (App.tsx)

- renders Git state
- explains meaning
- handles interaction
- exposes safe actions

### Backend Layer (lib.rs)

- executes Git commands
- parses porcelain output
- classifies changes
- enforces safety rules
- integrates LLM

This mirrors Jarri’s core doctrine:

interface → controlled execution → structured truth

---

## System Formation (Actual Process)

ChronoGit evolved in a single continuous flow:

### 1. Workspace Panel Limitation

- basic Git UI insufficient
- explanation layer needed

### 2. Concept Expansion

- Git redefined as flow
- safety model introduced

### 3. Backend Construction

- Tauri command layer
- deterministic Git parsing
- classification (risk, status, staged)

### 4. UI Expansion

- grouped change cards
- explanation layers (manual + LLM)
- commit preflight system

### 5. Temporal Layer

- commit history
- file-level diff inspection
- file restore from snapshot

### 6. Local LLM Layer

- Ollama integration
- diff explanation
- UI explanation
- strict prompt constraints
- GPU TDP control

### 7. Repository Awareness

- multi-repo discovery
- selector UI
- remote state parsing

### 8. Extraction into Standalone App

- separation from Workspace
- Tauri-based app structure
- independent runtime

---

## Deterministic Design Principles

Inherited from Jarri:

- Git CLI is the only truth source
- no hidden state
- no heuristic guessing
- explicit classification
- destructive actions require confirmation
- LLM is advisory only

---

## What Changed From Workspace

| Aspect | Workspace Git Panel | ChronoGit |
|------|--------------------|----------|
| Scope | UI panel | Full system |
| Execution | indirect | controlled backend |
| Model | Git terminology | flow abstraction |
| Safety | minimal | enforced |
| History | limited | full temporal inspection |
| LLM | none | integrated |
| Architecture | embedded | standalone |

---

## What ChronoGit Is

- a standalone Git cognition interface
- a deterministic UI over Git
- a safe mutation layer
- a temporal inspection system
- a teaching interface for Git

---

## What ChronoGit Is Not

- not a Git replacement
- not cloud-based
- not an automation engine
- not a thin wrapper over CLI

---

## Structural Gap Identified

Still missing:

- branch management
- push/pull flows
- merge conflict resolution UI
- stash handling
- deeper diff intelligence

---

## Strategic Direction

ChronoGit now sits between:

- developer tooling
- learning interface
- system audit surface

Future directions include:

- integration with Jarri Pipeline (Git → system truth ingestion)
- Chrono-Field visualization of commit history
- controlled remote operations
- advanced safety classification

---

## Final Insight

ChronoGit demonstrates a recurring pattern:

> A “small tool” inside Jarri tends to evolve into a standalone system once it gains structure, safety requirements, and cognitive layers.

---

## Status

active
