import { useEffect, useState } from 'react';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface DoctorMetrics {
  timestamp: string;
  gateway_status: string;
  gateway_alive: boolean;
  active_agents: number;
  cron_health: {
    successful: number;
    failed: number;
    total: number;
  };
  last_heartbeat: string;
  heartbeat_interval_minutes: number;
  version: string;
}

export function OpenClawDoctorWidget() {
  const [metrics, setMetrics] = useState<DoctorMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/openclaw/doctor');
      if (!response.ok) throw new Error('Failed to fetch doctor metrics');
      const data = await response.json();
      setMetrics(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const syncToReminders = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/openclaw/doctor/sync-reminders', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to sync reminders');
      const data = await response.json();
      // Brief success feedback
      setTimeout(() => setSyncing(false), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
      setSyncing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, []);

  // Auto-refresh every hour (3600000ms)
  useEffect(() => {
    const interval = setInterval(fetchMetrics, 3600000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (failed: number, total: number) => {
    if (total === 0) return 'text-gray-500';
    const failureRate = failed / total;
    if (failureRate === 0) return 'text-emerald-400';
    if (failureRate < 0.1) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <WidgetPanel
      title="OpenClaw Health"
      accentColor="cyan"
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      headerRight={
        loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <div className="flex items-center gap-2">
            {metrics?.gateway_alive && (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-mono text-emerald-400/70 uppercase">Live</span>
              </span>
            )}
            <button 
              onClick={syncToReminders} 
              disabled={syncing}
              title="Sync metrics to Apple Reminders"
              className="text-gray-600 hover:text-amber-400 disabled:opacity-50 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button onClick={fetchMetrics} className="text-gray-600 hover:text-cyan-400 transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        )
      }
    >
      <div className="p-3 space-y-3">
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
            <p className="text-[10px] text-red-300/80 font-mono">{error}</p>
          </div>
        )}

        {metrics && (
          <>
            {/* 1. Gateway Status */}
            <div className="rounded-lg border border-white/5 p-2.5" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-cyan-400/60 font-mono">Gateway Status</span>
                <span className="text-[11px] font-mono">
                  {metrics.gateway_alive ? (
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span className="text-emerald-400">Online</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      <span className="text-red-400">Offline</span>
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-1.5 text-[10px] font-mono text-gray-600">v{metrics.version}</div>
            </div>

            {/* 2. Active Agents */}
            <div className="rounded-lg border border-white/5 p-2.5" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-cyan-400/60 font-mono">Active Agents</span>
                <span className="text-[14px] font-mono font-bold text-cyan-300">{metrics.active_agents}</span>
              </div>
            </div>

            {/* 3. Cron Job Health */}
            <div className="rounded-lg border border-white/5 p-2.5" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-cyan-400/60 font-mono">Cron Health</span>
                <span className="text-[10px] font-mono text-gray-600">{metrics.cron_health.total} jobs</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-[9px] text-gray-600 font-mono">Successful</div>
                    <div className="text-[13px] font-mono font-bold text-emerald-400">
                      {metrics.cron_health.successful}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-gray-600 font-mono">Failed</div>
                    <div className={`text-[13px] font-mono font-bold ${getHealthColor(metrics.cron_health.failed, metrics.cron_health.total)}`}>
                      {metrics.cron_health.failed}
                    </div>
                  </div>
                </div>
                
                {/* Failure rate bar */}
                {metrics.cron_health.total > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-gray-600 font-mono">Failure Rate</span>
                      <span className={`text-[10px] font-mono font-bold ${getHealthColor(metrics.cron_health.failed, metrics.cron_health.total)}`}>
                        {Math.round((metrics.cron_health.failed / metrics.cron_health.total) * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          metrics.cron_health.failed === 0 ? 'bg-emerald-400' :
                          (metrics.cron_health.failed / metrics.cron_health.total) < 0.1 ? 'bg-yellow-400' :
                          'bg-red-400'
                        }`}
                        style={{
                          width: `${Math.min(100, (metrics.cron_health.failed / metrics.cron_health.total) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Last Heartbeat */}
            <div className="rounded-lg border border-white/5 p-2.5" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-cyan-400/60 font-mono">Last Heartbeat</span>
                <span className="text-[10px] font-mono text-gray-400">
                  {metrics.last_heartbeat === 'never' 
                    ? 'Never'
                    : new Date(metrics.last_heartbeat).toLocaleTimeString('en', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })
                  }
                </span>
              </div>
              <div className="mt-1 text-[9px] font-mono text-gray-600">
                Interval: {metrics.heartbeat_interval_minutes}m
              </div>
            </div>

            {/* 5. Version & Last Update */}
            <div className="rounded-lg border border-white/5 p-2.5" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-cyan-400/60 font-mono">System</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">
                  {metrics.version}
                </span>
              </div>
              <div className="text-[9px] font-mono text-gray-600">
                Last check: {lastRefresh.toLocaleTimeString('en', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
            </div>
          </>
        )}

        {loading && !metrics && (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>
    </WidgetPanel>
  );
}
