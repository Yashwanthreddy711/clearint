import { API_BASE_URL } from '../config';
import { getAccessToken } from '../store/authStore';

export async function apiFetch(
  path: string,
  options: RequestInit = {}
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

  // Keep the stored access token intact during refresh/bootstrap.
  // The backend refresh flow should decide whether the token
  // needs to be reissued; the frontend should not wipe the token
  // immediately on a 401 response.
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
