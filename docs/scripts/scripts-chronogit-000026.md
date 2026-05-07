Title: LlmLogPanel.tsx
ID: scripts-chronogit-000026
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: llm-observability
Updated: 2026-05-07
Revision: 1

---

@role:ui-panel
@subsystem:llm-observability
@entity:script:chronogit-app/src/panels/LlmLogPanel.tsx
@entity:/chronogit-app/src/panels/LlmLogPanel.tsx
@semantic:llm-auditability
@semantic:local-llm
@semantic:response-history
@semantic:streaming-output
@semantic:operator-observability
@semantic:clipboard-export
@state:active

# LlmLogPanel.tsx

**Date:** 2026-05-07
**Summary:** UI panel for deterministic inspection, backup, export, collapse management, and clipboard interaction of ChronoGit local LLM advisory responses.
**Keywords:** LLM log, observability, advisory responses, streaming output, audit trail
**Tags:** scripts, frontend, react, llm, observability, auditability, logging

LLM response observability panel for ChronoGit.

---

## Purpose

`LlmLogPanel.tsx` provides a deterministic inspection surface for local LLM outputs generated during ChronoGit operation.

The panel exposes:

- historical LLM responses
- streaming response visibility
- advisory output inspection
- response collapse/expand control
- clipboard export
- backup/export workflows
- log clearing operations

This panel is part of ChronoGit’s auditability and truth-separation doctrine.

---

# Architectural Role

This component belongs to ChronoGit’s LLM observability and advisory audit layer.

ChronoGit explicitly separates:

- Git truth
- LLM advisory interpretation

This panel exists to ensure all LLM-generated explanations remain:

- inspectable
- reviewable
- exportable
- removable
- non-authoritative

The panel provides visibility into advisory AI behavior without allowing the LLM layer to become hidden system state.

---

# Props Definition

Defines:

    type Props

Fields:

- `beginnerMode`
- `llmLog`
- `toggleLlmEntry`
- `clearLlmLog`
- `backupAndClearLlmLog`
- `openLogBackupFolder`
- `ui`

---

## beginnerMode

Type:

    boolean

Purpose:

Controls beginner/pro terminology rendering.

Used through:

    ui(beginnerMode, beginner, pro)

---

## llmLog

Type:

    LlmLogEntry[]

Purpose:

Provides the complete visible LLM response history.

Entries are rendered sequentially.

---

## toggleLlmEntry

Type:

    (id: string) => void

Purpose:

Toggles collapse/expanded state for an individual LLM entry.

---

## clearLlmLog

Type:

    () => void

Purpose:

Clears visible LLM log state.

---

## backupAndClearLlmLog

Type:

    () => Promise<void>

Purpose:

Triggers persistent backup/export before clearing the log.

This preserves auditability while allowing cleanup.

---

## openLogBackupFolder

Type:

    () => Promise<void>

Purpose:

Opens the filesystem backup directory containing exported LLM logs.

---

## ui

Type:

    (beginnerMode: boolean, beginner: string, pro: string) => string

Purpose:

Provides dual-language UI terminology abstraction.

---

# Root Container

Renders:

    <div className="cg-panel-content cg-llm-log-panel">

Purpose:

Defines the panel’s main content surface.

---

# Action Controls

The panel begins with a control/action row.

Container:

    <div className="cg-action-row">

---

## Backup + Clear

Button:

    Backup log file + clear

Expert label:

    export log + clear

Behavior:

Calls:

    backupAndClearLlmLog()

---

### Purpose

Provides deterministic archival/export before destructive log removal.

This aligns with ChronoGit’s preservation-first doctrine.

---

## Open Backup Folder

Button:

    Open backup folder

Expert label:

    open backup dir

Behavior:

Calls:

    openLogBackupFolder()

---

### Purpose

Allows operator access to exported LLM log artifacts.

Supports:

- external review
- archival inspection
- provenance preservation
- audit workflows

---

## Clear LLM Log

Button:

    Clear LLM log

Expert label:

    clear llm log

Behavior:

Calls:

    clearLlmLog()

Disabled when:

    !llmLog.length

---

### Purpose

Removes active in-memory/localStorage advisory log visibility.

This affects projection/log state only.

Git truth remains unaffected.

---

# Empty-State Handling

If:

    !llmLog.length

renders:

    No LLM responses yet.

---

## Purpose

Provides explicit empty-state visibility instead of silent absence.

---

# Entry Rendering

Each LLM entry renders as:

    <article className="llm-log-entry">

Additional class:

    llm-log-entry--streaming

is applied when:

    entry.streaming

is true.

---

# Streaming-State Visibility

## Purpose

Provides visible differentiation between:

- completed outputs
- actively streaming outputs

This is important for operator awareness during incremental LLM response generation.

---

# Entry Header

Header button:

    llm-log-entry__header

Contains:

- collapse indicator
- title
- timestamp/streaming indicator

---

## Collapse Indicator

Displays:

    ▶

when collapsed.

Displays:

    ▼

when expanded.

---

## Title

Displays:

    entry.title

Purpose:

Human-readable advisory context label.

Examples may include:

- diff explanation
- UI explanation
- remote operation interpretation
- preflight explanation

---

## Timestamp / Streaming Status

Displays:

    streaming

while active.

Otherwise displays:

    entry.timestamp

---

# Expand / Collapse Behavior

Clicking the header triggers:

    toggleLlmEntry(entry.id)

---

## Purpose

Allows operators to manage log density and inspect individual advisory outputs selectively.

---

# Metadata Surface

Each entry renders:

    llm-log-entry__meta

Containing:

- timestamp
- source
- model

---

## Timestamp

Displays:

    entry.timestamp

Purpose:

Chronological observability.

---

## Source

Displays:

    entry.source

Source values originate from:

    LlmLogEntry.source

Known sources include:

- diff
- ui
- remote
- preflight
- system_log

---

## Model

Displays:

    entry.model

Wrapped in:

    <code>

Purpose:

Makes the exact advisory model visible.

This supports reproducibility and auditability.

---

# Content Rendering

If entry is expanded:

    !entry.collapsed

renders:

    <pre>{entry.content}</pre>

Fallback:

    Waiting for local LLM output...

---

## Purpose

Displays raw advisory response output exactly as stored.

The `<pre>` block preserves formatting and whitespace.

This avoids hidden rendering transformations.

---

# Clipboard Export

Each entry includes:

    Copy message

Expert label:

    clipboard.writeText

Behavior:

Calls:

    navigator.clipboard.writeText(entry.content)

---

## Purpose

Provides direct operator export/copy workflow for:

- sharing explanations
- archival storage
- external analysis
- documentation
- debugging

---

# Truth vs Advisory Separation

This panel is architecturally important because it reinforces ChronoGit’s doctrine:

    Git is truth.
    LLMs are advisory.

The panel intentionally exposes all LLM outputs visibly rather than allowing hidden AI interpretation layers.

---

# Observability Doctrine

The panel supports:

- deterministic auditability
- operator oversight
- advisory provenance
- AI transparency
- exportable explanation history

ChronoGit treats AI explanations as inspectable artifacts.

---

# React Characteristics

This component:

- is prop-driven
- contains no local state
- contains no hooks
- performs no direct persistence
- performs no backend invocation itself
- performs no async orchestration internally

Async behavior is delegated upward via props.

---

# Persistence Relationship

Persistence is externally managed.

This panel only consumes:

    llmLog

and invokes external handlers.

Persistence likely flows through:

- localStorage
- exported JSON backups
- filesystem backup folders

based on surrounding ChronoGit architecture.

---

# Clipboard Dependency

Uses browser clipboard API:

    navigator.clipboard.writeText()

Purpose:

Direct export of advisory responses.

---

# CSS Dependencies

Depends on CSS classes including:

- cg-panel-content
- cg-llm-log-panel
- cg-action-row
- llm-log-entry
- llm-log-entry--streaming
- llm-log-entry__header
- llm-log-entry__meta

Additional styles likely include:

- expandable entry formatting
- streaming-state highlighting
- metadata styling
- preformatted content rendering
- action-row layout

No component-local CSS import exists.

---

# Separation of Concerns

This component handles:

- advisory log rendering
- entry collapse state interaction
- clipboard export initiation
- backup workflow initiation
- streaming visibility
- metadata observability

It does not handle:

- LLM execution
- model inference
- streaming transport
- persistence implementation
- filesystem export implementation
- log generation
- Git operations
- diff generation
- AI orchestration

---

# Current Known Gaps

- No filtering exists.
- No search exists.
- No grouping exists.
- No pagination exists.
- No syntax highlighting exists.
- No markdown rendering exists.
- No timestamp sorting controls exist.
- No pinning/favorites exist.
- No token-count visibility exists.
- No performance metrics exist.
- No export-format selection exists.
- No multi-select operations exist.

---

# Potential Future Expansion

Potential future improvements include:

- searchable advisory history
- token usage metrics
- streaming performance telemetry
- export-format selection
- markdown-aware rendering
- syntax highlighting
- pinned entries
- source filtering
- model grouping
- timeline integration
- provenance chain visualization
- AI session replay
- diff-linked navigation

None currently exist.

---

# Design Characteristics

The component is:

- deterministic
- observability-focused
- audit-oriented
- operator-centric
- advisory-transparent
- export-aware
- provenance-friendly

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/LlmLogPanel.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
