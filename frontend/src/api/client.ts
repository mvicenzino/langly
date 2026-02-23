import { useAuthStore } from '../store/authStore';

// In dev, Vite proxy handles /api → localhost:5001
// In prod, VITE_API_URL points to the Railway backend
const BASE_URL = import.meta.env.VITE_API_URL || '';

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handle401(res: Response): Response {
  if (res.status === 401) {
    useAuthStore.getState().logout();
  }
  return res;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = handle401(
    await fetch(`${BASE_URL}${path}`, { headers: authHeaders() })
  );
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = handle401(
    await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    })
  );
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = handle401(
    await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    })
  );
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = handle401(
    await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  );
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
  return res.json();
}

// ── Resources ────────────────────────────────────────────────────────────────

export interface Resource {
  id: number;
  project: string;
  name: string;
  url: string;
  description: string;
  resource_type: string;
  created_at: string;
  updated_at: string;
}

export interface ResourceInput {
  name: string;
  url: string;
  description?: string;
  type?: string;
}

export const resourcesApi = {
  getAll: (project: string) => apiGet<Resource[]>(`/api/projects/${project}/resources`),
  create: (project: string, data: ResourceInput) => apiPost<Resource>(`/api/projects/${project}/resources`, data),
  update: (project: string, id: number, data: Partial<ResourceInput>) => apiPut<Resource>(`/api/projects/${project}/resources/${id}`, data),
  delete: (project: string, id: number) => apiDelete<{ status: string }>(`/api/projects/${project}/resources/${id}`),
};

// ── Calendar (Kindora) ──────────────────────────────────────────────────────

import type { CalendarEvent, FamilyMember, CareDocument, CalendarMedication } from '../types/calendar';
import type { StridePipeline, StrideApplication, StrideStats, StrideEvent } from '../types/stride';

export const calendarApi = {
  getToday: () => apiGet<CalendarEvent[]>('/api/calendar/today'),
  getUpcoming: (days = 7) => apiGet<CalendarEvent[]>(`/api/calendar/upcoming?days=${days}`),
  getEvents: (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    const qs = params.toString();
    return apiGet<CalendarEvent[]>(`/api/calendar/events${qs ? `?${qs}` : ''}`);
  },
  createEvent: (event: Partial<CalendarEvent>) => apiPost<CalendarEvent>('/api/calendar/events', event),
  updateEvent: (id: string, data: Partial<CalendarEvent>) => apiPut<CalendarEvent>(`/api/calendar/events/${id}`, data),
  deleteEvent: (id: string) => apiDelete<{ success: boolean }>(`/api/calendar/events/${id}`),
  getMembers: () => apiGet<FamilyMember[]>('/api/calendar/members'),
  getDocuments: () => apiGet<CareDocument[]>('/api/calendar/documents'),
  getMedications: () => apiGet<CalendarMedication[]>('/api/calendar/medications'),
};

// ── Content Calendar ────────────────────────────────────────────────────────

import type { ContentCalendarItem, ContentBatch, GenerateResult, SocialStatus } from '../types/contentCalendar';

export const contentCalendarApi = {
  getItems: (params?: { batch_id?: string; week?: number; platform?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.batch_id) qs.set('batch_id', params.batch_id);
    if (params?.week) qs.set('week', String(params.week));
    if (params?.platform) qs.set('platform', params.platform);
    if (params?.status) qs.set('status', params.status);
    const q = qs.toString();
    return apiGet<ContentCalendarItem[]>(`/api/content-calendar${q ? `?${q}` : ''}`);
  },
  generate: (startDate?: string) =>
    apiPost<GenerateResult>('/api/content-calendar/generate', startDate ? { start_date: startDate } : {}),
  getBatches: () => apiGet<ContentBatch[]>('/api/content-calendar/batches'),
  updateItem: (id: number, data: Partial<ContentCalendarItem>) =>
    apiPut<ContentCalendarItem>(`/api/content-calendar/${id}`, data),
  deleteItem: (id: number) => apiDelete<{ success: boolean }>(`/api/content-calendar/${id}`),
  deleteBatch: (batchId: string) => apiDelete<{ success: boolean; deleted: number }>(`/api/content-calendar/batch/${batchId}`),
  publishItem: (id: number) => apiPost<ContentCalendarItem>(`/api/content-calendar/${id}/publish`, {}),
};

// ── Social Connections ───────────────────────────────────────────────────────

export const socialApi = {
  getStatus: () => apiGet<SocialStatus>('/api/social/status'),
  getLinkedInAuthUrl: () => apiGet<{ auth_url: string }>('/api/social/linkedin/auth'),
  disconnectLinkedIn: () => apiDelete<{ success: boolean }>('/api/social/linkedin/disconnect'),
};

// ── Stride (Job Tracker) ────────────────────────────────────────────────────

export const strideApi = {
  getPipeline: () => apiGet<StridePipeline>('/api/stride/pipeline'),
  getApplications: (status?: string, limit = 20) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (status) params.set('status', status);
    return apiGet<StrideApplication[]>(`/api/stride/applications?${params}`);
  },
  getStats: () => apiGet<StrideStats>('/api/stride/stats'),
  getUpcomingEvents: () => apiGet<StrideEvent[]>('/api/stride/events'),
};
