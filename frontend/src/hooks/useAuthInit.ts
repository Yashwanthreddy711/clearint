import { useEffect } from 'react';
import {
  isAccessTokenExpired,
  useAuthStore,
} from '../store/authStore';

export function useAuthInit() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    let cancelled = false;

    const finishInit = () => {
      if (!cancelled) {
        setInitialized(true);
      }
    };

    const startInit = () => {
      const state = useAuthStore.getState();

      if (!state.accessToken || isAccessTokenExpired(state.accessToken)) {
        clearAuth();
      }

      finishInit();
    };

    const unsub = useAuthStore.persist.onFinishHydration(() => {
      if (!cancelled) {
        startInit();
      }
    });

    if (useAuthStore.persist.hasHydrated()) {
      startInit();
    }

    return () => {
      cancelled = true;
      unsub();
    };
  }, [clearAuth, setInitialized]);
}
