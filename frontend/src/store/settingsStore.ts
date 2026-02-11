import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  watchlist: string[];
  locations: string[];
  addTicker: (ticker: string) => void;
  removeTicker: (ticker: string) => void;
  addLocation: (location: string) => void;
  removeLocation: (location: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      watchlist: ['AAPL', 'TSLA', 'GOOGL', 'SNOW', 'PLTR'],
      locations: ['Morristown, NJ'],
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
    }),
    {
      name: 'langly-settings',
      version: 3,
      migrate: (persisted: unknown) => {
        const state = persisted as Record<string, unknown>;
        // Fix invalid tickers and reset locations
        const watchlist = (state.watchlist as string[]) || ['AAPL', 'TSLA', 'GOOGL', 'SNOW', 'PLTR'];
        const fixedWatchlist = watchlist.map(t =>
          t === 'SNOWFLAKE' ? 'SNOW' : t
        );
        return { ...state, locations: ['Morristown, NJ'], watchlist: fixedWatchlist };
      },
    }
  )
);
