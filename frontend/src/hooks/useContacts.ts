import { useState, useEffect, useCallback } from 'react';
import * as contactsApi from '../api/contacts';
import type { Contact } from '../types/contacts';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contactsApi.fetchContacts();
      setContacts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (data: { name: string; company?: string; email?: string; phone?: string; notes?: string }) => {
    await contactsApi.createContact(data);
    await refresh();
  }, [refresh]);

  const update = useCallback(async (id: number, data: Partial<Pick<Contact, 'name' | 'company' | 'email' | 'phone' | 'notes'>>) => {
    await contactsApi.updateContact(id, data);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: number) => {
    await contactsApi.deleteContact(id);
    await refresh();
  }, [refresh]);

  return { contacts, loading, error, refresh, create, update, remove };
}
