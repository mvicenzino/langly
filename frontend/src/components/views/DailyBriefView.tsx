import { useState, useCallback } from 'react';
import { useDailyBrief } from '../../hooks/useDailyBrief';
import type { BriefSection as BriefSectionData, BriefNewsItem, BriefPipeline } from '../../types/briefs';

// ── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDateHeader(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

// ── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-white/5 p-4 animate-pulse ${className}`}
         style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
      <div className="h-3 w-24 bg-white/5 rounded mb-3" />
      <div className="space-y-2">
        <div className="h-2.5 w-full bg-white/5 rounded" />
        <div className="h-2.5 w-3/4 bg-white/5 rounded" />
      </div>
    </div>
  );
}

// ── Section wrapper ─────────────────────────────────────────────────────────

function BriefSection({ title, accentColor, icon, children, loading }: {
  title: string;
  accentColor: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-500/20 text-blue-400',
    emerald: 'border-emerald-500/20 text-emerald-400',
    amber: 'border-amber-500/20 text-amber-400',
    purple: 'border-purple-500/20 text-purple-400',
    rose: 'border-rose-500/20 text-rose-400',
    cyan: 'border-cyan-500/20 text-cyan-400',
    orange: 'border-orange-500/20 text-orange-400',
    red: 'border-red-500/20 text-red-400',
  };
  const colors = colorMap[accentColor] || colorMap.blue;
  const [border, text] = colors.split(' ');

  if (loading) return <SkeletonCard />;

  return (
    <div className={`rounded-xl border ${border} overflow-hidden`}
         style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
        <span className={text}>{icon}</span>
        <span className={`text-[10px] font-semibold uppercase tracking-widest ${text}`}>{title}</span>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function DailyBriefView() {
  const brief = useDailyBrief();

  const refreshAll = useCallback(() => {
    brief.refresh();
  }, [brief.refresh]);

  return (
    <div className="pb-8 space-y-4">
      {/* ── Greeting Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white" style={{ textShadow: '0 0 30px rgba(59, 130, 246, 0.15)' }}>
            {getGreeting()}, Mike!
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{formatDateHeader()}</p>
        </div>
        <button
          onClick={refreshAll}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 hover:text-white hover:border-white/20 transition-all"
          style={{ background: 'rgba(15, 23, 42, 0.5)' }}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Two-Column Feed Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ════ LEFT COLUMN ════ */}
        <div className="space-y-4 lg:overflow-y-auto lg:max-h-[calc(100vh-8rem)] lg:pr-1 custom-scrollbar">

          {/* ── Headlines (Google News) ──────────────────────────────── */}
          <ContentFeedSection
            section={brief.data?.sections.find((s) => s.id === 'news')}
            loading={brief.loading && !brief.data}
            title="Headlines"
            accentColor="amber"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" />
              </svg>
            }
            grouped
          />

          {/* ── Drudge Report ────────────────────────────────────────── */}
          <ContentFeedSection
            section={brief.data?.sections.find((s) => s.id === 'drudge')}
            loading={brief.loading && !brief.data}
            title="Drudge Report"
            accentColor="red"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            }
          />

        </div>{/* end left column */}

        {/* ════ RIGHT COLUMN ════ */}
        <div className="space-y-4 lg:overflow-y-auto lg:max-h-[calc(100vh-8rem)] lg:pr-1 custom-scrollbar">

          {/* ── X / Social ───────────────────────────────────────────── */}
          <ContentFeedSection
            section={brief.data?.sections.find((s) => s.id === 'social')}
            loading={brief.loading && !brief.data}
            title="X / Social"
            accentColor="cyan"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            }
          />

          {/* ── Reddit AI ────────────────────────────────────────────── */}
          <ContentFeedSection
            section={brief.data?.sections.find((s) => s.id === 'reddit')}
            loading={brief.loading && !brief.data}
            title="Reddit AI"
            accentColor="orange"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
              </svg>
            }
          />

          {/* ── Job Pipeline (Stride) ────────────────────────────────── */}
          <JobPipelineSection
            section={brief.data?.sections.find((s) => s.id === 'jobs')}
            loading={brief.loading && !brief.data}
          />

        </div>{/* end right column */}

      </div>{/* end grid */}
    </div>
  );
}

// ── Content Feed Section ─────────────────────────────────────────────────────

function ContentFeedSection({ section, loading, title, accentColor, icon, grouped }: {
  section?: BriefSectionData;
  loading: boolean;
  title: string;
  accentColor: string;
  icon: React.ReactNode;
  grouped?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const items = (section?.items || []) as BriefNewsItem[];

  if (loading) return <SkeletonCard />;
  if (!section && !loading) return null;

  // Group by category if requested
  const groupedItems: Record<string, BriefNewsItem[]> = {};
  if (grouped) {
    for (const item of items) {
      const cat = item.category || 'General';
      if (!groupedItems[cat]) groupedItems[cat] = [];
      groupedItems[cat].push(item);
    }
  }

  return (
    <BriefSection title={title} accentColor={accentColor} icon={icon}>
      {items.length === 0 && section?.error ? (
        <p className="text-center text-[11px] text-gray-600 py-2">{section.error}</p>
      ) : items.length === 0 ? (
        <p className="text-center text-[11px] text-gray-600 py-2 uppercase tracking-wider">No items available</p>
      ) : (
        <div className="space-y-3">
          {grouped ? (
            Object.entries(groupedItems).map(([category, catItems]) => (
              <div key={category}>
                <div className="text-[9px] font-semibold uppercase tracking-wider text-amber-400/50 mb-1.5">{category}</div>
                <div className="space-y-1.5">
                  {catItems.map((item, i) => (
                    <FeedItem key={i} item={item} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <>
              {items.slice(0, open ? undefined : 4).map((item, i) => (
                <FeedItem key={i} item={item} />
              ))}
              {items.length > 4 && (
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <svg className={`h-3 w-3 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {open ? 'Show less' : `Show ${items.length - 4} more`}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </BriefSection>
  );
}

function FeedItem({ item }: { item: BriefNewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group rounded-lg border border-white/5 px-3 py-2 hover:border-white/10 transition-all"
      style={{ background: 'rgba(15, 23, 42, 0.4)' }}
    >
      <div className={`text-[11px] transition-colors leading-tight ${
        item.isHeadline ? 'text-white font-semibold group-hover:text-red-400' : 'text-gray-300 group-hover:text-amber-400'
      }`}>
        {item.title}
      </div>
      {item.snippet && (
        <div className="text-[10px] text-gray-600 mt-1 line-clamp-2 leading-snug">{item.snippet}</div>
      )}
      <div className="text-[9px] text-gray-700 mt-1">
        {item.source}{item.date ? ` · ${item.date}` : ''}
      </div>
    </a>
  );
}

// ── Job Pipeline Section (Stride) ─────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  applied: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  interview: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  interviewing: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  offer: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  rejected: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
  lead: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  saved: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
};

function JobPipelineSection({ section, loading }: {
  section?: BriefSectionData;
  loading: boolean;
}) {
  if (loading) return <SkeletonCard />;
  if (!section && !loading) return null;

  const pipeline = section?.pipeline as BriefPipeline | undefined;
  const error = section?.error;

  return (
    <BriefSection
      title="Job Pipeline"
      accentColor="purple"
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      }
    >
      {error && !pipeline ? (
        <p className="text-center text-[11px] text-gray-600 py-2">{error}</p>
      ) : !pipeline ? (
        <p className="text-center text-[11px] text-gray-600 py-2 uppercase tracking-wider">No pipeline data</p>
      ) : (
        <div className="space-y-3">
          {/* Status counts */}
          {Object.keys(pipeline.statusCounts).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(pipeline.statusCounts)
                .filter(([, count]) => count > 0)
                .map(([status, count]) => {
                  const colors = STATUS_COLORS[status.toLowerCase()] || 'text-gray-400 bg-gray-500/10 border-gray-500/20';
                  return (
                    <div
                      key={status}
                      className={`rounded-lg border px-3 py-1.5 ${colors}`}
                    >
                      <div className="text-lg font-bold font-mono leading-none">{count}</div>
                      <div className="text-[9px] uppercase tracking-wider mt-0.5 opacity-70">{status}</div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Total active */}
          {pipeline.totalActive > 0 && (
            <div className="text-[10px] text-gray-500 font-mono">
              {pipeline.totalActive} active application{pipeline.totalActive !== 1 ? 's' : ''}
            </div>
          )}

          {/* Upcoming events */}
          {pipeline.upcoming.length > 0 && (
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider text-purple-400/50 mb-1.5">Upcoming</div>
              <div className="space-y-1.5">
                {pipeline.upcoming.map((ev, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg border border-white/5 px-3 py-2"
                       style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
                    <div className="h-2 w-2 shrink-0 rounded-full bg-purple-500/60" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-gray-200 truncate">{ev.title}</div>
                      {ev.company && (
                        <div className="text-[10px] text-gray-500">{ev.company}</div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {ev.type && (
                        <div className="text-[9px] uppercase tracking-wider text-purple-400/60">{ev.type}</div>
                      )}
                      {ev.date && (
                        <div className="text-[10px] text-gray-600 font-mono">{formatDate(ev.date)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(pipeline.statusCounts).length === 0 && pipeline.upcoming.length === 0 && (
            <p className="text-center text-[11px] text-gray-600 py-2 uppercase tracking-wider">No active applications</p>
          )}
        </div>
      )}
    </BriefSection>
  );
}
