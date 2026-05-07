Title: persistence.ts
ID: scripts-chronogit-000008
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: persistence
Updated: 2026-05-07
Revision: 1

---

@role:persistence-layer
@subsystem:persistence
@entity:script:chronogit-app/src/core/persistence.ts
@entity:/chronogit-app/src/core/persistence.ts
@semantic:local-persistence
@semantic:browser-storage
@semantic:log-persistence
@semantic:backup-export
@semantic:patch-backup
@semantic:localstorage
@semantic:tauri-backup-bridge
@semantic:frontend-storage
@semantic:json-export
@state:active

# persistence.ts

**Date:** 2026-05-07
**Summary:** Frontend persistence and backup layer for ChronoGit. Provides localStorage-backed persistence for LLM logs and system logs, deterministic JSON export generation, patch backup export support, and Tauri bridge integration for writing backup files through the backend backup subsystem.
**Keywords:** persistence, localStorage, backup export, patch backup, log persistence, JSON export, Tauri invoke, frontend storage
**Tags:** scripts, persistence, frontend, localstorage, backup-system, llm-log, system-log, export-layer

Frontend persistence and backup export layer for ChronoGit.

---

## Purpose

`persistence.ts` provides frontend-side persistence and export functionality.

Responsibilities include:

- loading persisted logs
- saving logs into browser localStorage
- exporting logs into backup files
- exporting patch/diff files
- invoking backend backup-write commands
- backup filename generation

This file acts as the persistence bridge between:

- frontend runtime state
- browser storage
- backend backup filesystem writes

---

## Architectural Role

This file forms the frontend persistence subsystem for:

- LLM logs
- system logs
- diff backups
- export archives

It separates:

- storage concerns
- backup serialization
- export naming
- persistence validation

from:

- UI rendering
- Git operations
- backend filesystem mutation

---

## Imported Dependencies

Imports:

    invoke

from:

    @tauri-apps/api/core

Imports runtime type contracts:

- `LlmLogEntry`
- `SystemLogEntry`

from:

    ./chronogitRuntimeTypes

---

# Storage Keys

## LLM_LOG_STORAGE_KEY

Constant:

    const LLM_LOG_STORAGE_KEY = "chronogit_llm_log_v1";

Purpose:

Persistent browser storage key for local LLM explanation history.

---

## SYSTEM_LOG_STORAGE_KEY

Constant:

    const SYSTEM_LOG_STORAGE_KEY = "chronogit_system_log_v1";

Purpose:

Persistent browser storage key for ChronoGit system log history.

---

## Versioning Strategy

Both storage keys include explicit version suffixes:

    _v1

This establishes migration/version boundary capability for future schema evolution.

---

# Backup Filename Generation

## backupFilename()

Signature:

    function backupFilename(kind)

Supported kinds:

- `llm-log`
- `system-log`

---

## Filename Format

Generated format:

    chronogit-<kind>-<timestamp>.json

Timestamp source:

    new Date().toISOString()

Unsafe filename characters replaced:

- `:`
- `.`

with:

    -

This produces filesystem-safe ISO-style timestamps.

---

# Backend Backup Bridge

## saveBackupFile()

Signature:

    async function saveBackupFile(...)

Invokes backend command:

    save_log_backup

Arguments:

- filename
- body

Returns:

    Promise<string>

---

## Architectural Role

This function forms the frontend bridge into the backend filesystem backup subsystem.

Frontend code never writes backup files directly to disk.

All writes pass through the Tauri backend boundary.

---

# Backup Folder Opening

## openLogBackupFolder()

Signature:

    export async function openLogBackupFolder()

Invokes backend command:

    open_log_backup_folder

Returns:

    Promise<string>

Purpose:

Requests OS-level opening of the ChronoGit backup folder.

---

# LLM Log Persistence

## loadLlmLog()

Signature:

    export function loadLlmLog()

Returns:

    LlmLogEntry[]

Purpose:

Loads persisted LLM log history from localStorage.

---

## Validation Logic

Validation steps:

1. read localStorage value
2. parse JSON
3. verify array structure
4. validate required entry fields
5. filter invalid entries

Required fields:

- id
- timestamp
- source
- model
- title
- content

---

## Failure Behavior

On any parsing or validation failure:

    return []

No exceptions propagate upward.

This creates fault-tolerant persistence behavior.

---

## saveLlmLog()

Signature:

    export function saveLlmLog(...)

Behavior:

Stores serialized LLM log entries into localStorage.

Uses:

    JSON.stringify(entries)

---

# LLM Log Backup Export

## backupLlmLog()

Signature:

    export async function backupLlmLog(...)

Purpose:

Exports persisted LLM logs into formatted JSON backup files.

---

## Export Structure

Generated backup structure:

- exported_at
- kind
- entries

Kind value:

    chronogit_llm_log_backup

---

## JSON Formatting

Uses:

    JSON.stringify(..., null, 2)

This produces human-readable formatted backup files.

---

# System Log Persistence

## loadSystemLog()

Signature:

    export function loadSystemLog()

Returns:

    SystemLogEntry[]

Purpose:

Loads persisted ChronoGit system log history from localStorage.

---

## Validation Requirements

Required validated fields:

- id
- date
- time
- level
- message

Invalid entries are filtered out.

---

## Failure Handling

Any parse failure or malformed structure returns:

    []

No exceptions propagate into the UI layer.

---

## saveSystemLog()

Signature:

    export function saveSystemLog(...)

Purpose:

Stores system log history into browser localStorage.

---

# System Log Backup Export

## backupSystemLog()

Signature:

    export async function backupSystemLog(...)

Purpose:

Exports system logs into deterministic JSON backup files.

---

## Export Metadata

Generated metadata:

- exported_at
- kind
- entries

Kind value:

    chronogit_system_log_backup

---

# Patch Backup Export

## backupPatchFile()

Signature:

    export async function backupPatchFile(...)

Arguments:

- filenameStem
- diff

Purpose:

Exports raw patch/diff data into `.patch` backup files.

---

## Timestamped Patch Naming

Generated format:

    <safeStem>-<timestamp>.patch

Timestamp format uses ISO date conversion with filesystem-safe replacement.

---

## Filename Sanitization

Sanitization rules:

- trims whitespace
- replaces non `[a-zA-Z0-9._-]` characters with `-`
- trims leading/trailing dashes

Fallback filename:

    chronogit-diff

---

## Patch Export Role

This function allows:

- raw diff preservation
- manual patch review
- external archival
- deterministic patch export

without requiring Git bundle export behavior.

---

# Browser Storage Boundary

This file uses:

    localStorage

as the frontend persistence layer.

No IndexedDB usage exists.

No external database exists.

---

# Frontend / Backend Separation

Frontend responsibilities:

- serialization
- validation
- local browser persistence
- export preparation

Backend responsibilities:

- filesystem writes
- backup directory management
- OS folder opening

---

# Persistence Characteristics

The persistence model is:

- local-only
- browser-local
- JSON-based
- schema-filtered
- fault-tolerant
- version-keyed

---

# Backup Characteristics

Backup exports are:

- deterministic
- timestamped
- human-readable
- filesystem-safe
- backend-mediated

---

# Runtime Safety Characteristics

The persistence layer includes:

- malformed JSON protection
- array structure validation
- field existence filtering
- fallback empty-array behavior
- filename sanitization

---

# No Mutation of Git State

This file does not:

- mutate repositories
- execute Git commands
- modify snapshots
- alter remote state

It only persists/export frontend runtime information.

---

# Relationship to Runtime Types

This file depends on:

    chronogitRuntimeTypes.ts

for persistence structure validation.

The runtime types define the schema expectations for persisted entries.

---

# Persistence Domains

## LLM Log Domain

Persistent LLM explanation history.

---

## System Log Domain

Persistent ChronoGit operational/system history.

---

## Patch Backup Domain

Manual/exported raw diff preservation.

---

# Dependencies

Imports:

- `@tauri-apps/api/core`
- `./chronogitRuntimeTypes`

No React dependency exists.

No UI rendering exists.

---

# Design Characteristics

The persistence layer is:

- frontend-local
- JSON-oriented
- export-capable
- backend-mediated
- validation-filtered
- persistence-focused
- deterministic in structure

---

# Current Known Gaps

- No compression exists for large logs.
- No storage quota management exists.
- No migration framework exists beyond storage key versioning.
- No encryption exists for exported logs.
- No integrity hashing exists for backups.
- No backup deduplication exists.
- No backup manifest/index exists.
- No partial log loading exists.
- No pagination exists for large persisted histories.
- localStorage corruption simply resets data to empty arrays.
- No retention policy exists for browser-stored logs.

---

# Verification Notes

This document is based on full-file inspection of:

- `src/core/persistence.ts`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
