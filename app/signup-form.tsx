"use client";

import Image from "next/image";
import { useState } from "react";

const passwordFields = [
  { id: "password", label: "Password", hint: "At least 8 characters" },
  { id: "confirm-password", label: "Confirm password", hint: null },
] as const;

export default function SignupForm() {
  const [callsign, setCallsign] = useState("");
  const [filled, setFilled] = useState({
    email: false,
    password: false,
    "confirm-password": false,
    terms: false,
  });
  const [visible, setVisible] = useState({
    password: false,
    "confirm-password": false,
  });

  const operatorId = callsign.trim();
  const filledCount =
    Number(Boolean(operatorId)) + Object.values(filled).filter(Boolean).length;

  function markFilled(field: keyof typeof filled, hasValue: boolean) {
    setFilled((current) => ({ ...current, [field]: hasValue }));
  }

  return (
    <>
      <dl className="signup-readout">
        <dt>Operator ID</dt>
        <dd className="signup-operator">{operatorId || "Unassigned"}</dd>
        <dt className="sr-only">Form completion</dt>
        <dd>{filledCount}/5 filled</dd>
      </dl>

      <form
        className="signup-form"
        aria-labelledby="signup-heading"
        method="post"
        onSubmit={(event) => event.preventDefault()}
      >
        <header className="signup-form-heading">
          <h2 id="signup-heading">New operator</h2>
          <p>All fields required</p>
        </header>

        <div className="signup-field">
          <label htmlFor="callsign">Callsign</label>
          <input
            id="callsign"
            name="callsign"
            type="text"
            placeholder="e.g. Vortex_07"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby="callsign-hint"
            onChange={(event) => setCallsign(event.currentTarget.value)}
            required
          />
          <p id="callsign-hint">3–20 characters: letters, numbers, _ or -</p>
        </div>

        <div className="signup-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            spellCheck={false}
            onChange={(event) =>
              markFilled("email", Boolean(event.currentTarget.value))
            }
            required
          />
        </div>

        {passwordFields.map(({ id, label, hint }) => {
          const hintId = hint ? `${id}-hint` : undefined;

          return (
            <div className="signup-field" key={id}>
              <label htmlFor={id}>{label}</label>
              <div className="signup-password">
                <input
                  id={id}
                  name={id}
                  type={visible[id] ? "text" : "password"}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-describedby={hintId}
                  onChange={(event) =>
                    markFilled(id, Boolean(event.currentTarget.value))
                  }
                  required
                />
                <button
                  type="button"
                  aria-label={`Show ${label.toLowerCase()}`}
                  aria-pressed={visible[id]}
                  aria-controls={id}
                  onClick={() =>
                    setVisible((current) => ({ ...current, [id]: !current[id] }))
                  }
                >
                  <Image
                    src={
                      visible[id]
                        ? "/neoncore/icon-eye-off.svg"
                        : "/neoncore/icon-eye.svg"
                    }
                    alt=""
                    width={20}
                    height={20}
                  />
                </button>
              </div>
              {hint && <p id={hintId}>{hint}</p>}
            </div>
          );
        })}

        <label className="signup-terms">
          <input
            type="checkbox"
            name="terms"
            onChange={(event) => markFilled("terms", event.currentTarget.checked)}
            required
          />
          <span>I accept the Terms and Privacy Policy.</span>
        </label>

        <div className="signup-action">
          <button type="submit" disabled aria-describedby="signup-availability">
            Initialize account
          </button>
          <p id="signup-availability">Account creation is unavailable in this preview.</p>
        </div>
      </form>
    </>
  );
}
