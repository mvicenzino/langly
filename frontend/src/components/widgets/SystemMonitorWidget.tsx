import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../../api/client';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface SystemInfo {
  hostname: string;
  os: string;
  python: string;
  uptime: string;
  cpu: { percent: number; cores: number; threads: number };
  memory: { total: number; used: number; percent: number };
  disk: { total: number; used: number; percent: number };
  network: { bytesSent: number; bytesRecv: number };
}

interface ServiceInfo {
  port: number;
  name: string;
  kind: string;
  status: string;
}

function formatBytes(bytes: number) {
  if (!bytes) return '0B';
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + 'GB';
}

function Bar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: Math.min(percent, 100) + '%',
          background: percent > 85
            ? 'rgb(248, 113, 113)'
            : percent > 60
            ? 'rgb(251, 191, 36)'
            : color,
        }}
      />
    </div>
  );
}

export function SystemMonitorWidget() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [sys, svc] = await Promise.all([
        apiGet<SystemInfo>('/api/system/info').catch(() => null),
        apiGet<ServiceInfo[]>('/api/system/services').catch(() => []),
      ]);
      if (sys) setInfo(sys);
      setServices(svc);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    var interval = setInterval(refresh, 15000);
    return function () { clearInterval(interval); };
  }, [refresh]);

  return (
    <WidgetPanel
      title="System Monitor"
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
            {info && (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-mono text-emerald-400/70 uppercase">Online</span>
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
        {info && (
          <>
            {/* Host info */}
            <div className="rounded-lg border border-white/5 p-2.5" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-rose-400/60 font-mono">Host</span>
                <span className="text-[10px] font-mono text-gray-500">{info.os}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-gray-500">
                <div>HOST <span className="text-gray-300">{info.hostname}</span></div>
                <div>PY <span className="text-gray-300">{info.python}</span></div>
              </div>
            </div>

            {/* Resource gauges */}
            <div className="space-y-2.5">
              {/* CPU */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-gray-500">CPU</span>
                  <span className="text-[10px] font-mono text-gray-300">{info.cpu.percent}%</span>
                </div>
                <Bar percent={info.cpu.percent} color="rgb(244, 63, 94)" />
                <div className="text-[9px] font-mono text-gray-600 mt-0.5">
                  {info.cpu.cores}c / {info.cpu.threads}t
                </div>
              </div>

              {/* Memory */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-gray-500">MEM</span>
                  <span className="text-[10px] font-mono text-gray-300">
                    {formatBytes(info.memory.used)} / {formatBytes(info.memory.total)}
                  </span>
                </div>
                <Bar percent={info.memory.percent} color="rgb(168, 85, 247)" />
              </div>

              {/* Disk */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-gray-500">DISK</span>
                  <span className="text-[10px] font-mono text-gray-300">
                    {formatBytes(info.disk.used)} / {formatBytes(info.disk.total)}
                  </span>
                </div>
                <Bar percent={info.disk.percent} color="rgb(59, 130, 246)" />
              </div>

              {/* Network */}
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                <span>NET</span>
                <span>
                  <span className="text-emerald-400/70">{formatBytes(info.network.bytesRecv)}</span>
                  {' / '}
                  <span className="text-rose-400/70">{formatBytes(info.network.bytesSent)}</span>
                </span>
              </div>
            </div>

            {/* Services */}
            {services.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-rose-400/60 font-mono mb-1.5">
                  Services ({services.length} active)
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {services.map((svc) => (
                    <span
                      key={svc.port}
                      className="inline-flex items-center gap-1 rounded border border-rose-500/20 bg-rose-500/5 px-1.5 py-0.5 text-[9px] font-mono text-rose-300/80"
                    >
                      <span className="h-1 w-1 rounded-full bg-emerald-400" />
                      {svc.name} :{svc.port}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!info && !loading && (
          <p className="text-center text-[11px] text-gray-600 py-6 uppercase tracking-wider">
            System unavailable
          </p>
        )}
      </div>
    </WidgetPanel>
  );
}
