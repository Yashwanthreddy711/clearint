import { useEffect } from 'react';
import { getCurrentUser } from '../api/auth';
import { useAuthStore } from '../store/authStore';

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
    let isMounted = true;

    async function initializeAuth() {
      const persistedState = readPersistedAuthState();
      const accessToken = persistedState?.accessToken ?? useAuthStore.getState().accessToken;

      if (accessToken) {
        useAuthStore.setState({
          accessToken,
          user: persistedState?.user ?? useAuthStore.getState().user,
        });
      }

      if (!accessToken) {
        if (isMounted) {
          setInitialized(true);
        }
        return;
      }

      try {
        const response = await getCurrentUser(accessToken);
        useAuthStore.setState({
          accessToken,
          user: response.user,
        });
      } catch (error) {
        console.warn('Auth bootstrap could not validate the session:', error);
      } finally {
        if (isMounted) {
          setInitialized(true);
        }
      }
    }

    void initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [clearAuth, setInitialized]);
}
