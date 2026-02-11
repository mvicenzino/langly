const BASE = '/api/chat';

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
  const res = await fetch(`${BASE}/sessions`);
  if (!res.ok) return [];
  return res.json();
}

export async function createSession(title?: string): Promise<ChatSession> {
  const res = await fetch(`${BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title || 'New Chat' }),
  });
  return res.json();
}

export async function deleteSession(sessionId: number): Promise<void> {
  await fetch(`${BASE}/sessions/${sessionId}`, { method: 'DELETE' });
}

export async function fetchMessages(sessionId: number): Promise<SavedMessage[]> {
  const res = await fetch(`${BASE}/sessions/${sessionId}/messages`);
  if (!res.ok) return [];
  return res.json();
}

export async function saveMessage(
  sessionId: number,
  role: string,
  content: string,
  toolCalls?: unknown[],
  thinkingSteps?: unknown[],
): Promise<{ id: number }> {
  const res = await fetch(`${BASE}/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, content, toolCalls, thinkingSteps }),
  });
  return res.json();
}
