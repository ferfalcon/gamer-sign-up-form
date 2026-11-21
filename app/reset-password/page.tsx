import type { Metadata } from "next";
import Link from "next/link";
import AccountPanel from "../auth/account-panel";
import AuthForm from "../auth/auth-form";
import { authConfig } from "../auth/config";
import { authUnavailable } from "../auth/state";

export const metadata: Metadata = { title: "Reset password | NEONCORE" };

export default function ResetPasswordPage() {
  return (
    <AccountPanel title="Reset password">
      {authConfig() ? <AuthForm mode="reset" /> : <p>{authUnavailable}</p>}
      <Link href="/login" className="signup-link">Back to log in</Link>
    </AccountPanel>
  );
}
