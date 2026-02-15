import { useState, useEffect, useCallback } from 'react';
import * as travelApi from '../api/travel';
import type { SavedSearch } from '../types/travel';

export function useSavedSearches(type?: string) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await travelApi.fetchSearches(type);
      setSearches(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch saved searches');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(async (data: { search_type: string; label: string; destination?: string; url?: string; metadata?: Record<string, unknown>; trip_id?: number }) => {
    await travelApi.createSearch(data);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: number) => {
    await travelApi.deleteSearch(id);
    await refresh();
  }, [refresh]);

  return { searches, loading, error, refresh, save, remove };
}
