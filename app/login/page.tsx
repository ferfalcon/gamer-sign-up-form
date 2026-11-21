import type { Metadata } from "next";
import DemoInfo from "../demo-info";

export const metadata: Metadata = { title: "Demo log in | NEONCORE" };

export default function Page() {
  return (
    <DemoInfo title="Demo log in">
      <p>This preview has no sign-in form. The sign-up demo does not create accounts or sessions, so there is nothing to log in to. You can return to the sign-up demo to try it again.</p>
    </DemoInfo>
  );
}
