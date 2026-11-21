import type { Metadata } from "next";
import { authConfig } from "../auth/config";
import DemoInfo from "../demo-info";

export const metadata: Metadata = { title: "Terms | NEONCORE" };

export default function TermsPage() {
  if (!authConfig()) {
    return (
      <DemoInfo title="Demo Terms">
        <p>Use this preview with made-up details only. Completing the demo does not create an account or grant access to a service.</p>
      </DemoInfo>
    );
  }

  return (
    <DemoInfo title="Preview Terms" backLabel="Back to signup">
      <p>These terms apply to the NEONCORE development preview. Use an email address you control so you can verify it. Choose a callsign that you can use without impersonating someone else.</p>
      <p>Preview accounts are for testing the signup and login flow. Their data may be cleared as part of development.</p>
    </DemoInfo>
  );
}
