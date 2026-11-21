import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export default function DemoInfo({ title, children, backLabel = "Back to sign-up demo" }: { title: string; children: ReactNode; backLabel?: string }) {
  return (
    <main className="signup demo-info">
      <article className="signup-panel demo-info-panel">
        <Image src="/neoncore/logo.svg" alt="NEONCORE" width={169} height={32} />
        <h1>{title}</h1>
        {children}
        <Link className="signup-link" href="/">{backLabel}</Link>
      </article>
    </main>
  );
}
