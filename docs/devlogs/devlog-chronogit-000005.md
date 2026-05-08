Title: ChronoGit Branch Architecture, Repository Discovery Expansion, File Lineage System, Remote Safety Hardening, and Tauri Backend Consolidation
ID: devlog-chronogit-000005
Date: 2026-05-07
Author: Matz
Type: devlog
Subsystem: chronogit
Updated: 2026-05-07
Revision: 1

---

@role:devlog
@subsystem:chronogit
@scope:tauri-backend
@scope:git-command-layer
@scope:branch-management
@scope:branch-switch-safety
@scope:repository-discovery
@scope:file-lineage
@scope:time-machine
@scope:remote-preview
@scope:merge-safety
@scope:git-validation
@scope:path-validation
@scope:llm-streaming
@scope:ollama-integration
@scope:gpu-power-limits
@scope:lockfile-summarization
@scope:log-backups
@scope:command-boundary
@scope:deterministic-git
@scope:local-only-architecture
@scope:jarri-doctrine
@entity:chronogit-app/src-tauri/src/lib.rs
@entity:chronogit-app/src/App.tsx
@entity:chronogit-app/src/panels
@entity:chronogit-app/src/components
@entity:chronogit-app/src/lib
@entity:chronogit-app/src/types
@state:active

# ChronoGit Branch Architecture, Repository Discovery Expansion, File Lineage System, Remote Safety Hardening, and Tauri Backend Consolidation

**Date:** 2026-05-07  
**Summary:** This session focused almost entirely on ChronoGit’s Tauri backend architecture inside `src-tauri/src/lib.rs`. Major work included branch-management infrastructure, deterministic branch switching safeguards, expanded repository discovery, file-lineage and rename tracking systems, hardened Git/path validation, remote preview and merge-safety stabilization, Ollama streaming improvements, GPU TDP management for local LLM execution, lockfile explanation hardening, and consolidation of ChronoGit’s backend command boundary into a significantly more mature Git execution surface.

---

# Context

ChronoGit had already evolved beyond a simple Git GUI.

At this stage it had become:

- a deterministic Git safety system
- a Time Machine interface
- a local-LLM-assisted Git inspection environment
- a repository workspace prototype
- a branch-aware Git exploration tool
- a remote-preview and merge-risk system
- a structured Git execution boundary

The frontend architecture was already becoming large and increasingly modularized.

However, the backend command layer had simultaneously grown into a critical truth boundary:

- all Git execution
- all Git mutation
- all repository inspection
- all LLM invocation
- all local backup writing
- all OS-level execution

now passed through `src-tauri/src/lib.rs`.

This session significantly expanded and hardened that backend layer.

---

# Strategic Direction

The overall direction clarified during this session was:

> ChronoGit should not merely “run Git commands.”  
> It should project deterministic Git truth surfaces.

This meant:

- explicit validation
- explicit safety boundaries
- explicit mutation intent
- typed responses
- predictive risk modeling
- deterministic operation-state inspection
- local-only execution guarantees

The backend increasingly became:

> a structured Git cognition layer.

---

# Branch Architecture Added

One of the largest additions was full branch-overview infrastructure.

New backend structures included:

- `BranchInfo`
- `BranchOverview`

New command:

- `git_branch_overview`

This command now exposes:

- local branches
- remote branches
- detached HEAD state
- upstream tracking
- ahead/behind state
- current active branch
- remote branch visibility
- detached HEAD hash projection

Git commands used:

- `git branch --show-current`
- `git rev-parse --short HEAD`
- `git for-each-ref`

This became the foundation for ChronoGit’s future branch-management UI.

---

# Detached HEAD Awareness Introduced

The backend gained explicit detached HEAD handling.

Instead of silently failing or returning ambiguous state:

- detached repositories are now explicitly classified
- detached hashes are surfaced visibly
- pseudo-branch entries are injected into branch overview state

This aligned strongly with ChronoGit philosophy:

> dangerous Git states should be visible, not hidden.

---

# Branch Name Validation Hardened

A new deterministic validation function was introduced:

- `validate_branch_name`

This blocked:

- whitespace
- traversal-like patterns
- Git-invalid characters
- shell-risk patterns
- malformed refs
- `@{`
- `..`
- invalid suffixes
- leading `-`

This reduced:

- malformed branch creation
- accidental Git ambiguity
- command-boundary instability

ChronoGit’s branch layer became substantially safer.

---

# Branch Creation Added

New command:

- `git_create_branch`

Behavior:

- validates branch names
- checks branch existence
- blocks duplicates
- creates branch without switching

Git command:

- `git branch <name>`

Importantly:

> ChronoGit deliberately separates branch creation from branch switching.

This reinforced:

- explicit mutation boundaries
- explicit operator intent
- deterministic workflow clarity

---

# Branch Switching Safety System Added

New command:

- `git_switch_branch`

This became one of the strongest backend safety additions.

The system now blocks branch switching when:

- the working tree is dirty
- the branch does not exist
- ChronoGit is running from the repository itself

The self-repository protection was especially important.

The backend now checks:

- current executable path
- canonical repository path

and blocks switching if:

- ChronoGit itself is executing from the selected repository

Reason:

switching the currently-running ChronoGit repository could:

- replace running frontend assets
- replace Tauri runtime files
- invalidate panels
- trigger blank UI states
- create restart corruption behavior

This was recognized as:

> a real-world self-hosting mutation hazard.

The backend now explicitly refuses this action.

This became a very important deterministic-safety improvement.

---

# Repository Discovery Expanded

Repository scanning logic evolved significantly.

New helpers:

- `discover_scan_roots`
- `scan_git_repos`

New command:

- `discover_git_repos`

ChronoGit now automatically scans:

- `$HOME`
- common development folders
- `/opt`
- optional environment-defined roots

Common noisy folders are skipped:

- `.git`
- `node_modules`
- `target`
- `.cache`
- `.cargo`
- `.rustup`
- `.ollama`
- `dist`
- `build`
- others

Depth rules became adaptive:

- shallow scan for `$HOME`
- deeper scan for targeted roots

This dramatically improved:

- startup repo discovery
- multi-project workspace usability
- local developer ergonomics

---

# File Lineage System Added

One of the most important architectural additions was:

- `git_file_lineage`

This evolved beyond simple history inspection.

New structures:

- `FileLineage`
- `FileRenameEvent`

The lineage system now tracks:

- commit history
- rename history
- deletion state
- first appearance
- latest modification
- rename chains

Git command used:

- `git log --follow --name-status`

The parser detects:

- `R*` rename status
- deletion state
- rename events
- historical path transitions

This became a major conceptual evolution for Time Machine.

ChronoGit now understands:

> a file is not merely a current path.  
> A file has temporal identity.

This strongly aligned with:

- ChronoGit
- Chrono-Field
- Jarri provenance philosophy

---

# File History vs File Lineage Clarified

The older:

- `git_file_history`

still exists.

However:

- `git_file_lineage`

became the preferred higher-level abstraction.

The distinction became:

## File History

Flat commit/file event list.

## File Lineage

Temporal identity model including:

- rename chains
- deletion state
- first/last commit awareness
- lineage continuity

This was a conceptual upgrade, not merely a new API endpoint.

---

# Commit Validation Hardened

New helper:

- `validate_commitish`

This now validates commit references before:

- restore
- diff
- comparison
- lineage operations

Git command:

- `git rev-parse --verify <commit>^{commit}`

This prevented:

- malformed commit references
- command injection ambiguity
- invalid comparison targets

ChronoGit’s Time Machine layer became significantly safer.

---

# Path Validation Hardened

New helper:

- `validate_relative_path`

This blocks:

- empty paths
- absolute paths
- parent traversal
- `..`

This affected:

- restore
- remove
- lineage
- diff
- file-history operations

This was important because:

> ChronoGit should mutate only repository-relative truth surfaces.

---

# Commit Comparison System Expanded

The A ↔ B comparison system matured substantially.

New structure:

- `CommitComparison`

The backend now returns:

- changed files
- insertions
- deletions
- labels
- full diff
- rename/copy-aware comparisons

Git commands:

- `git diff --name-status`
- `git diff --numstat`
- `git diff`

with:

- `--find-renames`
- `--find-copies`

This significantly strengthened Time Machine comparison capabilities.

---

# Remote Preview System Hardened

Remote preview logic evolved further.

Existing concepts stabilized:

- upload preview
- download preview
- ahead/behind tracking
- merge prediction
- changed-file projection

New safety emphasis:

> preview and execution must remain separate concepts.

Preview operations now became increasingly trustworthy.

---

# Merge Safety Prediction Refined

The merge-risk prediction layer matured substantially.

The system now compares:

- local-only paths
- remote-only paths
- overlapping paths
- working-tree dirtiness

Classifications:

- `NEEDS REVIEW`
- `ONE-WAY`
- `LIKELY CLEAN`

Risk levels:

- `LOW`
- `MEDIUM`
- `HIGH`

This remained explicitly advisory.

ChronoGit doctrine remained:

> Git is authoritative.  
> ChronoGit predicts and explains.

---

# Remote Execution Safety Hardened

Remote execution commands were strengthened further:

- `git_push_execute`
- `git_pull_rebase_execute`

New behavior:

- HIGH risk requires `override`
- MEDIUM risk requires `confirm`
- diverged state blocks unsafe assumptions
- force push remains intentionally unsupported

This reinforced:

- explicit operator intent
- deterministic mutation gating
- visible risk acknowledgment

---

# Interrupted Git Operation Awareness Expanded

Operation-state inspection continued maturing.

Detected states:

- rebase
- merge
- cherry-pick
- revert
- conflict state

Filesystem inspection:

- `MERGE_HEAD`
- `CHERRY_PICK_HEAD`
- `REVERT_HEAD`
- `rebase-merge`
- `rebase-apply`

Conflict detection:

- `git diff --name-only --diff-filter=U`

ChronoGit increasingly gained:

> active Git cognition rather than passive Git inspection.

---

# Local LLM Streaming Stabilized

Streaming explanation support improved.

New structure:

- `LlmStreamEvent`

Streaming command:

- `explain_prompt_with_ollama_stream`

Streaming events now emit:

- incremental chunks
- completion state
- errors

through:

- `chronogit://llm-stream`

This improved:

- responsiveness
- incremental rendering
- frontend streaming clarity

---

# Local Model Validation Added

Before explanation execution:

ChronoGit now validates that:

- requested models actually exist locally

through:

- `list_local_llm_models`

This prevents:

- invalid model execution
- hallucinated model names
- stale frontend model state

This aligned strongly with Jarri doctrine:

> local truth before execution.

---

# GPU TDP Management Added

One of the most unusual additions was:

GPU power-limit management during non-streaming LLM calls.

New helpers:

- `query_gpu_power_limits`
- `set_gpu_power_limit`

ChronoGit now:

1. queries current GPU limits
2. reduces active limit to ~60%
3. executes Ollama request
4. restores original limit afterward

Commands used:

- `nvidia-smi`
- `sudo -n /usr/bin/nvidia-smi -pl`

This reduced:

- unnecessary GPU spikes
- thermal waste
- excessive power consumption

Importantly:

this behavior applies only to:

- non-streaming explanation commands

Streaming explanations intentionally remain unchanged for now.

---

# Lockfile Explanation Hardening Added

A major LLM quality improvement was introduced:

- lockfile summarization

New helpers:

- `is_lockfile`
- `summarize_lockfile_diff`

Instead of dumping giant lockfile diffs directly into the LLM:

ChronoGit now extracts:

- package names
- version changes
- visible dependency transitions

The prompt explicitly tells the model:

- do not infer platform problems
- do not hallucinate dependency conflicts
- do not recommend manual lockfile editing
- do not assume build failures

This dramatically reduced:

- LLM hallucination
- noisy explanations
- false dependency analysis

This became one of the strongest examples of:

> deterministic prompt engineering.

---

# Ollama Output Cleaning Improved

`clean_ollama_text` evolved significantly.

It now strips:

- ANSI escapes
- `<think>`
- `Thinking...`
- backspaces
- control characters
- noisy generated artifacts

It also compresses repeated blank lines.

This improved:

- frontend readability
- log cleanliness
- streamed explanation quality

---

# Log Backup System Added

New backup infrastructure:

- `save_log_backup`
- `open_log_backup_folder`

Default backup path:

- `~/.local/share/chronogit/log-backups`

Features:

- directory auto-creation
- filename sanitization
- local patch/log archival
- OS-native folder opening

This strengthened:

- local evidence preservation
- auditability
- patch archival workflows

---

# External URL Allowlist Formalized

ChronoGit now explicitly blocks arbitrary external URLs.

Allowed:

- `jarri.systems`
- GitHub profile

Everything else is denied.

This reinforced:

> ChronoGit is local-first and intentionally conservative about external execution.

---

# Tauri Backend Consolidation

By the end of the session:

`src-tauri/src/lib.rs` had evolved into a major system boundary.

It now acts as:

- Git execution layer
- Git validation layer
- mutation safety layer
- repository cognition layer
- remote prediction layer
- branch-awareness layer
- lineage engine
- local LLM execution layer
- GPU-control layer
- local backup system
- OS integration boundary

The backend increasingly resembles:

> a deterministic Git operating substrate.

---

# Architectural Insight

A major realization emerged:

ChronoGit’s backend is no longer “just Tauri glue.”

It is becoming:

> the actual cognition engine of the application.

The frontend increasingly becomes:

- visualization
- interaction
- orchestration

while the backend becomes:

- truth extraction
- safety enforcement
- mutation control
- Git cognition

This mirrors Jarri architecture closely:

Raw → Structured → Classified → Projected

---

# Current Strengths

ChronoGit now has:

- deterministic branch validation
- safe branch switching
- detached HEAD awareness
- repository auto-discovery
- rename-aware file lineage
- hardened commit validation
- hardened path validation
- merge-risk prediction
- remote preview separation
- operation-state cognition
- local-model verification
- streaming local LLM support
- lockfile-aware explanation prompting
- GPU-aware local inference management
- local backup persistence

---

# Current Weaknesses

Still unresolved:

- backend file size growth
- command registration centralization
- Tauri command sprawl
- duplicated Git invocation patterns
- lack of backend module extraction
- no structured Git execution abstraction yet
- no Rust parser layer yet
- no semantic Git graph yet
- backend types still colocated in one file

---

# Future Direction

The next backend phase is now increasingly clear.

Future work likely includes:

- backend modularization
- Git execution abstraction layer
- structured parser separation
- semantic classification layer
- backend domain modules
- typed repository graph modeling
- deterministic Git event pipeline
- operation journaling
- provenance-aware restore workflows

The architecture is increasingly converging toward:

> ChronoGit as a deterministic Git cognition engine.

---

# Jarri Doctrine Reinforced

This session strongly reinforced Jarri doctrine:

1. Investigate
2. Implement
3. Verify
4. Challenge
5. Document

Especially important lessons:

- validate before mutation
- classify before projection
- Git remains authoritative
- prediction must remain advisory
- separate preview from execution
- dangerous states must be visible
- local-only execution should remain explicit
- safety boundaries must be deterministic

---

# Final Principle

This session reinforced a major ChronoGit design truth:

> Git commands are not the product.  
> Structured Git understanding is the product.

---

# Status

active
