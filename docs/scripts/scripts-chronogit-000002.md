Title: lib.rs
ID: scripts-chronogit-000002
Date: 2026-05-04
Author: Matz
Type: scripts
Subsystem: control-api
Updated: 2026-05-05
Revision: 2

---

@role:backend
@subsystem:control-api
@entity:script:chronogit-app/src-tauri/src/lib.rs
@entity:/chronogit-app/src-tauri/src/lib.rs
@semantic:git-execution
@semantic:git-status
@semantic:git-mutation
@semantic:git-temporal
@semantic:git-remote-awareness
@semantic:git-remote-preview
@semantic:merge-safety-prediction
@semantic:operation-state-detection
@semantic:tauri-command-layer
@semantic:llm-local
@semantic:gpu-control
@semantic:external-url-allowlist
@state:active

# lib.rs

**Date:** 2026-05-04  
**Summary:** Tauri backend command layer for ChronoGit. Executes Git operations, parses deterministic Git state, enforces path and mutation safety, provides remote preview/execution commands, detects interrupted Git operations, and integrates local Ollama explanations with GPU power limiting.  
**Keywords:** tauri backend, git command layer, git parser, remote preview, merge safety, local llm, ollama integration  
**Tags:** scripts, backend, control-api, git, tauri, llm, remote-sync

Execution and truth layer for ChronoGit.

---

## Purpose

Provides a controlled execution boundary between:

React UI → Tauri backend → Git CLI / Ollama / OS browser

Ensures:

- structured outputs
- validated mutation inputs
- deterministic Git truth extraction
- guarded Git mutation
- allowlisted external URL opening
- local-only LLM integration

---

## Core Responsibilities

### 1. Git Availability and External URL Opening

Commands:

- `detect_git`
- `open_external_url`

`detect_git` verifies that Git is available through `git --version`.

`open_external_url` opens only allowlisted URLs through the operating system default browser.

Allowlist:

- `http://jarri.systems`
- `https://github.com/TorMatzAndren`

Platform behavior:

- Windows: `cmd /C start`
- macOS: `open`
- Linux/Unix: `xdg-open`

Unlisted URLs are blocked.

---

### 2. Git State Extraction

Commands:

- `git_status`
- `git_remote_status`
- `git_operation_state`

`git_status` parses:

- `git status --porcelain=v1 --branch`

It returns:

- branch
- staged/prepared changes
- working folder changes

`git_remote_status` parses:

- `git status -sb`
- `git remote -v`

It returns:

- branch
- upstream
- remote name
- remote URL
- ahead count
- behind count
- remote presence
- divergence state
- clean sync state

`git_operation_state` detects interrupted Git operations by inspecting `.git` state files/directories:

- `rebase-merge`
- `rebase-apply`
- `MERGE_HEAD`
- `CHERRY_PICK_HEAD`
- `REVERT_HEAD`

It also lists unresolved conflict files through:

- `git diff --name-only --diff-filter=U`

---

### 3. Change Classification

Function:

- `classify_change`

Produces:

- status:
  - untracked
  - conflict
  - modified
  - added
  - deleted
  - renamed
  - copied
  - unknown

Risk levels:

- critical
- danger
- evidence
- review
- normal

Special handling:

- backup-like file detection:
  - `.bak`
  - `.tmp`
  - `.old`
  - `.orig`
  - `~`
- conflict state detection:
  - `UU`
  - `AA`
  - `DD`
  - `AU`
  - `UA`
  - `DU`
  - `UD`

---

### 4. Repository Discovery

Command:

- `discover_git_repos`

Discovery roots are built from:

- `CHRONOGIT_SCAN_ROOTS`
- common home subfolders:
  - projects
  - Projects
  - dev
  - Dev
  - src
  - code
  - work
  - Documents
  - Desktop
  - Downloads
- `$HOME`
- `/opt`

Excluded folders include:

- `.git`
- `node_modules`
- `target`
- `dist`
- `build`
- `.cache`
- `.local`
- `.cargo`
- `.rustup`
- `.npm`
- `.ollama`
- `.vscode`

Depth limits:

- `$HOME`: depth 2
- other scan roots: depth 5

Results are sorted and deduplicated.

---

### 5. Safe Mutation Layer

Commands:

- `git_stage`
- `git_unstage`
- `git_restore`
- `git_remove_untracked`
- `git_ignore_path`
- `git_commit`

Safety mechanisms:

- relative path validation
- absolute paths blocked
- parent traversal blocked
- empty paths blocked
- untracked removal verifies `??` state before `git clean -f`
- commit message required
- commit blocked if no staged changes exist
- commit blocked if unresolved conflicts exist

Git commands used include:

- `git add`
- `git restore --staged`
- `git restore`
- `git clean -f`
- `.gitignore` append
- `git commit -m`

---

### 6. Commit Preflight

Command:

- `git_commit_preflight`

Uses:

- `git diff --cached --name-only`
- `git diff --cached --numstat`

Returns:

- staged file count
- insertion count
- deletion count
- empty-state flag

This command provides the backend truth for the UI snapshot boundary.

---

### 7. Temporal Layer / Time Machine

Commands:

- `git_history`
- `git_changed_files_from_commit`
- `git_diff_file_from_commit`
- `git_restore_file_from_commit`

Capabilities:

- read last 50 commits
- list changed files per commit
- extract selected file diff
- restore one selected file from one selected commit into the working folder

Commands used include:

- `git log`
- `git diff-tree`
- `git show`
- `git checkout <commit> -- <path>`

Constraint:

No full repository rollback is implemented. Restore is file-level only.

---

### 8. Remote Preview Layer

Commands:

- `git_fetch_remote`
- `git_push_preview`
- `git_pull_preview`

Helper functions:

- `current_branch`
- `current_upstream`
- `remote_name_from_upstream`
- `ahead_behind_against_upstream`
- `preview_commits`
- `preview_commit_hashes`
- `preview_changed_files_from_commits`
- `count_working_changes`

Remote preview uses directional commit ranges:

- upload preview: `@{u}..HEAD`
- download preview: `HEAD..@{u}`

Preview output includes:

- operation name
- repo path
- branch
- upstream
- remote
- ahead/behind counts
- commit list
- changed file list
- consequence text
- warning text
- merge safety prediction

Preview commands do not push, pull, merge, rebase, or modify working files.

---

### 9. Merge Safety Prediction

Function:

- `build_merge_safety_prediction`

Compares local-only and remote-only touched paths.

Classifications:

- `NEEDS REVIEW`
- `ONE-WAY`
- `LIKELY CLEAN`

Risk levels:

- `LOW`
- `MEDIUM`
- `HIGH`

Risk rules:

- same-path overlap + working changes → HIGH
- same-path overlap or working changes → MEDIUM
- otherwise → LOW

Outputs include:

- classification
- risk level
- summary
- local touched file count
- remote touched file count
- local file list
- remote file list
- shared file list
- working change count
- warning

Important constraint:

This is a prediction only. Git remains authoritative.

---

### 10. Remote Execution Layer

Commands:

- `git_push_execute`
- `git_pull_rebase_execute`
- `git_rebase_abort`

`git_push_execute`:

- requires local branch to be ahead
- blocks HIGH risk unless override token is `override`
- blocks diverged or MEDIUM-risk upload unless token is `confirm` or `override`
- runs plain `git push`
- never force pushes

`git_pull_rebase_execute`:

- requires remote branch to be ahead
- blocks HIGH risk diverged download unless override token is `override`
- blocks MEDIUM risk unless token is `confirm`
- runs `git pull --rebase --autostash`
- performs a post-pull fetch on success
- reports conflict/rebase guidance on failure

`git_rebase_abort`:

- runs `git rebase --abort`

---

### 11. LLM Integration / Ollama

Commands:

- `list_local_llm_models`
- `explain_diff_with_ollama`
- `explain_context_with_ollama`

Ollama endpoints:

- `GET http://127.0.0.1:11434/api/tags`
- `POST http://127.0.0.1:11434/api/generate`

The backend validates that the requested model exists locally before generating explanations.

LLM output is cleaned by:

- removing escape/control sequences
- removing thinking markers
- trimming unwanted prompt echoes
- compacting blank lines

---

### 12. GPU Power Management

Functions:

- `query_gpu_power_limits`
- `set_gpu_power_limit`

Behavior:

- query current/default NVIDIA power limits
- reduce GPU power limit to approximately 60% during LLM generation
- attempt reset after generation
- include warnings in LLM result if power control fails

Requires:

- `nvidia-smi`
- passwordless/noninteractive sudo access for `/usr/bin/nvidia-smi -pl`

Failure to adjust power does not automatically block explanation generation; it is surfaced as a warning.

---

### 13. Diff Preprocessing

Functions:

- `is_lockfile`
- `summarize_lockfile_diff`

Lockfiles handled specially:

- `Cargo.lock`
- `package-lock.json`
- `pnpm-lock.yaml`
- `yarn.lock`

The backend summarizes visible dependency/package/version changes and instructs the LLM not to over-infer build, platform, dependency, or manual-edit conclusions from lockfile diffs.

---

## Inputs

From UI:

- repository path
- file path
- commit hash
- commit message
- remote override/confirm token
- diff content
- LLM model name
- explanation kind/title/context/raw truth
- external URL

---

## Outputs

Structured responses:

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

## Role in System

Acts as:

→ deterministic Git truth extraction engine  
→ safe Git mutation boundary  
→ remote preview and execution controller  
→ operation-state detector  
→ local LLM integration controller  
→ GPU power guard  
→ allowlisted external URL opener

Bridges:

React UI ↔ Git CLI  
React UI ↔ Ollama  
React UI ↔ OS default browser  
React UI ↔ NVIDIA power limit control

---

## Design Principles

- no raw shell exposure to UI
- no arbitrary command execution
- all path mutations validated
- Git CLI is source of truth
- remote preview separated from remote execution
- force push is not implemented
- LLM is optional and advisory
- destructive actions return explicit messages
- interrupted Git operations are detectable
- external URLs are allowlisted

---

## Current Known Gaps

- no A ↔ B comparison backend yet
- no file evolution backend yet
- no commit graph backend yet
- no built-in conflict resolution engine
- no branch creation/switching UI commands
- no stash commands
- no advanced diff options such as ignore whitespace or side-by-side diff generation

---

## Status

active
