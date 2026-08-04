import { useEffect } from 'react';
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

      if (state.accessToken && isAccessTokenExpired(state.accessToken)) {
        clearAuth();
      }

      if (isMounted) {
        setInitialized(true);
      }
    }

    void initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [clearAuth, setInitialized]);
}
