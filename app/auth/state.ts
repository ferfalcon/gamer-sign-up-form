export type AuthFormState = {
  error?: string;
  notice?: string;
  field?: "email" | "otp" | "password" | "callsign" | "terms";
  email?: string;
  callsign?: string;
  resetCodeSent?: boolean;
};

export type VerificationRequest = "requested" | "not-requested" | "unavailable" | "rate-limited";

export const verificationNotice = "Code requested. If the address needs verification, check its inbox for a code.";
export const codeRequestErrors = {
  unavailable: "We couldn’t request a code. Try again in a moment.",
  "rate-limited": "Too many attempts. Wait a few minutes and try again.",
} as const;

export const authUnavailable = "The account service is temporarily unavailable. Try again in a moment.";
