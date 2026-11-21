import { authConfig } from "./auth/config";
import SignupForm from "./signup-form";

export default function Home() {
  return (
    <main className="signup">
      <SignupForm live={Boolean(authConfig())} />
    </main>
  );
}
