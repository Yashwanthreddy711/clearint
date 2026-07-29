import { API_BASE_URL } from '../config';
import { refreshAccessToken } from './auth';
import { useAuthStore } from '../store/authStore';

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      await refreshAccessToken();
      return true;
    } catch {
      useAuthStore.getState().clearAuth();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<Response> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
  });

  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch(path, options, false);
    }
  }

  return res;
}

export async function apiJson<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await apiFetch(path, options);
  const data = await res.json();
  if (!res.ok) {
    throw Object.assign(new Error(data.message || 'Request failed'), {
      status: res.status,
      errors: data.errors,
    });
  }
  return data as T;
}
