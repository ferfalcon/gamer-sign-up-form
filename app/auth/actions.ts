"use server";

import { redirect } from "next/navigation";
import { isValidEmail, passwordLimits, textValue, validateProfile, validateSignup } from "../signup-validation";
import { authConfig } from "./config";
import { policyVersions } from "./policy-versions";
import { clearSessionCookie, requestAuth, sessionUser } from "./neon-auth";
import { findProfile, saveProfile } from "./profiles";
import { clearSignupDraft, clearVerificationHandoff, profileAcceptance, readSignupDraft, setSignupDraft, setVerificationHandoff } from "./signup-draft";
import { type AuthFormState, authUnavailable, codeRequestErrors, verificationNotice } from "./state";

function emailFrom(data: FormData) {
  return textValue(data, "email").trim().toLowerCase();
}

function acceptedCurrentPolicies(data: FormData) {
  return data.get("terms-version") === policyVersions.terms && data.get("privacy-version") === policyVersions.privacy;
}

function providerUnavailable(status: number) {
  return status >= 500;
}

function providerMessage(status: number, fallback: string) {
  if (providerUnavailable(status)) return authUnavailable;
  if (status === 429) return "Too many attempts. Wait a few minutes and try again.";
  return fallback;
}

function codeRequestOutcome(result: Awaited<ReturnType<typeof requestAuth>>, intent: "sendVerification" | "sendReset") {
  if (result.ok) return "requested";
  if (result.status === 429) return "rate-limited";
  // Don't reveal whether the address is registered or already verified.
  // An unrecognized failure (including a forbidden request) is not a delivery acknowledgement.
  if ([400, 404, 409, 422].includes(result.status) && (result.code === "USER_NOT_FOUND"
    || (intent === "sendVerification" && result.code === "EMAIL_ALREADY_VERIFIED"))) {
    return "requested";
  }
  return "unavailable";
}

async function requestVerificationCode(email: string) {
  return codeRequestOutcome(
    await requestAuth("sendVerification", { email, type: "email-verification" }),
    "sendVerification",
  );
}

export async function createAccount(data: FormData) {
  if (!authConfig()) return { error: authUnavailable };

  if (!acceptedCurrentPolicies(data)) return { error: "The policies have changed. Reload the page and review them before signing up." };
  const validation = validateSignup(data);
  if (validation.invalid.length) return { issues: validation.issues };

  const email = emailFrom(data);
  const result = await requestAuth("signup", {
    email,
    name: validation.operatorId,
    password: textValue(data, "password"),
  });
  const duplicate = !result.ok && (result.code === "USER_ALREADY_EXISTS" || result.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL");
  if (!result.ok && !duplicate) {
    return { error: providerMessage(result.status, "We couldn’t start signup. Check your details and try again.") };
  }

  // New signups request a code automatically through the provider. Duplicates need a separate request.
  const request = duplicate ? await requestVerificationCode(email) : "requested";
  await setSignupDraft(email, validation.operatorId);
  await setVerificationHandoff(email, request);
  return { verify: true as const };
}

async function finishSignup(email: string) {
  const user = await sessionUser().catch(() => null);
  if (!user?.emailVerified || user.email.toLowerCase() !== email) return;

  const existing = await findProfile(user.id).catch(() => undefined);
  if (existing) {
    await clearSignupDraft();
    redirect("/account");
  }

  const draft = await readSignupDraft();
  if (draft?.email !== user.email.toLowerCase()) redirect("/complete-profile");

  const result = await saveProfile(user.id, draft);
  if (result !== "saved") redirect(`/complete-profile?status=${result}`);

  await clearSignupDraft();
  redirect("/account");
}

export async function logIn(_: AuthFormState, data: FormData): Promise<AuthFormState> {
  const email = emailFrom(data);
  const password = textValue(data, "password");
  if (!isValidEmail(email)) return { field: "email", error: "Enter a valid email address.", email };
  if (!password || password.length > passwordLimits.max) {
    return { field: "password", error: "Enter your password.", email };
  }

  const result = await requestAuth("login", { email, password });
  if (result.code === "EMAIL_NOT_VERIFIED") {
    await setVerificationHandoff(email, "not-requested");
    redirect("/verify-email");
  }
  if (!result.ok) {
    return { error: providerMessage(result.status, "The email or password is incorrect."), email };
  }

  await clearVerificationHandoff();
  await finishSignup(email);
  return { error: authUnavailable, email };
}

export async function verifyEmail(state: AuthFormState, data: FormData): Promise<AuthFormState> {
  if (data.get("intent") === "send") return resendVerification(state, data);
  const email = emailFrom(data);
  const otp = textValue(data, "otp").trim();
  if (!isValidEmail(email)) return { field: "email", error: "Enter a valid email address.", email };
  if (!/^\d{6}$/.test(otp)) return { field: "otp", error: "Enter the six-digit code.", email };

  const result = await requestAuth("verify", { email, otp });
  if (!result.ok) {
    return { field: "otp", error: providerMessage(result.status, "That code is incorrect or expired."), email };
  }

  await clearVerificationHandoff();
  await finishSignup(email);
  redirect("/login?verified=1");
}

async function resendVerification(_: AuthFormState, data: FormData): Promise<AuthFormState> {
  const email = emailFrom(data);
  if (!isValidEmail(email)) return { field: "email", error: "Enter a valid email address.", email };

  const request = await requestVerificationCode(email);
  await setVerificationHandoff(email, request);
  return request === "requested" ? { notice: verificationNotice, email } : { error: codeRequestErrors[request], email };
}

async function sendPasswordReset(_: AuthFormState, data: FormData): Promise<AuthFormState> {
  const email = emailFrom(data);
  if (!isValidEmail(email)) return { field: "email", error: "Enter a valid email address.", email };

  const request = codeRequestOutcome(await requestAuth("sendReset", { email }), "sendReset");
  return request === "requested"
    ? { notice: "Code requested. If the address is registered, check its inbox for a reset code.", email }
    : { error: codeRequestErrors[request], email };
}

export async function resetPassword(state: AuthFormState, data: FormData): Promise<AuthFormState> {
  if (data.get("intent") === "send") {
    const result = await sendPasswordReset(state, data);
    return { ...result, resetCodeSent: Boolean(result.notice) || state.resetCodeSent };
  }

  const resetCodeSent = true;
  const email = emailFrom(data);
  const otp = textValue(data, "otp").trim();
  const password = textValue(data, "password");
  if (!isValidEmail(email)) return { resetCodeSent, field: "email", error: "Enter a valid email address.", email };
  if (!/^\d{6}$/.test(otp)) return { resetCodeSent, field: "otp", error: "Enter the six-digit code.", email };
  if (password.length < passwordLimits.min || password.length > passwordLimits.max) {
    return { resetCodeSent, field: "password", error: "Use 8–128 characters for your new password.", email };
  }

  const result = await requestAuth("reset", { email, otp, password });
  if (!result.ok) {
    return { resetCodeSent, error: providerMessage(result.status, "The code could not be used. Check it or request a new one."), email };
  }

  await clearSessionCookie();
  redirect("/login?reset=1");
}

export async function completeProfile(_: AuthFormState, data: FormData): Promise<AuthFormState> {
  const user = await sessionUser().catch(() => undefined);
  if (user === undefined) return { error: authUnavailable };
  if (!user) redirect("/login");
  if (!user.emailVerified) redirect("/verify-email");

  if (!acceptedCurrentPolicies(data)) return { error: "The policies have changed. Reload and review them before saving." };

  const { callsign, issues } = validateProfile(data);
  if (issues.callsign) return { field: "callsign", error: issues.callsign.message, callsign };
  if (issues.terms) return { field: "terms", error: issues.terms.message, callsign };

  const result = await saveProfile(user.id, profileAcceptance(callsign));
  if (result === "callsign-taken") return { field: "callsign", error: "That callsign is already taken.", callsign };
  if (result === "unavailable") return { error: "Your profile couldn’t be saved. Try again.", callsign };

  await clearSignupDraft();
  redirect("/account");
}

export async function signOut(): Promise<void> {
  const result = await requestAuth("logout", {});
  await clearSessionCookie();
  await clearSignupDraft();
  await clearVerificationHandoff();
  if (!result.ok && result.status !== 401) redirect("/login?signout=local");

  redirect("/login");
}
