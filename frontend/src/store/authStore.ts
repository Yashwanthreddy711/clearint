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

function decodeJwtPayload(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      Math.ceil(normalized.length / 4) * 4,
      '='
    );

    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(token: string | null) {
  if (!token) return true;

  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;

  return Date.now() >= payload.exp * 1000;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isInitialized: false,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () => set({ accessToken: null, user: null }),
      setInitialized: (isInitialized) => set({ isInitialized }),
    }),
    {
      name: 'clearint-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user
          ? {
              id: state.user.id,
              username: state.user.username,
              email: state.user.email,
            }
          : null,
      }),
      onRehydrateStorage: () => () => {
        // Let the backend /me endpoint decide whether the session is still valid.
        // Client-side expiry checks here can prevent the auth bootstrap from
        // ever reaching the server verification request.
      },
    }
  )
);

export const getAccessToken = () => useAuthStore.getState().accessToken;
