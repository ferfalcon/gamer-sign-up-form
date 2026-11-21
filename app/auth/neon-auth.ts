import "server-only";
import { cookies, headers } from "next/headers";
import { authConfig } from "./config";

const upstreamSession = "__Secure-neon-auth.session_token";
const secure = process.env.NODE_ENV === "production";
const appSession = secure ? "__Host-neoncore-session" : "neoncore-session";

const authPaths = {
  signup: "/sign-up/email",
  login: "/sign-in/email",
  logout: "/sign-out",
  session: "/get-session",
  verify: "/email-otp/verify-email",
  sendVerification: "/email-otp/send-verification-otp",
  sendReset: "/forget-password/email-otp",
  reset: "/email-otp/reset-password",
} as const;

type Intent = keyof typeof authPaths;
type AuthResponse = { ok: boolean; status: number; code?: string; user?: unknown };
type AuthUser = { id: string; email: string; emailVerified: boolean };

export async function requestAuth(intent: Intent, body?: Record<string, string>): Promise<AuthResponse> {
  const config = authConfig();
  if (!config) return { ok: false, status: 503 };

  const jar = await cookies();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const token = intent === "session" || intent === "logout" ? jar.get(appSession)?.value : undefined;
  const upstreamHeaders = new Headers({ accept: "application/json" });
  if (token) upstreamHeaders.set("cookie", `${upstreamSession}=${encodeURIComponent(token)}`);
  if (origin && origin !== "null") upstreamHeaders.set("origin", origin);
  if (body) upstreamHeaders.set("content-type", "application/json");

  try {
    const response = await fetch(`${config.baseUrl}${authPaths[intent]}`, {
      method: body ? "POST" : "GET",
      body: body ? JSON.stringify(body) : undefined,
      headers: upstreamHeaders,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    const data = await response.json().catch(() => null);
    if (response.ok && (intent === "login" || intent === "verify" || intent === "logout")) {
      for (const header of response.headers.getSetCookie()) {
        const [pair, ...attributes] = header.split(";");
        // The provider owns the token; its scope is rewritten to this app's host.
        if (!pair.startsWith(`${upstreamSession}=`)) continue;

        const value = pair.slice(upstreamSession.length + 1);
        const maxAge = attributes.find((attribute) => /^\s*max-age=/i.test(attribute));
        const lifetime = maxAge ? Number(maxAge.split("=")[1]) : undefined;
        jar.set(appSession, decodeURIComponent(value), {
          httpOnly: true,
          secure,
          path: "/",
          sameSite: "lax",
          maxAge: !value ? 0 : Number.isFinite(lifetime) ? lifetime : undefined,
        });
      }
    }
    return {
      ok: response.ok,
      status: response.status,
      code: typeof data?.code === "string" ? data.code : undefined,
      user: data?.user,
    };
  } catch {
    return { ok: false, status: 503 };
  }
}

export async function sessionUser(): Promise<AuthUser | null> {
  if (!(await cookies()).has(appSession)) return null;

  const result = await requestAuth("session");
  if (!result.ok && result.status !== 401 && result.status !== 403) {
    throw new Error("Authentication service unavailable");
  }

  const user = result.user as Partial<AuthUser> | undefined;
  if (!result.ok || typeof user?.id !== "string" || typeof user.email !== "string") return null;

  return { id: user.id, email: user.email, emailVerified: user.emailVerified === true };
}

export async function clearSessionCookie() {
  (await cookies()).set(appSession, "", { httpOnly: true, secure, path: "/", sameSite: "lax", maxAge: 0 });
}
