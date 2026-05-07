Title: TimelinePanel.tsx
ID: scripts-chronogit-000035
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: time-machine
Updated: 2026-05-07
Revision: 1

---

@role:ui-panel
@subsystem:time-machine
@entity:script:chronogit-app/src/panels/TimelinePanel.tsx
@entity:/chronogit-app/src/panels/TimelinePanel.tsx
@semantic:time-machine
@semantic:git-history
@semantic:commit-inspection
@semantic:file-diff
@semantic:commit-comparison
@semantic:focus-mode
@semantic:line-selection
@semantic:llm-diff-explanation
@semantic:file-restore
@semantic:confirmation-flow
@semantic:clipboard-export
@semantic:educational-ui
@state:active

# TimelinePanel.tsx

**Date:** 2026-05-07
**Summary:** Legacy Time Machine panel for ChronoGit. Provides Git history loading, commit selection, changed-file inspection, file diff rendering, A ↔ B commit comparison, focus projection, selectable diff hunk lines, local LLM explanation requests, clipboard export, and guarded restore of a selected file from an older snapshot.
**Keywords:** time machine, git history, commit timeline, file diff, A/B comparison, selected hunk lines, local LLM, restore file
**Tags:** scripts, frontend, react, git, timeline, diff, comparison, llm, restore

Legacy Git timeline and diff-inspection panel for ChronoGit.

---

## Purpose

`TimelinePanel.tsx` provides a full Time Machine-style Git history inspection surface.

Responsibilities include:

- loading commit history
- selecting commits/snapshots
- loading changed files for a selected commit
- loading file diffs for selected files
- rendering pretty diff output
- selecting complete diff hunks by line click
- copying selected diff lines
- explaining selected diff lines through local LLM
- explaining full file diffs through local LLM
- selecting A and B commits for comparison
- explaining A ↔ B comparison diffs through local LLM
- restoring a selected file from an older snapshot through confirmation flow

This panel is a combined historical inspection, diff rendering, local LLM explanation, comparison, and restore surface.

---

# Architectural Role

This file belongs to ChronoGit’s Time Machine and Git cognition layer.

It combines several responsibilities that are later split elsewhere in the architecture:

- history projection
- diff projection
- focus projection
- A/B comparison
- LLM explanation dispatch
- line/hunk selection
- file restore confirmation
- direct Tauri invoke calls

This file is therefore an important legacy/large panel surface and should be treated carefully during future modularization.

---

# Imported Dependencies

Imports React hooks:

- `useEffect`
- `useState`

Imports Tauri invoke:

- `invoke`

from:

    @tauri-apps/api/core

---

# Local Runtime Types

This file defines local copies of runtime structures instead of importing them from `chronogitRuntimeTypes.ts`.

Defined local types:

- `HistoryCommit`
- `ChangedFile`
- `DiffResult`
- `CommitComparison`
- `FocusProjection`
- `ExplainDiffResult`
- `ConfirmAction`
- `LlmLogEntry`

---

# Local Type Duplication

The file duplicates several structures that exist elsewhere in ChronoGit runtime typing.

This is architecturally important because it means `TimelinePanel.tsx` is not fully aligned with the central runtime type contract.

Future canonicalization should prefer shared runtime types.

---

# HistoryCommit Type

Fields:

- `hash`
- `short_hash`
- `author`
- `timestamp`
- `message`

Purpose:

Represents one Git commit in the timeline list.

---

# ChangedFile Type

Fields:

- `path`
- `status`

Purpose:

Represents one file changed by a commit or comparison.

---

# DiffResult Type

Fields:

- `commit_hash`
- `diff`

Important detail:

This local type omits the `path` field that exists in the backend/runtime `DiffResult` shape.

The component only reads `diff`.

---

# CommitComparison Type

Fields:

- `left_commit`
- `right_commit`
- `left_label`
- `right_label`
- `changed_files`
- `insertions`
- `deletions`
- `diff`

Purpose:

Represents A ↔ B commit comparison result.

---

# FocusProjection Type

Union variants:

- `{ kind: "none" }`
- `{ kind: "commit"; commit }`
- `{ kind: "file"; commit; file }`
- `{ kind: "comparison"; comparison }`

Purpose:

Controls the Focus Mode surface.

This is a projection state describing what the user is currently inspecting.

---

# ExplainDiffResult Type

Fields:

- `model`
- `explanation`
- `tdp_before_watts`
- `tdp_active_watts`
- `tdp_reset_watts`

Purpose:

Represents local LLM explanation result plus GPU power-limit telemetry fields.

---

# ConfirmAction Type

Fields:

- `title`
- `body`
- `confirmLabel`
- `danger`
- `action`
- `requiredText`
- `requiredTextLabel`

Purpose:

Local confirmation-action structure used for guarded restore workflow.

---

# LlmLogEntry Type

Fields:

- `id`
- `timestamp`
- `source`
- `model`
- `title`
- `content`

Important detail:

The local `source` union includes:

- `diff`
- `ui`
- `remote`
- `preflight`

It does not include `system_log`, which exists in the newer central runtime type.

---

# Local diffLineClass Helper

This file locally defines:

    diffLineClass(line)

Purpose:

Classifies diff lines into CSS classes.

Classification rules:

- `+++` or `---` → file metadata
- `@@` → hunk header
- `+` → added line
- `-` → removed line
- `diff --git` → diff header
- fallback → neutral diff line

This duplicates logic now also present in `src/lib/diffUtils.ts`.

---

# Local renderPrettyDiff Helper

This file locally defines:

    renderPrettyDiff(diff, selectedLines, onToggleLine)

Purpose:

Renders interactive pretty diff output.

Responsibilities:

- empty diff fallback
- newline normalization
- line splitting
- line numbering
- CSS classification
- selected-line styling
- optional line click selection

This overlaps with `src/components/DiffViewer.tsx`, but this local version supports optional selection and adds selectable-line styling/title behavior.

---

# Props Contract

`TimelinePanel` receives:

- `repoPath`
- `refreshTick`
- `setConfirmAction`
- `llmEngine`
- `llmModel`
- `appendLlmEntry`
- `beginnerMode`

---

## repoPath

Type:

    string

Purpose:

Repository path passed to backend Git commands.

---

## refreshTick

Type:

    number

Purpose:

External refresh trigger.

When it changes, history reloads.

---

## setConfirmAction

Type:

    (action: ConfirmAction | null) => void

Purpose:

Routes dangerous restore workflow through shared confirmation modal.

---

## llmEngine

Type:

    string

Purpose:

Displayed in file-diff explanation status text.

This component does not use it to select backend command.

---

## llmModel

Type:

    string

Purpose:

Selected local LLM model passed to backend explanation commands.

---

## appendLlmEntry

Type:

    (entry: Omit<LlmLogEntry, "id" | "timestamp">) => void

Purpose:

Adds local LLM explanation outputs to higher-level LLM log state.

---

## beginnerMode

Type:

    boolean

Purpose:

Controls beginner/pro terminology through local `focusTerm`.

---

# Internal State

State fields:

- `history`
- `selected`
- `changedFiles`
- `selectedFile`
- `diff`
- `compareBase`
- `comparison`
- `focusProjection`
- `selectedDiffLines`
- `explainText`
- `explainStatus`
- `explainOpen`
- `explainBusy`
- `error`

---

# focusTerm Helper

Signature:

    focusTerm(beginnerText, advancedText)

Purpose:

Selects beginner or advanced terminology based on `beginnerMode`.

---

# loadHistory

## Purpose

Loads Git history from backend.

Backend command:

    git_history

Payload:

    repoPath

On success:

- sets history
- clears error
- automatically selects first commit if history exists

On failure:

- sets error message

---

# selectSnapshot

## Purpose

Selects a commit/snapshot and loads changed files.

Backend command:

    git_changed_files_from_commit

Payload:

- repoPath
- commitHash

State reset behavior:

- selected commit set
- selected file cleared
- comparison cleared
- selected diff lines cleared
- focus projection set to commit
- diff placeholder set
- explanation text/status cleared
- explanation panel closed
- changed files loaded

Important detail:

`setExplainOpen(false)` and `setExplainStatus("")` appear twice.

This is harmless but redundant.

---

# markCompareBase

## Purpose

Marks currently selected commit as comparison base A.

Behavior:

- sets `compareBase`
- clears current comparison
- clears selected file
- writes instructional text into diff surface

No backend command is executed.

---

# compareToSelected

## Purpose

Compares previously marked commit A to currently selected commit B.

Backend command:

    git_compare_commits

Payload:

- repoPath
- leftCommit
- rightCommit

Safety check:

- refuses comparison if A and B are the same commit

On success:

- stores comparison
- sets focus projection to comparison
- displays comparison diff
- clears error

On failure:

- clears comparison
- clears diff
- sets error

---

# hunkLineNumbersForLine

## Purpose

Given a clicked diff line number, identifies the complete diff hunk containing that line.

Behavior:

- normalizes diff newlines
- converts line number to zero-based index
- walks backward to hunk header
- stops at `diff --git` boundary
- walks forward until next hunk or diff header
- returns full hunk line number range

Fallback:

- returns only clicked line if no containing hunk is found

---

# toggleDiffLine

## Purpose

Toggles selection of a complete diff hunk.

Behavior:

- computes hunk lines for clicked line
- if all hunk lines are already selected, removes them
- otherwise adds all hunk lines

This means line clicking is effectively hunk selection, not single-line selection.

---

# selectedDiffText

## Purpose

Builds copy/explanation text from selected diff line numbers.

Behavior:

- returns empty string if no diff or no selected lines
- normalizes diff newlines
- sorts selected line numbers numerically
- prefixes each selected line with its diff line number

Output format:

    <lineNumber>: <diff line>

---

# copySelectedDiffLines

## Purpose

Copies selected diff line text to clipboard.

Uses:

    navigator.clipboard.writeText

On success:

- sets explain status with selected line count

The function contains several blank lines before implementation; this is only formatting noise.

---

# explainSelectedDiffLines

## Purpose

Requests local LLM explanation for selected hunk lines only.

Backend command:

    explain_diff_with_ollama

Payload includes:

- model
- selected diff text wrapped in explicit selected-lines-only instructions
- filePath
- commitHash
- commitMessage

Behavior:

- blocks if no selected text exists
- sets busy/status
- appends initial LLM log entry
- builds focus title from comparison, selected file, or generic fallback
- appends final LLM log entry on success
- appends failure log entry on error
- clears busy in finally

Important advisory rule:

The prompt text explicitly says selected lines are a subset of a larger diff and asks the model not to infer hidden context.

---

# explainComparison

## Purpose

Requests local LLM explanation for A ↔ B comparison.

Backend command:

    explain_comparison_with_ollama

Payload includes:

- model
- leftLabel
- rightLabel
- fileCount
- insertions
- deletions
- changedFilesText
- diff

On success:

- sets GPU TDP status text
- appends LLM log entry
- clears error

On failure:

- sets error

---

# clearComparison

## Purpose

Clears A/B comparison state.

Behavior:

- clears compare base
- clears comparison
- restores focus projection to selected commit if present
- clears selected file
- restores diff placeholder text

---

# selectFile

## Purpose

Selects a changed file within a selected commit and loads its patch.

Backend command:

    git_diff_file_from_commit

Payload:

- repoPath
- commitHash
- path

State behavior:

- selected file set
- selected diff lines cleared
- focus projection set to file
- diff set to loading text
- explanation state cleared
- diff replaced with backend result or no-diff text

---

# explainSelectedDiff

## Purpose

Requests local LLM explanation for the currently selected file diff.

Backend command:

    explain_diff_with_ollama

Payload includes:

- model
- diff
- filePath
- commitHash
- commitMessage

Behavior:

- blocks if no valid selected file/diff exists
- sets busy and GPU TDP status text
- sets waiting explanation text
- stores returned explanation in local state
- appends LLM log entry
- closes explanation panel
- clears error

Important detail:

The local explanation panel rendering block is disabled with `false`, so `explainText` is mostly preserved for historical/disabled UI behavior while log entries are the visible output path.

---

# restoreSelectedFile

## Purpose

Routes restoring a selected file from an older commit through confirmation.

Confirmation text explicitly states:

- file will be restored into working folder
- this modifies working folder
- it does not commit automatically
- user must review before preparing or committing

Backend command inside confirmed action:

    git_restore_file_from_commit

Payload:

- repoPath
- commitHash
- path

On success:

- updates diff area with restore result and review warning

On failure:

- sets error

---

# useEffect Refresh Behavior

Effect:

    useEffect(() => {
      loadHistory();
    }, [refreshTick]);

Purpose:

Reloads history when parent refresh tick changes.

Important detail:

The dependency list includes only `refreshTick`.

---

# Rendered Root

Root element:

    <section className="timeline-panel">

This is the main Time Machine panel surface.

---

# Timeline Header

Displays:

- title: `Time Machine`
- description: `Pick a snapshot, then pick a file to view what changed in that snapshot.`
- `Refresh history` button

Refresh button calls:

    loadHistory

---

# Error Surface

If `error` exists, renders:

    <div className="message">{error}</div>

---

# Focus Mode Surface

Renders:

    focus-surface focus-surface--<kind>

Focus kinds:

- none
- commit
- file
- comparison

Purpose:

Projects current inspection target into a high-level context surface.

---

# Focus Mode Main Text

Focus headings:

- comparison → Snapshot comparison / A ↔ B commit comparison
- file → File inspection / File diff focus
- commit → Snapshot inspection / Commit focus
- none → No focused inspection

Focus text changes based on selected inspection context.

---

# Focus Facts

For comparison:

- changed files
- insertions
- deletions

For file:

- file status
- commit short hash

For commit:

- changed file count
- commit short hash

For none:

- waiting placeholder

---

# Focus Actions

Buttons:

- Use this as snapshot A / Set A
- Compare selected as snapshot B / Compare A → B
- Clear comparison / Clear A/B

Disabled rules:

- cannot set A without selected commit
- cannot compare without A and B or if A equals B
- cannot clear if no comparison/base exists

---

# Focus Hint

If compare base exists:

- displays selected A commit

Otherwise:

- displays beginner/advanced path instructions

---

# Main Timeline Layout

Root class:

    timeline-layout timeline-layout--three

Contains three columns:

- commit list
- changed file list
- diff viewer

---

# Commit List

Renders every history commit as a button.

Each commit displays:

- short hash
- message
- author
- timestamp

Selected commit receives:

    timeline-commit--selected

Clicking a commit calls:

    selectSnapshot(commit)

---

# Changed Files Column

Displays changed files for selected commit.

If commit selected and changed files exist:

- renders file buttons

If selected commit has no files:

    No file changes recorded in this snapshot.

If no commit selected:

    Select a snapshot first.

---

# File Selection

Each file button displays:

- status
- path

Selected file receives:

    timeline-file--selected

Clicking a file calls:

    selectFile(file)

---

# Diff Viewer Column

Title changes based on context:

- comparison → A ↔ B comparison title
- selected file → File diff title
- otherwise → No file selected

---

# Diff Scope Card

When a commit is selected, renders:

- diff scope
- snapshot/comparison identity
- file/comparison file count

This explicitly documents whether the visible diff is:

- selected snapshot vs parent
- snapshot A vs snapshot B
- no file selected

---

# Comparison Summary

When comparison exists, renders:

- changed files
- insertions
- deletions

---

# Comparison Diff Actions

When comparison exists, renders buttons:

- explain A ↔ B through local LLM
- explain selected hunk lines
- copy complete diff

---

# Selected File Diff Actions

When selected file exists, renders buttons:

- explain full diff through local LLM
- copy selected hunk lines
- explain selected hunk lines
- restore this file from selected snapshot

Restore button uses danger styling.

---

# Disabled Experimental Ollama Chat Block

The component contains a rendering block guarded by:

    {false ? (...) : null}

This block is currently unreachable.

It contains UI for:

- local LLM experimental explanation
- status display
- advisory warning
- read/copy/ask-again controls
- explanation text rendering

This is inactive code in the current component.

---

# Pretty Diff Rendering

If selected commit exists:

    renderPrettyDiff(diff, selectedDiffLines, toggleDiffLine)

Otherwise:

    Select a snapshot to inspect changed files.

This means diff lines are always selectable once a commit is selected, even placeholder text may be rendered through the pretty diff function.

---

# Backend Commands Used

Direct Tauri commands invoked:

- `git_history`
- `git_changed_files_from_commit`
- `git_compare_commits`
- `git_diff_file_from_commit`
- `explain_diff_with_ollama`
- `explain_comparison_with_ollama`
- `git_restore_file_from_commit`

---

# Clipboard APIs Used

Uses:

- `navigator.clipboard.writeText(selectedText)`
- `navigator.clipboard.writeText(comparison.diff)`
- disabled-block code can copy `explainText`

---

# Truth, Projection, Mutation, and Advisory Boundaries

## Truth Inputs

Truth comes from backend Git commands:

- history
- changed files
- diffs
- comparisons

---

## Projection Systems

Projection includes:

- commit list
- changed file list
- focus mode
- diff scope card
- pretty diff rendering
- comparison summary
- selected hunk highlighting

---

## Mutation Systems

Mutation exists only through guarded restore:

- `git_restore_file_from_commit`

The mutation writes an old file version into the working folder.

It does not commit automatically.

---

## Preview Systems

Preview/inspection surfaces include:

- commit inspection
- file diff inspection
- A/B commit comparison
- selected hunk lines

---

## Cognition Systems

Cognition/advisory systems include:

- full file diff explanation
- selected hunk-line explanation
- A/B comparison explanation

These use local LLM backend commands.

---

## Safety Systems

Safety surfaces include:

- confirmation modal for restore
- danger styling for restore
- explicit restore warning text
- no auto-commit after restore
- selected-line explanation prompt limits inference
- disabled buttons when required state is missing
- local LLM output appended to visible LLM log

---

# Advisory LLM Boundary

LLM output is advisory.

The panel requests explanations but does not treat them as Git truth.

The disabled experimental block explicitly states:

    Local LLM output is advisory. The Git diff remains the truth.

Although that block is not rendered, it documents the intended doctrine in source.

---

# Educational UI Doctrine

The panel uses beginner/pro terminology for Focus Mode:

- snapshot vs commit
- snapshot A/B vs A ↔ B commit comparison
- changed files vs files
- added/removed lines vs insertions/deletions

This supports ChronoGit’s beginner-compatible Git learning model.

---

# Important Duplication / Ownership Notes

This file contains duplicated local versions of:

- runtime types
- diff line classification
- pretty diff rendering

Related canonical or newer files include:

- `src/core/chronogitRuntimeTypes.ts`
- `src/lib/diffUtils.ts`
- `src/components/DiffViewer.tsx`

Ownership should be clarified before future refactoring.

---

# Relationship to TimeMachinePanel

The current architecture also contains `TimeMachinePanel`.

This `TimelinePanel.tsx` appears to be a legacy or earlier Time Machine implementation.

Do not assume it is the active panel without checking current imports and panel dispatch.

This document describes only what this file does.

---

# CSS Dependencies

Depends on CSS classes including:

- timeline-panel
- timeline-header
- message
- focus-surface
- focus-surface--none
- focus-surface--commit
- focus-surface--file
- focus-surface--comparison
- focus-surface__main
- focus-surface__eyebrow
- focus-surface__facts
- focus-surface__actions
- focus-surface__hint
- timeline-layout
- timeline-layout--three
- timeline-list
- timeline-commit
- timeline-commit--selected
- timeline-hash
- timeline-message
- timeline-meta
- timeline-files
- timeline-file
- timeline-file--selected
- timeline-empty
- diff-viewer
- diff-title
- diff-scope-card
- comparison-summary
- diff-actions
- diff-action-row
- danger-button
- diff-placeholder
- diff-pretty
- diff-line
- diff-line--file
- diff-line--hunk
- diff-line--add
- diff-line--remove
- diff-line--header
- diff-line--selected
- diff-line--selectable
- diff-line__num
- diff-line__text
- ollama-chat

---

# Current Known Gaps

- Runtime types are duplicated locally instead of imported from canonical runtime type definitions.
- Diff rendering utility is duplicated locally.
- Pretty diff rendering overlaps with `DiffViewer.tsx`.
- The disabled Ollama chat block remains in source under `false`.
- `setExplainOpen(false)` and `setExplainStatus("")` are repeated in `selectSnapshot`.
- `copySelectedDiffLines()` contains unnecessary blank lines.
- `DiffResult` local type omits `path`.
- No explicit loading state exists for history loading.
- No pagination exists for large histories.
- No search/filter exists for commits.
- No file lineage view exists in this panel.
- No branch filter exists.
- No rename lineage summary exists.
- No backend cancellation exists for long LLM calls.
- No virtualization exists for very large diffs.
- No markdown rendering exists for LLM output.
- No explicit stale comparison invalidation exists after repository refresh.

---

# Potential Future Expansion

Potential future improvements include:

- replace local types with central runtime types
- replace local diff helpers with canonical utilities/components
- split into smaller components
- integrate file lineage
- add commit search
- add branch-aware history views
- add graph projection
- add diff virtualization
- add hunk collapse/expand
- add better LLM streaming support
- remove disabled experimental block
- integrate provenance graph output
- expose restore preview before mutation
- add patch export per comparison/file
- connect selected diff lines to canonical LLM log source metadata

---

# Design Characteristics

The panel is:

- historically rich
- multi-responsibility
- Time Machine oriented
- diff-centric
- comparison-capable
- LLM-advisory capable
- mutation-guarded for restore
- educational in terminology
- a strong candidate for future modularization

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/TimelinePanel.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
