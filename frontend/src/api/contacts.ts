import { apiGet, apiPost, apiDelete } from './client';
import type { Contact, ContactSearchResult, ContactDetail } from '../types/contacts';

export function fetchContacts() {
  return apiGet<Contact[]>('/api/stride/contacts');
}

export function searchContacts(q: string) {
  return apiGet<ContactSearchResult[]>(`/api/stride/contacts/search?q=${encodeURIComponent(q)}`);
}

export function fetchContact(id: number) {
  return apiGet<ContactDetail>(`/api/stride/contacts/${id}`);
}

export function createContact(data: {
  name: string;
  company?: string;
  title?: string;
  contactType?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  notes?: string;
}) {
  return apiPost<Contact>('/api/stride/contacts', data);
}

export function deleteContact(id: number) {
  return apiDelete<{ deleted: number }>(`/api/stride/contacts/${id}`);
}
