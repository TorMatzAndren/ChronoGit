Title: lib.rs
ID: scripts-chronogit-000002
Date: 2026-05-04
Author: Matz
Type: scripts
Subsystem: control-api
Updated: 2026-05-16
Revision: 7

---

@role:backend
@subsystem:control-api
@entity:script:chronogit-app/src-tauri/src/lib.rs
@entity:/chronogit-app/src-tauri/src/lib.rs
@semantic:tauri-command-layer
@semantic:git-execution
@semantic:git-status
@semantic:git-mutation
@semantic:git-branching
@semantic:git-branch-graph
@semantic:branch-topology-source
@semantic:git-remote-awareness
@semantic:git-remote-preview
@semantic:merge-safety-prediction
@semantic:operation-state-detection
@semantic:branch-relationship-preview
@semantic:branch-merge-preview
@semantic:branch-merge-execution
@semantic:merge-abort
@semantic:gitignore-conflict-resolution
@semantic:bulk-unstage
@semantic:git-temporal
@semantic:file-lineage
@semantic:commit-comparison
@semantic:log-backup
@semantic:llm-local
@semantic:llm-streaming
@semantic:ollama-integration
@semantic:gpu-power-limit
@semantic:external-url-allowlist
@state:active

# lib.rs

**Date:** 2026-05-04  
**Summary:** Tauri backend execution and truth layer for ChronoGit. Provides controlled Git CLI execution, repository discovery, branch management, branch graph extraction, branch relationship inspection, guarded branch merge preview/execution, merge abort, narrow .gitignore conflict auto-resolution, bulk staged-prefix recovery, guarded remote operations, merge-safety prediction, Time Machine history/diff/lineage systems, file mutation commands, local Ollama integration, streamed LLM explanation events, GPU power-limit management for non-streaming LLM calls, and local backup persistence commands.  
**Keywords:** tauri backend, git cli, branch graph, remote preview, merge safety, branch switching, time machine, lineage, ollama, streaming llm, gpu tdp, backup persistence  
**Tags:** scripts, backend, control-api, git, tauri, branch-graph, time-machine, remote-awareness, llm

Controlled backend execution boundary for ChronoGit.

---

## Purpose

`src-tauri/src/lib.rs` is the primary backend runtime and execution surface for ChronoGit.

It provides the controlled boundary between:

- React/Tauri frontend panels
- local Git repositories
- local Ollama inference
- OS integration commands
- backup persistence surfaces
- local file restoration workflows
- branch graph extraction workflows

The frontend never executes Git directly.

All authoritative Git interaction routes through this backend layer.

---

## Architectural Role

`lib.rs` acts as:

- controlled execution boundary
- deterministic Git truth extraction layer
- Git mutation layer
- Time Machine backend
- branch-management backend
- branch graph truth source
- remote preview/execution backend
- merge-safety prediction layer
- file-lineage backend
- local-only LLM backend
- local streaming event emitter
- backup persistence layer
- OS integration boundary

It is the backend equivalent of a Jarri-style controlled execution surface:

Raw Git CLI → structured Rust model → frontend truth projection.

---

## Runtime Data Structures

Defines serializable runtime structures used by the frontend:

### Git State Structures

- `FileChange`
- `GitStatusResponse`
- `GitRemoteStatus`
- `BranchInfo`
- `BranchOverview`
- `BranchGraphCommit`
- `BranchGraphRef`
- `BranchGraph`
- `GitOperationState`

### Remote Operation Structures

- `RemotePullResult`
- `RemotePushResult`
- `MergeSafetyPrediction`
- `RemoteOperationPreview`

### Repository Structures

- `RepoInfo`

### Commit / History Structures

- `CommitResult`
- `CommitPreflight`
- `HistoryCommit`
- `ChangedFile`
- `DiffResult`
- `CommitComparison`

### File Lineage Structures

- `FileHistoryEntry`
- `FileRenameEvent`
- `FileLineage`

### LLM Structures

- `ExplainDiffResult`
- `LocalModel`
- `LlmStreamEvent`

### Internal Ollama Structures

Internal-only request/response parsing structures:

- `OllamaGenerateRequest`
- `OllamaGenerateResponse`
- `OllamaTagsResponse`
- `OllamaTagModel`
- `OllamaTagDetails`
- `OllamaStreamChunk`

These are not frontend-facing UI truth models.

---

## Branch Graph Structures

### BranchGraphCommit

Defines commit graph data:

- `hash`
- `short_hash`
- `parents`
- `refs`
- `author`
- `date`
- `subject`
- `is_head`

Purpose:

Represents a commit row extracted from `git log --all` for branch topology projection.

---

### BranchGraphRef

Defines ref graph data:

- `name`
- `full_name`
- `kind`
- `target_short_hash`

Kind values are emitted as strings:

- `local`
- `remote`
- `tag`
- `other`

Purpose:

Represents refs from local branches, remote branches, and tags.

---

### BranchGraph

Defines backend branch graph result:

- `commits`
- `refs`

Purpose:

Provides structured branch graph truth to the frontend.

Consumed by:

- `chronogitRuntimeTypes.ts`
- `branchTopology.ts`
- `BranchPanel.tsx`

---

## External URL Allowlist

Command:

- `open_external_url`

Allows only these exact URLs:

- `http://jarri.systems`
- `https://github.com/TorMatzAndren`

Platform execution:

- Windows → `cmd /C start`
- macOS → `open`
- Linux/Unix → `xdg-open`

Non-allowlisted URLs are blocked.

This prevents arbitrary browser-launch execution from frontend state.

---

## Git Availability Detection

Command:

- `detect_git`

Runs:

- `git --version`

Purpose:

- verifies Git availability
- verifies PATH resolution
- returns version string to frontend

---

## Git Change Classification

Helpers:

- `classify_backup`
- `classify_change`

### Backup Detection

Backup-like files are recognized by:

- `.bak`
- `.tmp`
- `.old`
- `.orig`
- `~`

### Risk Classifications

Generated classifications include:

- `critical`
- `danger`
- `evidence`
- `review`
- `normal`

### Conflict Detection

Conflict states:

- `UU`
- `AA`
- `DD`
- `AU`
- `UA`
- `DU`
- `UD`

are classified as:

- `status = conflict`
- `risk = critical`

### Projection Philosophy

The backend generates structured classifications and explanations for frontend display.

Git remains authoritative.

The classification layer is advisory projection logic.

---

## Repository Discovery System

Commands/helpers:

- `discover_git_repos`
- `discover_scan_roots`
- `scan_git_repos`

### Scan Roots

Repository discovery includes:

- `CHRONOGIT_SCAN_ROOTS`
- `$HOME/projects`
- `$HOME/Projects`
- `$HOME/dev`
- `$HOME/Dev`
- `$HOME/src`
- `$HOME/code`
- `$HOME/work`
- `$HOME/Documents`
- `$HOME/Desktop`
- `$HOME/Downloads`
- `$HOME`
- `/opt`

### Ignored Directories

Traversal skips:

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

### Depth Rules

Maximum recursion depth:

- `$HOME` root → depth 2
- other roots → depth 5

### Result Behavior

Results are:

- sorted
- deduplicated
- returned as `RepoInfo`

---

## Branch Parsing and Branch Management

Helpers:

- `parse_remote_counts`
- `parse_branch_ahead_behind`
- `validate_branch_name`

Commands:

- `git_create_branch`
- `git_switch_branch`
- `git_branch_overview`
- `git_branch_graph`

---

## Branch Name Validation

`validate_branch_name` blocks:

- empty names
- whitespace
- leading `-`
- `..`
- `//`
- `@{`
- trailing `.`
- trailing `/`
- `\`
- `~`
- `^`
- `:`
- `?`
- `*`
- `[` characters

This is a frontend-facing safety boundary before Git execution.

---

## Branch Creation

Command:

- `git_create_branch`

Uses:

- `git show-ref --verify --quiet refs/heads/<branch>`
- `git branch <branch>`

Behavior:

- refuses existing branches
- creates local branch only
- does not switch active branch

---

## Branch Switching

Command:

- `git_switch_branch`

Behavior:

- validates branch name
- verifies local branch existence
- blocks dirty working trees
- blocks self-repository switching
- switches branch only when clean

Uses:

- `git status --porcelain=v1`
- `git checkout <branch>`

### Self-Repository Guard

ChronoGit refuses switching branches when the running executable resides inside the target repository.

Reason:

- switching ChronoGit’s own repo may replace active source/binaries
- can cause UI corruption
- can cause blank panels
- can cause restart/runtime instability

This is an intentional execution-safety boundary.

---

## Branch Overview

Command:

- `git_branch_overview`

Uses:

- `git branch --show-current`
- `git rev-parse --short HEAD`
- `git for-each-ref`

Returns:

- current branch
- detached HEAD state
- local branches
- remote branches
- upstream tracking
- ahead/behind tracking
- short hashes

Detached HEAD state creates a synthetic `BranchInfo` entry:

- `DETACHED HEAD @ <hash>`

---

## Branch Graph Extraction

Command:

- `git_branch_graph`

Purpose:

Extracts bounded branch graph truth for frontend topology projection.

This command is the backend source for the branch topology view.

---

### HEAD Detection

Uses:

- `git rev-parse HEAD`

The resulting full hash is compared against each graph commit.

Matching commit receives:

- `is_head = true`

If HEAD cannot be resolved, `head_hash` is empty and no commit is marked as HEAD.

---

### Commit Graph Extraction

Uses:

- `git log --all --max-count=80 --date=iso-strict --pretty=format:%H%x1f%h%x1f%P%x1f%D%x1f%an%x1f%ad%x1f%s%x1e`

Extracts:

- full hash
- short hash
- parent hashes
- decoration refs
- author name
- ISO-strict author date
- subject
- HEAD marker

Record separators:

- field separator: `\x1f`
- record separator: `\x1e`

This avoids fragile whitespace parsing for commit metadata.

---

### Commit Graph Output

Each parsed commit becomes:

- `BranchGraphCommit`

Malformed records with fewer than seven fields are skipped.

Parent hashes are split from the `%P` field.

Decoration refs are split from the `%D` field by comma.

---

### Ref Graph Extraction

Uses:

- `git for-each-ref --format=%(refname)|%(refname:short)|%(objectname:short) refs/heads refs/remotes refs/tags`

Extracts refs from:

- local heads
- remote tracking refs
- tags

Skips symbolic remote HEAD rows whose short name ends with:

- `/HEAD`

---

### Ref Kind Classification

Ref kind is classified by full ref prefix:

- `refs/heads/` → `local`
- `refs/remotes/` → `remote`
- `refs/tags/` → `tag`
- everything else → `other`

Each parsed ref becomes:

- `BranchGraphRef`

---

### Branch Graph Output

Returns:

- `BranchGraph { commits, refs }`

This output is consumed by frontend branch topology logic.

Important boundary:

- this backend command extracts raw graph truth
- it does not assign visual lanes
- it does not render graph rows
- it does not infer branch topology summaries
- those transformations happen in `branchTopology.ts`

---

## Remote Awareness System

Commands/helpers:

- `git_remote_status`
- `current_branch`
- `current_upstream`
- `remote_name_from_upstream`
- `ahead_behind_against_upstream`
- `fetch_configured_remote`

### Remote Status Extraction

Uses:

- `git status -sb`
- `git remote -v`

Extracts:

- branch
- upstream
- remote
- remote URL
- ahead count
- behind count
- divergence state
- remote presence
- clean sync state

### Remote State Semantics

Computed states include:

- local-only
- ahead
- behind
- diverged
- in sync

Frontend projection labels are generated elsewhere.

---

## Remote Preview System

Commands:

- `git_fetch_remote`
- `git_push_preview`
- `git_pull_preview`

Helpers:

- `preview_commits`
- `preview_commit_hashes`
- `preview_changed_files_from_commits`

### Push Preview Range

Push preview uses:

- `@{u}..HEAD`

Meaning:

- local-only commits not present remotely

### Pull Preview Range

Pull preview uses:

- `HEAD..@{u}`

Meaning:

- remote-only commits not present locally

### Preview Philosophy

Preview commands:

- do not mutate repositories
- do not merge
- do not push
- do not pull

They are inspection/projection surfaces only.

---

## Merge Safety Prediction

Helpers:

- `count_working_changes`
- `build_merge_safety_prediction`

Prediction logic compares:

- local-only changed paths
- remote-only changed paths
- overlapping paths
- working-tree dirtiness

### Classifications

Generated classifications:

- `NEEDS REVIEW`
- `ONE-WAY`
- `LIKELY CLEAN`

### Risk Levels

Generated risk levels:

- `LOW`
- `MEDIUM`
- `HIGH`

### Important Boundary

This is predictive logic only.

It does not replace Git’s actual merge/conflict result.

The code explicitly warns that Git remains authoritative.

---

## Remote Execution System

Commands:

- `git_push_execute`
- `git_pull_rebase_execute`
- `git_rebase_abort`

---

## Push Execution

Command:

- `git_push_execute`

Runs:

- `git push`

### Safety Gates

Push execution blocks when:

- nothing is ahead
- HIGH risk lacks `override`
- diverged/MEDIUM risk lacks confirmation

### Important Behavior

Force push is not implemented.

The code explicitly refuses destructive force-push behavior.

---

## Pull/Rebase Execution

Command:

- `git_pull_rebase_execute`

Runs:

- `git pull --rebase --autostash`

### Safety Gates

Blocks when:

- remote is not ahead
- HIGH risk lacks `override`
- MEDIUM risk lacks `confirm`

### Post-Execution Behavior

After successful pull/rebase:

- performs `fetch_configured_remote`
- refreshes remote knowledge

### Failure Behavior

Error messaging explicitly instructs the frontend/user to:

- abort rebase when necessary
- inspect Git state before further actions

---

## Interrupted Git Operation Detection

Command:

- `git_operation_state`

Detects:

- rebase state
- merge state
- cherry-pick state
- revert state

Detection surfaces:

- `.git/rebase-merge`
- `.git/rebase-apply`
- `.git/MERGE_HEAD`
- `.git/CHERRY_PICK_HEAD`
- `.git/REVERT_HEAD`

Conflict detection uses:

- `git diff --name-only --diff-filter=U`

Returns:

- structured operation-state flags
- conflicted file list
- warning message

---

## Git Status System

Command:

- `git_status`

Uses:

- `git status --porcelain=v1 --branch`

Separates:

- staged changes
- working-folder changes

Each path is converted into structured `FileChange` values.

---

## File Mutation System

Helpers:

- `run_git_path_action`
- `validate_relative_path`

Commands:

- `git_stage`
- `git_unstage`
- `git_restore`
- `git_remove_untracked`
- `git_ignore_path`

---

## Path Validation

`validate_relative_path` blocks:

- empty paths
- absolute paths
- `..` traversal

This validation is reused across mutation and restoration commands.

---

## File Actions

### Stage

`git_stage`

Runs:

- `git add -- <path>`

### Unstage

`git_unstage`

Runs:

- `git restore --staged -- <path>`

### Restore

`git_restore`

Runs:

- `git restore -- <path>`

Restores working-folder file content.

### Remove Untracked

`git_remove_untracked`

Behavior:

- verifies path is truly `??`
- then executes:

    git clean -f -- <path>

### Ignore Path

`git_ignore_path`

Behavior:

- appends path to `.gitignore`

---

## Commit / Snapshot System

Commands:

- `git_commit_preflight`
- `git_commit`
- `git_amend_latest_commit_message`

---

## Commit Preflight

Uses:

- `git diff --cached --name-only`
- `git diff --cached --numstat`

Returns:

- staged file count
- insertion count
- deletion count
- empty snapshot state

---

## Commit Creation

Command:

- `git_commit`

Blocks:

- empty commit messages
- unresolved conflicts
- empty staged state

Uses:

- `git commit -m`
- `git rev-parse --short HEAD`

Returns structured `CommitResult`.

---

## Commit Message Amend

Command:

- `git_amend_latest_commit_message`

Behavior:

- requires clean working tree
- rewrites latest commit message
- captures old/new hashes

Uses:

- `git commit --amend -m`

The implementation explicitly informs the frontend that the hash changed.

---

## Time Machine Systems

Helpers:

- `validate_commitish`
- `commit_label`

Commands:

- `git_history`
- `git_changed_files_from_commit`
- `git_diff_file_from_commit`
- `git_compare_commits`
- `git_file_history`
- `git_file_lineage`
- `git_restore_file_from_commit`

---

## Commit Validation

`validate_commitish` verifies commit references using:

- `git rev-parse --verify <commit>^{commit}`

Blocks:

- empty commit refs
- whitespace
- leading `-`

---

## History System

`git_history`

Uses:

- `git log --pretty=format:...`

Returns:

- full history
- no artificial frontend-imposed commit limit

---

## Single Commit File Inspection

`git_changed_files_from_commit`

Uses:

- `<commit>^!`

Returns changed files for one commit only.

---

## File Diff Inspection

`git_diff_file_from_commit`

Uses:

- `git show --format= --find-renames --find-copies`

Returns:

- full patch for selected file within selected commit

---

## Commit Comparison System

`git_compare_commits`

Uses:

- `git diff --name-status`
- `git diff --numstat`
- `git diff`

Returns:

- changed files
- insertions
- deletions
- full diff
- human labels for both commits

Rejects identical commit comparisons.

---

## File History System

`git_file_history`

Uses:

- `git log --follow --name-status`

Returns flattened history entries for a path.

This is older/simple history extraction behavior.

---

## File Lineage System

`git_file_lineage`

Uses:

- `git log --follow --name-status`

Tracks:

- commits
- rename events
- deletion state
- first commit
- latest commit

Returns:

- rename history
- lineage events
- renamed/deleted state flags

This is the more advanced lineage-oriented Time Machine surface.

---

## File Restore from Historical Snapshot

Command:

- `git_restore_file_from_commit`

Uses:

- `git checkout <commit> -- <path>`

Behavior:

- restores one file from one commit into working folder
- does not automatically commit
- does not alter unrelated files

---

## Local Ollama Model Discovery

Command:

- `list_local_llm_models`

Supported engine:

- `ollama`

Uses local HTTP endpoint:

- `http://127.0.0.1:11434/api/tags`

Returns:

- model name
- engine
- size
- modified date
- family
- parameter size
- quantization level

---

## Streaming LLM Explanation System

Command:

- `explain_prompt_with_ollama_stream`

Uses:

- local Ollama `/api/generate`
- streaming JSON responses
- Tauri event emission

Event channel:

- `chronogit://llm-stream`

### Streaming Behavior

- validates model exists locally
- streams chunks progressively
- emits completion event
- cleans final text

### Important Difference

Streaming explanations do not use GPU power-limit reduction.

That behavior exists only in non-streaming explanation commands.

---

## Non-Streaming LLM Explanation Systems

Commands:

- `explain_context_with_ollama`
- `explain_diff_with_ollama`
- `explain_comparison_with_ollama`

All:

- validate local model existence
- call local Ollama
- clip oversized prompt payloads
- clean returned text
- return structured explanation objects

---

## GPU Power-Limit System

Helpers:

- `query_gpu_power_limits`
- `set_gpu_power_limit`

Uses:

- `nvidia-smi`
- `sudo -n /usr/bin/nvidia-smi -pl`

### Execution Flow

1. query current/default power limit
2. reduce to 60%
3. execute non-streaming inference
4. restore original/default limit
5. report warnings if set/reset fails

### Important Boundary

This assumes:

- NVIDIA GPU exists
- `nvidia-smi` exists
- passwordless sudo is configured

The implementation is Linux/NVIDIA-specific behavior.

---

## LLM Output Cleaning

Helper:

- `clean_ollama_text`

Removes:

- ANSI escape sequences
- backspaces
- carriage returns
- unwanted control characters
- `<think>` tags
- thinking narration
- duplicated blank lines

Also trims generated text around unwanted sections.

---

## Lockfile Explanation Specialization

Helpers:

- `is_lockfile`
- `summarize_lockfile_diff`

Recognized lockfiles:

- `Cargo.lock`
- `package-lock.json`
- `pnpm-lock.yaml`
- `yarn.lock`

### Behavior

Instead of feeding full lockfile patches directly:

- extracts visible package/version changes
- generates specialized explanatory guidance
- instructs LLM not to hallucinate dependency problems

This is an explicit anti-hallucination control surface.

---

## Backup Persistence System

Helpers/commands:

- `chronogit_log_backup_dir`
- `sanitize_backup_filename`
- `save_log_backup`
- `open_log_backup_folder`

---

## Backup Directory Resolution

Default path:

- `$HOME/.local/share/chronogit/log-backups`

Override variable:

- `CHRONOGIT_LOG_BACKUP_DIR`

Supports:

- Linux
- Windows (`USERPROFILE` fallback)

---

## Backup File Safety

`sanitize_backup_filename` permits only:

- alphanumeric
- `-`
- `_`
- `.`

All other characters become `_`.

---

## Backup Persistence

`save_log_backup`

Behavior:

- creates backup directory
- sanitizes filename
- writes body to disk

Used for:

- system logs
- LLM logs
- raw patches

---

## Backup Folder Opening

`open_log_backup_folder`

Uses:

- Windows → `explorer`
- macOS → `open`
- Linux → `xdg-open`

---

## Tauri Command Registration

`run()` registers all frontend-accessible commands through:

- `tauri::generate_handler!`

Registered surfaces include:

- Git detection
- external URL opening
- backup persistence
- repository discovery
- remote awareness
- branch workflows
- branch graph extraction
- operation-state detection
- file mutation
- commit/preflight/amend
- history/diff/comparison
- lineage systems
- file restore
- Ollama explanation systems
- streaming events
- local model discovery

---

## Inputs

Primary runtime inputs:

- repository paths
- relative file paths
- commit references
- branch names
- commit messages
- override tokens
- local model names
- explanation prompts
- diff text
- comparison text
- backup filenames
- backup bodies

Environment variables:

- `CHRONOGIT_SCAN_ROOTS`
- `CHRONOGIT_LOG_BACKUP_DIR`
- `HOME`
- `USERPROFILE`

External runtime dependencies:

- `git`
- `nvidia-smi`
- `sudo`
- `xdg-open`
- `open`
- `explorer`
- `cmd`
- local Ollama API

---

## Outputs

Returns structured Rust objects to frontend panels.

Also emits streaming events:

- `chronogit://llm-stream`

Writes:

- backup files

Executes:

- local Git mutations
- local Git inspections
- local browser/folder opens
- local Ollama inference requests

Branch graph output is returned as:

- `BranchGraph`

for frontend topology projection.

---

## Truth, Projection, Mutation, and Advisory Boundaries

### Truth Surfaces

Git CLI output is authoritative.

This backend extracts and structures Git truth.

Branch graph truth is extracted from:

- `git log --all`
- `git for-each-ref`

but visual lane topology is not computed here.

### Projection Systems

Generated classifications and merge-safety predictions are projections layered on top of Git truth.

Branch graph extraction is structured truth output.

Branch topology projection is delegated to frontend `branchTopology.ts`.

### Mutation Systems

Mutation commands include:

- branch creation
- branch switching
- commit creation
- commit amend
- restore
- stage/unstage
- remote execution
- file restore

### Advisory Systems

LLM outputs are advisory only.

The prompts explicitly reinforce:

- Git remains authoritative
- frontend state remains authoritative
- explanations must not invent hidden context

---

## Design Principles Verified from Source

- frontend never executes Git directly
- branch names are validated before execution
- branch graph is extracted as structured backend truth
- paths are validated before file mutation
- commit references are validated before historical access
- remote preview is separated from remote execution
- force push is intentionally absent
- dirty working trees block branch switching
- self-repository branch switching is blocked
- merge safety is predictive only
- local LLM output is advisory
- lockfiles receive specialized anti-hallucination handling
- backup filenames are sanitized
- external URLs are allowlisted
- streaming LLM output is event-based
- non-streaming inference reduces GPU power limits when possible

---

## Current Known Gaps

- `git_switch_branch` still uses `git checkout` instead of `git switch`
- self-repository switching is blocked instead of using controlled restart workflow
- `git_branch_graph` is bounded to 80 commits
- `git_branch_graph` extracts graph truth but does not compute visual topology
- branch graph ref kind is serialized as a string rather than a Rust enum
- GPU TDP control assumes NVIDIA + passwordless sudo
- streaming LLM explanations bypass GPU TDP throttling
- backup folder naming still references `log-backups` despite patch usage
- repository discovery uses fixed recursion-depth heuristics
- merge safety prediction does not replace actual Git merge/conflict resolution
- `git_file_history` remains older/simple history extraction while `git_file_lineage` is the richer lineage surface

---

## Verification Notes

This document is based on full-file inspection of:

- `src-tauri/src/lib.rs`

This revision adds documentation for:

- `BranchGraphCommit`
- `BranchGraphRef`
- `BranchGraph`
- `git_branch_graph`
- branch graph command registration
- branch graph truth/projection boundary

The document intentionally distinguishes:

- authoritative Git truth extraction
- branch graph extraction
- frontend topology projection
- projection/advisory logic
- mutation boundaries
- prediction systems
- streaming event systems
- local-only inference systems

No behavior outside directly verified source has been documented.

---


---

# 2026-05-16 Update: Branch Relationship, Merge Execution, Conflict Recovery, and Bulk Unstage Backend

This update documents backend behavior added after the previous script documentation revision.

The backend now supports a broader branch-workflow safety surface:

- branch relationship preview
- merge preview
- guarded merge execution
- merge abort
- narrow `.gitignore` conflict auto-resolution
- staged-prefix unstage recovery
- merge-risk LLM explanation
- registered backend commands for these workflows

All of these remain local-only Git/Ollama operations.

---

# New Runtime Structures

## BranchRelationshipPreview

Defines branch-to-branch comparison truth.

Fields include:

- `repo_path`
- `left_branch`
- `right_branch`
- `left_head`
- `right_head`
- `merge_base`
- `left_only_commits`
- `right_only_commits`
- `left_only_files`
- `right_only_files`
- `shared_touched_files`
- `insertions`
- `deletions`
- `left_ahead`
- `right_ahead`
- `can_fast_forward_left`
- `can_fast_forward_right`
- `classification`
- `risk_level`
- `working_changes`
- `summary`
- `warning`

Purpose:

Provides deterministic backend truth for the BranchPanel relationship inspector.

---

## BranchMergePreview

Defines merge-readiness truth before executing a merge.

Fields include:

- `repo_path`
- `current_branch`
- `target_branch`
- `mode`
- `risk_level`
- `allowed`
- `required_confirmation`
- `blockers`
- `consequence`
- `warning`
- `relationship`

Purpose:

Allows the frontend to explain and gate a pending merge before mutation.

---

## BranchMergeResult

Defines merge execution result:

- `ok`
- `message`
- `stdout`
- `stderr`

Purpose:

Preserves Git merge stdout/stderr for frontend review.

---

# Branch Relationship Helpers

## rev_parse_commit

Validates and resolves a branch or commit reference to a commit hash.

Uses:

    git rev-parse --verify <reference>^{commit}

Returns an error if the reference is not a valid commit.

---

## merge_base

Finds the common ancestor of two refs.

Uses:

    git merge-base <left> <right>

Purpose:

Provides merge-base truth for branch relationship previews.

---

## diff_numstat

Computes insertion/deletion counts between two refs.

Uses:

    git diff --numstat <left> <right>

Purpose:

Adds numeric churn information to branch relationship previews.

---

# Branch Relationship Preview Command

## git_branch_relationship_preview

Command:

    git_branch_relationship_preview

Purpose:

Compares two branch timelines without mutating the repository.

Inputs:

- `repo_path`
- `left_branch`
- `right_branch`

Validation:

- both branch names must be non-empty
- branch names must differ
- both refs must resolve to commits

Backend Git operations include:

- `rev-parse`
- `merge-base`
- directional commit preview
- directional changed-file preview
- `diff --numstat`
- working-tree change count

---

## Relationship Ranges

Left-only range:

    <right_branch>..<left_branch>

Right-only range:

    <left_branch>..<right_branch>

These are used to compute directional commits and changed paths.

---

## Shared Touched Files

The backend builds two path sets:

- left-only changed paths
- right-only changed paths

Then computes:

    left_paths ∩ right_paths

as `shared_touched_files`.

Important boundary:

Shared touched files do not guarantee a conflict.

They indicate same-path branch overlap requiring review.

---

## Relationship Classification

Generated classifications include:

- `IDENTICAL`
- `FAST_FORWARD_LEFT`
- `FAST_FORWARD_RIGHT`
- `HIGH_RISK`
- `DIVERGED_SHARED_PATHS`
- `DIVERGED_CLEAN_PATHS`

---

## Relationship Risk Levels

Generated risk levels include:

- `LOW`
- `MEDIUM`
- `HIGH`

Working-tree dirtiness can raise otherwise simple cases to `MEDIUM`.

Shared touched files plus working changes can become `HIGH`.

---

# Branch Merge Preview Command

## git_merge_branch_preview

Command:

    git_merge_branch_preview

Purpose:

Builds merge-readiness truth for merging a selected target branch into the current branch.

Inputs:

- `repo_path`
- `target_branch`

Validation:

- current branch must be resolvable
- target branch must be non-empty
- target branch must differ from current branch

Uses:

- `current_branch`
- `git_branch_relationship_preview`
- `git_operation_state`

---

## Merge Blockers

The preview blocks merging when:

- merge is already in progress
- rebase is already in progress
- cherry-pick is in progress
- revert is in progress
- conflicted files exist
- working tree has uncommitted changes

These blockers are returned as plain strings in:

    blockers

---

## Merge Modes

Generated merge modes include:

- `ALREADY_UP_TO_DATE`
- `FAST_FORWARD`
- `NORMAL_MERGE`
- `RISKY_MERGE`

Mode rules:

- no branch-only commits on either side → `ALREADY_UP_TO_DATE`
- current branch can fast-forward → `FAST_FORWARD`
- shared touched paths exist → `RISKY_MERGE`
- otherwise → `NORMAL_MERGE`

---

## Merge Risk Level

Risk rules:

- blockers present → `HIGH`
- risky merge → `HIGH`
- normal merge → `MEDIUM`
- fast-forward / already-up-to-date → `LOW`

---

## Required Confirmation

High-risk previews require:

    override

Other allowed merge previews require:

    merge

The required token is returned to the frontend as:

    required_confirmation

---

## Merge Allowed Flag

`allowed` is true only when:

- no blockers exist
- mode is not `ALREADY_UP_TO_DATE`

The backend therefore prevents accidental execution of blocked or redundant merges.

---

# Branch Merge Execution Command

## git_merge_branch_execute

Command:

    git_merge_branch_execute

Purpose:

Executes a previously previewed branch merge through Git.

Inputs:

- `repo_path`
- `target_branch`
- `confirmation`

Execution flow:

1. rebuilds merge preview
2. refuses execution if preview is not allowed
3. requires exact confirmation token
4. runs `git merge`
5. returns structured stdout/stderr on success
6. returns detailed stdout/stderr on failure

---

## Git Merge Mode Selection

If preview mode is:

    FAST_FORWARD

the backend runs:

    git merge --ff-only <target_branch>

Otherwise it runs:

    git merge --no-edit <target_branch>

This makes fast-forward merges stricter and normal/risky merges explicit merge operations.

---

# Merge Abort Command

## git_merge_abort

Command:

    git_merge_abort

Purpose:

Aborts an in-progress Git merge.

Safety checks:

- calls `git_operation_state`
- refuses if no merge is currently in progress

Runs:

    git merge --abort

On success:

    Merge aborted. Repository returned to the pre-merge state.

---

# .gitignore Conflict Auto-Resolution

## resolve_gitignore_conflict_text

Helper:

    resolve_gitignore_conflict_text

Purpose:

Parses simple Git conflict marker blocks and combines both sides while removing duplicate lines.

Supported marker shape:

- `<<<<<<< ...`
- `=======`
- `>>>>>>> ...`

Safety behavior:

- rejects nested conflict markers
- rejects unclosed conflict blocks
- rejects files with no conflict markers
- deduplicates kept lines within each conflict block
- collapses repeated blank lines
- trims trailing blank lines
- ensures final newline

---

## git_resolve_gitignore_keep_both

Command:

    git_resolve_gitignore_keep_both

Purpose:

Narrow auto-resolution command for `.gitignore` merge conflicts.

Safety checks:

- merge must be in progress
- `.gitignore` must be conflicted
- `.gitignore` must be the only conflicted file

Execution flow:

1. reads `.gitignore`
2. resolves conflict markers by keeping both sides
3. writes resolved `.gitignore`
4. stages the file with `git add -- .gitignore`

This command intentionally does not attempt generic conflict resolution.

---

# Bulk Staged-Prefix Recovery

## git_unstage

The backend now uses:

    git reset HEAD -- <path>

for single-path unstage behavior.

Purpose:

Robustly removes a prepared path from the next commit.

---

## git_unstage_prefix

Command:

    git_unstage_prefix

Purpose:

Removes all prepared files under a folder/prefix from the next commit without deleting files.

Safety flow:

1. validates relative path
2. trims trailing slash
3. rejects empty prefix
4. runs status check scoped to the prefix
5. counts staged entries under that prefix
6. refuses if no staged files exist
7. runs:

       git reset HEAD -- <prefix>

8. returns count of removed prepared files

This supports recovery from accidental bulk staging events.

---

# Merge-Risk LLM Explanation Command

## explain_merge_risk_with_ollama

Command:

    explain_merge_risk_with_ollama

Purpose:

Provides a structured local LLM explanation for pending merge risk.

Inputs:

- `model`
- `current_branch`
- `incoming_branch`
- `mode`
- `risk_level`
- `shared_files_text`
- `changed_files_text`
- `diff`

Safety behavior:

- validates selected model exists locally
- rejects empty structured merge preview input
- clips shared-file text
- clips changed-file text
- clips diff/preview text
- uses GPU power-limit reduction for non-streaming inference
- restores GPU power limit afterward
- cleans returned text

Prompt rules explicitly forbid:

- Docker advice
- deployment advice
- refactoring advice
- generic project advice
- invented conflict details

The command tells the model to explain only the pending merge.

---

# Comparison Explanation Prompt Hardening

`explain_comparison_with_ollama` now includes stronger rules against overstating replacements.

Hardening includes:

- explain only visible comparison stats, changed-file list, and diff
- do not claim files changed unless present in supplied lists/diff
- classify important changes as additive, modifying, replacing, or removing
- if old and new functions both remain visible, do not call it a replacement

This reduces false certainty in A ↔ B Time Machine explanations.

---

# Updated Tauri Command Registration

Additional registered commands now include:

- `git_branch_relationship_preview`
- `git_merge_branch_preview`
- `git_merge_branch_execute`
- `git_merge_abort`
- `git_resolve_gitignore_keep_both`
- `git_unstage_prefix`
- `explain_merge_risk_with_ollama`

These commands are visible in the `generate_handler!` registration list.

---

# Updated Mutation Boundaries

New mutating commands include:

- `git_merge_branch_execute`
- `git_merge_abort`
- `git_resolve_gitignore_keep_both`
- `git_unstage_prefix`

New non-mutating inspection/advisory commands include:

- `git_branch_relationship_preview`
- `git_merge_branch_preview`
- `explain_merge_risk_with_ollama`

Important distinction:

- merge preview is inspection
- merge execution is mutation
- merge abort is mutation/recovery
- `.gitignore` auto-resolution writes and stages exactly one file
- staged-prefix recovery mutates the Git index but does not delete files

---

# Updated Safety Characteristics

Additional safety characteristics include:

- branch relationship preview validates refs
- merge preview blocks active Git operations
- merge preview blocks dirty working trees
- merge execution requires exact confirmation text
- fast-forward merges use `--ff-only`
- normal/risky merges use `--no-edit`
- merge abort refuses when no merge is active
- `.gitignore` auto-resolution only runs for one specific conflicted file
- `.gitignore` auto-resolution rejects multiple conflicted files
- staged-prefix recovery verifies staged entries before resetting index
- merge-risk LLM prompt forbids generic project advice

---

# Updated Known Gaps

Known gaps after this update:

- branch relationship classification uses string labels rather than Rust enums
- merge mode uses string labels rather than Rust enums
- merge preview does not simulate same-line conflict details
- merge preview does not use `git merge-tree`
- `.gitignore` auto-resolution supports only one narrow file/case
- `.gitignore` resolver deduplicates whole lines only
- `.gitignore` resolver does not preserve conflict-side comments about provenance
- `git_unstage_prefix` operates on a prefix without previewing every affected file in the backend response
- merge-risk LLM explanation is non-streaming only
- merge execution uses `--no-edit` and does not expose merge message customization

---

# Verification Notes for 2026-05-16 Update

This update is based on full-file inspection of:

- `src-tauri/src/lib.rs`

The update specifically documents:

- `BranchRelationshipPreview`
- `BranchMergePreview`
- `BranchMergeResult`
- `git_branch_relationship_preview`
- `git_merge_branch_preview`
- `git_merge_branch_execute`
- `git_merge_abort`
- `resolve_gitignore_conflict_text`
- `git_resolve_gitignore_keep_both`
- `git_unstage_prefix`
- `explain_merge_risk_with_ollama`
- updated command registration

No undocumented behavior has been inferred beyond directly visible source logic.

## Status

active
