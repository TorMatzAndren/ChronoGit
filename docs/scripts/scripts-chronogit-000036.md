Title: TimeMachinePanel.tsx
ID: scripts-chronogit-000036
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: time-machine
Updated: 2026-05-07
Revision: 1

---

@role:ui-panel
@subsystem:time-machine
@entity:script:chronogit-app/src/panels/TimeMachinePanel.tsx
@entity:/chronogit-app/src/panels/TimeMachinePanel.tsx
@semantic:time-machine
@semantic:git-history
@semantic:commit-inspection
@semantic:file-diff
@semantic:file-lineage
@semantic:commit-comparison
@semantic:line-selection
@semantic:llm-diff-explanation
@semantic:patch-backup
@semantic:file-restore
@semantic:history-rewrite
@semantic:confirmation-flow
@semantic:clipboard-export
@semantic:educational-ui
@state:active

# TimeMachinePanel.tsx

**Date:** 2026-05-07
**Summary:** Active Time Machine panel for ChronoGit. Provides Git history inspection, changed-file selection, diff viewing, file lineage tracking, older→newer snapshot comparison, selected hunk-line explanation, patch backup, guarded file restore, and guarded latest snapshot message rename workflow.
**Keywords:** time machine, git history, file lineage, commit comparison, diff viewer, selected hunk lines, patch backup, restore file, amend latest commit
**Tags:** scripts, frontend, react, git, time-machine, diff, lineage, comparison, llm, restore, patch-backup

Active Git Time Machine inspection panel for ChronoGit.

---

## Purpose

`TimeMachinePanel.tsx` provides ChronoGit’s active historical Git inspection surface.

Responsibilities include:

- loading Git history
- selecting snapshots/commits
- listing changed files for a selected snapshot
- loading selected file diffs
- loading selected file lineage
- highlighting commits that touched the selected file lineage
- jumping to first/latest/rename/deletion lineage commits
- selecting hunk lines by clicking diff lines
- explaining full diffs or selected hunk lines through local LLM
- backing up currently loaded diffs as `.patch` files
- opening patch/log backup folder
- comparing an older selected snapshot against a saved newer target
- restoring one selected file from one selected snapshot into the working folder
- renaming/amending the latest snapshot message through guarded confirmation

This panel is the primary Time Machine workflow implementation currently used by `App.tsx`.

---

# Architectural Role

This component belongs to ChronoGit’s Time Machine, historical inspection, and Git cognition layer.

It combines several architectural surfaces:

- raw Git history projection
- structured diff inspection
- file lineage projection
- older/newer commit comparison
- selected hunk-line interaction
- advisory local LLM explanation
- patch preservation workflow
- guarded working-folder restore
- guarded HEAD commit-message rewrite

It does not execute Git directly in the browser. Git interaction occurs through Tauri backend commands and persistence helpers.

---

# Imported Dependencies

Imports React hooks:

- `useEffect`
- `useRef`
- `useState`

Imports Tauri command bridge:

- `invoke`

from:

    @tauri-apps/api/core

Imports diff renderer:

- `renderPrettyDiff`

from:

    ../components/DiffViewer

Imports persistence helpers:

- `backupPatchFile`
- `openLogBackupFolder`

from:

    ../core/persistence

Imports runtime types:

- `ChangedFile`
- `CommitComparison`
- `CommitResult`
- `ConfirmAction`
- `DiffResult`
- `ExplainDiffResult`
- `FileLineage`
- `HistoryCommit`
- `LlmLogEntry`

from:

    ../core/chronogitRuntimeTypes

---

# Local ui Helper

Defines:

    function ui(beginnerMode, beginner, pro)

Purpose:

Selects beginner-facing or advanced/pro terminology.

This helper is local to the file.

---

# Props Contract

`TimeMachinePanel` receives:

- `repoPath`
- `refreshTick`
- `beginnerMode`
- `llmModel`
- `appendLlmEntry`
- `setConfirmAction`

---

## repoPath

Type:

    string

Purpose:

Repository path passed into backend Git commands.

---

## refreshTick

Type:

    number

Purpose:

External refresh trigger. When it or `repoPath` changes, history reloads.

---

## beginnerMode

Type:

    boolean

Purpose:

Controls terminology mapping between beginner and advanced labels.

---

## llmModel

Type:

    string

Purpose:

Selected local LLM model for diff explanation commands.

---

## appendLlmEntry

Type:

    (entry: Omit<LlmLogEntry, "id" | "timestamp">) => void

Purpose:

Appends advisory explanation or system-style diff backup notices to the shared LLM log surface.

---

## setConfirmAction

Type:

    (action: ConfirmAction | null) => void

Purpose:

Routes dangerous or history-rewriting actions through the shared confirmation modal.

Used for:

- restore file from old snapshot
- rename latest snapshot message

---

# Internal State

State fields:

- `history`
- `selected`
- `changedFiles`
- `selectedFile`
- `diff`
- `compareBase`
- `compareTargetFilePath`
- `comparison`
- `lineage`
- `selectedDiffLines`
- `renameSnapshotOpen`
- `renameSnapshotText`
- `busy`
- `error`

---

## timelineCommitRefs

Defines:

    useRef<Record<string, HTMLButtonElement | null>>({})

Purpose:

Stores commit button references keyed by full commit hash.

Used to scroll/focus a lineage-related commit after a jump.

---

# Refresh Effect

Effect:

    useEffect(() => { void loadHistory(); }, [refreshTick, repoPath]);

Purpose:

Reloads history whenever:

- parent refresh tick changes
- active repository path changes

This makes the Time Machine panel repository-aware.

---

# loadHistory

## Purpose

Loads Git history from backend.

Backend command:

    git_history

Payload:

    repoPath

On success:

- updates history
- clears error
- selects newest/first commit if history exists

On failure:

- sets error message

---

# selectSnapshot

## Purpose

Selects a commit/snapshot and loads its changed-file list.

Backend command:

    git_changed_files_from_commit

Payload:

- `repoPath`
- `commitHash`

State reset behavior:

- sets selected commit
- clears selected file
- clears comparison
- clears lineage
- clears selected diff lines
- sets placeholder diff text
- loads changed files

Important boundary:

This function does not contain a try/catch block. Backend errors would reject the async call to the caller rather than being converted into a local `error` message inside this function.

---

# selectFile

## Purpose

Selects a changed file and loads both its diff and lineage.

Backend commands run in parallel:

- `git_diff_file_from_commit`
- `git_file_lineage`

Payload includes:

- `repoPath`
- selected commit hash
- selected file path

On success:

- sets selected file
- clears comparison
- clears selected hunk lines
- sets diff
- sets lineage
- clears error

On failure:

- clears lineage
- clears diff
- sets file-inspection error message

---

# compareToSelected

## Purpose

Compares the currently selected older snapshot against a saved newer target.

Guard:

    if (!compareBase || !selected || compareBase.hash === selected.hash) return;

Backend command:

    git_compare_commits

Payload:

- `leftCommit: selected.hash`
- `rightCommit: compareBase.hash`

Source naming in UI:

- selected = older candidate
- compareBase = newer target

On success:

- clears selected file
- clears lineage
- clears selected diff lines
- sets loading message
- stores comparison
- sets comparison diff

Important detail:

There is no try/catch in this function. Backend comparison failure would reject the async call rather than setting local error.

---

# lineageHashes

## Purpose

Returns a `Set` of commit hashes that touched the selected file lineage.

Source:

    lineage?.commits

Used to highlight commits in the timeline.

---

# lineageEntryForCommit

## Purpose

Finds the file-lineage entry associated with a given commit hash.

Used to derive per-commit lineage status and CSS classes.

---

# jumpToCommitHash

## Purpose

Moves the Time Machine selection to a lineage-related commit.

Behavior:

1. finds matching commit in loaded history
2. sets error if commit is not loaded
3. selects the commit
4. scrolls the matching commit button into view
5. focuses the commit button

Scroll behavior:

    behavior: "smooth"
    block: "center"

---

# lineageStatusLabel

## Purpose

Maps file-lineage status codes to human-readable labels.

Mappings:

- `A` → introduced selected file
- `D` → removed selected file
- `R*` → renamed selected file
- `C*` → copied selected file
- `M` → modified selected file
- fallback → touched selected file (`status`)

---

# hunkLineNumbersForLine

## Purpose

Determines the complete diff hunk containing a clicked diff line.

Behavior:

- normalizes line endings
- converts selected line to index
- walks backward to `@@` hunk marker
- stops at `diff --git` boundary
- walks forward to next hunk or file boundary
- returns all line numbers in that hunk

Fallback:

- returns only the clicked line if no hunk boundary is found

This means clicking a line selects a hunk, not just one isolated line.

---

# toggleLine

## Purpose

Toggles selected state for an entire diff hunk.

Behavior:

- gets hunk lines for clicked line
- if all hunk lines are selected, removes them
- otherwise adds all hunk lines

State:

    selectedDiffLines

---

# selectedDiffText

## Purpose

Builds deterministic text from selected diff lines.

Behavior:

- returns empty string if no diff or no selected lines
- normalizes newlines
- sorts selected line numbers ascending
- formats each selected line as:

    <lineNumber>: <line text>

Used for:

- clipboard copy
- selected hunk explanation
- selected subset explanation in `explainCurrentDiff`

---

# explainCurrentDiff

## Purpose

Requests local LLM explanation of current diff context.

Backend command:

    explain_diff_with_ollama

Payload:

- model
- diff text
- file path
- commit hash
- commit message/title

Diff source:

- selected hunk text if any hunk lines are selected
- otherwise complete current diff

Title source:

- comparison title if comparison exists
- selected file title if selected file exists
- generic diff title otherwise

On success:

- appends LLM log entry with explanation

On failure:

- sets local error

Busy state:

- `busy` true during request
- reset in finally

---

# explainSelectedHunkLines

## Purpose

Requests local LLM explanation for selected hunk lines only.

Guard:

- blocks if no LLM model
- blocks if no selected diff text

Backend command:

    explain_diff_with_ollama

Payload includes a constructed diff text with explicit instruction header:

    CHRONOGIT SELECTED DIFF LINES ONLY
    Explain only these selected hunk lines. Do not infer hidden context.

On success:

- appends LLM log entry
- clears error

On failure:

- sets error

Busy state is managed during the request.

---

# openRenameLatestSnapshot

## Purpose

Opens the local rename modal for the latest snapshot message.

Guard:

- selected commit must exist
- history must exist
- selected hash must equal newest history entry hash

Behavior:

- copies selected message into rename text
- opens rename modal

---

# cancelRenameLatestSnapshot

## Purpose

Closes rename modal and clears rename input.

---

# requestRenameLatestSnapshot

## Purpose

Routes latest snapshot message rename through guarded confirmation.

Guards:

- selected commit exists
- history exists
- selected commit is newest history entry
- next message is non-empty
- next message differs from current message

After local modal is accepted:

- closes rename modal
- creates shared confirmation action

Confirmation explains:

- this amends the latest Git commit message
- this rewrites the latest commit object
- the commit hash will change
- safest before pushing

Backend command inside confirmed action:

    git_amend_latest_commit_message

Payload:

- repoPath
- message

On success:

- clears error
- writes result message into diff area
- reloads history

---

# backupCurrentDiffAsPatch

## Purpose

Backs up currently loaded real Git diff to a `.patch` file.

Guard blocks when:

- diff is empty
- diff equals `Loading file diff...`
- diff starts with `Select a changed file`

Filename stem:

- comparison: `chronogit-comparison-<left>-<right>`
- selected file: `chronogit-diff-<short_hash>-<filename>`
- fallback: `chronogit-diff`

Persistence helper:

    backupPatchFile(filenameStem, diff)

On success:

- clears error
- appends LLM log entry with model `system`
- stores written patch path in log content

On failure:

- sets error

Important boundary:

Although the success notice is appended to the LLM log, this is a system-generated backup notice, not an LLM response.

---

# openPatchBackupFolder

## Purpose

Opens the backup folder used for patch/log backups.

Helper:

    openLogBackupFolder

On success:

- sets `error` field to `Opened backup folder: <path>`

On failure:

- sets error message

Important detail:

The `error` state is used here as a general message/status surface, not only for errors.

---

# restoreSelectedFile

## Purpose

Routes restoring a selected file from a selected snapshot through shared confirmation.

Guard:

- requires selected commit
- requires selected file

Confirmation states:

- one file will be restored from an older snapshot into working folder
- selected file path
- selected snapshot hash/message

Backend command inside confirmed action:

    git_restore_file_from_commit

Payload:

- repoPath
- commitHash
- path

On success:

- writes restore result and review warning into diff surface

Important detail:

This modifies the working folder but does not commit automatically.

---

# Render Root

Root element:

    <div className="timeline-panel">

This is the active Time Machine panel container.

---

# Header

Renders:

- title:
  - beginner: `Time Machine`
  - pro: `git log / git diff`
- description:
  - beginner: `Pick a snapshot, then inspect files and diffs.`
  - pro: `Select commits and inspect patches.`
- refresh history button

Refresh button calls:

    loadHistory

---

# Error / Message Surface

If `error` exists:

    <div className="message">{error}</div>

This field is used for both errors and some status messages.

---

# Focus Surface

Renders current inspection focus:

- comparison → `Older snapshot → newer target comparison`
- selected file → selected file path
- selected commit → short hash and message
- none → `No focused inspection`

---

# File Lineage Summary

Displays lineage summary for selected file.

When lineage exists:

- number of commits touching selected file
- first visible commit button
- latest visible commit button
- rename event button
- deletion event button

When no lineage exists:

- `no file lineage selected`

Buttons jump to lineage-related commits when available.

---

# First Lineage Button

Enabled when:

    lineage?.first_commit

On click:

    jumpToCommitHash(first_commit.hash)

---

# Last Lineage Button

Enabled when:

    lineage?.last_commit

On click:

    jumpToCommitHash(last_commit.hash)

---

# Rename Lineage Button

Enabled when:

    lineage?.rename_events.length

On click:

    jumpToCommitHash(rename_events[0].hash)

---

# Deleted Lineage Button

Enabled when:

    lineage?.deleted

On click:

    jumps to first lineage entry with status `D`

---

# Comparison Target Strip

Displays:

- newer target
- older candidate

Newer target source:

    compareBase

Older candidate source:

    selected

Includes selected file path / target file path when available.

---

# Focus Actions

Actions:

- Use as newer target
- Compare selected older snapshot → target
- Clear target
- Rename latest snapshot

---

# Use as Newer Target

Sets:

- `compareBase` to selected commit
- `compareTargetFilePath` to selected file path or empty string

Purpose:

Defines the right/newer comparison endpoint.

---

# Compare Selected Older Snapshot → Target

Disabled when:

- no target
- no selected commit
- selected equals target

Calls:

    compareToSelected

---

# Clear Target

Disabled when:

- no compare base
- no comparison

Clears:

- compareBase
- compareTargetFilePath
- comparison

---

# Rename Latest Snapshot Button

Class:

    danger-button

Disabled unless:

- selected commit exists
- history exists
- selected commit is newest history entry

Purpose:

Only latest local snapshot can be renamed here.

Tooltip maps to:

- beginner explanation
- `git commit --amend only applies to HEAD`

---

# Rename Snapshot Modal

When `renameSnapshotOpen` is true, component renders its own modal.

This is separate from shared `ConfirmModal`.

It is the first step before shared final confirmation.

---

## Rename Modal Characteristics

- danger modal styling
- history rewrite eyebrow
- explanation text
- controlled input
- Enter submits to final safety confirmation
- Escape cancels
- disabled continuation if message empty or unchanged

Button:

    Continue to safety confirmation

---

# Three-Column Layout

Root:

    timeline-layout timeline-layout--three

Columns:

- timeline commit list
- changed file list
- diff viewer

---

# Timeline Commit List

Each history commit renders as a button.

Displayed fields:

- short hash
- message
- author
- timestamp
- optional lineage status pill

---

# Timeline Commit Refs

Each commit button stores ref in:

    timelineCommitRefs.current[commit.hash]

Used for scroll/focus after lineage jumps.

---

# Timeline Commit Classes

Base:

    timeline-commit

Conditional:

- selected commit → `timeline-commit--selected`
- touches lineage file → `timeline-commit--lineage`
- lineage status A → `timeline-commit--lineage-first`
- lineage status D → `timeline-commit--lineage-deleted`
- lineage status starts with R → `timeline-commit--lineage-rename`

---

# Commit Tooltip

If commit has lineage entry:

    lineageStatusLabel(lineageEntry.status)

is used as title.

---

# Changed Files Column

Displays title:

    Changed files in <short_hash>

or:

    Changed files

Files render as buttons with:

- status
- path

Selected file receives:

    timeline-file--selected

Clicking file calls:

    selectFile(file)

If no changed files are available:

    Select a snapshot first.

Important detail:

This fallback text appears even when a selected snapshot has no changed files.

---

# Diff Viewer Column

Title:

- comparison → comparison labels
- selected file → selected file path
- none → `No file selected`

---

# Diff Actions

Buttons:

- Ask local LLM to explain this diff
- Copy selected hunk lines
- Explain selected hunk lines
- Backup current diff as .patch
- Open backup folder
- Restore file

---

# Explain Current Diff Button

Disabled when:

- busy
- diff is empty

Label includes selected LLM model when present.

Calls:

    explainCurrentDiff

---

# Copy Selected Hunk Lines Button

Disabled when:

    selectedDiffLines.size === 0

Copies:

    selectedDiffText()

through browser clipboard API.

---

# Explain Selected Hunk Lines Button

Disabled when:

- busy
- no selected diff lines

Calls:

    explainSelectedHunkLines

---

# Backup Current Diff Button

Disabled when:

- diff empty
- diff starts with `Select a changed file`
- diff equals `Loading file diff...`

Calls:

    backupCurrentDiffAsPatch

---

# Open Backup Folder Button

Calls:

    openPatchBackupFolder

---

# Restore File Button

Class:

    danger-button

Disabled when:

    !selectedFile

Calls:

    restoreSelectedFile

---

# Diff Rendering

Uses imported:

    renderPrettyDiff(diff, selectedDiffLines, toggleLine)

from:

    ../components/DiffViewer

This delegates visual diff line classification/rendering to the shared diff viewer component.

---

# Backend Commands Used

Direct Tauri commands invoked:

- `git_history`
- `git_changed_files_from_commit`
- `git_diff_file_from_commit`
- `git_file_lineage`
- `git_compare_commits`
- `explain_diff_with_ollama`
- `git_amend_latest_commit_message`
- `git_restore_file_from_commit`

---

# Persistence Helpers Used

Uses:

- `backupPatchFile`
- `openLogBackupFolder`

These route patch backup behavior through ChronoGit persistence layer.

---

# Clipboard APIs Used

Uses:

    navigator.clipboard.writeText(selectedDiffText())

for selected hunk line copying.

---

# Truth, Projection, Mutation, Preview, Cognition, and Safety Boundaries

## Truth Inputs

Backend Git truth sources include:

- commit history
- changed files
- file diffs
- file lineage
- commit comparisons

---

## Projection Systems

Projection surfaces include:

- timeline commit list
- changed file list
- diff viewer
- lineage highlights
- focus surface
- comparison target strip
- lineage summary
- selected hunk highlighting

---

## Mutation Systems

Mutating workflows include:

- restore selected file into working folder
- amend latest commit message
- patch backup file write

Git repository mutation occurs only through backend commands and confirmation flows.

---

## Preview Systems

Preview/inspection workflows include:

- file diff inspection
- selected hunk-line selection
- older→newer commit comparison
- lineage summary and jump targets

---

## Cognition Systems

Advisory/cognition workflows include:

- full diff explanation
- selected hunk-line explanation

Both use local LLM backend calls and append visible entries to the LLM log.

---

## Safety Systems

Safety systems include:

- confirmation for restore
- confirmation for latest snapshot rename
- latest-commit-only amend guard
- disabled buttons when prerequisites are missing
- patch backup guard against placeholder diffs
- selected hunk prompt limits hidden-context inference
- restore warning that file is placed into working folder and must be reviewed
- visible history rewrite explanation before amend

---

# Advisory LLM Boundary

LLM output is advisory and is routed into the shared LLM log.

This panel does not treat LLM output as Git truth.

The selected hunk prompt explicitly limits explanation scope to selected lines and says not to infer hidden context.

---

# Patch Backup Boundary

Patch backup writes the currently loaded diff as an external `.patch` file.

It does not:

- apply patch
- mutate Git history
- stage files
- commit files

It records the backup path as a `system` model entry in the LLM log.

---

# History Rewrite Boundary

The rename latest snapshot workflow runs:

    git_amend_latest_commit_message

through backend after confirmation.

The UI explicitly states:

- latest commit object is rewritten
- commit hash changes
- safest before pushing

This is a critical safety/provenance boundary.

---

# File Restore Boundary

The restore workflow runs:

    git_restore_file_from_commit

through backend after confirmation.

The UI states that the file is restored into the working folder and must be reviewed before committing.

This is a working-folder mutation, not an automatic commit.

---

# Educational UI Doctrine

The panel uses beginner/pro terms such as:

- Time Machine vs git log / git diff
- snapshot vs commit
- inspect files and diffs vs inspect patches
- rename latest snapshot vs amend HEAD message
- restore file from snapshot vs git restore --source

This supports learning without hiding Git truth.

---

# Relationship to TimelinePanel

`TimeMachinePanel.tsx` appears to be the active newer implementation imported by `App.tsx`.

`TimelinePanel.tsx` exists separately and overlaps in responsibilities.

Important distinction:

- `TimelinePanel.tsx` has duplicated local runtime types and local diff helpers.
- `TimeMachinePanel.tsx` imports central runtime types and shared diff/persistence helpers.

This makes `TimeMachinePanel.tsx` the more integrated implementation based on visible source relationships.

---

# CSS Dependencies

Depends on CSS classes including:

- timeline-panel
- timeline-header
- message
- focus-surface
- file-lineage-summary
- file-lineage-summary--empty
- comparison-target-strip
- focus-surface__actions
- danger-button
- confirm-overlay
- confirm-modal
- confirm-modal--danger
- confirm-modal__eyebrow
- confirm-required-text
- confirm-modal__actions
- timeline-layout
- timeline-layout--three
- timeline-list
- timeline-commit
- timeline-commit--selected
- timeline-commit--lineage
- timeline-commit--lineage-first
- timeline-commit--lineage-deleted
- timeline-commit--lineage-rename
- timeline-hash
- timeline-message
- timeline-meta
- timeline-lineage-slot
- timeline-lineage-pill
- timeline-files
- diff-title
- timeline-file
- timeline-file--selected
- timeline-empty
- diff-viewer
- diff-actions

Additional diff classes are produced by `renderPrettyDiff`.

---

# Current Known Gaps

- `selectSnapshot` has no local try/catch around changed-file loading.
- `compareToSelected` has no local try/catch around comparison loading.
- `openPatchBackupFolder` reports success through the `error` state.
- Patch backup success is written to the LLM log with model `system`, mixing system notices into advisory log surface.
- The changed-file empty fallback says `Select a snapshot first` even when a selected snapshot has no changed files.
- No commit search exists.
- No pagination/virtualization exists for long histories.
- No diff virtualization exists for large diffs.
- No branch filter exists.
- No explicit comparison direction diagram exists beyond text.
- No stale comparison invalidation exists after refresh.
- No backend cancellation exists for long LLM calls.
- No explicit patch backup filename preview exists.
- No separate non-error status message state exists.
- Rename modal is implemented locally rather than through the shared modal for the first step.

---

# Potential Future Expansion

Potential future improvements include:

- split lineage summary into component
- split timeline list into component
- split comparison controls into component
- add commit search/filtering
- add branch-aware history
- add graph visualization
- add diff virtualization
- add hunk collapse/expand
- add file lineage graph
- add patch backup preview
- separate system backup notices from LLM log
- add explicit status state separate from error
- add safer error handling around all invokes
- add comparison stale-state detection
- add commit provenance export
- integrate Time Machine nodes into Chrono-Field
- expose selected file lineage as semantic graph data

---

# Design Characteristics

The panel is:

- historically focused
- lineage-aware
- diff-centric
- comparison-capable
- local-LLM advisory capable
- patch-preservation capable
- mutation-guarded
- history-rewrite-aware
- educational
- a major ChronoGit cognition surface

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/TimeMachinePanel.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
