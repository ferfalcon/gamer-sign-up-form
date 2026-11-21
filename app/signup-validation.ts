export const fieldLabels = {
  callsign: "Callsign",
  email: "Email",
  password: "Password",
  "confirm-password": "Confirm",
  terms: "Terms",
} as const;

export type Field = keyof typeof fieldLabels;
export const fields = Object.keys(fieldLabels) as Field[];

type Issue = { message: string; status: string };

// Matches the syntax of a single native email input.
const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function textValue(data: FormData, field: string) {
  const value = data.get(field);
  return typeof value === "string" ? value : "";
}

function strengthLevel(password: string) {
  if (!password) return 0;
  if (password.length < 8) return 1;
  const variety = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9\s]/]
    .filter((pattern) => pattern.test(password)).length;
  if (password.length >= 12 && variety >= 3) return 4;
  return variety >= 2 || password.length >= 12 ? 3 : 2;
}

export const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"] as const;

export function isValidEmail(email: string) {
  return email.length <= 254 && emailPattern.test(email);
}

export const passwordLimits = { min: 8, max: 128 } as const;

export function validateProfile(data: FormData) {
  const callsign = textValue(data, "callsign").trim();
  const issues: Partial<Record<"callsign" | "terms", Issue>> = {};

  if (callsign.length < 3) {
    issues.callsign = { message: "Use at least 3 characters", status: "Too short" };
  } else if (callsign.length > 20) {
    issues.callsign = { message: "Use at most 20 characters", status: "Too long" };
  } else if (!/^[a-zA-Z0-9_-]+$/.test(callsign)) {
    issues.callsign = { message: "Use only letters, numbers, _ or -", status: "Invalid" };
  }
  if (data.get("terms") !== "on") {
    issues.terms = { message: "Accept the terms to continue", status: "Required" };
  }

  return { callsign, issues };
}

export function validateSignup(data: FormData) {
  const { callsign, issues: profileIssues } = validateProfile(data);
  const email = textValue(data, "email").trim();
  const password = textValue(data, "password");
  const confirmation = textValue(data, "confirm-password");
  const issues: Partial<Record<Field, Issue>> = { ...profileIssues };

  if (!isValidEmail(email)) {
    issues.email = { message: "Enter a valid email, like you@example.com", status: "Malformed" };
  }
  if (password.length < passwordLimits.min) {
    issues.password = { message: "Use at least 8 characters", status: "Too short" };
  } else if (password.length > passwordLimits.max) {
    issues.password = { message: "Use at most 128 characters", status: "Too long" };
  }
  if (!confirmation || confirmation !== password) {
    issues["confirm-password"] = {
      message: confirmation ? "Passwords don't match" : "Confirm your password",
      status: confirmation ? "Mismatch" : "Required",
    };
  }
  const invalid = fields.filter((field) => issues[field]);
  return {
    issues,
    invalid,
    readyCount: fields.length - invalid.length,
    operatorId: issues.callsign ? "" : callsign,
    strength: strengthLevel(password),
  };
}
