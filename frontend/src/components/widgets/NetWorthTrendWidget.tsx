import { useState, useEffect, useCallback } from 'react';
import { fetchNetWorthHistory } from '../../api/finance';
import type { NetWorthHistory } from '../../types/finance';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';

function MiniAreaChart({ data, width = 280, height = 100 }: { data: { label: string; value: number }[]; width?: number; height?: number }) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values) * 0.98;
  const max = Math.max(...values) * 1.02;
  const range = max - min || 1;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d.value - min) / range) * (height - 20);
      return `${x},${y}`;
    })
    .join(' ');

  const firstY = height - ((values[0] - min) / range) * (height - 20);
  const lastY = height - ((values[values.length - 1] - min) / range) * (height - 20);
  const fillPoints = `0,${firstY} ${points} ${width},${lastY} ${width},${height} 0,${height}`;

  const isPositive = values[values.length - 1] >= values[0];
  const color = isPositive ? '#34d399' : '#f87171';

  return (
    <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="nw-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon fill="url(#nw-grad)" points={fillPoints} />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2}
        points={points}
        style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
      />
    </svg>
  );
}

export function NetWorthTrendWidget() {
  const [data, setData] = useState<NetWorthHistory | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchNetWorthHistory(12);
      setData(d);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const chartData = data?.points.map((p) => ({ label: p.month, value: p.netWorth })) || [];

  return (
    <WidgetPanel
      title="Net Worth Trend"
      accentColor="emerald"
      insightPrompt="Analyze my net worth trajectory over time. Identify growth patterns, inflection points, and suggest strategies to accelerate growth."
      icon={
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      }
      headerRight={loading ? <LoadingSpinner size="sm" /> : (
        <button onClick={refresh} className="rounded p-1 text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}
    >
      <div className="p-3 space-y-3">
        {!data && !loading && <p className="text-center text-xs text-gray-600 py-4">No data</p>}
        {data && (
          <>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xl font-bold font-mono text-white">
                  ${data.currentNetWorth.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">12-month trend</div>
              </div>
              <div className={`text-right ${data.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                <div className="text-sm font-mono font-medium">
                  {data.change >= 0 ? '+' : ''}{data.changePercent.toFixed(1)}%
                </div>
                <div className="text-[10px] font-mono">
                  {data.change >= 0 ? '+' : ''}${Math.abs(data.change).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2 overflow-hidden">
              <MiniAreaChart data={chartData} />
            </div>

            {/* Month labels */}
            <div className="flex justify-between text-[9px] text-gray-600 px-1">
              {data.points.filter((_, i) => i % 3 === 0).map((p) => (
                <span key={p.month}>{p.month.slice(5)}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </WidgetPanel>
  );
}
