import type { Metadata } from "next";
import DemoInfo from "../demo-info";

export const metadata: Metadata = { title: "Demo Privacy Policy | NEONCORE" };

export default function Page() {
  return (
    <DemoInfo title="Demo Privacy Policy">
      <p>The sign-up preview uses your entries only in this browser to show validation and simulate completion. It does not send or save your form entries. On success, only the callsign remains visible until you leave or restart the demo.</p>
    </DemoInfo>
  );
}
