export type AuthFormState = {
  error?: string;
  notice?: string;
  field?: "email" | "otp" | "password" | "callsign" | "terms";
  email?: string;
  callsign?: string;
  resetCodeSent?: boolean;
};

export const authUnavailable = "The account service is temporarily unavailable. Try again in a moment.";
