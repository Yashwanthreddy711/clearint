import { useEffect } from 'react';
import { getCurrentUser } from '../api/auth';
import {
  isAccessTokenExpired,
  useAuthStore,
} from '../store/authStore';

export function useAuthInit() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      await useAuthStore.persist.rehydrate();

      const state = useAuthStore.getState();

      if (!state.accessToken) {
        if (isMounted) {
          setInitialized(true);
        }
        return;
      }

      if (isAccessTokenExpired(state.accessToken)) {
        clearAuth();
        if (isMounted) {
          setInitialized(true);
        }
        return;
      }

      try {
        const response = await getCurrentUser(state.accessToken);
        useAuthStore.setState({
          accessToken: state.accessToken,
          user: response.user,
        });
      } catch {
        clearAuth();
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
