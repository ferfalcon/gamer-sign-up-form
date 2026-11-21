import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AccountPanel from "../auth/account-panel";
import { signOut } from "../auth/actions";
import { sessionUser } from "../auth/neon-auth";
import { findProfile } from "../auth/profiles";
import { authUnavailable } from "../auth/state";

export const metadata: Metadata = { title: "Account | NEONCORE" };

async function AccountDetails() {
  const user = await sessionUser().catch(() => undefined);
  if (user === undefined) return <p role="alert">{authUnavailable}</p>;
  if (!user) redirect("/login");
  if (!user.emailVerified) redirect("/verify-email");

  const profile = await findProfile(user.id).catch(() => undefined);
  if (profile === null) redirect("/complete-profile");

  return (
    <>
      {profile ? (
        <dl className="account-details">
          <div><dt>Operator ID</dt><dd>{profile.callsign}</dd></div>
          <div><dt>Email</dt><dd>{user.email}</dd></div>
        </dl>
      ) : <p role="alert">Your saved profile couldn’t be loaded. Reload to try again.</p>}
      <form action={signOut}>
        <button className="signup-link" type="submit">Sign out</button>
      </form>
    </>
  );
}

export default function AccountPage() {
  return (
    <AccountPanel title="Your account">
      <Suspense fallback={<p role="status">Loading account…</p>}>
        <AccountDetails />
      </Suspense>
    </AccountPanel>
  );
}
