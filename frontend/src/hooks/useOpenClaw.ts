import { useState, useEffect, useCallback } from 'react';
import { fetchOpenClawStatus, fetchCronJobs, fetchWorkspaceFiles } from '../api/openclaw';
import type { OpenClawStatus, CronJob, WorkspaceFile } from '../types/openclaw';

export function useOpenClaw() {
  const [status, setStatus] = useState<OpenClawStatus | null>(null);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, w] = await Promise.all([
        fetchOpenClawStatus().catch(() => null),
        fetchCronJobs().catch(() => []),
        fetchWorkspaceFiles().catch(() => []),
      ]);
      if (s) setStatus(s);
      setCronJobs(c);
      setWorkspaceFiles(w);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { status, cronJobs, workspaceFiles, loading, refresh };
}
