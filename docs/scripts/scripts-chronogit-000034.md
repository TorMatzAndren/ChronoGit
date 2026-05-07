Title: SystemLogPanel.tsx
ID: scripts-chronogit-000034
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: system-log
Updated: 2026-05-07
Revision: 1

---

@role:ui-panel
@subsystem:system-log
@entity:script:chronogit-app/src/panels/SystemLogPanel.tsx
@entity:/chronogit-app/src/panels/SystemLogPanel.tsx
@semantic:system-log
@semantic:event-visibility
@semantic:operator-audit-surface
@semantic:session-events
@semantic:log-backup
@state:active

# SystemLogPanel.tsx

**Date:** 2026-05-07
**Summary:** Read-only operator-facing system event log panel for ChronoGit, supporting deterministic session event visibility, clipboard export, and log backup/clear workflows.
**Keywords:** system log, event log, audit surface, operator visibility, session history, log backup
**Tags:** scripts, frontend, react, logging, auditability, system-events, workspace

Deterministic system-event visibility surface for ChronoGit.

---

## Purpose

`SystemLogPanel.tsx` provides a visual projection layer for ChronoGit system event logs.

Responsibilities include:

- displaying system event entries
- exposing event severity visually
- supporting log backup workflows
- supporting log clearing workflows
- supporting clipboard copying of event messages
- reinforcing ChronoGit audit visibility doctrine

The panel acts as a deterministic operator-facing session event surface.

---

# Architectural Role

This component belongs to ChronoGit’s operational auditability layer.

It does not generate events.

It does not mutate repository state.

It does not perform Git operations.

It visualizes externally-maintained system log state.

The panel serves as a human-facing projection of ChronoGit runtime/session activity.

---

# Imports

Imports:

    SystemLogEntry

from:

    ../core/chronogitRuntimeTypes

---

# Props Type

Defines:

    type Props

Fields:

- `beginnerMode`
- `systemLog`
- `clearSystemLog`
- `backupAndClearSystemLog`
- `openLogBackupFolder`
- `ui`

---

## beginnerMode

Type:

    boolean

Purpose:

Controls beginner/pro terminology abstraction through the `ui()` helper.

---

## systemLog

Type:

    SystemLogEntry[]

Purpose:

Primary log-event dataset rendered by the panel.

Entries are externally maintained.

---

## clearSystemLog

Type:

    () => void

Purpose:

Clears in-memory/browser-persisted system log entries.

---

## backupAndClearSystemLog

Type:

    () => Promise<void>

Purpose:

Triggers backup/export workflow before clearing log state.

Represents safer audit-preserving deletion behavior.

---

## openLogBackupFolder

Type:

    () => Promise<void>

Purpose:

Opens filesystem location containing exported log backups.

---

## ui

Type:

    (beginnerMode, beginner, pro) => string

Purpose:

Provides terminology abstraction between:

- beginner language
- expert/pro Git terminology

---

# Root Container

Renders:

    <div className="cg-panel-content">

Purpose:

Standard ChronoGit panel content container.

---

# Toolbar Section

Renders:

    <div className="cg-action-row">

Contains operational log-management actions.

---

# Backup + Clear Button

Button action:

    backupAndClearSystemLog()

Behavior:

- exports log backup
- clears current log afterward

Disabled when:

    !systemLog.length

Meaning:

The action is unavailable if no events exist.

---

# Open Backup Folder Button

Button action:

    openLogBackupFolder()

Purpose:

Provides filesystem access to exported backup files.

Not disabled.

Meaning:

Backup directory remains accessible even without active log entries.

---

# Clear System Log Button

Button action:

    clearSystemLog()

Purpose:

Clears visible/current system log entries.

Disabled when:

    !systemLog.length

Meaning:

Unavailable if no events exist.

---

# Log Rendering

Conditional rendering:

- renders entries if log exists
- otherwise displays empty-state text

Empty-state text:

    No system log events yet.

---

# Event Entry Rendering

Each entry renders:

    <article className={`system-log-entry system-log-entry--${entry.level}`}

Purpose:

Severity-based visual event projection.

---

# Entry Fields

Each entry displays:

- severity level
- date
- message text

Fields:

    entry.level
    entry.date
    entry.message

---

# Severity Classes

Dynamic class:

    system-log-entry--${entry.level}

Expected levels originate from:

    SystemLogEntry.level

Known values from runtime types:

- info
- warning
- error
- action

Purpose:

Severity-specific styling and visibility emphasis.

---

# Clipboard Export

Each event exposes:

    navigator.clipboard.writeText(entry.message)

Purpose:

Quick extraction of event text for:

- debugging
- reporting
- sharing
- external audit notes

Only the message text is copied.

Not the full structured entry.

---

# Beginner/Pro Terminology Abstraction

The panel uses:

    ui(beginnerMode, beginner, pro)

for operator-facing button text.

Examples include:

Beginner:

    Backup log file + clear

Pro:

    export log + clear

---

# Truth, Projection, Mutation, and Advisory Boundaries

## Truth Inputs

Truth inputs are externally supplied:

- system log entries
- log management callbacks
- terminology helpers

No event generation occurs locally.

---

## Projection Responsibilities

Projection responsibilities include:

- event visualization
- severity projection
- log-state visibility
- operator audit presentation

---

## Mutation Behavior

Direct repository mutation does not exist.

The panel only affects:

- frontend/browser log persistence
- exported backup generation

No Git operations exist.

No filesystem repository mutations exist.

---

## Advisory Systems

No LLM integration exists.

No AI-generated interpretation exists.

No automatic summarization exists.

This is a deterministic truth/event surface only.

---

# Deterministic Audit Philosophy

The panel strongly reflects ChronoGit doctrine:

- visible operational state
- observable actions
- auditability
- deterministic transparency
- explicit operator control

The system log acts as:

- operational memory
- user-visible event stream
- mutation/event visibility layer

---

# React Characteristics

This component:

- is stateless
- uses no hooks
- performs no async logic internally
- delegates actions externally
- contains no local state
- is fully prop-driven

---

# CSS Dependencies

Depends on CSS classes:

- cg-panel-content
- cg-action-row
- system-log-entry
- system-log-entry--info
- system-log-entry--warning
- system-log-entry--error
- system-log-entry--action

---

# Design Characteristics

The panel is:

- deterministic
- operator-oriented
- audit-focused
- read-heavy
- event-centric
- non-graphical
- intentionally simple

---

# Current Known Gaps

- No timestamps beyond date field rendering
- No filtering system
- No search functionality
- No pagination
- No severity sorting
- No collapsible entries
- No structured metadata expansion
- No export-format selection
- No streaming/live animation
- No event grouping
- No persistence status indicator
- No auto-scroll behavior
- No structured JSON export surface
- No event-source categorization
- No diff visualization
- No linkable entries
- No event replay system
- No Timeline integration
- No Chrono-Field integration

None currently exist.

---

# Potential Future Expansion

Potential future improvements include:

- severity filtering
- structured event metadata
- searchable event history
- collapsible entries
- streaming event append
- live auto-scroll
- structured JSON export
- event categories
- event source attribution
- event persistence indicators
- timeline visualization
- Chrono-Field integration
- operation correlation
- mutation provenance mapping
- Git-operation linking
- diff/event cross-reference
- replayable event history

None currently exist.

---

# Deterministic UI Characteristics

The panel behaves deterministically because:

- all event data is externally supplied
- rendering is purely data-driven
- no hidden state exists
- no async polling exists internally
- no heuristics exist
- no interpretation layer exists

This preserves predictable operator-facing behavior.

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/SystemLogPanel.tsx`

No undocumented behavior has been inferred beyond directly observable source logic.

---

# Status

active
