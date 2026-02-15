import { useSystem } from '../../hooks/useSystem';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0B';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)}GB`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(0)}MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(1)}KB`;
}

function UsageBar({ percent, color, label, detail }: {
  percent: number;
  color: string;
  label: string;
  detail: string;
}) {
  const colorMap: Record<string, string> = {
    cyan: 'from-cyan-500 to-cyan-400',
    emerald: 'from-emerald-500 to-emerald-400',
    amber: 'from-amber-500 to-amber-400',
    red: 'from-red-500 to-red-400',
    purple: 'from-purple-500 to-purple-400',
  };

  const glowMap: Record<string, string> = {
    cyan: 'rgba(6, 182, 212, 0.3)',
    emerald: 'rgba(16, 185, 129, 0.3)',
    amber: 'rgba(245, 158, 11, 0.3)',
    red: 'rgba(239, 68, 68, 0.3)',
    purple: 'rgba(168, 85, 247, 0.3)',
  };

  const barColor = percent > 90 ? 'from-red-500 to-red-400' :
                   percent > 70 ? 'from-amber-500 to-amber-400' :
                   colorMap[color] || colorMap.cyan;

  const glow = percent > 90 ? glowMap.red :
               percent > 70 ? glowMap.amber :
               glowMap[color] || glowMap.cyan;

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">{label}</span>
        <span className="text-[10px] font-mono text-gray-400">{detail}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-800/80 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-1000 ease-out`}
          style={{
            width: `${Math.min(percent, 100)}%`,
            boxShadow: `0 0 8px ${glow}`,
          }}
        />
      </div>
    </div>
  );
}

export function SystemWidget() {
  const { systemInfo, services, loading, refresh } = useSystem();

  return (
    <WidgetPanel
      title="System Monitor"
      accentColor="teal"
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      }
      headerRight={
        loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <div className="flex items-center gap-2">
            {systemInfo && (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-mono text-emerald-400/70 uppercase">Online</span>
              </span>
            )}
            <button onClick={refresh} className="text-gray-600 hover:text-teal-400 transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        )
      }
    >
      <div className="p-3 space-y-3">
        {systemInfo && (
          <>
            {/* System Identity */}
            <div className="rounded-lg border border-white/5 p-2.5" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-gray-200">{systemInfo.hostname}</span>
                <span className="text-[9px] font-mono text-teal-400/60">{systemInfo.arch}</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-gray-600">
                <div>{systemInfo.os}</div>
                <div className="text-right">PY {systemInfo.python}</div>
              </div>
              {systemInfo.uptime && (
                <div className="text-[9px] font-mono text-gray-600 mt-0.5">Uptime {systemInfo.uptime}</div>
              )}
            </div>

            {/* Resource Meters */}
            <div className="space-y-2.5">
              <UsageBar
                percent={systemInfo.cpu.percent}
                color="cyan"
                label={`CPU ${systemInfo.cpu.cores}C/${systemInfo.cpu.threads}T`}
                detail={`${systemInfo.cpu.percent}%`}
              />
              <UsageBar
                percent={systemInfo.memory.percent}
                color="purple"
                label="Memory"
                detail={`${formatBytes(systemInfo.memory.used)} / ${formatBytes(systemInfo.memory.total)}`}
              />
              <UsageBar
                percent={systemInfo.disk.percent}
                color="emerald"
                label="Disk"
                detail={`${formatBytes(systemInfo.disk.used)} / ${formatBytes(systemInfo.disk.total)}`}
              />
            </div>

            {/* Network */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded border border-white/5 p-2 text-center" style={{ background: 'rgba(15, 23, 42, 0.3)' }}>
                <div className="text-[9px] font-mono text-gray-600 uppercase">Net TX</div>
                <div className="text-[11px] font-mono text-teal-400/80">{formatBytes(systemInfo.network.bytesSent)}</div>
              </div>
              <div className="rounded border border-white/5 p-2 text-center" style={{ background: 'rgba(15, 23, 42, 0.3)' }}>
                <div className="text-[9px] font-mono text-gray-600 uppercase">Net RX</div>
                <div className="text-[11px] font-mono text-teal-400/80">{formatBytes(systemInfo.network.bytesRecv)}</div>
              </div>
            </div>

            {/* Top Processes */}
            {systemInfo.topProcesses.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-teal-400/60 font-mono mb-1.5">
                  Top Processes
                </div>
                <div className="space-y-0.5">
                  {systemInfo.topProcesses.slice(0, 5).map((proc) => (
                    <div
                      key={proc.pid}
                      className="flex items-center justify-between px-1.5 py-0.5 text-[10px] font-mono"
                    >
                      <span className="text-gray-400 truncate flex-1">{proc.name}</span>
                      <span className="text-gray-600 ml-2 w-12 text-right">{proc.cpu}%</span>
                      <span className="text-gray-600 ml-1 w-12 text-right">{proc.memory}%</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-1.5 text-[9px] font-mono text-gray-700">
                    <span></span>
                    <span className="w-12 text-right">CPU</span>
                    <span className="ml-1 w-12 text-right">MEM</span>
                  </div>
                </div>
              </div>
            )}

            {/* Running Services */}
            {services.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-teal-400/60 font-mono mb-1.5">
                  Services ({services.length} active)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {services.map((svc) => (
                    <span
                      key={svc.port}
                      className="inline-flex items-center gap-1 rounded border border-teal-500/20 bg-teal-500/5 px-1.5 py-0.5 text-[9px] font-mono text-teal-300/80"
                    >
                      <span className="h-1 w-1 rounded-full bg-emerald-400" />
                      {svc.name}
                      <span className="text-gray-600">:{svc.port}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!systemInfo && !loading && (
          <p className="text-center text-[11px] text-gray-600 py-6 uppercase tracking-wider">
            System data unavailable
          </p>
        )}
      </div>
    </WidgetPanel>
  );
}
