import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types/auth';

interface AuthState {
  user: AuthUser | null;
  isInitialized: boolean;
  setAuth: (user: AuthUser) => void;
  clearAuth: () => void;
  setInitialized: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isInitialized: false,
      setAuth: (user) => set({ user }),
      clearAuth: () => set({ user: null }),
      setInitialized: (isInitialized) => set({ isInitialized }),
    }),
    {
      name: 'clearint-auth',
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
