import { useState, useCallback } from 'react';
import { useDailyBrief } from '../../hooks/useDailyBrief';
import { ImportantEmailsWidget } from '../widgets/ImportantEmailsWidget';
import type { BriefSection as BriefSectionData, BriefNewsItem } from '../../types/briefs';

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

      {/* ── Important Emails ────────────────────────────────────────── */}
      <ImportantEmailsWidget />

      {/* ── Two-Column Feed Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ════ LEFT COLUMN ════ */}
        <div className="space-y-4 lg:overflow-y-auto lg:max-h-[calc(100vh-8rem)] lg:pr-1 custom-scrollbar">

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

          {/* ── Hacker News ──────────────────────────────────────────── */}
          <ContentFeedSection
            section={brief.data?.sections.find((s) => s.id === 'hackernews')}
            loading={brief.loading && !brief.data}
            title="Hacker News"
            accentColor="orange"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 0v24h24V0H0zm12.3 13.27V18.5h-.6v-5.23L7.5 5.5h.7l3.8 7 3.8-7h.7l-4.2 7.77z" />
              </svg>
            }
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
        {item.score != null && <span> · {item.score} pts</span>}
        {item.comments != null && <span> · {item.comments} comments</span>}
      </div>
    </a>
  );
}

