import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Todo } from '../types/todos';

export function fetchTodos() {
  return apiGet<Todo[]>('/api/todos');
}

export function addTodo(task: string) {
  return apiPost<Todo>('/api/todos', { task });
}

export function updateTodo(id: number, data: Partial<Todo>) {
  return apiPut<Todo>(`/api/todos/${id}`, data);
}

export function deleteTodo(id: number) {
  return apiDelete<{ deleted: Todo }>(`/api/todos/${id}`);
}
