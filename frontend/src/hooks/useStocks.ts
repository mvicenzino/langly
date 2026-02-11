import { useState, useEffect, useCallback } from 'react';
import { fetchWatchlist } from '../api/stocks';
import { useSettingsStore } from '../store/settingsStore';
import type { StockData } from '../types/stocks';

export function useStocks() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchlist = useSettingsStore((s) => s.watchlist);

  const refresh = useCallback(async () => {
    if (watchlist.length === 0) {
      setStocks([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWatchlist(watchlist);
      setStocks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch stocks');
    } finally {
      setLoading(false);
    }
  }, [watchlist]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { stocks, loading, error, refresh };
}
