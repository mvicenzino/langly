import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const BASE_URL = import.meta.env.VITE_API_URL || '';

interface AuthState {
  token: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  verify: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,

      login: async (password: string) => {
        try {
          const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
          });
          if (!res.ok) return false;
          const data = await res.json();
          set({ token: data.token });
          return true;
        } catch {
          return false;
        }
      },

      logout: () => set({ token: null }),

      verify: async () => {
        const { token } = get();
        if (!token) return false;
        try {
          const res = await fetch(`${BASE_URL}/api/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            set({ token: null });
            return false;
          }
          return true;
        } catch {
          return false;
        }
      },
    }),
    { name: 'langly-auth' }
  )
);
