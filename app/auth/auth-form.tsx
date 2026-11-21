"use client";

import Image from "next/image";
import Link from "next/link";
import { type InputHTMLAttributes, useActionState, useEffect, useRef, useState } from "react";
import { completeProfile, logIn, resetPassword, verifyEmail } from "./actions";
import { policyVersions } from "./policy-versions";
import type { AuthFormState } from "./state";
import { passwordLimits } from "../signup-validation";
import { signupDestinations } from "../signup-destinations";

const actions = { login: logIn, verify: verifyEmail, reset: resetPassword, profile: completeProfile };
const submitLabels = { login: "Log in", verify: "Verify email", reset: "Reset password", profile: "Save callsign" };

function Field({
  id, label, invalid, hint, reveal, ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  invalid?: boolean;
  hint?: string;
  reveal?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const input = (
    <input
      {...props}
      id={id}
      name={id}
      type={visible ? "text" : props.type}
      aria-invalid={Boolean(invalid)}
      aria-describedby={[hint && `${id}-hint`, invalid && "auth-feedback"].filter(Boolean).join(" ") || undefined}
      required
    />
  );

  return (
    <div className="signup-field">
      <label htmlFor={id}>{label}</label>
      {reveal ? (
        <div className="signup-password">
          {input}
          <button type="button" aria-label={`Show ${label.toLowerCase()}`} aria-pressed={visible} aria-controls={id}
            onClick={() => setVisible(!visible)}>
            <Image src={visible ? "/neoncore/icon-eye-off.svg" : "/neoncore/icon-eye.svg"} alt="" width={20} height={20} />
          </button>
        </div>
      ) : input}
      {hint && <p id={`${id}-hint`}>{hint}</p>}
    </div>
  );
}

export default function AuthForm({
  mode, initialState = {},
}: {
  mode: keyof typeof actions;
  initialState?: AuthFormState;
}) {
  const [state, action, pending] = useActionState(actions[mode], initialState);
  const [email, setEmail] = useState(initialState.email ?? "");
  const [callsign, setCallsign] = useState(initialState.callsign ?? "");
  const form = useRef<HTMLFormElement>(null);
  const showReset = mode === "reset" && state.resetCodeSent;

  useEffect(() => {
    if (state.field) form.current?.querySelector<HTMLElement>(`#${state.field}`)?.focus();
    if (state.resetCodeSent && state.notice) form.current?.querySelector<HTMLElement>("#otp")?.focus();
  }, [state]);

  return (
    <form action={action} ref={form} className="auth-form" aria-busy={pending}>
      <fieldset className="signup-form" disabled={pending}>
        {mode === "profile" ? (
          <>
            <Field id="callsign" label="Callsign" type="text" autoComplete="nickname" spellCheck={false}
              autoCapitalize="none" value={callsign} onChange={(event) => setCallsign(event.target.value)}
              hint="3–20 characters: letters, numbers, _ or -" invalid={state.field === "callsign"} />
            <div className="signup-terms">
              <input id="terms" type="checkbox" name="terms" required aria-invalid={state.field === "terms"}
                aria-describedby={state.field === "terms" ? "auth-feedback" : undefined} />
              <span>
                <label htmlFor="terms">I accept the</label>{" "}
                <Link href={signupDestinations.terms} className="signup-link">Terms</Link>{" and "}
                <Link href={signupDestinations.privacy} className="signup-link">Privacy Policy</Link>.
              </span>
            </div>
            <input type="hidden" name="terms-version" value={policyVersions.terms} />
            <input type="hidden" name="privacy-version" value={policyVersions.privacy} />
          </>
        ) : (
          <Field id="email" label="Email" type="email" autoComplete="username" maxLength={254} value={email}
            onChange={(event) => setEmail(event.target.value)} invalid={state.field === "email"} />
        )}
        {(mode === "verify" || showReset) && (
          <Field id="otp" label="Six-digit code" type="text" autoComplete="one-time-code" inputMode="numeric"
            pattern="[0-9]{6}" maxLength={6} invalid={state.field === "otp"} />
        )}
        {(mode === "login" || showReset) && (
          <Field id="password" label={showReset ? "New password" : "Password"} type="password"
            autoComplete={showReset ? "new-password" : "current-password"} reveal maxLength={passwordLimits.max}
            minLength={showReset ? passwordLimits.min : undefined} invalid={state.field === "password"}
            hint={showReset ? "Use 8–128 characters." : undefined} />
        )}
        {state.error && <p className="signup-error" role="alert" id="auth-feedback">{state.error}</p>}
        {state.notice && <p role="status">{state.notice}</p>}
        <button
          className="signup-primary"
          data-pending={pending}
          type="submit"
          name="intent"
          value={mode === "reset" && !showReset ? "send" : "submit"}
        >
          {pending ? "Please wait…" : mode === "reset" && !showReset ? "Send reset code" : submitLabels[mode]}
        </button>
        {(mode === "verify" || showReset) && (
          <button className="signup-link" type="submit" name="intent" value="send" formNoValidate>Send a new code</button>
        )}
      </fieldset>
    </form>
  );
}
