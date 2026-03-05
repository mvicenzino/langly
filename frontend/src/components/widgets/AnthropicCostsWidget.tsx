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

const API = 'http://localhost:5001';

function fmt(n: number) {
  return `$${n.toFixed(2)}`;
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
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
      const method = refresh ? 'POST' : 'GET';
      const res = await fetch(url, { method });
      const json = await res.json();
      setData(json);
      setError('');
    } catch (e) {
      setError('Failed to load cost data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const accent = '#a78bfa'; // purple
  const green  = '#34d399';
  const amber  = '#fbbf24';
  const blue   = '#60a5fa';

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px',
    borderRadius: 20,
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    background: active ? accent : 'rgba(255,255,255,0.06)',
    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
    transition: 'all 0.15s',
  });

  if (loading) return (
    <div style={{ padding: 24, color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center' }}>
      Loading Anthropic receipts from Gmail… this takes ~30s on first load
    </div>
  );

  if (error) return (
    <div style={{ padding: 24, color: '#f87171', fontSize: 13 }}>{error}</div>
  );

  if (!data) return null;

  const { summary, daily, weekly, monthly, recent } = data;

  const maxDaily   = Math.max(...daily.map(d => d.total), 1);
  const maxWeekly  = Math.max(...weekly.map(w => w.total), 1);
  const maxMonthly = Math.max(...monthly.map(m => m.total), 1);

  return (
    <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 20, color: '#e2e8f0', fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>Anthropic Spend</div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Auto-recharge receipts from Gmail</div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer' }}
        >
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
          <div key={label} style={{ ...cardStyle, borderTop: `2px solid ${color}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', lineHeight: 1.1 }}>{fmt(val)}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{count} receipt{count !== 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(['daily', 'weekly', 'monthly', 'recent'] as Tab[]).map(t => (
          <button key={t} style={tabStyle(tab === t)} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Daily */}
      {tab === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {daily.filter(d => d.total > 0 || d.date >= new Date(Date.now() - 7*86400000).toISOString().slice(0,10)).map(d => (
            <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 72, fontSize: 11.5, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <Bar value={d.total} max={maxDaily} color={green} />
              <div style={{ width: 52, textAlign: 'right', fontSize: 12, fontWeight: 600, color: d.total > 0 ? '#f8fafc' : 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                {d.total > 0 ? fmt(d.total) : '—'}
              </div>
              <div style={{ width: 28, textAlign: 'right', fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                {d.count > 0 ? `×${d.count}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly */}
      {tab === 'weekly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {weekly.map(w => (
            <div key={w.week_start} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 110, fontSize: 11.5, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>{w.week}</div>
              <Bar value={w.total} max={maxWeekly} color={blue} />
              <div style={{ width: 60, textAlign: 'right', fontSize: 12, fontWeight: 600, color: w.total > 0 ? '#f8fafc' : 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                {w.total > 0 ? fmt(w.total) : '—'}
              </div>
              <div style={{ width: 28, textAlign: 'right', fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                {w.count > 0 ? `×${w.count}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Monthly */}
      {tab === 'monthly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {monthly.map(m => (
            <div key={m.month_key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 72, fontSize: 11.5, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>{m.month}</div>
              <Bar value={m.total} max={maxMonthly} color={amber} />
              <div style={{ width: 60, textAlign: 'right', fontSize: 12, fontWeight: 600, color: m.total > 0 ? '#f8fafc' : 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                {m.total > 0 ? fmt(m.total) : '—'}
              </div>
              <div style={{ width: 28, textAlign: 'right', fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                {m.count > 0 ? `×${m.count}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent receipts */}
      {tab === 'recent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {recent.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', flexShrink: 0, width: 72 }}>{r.date}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', flex: 1, fontFamily: 'monospace' }}>#{r.receipt}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{fmt(r.amount)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
