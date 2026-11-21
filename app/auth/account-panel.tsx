import Image from "next/image";
import type { ReactNode } from "react";

export default function AccountPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="signup demo-info">
      <section className="signup-panel demo-info-panel account-panel" aria-labelledby="account-title">
        <header>
          <Image src="/neoncore/logo.svg" alt="NEONCORE" width={169} height={32} priority />
          <h1 id="account-title">{title}</h1>
        </header>
        {children}
      </section>
    </main>
  );
}
