import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AccountPanel from "../auth/account-panel";
import AuthForm from "../auth/auth-form";
import { authConfig } from "../auth/config";
import DemoInfo from "../demo-info";

export const metadata: Metadata = { title: "Log in | NEONCORE" };

type Search = Record<string, string | string[] | undefined>;

async function LoginForm({ searchParams }: { searchParams: Promise<Search> }) {
  const { verified, reset, signout } = await searchParams;
  const notice = verified === "1" ? "Email verified. Log in to finish setting up your account."
    : reset === "1" ? "Password reset. Log in with your new password."
    : signout === "local" ? "You’re signed out in this browser. The account service could not end the server session."
    : undefined;

  return <AuthForm mode="login" initialState={{ notice }} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  if (!authConfig()) {
    return (
      <DemoInfo title="Demo log in">
        <p>This preview simulates signup. Log in becomes available when the account service is configured.</p>
      </DemoInfo>
    );
  }

  return (
    <AccountPanel title="Log in">
      <Suspense fallback={<p role="status">Loading login…</p>}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
      <nav className="account-links" aria-label="Account options">
        <Link className="signup-link" href="/reset-password">Forgot password?</Link>
        <Link className="signup-link" href="/">Create an account</Link>
      </nav>
    </AccountPanel>
  );
}
