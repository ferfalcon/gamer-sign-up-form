# Gamer sign-up form

NEONCORE sign-up preview built with the Next.js App Router. The responsive sign-up preview is available at `/`. [Figma WIP](https://www.figma.com/design/45xWfb2GJsOCfNp19eHClJ/gamer-sign-up-form?node-id=477-1812)

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The preview runs without database configuration.

## Implemented

- The home route uses one stage and panel across mobile, tablet (640px and up), and desktop (1280px and up). The required-fields note switches independently at 600px. The root layout loads the bundled Orbitron and JetBrains Mono fonts. [Home page](app/page.tsx) · [Root layout](app/layout.tsx) · [Styles](app/globals.css)
- The form and brand readout share validation for all five checks. Errors appear on blur or submit, the Operator ID appears only for a valid callsign, and the password strength meter is advisory. [Sign-up form](app/signup-form.tsx) · [Validation](app/signup-validation.ts)
- The [local submit adapter](app/signup-demo.ts) simulates a handshake in the browser. It receives only the validated callsign; form entries are not sent or persisted. Pending locks the form, failure allows retry, and success discards the form and retains only the callsign until you leave or restart.
- The demo links to [Terms](/terms), [Privacy Policy](/privacy), and [Demo log in](/login). Both login links go to the same informational page. These destinations describe the demo, not an account service. Real sign-in, account creation and approved production policies are not wired.

Try the flow using `NeonRaider_99`, `operator@example.com`, and `Synthetic123!` in both password fields. These are synthetic test values; don't use real credentials.

## Checks

```bash
pnpm lint
pnpm build
```

Verified the Empty layout in Chromium at 320, 375, 768 and 1440px, on both sides of all three breakpoints, and in a short landscape viewport. The 320px browser flow was checked for blur and submit errors, the terms-only error, independent reveal controls, confirmation revalidation, pending, duplicate-submit prevention, recovery from an injected failure, and success focus and reset. Production browser checks confirmed the demo destinations and found no form values in captured requests or browser storage. Full Figma fixture comparison and manual screen-reader testing remain open.

## Neon Postgres

The existing database health route uses the pooled Neon `DATABASE_URL` on the server. For a local connectivity check, set that variable in `.env.local`, keep the credentials out of version control, and start the development server.

```sh
curl --fail-with-body -i http://localhost:3000/api/health/db
```

The endpoint runs a read-only `SELECT 1`. It returns HTTP 200 with `{"status":"ok"}` when the database responds and HTTP 503 when it is unavailable. [Health route](app/api/health/db/route.ts)
