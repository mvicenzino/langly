import { useActivity } from '../../hooks/useActivity';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const sourceIcons: Record<string, string> = {
  chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  todo: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  note: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  skill: 'M13 10V3L4 14h7v7l9-11h-7z',
  system: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z',
};

const sourceColors: Record<string, string> = {
  chat: 'text-cyan-400',
  todo: 'text-emerald-400',
  note: 'text-amber-400',
  skill: 'text-orange-400',
  system: 'text-teal-400',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ActivityWidget() {
  const { entries, loading, refresh } = useActivity();

  return (
    <WidgetPanel
      title="Activity Feed"
      accentColor="violet"
      insightPrompt="Analyze my recent activity feed. Identify key trends, patterns, and suggest areas to focus on."
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      }
      headerRight={
        loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <button onClick={refresh} className="text-gray-600 hover:text-violet-400 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )
      }
    >
      <div className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100%-2rem)]">
        {entries.length === 0 && !loading && (
          <p className="text-center text-[11px] text-gray-600 py-6 uppercase tracking-wider">
            No activity yet
          </p>
        )}
        {entries.map((entry) => {
          const iconPath = sourceIcons[entry.source] || sourceIcons.system;
          const color = sourceColors[entry.source] || 'text-gray-400';
          return (
            <div
              key={entry.id}
              className="flex items-start gap-2.5 rounded-md border border-white/5 px-2.5 py-2 transition-all hover:border-violet-500/15"
              style={{ background: 'rgba(15, 23, 42, 0.3)' }}
            >
              <div className={`mt-0.5 shrink-0 ${color}`}>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPath} />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-gray-300 truncate">{entry.summary}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] uppercase tracking-wider text-gray-600">
                    {entry.source}
                  </span>
                  <span className="text-[9px] text-gray-700">
                    {timeAgo(entry.created_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetPanel>
  );
}
