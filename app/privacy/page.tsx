import type { Metadata } from "next";
import DemoInfo from "../demo-info";

export const metadata: Metadata = { title: "Privacy Policy | NEONCORE" };

export default function PrivacyPage() {
  return (
    <DemoInfo title="Privacy Policy" backLabel="Back to signup">
      <p>When you simulate signup, your form entries stay in your browser and are used to show validation and the demo result.</p>
      <p>When you create an account, Neon Auth uses your email address for login, verification, and password resets. It stores your email address, a password hash, and session records. Neon Postgres stores your callsign, the policy versions you accepted, and when you accepted them.</p>
      <p>A temporary cookie keeps your email, callsign, and policy acceptance available for up to 30 minutes while you verify your email. A session cookie keeps you signed in.</p>
      <p>Vercel hosts the site and records basic request details for operations and troubleshooting. Neon provides authentication, verification and reset emails, and database storage.</p>
      <p>Account and profile records stay in storage until the maintainer removes them or resets the project data. For privacy questions, or to request a copy or deletion of your data, use the contact details on <a className="signup-link" href="https://www.ferfalcon.com/">maintainer Fernando Falcon’s website</a>.</p>
    </DemoInfo>
  );
}
