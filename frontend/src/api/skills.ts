import { apiGet, apiPost } from './client';
import { useAuthStore } from '../store/authStore';
import type { Skill } from '../types/skills';

export function fetchSkills() {
  return apiGet<Skill[]>('/api/skills');
}

interface ExtractResult {
  text: string;
  name: string;
}

const BASE_URL = import.meta.env.VITE_API_URL || '';

/** Extract text from an uploaded file (TXT, MD, PDF, DOCX). */
export async function extractTextFromFile(file: File): Promise<ExtractResult> {
  const form = new FormData();
  form.append('file', file);
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/api/skills/extract`, {
    method: 'POST',
    headers,
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Extraction failed' }));
    throw new Error(err.error || 'Extraction failed');
  }
  return res.json();
}

/** Extract text from a URL (Google Docs or generic). */
export function extractTextFromUrl(url: string): Promise<ExtractResult> {
  return apiPost<ExtractResult>('/api/skills/extract', { url });
}
