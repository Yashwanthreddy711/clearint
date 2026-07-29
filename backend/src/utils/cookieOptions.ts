import type { CookieOptions } from "express";

export const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;

const isProduction = process.env.NODE_ENV === "production";

function resolveSameSite(): CookieOptions["sameSite"] {
  const configured = process.env.COOKIE_SAME_SITE?.toLowerCase();
  if (configured === "none" || configured === "lax" || configured === "strict") {
    return configured;
  }
  // Cross-origin deploys (e.g. Vercel frontend + Render API) need SameSite=None.
  return isProduction ? "none" : "lax";
}

function resolveSecure(sameSite: CookieOptions["sameSite"]): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  // SameSite=None always requires Secure (browser requirement).
  if (sameSite === "none") return true;
  return isProduction;
}

function baseCookieOptions(maxAge: number): CookieOptions {
  const sameSite = resolveSameSite();
  const secure = resolveSecure(sameSite);

  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge,
    path: "/",
  };
}

export function refreshTokenCookieOptions(
  maxAge = REFRESH_TOKEN_MAX_AGE_MS
): CookieOptions {
  return baseCookieOptions(maxAge);
}

export function accessTokenCookieOptions(
  maxAge = ACCESS_TOKEN_MAX_AGE_MS
): CookieOptions {
  return baseCookieOptions(maxAge);
}
