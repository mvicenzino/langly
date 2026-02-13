import { useState, useEffect, useCallback } from 'react';
import { fetchSpendingBreakdown } from '../../api/finance';
import type { SpendingBreakdown } from '../../types/finance';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const COLORS = [
  '#34d399', '#60a5fa', '#f59e0b', '#a78bfa', '#f87171',
  '#2dd4bf', '#fb923c', '#818cf8', '#e879f9', '#38bdf8',
  '#fbbf24', '#4ade80',
];

function DonutChart({ categories, total }: { categories: { category: string; amount: number; percent: number }[]; total: number }) {
  const size = 120;
  const radius = 44;
  const strokeWidth = 16;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = categories.slice(0, 8).map((c, i) => {
    const dash = (c.percent / 100) * circumference;
    const gap = circumference - dash;
    const arc = (
      <circle
        key={c.category}
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke={COLORS[i % COLORS.length]}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${COLORS[i % COLORS.length]}30)` }}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    );
    offset += dash;
    return arc;
  });

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
      {arcs}
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-white text-sm font-bold font-mono">
        ${(total / 1000).toFixed(1)}k
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" className="fill-gray-500 text-[8px]">
        total spent
      </text>
    </svg>
  );
}

export function SpendingWidget() {
  const [data, setData] = useState<SpendingBreakdown | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchSpendingBreakdown(2);
      setData(d);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <WidgetPanel
      title="Spending Breakdown"
      accentColor="emerald"
      icon={
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
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
      <div className="p-3">
        {!data && !loading && <p className="text-center text-xs text-gray-600 py-4">No data</p>}
        {data && (
          <div className="flex gap-3">
            <DonutChart categories={data.categories} total={data.totalSpending} />
            <div className="flex-1 space-y-1 overflow-y-auto max-h-[240px]">
              {data.categories.slice(0, 10).map((c, i) => (
                <div key={c.category} className="flex items-center gap-2">
                  <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="truncate text-[11px] text-gray-300 flex-1">{c.category}</span>
                  <span className="text-[10px] font-mono text-gray-400">${c.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  <span className="text-[9px] font-mono text-gray-600 w-8 text-right">{c.percent.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </WidgetPanel>
  );
}
