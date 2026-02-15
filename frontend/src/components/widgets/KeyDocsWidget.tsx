import { useState, useEffect } from 'react';
import { WidgetPanel } from '../layout/WidgetPanel';

interface DocFile {
  path: string;
  name: string;
  relativePath: string;
  description: string;
  sizeBytes: number;
  modifiedAt: string | null;
}

interface DocGroup {
  project: string;
  files: DocFile[];
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const docIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export function KeyDocsWidget() {
  const [groups, setGroups] = useState<DocGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/docs/catalog`)
      .then((r) => r.json())
      .then((data) => {
        setGroups(data.groups || []);
        // Expand first group by default
        if (data.groups?.length) {
          setExpanded({ [data.groups[0].project]: true });
        }
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleGroup = (project: string) => {
    setExpanded((prev) => ({ ...prev, [project]: !prev[project] }));
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 1500);
  };

  const totalFiles = groups.reduce((sum, g) => sum + g.files.length, 0);

  return (
    <WidgetPanel
      title="Key Docs"
      icon={docIcon}
      accentColor="amber"
      headerRight={
        <span className="text-[10px] text-gray-500">
          {totalFiles} files
        </span>
      }
      insightPrompt="Review my project documentation files and give me a summary of what's documented, what might be missing, and suggestions for improving documentation coverage across my projects."
    >
      <div className="p-2 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-400" />
          </div>
        ) : groups.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-500">No docs found</p>
        ) : (
          groups.map((group) => (
            <div key={group.project}>
              {/* Project header */}
              <button
                onClick={() => toggleGroup(group.project)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-white/5 transition-colors"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`text-gray-500 transition-transform ${expanded[group.project] ? 'rotate-90' : ''}`}
                >
                  <path d="M8 5l8 7-8 7z" />
                </svg>
                <span className="text-[11px] font-medium text-amber-400/80 uppercase tracking-wider">
                  {group.project}
                </span>
                <span className="text-[10px] text-gray-600 ml-auto">
                  {group.files.length}
                </span>
              </button>

              {/* File list */}
              {expanded[group.project] && (
                <div className="ml-2 border-l border-white/5 pl-2 space-y-0.5">
                  {group.files.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => handleCopyPath(file.path)}
                      className="group flex w-full flex-col rounded-md px-2 py-1.5 text-left hover:bg-white/5 transition-colors"
                      title={`Click to copy path: ${file.path}`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500/50 shrink-0">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span className="text-[11px] text-gray-300 truncate">
                          {file.relativePath}
                        </span>
                        {copiedPath === file.path ? (
                          <span className="text-[9px] text-emerald-400 ml-auto shrink-0">Copied!</span>
                        ) : (
                          <span className="text-[10px] text-gray-600 ml-auto shrink-0">
                            {timeAgo(file.modifiedAt)}
                          </span>
                        )}
                      </div>
                      {file.description && (
                        <p className="text-[10px] text-gray-500 mt-0.5 ml-5 line-clamp-1">
                          {file.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </WidgetPanel>
  );
}
