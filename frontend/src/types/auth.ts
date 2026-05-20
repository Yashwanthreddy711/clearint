export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  message: string;
  accessToken: string;
}

export interface ApiError {
  message: string;
  errors?: unknown;
}
