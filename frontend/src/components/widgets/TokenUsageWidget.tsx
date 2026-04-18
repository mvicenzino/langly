import { useState, useEffect, useCallback } from 'react';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { Zap, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';

interface Stats {
  today:      { cost: number; tokens: number };
  this_week:  { cost: number };
  this_month: { cost: number; tokens: number };
  all_time:   { cost: number };
}

interface DailyPoint {
  date: string;
  tokens: number;
  cost: number;
}

interface ModelBreakdown {
  model: string;
  calls: number;
  tokens: number;
  cost: number;
}

interface UsageData {
  period_days: number;
  totals: {
    calls: number;
    total_tokens: number;
    total_cost: number;
  };
  by_model: ModelBreakdown[];
  daily: DailyPoint[];
}

const MODEL_COLORS: Record<string, string> = {
  'gpt-4o-mini':     '#34d399',
  'gpt-4o':          '#60a5fa',
  'gpt-4-turbo':     '#a78bfa',
  'gpt-4':           '#f87171',
  'gpt-3.5-turbo':   '#fbbf24',
  'claude-sonnet-4': '#fb923c',
  'claude-haiku':    '#2dd4bf',
};

function fmt$(n: number) {
  if (n < 0.01) return `$${(n * 100).toFixed(3)}¢`.replace('$', '');
  return `$${n.toFixed(4)}`;
}

function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function MiniBar({ daily }: { daily: DailyPoint[] }) {
  if (!daily.length) return null;
  const maxCost = Math.max(...daily.map(d => d.cost), 0.001);
  const last14 = daily.slice(-14);

  return (
    <div className="flex items-end gap-[3px] h-10 w-full mt-2">
      {last14.map((d, i) => {
        const pct = Math.max((d.cost / maxCost) * 100, d.cost > 0 ? 8 : 2);
        const isToday = i === last14.length - 1;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div
              style={{
                height: `${pct}%`,
                background: isToday ? '#34d399' : 'rgba(52,211,153,0.35)',
                borderRadius: 3,
                width: '100%',
                transition: 'background 0.2s',
              }}
            />
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
              {d.date.slice(5)}: {fmt$(d.cost)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TokenUsageWidget() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, u] = await Promise.all([
        fetch('/api/token-usage/stats').then(r => r.json()),
        fetch('/api/token-usage?days=30').then(r => r.json()),
      ]);
      if (s.error || u.error) throw new Error(s.error || u.error);
      setStats(s);
      setUsage(u);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <WidgetPanel
      title="Token Usage"
      icon={<Zap size={14} className="text-green-400" />}
      headerRight={
        <button onClick={load} className="p-1 rounded hover:bg-white/5 transition-colors" title="Refresh">
          <RefreshCw size={12} className="text-gray-500" />
        </button>
      }
      accentColor="emerald"
    >
      {loading ? (
        <div className="flex justify-center py-6"><LoadingSpinner /></div>
      ) : error ? (
        <div className="text-red-400 text-xs py-4 text-center">{error}</div>
      ) : stats && usage ? (
        <div className="space-y-4">

          {/* Stat row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Today',      cost: stats.today.cost,      tokens: stats.today.tokens,      color: '#34d399' },
              { label: 'This Week',  cost: stats.this_week.cost,  tokens: null,                    color: '#60a5fa' },
              { label: 'This Month', cost: stats.this_month.cost, tokens: stats.this_month.tokens, color: '#a78bfa' },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-lg p-2.5 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="text-[10px] text-gray-500 mb-1">{s.label}</div>
                <div className="text-sm font-bold font-mono" style={{ color: s.color }}>
                  {fmt$(s.cost)}
                </div>
                {s.tokens != null && (
                  <div className="text-[10px] text-gray-600 mt-0.5">{fmtTokens(s.tokens)} tok</div>
                )}
              </div>
            ))}
          </div>

          {/* 14-day bar chart */}
          {usage.daily.length > 0 && (
            <div>
              <div className="text-[10px] text-gray-500 mb-1">14-day spend (hover for details)</div>
              <MiniBar daily={usage.daily} />
            </div>
          )}

          {/* By model */}
          {usage.by_model.length > 0 && (
            <div>
              <div className="text-[10px] text-gray-500 mb-2">By model (30 days)</div>
              <div className="space-y-1.5">
                {usage.by_model.map(m => {
                  const color = MODEL_COLORS[m.model] || '#6b7280';
                  const pct = usage.totals.total_cost > 0
                    ? (m.cost / usage.totals.total_cost) * 100
                    : 0;
                  return (
                    <div key={m.model} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[11px] text-gray-400 font-mono truncate">{m.model}</span>
                          <span className="text-[11px] font-mono" style={{ color }}>{fmt$(m.cost)}</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/5">
                          <div
                            className="h-1 rounded-full transition-all"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-600 w-12 text-right flex-shrink-0">
                        {fmtTokens(m.tokens)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All-time footer */}
          <div
            className="flex items-center justify-between pt-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <TrendingUp size={11} />
              All-time spend
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-300">
              <DollarSign size={10} className="text-green-400" />
              {fmt$(stats.all_time.cost)}
            </div>
          </div>

          {/* Empty state hint */}
          {usage.totals.total_tokens === 0 && (
            <div className="text-[11px] text-gray-600 text-center py-2">
              No usage logged yet — usage will appear after Langly processes chat requests.
            </div>
          )}

        </div>
      ) : null}
    </WidgetPanel>
  );
}
