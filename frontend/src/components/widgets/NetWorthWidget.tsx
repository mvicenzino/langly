import { useFinance } from '../../hooks/useFinance';
import { WidgetPanel } from '../layout/WidgetPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';

export function NetWorthWidget() {
  const { accounts, loading, refresh } = useFinance();

  return (
    <WidgetPanel
      title="Net Worth"
      accentColor="emerald"
      icon={
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      <div className="p-3 space-y-3">
        {!accounts && !loading && (
          <p className="text-center text-xs text-gray-600 py-4">
            Connect Monarch Money to see your net worth
          </p>
        )}

        {accounts && (
          <>
            {/* Net worth headline */}
            <div className="text-center py-2">
              <div className="text-2xl font-bold font-mono text-white">
                ${accounts.netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Total Net Worth</div>
            </div>

            {/* Assets vs Liabilities bar */}
            <div className="flex gap-3 text-xs">
              <div className="flex-1 rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-2.5 py-2 text-center">
                <div className="text-emerald-400 font-mono font-medium">
                  ${accounts.totalAssets.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-[9px] text-gray-500 mt-0.5">Assets</div>
              </div>
              <div className="flex-1 rounded-lg border border-red-500/10 bg-red-500/5 px-2.5 py-2 text-center">
                <div className="text-red-400 font-mono font-medium">
                  ${accounts.totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-[9px] text-gray-500 mt-0.5">Liabilities</div>
              </div>
            </div>

            {/* Accounts by type */}
            <div className="space-y-2">
              {Object.entries(accounts.accountsByType).map(([type, accts]) => (
                <div key={type}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{type}</div>
                  {accts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-1 px-1">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs text-gray-300">{a.name}</div>
                        {a.institution && (
                          <div className="truncate text-[10px] text-gray-600">{a.institution}</div>
                        )}
                      </div>
                      <div className={`text-xs font-mono font-medium ml-2 ${a.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                        ${Math.abs(a.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </WidgetPanel>
  );
}
