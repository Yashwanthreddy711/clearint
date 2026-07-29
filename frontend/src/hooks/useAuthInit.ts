import { useEffect } from 'react';
import { fetchMe, refreshAccessToken } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export function useAuthInit() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    let cancelled = false;
    let started = false;

    async function init() {
      if (started) return;
      started = true;

      try {
        await refreshAccessToken();
        const { user } = await fetchMe();
        if (!cancelled) setAuth(user);
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
  }, [setAuth, clearAuth, setInitialized]);
}
