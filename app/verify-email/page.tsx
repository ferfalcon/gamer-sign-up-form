import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AccountPanel from "../auth/account-panel";
import AuthForm from "../auth/auth-form";
import { authConfig } from "../auth/config";
import { readSignupDraft } from "../auth/signup-draft";
import { authUnavailable } from "../auth/state";

export const metadata: Metadata = { title: "Verify email | NEONCORE" };

async function VerificationForm() {
  const draft = await readSignupDraft();
  return <AuthForm mode="verify" initialState={{ email: draft?.email }} />;
}

export default function VerifyEmailPage() {
  return (
    <AccountPanel title="Verify your email">
      {authConfig() ? (
        <>
          <p>Enter the six-digit code from your signup email.</p>
          <Suspense fallback={<p role="status">Loading verification…</p>}>
            <VerificationForm />
          </Suspense>
        </>
      ) : <p>{authUnavailable}</p>}
      <Link href="/login" className="signup-link">Back to log in</Link>
    </AccountPanel>
  );
}
