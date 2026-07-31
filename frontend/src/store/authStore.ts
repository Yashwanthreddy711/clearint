import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types/auth';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isInitialized: boolean;
  setAuth: (accessToken: string, user: AuthUser) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
  setInitialized: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isInitialized: false,
      setAuth: (accessToken) => set({ accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () => set({ accessToken: null }),
      setInitialized: (isInitialized) => set({ isInitialized }),
    }),
    {
      name: 'clearint-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
      }),
    }
  )
);

export const getAccessToken = () => useAuthStore.getState().accessToken;
