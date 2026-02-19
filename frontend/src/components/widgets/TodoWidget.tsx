import { useState, useEffect } from 'react';
import { useTodos } from '../../hooks/useTodos';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';

export function TodoWidget() {
  const { todos, loading, refresh, add, toggle, remove } = useTodos();
  const [input, setInput] = useState('');
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [reorderedTodos, setReorderedTodos] = useState(todos);

  // Update local state when todos change
  useEffect(() => {
    setReorderedTodos(todos);
  }, [todos]);

  const handleDragStart = (id: number) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetId: number) => {
    if (draggedId === null || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    // Reorder locally first (optimistic update)
    const newTodos = [...reorderedTodos];
    const draggedIdx = newTodos.findIndex((t) => t.id === draggedId);
    const targetIdx = newTodos.findIndex((t) => t.id === targetId);

    if (draggedIdx !== -1 && targetIdx !== -1) {
      [newTodos[draggedIdx], newTodos[targetIdx]] = [newTodos[targetIdx], newTodos[draggedIdx]];
      setReorderedTodos(newTodos);
    }

    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) {
      add(input.trim());
      setInput('');
    }
  }

  const completed = reorderedTodos.filter((t) => t.done).length;

  function formatDueDate(dueStr: string): string {
    if (!dueStr) return '';
    try {
      const date = new Date(dueStr);
      if (isNaN(date.getTime())) return '';
      
      // Today
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (date.toDateString() === today.toDateString()) {
        return `Today · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      }
      if (date.toDateString() === tomorrow.toDateString()) {
        return `Tomorrow · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      }
      
      // Other dates
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
             ' · ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  return (
    <WidgetPanel
      title="Daily Tasks"
      accentColor="amber"
      insightPrompt="Analyze my todo list. Identify priorities, overdue items, and suggest an optimal action plan for today."
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      }
      headerRight={
        <span className="text-[10px] font-mono text-amber-400/60">
          {completed}<span className="text-gray-600">/{reorderedTodos.length}</span>
        </span>
      }
    >
      <div className="p-3 space-y-2">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="New task..."
            className="flex-1 rounded border border-amber-500/15 bg-slate-900/60 px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:border-amber-500/40 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-400 hover:bg-amber-500/20 disabled:opacity-30 transition-all"
          >
            +
          </button>
        </form>

        {loading && (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="sm" />
          </div>
        )}

        <div className="space-y-1">
          {reorderedTodos.map((todo) => (
            <div
              key={todo.id}
              draggable
              onDragStart={() => handleDragStart(todo.id as number)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(todo.id as number)}
              onDragEnd={handleDragEnd}
              className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all cursor-move select-none ${
                draggedId === todo.id 
                  ? 'opacity-50 bg-amber-500/10' 
                  : 'hover:bg-white/[0.02]'
              }`}
            >
              {/* Drag Handle */}
              <div className="flex-shrink-0 text-gray-700 group-hover:text-amber-400 transition-colors opacity-0 group-hover:opacity-100">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm4-8h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2z" />
                </svg>
              </div>

              <button
                onClick={() => toggle(String(todo.id), !todo.done)}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded transition-all ${
                  todo.done
                    ? 'border border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                    : 'border border-gray-700 hover:border-amber-500/30'
                }`}
              >
                {todo.done && (
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <div className="flex-1">
                <span
                  className={`block text-xs transition-colors ${
                    todo.done ? 'text-gray-600 line-through' : 'text-gray-300'
                  }`}
                >
                  {todo.task}
                </span>
                {todo.due && formatDueDate(todo.due) && (
                  <span className="block text-[10px] text-amber-400/60 mt-0.5">
                    {formatDueDate(todo.due)}
                  </span>
                )}
              </div>
              <button
                onClick={() => remove(String(todo.id))}
                className="invisible text-gray-700 hover:text-red-400 group-hover:visible transition-colors"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {reorderedTodos.length === 0 && !loading && (
          <p className="text-center text-[11px] text-gray-600 py-6 uppercase tracking-wider">
            No tasks yet
          </p>
        )}

        <div className="flex justify-center pt-1">
          <button
            onClick={refresh}
            className="text-[10px] uppercase tracking-wider text-gray-700 hover:text-amber-400 transition-colors"
          >
            Sync
          </button>
        </div>
      </div>
    </WidgetPanel>
  );
}
