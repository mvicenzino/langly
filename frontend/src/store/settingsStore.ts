import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  watchlist: string[];
  locations: string[];
  homeAirport: string;
  defaultPassengers: number;
  addTicker: (ticker: string) => void;
  removeTicker: (ticker: string) => void;
  addLocation: (location: string) => void;
  removeLocation: (location: string) => void;
  setHomeAirport: (code: string) => void;
  setDefaultPassengers: (n: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      watchlist: ['AAPL', 'TSLA', 'GOOGL', 'SNOW', 'PLTR'],
      locations: ['Morristown, NJ'],
      homeAirport: 'EWR',
      defaultPassengers: 3,
      addTicker: (ticker) =>
        set((s) => ({
          watchlist: s.watchlist.includes(ticker.toUpperCase())
            ? s.watchlist
            : [...s.watchlist, ticker.toUpperCase()],
        })),
      removeTicker: (ticker) =>
        set((s) => ({
          watchlist: s.watchlist.filter((t) => t !== ticker.toUpperCase()),
        })),
      addLocation: (location) =>
        set((s) => ({
          locations: s.locations.includes(location)
            ? s.locations
            : [...s.locations, location],
        })),
      removeLocation: (location) =>
        set((s) => ({
          locations: s.locations.filter((l) => l !== location),
        })),
      setHomeAirport: (code) => set({ homeAirport: code.toUpperCase() }),
      setDefaultPassengers: (n) => set({ defaultPassengers: Math.max(1, Math.min(9, n)) }),
    }),
    {
      name: 'langly-settings',
      version: 4,
      migrate: (persisted: unknown) => {
        const state = persisted as Record<string, unknown>;
        // Fix invalid tickers and reset locations
        const watchlist = (state.watchlist as string[]) || ['AAPL', 'TSLA', 'GOOGL', 'SNOW', 'PLTR'];
        const fixedWatchlist = watchlist.map(t =>
          t === 'SNOWFLAKE' ? 'SNOW' : t
        );
        return {
          ...state,
          locations: ['Morristown, NJ'],
          watchlist: fixedWatchlist,
          homeAirport: (state.homeAirport as string) || 'EWR',
          defaultPassengers: (state.defaultPassengers as number) || 3,
        };
      },
    }
  )
);
