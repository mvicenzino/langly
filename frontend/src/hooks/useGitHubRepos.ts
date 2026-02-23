import { useState, useEffect, useCallback } from 'react';
import { fetchRepos } from '../api/github';
import type { GitHubRepo } from '../api/github';

export function useGitHubRepos() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRepos();
      setRepos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch repos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { repos, loading, error, refresh };
}
