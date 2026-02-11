import { useState, useRef, useEffect } from 'react';
import { useNotes } from '../../hooks/useNotes';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';

export function NotesWidget() {
  const { notes, loading, refresh, activeNote, setActiveNote, create, update, remove } = useNotes();
  const [newTitle, setNewTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (activeNote) {
      setEditContent(activeNote.content);
    }
  }, [activeNote?.id]);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (newTitle.trim()) {
      create(newTitle.trim(), '');
      setNewTitle('');
    }
  }

  function handleContentChange(content: string) {
    setEditContent(content);
    clearTimeout(saveTimerRef.current);
    if (activeNote) {
      saveTimerRef.current = setTimeout(() => {
        update(activeNote.id, { content });
      }, 1000);
    }
  }

  const noteIcon = (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  if (!activeNote) {
    return (
      <WidgetPanel
        title="Intel Files"
        accentColor="purple"
        icon={noteIcon}
        headerRight={
          <button onClick={refresh} className="text-gray-600 hover:text-purple-400 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        }
      >
        <div className="p-3 space-y-2">
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New file name..."
              className="flex-1 rounded border border-purple-500/15 bg-slate-900/60 px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:border-purple-500/40 focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="rounded border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-xs text-purple-400 hover:bg-purple-500/20 disabled:opacity-30 transition-all"
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
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => setActiveNote(note)}
                className="group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-all hover:bg-white/[0.02] border border-transparent hover:border-purple-500/10"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-300 truncate">{note.title}</div>
                  <div className="text-[10px] text-gray-600 truncate font-mono">
                    {note.content.slice(0, 50) || '[ empty ]'}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(note.id);
                  }}
                  className="invisible text-gray-700 hover:text-red-400 group-hover:visible ml-2 transition-colors"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {notes.length === 0 && !loading && (
            <p className="text-center text-[11px] text-gray-600 py-6 uppercase tracking-wider">
              No files on record
            </p>
          )}
        </div>
      </WidgetPanel>
    );
  }

  return (
    <WidgetPanel
      title="Intel Files"
      accentColor="purple"
      icon={noteIcon}
      headerRight={
        <button
          onClick={() => setActiveNote(null)}
          className="text-[10px] uppercase tracking-wider text-gray-600 hover:text-purple-400 transition-colors"
        >
          Back
        </button>
      }
    >
      <div className="flex h-full flex-col p-3">
        <div className="text-xs font-medium text-purple-400/80 mb-2 uppercase tracking-wider">{activeNote.title}</div>
        <textarea
          value={editContent}
          onChange={(e) => handleContentChange(e.target.value)}
          className="flex-1 resize-none rounded border border-purple-500/15 bg-slate-900/60 p-2.5 text-xs text-gray-300 placeholder-gray-600 focus:border-purple-500/40 focus:outline-none font-mono transition-all"
          placeholder="Enter intel..."
        />
        <div className="mt-1.5 text-right text-[10px] text-gray-700 uppercase tracking-wider">Auto-saving</div>
      </div>
    </WidgetPanel>
  );
}
