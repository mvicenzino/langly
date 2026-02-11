import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Contact, ContactSearchResult, ContactDetail } from '../types/contacts';

export function fetchContacts() {
  return apiGet<Contact[]>('/api/contacts');
}

export function searchContacts(q: string) {
  return apiGet<ContactSearchResult[]>(`/api/contacts/search?q=${encodeURIComponent(q)}`);
}

export function fetchContact(id: number) {
  return apiGet<ContactDetail>(`/api/contacts/${id}`);
}

export function createContact(data: { name: string; company?: string; email?: string; phone?: string; notes?: string }) {
  return apiPost<Contact>('/api/contacts', data);
}

export function updateContact(id: number, data: Partial<Pick<Contact, 'name' | 'company' | 'email' | 'phone' | 'notes'>>) {
  return apiPut<Contact>(`/api/contacts/${id}`, data);
}

export function deleteContact(id: number) {
  return apiDelete<{ deleted: number }>(`/api/contacts/${id}`);
}
