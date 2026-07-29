export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
}

export interface RefreshResponse {
  message: string;
}

export interface MeResponse {
  user: AuthUser;
}

export interface ApiError {
  message: string;
  errors?: unknown;
}
