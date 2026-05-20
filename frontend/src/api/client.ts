import { API_BASE_URL } from '../config';
import { refreshAccessToken } from './auth';
import { getAccessToken, useAuthStore } from '../store/authStore';

let refreshPromise: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const { accessToken } = await refreshAccessToken();
      useAuthStore.getState().setAccessToken(accessToken);
      return accessToken;
    } catch {
      useAuthStore.getState().clearAuth();
      return null;
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
  const token = getAccessToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && retry) {
    const newToken = await tryRefresh();
    if (newToken) {
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
