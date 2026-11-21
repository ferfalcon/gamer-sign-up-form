import "server-only";

export function authConfig() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL?.replace(/\/+$/, "");
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !cookieSecret || cookieSecret.length < 32 || !process.env.DATABASE_URL) {
    return null;
  }

  return { baseUrl, cookieSecret };
}
