import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Note } from '../types/notes';

export function fetchNotes() {
  return apiGet<Note[]>('/api/notes');
}

export function fetchNote(id: number) {
  return apiGet<Note>(`/api/notes/${id}`);
}

export function createNote(title: string, content: string) {
  return apiPost<Note>('/api/notes', { title, content });
}

export function updateNote(id: number, data: { title?: string; content?: string }) {
  return apiPut<Note>(`/api/notes/${id}`, data);
}

export function deleteNote(id: number) {
  return apiDelete<{ deleted: number }>(`/api/notes/${id}`);
}
