import { useState, useEffect, useCallback, useMemo } from 'react';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { calendarApi } from '../../api/client';
import { fetchDriveMulti } from '../../api/drive';
import type { CareDocument, FamilyMember } from '../../types/calendar';
import type { DriveFile, DriveGroup } from '../../types/drive';

const KINDORA_BASE = 'https://calendora.replit.app';

// Google Drive folders shared with SA (langly-drive-reader@langly-drive.iam.gserviceaccount.com)
const DRIVE_FOLDERS = [
  { id: '1lNTsaHaoz4k1ameHrGhKj1NIHrtbAiX6', label: 'Sebastian' },
  { id: '1U7dVRrxKhLTw5UFCySXnCKFrmK4go215', label: 'Mike & Carolyn' },
  { id: '1ivKb7bPE5TZLKIPfXmNE9YRGmc-kkrmF', label: 'New Baby' },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function careDocIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('medical') || lower.includes('health') || lower.includes('dr')) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400/70">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    );
  }
  if (lower.includes('lawyer') || lower.includes('legal') || lower.includes('invoice')) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400/70">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400/70">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

const MIME_LABELS: Record<string, { label: string; color: string }> = {
  'application/pdf': { label: 'PDF', color: 'text-red-400/70' },
  'application/vnd.google-apps.document': { label: 'DOC', color: 'text-blue-400/70' },
  'application/vnd.google-apps.spreadsheet': { label: 'SHEET', color: 'text-emerald-400/70' },
  'application/vnd.google-apps.presentation': { label: 'SLIDES', color: 'text-amber-400/70' },
  'application/vnd.google-apps.folder': { label: 'FOLDER', color: 'text-gray-400/70' },
  'application/vnd.google-apps.shortcut': { label: 'FILE', color: 'text-purple-400/70' },
};

function getMimeLabel(mime: string) {
  if (MIME_LABELS[mime]) return MIME_LABELS[mime];
  if (mime.includes('image')) return { label: 'IMG', color: 'text-pink-400/70' };
  if (mime.includes('word') || mime.includes('.document')) return { label: 'DOC', color: 'text-blue-400/70' };
  if (mime.includes('sheet') || mime.includes('excel')) return { label: 'XLS', color: 'text-emerald-400/70' };
  return { label: 'FILE', color: 'text-gray-400/70' };
}

type Tab = 'drive' | 'kindora';

export function FamilyDocsWidget() {
  const [tab, setTab] = useState<Tab>('drive');

  // Kindora state
  const [docs, setDocs] = useState<CareDocument[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [kindoraLoading, setKindoraLoading] = useState(true);

  // Drive state
  const [driveGroups, setDriveGroups] = useState<DriveGroup[]>([]);
  const [driveLoading, setDriveLoading] = useState(true);

  const [error, setError] = useState('');

  const memberMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members],
  );

  const fetchKindora = useCallback(async (silent = false) => {
    if (!silent) setKindoraLoading(true);
    try {
      const [docsData, membersData] = await Promise.all([
        calendarApi.getDocuments(),
        calendarApi.getMembers(),
      ]);
      setDocs(docsData);
      setMembers(membersData);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Failed to load documents');
    } finally {
      if (!silent) setKindoraLoading(false);
    }
  }, []);

  const fetchDrive = useCallback(async (silent = false) => {
    if (!silent) setDriveLoading(true);
    try {
      const res = await fetchDriveMulti(DRIVE_FOLDERS, 50, true);
      setDriveGroups(res.groups.map((g) => ({
        ...g,
        files: g.files.filter((f) => !f.isFolder),
      })));
    } catch {
      setDriveGroups([]);
    } finally {
      if (!silent) setDriveLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKindora();
    fetchDrive();
  }, [fetchKindora, fetchDrive]);

  const loading = tab === 'drive' ? driveLoading : kindoraLoading;

  const refresh = () => {
    if (tab === 'drive') fetchDrive();
    else fetchKindora();
  };

  const driveFileCount = driveGroups.reduce((n, g) => n + g.files.length, 0);

  // Group Kindora docs by member
  const grouped = useMemo(() => {
    const map = new Map<string, CareDocument[]>();
    for (const doc of docs) {
      const key = doc.memberId || '_family';
      const list = map.get(key);
      if (list) list.push(doc);
      else map.set(key, [doc]);
    }
    return map;
  }, [docs]);

  return (
    <WidgetPanel
      title="Family Documents"
      accentColor="purple"
      insightPrompt="Review my family's care documents and Google Drive files and suggest what important documents might be missing (insurance cards, emergency contacts, school forms, etc.)."
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      }
      headerRight={
        loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <button onClick={refresh} className="text-gray-600 hover:text-purple-400 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )
      }
    >
      <div className="flex flex-col h-full">
        {/* ── Tabs ──────────────────────────────────────── */}
        <div className="flex border-b border-white/5 px-3">
          {([
            { id: 'drive' as Tab, label: 'Google Drive', count: driveFileCount },
            { id: 'kindora' as Tab, label: 'Kindora', count: docs.length },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-600 hover:text-gray-400'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className="ml-1.5 text-[9px] text-gray-600">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {error && tab === 'kindora' && (
            <p className="text-center text-[11px] text-red-400/80 py-1">{error}</p>
          )}

          {/* ════ Google Drive tab ════ */}
          {tab === 'drive' && (
            <>
              {driveLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-400" />
                </div>
              ) : driveFileCount === 0 ? (
                <p className="text-center text-[11px] text-gray-600 py-6 uppercase tracking-wider">
                  No files in folder
                </p>
              ) : (
                driveGroups.filter((g) => g.files.length > 0).map((group) => {
                  // Group files within this section by subfolder
                  const subMap = new Map<string, DriveFile[]>();
                  for (const f of group.files) {
                    const key = f.folder || group.label;
                    const list = subMap.get(key);
                    if (list) list.push(f);
                    else subMap.set(key, [f]);
                  }

                  return (
                    <div key={group.label} className="mb-4">
                      {/* Section heading */}
                      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-white/5">
                        <div className="h-2 w-2 rounded-full bg-purple-500/60 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400/80">
                          {group.label}
                        </span>
                        <span className="text-[10px] text-gray-600 ml-auto">
                          {group.files.length} {group.files.length === 1 ? 'file' : 'files'}
                        </span>
                      </div>

                      {Array.from(subMap.entries()).map(([subfolder, files]) => (
                        <div key={subfolder} className="mb-2">
                          {/* Subfolder label (only if different from section) */}
                          {subfolder !== group.label && (
                            <div className="flex items-center gap-1.5 mb-1 ml-1">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600 shrink-0">
                                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                              <span className="text-[9px] text-gray-500 uppercase tracking-wider">
                                {subfolder}
                              </span>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            {files.map((file) => {
                              const mime = getMimeLabel(file.mimeType);
                              return (
                                <a
                                  key={file.id}
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group flex items-center gap-2.5 rounded-lg border border-white/5 px-3 py-2 hover:border-purple-500/20 hover:bg-purple-500/[0.03] transition-all"
                                  style={{ background: 'rgba(15, 23, 42, 0.4)' }}
                                >
                                  <span className={`text-[9px] font-bold uppercase tracking-wider ${mime.color} shrink-0 w-7`}>
                                    {mime.label}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs text-gray-200 group-hover:text-purple-300 transition-colors truncate">
                                      {file.name}
                                    </div>
                                  </div>
                                  <div className="text-[10px] text-gray-600 shrink-0 font-mono">
                                    {timeAgo(file.modifiedTime)}
                                  </div>
                                  <svg
                                    className="h-3 w-3 text-gray-700 group-hover:text-purple-400 transition-colors shrink-0"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}

              {/* Drive folder link */}
              {driveFileCount > 0 && (
                <div className="pt-2 border-t border-white/5 flex justify-end">
                  <a
                    href="https://drive.google.com/drive/my-drive"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-purple-500/50 hover:text-purple-400 uppercase tracking-wider transition-colors"
                  >
                    Open Google Drive
                  </a>
                </div>
              )}
            </>
          )}

          {/* ════ Kindora tab ════ */}
          {tab === 'kindora' && (
            <>
              {kindoraLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-400" />
                </div>
              ) : docs.length === 0 && !error ? (
                <p className="text-center text-[11px] text-gray-600 py-6 uppercase tracking-wider">
                  No documents uploaded
                </p>
              ) : (
                Array.from(grouped.entries()).map(([memberId, memberDocs]) => {
                  const member = memberId === '_family' ? null : memberMap[memberId];
                  const sectionLabel = member ? member.name : 'Family';
                  const sectionColor = member?.color || '#8B5CF6';

                  return (
                    <div key={memberId}>
                      {/* Member heading */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: sectionColor }}
                        />
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                          {sectionLabel}
                        </span>
                        <span className="text-[10px] text-gray-600 ml-auto">
                          {memberDocs.length} {memberDocs.length === 1 ? 'file' : 'files'}
                        </span>
                      </div>

                      {/* Doc list */}
                      <div className="space-y-1.5">
                        {memberDocs.map((doc) => (
                          <a
                            key={doc.id}
                            href={`${KINDORA_BASE}${doc.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-2.5 rounded-lg border border-white/5 px-3 py-2 hover:border-purple-500/20 hover:bg-purple-500/[0.03] transition-all"
                            style={{ background: 'rgba(15, 23, 42, 0.4)' }}
                          >
                            {careDocIcon(doc.title)}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-gray-200 group-hover:text-purple-300 transition-colors truncate">
                                {doc.title}
                              </div>
                              {doc.category && (
                                <div className="text-[10px] text-gray-600 mt-0.5">{doc.category}</div>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-600 shrink-0 font-mono">
                              {timeAgo(doc.createdAt)}
                            </div>
                            <svg
                              className="h-3 w-3 text-gray-700 group-hover:text-purple-400 transition-colors shrink-0"
                              fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Kindora footer link */}
              {docs.length > 0 && (
                <div className="pt-2 border-t border-white/5 flex justify-end">
                  <a
                    href={`${KINDORA_BASE}/care-documents`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-purple-500/50 hover:text-purple-400 uppercase tracking-wider transition-colors"
                  >
                    Manage in Kindora
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </WidgetPanel>
  );
}
