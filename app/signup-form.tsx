"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { createAccount } from "./auth/actions";
import { policyVersions } from "./auth/policy-versions";
import { type DemoSignupResult, submitDemoSignup } from "./signup-demo";
import { signupDestinations } from "./signup-destinations";
import { type Field, fieldLabels, fields, strengthLabels, validateSignup } from "./signup-validation";

const passwordFields = [
  { id: "password", label: "Password" },
  { id: "confirm-password", label: "Confirm password" },
] as const;
const hiddenPasswords = { password: false, "confirm-password": false };
const initialValidation = () => validateSignup(new FormData());
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

type Submission =
  | { phase: "edit" | "pending" }
  | { phase: "failure"; message: string }
  | { phase: "success"; result: DemoSignupResult };

function FieldError({ field, message }: { field: Field; message?: string }) {
  if (!message) return null;
  return (
    <p className="signup-error" id={`${field}-error`}>
      <Image src="/neoncore/icon-alert.svg" alt="" width={16} height={16} />
      <span>{message}</span>
    </p>
  );
}

export default function SignupForm({ live }: { live: boolean }) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(subscribe, clientReady, serverReady);
  const [validation, setValidation] = useState(initialValidation);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [attempt, setAttempt] = useState({ count: 0, invalid: 0 });
  const [visible, setVisible] = useState(hiddenPasswords);
  const [submission, setSubmission] = useState<Submission>({ phase: "edit" });
  const inFlight = useRef<symbol | null>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const pending = submission.phase === "pending";
  const success = submission.phase === "success";
  const { readyCount, strength } = validation;
  const operatorId = success ? submission.result.callsign : validation.operatorId;
  const exposedIssue = (field: Field) =>
    attempt.count || touched[field] ? validation.issues[field] : undefined;

  function inputState(field: Field, hint?: string) {
    const invalid = Boolean(exposedIssue(field));
    return {
      "aria-invalid": invalid,
      "aria-describedby": [hint, invalid ? `${field}-error` : null].filter(Boolean).join(" ") || undefined,
      "data-valid": !validation.issues[field],
    };
  }

  function trackBlur(event: FormEvent<HTMLFormElement>) {
    if (inFlight.current) return;
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !fields.includes(input.name as Field)) return;
    setValidation(validateSignup(new FormData(event.currentTarget)));
    setTouched((previous) => ({ ...previous, [input.name]: true }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.currentTarget;
    // Read the actual controls, including values supplied by autofill, before locking them.
    const data = new FormData(form);
    const submitted = validateSignup(data);
    const [firstInvalid] = submitted.invalid;
    if (firstInvalid) {
      flushSync(() => {
        setValidation(submitted);
        setAttempt((previous) => ({ count: previous.count + 1, invalid: submitted.invalid.length }));
        setSubmission({ phase: "edit" });
      });
      form.querySelector<HTMLElement>(`#${firstInvalid}`)?.focus();
      return;
    }

    const request = Symbol();
    inFlight.current = request;
    setValidation(submitted);
    setAttempt((previous) => ({ ...previous, invalid: 0 }));
    setSubmission({ phase: "pending" });
    try {
      if (live) {
        const result = await createAccount(data);
        if (inFlight.current !== request || formRef.current !== form) return;
        if (result.verify) {
          resetForm();
          router.push("/verify-email");
          return;
        }
        const firstInvalid = fields.find((field) => result.issues?.[field]);
        if (firstInvalid) {
          flushSync(() => {
            setValidation({ ...submitted, issues: result.issues ?? {}, invalid: [firstInvalid] });
            setAttempt((previous) => ({ count: previous.count + 1, invalid: 1 }));
            setSubmission({ phase: "edit" });
          });
          form.querySelector<HTMLElement>(`#${firstInvalid}`)?.focus();
          return;
        }
        flushSync(() => setSubmission({ phase: "failure", message: result.error ?? "Try submitting again." }));
        form.querySelector<HTMLButtonElement>(".signup-primary")?.focus();
        return;
      }

      const result = await submitDemoSignup(submitted.operatorId);
      if (inFlight.current !== request || formRef.current !== form) return;
      flushSync(() => {
        setValidation(initialValidation());
        setVisible(hiddenPasswords);
        setSubmission({ phase: "success", result });
      });
      successHeading.current?.focus();
    } catch {
      if (inFlight.current !== request || formRef.current !== form) return;
      flushSync(() => setSubmission({
        phase: "failure", message: "The handshake failed. Your entries are still here. Try again.",
      }));
      form.querySelector<HTMLButtonElement>(".signup-primary")?.focus();
    } finally {
      if (inFlight.current === request) inFlight.current = null;
    }
  }

  function resetForm() {
    // The App Router can retain a hidden page on navigation. Clear it before leaving.
    inFlight.current = null;
    formRef.current?.reset();
    setValidation(initialValidation());
    setVisible(hiddenPasswords);
    setTouched({});
    setAttempt({ count: 0, invalid: 0 });
    setSubmission({ phase: "edit" });
  }

  function restart() {
    flushSync(resetForm);
    formRef.current?.querySelector<HTMLInputElement>("#callsign")?.focus();
  }

  return (
    <>
      <header className="signup-brand">
        <Image className="signup-logo" src="/neoncore/logo.svg" alt="NEONCORE" width={169} height={32} />
        <div className="signup-intro">
          <h1><span aria-hidden="true">{"// "}</span>Join the Nexus</h1>
          <p>Initialize your NEONCORE identity</p>
        </div>
        <div className="signup-summary">
          <p className="signup-count" data-ready={success || readyCount === fields.length}>
            {success ? "Simulated" : `${readyCount}/${fields.length} ready`}
          </p>
          <dl className="signup-operator">
            <dt>Operator ID</dt>
            <dd data-assigned={Boolean(operatorId)}>{operatorId || "Unassigned"}</dd>
          </dl>
          <dl className="signup-checks">
            {fields.map((field) => {
              const error = exposedIssue(field);
              const valid = !validation.issues[field];
              return (
                <div key={field} data-error={!success && Boolean(error)} data-ready={success || valid}>
                  <dt>{fieldLabels[field]}</dt>
                  <dd>{success ? "Locked" : valid ? "OK" : error?.status ?? (field === "terms" ? "Required" : "Pending")}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      </header>

      <div className="signup-backdrop" aria-hidden="true" />

      <section className="signup-panel" data-success={success} aria-labelledby="signup-heading">
        <div className="sr-only" role="status">
          {pending ? "Transmitting…" : !success && attempt.invalid > 0 && (
            <span key={attempt.count}>
              {attempt.invalid === 1 ? "1 field needs attention." : `${attempt.invalid} fields need attention.`}
            </span>
          )}
        </div>
        {success ? (
          <div className="signup-success">
            <div className="signup-success-icon">
              <Image src="/neoncore/icon-hex-check.svg" alt="" width={78} height={72} />
            </div>
            <h2 id="signup-heading" ref={successHeading} tabIndex={-1} aria-describedby="signup-outcome">
              <span aria-hidden="true">{"// "}</span>Handshake complete
            </h2>
            <p id="signup-outcome">Sign-up simulated for {submission.result.callsign}. No account was created.</p>
            <Link className="signup-primary" href={signupDestinations.login} onNavigate={resetForm}>Continue to demo log in</Link>
            <button className="signup-link" type="button" onClick={restart}>Restart demo</button>
          </div>
        ) : (
          <form
            ref={formRef}
            aria-labelledby="signup-heading"
            aria-busy={pending}
            method="post"
            noValidate
            onChange={(event) => setValidation(validateSignup(new FormData(event.currentTarget)))}
            onBlur={trackBlur}
            onSubmit={submit}
          >
            {live && (
              <>
                <input type="hidden" name="terms-version" value={policyVersions.terms} />
                <input type="hidden" name="privacy-version" value={policyVersions.privacy} />
              </>
            )}
            <fieldset className="signup-form" disabled={pending || !hydrated} data-pending={pending}>
              <legend className="sr-only">Registration details</legend>
              <header className="signup-form-heading">
                <h2 id="signup-heading">New operator</h2>
                <p>All <span className="signup-note-full">fields </span>required</p>
              </header>

              <div className="signup-field">
                <label htmlFor="callsign">Callsign</label>
                <input
                  {...inputState("callsign", "callsign-hint")}
                  id="callsign" name="callsign" type="text" placeholder="e.g. Vortex_07"
                  autoComplete={live ? "nickname" : "username"} autoCapitalize="none" autoCorrect="off" spellCheck={false} required
                />
                <p id="callsign-hint">3–20 characters: letters, numbers, _ or -</p>
                <FieldError field="callsign" message={exposedIssue("callsign")?.message} />
              </div>

              <div className="signup-field">
                <label htmlFor="email">Email</label>
                <input
                  {...inputState("email")}
                  id="email" name="email" type="email" placeholder="you@example.com"
                  autoComplete={live ? "username" : "email"} spellCheck={false} required
                />
                <FieldError field="email" message={exposedIssue("email")?.message} />
              </div>

              {passwordFields.map(({ id, label }) => (
                <div className="signup-field" key={id}>
                  <label htmlFor={id}>{label}</label>
                  <div className="signup-password">
                    <input
                      {...inputState(id, id === "password" ? "password-hint" : undefined)}
                      id={id} name={id} type={visible[id] ? "text" : "password"}
                      autoComplete="new-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} required
                    />
                    <button
                      type="button" aria-label={`Show ${label.toLowerCase()}`} aria-pressed={visible[id]} aria-controls={id}
                      onClick={() => setVisible((current) => ({ ...current, [id]: !current[id] }))}
                    >
                      <Image src={visible[id] ? "/neoncore/icon-eye-off.svg" : "/neoncore/icon-eye.svg"} alt="" width={20} height={20} />
                    </button>
                  </div>
                  {id === "password" && (
                    <>
                      <div className="signup-strength" data-level={strength} aria-hidden="true">
                        {[1, 2, 3, 4].map((segment) => <span key={segment} data-lit={segment <= strength} />)}
                      </div>
                      <p id="password-hint">
                        <span className={strength ? "sr-only" : undefined}>At least 8 characters.</span>
                        {strength > 0 && ` Password strength: ${strengthLabels[strength]}`}
                      </p>
                    </>
                  )}
                  <FieldError field={id} message={exposedIssue(id)?.message} />
                </div>
              ))}

              <div className="signup-consent">
                <div className="signup-terms">
                  <input {...inputState("terms")} id="terms" type="checkbox" name="terms" aria-labelledby="terms-label" required />
                  <span id="terms-label">
                    <label htmlFor="terms">I accept the</label>{" "}
                    <Link className="signup-link" href={signupDestinations.terms} onNavigate={resetForm}>Terms</Link>{" and "}
                    <Link className="signup-link" href={signupDestinations.privacy} onNavigate={resetForm}>Privacy Policy</Link>.
                  </span>
                </div>
                <FieldError field="terms" message={exposedIssue("terms")?.message} />
              </div>

              <div className="signup-action">
                {submission.phase === "failure" && (
                  <p className="signup-error" role="alert">{submission.message}</p>
                )}
                <button className="signup-primary" type="submit" data-pending={pending} aria-describedby={live ? undefined : "signup-preview"}>
                  {pending ? "Transmitting_" : live ? "Create account" : "Simulate sign-up"}
                </button>
                <p>
                  {live ? "Already registered? " : <><span id="signup-preview">Use made-up details.</span>{" "}</>}
                  <Link className="signup-link" href={signupDestinations.login} onNavigate={resetForm}>{live ? "Log in" : "Demo log in"}</Link>
                </p>
              </div>
            </fieldset>
          </form>
        )}
      </section>
    </>
  );
}
