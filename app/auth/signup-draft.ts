import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { authConfig } from "./config";
import { policyVersions } from "./policy-versions";

export type ProfileAcceptance = {
  callsign: string;
  acceptedAt: string;
  termsVersion: string;
  privacyVersion: string;
};

type Draft = ProfileAcceptance & { email: string; expiresAt: number };
const cookie = "neoncore-signup";
const maxAge = 30 * 60;

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update("neoncore-signup:").update(payload).digest();
}

export function profileAcceptance(callsign: string): ProfileAcceptance {
  return {
    callsign,
    acceptedAt: new Date().toISOString(),
    termsVersion: policyVersions.terms,
    privacyVersion: policyVersions.privacy,
  };
}

export async function setSignupDraft(email: string, callsign: string) {
  const config = authConfig();
  if (!config) throw new Error("Authentication is not configured");

  const draft: Draft = { ...profileAcceptance(callsign), email, expiresAt: Date.now() + maxAge * 1000 };
  const payload = Buffer.from(JSON.stringify(draft)).toString("base64url");
  (await cookies()).set(cookie, `${payload}.${sign(payload, config.cookieSecret).toString("base64url")}`, {
    maxAge, path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
  });
}

export async function readSignupDraft() {
  const value = (await cookies()).get(cookie)?.value;
  const config = authConfig();
  if (!value || !config) return null;

  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  const received = Buffer.from(signature, "base64url");
  const expected = sign(payload, config.cookieSecret);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

  try {
    const draft = JSON.parse(Buffer.from(payload, "base64url").toString()) as Draft;
    if (draft.expiresAt <= Date.now() || draft.termsVersion !== policyVersions.terms
      || draft.privacyVersion !== policyVersions.privacy) return null;
    return draft;
  } catch {
    return null;
  }
}

export async function clearSignupDraft() {
  (await cookies()).delete(cookie);
}
