import { useState } from 'react';
import { useStocks } from '../../hooks/useStocks';
import { useSettingsStore } from '../../store/settingsStore';
import { WidgetPanel } from '../layout/WidgetPanel';
import { Sparkline } from '../shared/Sparkline';
import { LoadingSpinner } from '../shared/LoadingSpinner';

export function StockWidget() {
  const { stocks, loading, refresh } = useStocks();
  const { addTicker, removeTicker } = useSettingsStore();
  const [input, setInput] = useState('');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) {
      addTicker(input.trim());
      setInput('');
    }
  }

  return (
    <WidgetPanel
      title="Market Feed"
      accentColor="emerald"
      insightPrompt="Analyze my stock watchlist (AAPL, TSLA, GOOGL, SNOW, PLTR). Identify trends, biggest movers, opportunities, and risks I should be aware of."
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      }
      headerRight={
        loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <button onClick={refresh} className="text-gray-600 hover:text-emerald-400 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )
      }
    >
      <div className="p-3 space-y-2">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="TICKER"
            className="flex-1 rounded border border-emerald-500/15 bg-slate-900/60 px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-600 font-mono tracking-wider focus:border-emerald-500/40 focus:outline-none transition-all"
            maxLength={10}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-30 transition-all"
          >
            +
          </button>
        </form>

        {stocks.map((stock) => (
          <div
            key={stock.ticker}
            className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 transition-all hover:border-emerald-500/15"
            style={{ background: 'rgba(15, 23, 42, 0.4)' }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono tracking-wide">{stock.ticker}</span>
                <button
                  onClick={() => removeTicker(stock.ticker)}
                  className="text-gray-700 hover:text-red-400 text-[10px] transition-colors"
                >
                  x
                </button>
              </div>
              <div className="truncate text-[10px] text-gray-600">{stock.name}</div>
            </div>
            <div className="flex items-center gap-3">
              <Sparkline data={stock.sparkline} width={60} height={20} />
              <div className="text-right">
                <div className="text-sm font-mono font-medium text-white">
                  ${stock.price?.toFixed(2) ?? '--'}
                </div>
                <div
                  className={`text-[11px] font-mono font-medium ${
                    stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                  style={stock.change >= 0
                    ? { textShadow: '0 0 8px rgba(52, 211, 153, 0.3)' }
                    : { textShadow: '0 0 8px rgba(248, 113, 113, 0.3)' }
                  }
                >
                  {stock.change >= 0 ? '+' : ''}
                  {stock.changePercent.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        ))}

        {stocks.length === 0 && !loading && (
          <p className="text-center text-[11px] text-gray-600 py-6 uppercase tracking-wider">
            No tickers tracked
          </p>
        )}
      </div>
    </WidgetPanel>
  );
}
