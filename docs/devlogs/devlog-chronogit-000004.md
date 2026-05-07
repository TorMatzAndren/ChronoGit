Title: ChronoGit Time Machine Refactor Failure, CSS Entropy, Hunk Selection Stabilization, and Mandatory Modularization Direction
ID: devlog-chronogit-000004
Date: 2026-05-07
Author: Matz
Type: devlog
Subsystem: chronogit
Updated: 2026-05-07
Revision: 1

---

@role:devlog
@subsystem:chronogit
@scope:time-machine
@scope:diff-rendering
@scope:hunk-selection
@scope:llm-hunk-explanation
@scope:css-entropy
@scope:ui-repair
@scope:workspace-modularization
@scope:panel-architecture
@scope:deterministic-refactor
@scope:technical-debt
@scope:app-shell-direction
@scope:jarri-doctrine
@entity:chronogit-app/src/App.tsx
@entity:chronogit-app/src/App.css
@entity:chronogit-app/src/panels
@entity:chronogit-app/src/components
@entity:chronogit-app/src/lib
@entity:chronogit-app/src/types
@state:active

# ChronoGit Time Machine Refactor Failure, CSS Entropy, Hunk Selection Stabilization, and Mandatory Modularization Direction

**Date:** 2026-05-07  
**Summary:** This session focused on improving the ChronoGit Time Machine surface, including diff rendering, hunk selection, selected-hunk explanation, file-list visualization, risk-card styling, and layout behavior. However, the session also exposed severe architectural problems caused by continued development inside a monolithic `App.tsx` and increasingly layered CSS overrides inside `App.css`. The outcome was both functional improvements and a hard architectural conclusion: ChronoGit must now be modularized into specialized panel/component files before further feature growth continues.

---

# Context

ChronoGit had already evolved into:

- a Git Time Machine
- a Git Workspace prototype
- a local-LLM-assisted Git inspection system
- a deterministic Git safety surface
- a multi-panel workspace concept

However, implementation was still heavily centralized inside:

- `src/App.tsx`
- `src/App.css`

The Time Machine system had become increasingly difficult to extend safely because:

- rendering
- state
- diff behavior
- hunk selection
- LLM interaction
- layout
- CSS styling
- panel ownership

all existed inside the same monolithic surface.

This session unintentionally became a real-world demonstration of why the modular split is now mandatory.

---

# Initial Goal

The intended work was straightforward:

- improve Time Machine layout
- improve diff rendering
- improve hunk selection
- improve selected hunk explanation
- tighten file list styling
- improve visual risk markers
- split “Ask LLM” into more contextual actions

But the implementation process repeatedly collided with:

- fragile regex replacements
- missing anchors
- duplicated CSS blocks
- partially-corrupted injected code
- monolithic file ownership confusion
- difficult state tracing
- layout override collisions

This eventually revealed a deeper architectural truth:

> ChronoGit had crossed the threshold where incremental monolithic patching was no longer sustainable.

---

# Time Machine Layout Repairs

Several layout stabilization passes were implemented.

New layout goals included:

- stable three-column Time Machine layout
- proper diff scrolling
- deterministic overflow behavior
- fixed-height focus surfaces
- non-expanding diff panes
- cleaner selected commit/file visualization

Implemented layout concepts included:

- `.timeline-panel`
- `.timeline-layout`
- `.timeline-layout--three`
- `.diff-viewer`
- `.focus-surface`

This improved:

- vertical stability
- overflow behavior
- Time Machine readability
- focus hierarchy

The Time Machine surface became significantly more usable.

---

# Diff Rendering Improvements

The diff renderer evolved substantially during this session.

New visual categories were introduced:

- diff headers
- file boundaries
- hunk boundaries
- additions
- removals
- selected lines

The renderer now visually distinguishes:

- `diff --git`
- `@@ hunk headers`
- added lines
- removed lines
- selected lines

New CSS classes included:

- `.diff-line--header`
- `.diff-line--file`
- `.diff-line--hunk`
- `.diff-line--add`
- `.diff-line--remove`
- `.diff-line--selected`

The renderer became dramatically clearer than earlier plain-text rendering.

---

# Selected Hunk Explanation Added

The Time Machine diff surface gained:

- selected line tracking
- selected hunk extraction
- selected hunk copy
- selected hunk explanation

This became one of the strongest conceptual improvements of the session.

ChronoGit can now:

- select only relevant diff hunks
- send only relevant diff hunks to the LLM
- avoid full-file explanations
- avoid whole-diff noise

The user flow now supports:

1. selecting a diff hunk
2. copying selected lines
3. asking the local LLM to explain only that hunk

This aligns strongly with ChronoGit’s intended philosophy:

> explain focused Git truth, not generalized abstractions.

---

# Hunk Selection Stabilization

Initial line selection behavior was unstable.

Observed problems:

- hover-like behavior
- inconsistent click registration
- delayed selection
- selected-state confusion
- CSS collisions
- incorrect class targeting

The issue was traced to:

- mismatched CSS selectors:
  - `.diff-line__num`
  - `.diff-line__number`
- repeated layered overrides
- overlapping Time Machine repair blocks
- multiple generations of `.diff-line` CSS rules

A deterministic hunk-selection function was introduced:

- `hunkLineNumbersForLine`

This function:

- walks upward to nearest `@@`
- walks downward to next hunk/file boundary
- selects entire hunk deterministically

The new behavior:

- clicking any line inside a hunk selects the full hunk
- clicking again deselects the full hunk

This stabilized behavior substantially.

---

# LLM Hunk Explanation Behavior Fixed

Initially:

- selected hunk explanation produced no visible output

The root problem was not backend execution.

The issue was:

- UI wiring confusion
- missing visible log output
- diff-action targeting problems

After stabilization:

- selected hunk explanation correctly appended into the LLM log

This verified:

- backend streaming was functioning
- selected diff extraction worked
- local model integration worked

---

# Diff Action Surface Expanded

The old single button:

- “Ask LLM”

was no longer sufficient.

The Time Machine diff surface was redesigned toward contextual actions.

New actions included:

- explain full diff
- explain selected hunk lines
- copy selected hunk lines
- restore file

This clarified operator intent and reduced ambiguity.

The direction now strongly favors:

> action surfaces that explicitly describe scope.

---

# File List Tightening

The Time Machine file list was visually compressed and stabilized.

Changes included:

- tighter row heights
- smaller padding
- denser grid layout
- cleaner selected-state styling

The file-list surface became more inspection-oriented and less oversized.

---

# Risk Card Color System Rebuilt

A major amount of time was spent repairing risk-card edge styling.

The original intention:

- safe = green
- review = blue
- evidence/danger = orange
- critical = red

However, older blue theme borders repeatedly leaked through layered overrides.

This exposed severe CSS entropy inside `App.css`.

Many generations of override systems accumulated:

- border-left systems
- inset box-shadow systems
- pseudo-element systems
- gradient systems
- layered override-kill systems

Eventually the entire edge system was rebuilt.

Final result:

- unified thick left/right risk rails
- fully color-matched borders
- deterministic pseudo-element rendering
- clean full-frame appearance

Final styling direction:

- left/right rails should visually match
- risk state should be immediately visible
- no theme-color leakage should remain

---

# CSS Entropy Identified

This session exposed a serious structural problem:

`App.css` had become layered with increasingly desperate override blocks.

Observed problems:

- duplicated selectors
- repeated Time Machine repair blocks
- repeated `.diff-actions`
- repeated `.change-card`
- repeated `.timeline-panel`
- conflicting pseudo-element ownership
- multiple abandoned repair generations

The file effectively became:

> historical CSS sediment.

This is now considered technical debt requiring architectural cleanup.

---

# Monolithic App.tsx Failure Point Reached

The biggest realization of the session:

`App.tsx` had become too large to safely evolve.

Observed symptoms:

- regex patch failures
- broken anchor detection
- invalid replacement ranges
- duplicated ownership
- accidental corruption during replacements
- extraction difficulty
- hard-to-reason state ownership

This directly violated Jarri doctrine:

> Investigate → Implement → Verify → Challenge → Document

because:

- ownership boundaries were unclear
- implementation targets were ambiguous
- verification became difficult
- patching became probabilistic

The conclusion became unavoidable:

> ChronoGit must now be modularized before further meaningful feature work continues.

---

# Mandatory Modularization Direction

A full modularization direction was formally established.

Future structure:

## Panels

- `TimeMachinePanel.tsx`
- `RemoteActionsPanel.tsx`
- `CommitPreflightPanel.tsx`
- `ChangeListsPanel.tsx`
- `LocalLlmPanel.tsx`
- `LlmLogPanel.tsx`
- `SystemLogPanel.tsx`
- `CurrentStatePanel.tsx`
- `RemoteStatusPanel.tsx`
- `NotesPanel.tsx`

## Components

- `DiffViewer.tsx`
- `ChangeCard.tsx`
- `RepoDropdown.tsx`
- `PanelDropdown.tsx`
- `ChronoDropdown.tsx`

## Libraries

- `diffUtils.ts`
- `gitLabels.ts`
- `state.ts`

## Types

- `chronogit.ts`

---

# App.tsx Future Role

`App.tsx` should become:

- shell/orchestrator
- state owner
- panel router
- workspace owner

It should NOT continue owning:

- panel implementation
- diff rendering
- dropdown behavior
- risk card rendering
- Time Machine rendering
- remote preview UI

The future direction is:

> App.tsx coordinates truth. Panels project truth.

---

# The Jarri Way Clarified

This session reinforced the need for deterministic development discipline.

Future ChronoGit work must explicitly follow:

1. Investigate
2. Implement
3. Verify
4. Challenge
5. Document

This now includes explicit rules:

- inspect before modifying
- avoid regex patch guessing
- reduce CSS override stacking
- reduce monolithic ownership
- verify after every extraction
- keep ownership boundaries clear
- App.tsx must shrink over time

---

# The c Command Formalized

The session also clarified correct usage of the `c` command.

Canonical usage patterns were documented.

Whole files:

    c src/App.tsx src/App.css

Raw command output:

    c -- <command>

Multi-command inspection:

    c -- bash -lc 'sed -n "..."; grep -n "..."'

This became important because deterministic investigation depends heavily on reliable extraction and inspection workflows.

---

# Architectural Insight

This session was partially successful technically, but extremely valuable architecturally.

It demonstrated:

- the strengths of ChronoGit’s direction
- the dangers of continued monolithic growth
- the need for deterministic ownership
- the importance of modular panels
- the importance of clean extraction boundaries

The strongest conclusion was:

> Feature growth is no longer the bottleneck.  
> Architecture is now the bottleneck.

---

# Current Strengths

ChronoGit now has:

- contextual diff rendering
- hunk-aware selection
- selected hunk explanation
- focused diff actions
- improved risk-card visualization
- stable Time Machine layout
- local-LLM-assisted Git inspection
- increasingly strong Git Workspace foundations

---

# Current Weaknesses

Still unresolved:

- monolithic App.tsx
- CSS entropy
- duplicated styling generations
- weak ownership boundaries
- oversized prop surfaces
- panel extraction incomplete
- reusable components not yet isolated
- state/type separation incomplete

---

# Strategic Direction

The next phase is now clear.

Do NOT continue feature growth inside monolithic files.

Instead:

1. split App.tsx
2. isolate panels
3. isolate reusable components
4. isolate types
5. isolate diff logic
6. consolidate CSS ownership
7. stabilize architecture
8. then continue feature growth

This is now considered mandatory technical groundwork.

---

# Final Principle

ChronoGit should evolve under this rule:

> deterministic ownership before feature expansion.

---

# Status

active
