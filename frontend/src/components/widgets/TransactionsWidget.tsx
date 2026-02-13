import { useFinance } from '../../hooks/useFinance';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';

export function TransactionsWidget() {
  const { transactions, loading, refresh } = useFinance();

  return (
    <WidgetPanel
      title="Transactions"
      accentColor="emerald"
      insightPrompt="Analyze my recent transactions. Identify spending patterns, unusual charges, and opportunities to save money."
      icon={
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
      <div className="p-3 space-y-1">
        {transactions.length === 0 && !loading && (
          <p className="text-center text-xs text-gray-600 py-4">
            No recent transactions
          </p>
        )}

        {transactions.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.02]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs text-gray-200">{t.merchant || 'Unknown'}</span>
                {t.isPending && (
                  <span className="shrink-0 rounded bg-amber-500/15 px-1 py-0.5 text-[8px] font-medium text-amber-400">
                    PENDING
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-gray-600">{t.date}</span>
                <span className="text-[10px] text-gray-700">|</span>
                <span className="truncate text-[10px] text-gray-500">{t.category}</span>
              </div>
            </div>
            <div className={`text-xs font-mono font-medium ml-2 ${t.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
              {t.amount > 0 ? '+' : '-'}${Math.abs(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>
    </WidgetPanel>
  );
}
