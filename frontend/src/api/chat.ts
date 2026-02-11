import { apiGet, apiPost, apiDelete } from './client';

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface SavedMessage {
  id: number;
  role: string;
  content: string;
  tool_calls: unknown[];
  thinking_steps: unknown[];
  created_at: string;
}

export async function fetchSessions(): Promise<ChatSession[]> {
  try {
    return await apiGet<ChatSession[]>('/api/chat/sessions');
  } catch {
    return [];
  }
}

export async function createSession(title?: string): Promise<ChatSession> {
  return apiPost<ChatSession>('/api/chat/sessions', { title: title || 'New Chat' });
}

export async function deleteSession(sessionId: number): Promise<void> {
  await apiDelete<void>(`/api/chat/sessions/${sessionId}`);
}

export async function fetchMessages(sessionId: number): Promise<SavedMessage[]> {
  try {
    return await apiGet<SavedMessage[]>(`/api/chat/sessions/${sessionId}/messages`);
  } catch {
    return [];
  }
}

export async function saveMessage(
  sessionId: number,
  role: string,
  content: string,
  toolCalls?: unknown[],
  thinkingSteps?: unknown[],
): Promise<{ id: number }> {
  return apiPost<{ id: number }>(`/api/chat/sessions/${sessionId}/messages`, {
    role,
    content,
    toolCalls,
    thinkingSteps,
  });
}
