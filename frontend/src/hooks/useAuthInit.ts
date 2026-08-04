import { useEffect } from 'react';
import {
  isAccessTokenExpired,
  useAuthStore,
} from '../store/authStore';

const PERSISTED_AUTH_KEY = 'clearint-auth';

function readPersistedAuthState() {
  try {
    const raw = window.localStorage.getItem(PERSISTED_AUTH_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      state?: {
        accessToken?: string | null;
        user?: {
          id: string;
          username: string;
          email: string;
        } | null;
      };
    };

    return parsed.state ?? null;
  } catch {
    return null;
  }
}

export function useAuthInit() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    const persistedState = readPersistedAuthState();
    const currentState = useAuthStore.getState();

    if (persistedState?.accessToken) {
      if (isAccessTokenExpired(persistedState.accessToken)) {
        clearAuth();
      } else {
        useAuthStore.setState({
          accessToken: persistedState.accessToken,
          user: persistedState.user ?? null,
        });
      }
    } else if (currentState.accessToken && isAccessTokenExpired(currentState.accessToken)) {
      clearAuth();
    }

    setInitialized(true);
  }, [clearAuth, setInitialized]);
}
