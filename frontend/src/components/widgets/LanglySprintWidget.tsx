import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Clock, Trash2, GripHorizontal, X, MessageSquare } from 'lucide-react';

interface TaskNote {
  id: string;
  text: string;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'normal' | 'high';
  dueDate: string;
  notes?: TaskNote[];
}

interface DaySummary {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
}

interface DragState {
  taskId: string | null;
  sourceStatus: string | null;
}

const STORAGE_KEY = 'langly_tasks';

export function LanglySprintWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allSprintTasks, setAllSprintTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<DaySummary>({
    total: 0,
    todo: 0,
    in_progress: 0,
    done: 0,
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'today' | 'kanban' | 'list'>('kanban');
  const [dragState, setDragState] = useState<DragState>({ taskId: null, sourceStatus: null });
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newNote, setNewNote] = useState('');

  // Load tasks from localStorage
  const loadTasks = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let allTasks: Task[] = [];

      if (stored) {
        allTasks = JSON.parse(stored);
      }
      // Empty by default — template ready to fill in

      setAllSprintTasks(allTasks);

      // Set display tasks based on default view mode (kanban shows all)
      if (viewMode === 'today') {
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = allTasks.filter((t: Task) => t.dueDate === today || t.status === 'in_progress');
        setTasks(todayTasks);
        updateSummary(todayTasks);
      } else {
        setTasks(allTasks);
        updateSummary(allTasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const updateSummary = (taskList: Task[]) => {
    setSummary({
      total: taskList.length,
      todo: taskList.filter(t => t.status === 'todo').length,
      in_progress: taskList.filter(t => t.status === 'in_progress').length,
      done: taskList.filter(t => t.status === 'done').length,
    });
  };

  const saveTasks = (updatedTasks: Task[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
      setAllSprintTasks(updatedTasks);

      if (viewMode === 'today') {
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = updatedTasks.filter((t: Task) => t.dueDate === today || t.status === 'in_progress');
        setTasks(todayTasks);
        updateSummary(todayTasks);
      } else {
        setTasks(updatedTasks);
        updateSummary(updatedTasks);
      }
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // When switching to today view, refresh display
  useEffect(() => {
    if (viewMode === 'today') {
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = allSprintTasks.filter((t) => t.dueDate === today || t.status === 'in_progress');
      setTasks(todayTasks);
      updateSummary(todayTasks);
    }
  }, [allSprintTasks, viewMode]);

  // Add new task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: newTaskTitle,
      description: '',
      status: 'todo',
      priority: 'normal',
      dueDate: newTaskDate,
    };

    const allUpdated = [...allSprintTasks, newTask];
    saveTasks(allUpdated);
    setNewTaskTitle('');
  };

  // Update task status
  const handleUpdateStatus = (taskId: string, newStatus: string) => {
    const updatedAllTasks = allSprintTasks.map(t =>
      t.id === taskId ? { ...t, status: newStatus as 'todo' | 'in_progress' | 'done' } : t
    );
    saveTasks(updatedAllTasks);
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    const updatedAllTasks = allSprintTasks.filter(t => t.id !== taskId);
    saveTasks(updatedAllTasks);
  };

  // Drag and drop handlers
  const handleDragStart = (taskId: string, status: string) => {
    setDragState({ taskId, sourceStatus: status });
  };

  const handleDragOver = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(columnStatus);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (dragState.taskId && dragState.sourceStatus !== targetStatus) {
      const updatedAllTasks = allSprintTasks.map(t =>
        t.id === dragState.taskId ? { ...t, status: targetStatus as 'todo' | 'in_progress' | 'done' } : t
      );
      saveTasks(updatedAllTasks);
    }

    setDragState({ taskId: null, sourceStatus: null });
    setDragOverColumn(null);
    setDragOverTaskId(null);
  };

  const handleTaskDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTaskId(taskId);
  };

  const handleTaskDrop = (e: React.DragEvent, targetTaskId: string, targetStatus: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!dragState.taskId || dragState.taskId === targetTaskId) {
      setDragState({ taskId: null, sourceStatus: null });
      setDragOverColumn(null);
      setDragOverTaskId(null);
      return;
    }

    const draggedTask = allSprintTasks.find(t => t.id === dragState.taskId);
    if (!draggedTask) return;

    const without = allSprintTasks.filter(t => t.id !== dragState.taskId);
    const targetIdx = without.findIndex(t => t.id === targetTaskId);
    const updated = { ...draggedTask, status: targetStatus as 'todo' | 'in_progress' | 'done' };
    without.splice(targetIdx, 0, updated);

    saveTasks(without);
    setDragState({ taskId: null, sourceStatus: null });
    setDragOverColumn(null);
    setDragOverTaskId(null);
  };

  const handleDragEnd = () => {
    setDragState({ taskId: null, sourceStatus: null });
    setDragOverColumn(null);
    setDragOverTaskId(null);
  };

  // Note handlers
  const handleAddNote = (taskId: string) => {
    if (!newNote.trim()) return;
    const note: TaskNote = {
      id: `note_${Date.now()}`,
      text: newNote.trim(),
      createdAt: new Date().toISOString(),
    };
    const updatedAllTasks = allSprintTasks.map(t =>
      t.id === taskId ? { ...t, notes: [...(t.notes || []), note] } : t
    );
    saveTasks(updatedAllTasks);
    const updated = updatedAllTasks.find(t => t.id === taskId);
    if (updated) setSelectedTask(updated);
    setNewNote('');
  };

  const handleDeleteNote = (taskId: string, noteId: string) => {
    const updatedAllTasks = allSprintTasks.map(t =>
      t.id === taskId ? { ...t, notes: (t.notes || []).filter(n => n.id !== noteId) } : t
    );
    saveTasks(updatedAllTasks);
    const updated = updatedAllTasks.find(t => t.id === taskId);
    if (updated) setSelectedTask(updated);
  };

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedTask(null);
    };
    if (selectedTask) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedTask]);

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-500/20 text-red-300 border border-red-500/30',
      normal: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
      low: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const getTasksByStatus = (status: 'todo' | 'in_progress' | 'done') => {
    return tasks.filter(t => t.status === status);
  };

  const renderKanbanTask = (task: Task) => (
    <div
      key={task.id}
      draggable
      onDragStart={() => handleDragStart(task.id, task.status)}
      onDragOver={(e) => handleTaskDragOver(e, task.id)}
      onDrop={(e) => handleTaskDrop(e, task.id, task.status)}
      onDragEnd={handleDragEnd}
      className={`p-3 rounded border-2 cursor-grab active:cursor-grabbing transition ${
        dragState.taskId === task.id
          ? 'opacity-50 bg-slate-800'
          : dragOverTaskId === task.id && dragState.taskId
          ? 'bg-slate-700/50 border-cyan-400 border-t-4'
          : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
      }`}
    >
      <div className="flex items-start gap-2 mb-2">
        <GripHorizontal size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
        <button
          onClick={() => setSelectedTask(task)}
          className={`text-sm font-medium flex-1 text-left hover:underline cursor-pointer ${
            task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-100'
          }`}
        >
          {task.title}
        </button>
        <button
          onClick={() => handleDeleteTask(task.id)}
          className="text-gray-500 hover:text-red-400 focus:outline-none transition flex-shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {task.description && <div className="text-xs text-gray-400 mb-2">{task.description}</div>}

      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          {task.priority !== 'normal' && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          )}
          {(task.notes?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MessageSquare size={12} />
              {task.notes!.length}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500">{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
      </div>
    </div>
  );

  const renderListTask = (task: Task) => (
    <div
      key={task.id}
      className="flex items-start gap-3 p-3 bg-slate-700/30 rounded hover:bg-slate-700/50 transition border border-slate-600/50"
    >
      {/* Status Icon */}
      <button
        onClick={() =>
          handleUpdateStatus(
            task.id,
            task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'done'
          )
        }
        className="mt-1 flex-shrink-0 focus:outline-none"
      >
        {task.status === 'done' ? (
          <CheckCircle2 size={20} className="text-green-400" />
        ) : task.status === 'in_progress' ? (
          <Clock size={20} className="text-blue-400" />
        ) : (
          <Circle size={20} className="text-gray-500" />
        )}
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <button
          onClick={() => setSelectedTask(task)}
          className={`text-sm font-medium text-left hover:underline cursor-pointer ${
            task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-100'
          }`}
        >
          {task.title}
        </button>
        {task.description && <div className="text-xs text-gray-400 mt-1">{task.description}</div>}
        {(task.notes?.length ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <MessageSquare size={12} />
            {task.notes!.length} note{task.notes!.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Priority Badge & Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {task.priority !== 'normal' && (
          <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        )}
        <button
          onClick={() => handleDeleteTask(task.id)}
          className="text-gray-500 hover:text-red-400 focus:outline-none transition"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-6">
      {/* Header with View Toggle */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">Langly Development Sprint</h2>
          <p className="text-sm text-gray-400 mt-1">Drag tasks to move between columns</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setViewMode('kanban');
              setTasks(allSprintTasks);
              updateSummary(allSprintTasks);
            }}
            className={`px-3 py-1 rounded text-xs font-medium transition ${
              viewMode === 'kanban'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => {
              setViewMode('today');
              const today = new Date().toISOString().split('T')[0];
              const todayTasks = allSprintTasks.filter((t) => t.dueDate === today || t.status === 'in_progress');
              setTasks(todayTasks);
              updateSummary(todayTasks);
            }}
            className={`px-3 py-1 rounded text-xs font-medium transition ${
              viewMode === 'today'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => {
              setViewMode('list');
              setTasks(allSprintTasks);
              updateSummary(allSprintTasks);
            }}
            className={`px-3 py-1 rounded text-xs font-medium transition ${
              viewMode === 'list'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2 mb-6 text-center">
        <div className="bg-slate-700/50 rounded p-3 border border-slate-600">
          <div className="text-2xl font-bold text-gray-100">{summary.total}</div>
          <div className="text-xs text-gray-400 mt-1">Total</div>
        </div>
        <div className="bg-blue-500/10 rounded p-3 border border-blue-500/20">
          <div className="text-2xl font-bold text-blue-300">{summary.todo}</div>
          <div className="text-xs text-gray-400 mt-1">To Do</div>
        </div>
        <div className="bg-yellow-500/10 rounded p-3 border border-yellow-500/20">
          <div className="text-2xl font-bold text-yellow-300">{summary.in_progress}</div>
          <div className="text-xs text-gray-400 mt-1">In Progress</div>
        </div>
        <div className="bg-green-500/10 rounded p-3 border border-green-500/20">
          <div className="text-2xl font-bold text-green-300">{summary.done}</div>
          <div className="text-xs text-gray-400 mt-1">Done</div>
        </div>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="mb-6 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder={viewMode === 'today' ? 'Add a task for today...' : 'Add a task...'}
            className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
          />
          <button
            type="submit"
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded text-sm flex items-center gap-1 font-medium transition"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
        {(viewMode === 'kanban' || viewMode === 'list') && (
          <input
            type="date"
            value={newTaskDate}
            onChange={(e) => setNewTaskDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-gray-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
          />
        )}
      </form>

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-3 gap-4">
          {/* To Do Column */}
          <div
            onDragOver={(e) => handleDragOver(e, 'todo')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'todo')}
            className={`bg-slate-800/50 rounded-lg border-2 p-4 min-h-96 transition ${
              dragOverColumn === 'todo'
                ? 'border-blue-400 bg-blue-500/10'
                : 'border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-600">
              <Circle size={16} className="text-blue-400" />
              <h3 className="font-semibold text-gray-100">To Do</h3>
              <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                {getTasksByStatus('todo').length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-80">
              {getTasksByStatus('todo').length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">No tasks</div>
              ) : (
                getTasksByStatus('todo').map((task) => renderKanbanTask(task))
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div
            onDragOver={(e) => handleDragOver(e, 'in_progress')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'in_progress')}
            className={`bg-slate-800/50 rounded-lg border-2 p-4 min-h-96 transition ${
              dragOverColumn === 'in_progress'
                ? 'border-yellow-400 bg-yellow-500/10'
                : 'border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-600">
              <Clock size={16} className="text-yellow-400" />
              <h3 className="font-semibold text-gray-100">In Progress</h3>
              <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
                {getTasksByStatus('in_progress').length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-80">
              {getTasksByStatus('in_progress').length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">No tasks</div>
              ) : (
                getTasksByStatus('in_progress').map((task) => renderKanbanTask(task))
              )}
            </div>
          </div>

          {/* Done Column */}
          <div
            onDragOver={(e) => handleDragOver(e, 'done')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'done')}
            className={`bg-slate-800/50 rounded-lg border-2 p-4 min-h-96 transition ${
              dragOverColumn === 'done'
                ? 'border-green-400 bg-green-500/10'
                : 'border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-600">
              <CheckCircle2 size={16} className="text-green-400" />
              <h3 className="font-semibold text-gray-100">Done</h3>
              <span className="ml-auto text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                {getTasksByStatus('done').length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-80">
              {getTasksByStatus('done').length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">No tasks</div>
              ) : (
                getTasksByStatus('done').map((task) => renderKanbanTask(task))
              )}
            </div>
          </div>
        </div>
      )}

      {/* List View (Today or Full Sprint) */}
      {(viewMode === 'today' || viewMode === 'list') && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              {viewMode === 'today' ? 'No tasks for today. Add some to get started!' : 'No tasks yet. Add your first task above!'}
            </div>
          ) : viewMode === 'list' ? (
            Object.entries(
              tasks.reduce((acc: Record<string, Task[]>, task) => {
                if (!acc[task.dueDate]) acc[task.dueDate] = [];
                acc[task.dueDate].push(task);
                return acc;
              }, {})
            ).map(([date, dateTasks]) => (
              <div key={date}>
                <div className="text-xs font-semibold text-gray-500 uppercase px-3 py-2 bg-slate-800/50">
                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                {dateTasks.map((task) => renderListTask(task))}
              </div>
            ))
          ) : (
            tasks.map((task) => renderListTask(task))
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-slate-700 text-xs text-gray-500">
        {viewMode === 'kanban'
          ? 'Drag tasks between columns to change status'
          : 'Click status icon to cycle: To Do → In Progress → Done'}
      </div>

      {/* Task Notes Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-slate-800 border border-slate-600 rounded-lg w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-700 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-100 truncate">{selectedTask.title}</h3>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedTask.status === 'done' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    selectedTask.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {selectedTask.status === 'in_progress' ? 'In Progress' : selectedTask.status === 'done' ? 'Done' : 'To Do'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority}
                  </span>
                  <span className="text-xs text-gray-400">
                    Due {new Date(selectedTask.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-200 transition ml-2 flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(!selectedTask.notes || selectedTask.notes.length === 0) ? (
                <div className="text-center py-8 text-gray-500 text-sm">No notes yet. Add one below.</div>
              ) : (
                selectedTask.notes.map((note) => (
                  <div key={note.id} className="bg-slate-700/50 border border-slate-600 rounded p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-200 whitespace-pre-wrap flex-1">{note.text}</p>
                      <button
                        onClick={() => handleDeleteNote(selectedTask.id, note.id)}
                        className="text-gray-500 hover:text-red-400 transition flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(note.createdAt).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: 'numeric', minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Input */}
            <div className="p-4 border-t border-slate-700">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddNote(selectedTask.id);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded text-sm font-medium transition"
                >
                  Add Note
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
