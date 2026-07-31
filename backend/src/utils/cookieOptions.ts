import type { CookieOptions } from "express";

export const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === "production";

function resolveSameSite(): CookieOptions["sameSite"] {
  const configured = process.env.COOKIE_SAME_SITE?.toLowerCase();
  if (configured === "none" || configured === "lax" || configured === "strict") {
    return configured;
  }
  // Cross-origin deploys (e.g. Vercel frontend + Render API) need SameSite=None.
  return isProduction ? "none" : "lax";
}

export function refreshTokenCookieOptions(
  maxAge = REFRESH_TOKEN_MAX_AGE_MS
): CookieOptions {
  const sameSite = resolveSameSite();
  const secure = sameSite === "none" ? true : isProduction;

  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge,
    path: "/",
  };
}
