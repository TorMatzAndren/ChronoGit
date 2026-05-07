Title: NotesPanel.tsx
ID: scripts-chronogit-000028
Date: 2026-05-07
Author: Matz
Type: scripts
Subsystem: operator-notes
Updated: 2026-05-07
Revision: 1

---

@role:ui-panel
@subsystem:operator-notes
@entity:script:chronogit-app/src/panels/NotesPanel.tsx
@entity:/chronogit-app/src/panels/NotesPanel.tsx
@semantic:operator-notes
@semantic:local-persistence
@semantic:browser-storage
@semantic:workspace-panels
@semantic:confirmation-flow
@semantic:local-only
@state:active

# NotesPanel.tsx

**Date:** 2026-05-07
**Summary:** Local operator notes panel for ChronoGit. Provides browser-local note creation, selection, editing, saving, deletion confirmation, and localStorage persistence without touching Git history or repository files.
**Keywords:** operator notes, local notes, browser storage, workspace panel, localStorage
**Tags:** scripts, frontend, react, notes, local-persistence, workspace-panel

Local operator notes panel for ChronoGit.

---

## Purpose

`NotesPanel.tsx` provides a local note-taking surface inside ChronoGit.

Responsibilities include:

- loading notes from browser localStorage
- creating notes
- selecting active notes
- editing draft note content
- saving note content
- deriving note titles from body text
- deleting notes through confirmation flow
- preserving notes locally outside Git history

This panel is an operator annotation surface.

---

# Architectural Role

This component belongs to ChronoGit’s operator-notes and local workspace annotation layer.

It does not interact with Git.

It does not write repository files.

It does not create commits.

It stores notes in browser localStorage only.

---

# Imported Dependencies

Imports React hooks:

- `useEffect`
- `useMemo`
- `useState`

Imports type:

- `ConfirmAction`

from:

    ../core/chronogitRuntimeTypes

---

# Note Type

Defines local type:

    Note

Fields:

- `id`
- `title`
- `body`
- `updatedAt`

---

## id

Type:

    string

Purpose:

Local note identity.

Generated from timestamp and random suffix for new notes.

---

## title

Type:

    string

Purpose:

Human-readable note title.

Derived from body content on save.

---

## body

Type:

    string

Purpose:

Editable note content.

---

## updatedAt

Type:

    string

Purpose:

Human-readable local timestamp for last save/create time.

Uses:

    new Date().toLocaleString()

---

# Props Type

Defines:

    type Props

Fields:

- `setConfirmAction`

---

## setConfirmAction

Type:

    (action: ConfirmAction | null) => void

Purpose:

Connects note deletion to ChronoGit’s shared confirmation modal system.

---

# Storage Key

Defines:

    NOTES_STORAGE_KEY = "chronogit_notes_v1"

Purpose:

Browser localStorage key for ChronoGit operator notes.

The `_v1` suffix establishes a version boundary for future schema migration.

---

# loadNotes

## Signature

    function loadNotes(): Note[]

Purpose:

Loads notes from browser localStorage.

---

## Load Behavior

Steps:

1. read `chronogit_notes_v1`
2. return empty array if absent
3. parse JSON
4. require parsed value to be an array
5. map entries into normalized `Note` objects
6. return empty array on any failure

---

## Normalization Behavior

Each loaded note is normalized with:

- string ID
- fallback title
- string body
- string updatedAt

Fallbacks:

- missing ID → `note-${Date.now()}`
- missing title → `Untitled note`
- missing body → empty string
- missing updatedAt → empty string

---

# titleFromBody

## Signature

    function titleFromBody(body: string)

Purpose:

Derives note title from note body.

---

## Behavior

- trims body
- splits by newline
- finds first non-empty line
- returns `Untitled note` if no content exists
- truncates titles longer than 48 characters
- appends ellipsis when truncated

This creates lightweight automatic note titling.

---

# NotesPanel Component

## Export

Exports:

    NotesPanel

---

# Internal State

## notes

Definition:

    const [notes, setNotes] = useState<Note[]>(() => loadNotes())

Purpose:

Stores all loaded operator notes.

---

## activeNoteId

Definition:

    const [activeNoteId, setActiveNoteId] = useState<string>(() => loadNotes()[0]?.id || "")

Purpose:

Tracks selected note.

Important detail:

    loadNotes()

is called separately for `notes` and `activeNoteId` initialization.

---

## draft

Definition:

    const [draft, setDraft] = useState("")

Purpose:

Stores current editable textarea content.

---

# Active Note Resolution

Uses:

    useMemo

to compute:

    activeNote

from:

- `notes`
- `activeNoteId`

Returns:

- matching note
- `null` if not found

---

# Persistence Effect

Effect:

    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes))

Runs when:

    notes

changes.

Purpose:

Persists note list into browser localStorage.

---

# Draft Synchronization Effect

Effect:

    setDraft(activeNote?.body || "")

Runs when:

    activeNote?.id

changes.

Purpose:

Loads selected note body into editable draft state.

---

# createNote

## Purpose

Creates a new empty note and selects it.

---

## Behavior

Creates note with:

- generated ID
- title `Untitled note`
- empty body
- `updatedAt` from `new Date().toLocaleString()`

Then:

- prepends note to note list
- sets it active

---

# saveNote

## Purpose

Saves current draft content into active note or creates a new note if no active note exists.

---

## Behavior When No Active Note Exists

Creates a new note with:

- generated ID
- title from `titleFromBody(draft)`
- body from draft
- updatedAt timestamp

Then:

- prepends it
- selects it

---

## Behavior When Active Note Exists

Updates matching note:

- title from `titleFromBody(draft)`
- body from draft
- updatedAt timestamp

Other notes remain unchanged.

---

# deleteNote

## Purpose

Requests deletion of the active note through shared confirmation flow.

---

## Guard

If no active note exists:

    return

---

## Confirmation Action

Calls:

    setConfirmAction(...)

with:

- title: `Delete note`
- danger: `true`
- confirmLabel: `Delete note`
- body explaining deletion scope
- async action that removes the note

---

## Deletion Scope Text

The confirmation body explicitly states:

- deletion affects local browser storage
- deletion does not touch Git history
- deletion does not touch repository files

This is an important safety/truth boundary.

---

## Confirmed Delete Behavior

On confirmation:

- filters deleted note out of notes
- sets active note to first remaining note
- clears active note if no notes remain

---

# Root Panel Container

Renders:

    <div className="cg-panel-content cg-notes-panel">

Purpose:

Panel content wrapper for operator notes UI.

---

# Toolbar

Renders:

    cg-notes-panel__toolbar

Contains:

- New note
- Save note
- Delete

---

## New Note Button

Invokes:

    createNote

Purpose:

Creates a new empty operator note.

---

## Save Note Button

Invokes:

    saveNote

Purpose:

Persists current draft into note state/localStorage.

---

## Delete Button

Class:

    danger-button

Disabled when:

    !activeNote

Invokes:

    deleteNote

Purpose:

Routes deletion through confirmation workflow.

---

# Body Layout

Renders:

    cg-notes-panel__body

Contains:

- note list sidebar
- note textarea

---

# Note List

Renders:

    cg-notes-panel__list

If notes exist:

- maps notes to buttons

If no notes exist:

    No saved notes yet.

---

# Note List Item

Each note button displays:

- title
- updatedAt or `not saved`

Active note class:

    cg-notes-panel__item--active

Selection behavior:

    setActiveNoteId(note.id)

---

# Textarea

Renders:

    <textarea className="cg-notes">

Controlled by:

    draft

On change:

    setDraft(event.target.value)

Placeholder:

    Operator notes...

---

# Truth, Projection, Mutation, and Persistence Boundaries

## Truth Inputs

Truth is local note state and localStorage content.

No Git truth is consumed.

---

## Projection Systems

Projection includes:

- note list rendering
- active note highlighting
- derived note titles
- updatedAt display

---

## Mutation Systems

Local-only mutations include:

- create note
- save note
- delete note
- change active note
- edit draft

No Git mutation exists.

---

## Persistence Systems

Persistence uses:

    localStorage

under key:

    chronogit_notes_v1

---

## Safety Systems

Safety systems include:

- delete confirmation
- danger styling
- explicit confirmation text saying Git is not touched
- disabled delete button when no active note exists

---

# Local-Only Doctrine

This component is strictly local-browser state.

It does not:

- write to repository files
- create Git commits
- modify Git history
- synchronize remotely

This preserves separation between operator notes and repository truth.

---

# Separation of Concerns

This component handles:

- note UI
- note local state
- localStorage persistence
- delete confirmation routing

It does not handle:

- Git operations
- backend invocation
- file writes
- remote sync
- LLM systems
- audit log export

---

# CSS Dependencies

Depends on external CSS classes including:

- cg-panel-content
- cg-notes-panel
- cg-notes-panel__toolbar
- cg-notes-panel__body
- cg-notes-panel__list
- cg-notes-panel__item
- cg-notes-panel__item--active
- cg-notes
- danger-button

No component-local CSS import exists.

---

# React Characteristics

This component:

- uses local state
- uses memoized active note resolution
- uses localStorage side effects
- uses controlled textarea state
- delegates deletion confirmation to parent

---

# Current Known Gaps

- Notes are browser-local only.
- Notes are not stored in Git.
- Notes are not exported/backed up.
- Notes are not searchable.
- Notes are not tagged.
- Notes have no markdown preview.
- Notes have no provenance links to commits/files.
- Notes have no autosave debounce beyond state persistence after `notes` updates.
- Draft edits are not persisted until Save note is pressed.
- `loadNotes()` is called twice during initial state setup.
- IDs use timestamp/random generation and are not deterministic across sessions.
- Timestamps use locale-specific formatting.
- No schema migration exists beyond storage key versioning.

---

# Potential Future Expansion

Potential future improvements include:

- commit-linked notes
- file-linked notes
- branch-linked notes
- markdown preview
- note search
- note tags
- backup/export integration
- autosave draft recovery
- provenance graph integration
- Chrono-Field note nodes
- audit-log connection
- deterministic timestamp format
- local file-backed note storage

None currently exist.

---

# Design Characteristics

The panel is:

- local-only
- operator-focused
- lightweight
- persistence-aware
- Git-isolated
- confirmation-protected
- workspace-integrated

---

# Verification Notes

This document is based on full-file inspection of:

- `src/panels/NotesPanel.tsx`

No undocumented behavior has been inferred beyond directly visible source logic.

---

# Status

active
