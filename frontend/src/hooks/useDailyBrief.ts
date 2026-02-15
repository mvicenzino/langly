import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../api/client';
import type { DailyBriefResponse } from '../types/briefs';

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

export function useDailyBrief() {
  const [data, setData] = useState<DailyBriefResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet<DailyBriefResponse>('/api/briefs/daily');
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch daily brief');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return { data, loading, error, refresh };
}
