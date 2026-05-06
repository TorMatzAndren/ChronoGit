import { useEffect, useMemo, useState } from "react";
import type { ConfirmAction } from "../core/chronogitRuntimeTypes";

type Note = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
};

type Props = {
  setConfirmAction: (action: ConfirmAction | null) => void;
};

const NOTES_STORAGE_KEY = "chronogit_notes_v1";

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((note) => ({
      id: String(note.id || `note-${Date.now()}`),
      title: String(note.title || "Untitled note"),
      body: String(note.body || ""),
      updatedAt: String(note.updatedAt || ""),
    }));
  } catch {
    return [];
  }
}

function titleFromBody(body: string) {
  const firstLine = body.trim().split("\n").find(Boolean);
  if (!firstLine) return "Untitled note";
  return firstLine.length > 48 ? `${firstLine.slice(0, 48)}…` : firstLine;
}

export function NotesPanel({ setConfirmAction }: Props) {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());
  const [activeNoteId, setActiveNoteId] = useState<string>(() => loadNotes()[0]?.id || "");
  const [draft, setDraft] = useState("");

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId) || null,
    [notes, activeNoteId],
  );

  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    setDraft(activeNote?.body || "");
  }, [activeNote?.id]);

  function createNote() {
    const note: Note = {
      id: `note-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: "Untitled note",
      body: "",
      updatedAt: new Date().toLocaleString(),
    };

    setNotes((current) => [note, ...current]);
    setActiveNoteId(note.id);
  }

  function saveNote() {
    const now = new Date().toLocaleString();

    if (!activeNote) {
      const note: Note = {
        id: `note-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: titleFromBody(draft),
        body: draft,
        updatedAt: now,
      };

      setNotes((current) => [note, ...current]);
      setActiveNoteId(note.id);
      return;
    }

    setNotes((current) => current.map((note) =>
      note.id === activeNote.id
        ? { ...note, title: titleFromBody(draft), body: draft, updatedAt: now }
        : note
    ));
  }

  function deleteNote() {
    if (!activeNote) return;

    const noteToDelete = activeNote;

    setConfirmAction({
      title: "Delete note",
      body: `This deletes the selected ChronoGit operator note from local browser storage.\n\nNote:\n${noteToDelete.title}\n\nThis does not touch Git history or repository files.`,
      confirmLabel: "Delete note",
      danger: true,
      action: async () => {
        setNotes((current) => {
          const next = current.filter((note) => note.id !== noteToDelete.id);
          setActiveNoteId(next[0]?.id || "");
          return next;
        });
      },
    });
  }

  return (
    <div className="cg-panel-content cg-notes-panel">
      <div className="cg-notes-panel__toolbar">
        <button onClick={createNote}>New note</button>
        <button onClick={saveNote}>Save note</button>
        <button className="danger-button" disabled={!activeNote} onClick={deleteNote}>Delete</button>
      </div>

      <div className="cg-notes-panel__body">
        <aside className="cg-notes-panel__list">
          {notes.length ? notes.map((note) => (
            <button
              key={note.id}
              className={note.id === activeNoteId ? "cg-notes-panel__item cg-notes-panel__item--active" : "cg-notes-panel__item"}
              onClick={() => setActiveNoteId(note.id)}
            >
              <strong>{note.title}</strong>
              <span>{note.updatedAt || "not saved"}</span>
            </button>
          )) : <p>No saved notes yet.</p>}
        </aside>

        <textarea
          className="cg-notes"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Operator notes..."
        />
      </div>
    </div>
  );
}
