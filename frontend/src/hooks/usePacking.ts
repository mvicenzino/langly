import { useState, useEffect, useCallback } from 'react';
import * as travelApi from '../api/travel';
import type { PackingItem } from '../types/travel';

export function usePacking(tripId: number | null) {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!tripId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await travelApi.fetchPacking(tripId);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch packing items');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(async (item: string, category = 'essentials') => {
    if (!tripId) return;
    await travelApi.addPackingItem(tripId, item, category);
    await refresh();
  }, [tripId, refresh]);

  const toggle = useCallback(async (itemId: number, packed: boolean) => {
    await travelApi.updatePackingItem(itemId, { packed });
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (itemId: number) => {
    await travelApi.deletePackingItem(itemId);
    await refresh();
  }, [refresh]);

  const generate = useCallback(async () => {
    if (!tripId) return;
    await travelApi.generatePacking(tripId);
    await refresh();
  }, [tripId, refresh]);

  return { items, loading, error, refresh, add, toggle, remove, generate };
}
