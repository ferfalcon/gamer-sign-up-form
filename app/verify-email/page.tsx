import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AccountPanel from "../auth/account-panel";
import AuthForm from "../auth/auth-form";
import { authConfig } from "../auth/config";
import { readSignupDraft, readVerificationHandoff } from "../auth/signup-draft";
import { type AuthFormState, authUnavailable, codeRequestErrors, verificationNotice } from "../auth/state";

export const metadata: Metadata = { title: "Verify email | NEONCORE" };

async function VerificationForm() {
  const handoff = await readVerificationHandoff();
  const state: AuthFormState = { email: handoff?.email ?? (await readSignupDraft())?.email };
  if (handoff?.request === "requested") state.notice = verificationNotice;
  else if (handoff?.request === "not-requested") state.notice = "No new code was requested. Use your existing code or request one below.";
  else if (handoff) state.error = codeRequestErrors[handoff.request];

  return <AuthForm mode="verify" initialState={state} />;
}

export default function VerifyEmailPage() {
  return (
    <AccountPanel title="Verify your email">
      {authConfig() ? (
        <>
          <p>Enter your six-digit verification code, or request a code if you don’t have one.</p>
          <Suspense fallback={<p role="status">Loading verification…</p>}>
            <VerificationForm />
          </Suspense>
        </>
      ) : <p>{authUnavailable}</p>}
      <Link href="/login" className="signup-link">Back to log in</Link>
    </AccountPanel>
  );
}
