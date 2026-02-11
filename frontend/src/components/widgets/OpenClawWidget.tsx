import { useOpenClaw } from '../../hooks/useOpenClaw';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';

function formatTime(ms: number | null) {
  if (!ms) return '--';
  const d = new Date(ms);
  const now = Date.now();
  const diff = ms - now;

  if (Math.abs(diff) < 60000) return 'just now';
  if (diff > 0) {
    const mins = Math.round(diff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `in ${hrs}h`;
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  }
  const mins = Math.round(-diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const channelIcons: Record<string, string> = {
  telegram: 'TG',
  whatsapp: 'WA',
  slack: 'SL',
  discord: 'DC',
  imessage: 'iM',
  email: 'EM',
  webchat: 'WC',
};

export function OpenClawWidget() {
  const { status, cronJobs, workspaceFiles, loading, refresh } = useOpenClaw();

  return (
    <WidgetPanel
      title="OpenClaw"
      accentColor="rose"
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      }
      headerRight={
        loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <div className="flex items-center gap-2">
            {status?.alive && (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-mono text-emerald-400/70 uppercase">Live</span>
              </span>
            )}
            <button onClick={refresh} className="text-gray-600 hover:text-rose-400 transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        )
      }
    >
      <div className="p-3 space-y-3">
        {/* Gateway Status */}
        {status && status.configured && (
          <div className="rounded-lg border border-white/5 p-2.5" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-rose-400/60 font-mono">Gateway</span>
              <span className="text-[10px] font-mono text-gray-500">v{status.version}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-gray-500">
              <div>MODEL <span className="text-gray-300">{status.model.split('/').pop()}</span></div>
              <div>PORT <span className="text-gray-300">{status.port}</span></div>
              <div>MODE <span className="text-gray-300">{status.gatewayMode}</span></div>
              <div>AGENTS <span className="text-gray-300">{status.maxConcurrent}</span></div>
            </div>

            {/* Channel badges */}
            {status.channels.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {status.channels.map((ch) => (
                  <span
                    key={ch}
                    className="inline-flex items-center gap-1 rounded border border-rose-500/20 bg-rose-500/5 px-1.5 py-0.5 text-[9px] font-mono text-rose-300/80 uppercase"
                  >
                    <span className="h-1 w-1 rounded-full bg-emerald-400" />
                    {channelIcons[ch] || ch}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cron Jobs */}
        {cronJobs.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-rose-400/60 font-mono mb-1.5">
              Scheduled Ops ({cronJobs.filter(j => j.enabled).length} active)
            </div>
            <div className="space-y-1">
              {cronJobs.filter(j => j.enabled).slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded px-2 py-1.5 transition-all hover:bg-white/[0.02] border border-transparent hover:border-rose-500/10"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-gray-300 truncate">{job.name}</div>
                    <div className="text-[9px] font-mono text-gray-600 truncate">{job.schedule} {job.timezone}</div>
                  </div>
                  <div className="text-right ml-2 shrink-0">
                    <div className={`text-[9px] font-mono ${
                      job.lastStatus === 'ok' ? 'text-emerald-400/70' :
                      job.lastStatus === 'error' ? 'text-red-400/70' : 'text-gray-600'
                    }`}>
                      {job.lastStatus === 'ok' ? 'OK' : job.lastStatus?.toUpperCase() || '--'}
                    </div>
                    <div className="text-[9px] font-mono text-gray-600">
                      {formatTime(job.nextRunAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workspace Files */}
        {workspaceFiles.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-rose-400/60 font-mono mb-1.5">
              Workspace
            </div>
            <div className="space-y-0.5">
              {workspaceFiles.slice(0, 6).map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between px-2 py-1 text-[10px] font-mono"
                >
                  <span className="text-gray-400 truncate">
                    {file.isDir ? '/' : ''}{file.name}
                  </span>
                  <span className="text-gray-600 ml-2 shrink-0">
                    {file.isDir ? '--' : formatBytes(file.size)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {status && !status.configured && !loading && (
          <div className="text-center py-6 space-y-1.5">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider">Not configured</p>
            <p className="text-[10px] text-gray-600 font-mono">OpenClaw gateway not installed on this host</p>
          </div>
        )}

        {!status && !loading && (
          <p className="text-center text-[11px] text-gray-600 py-6 uppercase tracking-wider">
            Gateway offline
          </p>
        )}
      </div>
    </WidgetPanel>
  );
}
