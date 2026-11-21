import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { authConfig } from "./config";
import { policyVersions } from "./policy-versions";
import type { VerificationRequest } from "./state";

export type ProfileAcceptance = {
  callsign: string;
  acceptedAt: string;
  termsVersion: string;
  privacyVersion: string;
};

type Draft = ProfileAcceptance & { email: string; expiresAt: number };
type VerificationHandoff = { email: string; request: VerificationRequest; expiresAt: number };
const draftCookie = "neoncore-signup";
const verificationCookie = "neoncore-verification";
const maxAge = 30 * 60;

function sign(name: string, payload: string, secret: string) {
  return createHmac("sha256", secret).update(`${name}:`).update(payload).digest();
}

export function profileAcceptance(callsign: string): ProfileAcceptance {
  return {
    callsign,
    acceptedAt: new Date().toISOString(),
    termsVersion: policyVersions.terms,
    privacyVersion: policyVersions.privacy,
  };
}

async function setTemporaryCookie(name: string, data: object) {
  const config = authConfig();
  if (!config) throw new Error("Authentication is not configured");

  const payload = Buffer.from(JSON.stringify({ ...data, expiresAt: Date.now() + maxAge * 1000 })).toString("base64url");
  (await cookies()).set(name, `${payload}.${sign(name, payload, config.cookieSecret).toString("base64url")}`, {
    maxAge, path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
  });
}

async function readTemporaryCookie<T extends { expiresAt: number }>(name: string): Promise<T | null> {
  const value = (await cookies()).get(name)?.value;
  const config = authConfig();
  if (!value || !config) return null;

  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  const received = Buffer.from(signature, "base64url");
  const expected = sign(name, payload, config.cookieSecret);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

  await connection(); // Check expiry at request time, not during static shell validation.
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as T;
    return data.expiresAt > Date.now() ? data : null;
  } catch {
    return null;
  }
}

export async function setSignupDraft(email: string, callsign: string) {
  await setTemporaryCookie(draftCookie, { ...profileAcceptance(callsign), email });
}

export async function readSignupDraft() {
  const draft = await readTemporaryCookie<Draft>(draftCookie);
  if (draft?.termsVersion !== policyVersions.terms || draft.privacyVersion !== policyVersions.privacy) return null;
  return draft;
}

export async function clearSignupDraft() {
  (await cookies()).delete(draftCookie);
}

// Separate from policy acceptance: an unverified login may not have a signup draft.
export async function setVerificationHandoff(email: string, request: VerificationRequest) {
  await setTemporaryCookie(verificationCookie, { email, request });
}

export async function readVerificationHandoff() {
  return readTemporaryCookie<VerificationHandoff>(verificationCookie);
}

export async function clearVerificationHandoff() {
  (await cookies()).delete(verificationCookie);
}
