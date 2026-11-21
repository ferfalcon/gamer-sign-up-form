import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AccountPanel from "../auth/account-panel";
import { signOut } from "../auth/actions";
import AuthForm from "../auth/auth-form";
import { sessionUser } from "../auth/neon-auth";
import { findProfile } from "../auth/profiles";
import { readSignupDraft } from "../auth/signup-draft";
import { type AuthFormState, authUnavailable } from "../auth/state";

export const metadata: Metadata = { title: "Complete signup | NEONCORE" };

async function ProfileForm({ searchParams }: {
  searchParams: PageProps<"/complete-profile">["searchParams"];
}) {
  const user = await sessionUser().catch(() => undefined);
  if (user === undefined) return <p role="alert">{authUnavailable}</p>;
  if (!user) redirect("/login");
  if (!user.emailVerified) redirect("/verify-email");

  const profile = await findProfile(user.id).catch(() => undefined);
  if (profile) redirect("/account");

  const [draft, { status }] = await Promise.all([readSignupDraft(), searchParams]);
  const state: AuthFormState = {};
  if (draft?.email === user.email.toLowerCase()) state.callsign = draft.callsign;
  if (status === "callsign-taken") {
    state.field = "callsign";
    state.error = "That callsign is already taken. Choose another to finish signing up.";
  } else if (status === "unavailable" || profile === undefined) {
    state.error = "Your profile couldn’t be saved. You can try again below.";
  }

  return (
    <>
      <p>Choose a callsign and accept the policies to finish setting up your account.</p>
      <AuthForm mode="profile" initialState={state} />
      <form action={signOut}>
        <button className="signup-link" type="submit">Sign out</button>
      </form>
    </>
  );
}

export default function CompleteProfilePage({ searchParams }: PageProps<"/complete-profile">) {
  return (
    <AccountPanel title="Complete signup">
      <Suspense fallback={<p role="status">Loading profile…</p>}>
        <ProfileForm searchParams={searchParams} />
      </Suspense>
    </AccountPanel>
  );
}
