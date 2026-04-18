import React, { useEffect, useState } from 'react';

interface Summary {
  today: { total: number; count: number };
  this_week: { total: number; count: number };
  this_month: { total: number; count: number };
  all_time: { total: number; count: number };
}

interface DayRow { date: string; total: number; count: number; }
interface WeekRow { week: string; week_start: string; total: number; count: number; }
interface MonthRow { month: string; month_key: string; total: number; count: number; }
interface Receipt { id: string; receipt: string; date: string; amount: number; }

interface CostData {
  summary: Summary;
  daily: DayRow[];
  weekly: WeekRow[];
  monthly: MonthRow[];
  recent: Receipt[];
}

type Tab = 'daily' | 'weekly' | 'monthly' | 'recent';

const API = import.meta.env.VITE_API_URL || '';

const fmt = (n: number) => `$${n.toFixed(2)}`;

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
    </div>
  );
}

function InsightBadge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'flex-start', gap: 8,
      background: `${color}12`, border: `1px solid ${color}30`,
      borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: '#e2e8f0', lineHeight: 1.55,
    }}>
      {children}
    </div>
  );
}

export default function AnthropicCostsWidget() {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>('monthly');
  const [error, setError] = useState('');

  const load = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      const url = refresh ? `${API}/api/anthropic/costs/refresh` : `${API}/api/anthropic/costs`;
      const res = await fetch(url, { method: refresh ? 'POST' : 'GET' });
      setData(await res.json());
      setError('');
    } catch {
      setError('Failed to load — is Langly running?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const accent = '#a78bfa';
  const green  = '#34d399';
  const amber  = '#fbbf24';
  const blue   = '#60a5fa';
  const red    = '#f87171';

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
    fontSize: 11.5, fontWeight: 600,
    background: active ? accent : 'rgba(255,255,255,0.06)',
    color: active ? '#fff' : 'rgba(255,255,255,0.45)',
    transition: 'all 0.15s',
  });

  if (loading) return (
    <div style={{ padding: '24px 20px', color: 'rgba(255,255,255,0.35)', fontSize: 12.5, textAlign: 'center' }}>
      ⏳ Scanning Gmail for Anthropic receipts… takes ~30s on first load
    </div>
  );

  if (error) return <div style={{ padding: 20, color: red, fontSize: 13 }}>{error}</div>;
  if (!data) return null;

  const { summary, daily, weekly, monthly, recent } = data;

  // Compute insights
  const today = new Date().toISOString().slice(0, 10);
  const dayOfMonth = new Date().getDate();
  const projectedMonthly = dayOfMonth > 0 ? (summary.this_month.total / dayOfMonth) * 30 : 0;
  const avgPerReceipt = summary.all_time.count > 0 ? summary.all_time.total / summary.all_time.count : 0;
  const autoRechargeStart = '2026-02-01';
  const autoRechargeMonths = monthly.filter(m => m.month_key >= '2026-02');
  const autoRechargeTotal = autoRechargeMonths.reduce((s, m) => s + m.total, 0);
  const priorTotal = summary.all_time.total - autoRechargeTotal;

  const maxDaily   = Math.max(...daily.map(d => d.total), 1);
  const maxWeekly  = Math.max(...weekly.map(w => w.total), 1);
  const maxMonthly = Math.max(...monthly.map(m => m.total), 1);

  return (
    <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 18, color: '#e2e8f0', fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>Anthropic Spend</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
            {summary.all_time.count} receipts · Oct 2024 – now · parsed from Gmail
          </div>
        </div>
        <button onClick={() => load(true)} disabled={refreshing} style={{
          padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)',
          background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer',
        }}>
          {refreshing ? '⟳ Refreshing…' : '⟳ Refresh'}
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { label: 'Today', val: summary.today.total, count: summary.today.count, color: green },
          { label: 'This Week', val: summary.this_week.total, count: summary.this_week.count, color: blue },
          { label: 'This Month', val: summary.this_month.total, count: summary.this_month.count, color: amber },
          { label: 'All Time', val: summary.all_time.total, count: summary.all_time.count, color: accent },
        ].map(({ label, val, count, color }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)`,
            borderTop: `2px solid ${color}`, borderRadius: 10, padding: '12px 14px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', lineHeight: 1.15, marginTop: 4 }}>{fmt(val)}</div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{count} receipt{count !== 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '.07em' }}>💡 Insights</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

          <InsightBadge color={red}>
            <span>🔥</span>
            <span>
              <strong style={{ color: '#f8fafc' }}>Burn rate: {fmt(projectedMonthly)}/mo</strong><br />
              At today's pace ({fmt(summary.this_month.total)} in {dayOfMonth} days), you're on track to spend ~{fmt(projectedMonthly)} this month.
            </span>
          </InsightBadge>

          <InsightBadge color={amber}>
            <span>⚡</span>
            <span>
              <strong style={{ color: '#f8fafc' }}>Auto-recharge kicked in Feb 2026</strong><br />
              Before: flat $20–$100/mo. After: {fmt(avgPerReceipt)} avg per auto-recharge, multiple times daily.
            </span>
          </InsightBadge>

          <InsightBadge color={blue}>
            <span>📊</span>
            <span>
              <strong style={{ color: '#f8fafc' }}>17-month total: {fmt(summary.all_time.total)}</strong><br />
              {fmt(priorTotal)} pre–Feb 2026 · {fmt(autoRechargeTotal)} since auto-recharge started.
            </span>
          </InsightBadge>

          <InsightBadge color={green}>
            <span>📬</span>
            <span>
              <strong style={{ color: '#f8fafc' }}>{summary.today.count} recharges today · {summary.this_week.count} this week</strong><br />
              Average {summary.all_time.count > 0 ? (summary.all_time.count / 17).toFixed(1) : '—'} receipts/month across the full history.
            </span>
          </InsightBadge>

        </div>
      </div>

      {/* Tabs + chart */}
      <div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {(['daily', 'weekly', 'monthly', 'recent'] as Tab[]).map(t => (
            <button key={t} style={tabStyle(tab === t)} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Daily */}
        {tab === 'daily' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {daily.map(d => (
              <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 68, fontSize: 11, color: d.date === today ? green : 'rgba(255,255,255,0.4)', flexShrink: 0, fontWeight: d.date === today ? 700 : 400 }}>
                  {d.date === today ? 'Today' : new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <Bar value={d.total} max={maxDaily} color={d.date === today ? green : 'rgba(52,211,153,0.5)'} />
                <div style={{ width: 52, textAlign: 'right', fontSize: 12, fontWeight: 600, color: d.total > 0 ? '#f8fafc' : 'rgba(255,255,255,0.15)', flexShrink: 0 }}>
                  {d.total > 0 ? fmt(d.total) : '—'}
                </div>
                <div style={{ width: 26, textAlign: 'right', fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                  {d.count > 0 ? `×${d.count}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Weekly */}
        {tab === 'weekly' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {weekly.map((w, i) => (
              <div key={w.week_start} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 108, fontSize: 11, color: i === weekly.length - 1 ? blue : 'rgba(255,255,255,0.4)', flexShrink: 0, fontWeight: i === weekly.length - 1 ? 700 : 400 }}>
                  {i === weekly.length - 1 ? `This wk` : w.week}
                </div>
                <Bar value={w.total} max={maxWeekly} color={i === weekly.length - 1 ? blue : 'rgba(96,165,250,0.5)'} />
                <div style={{ width: 56, textAlign: 'right', fontSize: 12, fontWeight: 600, color: w.total > 0 ? '#f8fafc' : 'rgba(255,255,255,0.15)', flexShrink: 0 }}>
                  {w.total > 0 ? fmt(w.total) : '—'}
                </div>
                <div style={{ width: 26, textAlign: 'right', fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                  {w.count > 0 ? `×${w.count}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Monthly */}
        {tab === 'monthly' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {monthly.map((m, i) => (
              <div key={m.month_key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 68, fontSize: 11, color: i === monthly.length - 1 ? amber : 'rgba(255,255,255,0.4)', flexShrink: 0, fontWeight: i === monthly.length - 1 ? 700 : 400 }}>
                  {m.month}
                </div>
                <Bar value={m.total} max={maxMonthly} color={m.month_key >= '2026-02' ? amber : 'rgba(251,191,36,0.3)'} />
                <div style={{ width: 56, textAlign: 'right', fontSize: 12, fontWeight: 600, color: m.total > 0 ? '#f8fafc' : 'rgba(255,255,255,0.15)', flexShrink: 0 }}>
                  {m.total > 0 ? fmt(m.total) : '—'}
                </div>
                <div style={{ width: 26, textAlign: 'right', fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                  {m.count > 0 ? `×${m.count}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent */}
        {tab === 'recent' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {recent.map(r => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', flexShrink: 0, width: 72 }}>{r.date}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', flex: 1, fontFamily: 'monospace' }}>#{r.receipt}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{fmt(r.amount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
