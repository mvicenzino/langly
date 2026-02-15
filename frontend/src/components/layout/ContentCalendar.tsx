import { useState, useEffect, useCallback } from 'react';
import { useContentCalendar } from '../../hooks/useContentCalendar';
import { socialApi } from '../../api/client';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import type { ContentCalendarItem } from '../../types/contentCalendar';
import type { SocialStatus } from '../../types/contentCalendar';

const STATUS_CYCLE: ContentCalendarItem['status'][] = ['draft', 'scheduled', 'published'];

const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  scheduled: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  published: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

const platformStyles: Record<string, { label: string; color: string; border: string; bg: string; icon: React.ReactNode }> = {
  newsletter: {
    label: 'Newsletter',
    color: 'text-purple-400',
    border: 'border-purple-500/20',
    bg: 'bg-purple-500/5',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  linkedin: {
    label: 'LinkedIn',
    color: 'text-blue-400',
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/5',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  twitter: {
    label: 'X / Twitter',
    color: 'text-cyan-400',
    border: 'border-cyan-500/20',
    bg: 'bg-cyan-500/5',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatBatchLabel(startDate: string): string {
  const d = new Date(startDate);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ContentCalendar() {
  const {
    items, batches, activeBatchId, loading, generating, publishingId, socialStatus, error,
    generate, updateItem, deleteItem, deleteBatch, selectBatch, publishItem, fetchSocialStatus,
  } = useContentCalendar();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [showBatchMenu, setShowBatchMenu] = useState(false);
  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState(false);

  const activeBatch = batches.find((b) => b.batch_id === activeBatchId);

  // Listen for LinkedIn OAuth popup postMessage
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === 'linkedin-connected') {
        fetchSocialStatus();
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchSocialStatus]);

  const connectLinkedIn = useCallback(async () => {
    try {
      const { auth_url } = await socialApi.getLinkedInAuthUrl();
      window.open(auth_url, 'linkedin-oauth', 'width=600,height=700,left=200,top=100');
    } catch {
      // ignore
    }
  }, []);

  const disconnectLinkedIn = useCallback(async () => {
    try {
      await socialApi.disconnectLinkedIn();
      fetchSocialStatus();
    } catch {
      // ignore
    }
  }, [fetchSocialStatus]);

  // Group items by week
  const weeks: Record<number, ContentCalendarItem[]> = {};
  for (const item of items) {
    if (!weeks[item.week_number]) weeks[item.week_number] = [];
    weeks[item.week_number].push(item);
  }

  function startEdit(item: ContentCalendarItem) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditBody(item.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle('');
    setEditBody('');
  }

  async function saveEdit(id: number) {
    await updateItem(id, { title: editTitle, body: editBody });
    setEditingId(null);
  }

  async function cycleStatus(item: ContentCalendarItem) {
    const idx = STATUS_CYCLE.indexOf(item.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    await updateItem(item.id, { status: next });
  }

  // Check if a platform is ready for publishing
  function canPublish(platform: string): boolean {
    if (!socialStatus) return false;
    if (platform === 'linkedin') return socialStatus.linkedin.connected;
    if (platform === 'twitter') return socialStatus.twitter.connected;
    return false;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-orange-400">
          Content Calendar
        </h2>

        <div className="flex-1" />

        {/* Batch selector */}
        {batches.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowBatchMenu(!showBatchMenu)}
              className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:border-orange-500/30 transition-all"
            >
              <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {activeBatch ? formatBatchLabel(activeBatch.start_date) : 'Select batch'}
              <svg className="h-3 w-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showBatchMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowBatchMenu(false)} />
                <div
                  className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-white/10 py-1 shadow-xl"
                  style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)' }}
                >
                  {batches.map((b) => (
                    <button
                      key={b.batch_id}
                      onClick={() => { selectBatch(b.batch_id); setShowBatchMenu(false); }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 flex items-center justify-between ${
                        b.batch_id === activeBatchId ? 'text-orange-400' : 'text-gray-400'
                      }`}
                    >
                      <span>{formatBatchLabel(b.start_date)}</span>
                      <span className="text-[10px] font-mono text-gray-600">{b.item_count} items</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Delete batch button */}
        {activeBatchId && (
          <div className="relative">
            {confirmDeleteBatch ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-red-400 font-mono">Delete batch?</span>
                <button
                  onClick={() => { deleteBatch(activeBatchId); setConfirmDeleteBatch(false); }}
                  className="rounded px-2 py-1 text-[10px] font-semibold text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-all"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDeleteBatch(false)}
                  className="rounded px-2 py-1 text-[10px] text-gray-500 border border-white/10 hover:bg-white/5 transition-all"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteBatch(true)}
                className="rounded-md border border-white/10 bg-white/5 p-1.5 text-gray-600 hover:text-red-400 hover:border-red-500/20 transition-all"
                title="Delete batch"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={() => generate()}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs font-semibold text-orange-400 uppercase tracking-wider hover:bg-orange-500/20 transition-all disabled:opacity-50"
          style={{ boxShadow: '0 0 20px rgba(249, 115, 22, 0.1)' }}
        >
          {generating ? (
            <>
              <LoadingSpinner size="xs" />
              Generating...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate
            </>
          )}
        </button>
      </div>

      {/* Connection Banner */}
      {socialStatus && (
        <ConnectionBanner
          socialStatus={socialStatus}
          onConnectLinkedIn={connectLinkedIn}
          onDisconnectLinkedIn={disconnectLinkedIn}
        />
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs text-red-400 font-mono">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && !generating && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="md" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !generating && items.length === 0 && (
        <div
          className="rounded-xl border border-white/5 p-12 text-center"
          style={{ background: 'rgba(15, 23, 42, 0.3)' }}
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/5">
            <svg className="h-6 w-6 text-orange-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400 mb-1">No content calendar yet</p>
          <p className="text-[11px] text-gray-600">Click Generate to create a 4-week content plan</p>
        </div>
      )}

      {/* Generating overlay */}
      {generating && (
        <div
          className="rounded-xl border border-orange-500/20 p-12 text-center"
          style={{ background: 'rgba(15, 23, 42, 0.4)' }}
        >
          <div className="mx-auto mb-4">
            <LoadingSpinner size="lg" />
          </div>
          <p className="text-sm text-orange-400 font-semibold mb-1">Generating 4-week content plan...</p>
          <p className="text-[11px] text-gray-600 font-mono">This takes 20-30 seconds</p>
        </div>
      )}

      {/* Week Grid */}
      {!generating && Object.keys(weeks).sort().map((weekNum) => {
        const weekItems = weeks[Number(weekNum)];
        const newsletters = weekItems.filter((i) => i.platform === 'newsletter');
        const linkedinPosts = weekItems.filter((i) => i.platform === 'linkedin');
        const tweets = weekItems.filter((i) => i.platform === 'twitter');

        // Compute week date range from items
        const dates = weekItems.map((i) => i.scheduled_date).sort();
        const rangeLabel = dates.length > 0
          ? `${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])}`
          : '';

        return (
          <div key={weekNum}>
            {/* Week header */}
            <div className="flex items-center gap-2 px-1 mb-3">
              <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-gray-400">
                Week {weekNum}
              </div>
              <span className="text-[10px] text-gray-600 font-mono">{rangeLabel}</span>
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[9px] font-mono text-gray-700">
                {weekItems.length} items
              </span>
            </div>

            {/* 3-column platform grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Newsletter column */}
              <PlatformColumn
                platform="newsletter"
                items={newsletters}
                editingId={editingId}
                editTitle={editTitle}
                editBody={editBody}
                publishingId={publishingId}
                canPublish={false}
                socialStatus={socialStatus}
                onEditTitle={setEditTitle}
                onEditBody={setEditBody}
                onStartEdit={startEdit}
                onCancelEdit={cancelEdit}
                onSaveEdit={saveEdit}
                onCycleStatus={cycleStatus}
                onDelete={deleteItem}
                onPublish={publishItem}
              />

              {/* LinkedIn column */}
              <PlatformColumn
                platform="linkedin"
                items={linkedinPosts}
                editingId={editingId}
                editTitle={editTitle}
                editBody={editBody}
                publishingId={publishingId}
                canPublish={canPublish('linkedin')}
                socialStatus={socialStatus}
                onEditTitle={setEditTitle}
                onEditBody={setEditBody}
                onStartEdit={startEdit}
                onCancelEdit={cancelEdit}
                onSaveEdit={saveEdit}
                onCycleStatus={cycleStatus}
                onDelete={deleteItem}
                onPublish={publishItem}
              />

              {/* Twitter column */}
              <PlatformColumn
                platform="twitter"
                items={tweets}
                editingId={editingId}
                editTitle={editTitle}
                editBody={editBody}
                publishingId={publishingId}
                canPublish={canPublish('twitter')}
                socialStatus={socialStatus}
                onEditTitle={setEditTitle}
                onEditBody={setEditBody}
                onStartEdit={startEdit}
                onCancelEdit={cancelEdit}
                onSaveEdit={saveEdit}
                onCycleStatus={cycleStatus}
                onDelete={deleteItem}
                onPublish={publishItem}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Connection Banner ─────────────────────────────────────────────

function ConnectionBanner({
  socialStatus,
  onConnectLinkedIn,
  onDisconnectLinkedIn,
}: {
  socialStatus: SocialStatus;
  onConnectLinkedIn: () => void;
  onDisconnectLinkedIn: () => void;
}) {
  const needsLinkedIn = socialStatus.linkedin.configured && !socialStatus.linkedin.connected;
  const needsTwitter = !socialStatus.twitter.configured;
  const linkedInConnected = socialStatus.linkedin.connected;
  const twitterConnected = socialStatus.twitter.connected;

  // All connected — show compact status
  if (linkedInConnected && twitterConnected) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-white/5 px-3 py-2" style={{ background: 'rgba(15, 23, 42, 0.3)' }}>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-gray-500">LinkedIn</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-gray-500">X/Twitter</span>
        </div>
        <div className="flex-1" />
        <button
          onClick={onDisconnectLinkedIn}
          className="text-[9px] text-gray-700 hover:text-red-400 transition-colors"
        >
          Disconnect LinkedIn
        </button>
      </div>
    );
  }

  // Show banners for disconnected services
  if (!needsLinkedIn && !needsTwitter) return null;

  return (
    <div className="space-y-2">
      {needsLinkedIn && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-500/15 bg-blue-500/5 px-3 py-2">
          <svg className="h-4 w-4 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          <span className="text-[11px] text-blue-300">Connect LinkedIn to publish posts</span>
          <div className="flex-1" />
          <button
            onClick={onConnectLinkedIn}
            className="rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[10px] font-semibold text-blue-400 hover:bg-blue-500/20 transition-all"
          >
            Connect
          </button>
        </div>
      )}

      {needsTwitter && (
        <div className="flex items-center gap-3 rounded-lg border border-cyan-500/15 bg-cyan-500/5 px-3 py-2">
          <svg className="h-4 w-4 text-cyan-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="text-[11px] text-cyan-300/70">Add X/Twitter API keys to .env to publish</span>
        </div>
      )}
    </div>
  );
}

// ── Platform Column ──────────────────────────────────────────────

interface PlatformColumnProps {
  platform: string;
  items: ContentCalendarItem[];
  editingId: number | null;
  editTitle: string;
  editBody: string;
  publishingId: number | null;
  canPublish: boolean;
  socialStatus: SocialStatus | null;
  onEditTitle: (v: string) => void;
  onEditBody: (v: string) => void;
  onStartEdit: (item: ContentCalendarItem) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: number) => void;
  onCycleStatus: (item: ContentCalendarItem) => void;
  onDelete: (id: number) => void;
  onPublish: (id: number) => void;
}

function PlatformColumn({
  platform, items, editingId, editTitle, editBody, publishingId, canPublish, socialStatus,
  onEditTitle, onEditBody, onStartEdit, onCancelEdit, onSaveEdit, onCycleStatus, onDelete, onPublish,
}: PlatformColumnProps) {
  const style = platformStyles[platform] || platformStyles.newsletter;

  // Connection indicator for column header
  const isConnected = platform === 'newsletter' ? false
    : platform === 'linkedin' ? socialStatus?.linkedin.connected
    : socialStatus?.twitter.connected;

  return (
    <div
      className={`rounded-xl border ${style.border} p-3`}
      style={{ background: 'rgba(15, 23, 42, 0.4)' }}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3">
        <span className={style.color}>{style.icon}</span>
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${style.color}`}>
          {style.label}
        </span>
        <span className="text-[9px] font-mono text-gray-700">({items.length})</span>
        {platform !== 'newsletter' && (
          <div className="flex-1 flex justify-end">
            <div
              className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-gray-600'}`}
              title={isConnected ? 'Connected' : 'Not connected'}
            />
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {items.map((item) => {
          const isEditing = editingId === item.id;
          const isPublishing = publishingId === item.id;
          const isPublished = item.status === 'published';
          const showPublishBtn = platform !== 'newsletter' && !isPublished;
          const ss = statusStyles[item.status] || statusStyles.draft;

          if (isEditing) {
            return (
              <div
                key={item.id}
                className={`rounded-lg border border-orange-500/30 p-3`}
                style={{ background: 'rgba(15, 23, 42, 0.6)' }}
              >
                <input
                  value={editTitle}
                  onChange={(e) => onEditTitle(e.target.value)}
                  className="w-full rounded border border-white/10 bg-slate-900/60 px-2 py-1.5 text-xs text-gray-200 mb-2 focus:border-orange-500/40 focus:outline-none"
                />
                <textarea
                  value={editBody}
                  onChange={(e) => onEditBody(e.target.value)}
                  rows={5}
                  className="w-full resize-none rounded border border-white/10 bg-slate-900/60 px-2 py-1.5 text-xs text-gray-300 font-mono mb-2 focus:border-orange-500/40 focus:outline-none"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={onCancelEdit}
                    className="rounded px-3 py-1 text-[10px] text-gray-500 border border-white/10 hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onSaveEdit(item.id)}
                    className="rounded px-3 py-1 text-[10px] font-semibold text-orange-400 border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 transition-all"
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className="group rounded-lg border border-white/5 p-3 hover:border-white/10 transition-all cursor-pointer"
              style={{ background: 'rgba(15, 23, 42, 0.3)' }}
              onClick={() => onStartEdit(item)}
            >
              {/* Date + Status */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-gray-600">
                  {formatDate(item.scheduled_date)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onCycleStatus(item); }}
                  className={`rounded-full border ${ss.border} ${ss.bg} px-2 py-0.5 text-[9px] font-mono ${ss.text} hover:opacity-80 transition-all`}
                >
                  {item.status}
                </button>
              </div>

              {/* Title */}
              <div className="text-xs font-medium text-gray-300 mb-1 line-clamp-2">
                {item.title}
              </div>

              {/* Body preview */}
              <div className="text-[11px] text-gray-600 line-clamp-2">
                {item.body}
              </div>

              {/* Hashtags */}
              {item.hashtags && (
                <div className="text-[10px] text-cyan-600 mt-1.5 line-clamp-1 font-mono">
                  {item.hashtags}
                </div>
              )}

              {/* Published link */}
              {isPublished && item.published_url && (
                <a
                  href={item.published_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 mt-2 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  View post
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}

              {/* Action row */}
              <div className="flex items-center justify-end gap-1.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Publish button */}
                {showPublishBtn && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onPublish(item.id); }}
                    disabled={!canPublish || isPublishing}
                    title={!canPublish ? `${platform === 'linkedin' ? 'LinkedIn' : 'X/Twitter'} not connected` : 'Publish now'}
                    className={`rounded px-2.5 py-1 text-[10px] font-semibold border transition-all flex items-center gap-1.5 ${
                      canPublish
                        ? platform === 'linkedin'
                          ? 'text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20'
                          : 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20'
                        : 'text-gray-600 border-white/5 bg-white/5 cursor-not-allowed'
                    }`}
                  >
                    {isPublishing ? (
                      <LoadingSpinner size="xs" />
                    ) : (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                    {isPublishing ? 'Publishing...' : 'Publish'}
                  </button>
                )}

                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  className="rounded p-1 text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Delete"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="py-4 text-center text-[10px] text-gray-700 font-mono">
            No {style.label.toLowerCase()} content
          </div>
        )}
      </div>
    </div>
  );
}
