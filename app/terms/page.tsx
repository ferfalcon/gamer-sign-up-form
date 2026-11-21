import type { Metadata } from "next";
import DemoInfo from "../demo-info";

export const metadata: Metadata = { title: "Terms | NEONCORE" };

export default function TermsPage() {
  return (
    <DemoInfo title="Terms of Use" backLabel="Back to signup">
      <p>NEONCORE is a personal learning project built with Next.js. You can use it to try signup, email verification, and login. Use made-up details when the signup button says “Simulate sign-up.”</p>
      <p>For a real account, use an email address you control and a callsign of your own. Keep your password and verification codes private. Use the site in a way that respects other people’s accounts and access.</p>
      <p>The project is provided as is. Features may change or become unavailable, and test accounts and data may be cleared during development.</p>
      <p>For questions, use the contact details on <a className="signup-link" href="https://www.ferfalcon.com/">maintainer Fernando Falcon’s website</a>.</p>
    </DemoInfo>
  );
}
