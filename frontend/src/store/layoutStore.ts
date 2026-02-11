import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LayoutItem } from 'react-grid-layout';

const DEFAULT_LAYOUTS: LayoutItem[] = [
  { i: 'stocks', x: 0, y: 0, w: 3, h: 4, minW: 2, minH: 3 },
  { i: 'chat', x: 3, y: 0, w: 6, h: 8, minW: 4, minH: 4 },
  { i: 'weather', x: 9, y: 0, w: 3, h: 4, minW: 2, minH: 3 },
  { i: 'todos', x: 0, y: 4, w: 3, h: 4, minW: 2, minH: 3 },
  { i: 'notes', x: 9, y: 4, w: 3, h: 4, minW: 2, minH: 3 },
  { i: 'skills', x: 0, y: 8, w: 4, h: 5, minW: 2, minH: 3 },
  { i: 'openclaw', x: 4, y: 8, w: 4, h: 5, minW: 2, minH: 3 },
  { i: 'system', x: 8, y: 8, w: 4, h: 5, minW: 2, minH: 3 },
];

interface LayoutState {
  layouts: LayoutItem[];
  setLayouts: (layouts: LayoutItem[]) => void;
  resetLayouts: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      layouts: DEFAULT_LAYOUTS,
      setLayouts: (layouts) => set({ layouts }),
      resetLayouts: () => set({ layouts: DEFAULT_LAYOUTS }),
    }),
    {
      name: 'langly-layout',
      version: 2,
      migrate: () => {
        // Reset to new 8-panel layout on version bump
        return { layouts: DEFAULT_LAYOUTS };
      },
    }
  )
);
