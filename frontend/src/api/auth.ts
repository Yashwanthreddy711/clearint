import { API_BASE_URL } from '../config';
import type {
  ApiError,
  AuthResponse,
} from '../types/auth';

const jsonHeaders = { 'Content-Type': 'application/json' };

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    const err = data as ApiError;
    throw Object.assign(new Error(err.message || 'Request failed'), {
      status: res.status,
      errors: err.errors,
    });
  }
  return data as T;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  return parseJson<AuthResponse>(res);
}

export async function register(data: {
  username: string;
  email: string;
  password: string;
  mobileNo?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return parseJson<AuthResponse>(res);
}

export async function logout() {
  const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  return parseJson<{ message: string }>(res);
}
