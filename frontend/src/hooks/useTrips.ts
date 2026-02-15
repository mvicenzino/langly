import { useState, useEffect, useCallback } from 'react';
import * as travelApi from '../api/travel';
import type { Trip } from '../types/travel';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await travelApi.fetchTrips();
      setTrips(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (data: { destination: string; start_date?: string; end_date?: string; notes?: string; airports?: string }) => {
    const trip = await travelApi.createTrip(data);
    await refresh();
    return trip;
  }, [refresh]);

  const update = useCallback(async (id: number, data: Partial<Trip>) => {
    const updated = await travelApi.updateTrip(id, data);
    await refresh();
    return updated;
  }, [refresh]);

  const remove = useCallback(async (id: number) => {
    await travelApi.deleteTrip(id);
    await refresh();
  }, [refresh]);

  return { trips, loading, error, refresh, create, update, remove };
}
