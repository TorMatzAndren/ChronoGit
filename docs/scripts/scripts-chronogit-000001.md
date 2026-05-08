Title: App.tsx
ID: scripts-chronogit-000001
Date: 2026-05-04
Author: Matz
Type: scripts
Subsystem: workspace-ui
Updated: 2026-05-08
Revision: 7

---

@role:ui
@subsystem:workspace-ui
@entity:script:chronogit-app/src/App.tsx
@entity:/chronogit-app/src/App.tsx
@entity:stylesheet:chronogit-app/src/App.css
@entity:asset:chronogit-app/src/assets/jarri-logo.png
@semantic:git-ui
@semantic:git-status-visualization
@semantic:workspace-panels
@semantic:repository-selection
@semantic:branch-awareness-ui
@semantic:branch-switch-confirmation
@semantic:git-branch-graph
@semantic:branch-topology
@semantic:commit-preflight
@semantic:remote-awareness-ui
@semantic:remote-preview-ui
@semantic:remote-safety-gate
@semantic:operation-state-ui
@semantic:auto-refresh
@semantic:system-log
@semantic:llm-log
@semantic:llm-streaming
@semantic:llm-explain-ui
@semantic:beginner-mode
@semantic:local-only
@state:active

# App.tsx

**Date:** 2026-05-04  
**Summary:** React root orchestration surface for ChronoGit. App.tsx owns top-level workspace state, repository selection, panel layout, auto-refresh, confirmation routing, branch overview/graph/switch requests, commit preflight state, remote preview execution flow, persistent system/LLM logs, local LLM streaming, and delegation to extracted panel/component modules.  
**Keywords:** chronogit app, react root, workspace panels, branch panel, branch graph, branch topology, git status, remote preview, commit preflight, persistent logs, local llm, tauri invoke  
**Tags:** scripts, ui, git, workspace-ui, tauri, panels, branch-workflow, branch-graph, branch-topology, logs, llm

Root frontend orchestration surface for ChronoGit.

---

## Purpose

`App.tsx` coordinates the ChronoGit user interface after the frontend split into extracted panels, components, core runtime helpers, persistence helpers, and Git action wrappers.

It is the current root React runtime coordinator for the application shell.

It owns:

- global application state
- persisted workspace layout state
- repository selection state
- branch overview state
- branch graph state
- Git status / remote / operation-state refresh
- confirmation modal routing
- commit preflight modal routing
- panel rendering and layout interaction
- local LLM streaming log integration
- persistent system and LLM logs
- top-level titlebar and workspace canvas

It does not own the internal rendering implementation for most panels. Those surfaces are delegated to extracted panel and component modules.

---

## Architectural Role

`App.tsx` acts as the frontend orchestration boundary between deterministic backend truth and projected UI surfaces.

It coordinates these ChronoGit layers:

- raw Git truth received from backend commands
- structured runtime types imported from `chronogitRuntimeTypes`
- workspace layout state imported from `chronogitWorkspaceTypes`
- panel projection surfaces
- mutation confirmation paths
- branch overview and branch graph refresh paths
- remote preview and execution paths
- local-only LLM advisory paths
- persistent local log surfaces

It is not the Git truth source. Git truth is retrieved from backend commands through Tauri invoke calls and through wrapper functions in `gitActions.ts`.

It is not the LLM truth source. LLM output is explicitly treated as advisory.

It is not the panel implementation layer. It dispatches to panels and passes state/actions into them.

---

## Core Responsibilities

### 1. Application State Ownership

Defines `AppState`:

- `activeTabId`
- `beginnerMode`
- `repoPath`
- `tabs`

Uses:

- `STORAGE_KEY = chronogit_workspace_state_v3`
- `OLD_STORAGE_KEY = chronogit_workspace_state_v2`
- `DEFAULT_REPO = /home/dretski/projects/ChronoGit`

`loadState()` reads persisted workspace state from localStorage.

It attempts current storage first, then old storage:

- `chronogit_workspace_state_v3`
- `chronogit_workspace_state_v2`

Loaded state is normalized through `normalizeState`.

`defaultState()` creates the default Home tab with panels:

- Current State
- Commit Preflight
- Change Lists
- Remote Actions
- Time Machine
- Local LLM

This makes `App.tsx` the current owner of workspace boot layout and persisted workspace shell state.

---

### 2. Top-Level Runtime State

Maintains runtime state for:

- Git version
- Git status data
- discovered repositories
- remote status
- branch overview
- branch graph
- interrupted Git operation state
- local LLM models
- selected LLM engine
- selected LLM model
- user-facing message
- persistent system log
- persistent LLM log
- selected panel type
- confirmation modal state
- confirmation text
- workspace tab rename state
- busy file path
- commit message
- snapshot preflight modal state
- commit preflight result
- remote preview result
- remote busy state
- armed upload preview key
- Time Machine refresh tick
- last action string

Uses refs for:

- auto-refresh reentrancy guard
- last known Git state signature

`uiExplainBusy` is currently initialized with `useState(false)` but only the value is retained. The setter is not used in this file, so the flag is state-shaped but not actively mutated.

---

### 3. Persistent Logs

Loads logs through:

- `loadSystemLog`
- `loadLlmLog`

Saves logs through:

- `saveSystemLog`
- `saveLlmLog`

System log entries are appended by `appendSystemLog`.

System log timestamp format is explicit numeric local time:

- `YYYY-MM-DD HH:MM:SS`

System log entries are deduplicated against the current newest message and capped to 120 entries.

LLM entries are appended by `appendLlmEntry`.

Normal appended LLM entries use explicit numeric local time:

- `YYYY-MM-DD HH:MM:SS`

Streaming LLM entries created through `beginLlmEntry` currently use `new Date().toLocaleTimeString()`.

LLM log entries are capped to 80 entries.

LLM and system log panels receive handlers for:

- clear log
- backup + clear
- open backup folder

Backup operations route through persistence helpers:

- `backupSystemLog`
- `backupLlmLog`
- `openLogBackupFolder`

---

### 4. Initial Load and Auto-Refresh

`initialLoad()` runs these startup operations through `Promise.allSettled`:

- `detectGit`
- `refresh`
- `loadRepos`
- `loadLocalModels`
- `loadBranchOverview`
- `loadBranchGraph`

Auto-refresh runs every 2500 ms.

Auto-refresh is blocked when any of these are active:

- current auto-refresh work
- busy file action
- remote operation
- open confirmation action
- open snapshot preflight modal

Auto-refresh reads backend truth through direct Tauri invokes:

- `git_status`
- `git_remote_status`
- `git_operation_state`

It creates a JSON signature from:

- status result
- remote result
- operation result

If the new signature differs from `lastKnownStateSignatureRef`, App.tsx updates:

- Git status data
- remote status
- operation state
- Time Machine refresh tick

It also appends a system log entry:

- `Auto-refresh detected repository changes.`

Auto-refresh failures are logged as warnings.

Important boundary:

- Auto-refresh currently does not directly reload `branchGraph`.
- Normal `refresh()` does reload branch overview and branch graph.
- Initial load also loads branch graph.

---

### 5. Git Status, Remote Status, Operation State, and Branch Graph

`refresh()` calls backend commands directly through Tauri invoke:

- `git_status`
- `git_remote_status`
- `git_operation_state`

It updates:

- `data`
- `remote`
- `operationState`
- branch overview through `loadBranchOverview`
- branch graph through `loadBranchGraph`
- last known state signature
- Time Machine refresh tick

Helper functions provide projected user-facing labels and explanations:

- `remoteLabel`
- `remoteHuman`
- `operationLabel`
- `hasInterruptedOperation`
- `snapshotRemoteSentence`

`remoteLabel()` classifies remote status as:

- `LOCAL ONLY`
- `DIVERGED`
- `AHEAD`
- `BEHIND`
- `IN SYNC`

`operationLabel()` classifies operation state as:

- `UNKNOWN`
- `CONFLICTS`
- `REBASE IN PROGRESS`
- `MERGE IN PROGRESS`
- `CHERRY-PICK IN PROGRESS`
- `REVERT IN PROGRESS`
- `CLEAR`

These labels are projection helpers. They do not replace backend truth.

---

### 6. Branch Awareness, Branch Graph, and Branch Switching

Maintains:

- `branchOverview`
- `branchGraph`

Loads branch overview truth through direct backend command:

- `git_branch_overview`

Loads branch graph truth through direct backend command:

- `git_branch_graph`

`loadBranchGraph()`:

- invokes `git_branch_graph`
- stores result in `branchGraph`
- clears graph to null on failure
- logs branch graph failures as warnings

Creates branches through direct backend command:

- `git_create_branch`

After branch creation, App.tsx reloads:

- branch overview
- branch graph

Requests guarded branch switching through:

- `requestSwitchBranch`

`requestSwitchBranch` does not immediately switch branches. It opens a confirmation modal explaining the mutation boundary.

The confirmation modal states that:

- the active branch pointer changes
- visible working files may change
- future commits will be created on the selected branch
- ChronoGit blocks the switch if the working tree is dirty

Actual branch switch command:

- `git_switch_branch`

After successful branch switch, App.tsx refreshes Git state and reloads:

- branch overview
- branch graph

Branch display/action/topology UI is delegated to:

- `BranchPanel`

---

### 7. Repository Discovery and Selection

Loads repository list through direct backend command:

- `discover_git_repos`

Repository selection is rendered by:

- `RepoDropdown`

Changing repository updates `state.repoPath` and calls:

- `refresh(repoPath)`

This makes repository selection a root-level application state concern.

---

### 8. Workspace Tab and Panel Layout

App.tsx currently owns workspace tab and panel mutation functions:

- `setRepoPath`
- `updateActiveTab`
- `addTab`
- `openRenameTab`
- `cancelRenameTab`
- `confirmRenameTab`
- `closeTab`
- `addPanel`
- `closePanel`
- `movePanel`
- `resizePanel`

Panel coordinates and sizes are snapped through:

- `snap`

New panels are created through:

- `makePanel`

Drag and resize handlers are implemented directly in App.tsx:

- `beginDrag`
- `beginResize`

Panel selection UI is delegated to:

- `PanelDropdown`

The workspace canvas is therefore still root-owned even though panel internals are extracted.

---

### 9. File Action Routing

File mutation requests route through:

- `executeFileAction`
- `runFileAction`

Runtime wrapper:

- `executeFileActionRuntime`

Supported actions from this file’s perspective:

- `git_stage`
- `git_unstage`
- `git_restore`
- `git_remove_untracked`
- `git_ignore_path`

Destructive or semi-destructive actions open confirmation first:

- `git_restore`
- `git_remove_untracked`

`git_restore` is described as discarding the local working-folder edit and restoring the last committed version.

`git_remove_untracked` is described as deleting an untracked file that Git cannot restore from history.

After successful action, App.tsx:

- updates user message
- updates last action
- appends a system log entry
- refreshes Git truth

File list UI is delegated to:

- `ChangeListsPanel`

---

### 10. Commit / Snapshot Preflight

Snapshot preflight opens through runtime wrapper:

- `openSnapshotPreflightRuntime`

Snapshot execution uses runtime wrapper:

- `confirmSnapshotRuntime`

App.tsx owns:

- `commitMessage`
- `showPreflight`
- `commitPreflight`
- `preflightWarnings`
- `hasCritical`
- `snapshotImpact`

Preflight warnings are computed from staged files with risk values:

- `danger`
- `critical`
- `evidence`

Critical state is computed from staged files with risk value:

- `critical`

Snapshot impact is classified by `classifySnapshotImpact`.

`classifySnapshotImpact()` can label a snapshot as:

- `Large snapshot`
- `Additive-heavy`
- `Deletion-heavy`

This classification is a frontend review aid based on preflight insertion/deletion counts. It is not raw Git truth.

Preflight rendering is delegated to:

- `SnapshotPreflightModal`

Commit boundary overview is delegated to:

- `CommitPreflightPanel`

---

### 11. Remote Preview and Remote Execution

Remote knowledge fetch uses runtime wrapper:

- `fetchRemoteKnowledgeRuntime`

Remote preview uses runtime wrapper:

- `loadRemotePreviewRuntime`

Remote push execution uses runtime wrapper:

- `executePushRuntime`

Remote pull/rebase execution uses runtime wrapper:

- `executePullRebaseRuntime`

Rebase abort uses runtime wrapper:

- `abortRebaseRuntime`

App.tsx owns:

- `remotePreview`
- `remoteBusy`
- `armedRemoteUploadKey`

It computes preview identity through:

- `remotePreviewKey`
- `isUploadPreviewArmed`

Remote execution confirmation token comes from:

- `guardedRemoteToken`

`guardedRemoteToken()` returns:

- `override` when preview merge safety risk level is `HIGH`
- `confirm` otherwise

This makes App.tsx part of the remote safety-gating path, while the actual backend mutation is delegated through runtime wrappers and backend commands.

Remote UI is delegated to:

- `RemoteActionsPanel`
- `RemoteStatusPanel`

---

### 12. Operation-State Banner

If `hasInterruptedOperation(operationState)` is true, App.tsx renders an operation-state banner.

The banner shows:

- operation label
- backend warning text
- conflicted files
- abort rebase button when rebase is in progress

Abort action routes through:

- `abortRebase`

`abortRebase()` uses:

- `abortRebaseRuntime`

After successful abort, App.tsx clears remote preview state, clears armed upload state, updates message/last action, logs the action, and refreshes Git truth.

---

### 13. Local LLM and Streaming Explanations

Loads local models through direct backend command:

- `list_local_llm_models`

Maintains:

- `llmEngine`
- `llmModel`
- `localModels`

LLM explanation flow is coordinated through:

- `explainUiContext`
- `streamLlmEntry`
- `beginLlmEntry`
- `appendLlmChunk`
- `finishLlmEntry`
- `toggleLlmEntry`

Streaming listens to event channel:

- `chronogit://llm-stream`

Streaming command:

- `explain_prompt_with_ollama_stream`

The prompt built by `explainUiContext` instructs the local model to:

- act as ChronoGit
- return only the final explanation
- avoid thinking/prelude/self-talk
- explain supplied UI context for a beginner while preserving technical detail
- avoid inventing context beyond supplied UI context and raw truth
- say `not visible in this context` when information is absent
- treat ChronoGit as local-only
- treat Git truth and deterministic UI state as authoritative
- treat LLM explanation as advisory

LLM UI is delegated to:

- `LocalLlmPanel`
- `LlmLogPanel`

---

### 14. Panel Rendering Dispatcher

`renderPanel(panel)` dispatches by `panel.type`.

Handled panel types:

- `current-state`
- `remote-status`
- `commit-preflight`
- `change-lists`
- `branches`
- `remote-actions`
- `time-machine`
- `local-llm`
- `system-log`
- `llm-log`
- `repository`
- `git-status`
- `notes`
- fallback empty panel

Delegated active panels:

- `CurrentStatePanel`
- `RemoteStatusPanel`
- `CommitPreflightPanel`
- `ChangeListsPanel`
- `BranchPanel`
- `RemoteActionsPanel`
- `TimeMachinePanel`
- `LocalLlmPanel`
- `SystemLogPanel`
- `LlmLogPanel`
- `NotesPanel`

The `branches` panel receives:

- `branchOverview`
- `branchGraph`
- branch refresh callback
- branch creation callback
- guarded branch switch callback

The `repository` and `git-status` panel types currently render placeholder text:

- `This truth now lives in the title bar.`

This indicates that those former panel truth surfaces have been moved to the titlebar projection.

---

### 15. Titlebar and Workspace Canvas

Renders product titlebar with:

- Jarri logo
- product name
- doctrine text: `Git is truth · panels are projections.`
- repository selector
- Git version
- branch
- working/prepared change counts
- remote label
- ahead/behind counts
- scan repositories button
- refresh Git state button
- Beginner Mode toggle

Renders:

- workspace tabs
- tab rename affordance
- tab close affordance
- add tab button
- panel dropdown
- add panel button
- draggable panel canvas
- resize handles

The titlebar is a compact truth strip. The panel canvas is a projection workspace.

---

## Inputs

App.tsx receives backend truth and backend action results through two paths:

1. Direct Tauri invoke calls from App.tsx.
2. Runtime wrapper functions imported from `core/gitActions.ts`.

Direct backend commands invoked in App.tsx:

- `detect_git`
- `discover_git_repos`
- `git_status`
- `git_remote_status`
- `git_operation_state`
- `git_branch_overview`
- `git_branch_graph`
- `git_create_branch`
- `git_switch_branch`
- `list_local_llm_models`
- `explain_prompt_with_ollama_stream`

Backend-backed actions used indirectly through `gitActions.ts` wrappers:

- file actions
- snapshot preflight
- snapshot commit
- remote fetch
- remote preview
- remote push execution
- remote pull/rebase execution
- rebase abort

The specific backend command names for wrapper-owned actions are not invoked directly in this file and must be documented from `core/gitActions.ts` and backend source truth, not inferred from App.tsx alone.

---

## Outputs / Delegated Surfaces

Delegates visual rendering to:

- `RepoDropdown`
- `PanelDropdown`
- `SnapshotPreflightModal`
- `ConfirmModal`
- `CurrentStatePanel`
- `CommitPreflightPanel`
- `ChangeListsPanel`
- `RemoteStatusPanel`
- `RemoteActionsPanel`
- `BranchPanel`
- `TimeMachinePanel`
- `LocalLlmPanel`
- `SystemLogPanel`
- `LlmLogPanel`
- `NotesPanel`

Delegates persistence to:

- `persistence.ts`

Delegates layout helpers to:

- `workspaceLayout.ts`

Delegates Git action wrappers to:

- `gitActions.ts`

Delegates branch topology construction indirectly through:

- `BranchPanel`
- `branchTopology.ts`

---

## Truth, Projection, Mutation, and Advisory Boundaries

### Authoritative Truth Surfaces

App.tsx treats backend Git command results as authoritative frontend truth inputs:

- Git status
- remote status
- operation state
- branch overview
- branch graph
- repository discovery
- local model discovery

The frontend displays these results but does not become the source of Git truth.

### Projection Systems

Projection systems in this file include:

- remote labels
- remote human explanations
- operation labels
- snapshot remote sentences
- titlebar truth strip
- panel rendering dispatcher
- workspace canvas
- branch graph dispatch into BranchPanel

These are frontend projections derived from structured truth.

Branch topology itself is delegated to `branchTopology.ts` and rendered by `BranchPanel.tsx`.

### Mutation Systems

Mutation paths routed by this file include:

- file staging/unstaging/restoring/removal/ignore actions
- snapshot creation
- branch creation
- branch switching
- remote fetch
- remote push
- pull/rebase
- rebase abort

Risk-sensitive mutation paths are guarded through confirmation modals or remote preview arming.

### Preview Systems

Preview systems coordinated by this file include:

- snapshot preflight
- remote operation preview
- snapshot impact classification

Preview systems are review aids before mutation.

### Cognition Systems

Cognition/advisory systems coordinated by this file include:

- local LLM UI explanation
- LLM response log
- stream-based LLM output handling
- frontend snapshot impact classification
- remote guarded token selection based on preview risk level

LLM cognition is explicitly advisory and local-only.

### Rendering Systems

Rendering systems delegated by this file include all extracted panel components and modal components.

App.tsx remains the dispatcher and state provider.

### Safety Systems

Safety systems in this file include:

- destructive file action confirmation
- branch switch confirmation
- remote preview arming
- high-risk remote override token selection
- auto-refresh pause during modal/risky operation states
- operation-state interruption banner
- rebase abort surface
- snapshot preflight review
- critical/evidence/danger staged-file warning extraction

---

## Role in ChronoGit System

Acts as:

- root React runtime coordinator
- Git state refresh coordinator
- branch overview refresh coordinator
- branch graph refresh coordinator
- workspace layout owner
- panel dispatcher
- confirmation router
- branch workflow coordinator
- remote operation coordinator
- local LLM streaming coordinator
- persistent log coordinator
- titlebar truth strip renderer
- frontend safety gate coordinator

It no longer acts as the sole implementation site for all panels.

---

## Design Principles Verified from Source

- Git truth is fetched from backend commands.
- UI panels are projections of deterministic state.
- Branch graph truth is fetched from backend command `git_branch_graph`.
- Branch topology rendering is delegated to BranchPanel and branchTopology.
- Risky mutations are confirmed.
- Destructive file actions are not performed directly without confirmation.
- Local LLM output is advisory.
- Logs persist unless user clears them.
- Branch switch consequences are explained before execution.
- Auto-refresh is paused during modal/risky operations.
- Beginner mode changes language, not Git behavior.
- Remote operations are previewed and guarded before execution.
- Interrupted Git operations are surfaced in a dedicated banner.

---

## Supporting Files

### App.css

`chronogit-app/src/App.css` provides the visual styling used by this root surface and extracted panels.

### jarri-logo.png

`chronogit-app/src/assets/jarri-logo.png` is imported for the ChronoGit titlebar brand.

### branchTopology.ts

`chronogit-app/src/core/branchTopology.ts` transforms backend branch graph truth into branch topology projection data consumed by `BranchPanel.tsx`.

---

## Current Known Gaps

- Some workspace mutation helpers still live inside App.tsx despite layout/state helpers existing elsewhere.
- Branch switching currently routes through BranchPanel rather than a titlebar branch selector.
- `beginLlmEntry` uses `toLocaleTimeString()` while normal appended LLM entries use explicit `YYYY-MM-DD HH:MM:SS`.
- `repository` and `git-status` panel types render placeholder text because their truth moved to the titlebar.
- App.tsx still owns draggable panel mechanics directly.
- Time Machine behavior is delegated, but App.tsx still owns refresh tick coordination.
- `uiExplainBusy` is initialized as state but is not actively mutated in this file.
- Auto-refresh does not directly reload branch graph when repository signatures change; normal refresh and branch refresh do.
- Wrapper-owned backend command names must be documented from `gitActions.ts` and backend source, not from App.tsx assumptions.

---

## Verification Notes

This document is based on full-file inspection of the supplied `src/App.tsx` source.

This revision adds documentation for branch graph orchestration:

- `BranchGraph` import
- `branchGraph` state
- `loadBranchGraph`
- `git_branch_graph` direct invoke
- branch graph refresh after branch creation and branch switching
- branch graph delegation into `BranchPanel`

The document intentionally distinguishes:

- direct backend invokes visible in App.tsx
- backend-backed runtime wrapper calls imported from `core/gitActions.ts`
- frontend projection helpers
- mutation routing
- preview routing
- local LLM advisory routing
- branch graph orchestration
- delegated panel rendering

Behavior not visible in App.tsx is not treated as proven here.

---

## Status

active
