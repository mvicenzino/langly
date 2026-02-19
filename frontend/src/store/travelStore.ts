import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FlightOffer, HotelOffer } from '../types/travel';
import { useSettingsStore } from './settingsStore';

interface TravelState {
  // Active trip context — shared across all travel widgets
  selectedTripId: number | null;
  destination: string;
  startDate: string;
  endDate: string;
  originAirport: string;
  destinationAirport: string;
  passengers: number;

  // Flight search results — NOT persisted
  flightResults: FlightOffer[];
  flightLoading: boolean;
  flightError: string | null;

  // Hotel search results — NOT persisted
  hotelResults: HotelOffer[];
  hotelLoading: boolean;
  hotelError: string | null;

  // Insight trigger — timestamp so TabBar button can trigger the widget
  insightRequestedAt: number;

  // Actions
  setTripContext: (dest: string, start: string, end: string, airport: string) => void;
  selectTrip: (id: number, dest: string, start: string, end: string, airport: string) => void;
  clearTrip: () => void;
  setOriginAirport: (code: string) => void;
  setDestinationAirport: (code: string) => void;
  setPassengers: (n: number) => void;
  setFlightResults: (flights: FlightOffer[]) => void;
  setFlightLoading: (loading: boolean) => void;
  setFlightError: (error: string | null) => void;
  setHotelResults: (hotels: HotelOffer[]) => void;
  setHotelLoading: (loading: boolean) => void;
  setHotelError: (error: string | null) => void;
  requestInsights: () => void;
}

/** Normalize any date format to YYYY-MM-DD (e.g. "Sun, 15 Mar 2026 00:00:00 GMT" → "2026-03-15") */
function normalizeDate(d: string): string {
  if (!d) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return d;
  return parsed.toISOString().split('T')[0];
}

function getSettingsDefaults() {
  const settings = useSettingsStore.getState();
  return {
    homeAirport: settings.homeAirport || 'EWR',
    defaultPassengers: settings.defaultPassengers || 3,
  };
}

export const useTravelStore = create<TravelState>()(
  persist(
    (set) => ({
      selectedTripId: null,
      destination: '',
      startDate: '',
      endDate: '',
      originAirport: getSettingsDefaults().homeAirport,
      destinationAirport: '',
      passengers: getSettingsDefaults().defaultPassengers,

      flightResults: [],
      flightLoading: false,
      flightError: null,

      hotelResults: [],
      hotelLoading: false,
      hotelError: null,

      insightRequestedAt: 0,

      setTripContext: (dest, start, end, airport) => {
        set({
          destination: dest,
          startDate: normalizeDate(start),
          endDate: normalizeDate(end),
          destinationAirport: airport.toUpperCase(),
        });
      },

      selectTrip: (id, dest, start, end, airport) => {
        const defaults = getSettingsDefaults();
        set({
          selectedTripId: id,
          destination: dest,
          startDate: normalizeDate(start),
          endDate: normalizeDate(end),
          destinationAirport: airport,
          originAirport: defaults.homeAirport,
          passengers: defaults.defaultPassengers,
          // Clear stale results when trip changes
          flightResults: [],
          flightError: null,
          hotelResults: [],
          hotelError: null,
        });
      },

      clearTrip: () =>
        set({
          selectedTripId: null,
          destination: '',
          startDate: '',
          endDate: '',
          destinationAirport: '',
          flightResults: [],
          flightError: null,
          hotelResults: [],
          hotelError: null,
        }),

      setOriginAirport: (code) => set({ originAirport: code.toUpperCase() }),
      setDestinationAirport: (code) => set({ destinationAirport: code.toUpperCase() }),
      setPassengers: (n) => set({ passengers: n }),
      setFlightResults: (flights) => set({ flightResults: flights, flightLoading: false, flightError: null }),
      setFlightLoading: (loading) => set({ flightLoading: loading }),
      setFlightError: (error) => set({ flightError: error, flightLoading: false }),
      setHotelResults: (hotels) => set({ hotelResults: hotels, hotelLoading: false, hotelError: null }),
      setHotelLoading: (loading) => set({ hotelLoading: loading }),
      setHotelError: (error) => set({ hotelError: error, hotelLoading: false }),
      requestInsights: () => set({ insightRequestedAt: Date.now() }),
    }),
    {
      name: 'langly-travel',
      version: 2,
      // Don't persist search context — widgets start clean on page load
      partialize: () => ({}),
    }
  )
);
