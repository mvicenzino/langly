import { create } from 'zustand';

interface InsightState {
  prompt: string | null;
  title: string | null;
  triggeredAt: number;
  trigger: (prompt: string, title: string) => void;
  clear: () => void;
}

export const useInsightStore = create<InsightState>((set) => ({
  prompt: null,
  title: null,
  triggeredAt: 0,
  trigger: (prompt, title) => set({ prompt, title, triggeredAt: Date.now() }),
  clear: () => set({ prompt: null, title: null, triggeredAt: 0 }),
}));
