import { useEffect } from 'react';
import { refreshAccessToken } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export function useAuthInit() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    let cancelled = false;
    let started = false;

    async function init() {
      if (started) return;
      started = true;

      try {
        const { accessToken } = await refreshAccessToken();
        if (!cancelled) setAccessToken(accessToken);
      } catch {
        if (!cancelled) clearAuth();
      } finally {
        if (!cancelled) setInitialized(true);
      }
    }

    const unsub = useAuthStore.persist.onFinishHydration(() => {
      if (!cancelled) init();
    });

    if (useAuthStore.persist.hasHydrated()) {
      init();
    }

    return () => {
      cancelled = true;
      unsub();
    };
  }, [setAccessToken, clearAuth, setInitialized]);
}
