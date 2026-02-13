import { useFinance } from '../../hooks/useFinance';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';

function budgetColor(pct: number): string {
  if (pct > 100) return 'bg-red-500';
  if (pct > 80) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function budgetTextColor(pct: number): string {
  if (pct > 100) return 'text-red-400';
  if (pct > 80) return 'text-amber-400';
  return 'text-emerald-400';
}

export function BudgetWidget() {
  const { budgets, loading, refresh } = useFinance();

  return (
    <WidgetPanel
      title="Budgets"
      accentColor="emerald"
      icon={
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      }
      headerRight={
        loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <button onClick={refresh} className="rounded p-1 text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )
      }
    >
      <div className="p-3 space-y-2">
        {!budgets && !loading && (
          <p className="text-center text-xs text-gray-600 py-4">
            No budget data available
          </p>
        )}

        {budgets && (
          <>
            {/* Summary bar */}
            <div className="flex gap-3 text-xs mb-1">
              <div className="flex-1 text-center">
                <div className="text-white font-mono font-medium">
                  ${budgets.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-[9px] text-gray-500">Spent</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-gray-400 font-mono font-medium">
                  ${budgets.totalBudgeted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-[9px] text-gray-500">Budgeted</div>
              </div>
              <div className="flex-1 text-center">
                <div className={`font-mono font-medium ${budgets.totalRemaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${Math.abs(budgets.totalRemaining).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-[9px] text-gray-500">{budgets.totalRemaining >= 0 ? 'Left' : 'Over'}</div>
              </div>
            </div>

            {/* Category progress bars */}
            <div className="space-y-2">
              {budgets.categories.map((c) => (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="truncate text-[11px] text-gray-300">{c.category}</span>
                    <span className={`text-[10px] font-mono ${budgetTextColor(c.percentUsed)}`}>
                      ${c.spent.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / ${c.budgeted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${budgetColor(c.percentUsed)}`}
                      style={{ width: `${Math.min(c.percentUsed, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </WidgetPanel>
  );
}
