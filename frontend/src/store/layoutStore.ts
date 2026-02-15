import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ResponsiveLayouts } from 'react-grid-layout';
import { PAGE_LAYOUTS } from '../config/widgetLayouts';

type RL = ResponsiveLayouts<'lg' | 'md' | 'sm'>;

interface LayoutState {
  pageLayouts: Record<string, RL>;
  getPageLayouts: (pageId: string) => RL;
  setPageLayouts: (pageId: string, layouts: RL) => void;
  resetPage: (pageId: string) => void;
  resetAll: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      pageLayouts: {},

      getPageLayouts: (pageId: string) => {
        const stored = get().pageLayouts[pageId];
        if (stored) return stored;
        return PAGE_LAYOUTS[pageId]?.layouts ?? { lg: [], md: [], sm: [] };
      },

      setPageLayouts: (pageId: string, layouts: RL) =>
        set((state) => ({
          pageLayouts: { ...state.pageLayouts, [pageId]: layouts },
        })),

      resetPage: (pageId: string) =>
        set((state) => {
          const { [pageId]: _, ...rest } = state.pageLayouts;
          return { pageLayouts: rest };
        }),

      resetAll: () => set({ pageLayouts: {} }),
    }),
    {
      name: 'langly-page-layouts',
      version: 9,
      migrate: () => ({ pageLayouts: {} }),
    }
  )
);
