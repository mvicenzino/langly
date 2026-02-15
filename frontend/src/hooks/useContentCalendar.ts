import { useState, useEffect, useCallback } from 'react';
import { contentCalendarApi, socialApi } from '../api/client';
import type { ContentCalendarItem, ContentBatch, SocialStatus } from '../types/contentCalendar';

export function useContentCalendar() {
  const [items, setItems] = useState<ContentCalendarItem[]>([]);
  const [batches, setBatches] = useState<ContentBatch[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [socialStatus, setSocialStatus] = useState<SocialStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBatches = useCallback(async () => {
    try {
      const data = await contentCalendarApi.getBatches();
      setBatches(data);
      return data;
    } catch {
      return [];
    }
  }, []);

  const fetchItems = useCallback(async (batchId: string) => {
    setLoading(true);
    try {
      const data = await contentCalendarApi.getItems({ batch_id: batchId });
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load batches on mount, select the latest
  useEffect(() => {
    fetchBatches().then((data) => {
      if (data.length > 0) {
        setActiveBatchId(data[0].batch_id);
      }
    });
  }, [fetchBatches]);

  // Fetch items when active batch changes
  useEffect(() => {
    if (activeBatchId) {
      fetchItems(activeBatchId);
    } else {
      setItems([]);
    }
  }, [activeBatchId, fetchItems]);

  const generate = useCallback(async (startDate?: string) => {
    setGenerating(true);
    setError(null);
    try {
      const result = await contentCalendarApi.generate(startDate);
      setActiveBatchId(result.batch_id);
      setItems(result.items);
      await fetchBatches();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      return null;
    } finally {
      setGenerating(false);
    }
  }, [fetchBatches]);

  const updateItem = useCallback(async (id: number, data: Partial<ContentCalendarItem>) => {
    try {
      const updated = await contentCalendarApi.updateItem(id, data);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
      return null;
    }
  }, []);

  const deleteItem = useCallback(async (id: number) => {
    try {
      await contentCalendarApi.deleteItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }, []);

  const deleteBatch = useCallback(async (batchId: string) => {
    try {
      await contentCalendarApi.deleteBatch(batchId);
      const newBatches = batches.filter((b) => b.batch_id !== batchId);
      setBatches(newBatches);
      if (activeBatchId === batchId) {
        const next = newBatches[0]?.batch_id || null;
        setActiveBatchId(next);
        if (!next) setItems([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete batch failed');
    }
  }, [batches, activeBatchId]);

  const selectBatch = useCallback((batchId: string) => {
    setActiveBatchId(batchId);
  }, []);

  const publishItem = useCallback(async (id: number) => {
    setPublishingId(id);
    setError(null);
    try {
      const updated = await contentCalendarApi.publishItem(id);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
      return null;
    } finally {
      setPublishingId(null);
    }
  }, []);

  const fetchSocialStatus = useCallback(async () => {
    try {
      const status = await socialApi.getStatus();
      setSocialStatus(status);
    } catch {
      // ignore — non-critical
    }
  }, []);

  // Fetch social status on mount
  useEffect(() => {
    fetchSocialStatus();
  }, [fetchSocialStatus]);

  return {
    items,
    batches,
    activeBatchId,
    loading,
    generating,
    publishingId,
    socialStatus,
    error,
    generate,
    updateItem,
    deleteItem,
    deleteBatch,
    selectBatch,
    publishItem,
    fetchSocialStatus,
  };
}
