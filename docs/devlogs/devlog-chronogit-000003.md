Title: ChronoGit Focus Mode, A/B Comparison, Selected Hunk Explanation, and Git Workspace Direction
ID: devlog-chronogit-000003
Date: 2026-05-05
Author: Matz
Type: devlog
Subsystem: chronogit
Updated: 2026-05-05
Revision: 1

---

@role:devlog
@subsystem:chronogit
@scope:focus-mode
@scope:time-machine
@scope:commit-comparison
@scope:selected-diff-explanation
@scope:llm-explanation-hardening
@scope:llm-response-log
@scope:ui-stability
@scope:git-workspace-direction
@scope:layout-system-direction
@scope:beginner-and-grandmaster-ui
@entity:chronogit-app/src/App.tsx
@entity:chronogit-app/src/App.css
@entity:chronogit-app/src-tauri/src/lib.rs
@entity:docs/docs/chronogit-docs-000003.md
@entity:docs/scripts/scripts-chronogit-000001.md
@entity:docs/scripts/scripts-chronogit-000002.md
@state:active

# ChronoGit Focus Mode, A/B Comparison, Selected Hunk Explanation, and Git Workspace Direction

**Date:** 2026-05-05  
**Summary:** This session implemented the first real Focus Mode surface in ChronoGit, added A ↔ B commit comparison, hardened local LLM comparison explanations, added selectable diff hunk-line explanation, improved LLM response visibility, fixed untracked-file removal UI behavior, and established the next architectural direction: a customizable Git Workspace with tabs, panels, default layouts, and centrally owned truth.

---

## Context

ChronoGit had reached a useful v0.5 state with:

- safe working/prepared/snapshot flow
- Time Machine history
- remote awareness
- remote preview
- guarded push/pull
- operation-state detection
- local LLM explanations
- system and LLM logs
- Beginner Mode

The immediate problem became UI growth.

ChronoGit was gaining powerful features, but the interface risked becoming a monolithic screen showing everything.

The design goal shifted toward:

> show less by default, reveal more through context.

This matches the previously defined Focus Architecture.

---

## Implementation Summary

This session added and refined:

- Focus Mode surface
- A ↔ B commit comparison
- comparison-specific LLM backend
- Copy complete diff
- selected diff-line selection
- deterministic hunk-line selection behavior
- selected hunk-line copy
- selected hunk-line LLM explanation
- LLM dock auto-scroll and pulse
- remove-untracked UI stability fix
- documentation updates
- Git Workspace direction planning

---

## Focus Mode Implemented

A first Focus Mode surface now exists in `App.tsx`.

The UI defines:

- `FocusProjection`
- `focusProjection` state
- focus variants:
  - none
  - commit
  - file
  - comparison

Focus Mode now shows:

- focused inspection type
- focused entity
- relevant facts
- context-specific action buttons
- Beginner Mode / Advanced Mode terminology

This is not yet the full future layout system, but it is the first concrete implementation of the Focus Architecture.

The important conceptual shift:

> Focus Mode is not another panel. It is a contextual projection of the currently active Git truth.

---

## A ↔ B Commit Comparison Implemented

ChronoGit now supports comparing two snapshots directly.

User flow:

1. select a snapshot
2. set it as A
3. select another snapshot
4. compare A → B
5. inspect the resulting diff

Backend command:

- `git_compare_commits`

Frontend state:

- `compareBase`
- `comparison`

Backend output:

- left commit
- right commit
- left label
- right label
- changed files
- insertion count
- deletion count
- complete diff

This moves Time Machine beyond only “selected commit vs parent.”

ChronoGit can now ask:

> what changed between these two selected points in history?

---

## Copy Complete Diff Added

A “Copy complete diff” button was added for A ↔ B comparisons.

Purpose:

- allow exporting the full comparison diff
- support external review
- support deterministic copy-all workflows
- avoid relying on visible partial UI

This fits the existing Jarri/ChronoGit pattern of making raw truth easy to extract.

---

## LLM Comparison Explanation Hardened

The first generic comparison explanations were too broad.

Observed problems:

- model summarized the whole application
- model inferred architecture intent beyond the diff
- model claimed replacement where the diff only showed additive behavior
- model talked about React/Rust/project structure instead of explaining changed lines

A specialized backend command was added:

- `explain_comparison_with_ollama`

It uses a stricter prompt than generic diff explanation.

Hard constraints include:

- explain exact A ↔ B Git diff
- do not give a generic description of ChronoGit, React, Rust, Git, or UI architecture
- do not infer replacement unless old behavior is explicitly removed or all callers are rerouted
- classify changes as:
  - additive
  - modifying existing behavior
  - replacing existing behavior
  - removing behavior
- explain only supplied comparison stats, changed-file list, and diff
- Git diff remains authoritative

This does not make a small local model perfect, but it narrows its allowed behavior and improves usefulness.

---

## Selected Diff-Line and Hunk Explanation

The diff renderer now supports selecting lines.

Implemented functions:

- `hunkLineNumbersForLine`
- `toggleDiffLine`
- `selectedDiffText`
- `copySelectedDiffLines`
- `explainSelectedDiffLines`

Initial selected-line highlighting worked but was visually unclear.

The UI was then adjusted so selected lines do not expand while selected.

The desired behavior evolved from selecting arbitrary individual lines toward selecting complete diff hunks.

Current behavior:

- clicking a line attempts to select the full surrounding diff hunk
- selected hunk lines can be copied
- selected hunk lines can be sent to the LLM
- the LLM is told it is seeing only selected diff lines from a larger diff

This is a significant feature.

ChronoGit can now ask the local model to explain only the relevant diff hunk instead of forcing a full-file or full-comparison explanation.

This may become one of ChronoGit’s strongest differentiators.

---

## LLM Response Dock Visibility Improved

LLM output is stored in the LLM Responses dock.

A deterministic scroll/pulse behavior was added when a new LLM response is appended.

Behavior:

- new LLM entry is added to the log
- after a short timeout, the LLM dock scrolls into view
- dock receives a temporary pulse state

This fixed the usability issue where the user triggered an explanation high on the page and had to guess where the response appeared.

A caveat was noted:

- auto-scroll should remain deterministic
- it should not randomly guess user intent
- future behavior may need stronger anchoring if multiple workspaces/panels exist

---

## Remove Untracked File UI Stability Fixed

The app previously felt like it reloaded after “Remove untracked file.”

This was likely caused by full refresh/re-render effects after the file disappeared from Git status.

A targeted frontend fix was added:

- clear expanded state for the removed path
- immediately remove the path from local staged/working UI state
- then refresh from backend truth

The result felt instant and stable.

This fix was made without changing backend deletion behavior.

---

## Backup Policy Changed

During patching, backups were useful because they helped recover from mistakes.

But now that the workflow commits every stage through Git, additional per-file backups are no longer necessary for normal changes.

New preference:

> rely on Git commits for stage recovery instead of generating extra backup files.

---

## Focus Mode Clarified

A screenshot prompted the question:

> Is this Focus Mode?

The answer is yes, but only as the first stage.

Current Focus Mode:

- contextual summary
- active entity projection
- A/B comparison controls
- file/commit/comparison facts

Future Focus Mode should become deeper and cleaner.

The target is not a huge permanent interface.

The target is:

> present everything, but only when the user asks for that layer.

---

## Git Workspace Direction Established

A major direction was established for the next phase.

ChronoGit should evolve toward a customizable Git Workspace.

Key idea:

- users should not be forced into one huge monolithic layout
- users should be able to choose panels
- users should be able to arrange panels
- users should be able to create, rename, remove, and save tabs
- users should be able to load complete layouts
- the program should ship with a thoughtful default layout

This borrows from Jarri Workspace UI doctrine.

Important rule:

> truth must be centrally owned, not panel-owned.

Panels are views into shared truth.

They must not independently own or mutate Git state.

---

## Beginner and Grandmaster UI

The session clarified the design goal:

> keep functionality for beginners and grandmasters at the same time.

This does not mean two separate applications.

It means:

- one truth model
- one command layer
- one state owner
- different language/detail surfaces

Beginner Mode:

- teaches meaning
- uses plain-language terms
- gives hover help
- explains consequences

Advanced Mode:

- uses compact language
- exposes Git-native terms
- reduces teaching friction

Both modes must operate on the same underlying truth and behavior.

---

## Future Layout System

The next major architectural target is an empty framework with:

- title bar
- tabs
- tab rename
- tab remove
- tab add
- panel picker
- resizable panels
- saveable layouts
- loadable layouts
- default shipped layout
- persistent layout state
- main title-bar controls:
  - Beginner Mode
  - repository selector
  - remote state
  - LLM model selector
  - refresh
  - maybe current branch/state

This should become the ChronoGit Workspace shell.

The existing ChronoGit functionality should be converted into panels without losing current behavior.

---

## Default Suggested Layout

ChronoGit should ship with a thoughtful default layout.

Suggested default panels:

- Current State / Truth Strip
- Working Changes
- Prepared Changes
- Commit Preflight
- Time Machine
- Remote Preview
- System Log
- LLM Responses

Advanced optional panels:

- A ↔ B Comparison
- File Evolution
- Remote Divergence
- Commit Graph
- Conflict Assistant
- Raw Git Truth
- Layout Inspector

The default layout should be good enough for most users, but not force everyone into the same workflow.

---

## Important Constraint: Central Truth Ownership

The future workspace must not let each panel own its own truth.

Central state owner should hold:

- repo path
- Git status
- remote status
- operation state
- history
- selected commit
- selected file
- comparison state
- system log
- LLM log
- beginner mode
- LLM model selection

Panels should receive truth and request actions.

They should not independently execute Git or duplicate canonical state.

This avoids:

- stale panel state
- contradictory views
- hidden mutation paths
- confusing refresh behavior
- inconsistent LLM context

---

## Documentation Impact

The following docs needed updating:

- `scripts-chronogit-000001.md`
- `scripts-chronogit-000002.md`

The previous versions still said:

- no A ↔ B comparison
- no file evolution backend
- no Focus Mode implementation

That is no longer accurate.

Current truth:

- A ↔ B comparison backend exists
- A ↔ B comparison UI exists
- file history backend exists
- file history UI does not yet exist
- Focus Mode seed exists in Time Machine
- selected hunk-line explanation exists
- comparison-specific LLM explanation exists

---

## Current Strengths

ChronoGit now has unusually strong Git inspection features for a small standalone app:

- safe staging/unstaging language
- commit preflight
- explicit remote state
- remote preview before execution
- merge safety prediction
- guarded push/pull
- operation-state detection
- Time Machine history
- A ↔ B comparison
- selectable hunk-line explanation
- local-only LLM responses
- deterministic system log
- beginner/expert language split beginning
- Focus Mode projection beginning

---

## Current Weaknesses

Still missing:

- full Git Workspace shell
- customizable tabs
- resizable panels
- panel picker
- saved/loaded layouts
- file history UI
- commit graph
- branch management
- stash support
- conflict editor
- side-by-side diff
- stronger visual hunk boundaries
- full dual-language terminology system

---

## Strategic Insight

The session confirmed the real path forward.

ChronoGit should not compete with advanced CLI users by being faster than the terminal.

ChronoGit should win by making Git truth:

- visible
- explainable
- safe
- contextual
- inspectable
- teachable
- customizable

The correct product direction is:

> Git Workspace, not Git dashboard.

---

## Final Principle

ChronoGit should evolve under this rule:

> Everything can be presentable.  
> Nothing needs to be permanently shown.

---

## Status

active
