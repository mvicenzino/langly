import { useState, useEffect, useCallback } from 'react';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { strideApi } from '../../api/client';
import type { StridePipeline, StrideStats, StrideEvent } from '../../types/stride';

const PIPELINE_ORDER = [
  'interested', 'preparing', 'applied', 'screening',
  'interviewing', 'final_round', 'offer', 'negotiating',
];

const STATUS_COLORS: Record<string, string> = {
  interested: '#6B7280',
  preparing: '#8B5CF6',
  applied: '#3B82F6',
  screening: '#06B6D4',
  interviewing: '#F59E0B',
  final_round: '#F97316',
  offer: '#10B981',
  negotiating: '#EC4899',
  accepted: '#22C55E',
  rejected: '#EF4444',
  withdrawn: '#9CA3AF',
  ghosted: '#6B7280',
};

export function StrideWidget() {
  const [pipeline, setPipeline] = useState<StridePipeline>({});
  const [stats, setStats] = useState<StrideStats | null>(null);
  const [events, setEvents] = useState<StrideEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [pipelineData, statsData, eventsData] = await Promise.all([
        strideApi.getPipeline(),
        strideApi.getStats(),
        strideApi.getUpcomingEvents(),
      ]);
      setPipeline(pipelineData);
      setStats(statsData);
      setEvents(eventsData);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Failed to load pipeline');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      });
    } catch {
      return '';
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const statusLabel = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Get recent applications across all statuses
  const allApps = Object.values(pipeline).flat();
  const recentApps = [...allApps]
    .sort((a, b) => {
      const da = a.dateApplied || '';
      const db = b.dateApplied || '';
      return db.localeCompare(da);
    })
    .slice(0, 5);

  const upcomingEvents = events.slice(0, 3);

  return (
    <WidgetPanel
      title="Job Pipeline"
      accentColor="cyan"
      insightPrompt="Analyze my job search pipeline. Review active applications, interview success rate, and suggest strategies to improve my job search momentum."
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      }
      headerRight={
        loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <button onClick={fetchData} className="text-gray-600 hover:text-cyan-400 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )
      }
    >
      <div className="p-3 space-y-2.5">
        {error && (
          <p className="text-center text-[11px] text-red-400/80 py-2">{error}</p>
        )}

        {/* Stats bar */}
        {stats && (
          <div className="flex gap-2 rounded-lg border border-white/5 px-2.5 py-2" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
            <div className="flex-1 text-center">
              <div className="text-lg font-bold text-cyan-400">{stats.activeApplications}</div>
              <div className="text-[9px] text-gray-600 uppercase tracking-wider">Active</div>
            </div>
            <div className="w-px bg-white/5" />
            <div className="flex-1 text-center">
              <div className="text-lg font-bold text-amber-400">{stats.interviewRate}%</div>
              <div className="text-[9px] text-gray-600 uppercase tracking-wider">Interview</div>
            </div>
            <div className="w-px bg-white/5" />
            <div className="flex-1 text-center">
              <div className="text-lg font-bold text-gray-300">{stats.totalApplications}</div>
              <div className="text-[9px] text-gray-600 uppercase tracking-wider">Applied</div>
            </div>
            <div className="w-px bg-white/5" />
            <div className="flex-1 text-center">
              <div className="text-lg font-bold text-emerald-400">
                {stats.appsThisWeek}
                {stats.weeklyChange !== 0 && (
                  <span className={`text-[10px] ml-0.5 ${stats.weeklyChange > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                    {stats.weeklyChange > 0 ? '+' : ''}{stats.weeklyChange}
                  </span>
                )}
              </div>
              <div className="text-[9px] text-gray-600 uppercase tracking-wider">This Week</div>
            </div>
          </div>
        )}

        {/* Pipeline mini-view */}
        <div className="rounded-lg border border-white/5 px-2.5 py-2" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
          <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1.5">Pipeline</div>
          <div className="flex gap-1">
            {PIPELINE_ORDER.map((status) => {
              const count = (pipeline[status] || []).length;
              return (
                <div key={status} className="flex-1 text-center">
                  <div
                    className="text-sm font-bold"
                    style={{ color: count > 0 ? STATUS_COLORS[status] || '#6B7280' : '#374151' }}
                  >
                    {count}
                  </div>
                  <div className="text-[8px] text-gray-700 truncate">{statusLabel(status)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent applications */}
        {recentApps.length > 0 && (
          <div className="space-y-1">
            <div className="text-[9px] text-gray-600 uppercase tracking-wider px-0.5">Recent Applications</div>
            {recentApps.map((app) => (
              <div
                key={app.id}
                className="flex items-center gap-2 rounded-lg border border-white/5 px-2.5 py-1.5 transition-all hover:border-cyan-500/15"
                style={{ background: 'rgba(15, 23, 42, 0.4)' }}
              >
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[app.status] || '#6B7280' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-200 truncate">{app.jobTitle}</div>
                  <div className="text-[10px] text-gray-500 truncate">{app.companyName}</div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-0.5">
                  <span
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      color: STATUS_COLORS[app.status] || '#6B7280',
                      backgroundColor: `${STATUS_COLORS[app.status] || '#6B7280'}15`,
                    }}
                  >
                    {statusLabel(app.status)}
                  </span>
                  {app.dateApplied && (
                    <span className="text-[9px] text-gray-700 font-mono">{formatDate(app.dateApplied)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming interviews */}
        {upcomingEvents.length > 0 && (
          <div className="space-y-1">
            <div className="text-[9px] text-gray-600 uppercase tracking-wider px-0.5">Upcoming Events</div>
            {upcomingEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex items-start gap-2 rounded-lg border border-white/5 px-2.5 py-1.5 transition-all hover:border-amber-500/15"
                style={{ background: 'rgba(15, 23, 42, 0.4)' }}
              >
                <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500/70" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-200 truncate">{ev.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-cyan-400/70 font-mono">{formatTime(ev.startTime)}</span>
                    {ev.companyName && (
                      <span className="text-[10px] text-gray-600">{ev.companyName}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {allApps.length === 0 && !loading && !error && (
          <p className="text-center text-[11px] text-gray-600 py-6 uppercase tracking-wider">
            No applications yet
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-[9px] text-gray-700 uppercase tracking-wider">
            {stats ? `${stats.activeApplications} active` : 'Job Pipeline'}
          </span>
          <a
            href="https://stride-jobs.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-cyan-500/50 hover:text-cyan-400 uppercase tracking-wider transition-colors"
          >
            Stride
          </a>
        </div>
      </div>
    </WidgetPanel>
  );
}
