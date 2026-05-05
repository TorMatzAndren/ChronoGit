Title: ChronoGit v0.5 – Remote Safety, Logs, Auto-Refresh, Branding, and the Shift Toward Layered Inspection
ID: devlog-chronogit-000002
Date: 2026-05-05
Author: Matz
Type: devlog
Subsystem: chronogit
Updated: 2026-05-05
Revision: 1

---

@role:devlog
@subsystem:chronogit
@scope:v0.5-snapshot
@scope:remote-safety
@scope:remote-preview
@scope:controlled-execution
@scope:system-log
@scope:llm-log
@scope:auto-refresh
@scope:branding
@scope:ui-cleanup
@scope:layered-ux
@scope:focus-mode-direction
@scope:dual-language-direction
@entity:chronogit-app/src/App.tsx
@entity:chronogit-app/src/App.css
@entity:chronogit-app/src-tauri/src/lib.rs
@entity:chronogit-app/src/assets/jarri-logo.png
@entity:docs/scripts/scripts-chronogit-000001.md
@entity:docs/scripts/scripts-chronogit-000002.md
@state:active

# ChronoGit v0.5 – Remote Safety, Logs, Auto-Refresh, Branding, and the Shift Toward Layered Inspection

**Date:** 2026-05-05  
**Summary:** ChronoGit advanced from a standalone Git cognition interface into a v0.5 identity snapshot with remote safety previews, guarded push/pull execution, operation-state detection, persistent logs, auto-refresh, improved branding, and a cleaned UI surface. This devlog records both the implemented system changes and the decision to move future development away from stacked panels and toward contextual Focus Mode.

---

## Context

The previous devlog recorded the breakaway from Jarri Workspace into a standalone ChronoGit application.

At that point, ChronoGit had already established:

- Working files → Prepared changes → Snapshot
- deterministic frontend/backend separation
- Time Machine history inspection
- commit preflight
- local Ollama explanations
- basic repository and remote awareness

The current work moved ChronoGit further into a coherent standalone product.

The main concern was no longer whether ChronoGit could exist independently.

The concern became:

> How does ChronoGit gain power without turning into another cluttered Git GUI?

---

## Major Implemented Changes

### 1. Remote Awareness Became Operational

Remote awareness moved beyond basic display.

ChronoGit now models:

- remote name
- remote URL
- branch
- upstream
- ahead count
- behind count
- sync state:
  - LOCAL ONLY
  - IN SYNC
  - AHEAD
  - BEHIND
  - DIVERGED

This made the local/shared boundary explicit.

This is important because Git beginners often misunderstand whether a commit is local or published. ChronoGit now shows that distinction continuously.

---

### 2. Remote Preview Was Added

ChronoGit now supports previewing remote operations before execution.

Upload preview uses:

- `@{u}..HEAD`

Download preview uses:

- `HEAD..@{u}`

The preview surface shows:

- operation direction
- branch/upstream
- ahead/behind
- commits in that direction
- changed files in that direction
- consequence statement
- warning statement

This created a new ChronoGit pattern:

> Remote actions are not buttons. They are decisions with visible consequences.

---

### 3. Merge Safety Prediction Was Added

A deterministic merge-safety prediction layer was added.

It compares:

- local-only touched files
- remote-only touched files
- shared/overlapping paths
- current working-folder changes

Classifications:

- NEEDS REVIEW
- ONE-WAY
- LIKELY CLEAN

Risk levels:

- LOW
- MEDIUM
- HIGH

Risk rules:

- same-path overlap + working changes → HIGH
- same-path overlap or working changes → MEDIUM
- otherwise → LOW

This is not a replacement for Git. It is a pre-merge reasoning layer.

Hard rule:

> Git remains authoritative. ChronoGit prediction is advisory safety context.

---

### 4. Safe Push Execution Was Implemented

ChronoGit gained real `git push` execution.

The push implementation deliberately does not support force push.

Push rules:

- branch must be ahead
- HIGH risk requires `override`
- diverged or MEDIUM-risk upload requires confirmation
- plain `git push` only
- no pull, merge, rebase, or force behavior during upload

The UI implements a two-step safety model:

1. acknowledge preview only
2. execute push for the exact acknowledged preview

This prevents accidental execution and makes preview/execution separation visible.

This was a major transition:

> ChronoGit became a controlled execution layer, not only an observation layer.

---

### 5. Pull/Rebase Execution and Abort Handling Were Added

ChronoGit gained guarded download execution through:

- `git pull --rebase --autostash`

Safety gates:

- remote must be ahead
- HIGH-risk diverged download requires override
- MEDIUM risk requires confirmation

Abort support:

- `git rebase --abort`

The UI exposes Abort Rebase as a safety/emergency action when rebase state is detected.

This is the most dangerous remote surface currently present and remains intentionally guarded.

---

### 6. Operation-State Detection Was Added

The backend now detects interrupted Git operation states.

Detected states:

- rebase in progress
- merge in progress
- cherry-pick in progress
- revert in progress
- unresolved conflicted files

Detection uses `.git` state markers and conflict file detection.

The UI displays an operation-state banner when necessary and surfaces conflicted files.

This prevents hidden Git operation states from confusing later actions.

---

### 7. System Log Was Added and Refined

ChronoGit now has a persistent deterministic System Log.

Features:

- localStorage persistence
- newest-first display
- date/time split display
- per-entry copy
- per-entry LLM explanation
- filter chips:
  - all
  - action
  - warning
  - error
  - info
- refresh spam suppression
- duplicate message collapse

This created a session-level observability surface.

The System Log is not Git history. It records ChronoGit session events.

---

### 8. LLM Response Log Was Added

LLM output was moved out of scattered UI panels into a dedicated LLM Responses surface.

This improved the architecture:

- deterministic events go to System Log
- advisory LLM output goes to LLM Responses

This separation strengthens a core ChronoGit rule:

> Git truth and system events must not be mixed with LLM interpretation.

---

### 9. Auto-Refresh Was Added

ChronoGit now polls for repository state changes and refreshes when a deterministic state signature changes.

The signature includes:

- branch
- staged files
- working files
- remote state
- operation state

This solved the problem where new files did not appear until manual refresh.

The auto-refresh loop avoids action interference by skipping refresh while:

- a file action is busy
- a remote action is busy
- a confirmation modal is open
- preflight is open

This makes the interface feel alive without silently mutating anything.

---

### 10. UI Cleanup and Branding Pass

The top area was cleaned up significantly.

Removed or consolidated:

- verbose title text
- scattered beginner explanation banners
- redundant remote meaning blocks
- noisy stacked state cards

Added:

- Jarri logo asset
- ChronoGit product title
- cleaner current-state card
- compact flow strip
- external browser buttons for:
  - Jarri website
  - GitHub profile

External links are routed through a backend allowlist and OS default browser command rather than relying on normal webview links.

The UI now feels more like an office than a construction site.

---

### 11. Diff Scope Clarity Was Added

Time Machine diffs now include an explicit diff scope card.

It shows:

- diff scope
- snapshot
- selected file

Current scope is:

> selected snapshot vs parent

This matters because Git confusion often starts with unclear comparison boundaries.

ChronoGit now makes the diff question explicit:

> What exactly am I comparing?

---

### 12. Script Documentation Was Updated

The existing script docs were brought up to date.

Updated:

- `scripts-chronogit-000001.md`
- `scripts-chronogit-000002.md`

The previous descriptions no longer matched reality because ChronoGit had gained:

- remote preview
- remote execution
- operation-state detection
- persistent logs
- LLM log
- auto-refresh
- external URL allowlist
- branding asset
- system log filtering

The documentation now matches the actual code surfaces.

---

## v0.5 Identity Snapshot

A deliberate decision was made to freeze ChronoGit’s current identity before the next direction shift.

ChronoGit v0.5 is defined as:

> A deterministic, safety-first Git interface that makes state, intent, and consequences visible before actions are executed.

Core model remains:

Working files → Prepared changes → Snapshot

Current primary surfaces:

- truth strip
- current state card
- commit preflight
- working/prepared change cards
- Time Machine
- remote synchronization preview
- System Log
- LLM Responses

This snapshot is important because the next phase will introduce deeper inspection features. Without an identity baseline, ChronoGit could drift into panel-heavy feature creep.

---

## Backup and Tagging Decision

A separate v0.5 folder backup was planned:

- `~/projects/ChronoGit-v0.5`

A Git tag was also planned:

- `chronogit-v0.5`

The purpose is to preserve a stable reference point before moving into new UX architecture.

---

## Strategic Design Shift

The largest conceptual change in this session was not a single feature.

It was the decision that ChronoGit must not grow by stacking more panels.

The new direction:

> ChronoGit should not show more. It should reveal more.

This establishes a layered model:

### 1. Surface Layer

Always visible:

- working/prepared/remote truth
- current state
- Time Machine
- logs

### 2. Focus Layer

Contextual expansion triggered by user intent:

- selected commit
- selected file
- selected comparison
- selected log entry

### 3. Deep Analysis Layer

On-demand inspection:

- A ↔ B comparison
- file evolution
- LLM comparison explanation
- minimal contextual graph views

This is directly inspired by Jarri Pipeline and Chrono-Field thinking:

> navigate truth through focus, not through panel clutter.

---

## Future Direction: Focus Mode

Focus Mode was identified as the correct next major UX construct.

Purpose:

- avoid panel creep
- support deep inspection
- keep the main UI stable
- let advanced features appear only when context demands them

Potential triggers:

- click commit
- select two commits
- click file
- explain log entry
- inspect remote divergence

Focus Mode should replace or expand contextually, not create another permanent dashboard.

---

## Future Direction: A ↔ B Comparison

A ↔ B comparison was identified as a high-value next feature.

Current Time Machine only supports:

- selected commit vs parent

Future comparison should support:

- selected commit A vs selected commit B
- changed files between A and B
- insertion/deletion summary
- diff viewer reuse
- LLM explanation aware of comparison scope

This is important because LLM diff explanation should not be limited to “since last commit.”

The comparison system should pass structured context:

- comparison type
- commit A
- commit B
- changed files
- raw diff
- stats

---

## Future Direction: File Evolution

Instead of starting with Git blame, ChronoGit should implement file evolution.

File evolution means:

- select a file
- show commits that changed it
- compare versions
- optionally explain evolution via LLM

This is more aligned with ChronoGit than raw blame because it emphasizes temporal understanding, not attribution alone.

---

## Future Direction: Minimal Graphs

ChronoGit can borrow from Jarri Pipeline and Chrono-Field to build excellent graph tools.

However, graph display must be contextual.

Allowed:

- divergence explanation
- focused commit relationship view
- minimal structural comparison

Not allowed yet:

- permanent graph panel
- full GitKraken-style graph clone
- visual complexity without decision value

The guiding principle is:

> graph appears when it clarifies state.

---

## Future Direction: Dual-Language UI

Beginner Mode currently exists, but the entire UI has not yet been formalized into a dual-language layer.

Planned model:

- Beginner Mode uses teaching language
- Advanced Mode uses Git-native language
- behavior remains identical

Examples:

| Beginner | Advanced |
|---|---|
| Prepare for commit | git add |
| Remove from next commit | git restore --staged |
| Snapshot | commit |
| Upload snapshots | git push |
| Download updates | git pull --rebase |

This must not become feature divergence.

Rule:

> one UI, two languages, zero behavior split.

---

## Current Strengths

ChronoGit now has several strong differentiators:

- snapshot preflight before commit
- explicit local/shared state
- remote preview before sync
- merge safety prediction
- two-step push execution
- operation-state detection
- deterministic System Log
- separated LLM Responses
- local-only LLM explanations
- auto-refresh without hidden mutation
- clean v0.5 identity surface

---

## Current Weaknesses

Still missing:

- A ↔ B comparison
- file evolution
- minimal commit graph / divergence graph
- side-by-side diff mode
- full dual-language terminology system
- conflict resolution assistance beyond detection/abort
- branch management
- stash support

These are not all urgent.

The priority is to extend ChronoGit without compromising clarity.

---

## Important Design Constraint

ChronoGit will not try to win over advanced CLI users.

CLI remains faster for users who already know exactly what they are doing.

ChronoGit’s value is different:

- clarity
- safety
- learning
- consequence visibility
- inspection
- controlled execution

ChronoGit should serve users who want to understand Git reality before acting.

---

## Final Insight

The session established ChronoGit v0.5 as a coherent product surface.

It now has enough power to be useful, but enough restraint to remain understandable.

The next risk is not missing features.

The next risk is clutter.

Therefore the next phase must follow the rule:

> Everything is simple by default, but nothing is shallow.

---

## Status

active
