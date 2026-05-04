Title: App.tsx
ID: scripts-chronogit-000001
Date: 2026-05-04
Author: Matz
Type: scripts
Subsystem: workspace-ui
Updated: 2026-05-04
Revision: 1

---

@role:ui
@subsystem:workspace-ui
@entity:script:chronogit-app/src/App.tsx
@entity:/chronogit-app/src/App.tsx
@semantic:git-ui
@semantic:git-status-visualization
@semantic:git-flow
@semantic:git-temporal-ui
@semantic:llm-explain-ui
@semantic:local-only
@state:active
@entity:stylesheet:chronogit-app/src/App.css
@entity:bootstrap:chronogit-app/src/main.tsx
@semantic:ui-styling
@semantic:beginner-mode
@semantic:truth-strip
@semantic:remote-awareness-ui

# App.tsx

**Date:** 2026-05-04  
**Summary:** React-based ChronoGit UI providing Git state visualization, safe mutation controls, temporal snapshot exploration, and optional local LLM explanations.  
**Keywords:** git ui, git visualization, tauri frontend, git flow interface, time machine ui  
**Tags:** scripts, ui, git, workspace, tauri, llm

Frontend surface for ChronoGit.

---

## Purpose

Transforms raw Git state into an **explainable user flow**:

Working files → Prepared changes → Snapshot

Provides:

- safe interaction model
- beginner-friendly explanations
- deterministic UI aligned with Git truth

---

## Core Responsibilities

### 1. Git State Visualization

- separates:
  - working changes
  - staged (prepared) changes
- groups by risk:
  - critical
  - danger
  - evidence
  - review
  - normal

Displays:

- file path
- plain-language status
- explanation
- Git index/worktree codes

---

### 2. User Action Layer

Triggers backend operations via Tauri:

- prepare for commit (stage)
- remove from commit (unstage)
- restore / discard
- remove untracked file
- ignore path

Constraints:

- no direct system access
- all actions routed through backend validation

---

### 3. Commit Flow (Preflight)

Implements controlled commit process:

- only staged files included
- warnings for risky files
- commit message required
- critical issues block commit

Acts as:

→ UI-level safety gate before mutation

---

### 4. Temporal Interface (Time Machine)

Provides:

- commit history view
- changed files per snapshot
- file-level diff viewer
- restore-from-snapshot action

Key constraint:

Restore affects working folder only  
→ no automatic commit

---

### 5. Remote Awareness UI

Displays:

- local vs remote state
- ahead / behind counts
- divergence status

Purely informational  
→ no push/pull actions

---

### 6. Local LLM UI Layer

Allows:

- diff explanation
- UI concept explanation

Features:

- model selection
- explanation panel
- clipboard export

Hard rule:

LLM output is advisory  
→ Git + UI state remain authoritative

---

### 7. Beginner Mode

Optional teaching layer:

- hover explanations
- simplified terminology
- guided action descriptions

Does not alter:

- underlying Git behavior
- system truth

---

## Inputs

From backend (via invoke):

- GitStatusResponse
- GitRemoteStatus
- HistoryCommit[]
- DiffResult
- LocalModel[]
- ExplainDiffResult

---

## Outputs

User-triggered actions:

- git_stage
- git_unstage
- git_restore
- git_remove_untracked
- git_ignore_path
- git_commit

---

## Role in System

Acts as:

→ **User cognition layer for Git**  
→ **Safe control interface**  
→ **Visualization of deterministic backend truth**

Depends on:

- Tauri backend (`lib.rs`)
- Git CLI (indirectly)

---

## Design Principles

- never hides Git truth
- explains instead of abstracting away
- prevents unsafe actions silently
- requires explicit confirmation for destructive operations
- keeps UI and execution strictly separated

## Supporting Files

### App.css

`chronogit-app/src/App.css` provides the visual system for the ChronoGit UI surface.

It defines:

- Jarri-style dark visual theme
- risk-colored change cards
- readable diff rendering
- Time Machine layout
- commit preflight modal
- confirmation modal
- remote awareness card
- truth strip
- beginner mode controls
- local LLM explanation panels

The stylesheet does not perform logic or system actions. It supports the UI truth surface rendered by `App.tsx`.

### main.tsx

`chronogit-app/src/main.tsx` is the minimal React bootstrap entrypoint. It mounts the ChronoGit UI and does not currently contain independent logic requiring a separate script document.

---

## Status

active
