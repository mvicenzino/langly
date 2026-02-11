import { useState, useEffect, useCallback } from 'react';
import { fetchActivity } from '../api/activity';
import type { ActivityEntry } from '../types/activity';

export function useActivity() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchActivity(50);
      setEntries(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { entries, loading, refresh };
}
