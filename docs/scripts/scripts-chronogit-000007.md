Title: gitActions.ts
ID: scripts-chronogit-000007
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: git-operations
Updated: 2026-05-16
Revision: 2

---

@role:git-action-layer
@subsystem:git-operations
@entity:script:chronogit-app/src/core/gitActions.ts
@entity:/chronogit-app/src/core/gitActions.ts
@semantic:tauri-invoke-layer
@semantic:git-command-bridge
@semantic:frontend-backend-boundary
@semantic:git-operations
@semantic:remote-operations
@semantic:commit-operations
@semantic:git-state-refresh
@semantic:branch-relationship
@semantic:merge-preview
@semantic:merge-execution
@semantic:merge-risk-explanation
@semantic:comparison-explanation
@semantic:frontend-action-api
@semantic:async-operation-layer
@state:active

# gitActions.ts

**Date:** 2026-05-07
**Summary:** Frontend Git action bridge layer for ChronoGit. Provides strongly typed asynchronous wrappers around Tauri invoke commands for Git status retrieval, branch relationship inspection, merge preview/execution, comparison explanation, merge-risk explanation, file operations, commit execution, remote previews, push/pull execution, and Git recovery workflows.
**Keywords:** Tauri invoke, Git actions, frontend backend bridge, remote operations, commit operations, Git status, async actions, typed invoke layer
**Tags:** scripts, git-operations, tauri, frontend, backend-bridge, invoke-layer, git-runtime

Frontend Git operation bridge layer for ChronoGit.

---

## Purpose

`gitActions.ts` defines the frontend async operation layer used to communicate with the ChronoGit Tauri backend.

It acts as a typed invoke wrapper around backend Git commands.

Responsibilities include:

- file operations
- snapshot preparation
- commit execution
- remote synchronization operations
- remote previews
- Git-state refresh orchestration
- rebase abort operations

This file does not implement Git logic directly.

It forwards operations into the backend through Tauri IPC.

---

## Architectural Role

This file forms the primary frontend-to-backend Git operation boundary.

It separates:

- UI systems
- panel systems
- frontend state management

from:

- backend Git execution
- Tauri command handlers
- repository mutation logic

It acts as a deterministic frontend RPC layer.

---

## Imported Dependencies

Imports:

    invoke

from:

    @tauri-apps/api/core

Imports runtime type contracts from:

    ./chronogitRuntimeTypes

---

## Runtime Type Dependencies

Imported runtime structures:

- `CommitPreflight`
- `CommitResult`
- `GitRemoteStatus`
- `GitStatusResponse`
- `RemoteOperationPreview`
- `RemotePullResult`
- `RemotePushResult`

These types establish the frontend/backend IPC contract.

---

## Tauri Boundary

All operations use:

    invoke<T>()

This establishes Tauri as the backend execution transport layer.

The frontend does not directly execute Git commands.

---

# File Operations

## executeFileAction()

Signature:

    export async function executeFileAction(...)

Purpose:

Generic file-level Git action executor.

Supported actions:

- `git_stage`
- `git_unstage`
- `git_restore`
- `git_remove_untracked`
- `git_ignore_path`

Arguments:

- `repoPath`
- `action`
- `path`

Returns:

    Promise<string>

---

## File Operation Role

This function abstracts file mutation actions into a single typed operation layer.

It prevents frontend UI components from manually constructing invoke calls repeatedly.

---

## Backend Commands Used

Possible backend commands:

- `git_stage`
- `git_unstage`
- `git_restore`
- `git_remove_untracked`
- `git_ignore_path`

These are dynamically selected through the `action` argument.

---

# Snapshot / Commit Operations

## openSnapshotPreflight()

Signature:

    export async function openSnapshotPreflight(...)

Invokes backend command:

    git_commit_preflight

Returns:

    Promise<CommitPreflight>

Purpose:

Loads deterministic pre-commit analysis data before commit execution.

---

## confirmSnapshot()

Signature:

    export async function confirmSnapshot(...)

Invokes:

    git_commit

Arguments:

- `repoPath`
- `message`

Returns:

    Promise<CommitResult>

Purpose:

Executes commit creation after preflight confirmation.

---

# Remote Synchronization Operations

## fetchRemoteKnowledge()

Signature:

    export async function fetchRemoteKnowledge(...)

Invokes:

    git_fetch_remote

Returns:

    Promise<string>

Purpose:

Triggers remote fetch synchronization.

The naming convention emphasizes acquisition of remote state knowledge rather than direct mutation.

---

# Remote Preview Operations

## loadRemotePreview()

Signature:

    export async function loadRemotePreview(...)

Arguments:

- `repoPath`
- `kind`

Supported kinds:

- `push`
- `pull`

---

## Dynamic Command Resolution

Command mapping:

    push → git_push_preview
    pull → git_pull_preview

This creates a unified frontend preview loader while preserving backend command separation.

---

## Remote Preview Return Type

Returns:

    Promise<RemoteOperationPreview>

Purpose:

Loads deterministic preview information before executing remote operations.

---

# Push Execution

## executePush()

Signature:

    export async function executePush(...)

Invokes:

    git_push_execute

Arguments:

- `repoPath`
- `overrideToken`

Returns:

    Promise<RemotePushResult>

---

## Override Token Role

Push execution requires:

    overrideToken

This establishes a safety-confirmation boundary for remote mutation operations.

The frontend cannot perform push execution without an explicit override token.

---

# Pull/Rebase Execution

## executePullRebase()

Signature:

    export async function executePullRebase(...)

Invokes:

    git_pull_rebase_execute

Arguments:

- `repoPath`
- `overrideToken`

Returns:

    Promise<RemotePullResult>

---

## Pull/Rebase Role

This operation executes pull synchronization through rebase semantics.

The function naming explicitly communicates:

- pull
- rebase
- execution

rather than generic synchronization wording.

---

# Rebase Recovery

## abortRebase()

Signature:

    export async function abortRebase(...)

Invokes:

    git_rebase_abort

Returns:

    Promise<string>

Purpose:

Provides frontend access to recovery from interrupted or conflicted rebase states.

---

# Git State Refresh

## refreshGitState()

Signature:

    export async function refreshGitState(...)

Purpose:

Simultaneously refreshes:

- repository status
- remote synchronization status

---

## Parallel Execution

Uses:

    Promise.all([...])

Operations executed concurrently:

- `git_status`
- `git_remote_status`

This reduces UI refresh latency.

---

## Git State Return Structure

Returns:

    {
      statusResult,
      remoteResult,
    }

Types:

- `GitStatusResponse`
- `GitRemoteStatus`

---

# Frontend/Backend Separation

This file does not contain:

- Git CLI calls
- repository parsing
- filesystem mutation logic
- diff analysis
- remote computation
- merge safety logic

All Git intelligence exists behind the Tauri backend boundary.

---

# Async Operation Characteristics

All exported functions are:

- asynchronous
- Promise-based
- strongly typed
- invoke-driven

This establishes a fully async frontend runtime model.

---

# IPC Contract Layer

This file effectively defines the frontend IPC contract surface for:

- Git mutation
- Git inspection
- remote synchronization
- commit orchestration
- recovery operations

It is one of the central backend integration layers in ChronoGit.

---

# Mutation Boundaries

## Direct Mutation Operations

Potential repository mutation commands:

- `git_stage`
- `git_unstage`
- `git_restore`
- `git_remove_untracked`
- `git_ignore_path`
- `git_commit`
- `git_push_execute`
- `git_pull_rebase_execute`
- `git_rebase_abort`

---

## Inspection / Preview Operations

Non-mutating operations:

- `git_commit_preflight`
- `git_fetch_remote`
- `git_push_preview`
- `git_pull_preview`
- `git_status`
- `git_remote_status`

---

# Safety Characteristics

The operation layer includes several explicit safety surfaces:

- preview-before-execute structure
- override-token requirement
- separated preview and execution phases
- typed IPC boundaries
- explicit recovery operations

---

# Frontend Abstraction Role

UI systems consuming this file do not need awareness of:

- backend command names
- invoke payload structures
- IPC serialization details

This centralizes backend communication behavior.

---

# Relationship to Runtime Types

This file depends heavily on:

    chronogitRuntimeTypes.ts

The runtime types file defines the truth contract for backend response structures.

This file operationalizes those contracts.

---

# Dependencies

Imports:

- `@tauri-apps/api/core`
- `./chronogitRuntimeTypes`

No React dependencies exist.

No rendering logic exists.

---

# Design Characteristics

The action layer is:

- invoke-driven
- strongly typed
- async-only
- backend-separated
- Git-centric
- frontend-safe
- operation-oriented
- deterministic in interface structure

---

# Current Known Gaps

- No retry logic exists for failed backend operations.
- No timeout handling exists.
- No cancellation support exists.
- No streaming operation support exists.
- No request deduplication exists.
- No concurrency locking exists.
- No telemetry/logging layer exists here.
- Backend command strings are hardcoded.
- No centralized invoke error normalization exists.
- No optimistic state update system exists.

---

# Verification Notes

This document is based on full-file inspection of:

- `src/core/gitActions.ts`

No undocumented behavior has been inferred beyond directly visible source logic.

---


---

# 2026-05-16 Update: Branch Relationship, Merge Workflow, and LLM Explanation Actions

This update documents the expanded invoke-layer responsibilities added after the original Git operation bridge implementation.

The file now acts as the central frontend action API for:

- branch relationship inspection
- merge preview loading
- merge execution
- comparison explanation dispatch
- merge-risk explanation dispatch
- bulk staged-folder recovery

The module still contains no direct Git execution logic.

All Git truth remains delegated to backend Tauri commands.

---

# Expanded Runtime Type Dependencies

Additional imported runtime contracts now include:

- `BranchMergePreview`
- `BranchMergeResult`
- `BranchRelationshipPreview`
- `CommitComparison`
- `ExplainDiffResult`

These extend the IPC layer from basic Git operations into branch cognition and LLM explanation workflows.

---

# Branch Relationship Operations

## inspectBranchRelationship()

Signature:

    export async function inspectBranchRelationship(...)

Invokes:

    git_branch_relationship_preview

Arguments:

- `repoPath`
- `leftBranch`
- `rightBranch`

Returns:

    Promise<BranchRelationshipPreview>

Purpose:

Loads deterministic relationship analysis between two branch timelines.

This operation is inspection-only.

No repository mutation occurs.

---

# Merge Preview Operations

## previewBranchMerge()

Signature:

    export async function previewBranchMerge(...)

Invokes:

    git_merge_branch_preview

Arguments:

- `repoPath`
- `targetBranch`

Returns:

    Promise<BranchMergePreview>

Purpose:

Loads deterministic merge-readiness truth before merge execution.

This includes:

- merge mode
- blocker state
- shared touched files
- risk labels
- confirmation requirements
- allowed/disallowed merge status

The operation is preview-only.

---

# Merge Execution Operations

## executeBranchMerge()

Signature:

    export async function executeBranchMerge(...)

Invokes:

    git_merge_branch_execute

Arguments:

- `repoPath`
- `targetBranch`
- `confirmation`

Returns:

    Promise<BranchMergeResult>

Purpose:

Executes merge operations only after frontend confirmation gates have been satisfied.

The explicit confirmation string requirement creates a typed safety boundary between preview and execution.

---

# Expanded File Operations

## executeFileAction()

Supported actions now include:

- `git_stage`
- `git_unstage`
- `git_unstage_prefix`
- `git_restore`
- `git_remove_untracked`
- `git_ignore_path`

---

## git_unstage_prefix

Purpose:

Allows grouped staged-file recovery by path prefix.

Used primarily by:

    ChangeListsPanel.tsx

for accidental bulk staging recovery workflows.

Example use case:

- user accidentally stages a downloads folder
- grouped staged prefix is removed from index in one action

This operation only removes files from staging.

It does not delete the underlying files.

---

# Commit Comparison Operations

## compareCommits()

Signature:

    export async function compareCommits(...)

Invokes:

    git_compare_commits

Arguments:

- `repoPath`
- `leftCommit`
- `rightCommit`

Returns:

    Promise<CommitComparison>

Purpose:

Loads deterministic comparison truth between two commits or branch heads.

Returned comparison data includes:

- changed file list
- insertion count
- deletion count
- raw diff text

This comparison surface is reused by:

- TimeMachinePanel
- BranchPanel merge-risk explanation workflow

---

# Comparison Explanation Operations

## explainComparisonWithOllama()

Signature:

    export async function explainComparisonWithOllama(...)

Invokes:

    explain_comparison_with_ollama

Arguments:

- `model`
- `comparison`

Returns:

    Promise<ExplainDiffResult>

Purpose:

Delegates commit comparison interpretation to the selected local LLM.

The wrapper converts structured comparison data into the backend payload shape required by the explanation endpoint.

---

## Explanation Payload Construction

The wrapper constructs:

- left label
- right label
- changed file count
- insertion count
- deletion count
- normalized changed-file text
- raw diff

This keeps payload normalization centralized.

---

# Merge-Risk Explanation Operations

## explainMergeRiskWithOllama()

Signature:

    export async function explainMergeRiskWithOllama(...)

Invokes:

    explain_merge_risk_with_ollama

Arguments include:

- `currentBranch`
- `incomingBranch`
- `mode`
- `riskLevel`
- `sharedFilesText`
- `changedFilesText`
- `diff`

Returns:

    Promise<ExplainDiffResult>

Purpose:

Provides structured merge-risk explanation support for BranchPanel merge cognition workflows.

---

## Structured Merge-Risk Design

Unlike raw diff explanation, merge-risk explanation intentionally sends structured merge context.

This reduces:

- hallucinated implementation advice
- irrelevant code-review behavior
- overly granular line-by-line reasoning

and instead focuses the LLM on:

- merge safety
- branch divergence
- shared touched paths
- operational merge risk

---

# Updated Architectural Role

The file now acts as the primary frontend action API for:

- Git operations
- branch cognition
- merge cognition
- commit comparison
- local LLM explanation orchestration

while still remaining:

- invoke-only
- backend-separated
- deterministic in interface shape

---

# Updated Mutation Boundaries

Potential mutation operations now additionally include:

- `git_merge_branch_execute`
- `git_unstage_prefix`

Relationship and comparison operations remain non-mutating.

---

# Updated Safety Characteristics

Additional safety surfaces now include:

- preview-before-merge workflow
- typed merge confirmation
- structured merge-risk explanation
- separated relationship inspection
- centralized comparison loading
- grouped staged-file recovery support

---

# Updated Known Gaps

Known gaps after this update:

- no request cancellation
- no invoke timeout handling
- no streaming explanation support
- no optimistic merge-state handling
- no backend capability discovery
- no invoke retry policy
- no LLM result validation
- no explanation caching
- no unified error normalization
- no batch invoke abstraction

---

# Verification Notes for 2026-05-16 Update

This update is based on full-file inspection of:

- `src/core/gitActions.ts`

The update specifically documents:

- branch relationship wrappers
- merge preview wrappers
- merge execution wrappers
- comparison wrappers
- merge-risk explanation wrappers
- staged-prefix recovery support

No undocumented behavior has been inferred beyond directly visible source logic.

# Status

active
