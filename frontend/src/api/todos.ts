import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Todo } from '../types/todos';

interface RemindersResponse {
  configured: boolean;
  items: Array<{
    uid: string;
    task: string;
    done: boolean;
    due: string;
    priority: number;
    notes: string;
  }>;
}

export async function fetchTodos(): Promise<Todo[]> {
  const res = await apiGet<RemindersResponse>('/api/reminders');
  if (!res.configured) return [];
  return res.items.map((item) => ({
    id: item.uid,
    task: item.task,
    done: item.done,
    due: item.due,
    priority: item.priority,
    notes: item.notes,
  }));
}

export function addTodo(task: string) {
  return apiPost<{ uid: string; task: string; done: boolean }>('/api/reminders', { task });
}

export function updateTodo(id: string, data: Partial<Todo>) {
  return apiPut<{ uid: string; updated: boolean }>(`/api/reminders/${id}`, data);
}

export function deleteTodo(id: string) {
  return apiDelete<{ uid: string; deleted: boolean }>(`/api/reminders/${id}`);
}
