import type { Metadata } from "next";
import { authConfig } from "../auth/config";
import DemoInfo from "../demo-info";

export const metadata: Metadata = { title: "Privacy Policy | NEONCORE" };

export default function PrivacyPage() {
  if (!authConfig()) {
    return (
      <DemoInfo title="Demo Privacy Policy">
        <p>The demo uses your entries in your browser to show validation and simulate signup. It does not send or save your form entries.</p>
      </DemoInfo>
    );
  }

  return (
    <DemoInfo title="Preview Privacy Policy" backLabel="Back to signup">
      <p>Neon Auth processes your email and password to verify your email, manage your account, and send password reset codes. Neon stores a password hash and maintains your login session.</p>
      <p>The preview saves your callsign, the policy versions you accepted, and the acceptance time in Neon Postgres. A temporary cookie keeps your signup details available while you verify your email. A session cookie keeps you signed in.</p>
    </DemoInfo>
  );
}
