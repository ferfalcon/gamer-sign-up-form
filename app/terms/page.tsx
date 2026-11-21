import type { Metadata } from "next";
import DemoInfo from "../demo-info";

export const metadata: Metadata = { title: "Demo Terms | NEONCORE" };

export default function Page() {
  return (
    <DemoInfo title="Demo Terms">
      <p>Use this preview with made-up details only. The checkbox is part of the sign-up demonstration. Completing the demo does not create an account or grant access to a service.</p>
    </DemoInfo>
  );
}
