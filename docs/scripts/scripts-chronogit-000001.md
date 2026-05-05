Title: App.tsx
ID: scripts-chronogit-000001
Date: 2026-05-04
Author: Matz
Type: scripts
Subsystem: workspace-ui
Updated: 2026-05-05
Revision: 2

---

@role:ui
@subsystem:workspace-ui
@entity:script:chronogit-app/src/App.tsx
@entity:/chronogit-app/src/App.tsx
@entity:stylesheet:chronogit-app/src/App.css
@entity:asset:chronogit-app/src/assets/jarri-logo.png
@entity:bootstrap:chronogit-app/src/main.tsx
@semantic:git-ui
@semantic:git-status-visualization
@semantic:git-flow
@semantic:git-temporal-ui
@semantic:commit-preflight
@semantic:remote-awareness-ui
@semantic:remote-preview-ui
@semantic:remote-safety-gate
@semantic:operation-state-ui
@semantic:auto-refresh
@semantic:system-log
@semantic:llm-log
@semantic:llm-explain-ui
@semantic:beginner-mode
@semantic:local-only
@state:active

# App.tsx

**Date:** 2026-05-04  
**Summary:** React-based ChronoGit UI providing Git state visualization, safe mutation controls, commit preflight, Time Machine history inspection, remote sync preview/execution controls, operation-state warnings, persistent logs, auto-refresh, and optional local LLM explanations.  
**Keywords:** git ui, git visualization, tauri frontend, git flow interface, time machine ui, remote preview, system log, llm explanation  
**Tags:** scripts, ui, git, workspace, tauri, llm, remote-sync

Frontend surface for ChronoGit.

---

## Purpose

Transforms backend Git truth into an explainable user workflow:

Working files → Prepared changes → Snapshot

The UI emphasizes:

- visible Git state
- explicit consequences
- guarded mutation
- local-only execution
- advisory LLM explanations
- beginner-mode hover guidance

---

## Core Responsibilities

### 1. Top-Level Product and State Surface

Renders the ChronoGit product header with:

- Jarri logo asset
- external Jarri website button
- GitHub profile button
- Beginner Mode toggle
- repository selector
- Git version and branch state
- remote status card
- local LLM model selector

The Jarri and GitHub actions call the backend allowlisted `open_external_url` command rather than relying on normal webview link navigation.

---

### 2. Git State Visualization

Consumes `GitStatusResponse` and separates visible repository changes into:

- working folder changes
- prepared/staged changes

Groups changes by deterministic risk class:

- critical
- danger
- evidence
- review
- normal

Displays:

- file path
- plain-language state
- Git index/worktree code
- risk class
- backend explanation
- expandable local explanation

---

### 3. User Action Layer

Triggers backend operations via Tauri invoke:

- `git_stage`
- `git_unstage`
- `git_restore`
- `git_remove_untracked`
- `git_ignore_path`

Destructive or semi-destructive actions use confirmation modals.

The UI does not perform direct filesystem or shell mutation. All mutation routes through the backend command layer.

---

### 4. Commit Flow / Snapshot Preflight

Implements the commit preflight modal using `git_commit_preflight`.

Before a commit, the UI shows:

- staged file count
- insertion/deletion counts
- included files
- snapshot impact classification
- remote context sentence
- commit message requirement

The UI blocks commit when:

- no commit message is supplied
- critical staged changes are present

Commit execution calls `git_commit`.

---

### 5. Time Machine

Provides linear history inspection through:

- `git_history`
- `git_changed_files_from_commit`
- `git_diff_file_from_commit`
- `git_restore_file_from_commit`

Capabilities:

- commit list
- changed-file list per commit
- file diff viewer
- explicit diff scope card
- LLM diff explanation
- single-file restore from selected snapshot

Constraint:

Restore from Time Machine modifies the working folder only. It does not automatically commit and does not perform full repository rollback.

---

### 6. Remote Awareness and Remote Preview UI

Displays remote state from `GitRemoteStatus`:

- branch
- upstream
- remote URL
- ahead count
- behind count
- state label:
  - LOCAL ONLY
  - IN SYNC
  - AHEAD
  - BEHIND
  - DIVERGED

Remote preview actions call:

- `git_fetch_remote`
- `git_push_preview`
- `git_pull_preview`

The remote preview panel displays:

- operation direction
- branch/upstream
- ahead/behind
- previewed commits
- changed files
- consequence text
- warning text
- merge safety prediction
- path overlap analysis

---

### 7. Remote Execution Controls

The UI supports guarded remote execution:

- upload via `git_push_execute`
- download via `git_pull_rebase_execute`
- abort via `git_rebase_abort`

Upload uses a two-step safety flow:

1. acknowledge preview only
2. execute push for the same exact preview key

Download uses confirmation/override based on backend risk classification.

The UI distinguishes preview from execution and logs action results.

---

### 8. Operation State Detection UI

Consumes `GitOperationState` through `git_operation_state`.

Displays an interrupted-operation banner when Git reports:

- rebase in progress
- merge in progress
- cherry-pick in progress
- revert in progress
- conflicted files

Provides an Abort Rebase button when rebase state is detected.

---

### 9. Auto-Refresh

Uses a polling loop and deterministic state signature to detect repository changes.

The state signature includes:

- branch
- staged files
- working files
- remote state
- interrupted operation state

When the signature changes, the UI refreshes:

- status
- remote status
- operation state
- Time Machine refresh tick

Transient refresh-start messages are not logged. Repository-change detections are logged.

---

### 10. System Log

Maintains a persistent localStorage-backed system log.

Features:

- date + time display
- newest-first rendering
- low-profile filter chips:
  - all
  - action
  - warning
  - error
  - info
- copy per log entry
- explain per log entry through local LLM
- duplicate/refresh-spam collapse

The system log records deterministic ChronoGit session events, not Git history.

---

### 11. LLM Response Log

Maintains a persistent localStorage-backed LLM log.

Sources include:

- diff
- UI
- remote
- preflight

LLM outputs are advisory and shown separately from deterministic system events.

---

### 12. Local LLM UI Layer

Uses backend commands:

- `list_local_llm_models`
- `explain_diff_with_ollama`
- `explain_context_with_ollama`

The UI supports:

- model discovery
- model selection
- diff explanation
- UI/system-state explanation
- log-entry explanation
- LLM response persistence

Hard rule:

LLM output is advisory. Git state and deterministic UI data remain authoritative.

---

### 13. Beginner Mode

Beginner Mode controls:

- hover guidance
- teaching-language button/tooltips
- beginner help text in remote preview
- action explanation icons

Beginner Mode does not alter backend behavior or Git truth.

Current limitation:

The whole UI has not yet been fully converted to the planned dual-language Beginner/Advanced terminology layer.

---

## Inputs

From backend via invoke:

- `GitStatusResponse`
- `GitRemoteStatus`
- `GitOperationState`
- `RepoInfo[]`
- `CommitPreflight`
- `CommitResult`
- `RemoteOperationPreview`
- `RemotePushResult`
- `RemotePullResult`
- `HistoryCommit[]`
- `ChangedFile[]`
- `DiffResult`
- `ExplainDiffResult`
- `LocalModel[]`

---

## Outputs / Invoked Commands

User-triggered backend commands:

- `detect_git`
- `open_external_url`
- `discover_git_repos`
- `git_status`
- `git_remote_status`
- `git_operation_state`
- `git_fetch_remote`
- `git_push_preview`
- `git_pull_preview`
- `git_push_execute`
- `git_pull_rebase_execute`
- `git_rebase_abort`
- `git_commit_preflight`
- `git_stage`
- `git_unstage`
- `git_restore`
- `git_remove_untracked`
- `git_ignore_path`
- `git_commit`
- `git_history`
- `git_changed_files_from_commit`
- `git_diff_file_from_commit`
- `git_restore_file_from_commit`
- `list_local_llm_models`
- `explain_diff_with_ollama`
- `explain_context_with_ollama`

---

## Role in System

Acts as:

→ User cognition layer for Git  
→ Safe control interface  
→ Visualization surface for deterministic backend truth  
→ Advisory LLM explanation surface  
→ Session event observatory

Depends on:

- Tauri backend (`lib.rs`)
- Git CLI indirectly
- local Ollama indirectly
- `App.css`
- `jarri-logo.png`

---

## Design Principles

- never hide Git truth
- preview before risky action
- separate preview from execution
- explain consequences before mutation
- confirm destructive operations
- log important actions
- keep LLM advisory
- avoid panel creep
- prefer state transparency over magic

---

## Supporting Files

### App.css

`chronogit-app/src/App.css` provides the visual system for the ChronoGit UI surface.

It defines:

- Jarri-style dark theme
- product header styling
- risk-colored change cards
- truth strip
- current state card
- remote card
- Time Machine layout
- diff rendering
- diff scope card
- preflight modal
- confirmation modal
- remote preview panel
- remote safety gate
- operation-state banner
- system log
- LLM response log
- beginner-mode controls

The stylesheet does not perform logic or system actions.

### main.tsx

`chronogit-app/src/main.tsx` is the minimal React bootstrap entrypoint. It mounts the ChronoGit UI and does not currently contain independent logic requiring a separate script document.

### jarri-logo.png

`chronogit-app/src/assets/jarri-logo.png` is the Jarri logo asset used by the product title card.

---

## Current Known Gaps

- no A ↔ B commit comparison yet
- no commit graph yet
- no file evolution view yet
- no complete dual-language terminology layer yet
- no built-in conflict resolution editor
- Time Machine is currently linear commit inspection

---

## Status

active
