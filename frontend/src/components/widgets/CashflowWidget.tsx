import { useState, useEffect, useCallback } from 'react';
import { fetchCashflowTrend } from '../../api/finance';
import type { CashflowTrend } from '../../types/finance';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';

function BarChart({ data, width = 280, height = 120 }: { data: { label: string; income: number; expenses: number }[]; width?: number; height?: number }) {
  if (data.length === 0) return null;

  const allValues = data.flatMap((d) => [d.income, d.expenses]);
  const max = Math.max(...allValues) * 1.1;
  const barGroupWidth = width / data.length;
  const barWidth = barGroupWidth * 0.3;
  const gap = barGroupWidth * 0.1;

  return (
    <svg width={width} height={height + 20} className="w-full" viewBox={`0 0 ${width} ${height + 20}`} preserveAspectRatio="none">
      {data.map((d, i) => {
        const x = i * barGroupWidth + gap;
        const incomeH = (d.income / max) * height;
        const expenseH = (d.expenses / max) * height;
        return (
          <g key={d.label}>
            {/* Income bar */}
            <rect
              x={x}
              y={height - incomeH}
              width={barWidth}
              height={incomeH}
              rx={2}
              fill="#34d399"
              opacity={0.8}
              style={{ filter: 'drop-shadow(0 0 3px rgba(52, 211, 153, 0.3))' }}
            />
            {/* Expense bar */}
            <rect
              x={x + barWidth + 2}
              y={height - expenseH}
              width={barWidth}
              height={expenseH}
              rx={2}
              fill="#f87171"
              opacity={0.8}
              style={{ filter: 'drop-shadow(0 0 3px rgba(248, 113, 113, 0.3))' }}
            />
            {/* Month label */}
            <text
              x={x + barWidth}
              y={height + 14}
              textAnchor="middle"
              className="fill-gray-600"
              fontSize={9}
            >
              {d.label.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function CashflowWidget() {
  const [data, setData] = useState<CashflowTrend | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchCashflowTrend(6);
      setData(d);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const points = data?.points || [];
  const totalIncome = points.reduce((s, p) => s + p.income, 0);
  const totalExpenses = points.reduce((s, p) => s + p.expenses, 0);
  const totalSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  const chartData = points.map((p) => ({ label: p.month, income: p.income, expenses: p.expenses }));

  return (
    <WidgetPanel
      title="Cash Flow"
      accentColor="emerald"
      icon={
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
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
        {data && points.length > 0 && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-2 py-1.5">
                <div className="text-emerald-400 text-xs font-mono font-medium">
                  ${(totalIncome / 1000).toFixed(1)}k
                </div>
                <div className="text-[8px] text-gray-500 mt-0.5">Income</div>
              </div>
              <div className="rounded-lg border border-red-500/10 bg-red-500/5 px-2 py-1.5">
                <div className="text-red-400 text-xs font-mono font-medium">
                  ${(totalExpenses / 1000).toFixed(1)}k
                </div>
                <div className="text-[8px] text-gray-500 mt-0.5">Expenses</div>
              </div>
              <div className="rounded-lg border border-blue-500/10 bg-blue-500/5 px-2 py-1.5">
                <div className={`text-xs font-mono font-medium ${totalSavings >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  {savingsRate.toFixed(0)}%
                </div>
                <div className="text-[8px] text-gray-500 mt-0.5">Savings Rate</div>
              </div>
            </div>

            {/* Bar chart */}
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2 overflow-hidden">
              <BarChart data={chartData} />
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 text-[9px] text-gray-500">
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-3 rounded-sm bg-emerald-400" /> Income
              </div>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-3 rounded-sm bg-red-400" /> Expenses
              </div>
            </div>
          </>
        )}
      </div>
    </WidgetPanel>
  );
}
