import { useState, useEffect, useCallback } from 'react';
import * as todosApi from '../api/todos';
import type { Todo } from '../types/todos';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await todosApi.fetchTodos();
      setTodos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(async (task: string) => {
    await todosApi.addTodo(task);
    await refresh();
  }, [refresh]);

  const toggle = useCallback(async (id: number, done: boolean) => {
    await todosApi.updateTodo(id, { done });
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: number) => {
    await todosApi.deleteTodo(id);
    await refresh();
  }, [refresh]);

  return { todos, loading, error, refresh, add, toggle, remove };
}
