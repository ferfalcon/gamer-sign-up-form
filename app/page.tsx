import Image from "next/image";
import SignupForm from "./signup-form";

export default function Home() {
  return (
    <main className="signup">
      <header className="signup-brand">
        <Image
          src="/neoncore/logo.svg"
          alt="NEONCORE"
          width={169}
          height={32}
        />
        <h1>
          <span aria-hidden="true">{"// "}</span>Join the Nexus
        </h1>
        <p>Initialize your NEONCORE identity</p>
      </header>
      <SignupForm />
    </main>
  );
}
