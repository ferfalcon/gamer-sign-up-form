export type DemoSignupResult = {
  kind: "simulated";
  callsign: string;
};

const handshakeDelayMs = 1_600;

// Accept only the validated display value. Email, passwords, and consent never cross this boundary.
export async function submitDemoSignup(callsign: string): Promise<DemoSignupResult> {
  await new Promise<void>((resolve) => setTimeout(resolve, handshakeDelayMs));
  return { kind: "simulated", callsign };
}
