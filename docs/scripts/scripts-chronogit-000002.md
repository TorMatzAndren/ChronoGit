Title: lib.rs
ID: scripts-chronogit-000002
Date: 2026-05-04
Author: Matz
Type: scripts
Subsystem: control-api
Updated: 2026-05-04
Revision: 1

---

@role:backend
@subsystem:control-api
@entity:script:chronogit-app/src-tauri/src/lib.rs
@entity:/chronogit-app/src-tauri/src/lib.rs
@semantic:git-execution
@semantic:git-status
@semantic:git-mutation
@semantic:git-temporal
@semantic:tauri-command-layer
@semantic:llm-local
@semantic:gpu-control
@state:active

# lib.rs

**Date:** 2026-05-04  
**Summary:** Tauri backend command layer for ChronoGit. Executes Git operations, enforces safety constraints, parses deterministic state, and integrates local LLM explanations with controlled resource usage.  
**Keywords:** tauri backend, git command layer, git parser, local llm, ollama integration  
**Tags:** scripts, backend, control-api, git, tauri, llm

Execution and truth layer for ChronoGit.

---

## Purpose

Provides a **controlled, deterministic execution boundary** between:

UI → system → Git → LLM

Ensures:

- safe mutation handling
- structured outputs
- validated inputs
- no direct shell exposure to UI

---

## Core Responsibilities

### 1. Git State Extraction

Commands:

- `git_status`
- `git_remote_status`

Features:

- porcelain parsing
- branch detection
- staged vs working separation
- remote ahead/behind detection

---

### 2. Change Classification

Function: `classify_change`

Produces:

- status (modified, added, deleted, etc.)
- risk level:
  - critical
  - danger
  - evidence
  - review
  - normal

Special handling:

- backup file detection (.bak, .tmp, etc.)
- conflict detection

---

### 3. Repository Discovery

Command: `discover_git_repos`

- scans safe directories
- limits recursion depth
- excludes heavy/system folders
- deduplicates results

---

### 4. Mutation Layer (Safe Execution)

Commands:

- `git_stage`
- `git_unstage`
- `git_restore`
- `git_remove_untracked`
- `git_ignore_path`
- `git_commit`

Safety mechanisms:

- path validation (no absolute or traversal)
- staged-only commit enforcement
- conflict blocking
- untracked removal verification

---

### 5. Temporal Layer

Commands:

- `git_history`
- `git_changed_files_from_commit`
- `git_diff_file_from_commit`
- `git_restore_file_from_commit`

Capabilities:

- commit inspection
- file-level diff extraction
- selective file restore

Constraint:

No full repo rollback  
→ file-level restore only

---

### 6. LLM Integration (Ollama)

Commands:

- `explain_diff_with_ollama`
- `explain_context_with_ollama`
- `list_local_llm_models`

Features:

- local-only API (127.0.0.1)
- model validation
- structured prompt design
- output cleaning and normalization

---

### 7. GPU Power Management

Functions:

- `query_gpu_power_limits`
- `set_gpu_power_limit`

Behavior:

- reduce GPU power before LLM execution (~60%)
- restore after execution
- warnings if control fails

---

### 8. Diff Preprocessing

Special handling:

- lockfile detection
- summarized dependency changes

Prevents:

- incorrect LLM reasoning
- irrelevant dependency analysis

---

## Inputs

From UI:

- repo_path
- file path
- commit hash
- commit message
- diff content
- model selection

---

## Outputs

Structured responses:

- GitStatusResponse
- GitRemoteStatus
- RepoInfo[]
- CommitResult
- HistoryCommit[]
- DiffResult
- ExplainDiffResult
- LocalModel[]

---

## Role in System

Acts as:

→ **Deterministic execution layer**  
→ **Git truth extraction engine**  
→ **Safety enforcement boundary**  
→ **LLM integration controller**

Bridges:

UI (React) ↔ System (Git, GPU, Ollama)

---

## Design Principles

- no raw shell exposure to UI
- all inputs validated
- all outputs structured
- Git CLI is source of truth
- LLM is optional and advisory
- destructive actions explicitly gated
- resource usage controlled

---

## Status

active
