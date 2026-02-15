import { useState, useRef, useEffect, useCallback } from 'react';
import { useNotes } from '../../hooks/useNotes';
import { fetchDriveFiles } from '../../api/drive';
import { searchContacts } from '../../api/contacts';
import type { DriveFile } from '../../types/drive';
import type { ContactSearchResult } from '../../types/contacts';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';

function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function formatBytes(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const mimeIcons: Record<string, string> = {
  'application/vnd.google-apps.document': 'DOC',
  'application/vnd.google-apps.spreadsheet': 'SHT',
  'application/vnd.google-apps.presentation': 'SLD',
  'application/vnd.google-apps.folder': 'DIR',
  'application/pdf': 'PDF',
  'image/': 'IMG',
  'video/': 'VID',
  'text/': 'TXT',
};

function getMimeLabel(mime: string): string {
  for (const [key, label] of Object.entries(mimeIcons)) {
    if (mime.startsWith(key)) return label;
  }
  return 'FILE';
}

type Tab = 'drive' | 'notes';

export function NotesWidget() {
  const { notes, loading, refresh, activeNote, setActiveNote, create, update, remove } = useNotes();
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveConfigured, setDriveConfigured] = useState(false);
  const [driveLoading, setDriveLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('drive');
  const [newTitle, setNewTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // @mention autocomplete state
  const [, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<ContactSearchResult[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionStartPos, setMentionStartPos] = useState(-1);
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const refreshDrive = useCallback(async () => {
    setDriveLoading(true);
    try {
      const res = await fetchDriveFiles(15);
      setDriveConfigured(res.configured);
      setDriveFiles(res.files);
    } catch {
      setDriveConfigured(false);
      setDriveFiles([]);
    } finally {
      setDriveLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDrive();
  }, [refreshDrive]);

  useEffect(() => {
    if (activeNote) {
      setEditContent(activeNote.content);
    }
  }, [activeNote?.id]);

  // If drive not configured, default to notes tab
  useEffect(() => {
    if (!driveLoading && !driveConfigured) {
      setTab('notes');
    }
  }, [driveLoading, driveConfigured]);

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

  // Detect @mention typing
  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    handleContentChange(val);

    // Look backwards from cursor for an @ that starts a mention
    const textBeforeCursor = val.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([A-Za-z]*)$/);
    if (atMatch) {
      const query = atMatch[1];
      setMentionStartPos(cursorPos - query.length - 1); // position of @
      setMentionQuery(query);
      setSelectedMentionIdx(0);

      // Debounced search
      clearTimeout(mentionTimerRef.current);
      if (query.length > 0) {
        mentionTimerRef.current = setTimeout(async () => {
          try {
            const results = await searchContacts(query);
            setMentionResults(results);
            setShowMentionDropdown(results.length > 0);
          } catch {
            setShowMentionDropdown(false);
          }
        }, 150);
      } else {
        // Show all contacts on bare @
        mentionTimerRef.current = setTimeout(async () => {
          try {
            const results = await searchContacts('');
            // Show up to 5 contacts on bare @
            setMentionResults(results.slice(0, 5));
            setShowMentionDropdown(results.length > 0);
          } catch {
            setShowMentionDropdown(false);
          }
        }, 150);
      }
    } else {
      setShowMentionDropdown(false);
    }
  }

  function insertMention(contact: ContactSearchResult) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const before = editContent.slice(0, mentionStartPos);
    const after = editContent.slice(textarea.selectionStart);
    const mention = `@${contact.name}`;
    const newContent = before + mention + ' ' + after;

    setEditContent(newContent);
    setShowMentionDropdown(false);

    // Save with mention
    clearTimeout(saveTimerRef.current);
    if (activeNote) {
      saveTimerRef.current = setTimeout(() => {
        update(activeNote.id, { content: newContent });
      }, 500);
    }

    // Restore focus and cursor
    setTimeout(() => {
      textarea.focus();
      const pos = before.length + mention.length + 1;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  }

  function handleTextareaKeyDown(e: React.KeyboardEvent) {
    if (!showMentionDropdown || mentionResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMentionIdx((i) => Math.min(i + 1, mentionResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMentionIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertMention(mentionResults[selectedMentionIdx]);
    } else if (e.key === 'Escape') {
      setShowMentionDropdown(false);
    }
  }

  function handleRefresh() {
    if (tab === 'drive') refreshDrive();
    else refresh();
  }

  const noteIcon = (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  // Detail view for editing a local note
  if (activeNote) {
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

          {/* Mentions badges */}
          {activeNote.mentions && activeNote.mentions.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {activeNote.mentions.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] text-cyan-400 border border-cyan-500/20"
                >
                  @{m.name}
                  {m.company && <span className="ml-1 text-gray-600">{m.company}</span>}
                </span>
              ))}
            </div>
          )}

          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={handleTextareaChange}
              onKeyDown={handleTextareaKeyDown}
              onBlur={() => setTimeout(() => setShowMentionDropdown(false), 200)}
              className="h-full w-full resize-none rounded border border-purple-500/15 bg-slate-900/60 p-2.5 text-xs text-gray-300 placeholder-gray-600 focus:border-purple-500/40 focus:outline-none font-mono transition-all"
              placeholder="Enter intel... Type @ to mention a contact"
            />

            {/* @mention autocomplete dropdown */}
            {showMentionDropdown && mentionResults.length > 0 && (
              <div className="absolute left-0 right-0 bottom-8 z-50 rounded border border-cyan-500/20 bg-slate-900/95 backdrop-blur shadow-lg shadow-black/50 overflow-hidden">
                {mentionResults.map((contact, idx) => (
                  <button
                    key={contact.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertMention(contact);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                      idx === selectedMentionIdx
                        ? 'bg-cyan-500/15 text-cyan-300'
                        : 'text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[9px] text-cyan-400 font-bold shrink-0">
                      {contact.name.charAt(0)}
                    </span>
                    <span className="text-xs truncate">{contact.name}</span>
                    {contact.companyName && (
                      <span className="text-[10px] text-gray-600 truncate ml-auto">{contact.companyName}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-1.5 text-right text-[10px] text-gray-700 uppercase tracking-wider">Auto-saving</div>
        </div>
      </WidgetPanel>
    );
  }

  const isLoading = tab === 'drive' ? driveLoading : loading;

  return (
    <WidgetPanel
      title="Intel Files"
      accentColor="purple"
      insightPrompt="Review my notes and intel files. Identify key themes, action items, and connections between notes."
      icon={noteIcon}
      headerRight={
        isLoading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <button onClick={handleRefresh} className="text-gray-600 hover:text-purple-400 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )
      }
    >
      <div className="p-3 space-y-2">
        {/* Tabs — only show if Drive is configured */}
        {driveConfigured && (
          <div className="flex gap-1 rounded-lg border border-white/5 p-0.5" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
            <button
              onClick={() => setTab('drive')}
              className={`flex-1 rounded-md px-2 py-1 text-[10px] uppercase tracking-wider font-mono transition-all ${
                tab === 'drive'
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                  : 'text-gray-600 hover:text-gray-400 border border-transparent'
              }`}
            >
              Drive
            </button>
            <button
              onClick={() => setTab('notes')}
              className={`flex-1 rounded-md px-2 py-1 text-[10px] uppercase tracking-wider font-mono transition-all ${
                tab === 'notes'
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                  : 'text-gray-600 hover:text-gray-400 border border-transparent'
              }`}
            >
              Notes
            </button>
          </div>
        )}

        {/* Drive tab */}
        {tab === 'drive' && driveConfigured && (
          <>
            {driveLoading && (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            )}
            <div className="space-y-1">
              {driveFiles.map((file) => (
                <a
                  key={file.id}
                  href={file.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-all hover:bg-white/[0.02] border border-transparent hover:border-purple-500/10"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="shrink-0 rounded border border-purple-500/20 bg-purple-500/5 px-1.5 py-0.5 text-[8px] font-mono text-purple-300/80 uppercase">
                      {getMimeLabel(file.mimeType)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-300 truncate">{file.name}</div>
                      <div className="text-[9px] text-gray-600 font-mono">
                        {formatTime(file.modifiedTime)}
                        {file.size > 0 && ` · ${formatBytes(file.size)}`}
                      </div>
                    </div>
                  </div>
                  <svg className="h-3 w-3 text-gray-700 group-hover:text-purple-400 shrink-0 ml-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
            {driveFiles.length === 0 && !driveLoading && (
              <p className="text-center text-[11px] text-gray-600 py-6 uppercase tracking-wider">
                No files in Drive folder
              </p>
            )}
          </>
        )}

        {/* Notes tab */}
        {tab === 'notes' && (
          <>
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-gray-300 truncate">{note.title}</span>
                      {note.mentions && note.mentions.length > 0 && (
                        <span className="shrink-0 rounded-full bg-cyan-500/15 px-1.5 py-0 text-[8px] text-cyan-400 border border-cyan-500/20">
                          @{note.mentions.length}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-600 truncate font-mono">
                      {note.content ? renderContentPreview(note.content) : '[ empty ]'}
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
          </>
        )}
      </div>
    </WidgetPanel>
  );
}

/** Show plain text preview (first 50 chars) */
function renderContentPreview(content: string) {
  return content.slice(0, 50);
}
