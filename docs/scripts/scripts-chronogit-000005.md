Title: chronogitRuntimeTypes.ts
ID: scripts-chronogit-000005
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: workspace-ui
Updated: 2026-05-16
Revision: 3

---

@role:type-system
@subsystem:workspace-ui
@entity:script:chronogit-app/src/core/chronogitRuntimeTypes.ts
@entity:/chronogit-app/src/core/chronogitRuntimeTypes.ts
@semantic:runtime-types
@semantic:backend-frontend-contract
@semantic:git-status
@semantic:git-remote-awareness
@semantic:git-operation-state
@semantic:git-mutation
@semantic:git-branching
@semantic:git-branch-graph
@semantic:branch-topology
@semantic:branch-relationship
@semantic:branch-merge-preview
@semantic:branch-merge-execution
@semantic:commit-preflight
@semantic:git-temporal
@semantic:file-lineage
@semantic:commit-comparison
@semantic:merge-safety-prediction
@semantic:llm-local
@semantic:llm-streaming
@semantic:system-log
@semantic:llm-log
@semantic:confirmation-flow
@semantic:type-contract
@state:active

# chronogitRuntimeTypes.ts

**Date:** 2026-05-07  
**Summary:** Core frontend runtime type contract definitions for ChronoGit. Defines TypeScript structures for backend Git responses, branch relationship and merge cognition, remote state, branch state, branch graph state, Time Machine history/diff/lineage data, commit/preflight results, LLM streaming and explanation data, confirmation actions, and persistent system/LLM logs.  
**Keywords:** runtime types, backend frontend contract, git status, remote preview, branch overview, branch graph, branch topology, file lineage, time machine, llm streaming, system log, confirmation action  
**Tags:** scripts, types, workspace-ui, git, backend-contract, runtime-state, branch-graph, branch-topology, llm, logs

Core frontend runtime type contract definitions for ChronoGit.

---

## Purpose

`chronogitRuntimeTypes.ts` defines the TypeScript runtime data contracts used by the ChronoGit frontend.

It describes structured data exchanged between:

- Tauri backend commands
- React root orchestration
- panel components
- modal components
- log systems
- LLM explanation systems
- Time Machine systems
- branch topology systems

This file does not execute logic.

It establishes shared structural truth for frontend runtime data.

---

## Architectural Role

This file is the frontend runtime contract surface for ChronoGit.

It mirrors and consumes backend-shaped data returned from `src-tauri/src/lib.rs`.

It is part of the structured layer:

Raw backend output → typed frontend runtime model → panel projection.

It is not a truth extractor.

It is not a mutation system.

It is not a rendering system.

It defines the shapes that other systems rely on.

---

## Repository Types

### RepoInfo

Defines discovered repository metadata:

- `path`
- `name`
- `root`

Used for repository discovery and repository selection surfaces.

---

## Git Status Types

### GitStatusResponse

Defines current Git status response:

- `branch`
- `staged`
- `working`

### FileChange

Defines a changed file entry:

- `path`
- `index_status`
- `worktree_status`
- `status`
- `risk`
- `staged`
- `explanation`

`index_status` and `worktree_status` are optional in the frontend contract.

This allows the frontend to tolerate FileChange-like structures that may not include raw status columns.

---

## Git Operation-State Types

### GitOperationState

Defines interrupted operation state:

- `rebase_in_progress`
- `merge_in_progress`
- `cherry_pick_in_progress`
- `revert_in_progress`
- `conflicted_files`
- `warning`

Used to surface rebase, merge, cherry-pick, revert, and conflict conditions.

---

## LLM Streaming Types

### LlmStreamEvent

Defines streamed local LLM event chunks:

- `stream_id`
- `chunk`
- `done`
- `error`

This corresponds to the Tauri event stream used by ChronoGit’s local LLM explanation flow.

---

## Commit Preflight Types

### CommitPreflight

Defines pre-commit/snapshot review data:

- `staged_files`
- `insertions`
- `deletions`
- `is_empty`

Used before creating a snapshot/commit.

---

## Explanation Context Types

### ExplainContext

Defines UI/context explanation input:

- `kind`
- `title`
- `plainText`
- `rawTruth`

This type supports advisory LLM explanations by explicitly separating visible UI text from raw deterministic truth.

---

## Time Machine History Types

### HistoryCommit

Defines commit history entries:

- `hash`
- `short_hash`
- `author`
- `timestamp`
- `message`

### ChangedFile

Defines changed file metadata:

- `path`
- `status`

### DiffResult

Defines a single file diff result:

- `commit_hash`
- `path`
- `diff`

These types support ChronoGit Time Machine history and diff inspection.

---

## File History and Lineage Types

### FileHistoryEntry

Defines a single file history event:

- `hash`
- `short_hash`
- `author`
- `timestamp`
- `message`
- `status`
- `path`

### FileRenameEvent

Defines a detected rename event:

- `hash`
- `old_path`
- `new_path`

### FileLineage

Defines file lineage summary:

- `path`
- `commits`
- `first_commit`
- `last_commit`
- `renamed`
- `deleted`
- `rename_events`

`first_commit` and `last_commit` may be `null`.

This supports lineage-aware Time Machine inspection.

---

## Commit Comparison Types

### CommitComparison

Defines A ↔ B comparison data:

- `left_commit`
- `right_commit`
- `left_label`
- `right_label`
- `changed_files`
- `insertions`
- `deletions`
- `diff`

This type supports deterministic comparison between two selected snapshots.

---

## LLM Explanation Result Types

### ExplainDiffResult

Defines local LLM explanation output:

- `model`
- `explanation`
- `tdp_before_watts`
- `tdp_active_watts`
- `tdp_reset_watts`

The TDP fields are present in both streaming and non-streaming explanation result shapes, although streaming paths may use status strings rather than numeric GPU power values.

---

## Commit Result Types

### CommitResult

Defines commit/snapshot result:

- `ok`
- `message`
- `commit_hash`

Used for normal commit creation and amended snapshot message results.

---

## Local Model Types

### LocalModel

Defines local LLM model metadata:

- `name`
- `engine`
- `size`
- `modified_at`
- `family`
- `parameter_size`
- `quantization_level`

`modified_at` is optional in the frontend contract.

---

## Remote Awareness Types

### GitRemoteStatus

Defines remote tracking state:

- `repo_path`
- `branch`
- `upstream`
- `remote`
- `remote_url`
- `ahead`
- `behind`
- `has_remote`
- `is_diverged`
- `is_clean`

Optional fields:

- `repo_path`
- `remote`
- `is_clean`

Nullable fields:

- `upstream`
- `remote`
- `remote_url`

This type supports remote-state projection and local/shared boundary awareness.

---

## Remote Execution Result Types

### RemotePullResult

Defines pull/rebase result:

- `ok`
- `message`
- `stdout`
- `stderr`

### RemotePushResult

Defines push result:

- `ok`
- `message`
- `stdout`
- `stderr`

These types preserve stdout/stderr for frontend review and logging.

---

## Merge Safety Prediction Types

### MergeSafetyPrediction

Defines advisory remote merge prediction:

- `classification`
- `risk_level`
- `summary`
- `local_touched_files`
- `remote_touched_files`
- `local_files`
- `remote_files`
- `shared_files`
- `working_changes`
- `warning`

This type represents predictive analysis, not authoritative Git merge truth.

---

## Remote Operation Preview Types

### RemoteOperationPreview

Defines remote push/pull preview data:

- `operation`
- `repo_path`
- `branch`
- `upstream`
- `remote`
- `ahead`
- `behind`
- `commit_count`
- `commits`
- `changed_files`
- `consequence`
- `warning`
- `merge_safety`

Used before executing remote mutations.

---

## Confirmation Flow Types

### ConfirmAction

Defines modal-routed confirmation actions:

- `title`
- `body`
- `confirmLabel`
- `danger`
- `action`
- `requiredText`
- `requiredTextLabel`

`action` is an async frontend callback.

`requiredText` and `requiredTextLabel` are optional and support stronger confirmation flows.

---

## Log Types

### SystemLogEntry

Defines persistent system log entries:

- `id`
- `date`
- `time`
- `level`
- `message`

Allowed system log levels:

- `info`
- `warning`
- `error`
- `action`

### LlmLogEntry

Defines persistent LLM log entries:

- `id`
- `timestamp`
- `source`
- `model`
- `title`
- `content`
- `streaming`
- `collapsed`

Allowed LLM log sources:

- `diff`
- `ui`
- `remote`
- `preflight`
- `system_log`

Optional fields:

- `streaming`
- `collapsed`

---

## Branch Overview Types

### BranchInfo

Defines branch metadata:

- `name`
- `full_name`
- `short_hash`
- `upstream`
- `ahead`
- `behind`
- `is_current`
- `is_remote`
- `is_detached`

### BranchOverview

Defines total branch overview state:

- `current_branch`
- `detached_head`
- `local_branches`
- `remote_branches`

These types support ChronoGit branch awareness and branch switching UI.

---

## Branch Graph Types

### BranchGraphCommit

Defines branch graph commit metadata:

- `hash`
- `short_hash`
- `parents`
- `refs`
- `author`
- `date`
- `subject`
- `is_head`

This structure represents commit graph data returned by the backend `git_branch_graph` command.

`parents` stores full parent commit hashes.

`refs` stores visible ref labels attached to the commit.

`is_head` marks the commit currently pointed at by HEAD.

---

### BranchGraphRef

Defines branch graph ref metadata:

- `name`
- `full_name`
- `kind`
- `target_short_hash`

Allowed `kind` values:

- `local`
- `remote`
- `tag`
- `other`

`target_short_hash` links the ref to the short hash of the commit it points at.

This type supports deterministic branch-topology lane construction in `branchTopology.ts`.

---

### BranchGraph

Defines total branch graph payload:

- `commits`
- `refs`

`commits` contains the bounded commit window used by the branch topology projection.

`refs` contains local, remote, tag, and other refs visible to the backend command.

This type supports branch graph rendering in `BranchPanel.tsx` and topology transformation in `branchTopology.ts`.

---

## Inputs

This file has no runtime inputs.

It defines exported TypeScript type contracts.

---

## Outputs

Exports runtime contracts:

- `RepoInfo`
- `GitStatusResponse`
- `GitOperationState`
- `LlmStreamEvent`
- `FileChange`
- `CommitPreflight`
- `ExplainContext`
- `HistoryCommit`
- `FileHistoryEntry`
- `FileRenameEvent`
- `FileLineage`
- `ChangedFile`
- `DiffResult`
- `CommitComparison`
- `ExplainDiffResult`
- `CommitResult`
- `LocalModel`
- `GitRemoteStatus`
- `RemotePullResult`
- `RemotePushResult`
- `MergeSafetyPrediction`
- `RemoteOperationPreview`
- `ConfirmAction`
- `SystemLogEntry`
- `LlmLogEntry`
- `BranchInfo`
- `BranchOverview`
- `BranchGraphCommit`
- `BranchGraphRef`
- `BranchGraph`

---

## Truth, Projection, Mutation, and Advisory Boundaries

### Truth Surfaces

This file defines frontend structural contracts for backend truth.

It does not create truth by itself.

### Projection Systems

These types support projected panels and modals by enforcing consistent data shape.

Branch graph types support an additional projection layer:

Backend branch graph payload → frontend runtime contract → branch topology transformation → branch panel graph rendering.

### Mutation Systems

No mutation logic exists in this file.

Mutation callbacks are represented structurally through `ConfirmAction`.

### Preview Systems

Preview structures include:

- `CommitPreflight`
- `RemoteOperationPreview`
- `MergeSafetyPrediction`

### Cognition Systems

Cognition/advisory structures include:

- `ExplainContext`
- `ExplainDiffResult`
- `LlmStreamEvent`
- `LlmLogEntry`

### Rendering Systems

Panel rendering systems consume these types, but this file performs no rendering.

### Safety Systems

Safety-related structures include:

- `ConfirmAction`
- `GitOperationState`
- `MergeSafetyPrediction`
- `RemoteOperationPreview`
- `FileChange.risk`

This file defines safety data shape but does not enforce safety behavior.

---

## Backend/Frontend Contract Notes

Many structures correspond directly to Rust structs in:

- `src-tauri/src/lib.rs`

Important differences visible in this frontend contract:

- some frontend fields are optional even when backend structs return them
- nullable frontend fields are represented as `string | null`
- Rust `Option<String>` maps into TypeScript nullable fields
- numeric Rust counts map into TypeScript `number`
- Rust `Vec<T>` maps into TypeScript arrays
- frontend confirmation callbacks are frontend-only and do not exist in backend Rust structs

Branch graph type contracts correspond to backend structs:

- `BranchGraphCommit`
- `BranchGraphRef`
- `BranchGraph`

These are consumed by:

- `App.tsx`
- `BranchPanel.tsx`
- `branchTopology.ts`

This file should be kept synchronized with backend serialized response shapes.

---

## Design Characteristics

The runtime model is:

- explicit
- typed
- backend-shaped
- panel-consumable
- local-first
- Git-centered
- LLM-advisory aware
- preview-aware
- safety-state aware
- branch-graph aware
- branch-topology compatible

---

## Dependencies

No imports.

Pure TypeScript type-definition file.

---

## Current Known Gaps

- Some frontend fields are optional even when backend currently returns them.
- String classifications such as `risk`, `status`, `classification`, `risk_level`, and `operation` are not narrowed into stricter unions.
- `ExplainContext.kind` is a generic string instead of a strict source union.
- `GitRemoteStatus.remote` is both optional and nullable.
- `GitRemoteStatus.is_clean` is optional even though backend currently returns it.
- `SystemLogEntry` contains both `date` and `time`, while current logging may place the full timestamp in `date` and leave `time` empty.
- `BranchGraphRef.kind` is narrowed, but many other Git classifications remain string-based.
- `BranchGraphCommit.refs` stores string labels while rendered ref pills consume richer `BranchGraphRef` entries through topology mapping.
- No runtime validators exist here.
- No schema version is defined for these runtime contracts.

---

## Verification Notes

This document is based on full-file inspection of:

- `src/core/chronogitRuntimeTypes.ts`

This revision adds documentation for newly present branch graph runtime contracts:

- `BranchGraphCommit`
- `BranchGraphRef`
- `BranchGraph`

No behavior outside directly verified source has been documented.

---


---

## 2026-05-16 Update: Branch Relationship and Merge Cognition Types

This update documents the branch relationship and merge-preview runtime contracts added after the original branch graph expansion.

The runtime type layer now supports:

- branch relationship inspection
- merge-readiness preview
- guarded merge execution
- merge-risk cognition
- merge workflow orchestration

These contracts are primarily consumed by:

- `BranchPanel.tsx`
- `gitActions.ts`
- `App.tsx`

and originate from backend Rust structures in:

- `src-tauri/src/lib.rs`

---

## Branch Relationship Types

### BranchRelationshipPreview

Defines deterministic branch-to-branch comparison truth.

Fields:

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

Represents deterministic branch relationship truth generated by backend comparison logic.

This type supports:

- branch relationship inspector UI
- merge readiness reasoning
- merge blocker explanation
- merge-risk LLM workflows

---

## shared_touched_files

Purpose:

Represents files modified by both timelines.

Important boundary:

Shared touched files do not guarantee merge conflicts.

They identify overlap requiring human review.

---

## can_fast_forward_left / can_fast_forward_right

Purpose:

Represent directional fast-forward capability.

These booleans are used to classify relationships such as:

- `FAST_FORWARD_LEFT`
- `FAST_FORWARD_RIGHT`

---

## classification

Type:

    string

Current backend values include:

- `IDENTICAL`
- `FAST_FORWARD_LEFT`
- `FAST_FORWARD_RIGHT`
- `DIVERGED_SHARED_PATHS`
- `DIVERGED_CLEAN_PATHS`
- `HIGH_RISK`

The field remains string-based rather than a strict TypeScript union.

---

## risk_level

Type:

    string

Current backend values include:

- `LOW`
- `MEDIUM`
- `HIGH`

Represents advisory merge/relationship risk.

---

# Branch Merge Preview Types

### BranchMergePreview

Defines merge-readiness preview truth before merge execution.

Fields:

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

Supports preview-before-mutation merge workflows.

This type is consumed heavily by:

- `BranchPanel.tsx`

---

## relationship

Type:

    BranchRelationshipPreview

Purpose:

Embeds complete branch relationship truth directly inside merge preview state.

This prevents frontend duplication of relationship analysis logic.

---

## mode

Type:

    string

Current backend values include:

- `ALREADY_UP_TO_DATE`
- `FAST_FORWARD`
- `NORMAL_MERGE`
- `RISKY_MERGE`

The mode is advisory merge classification, not raw Git output.

---

## allowed

Type:

    boolean

Purpose:

Indicates whether the backend currently allows merge execution.

False cases include:

- dirty working tree
- active merge/rebase/cherry-pick/revert
- already-up-to-date merge target

---

## required_confirmation

Type:

    string

Purpose:

Defines exact confirmation text required before merge execution.

Current backend values include:

- `merge`
- `override`

This creates a typed safety boundary between preview and execution.

---

## blockers

Type:

    string[]

Purpose:

Lists backend-detected reasons the merge is currently blocked.

Examples include:

- active merge operation
- active rebase
- conflicted files
- local uncommitted work

---

# Branch Merge Execution Types

### BranchMergeResult

Defines structured merge execution results.

Fields:

- `ok`
- `message`
- `stdout`
- `stderr`

Purpose:

Preserves backend merge output for frontend review and logging.

This mirrors existing remote pull/push result structure philosophy.

---

# Updated Outputs

Additional exported runtime contracts now include:

- `BranchMergePreview`
- `BranchMergeResult`
- `BranchRelationshipPreview`

---

# Updated Architectural Role

This runtime contract layer now supports:

- branch topology
- branch relationship cognition
- merge-readiness cognition
- guarded merge workflows
- merge-risk explanation systems

in addition to earlier branch graph visualization responsibilities.

---

# Updated Backend/Frontend Contract Notes

The newly added branch relationship and merge types correspond directly to backend Rust structs in:

- `src-tauri/src/lib.rs`

These contracts are consumed through:

- `gitActions.ts`
- `BranchPanel.tsx`
- `App.tsx`

The relationship/merge workflow now follows:

Rust backend truth
→ TypeScript runtime contracts
→ frontend action wrappers
→ branch cognition projection
→ merge workflow rendering

---

# Updated Design Characteristics

The runtime model is now additionally:

- branch-relationship aware
- merge-cognition aware
- merge-preview aware
- merge-confirmation aware
- branch-workflow aware

---

# Updated Known Gaps

Additional known gaps after this update:

- `classification`, `risk_level`, and `mode` remain free-form strings instead of narrowed unions.
- No schema versioning exists for relationship or merge-preview contracts.
- `BranchRelationshipPreview` stores commit identifiers as plain strings rather than richer commit objects.
- No dedicated frontend enum exists for merge blocker types.
- No explicit version boundary exists between backend merge preview semantics and frontend interpretation logic.
- No runtime validation layer ensures backend/frontend merge-contract synchronization.

---

# Verification Notes for 2026-05-16 Update

This update is based on full-file inspection of:

- `src/core/chronogitRuntimeTypes.ts`

The update specifically documents newly present runtime contracts:

- `BranchRelationshipPreview`
- `BranchMergePreview`
- `BranchMergeResult`

No undocumented behavior has been inferred beyond directly visible source logic.

## Status

active
