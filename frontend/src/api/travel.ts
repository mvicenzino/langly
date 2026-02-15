import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Trip, PackingItem, SavedSearch, FlightSearchResult, HotelSearchResult } from '../types/travel';

// ── Trips ───────────────────────────────────────────────────────────────────

export function fetchTrips() {
  return apiGet<Trip[]>('/api/travel/trips');
}

export function createTrip(data: { destination: string; start_date?: string; end_date?: string; notes?: string; status?: string; airports?: string }) {
  return apiPost<Trip>('/api/travel/trips', data);
}

export function updateTrip(id: number, data: Partial<Trip>) {
  return apiPut<Trip>(`/api/travel/trips/${id}`, data);
}

export function deleteTrip(id: number) {
  return apiDelete<{ deleted: number }>(`/api/travel/trips/${id}`);
}

// ── Packing Items ───────────────────────────────────────────────────────────

export function fetchPacking(tripId: number) {
  return apiGet<PackingItem[]>(`/api/travel/trips/${tripId}/packing`);
}

export function addPackingItem(tripId: number, item: string, category = 'essentials') {
  return apiPost<PackingItem>(`/api/travel/trips/${tripId}/packing`, { item, category });
}

export function updatePackingItem(itemId: number, data: { packed?: boolean; item?: string; category?: string }) {
  return apiPut<PackingItem>(`/api/travel/packing/${itemId}`, data);
}

export function deletePackingItem(itemId: number) {
  return apiDelete<{ deleted: number }>(`/api/travel/packing/${itemId}`);
}

export function generatePacking(tripId: number) {
  return apiPost<PackingItem[]>(`/api/travel/trips/${tripId}/packing/generate`, {});
}

// ── Flight Search (Amadeus) ─────────────────────────────────────────────────

export function searchFlights(params: {
  origin: string;
  destination: string;
  date: string;
  return?: string;
  adults?: number;
}) {
  const qs = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    date: params.date,
  });
  if (params.return) qs.set('return', params.return);
  if (params.adults) qs.set('adults', String(params.adults));
  return apiGet<FlightSearchResult>(`/api/travel/flights?${qs}`);
}

// ── Hotel Search (SerpAPI Google Hotels) ────────────────────────────────────

export function searchHotels(params: {
  destination: string;
  check_in: string;
  check_out: string;
  adults?: number;
}) {
  const qs = new URLSearchParams({
    destination: params.destination,
    check_in: params.check_in,
    check_out: params.check_out,
  });
  if (params.adults) qs.set('adults', String(params.adults));
  return apiGet<HotelSearchResult>(`/api/travel/hotels?${qs}`);
}

// ── Saved Searches ──────────────────────────────────────────────────────────

export function fetchSearches(type?: string) {
  const qs = type ? `?type=${type}` : '';
  return apiGet<SavedSearch[]>(`/api/travel/searches${qs}`);
}

export function createSearch(data: { search_type: string; label: string; destination?: string; url?: string; metadata?: Record<string, unknown>; trip_id?: number }) {
  return apiPost<SavedSearch>('/api/travel/searches', data);
}

export function deleteSearch(id: number) {
  return apiDelete<{ deleted: number }>(`/api/travel/searches/${id}`);
}
