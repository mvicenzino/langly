import { useState, useEffect, useCallback } from 'react';
import * as notesApi from '../api/notes';
import type { Note } from '../types/notes';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notesApi.fetchNotes();
      setNotes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (title: string, content: string) => {
    const note = await notesApi.createNote(title, content);
    await refresh();
    setActiveNote(note);
  }, [refresh]);

  const update = useCallback(async (id: number, data: { title?: string; content?: string }) => {
    const updated = await notesApi.updateNote(id, data);
    await refresh();
    setActiveNote(updated);
  }, [refresh]);

  const remove = useCallback(async (id: number) => {
    await notesApi.deleteNote(id);
    setActiveNote(null);
    await refresh();
  }, [refresh]);

  return { notes, loading, error, refresh, activeNote, setActiveNote, create, update, remove };
}
