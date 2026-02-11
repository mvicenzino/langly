import { useState, useEffect, useCallback } from 'react';
import { fetchSystemInfo, fetchRunningServices } from '../api/system';
import type { SystemInfo, RunningService } from '../types/system';

export function useSystem() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [services, setServices] = useState<RunningService[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [info, svcs] = await Promise.all([
        fetchSystemInfo().catch(() => null),
        fetchRunningServices().catch(() => []),
      ]);
      if (info) setSystemInfo(info);
      setServices(svcs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { systemInfo, services, loading, refresh };
}
