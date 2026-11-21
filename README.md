# Gamer sign-up form

NEONCORE signup and login built with the Next.js App Router. [Live app](https://gamer-sign-up-form-ferfalcon.vercel.app/) · [Figma WIP](https://www.figma.com/design/45xWfb2GJsOCfNp19eHClJ/gamer-sign-up-form?node-id=477-1812)

## Run locally

```sh
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The signup form runs in demo mode when account configuration is absent. With the variables below configured, it creates real accounts on the selected Neon branch. Use a test email address you control for the connected flow.

## Connect Neon Auth and Postgres

1. Use an isolated Neon branch for development. This project has a `dev-auth` branch with Auth and the profile migration configured.
2. Enable email and password signup, require email verification using codes, send a verification code on signup, enable automatic sign-in after verification, and revoke existing sessions on password reset.
3. Set these server-only variables in `.env.development.local`. The Auth endpoint and both database connections must point to the same branch and database.
   - `DATABASE_URL` is the pooled database connection the app uses at runtime.
   - `DATABASE_URL_UNPOOLED` is the direct database connection for migrations.
   - `NEON_AUTH_BASE_URL` is the branch’s Auth URL, including its database and `/auth` path.
   - `NEON_AUTH_COOKIE_SECRET` signs the temporary signup cookie. Generate a secret with `openssl rand -base64 32`.
4. On a new branch, apply [the profile migration](db/migrations/001_player_profiles.sql) after enabling Neon Auth. With the direct URL loaded into your shell, run:

```sh
psql "$DATABASE_URL_UNPOOLED" -v ON_ERROR_STOP=1 -f db/migrations/001_player_profiles.sql
```

## Account flow

- `/` validates signup, then `/verify-email` accepts the emailed code and saves the profile after verification. The signed signup cookie expires after 30 minutes.
- `/login` accepts email and password. If the email is unverified, the verification page prefills it and offers to request a code. `/account` displays the saved callsign and offers sign-out.
- `/complete-profile` lets a verified user finish an interrupted signup, retry a failed save, or choose a different callsign.
- `/reset-password` uses a one-time code sent to the account’s email address.

## Data and sessions

- Next.js Server Actions call Neon’s managed REST API for account creation, verification, and login. Neon Auth owns email addresses, password hashes, and session records. Next.js stores the session token in an HTTP-only cookie and checks it with Neon Auth before reading or writing account data. [Auth actions](app/auth/actions.ts) · [Neon Auth client](app/auth/neon-auth.ts) · [Neon authentication flow](https://neon.com/docs/auth/authentication-flow)
- A signed, HTTP-only signup cookie carries the callsign and policy acceptance through email verification. The app matches it to the verified session’s email before saving the profile. If the cookie expires, a verified user can finish signup from `/complete-profile`. A separate signed, HTTP-only cookie carries the email and code-request status to verification for up to 30 minutes without putting the email in the URL. [Signup and verification cookies](app/auth/signup-draft.ts)
- Postgres stores one `player_profiles` row per Neon Auth user ID. The row includes the callsign, acceptance timestamp, and the versions of the Terms and Privacy Policy. Callsigns preserve display casing and are unique regardless of case. Retries preserve the profile and acceptance already recorded for the user. [Profile queries](app/auth/profiles.ts) · [Migration](db/migrations/001_player_profiles.sql)

## Vercel deployments

- Production builds from `main` and uses the Neon `production` branch. Email/password signup requires an emailed verification code. Neon trusts the public Vercel origin, and localhost access is disabled on that branch. [Production app](https://gamer-sign-up-form-ferfalcon.vercel.app/)
- The protected `auth-preview` deployment uses the Neon `dev-auth` branch and branch-scoped Vercel Preview variables. [Protected preview](https://gamer-sign-up-form-git-auth-preview-fer-falcons-team.vercel.app/)
- Vercel’s Production environment and Preview deployments from `auth-preview` each use `DATABASE_URL`, `NEON_AUTH_BASE_URL`, and `NEON_AUTH_COOKIE_SECRET`. Vercel needs these variables at build time for account mode, so redeploy after changing them. Use `DATABASE_URL_UNPOOLED` when applying migrations.
- Production sends verification and reset codes through Neon Auth’s Custom SMTP provider at `smtp.gmail.com` on port `465`. Store the Google app password directly in Neon. After changing the sender or rotating the password, use **Send test email** on the production branch. [Neon SMTP settings](https://neon.com/docs/auth/production-checklist#email-provider)

The public app links to its [Terms of Use](app/terms/page.tsx) and [Privacy Policy](app/privacy/page.tsx). Both are currently `v1`. Update the corresponding [policy version](app/auth/policy-versions.ts) when either document changes.

## Checks

```sh
pnpm lint
pnpm build
curl --fail-with-body -i http://localhost:3000/api/health/db
```

The health endpoint checks connectivity with `SELECT 1` and returns HTTP 200 when the database responds.

- Lint and production builds passed in demo and account modes. Mocked account checks covered validation, verification, profile save retries, account isolation, password reset, and sign-out. The `dev-auth` database enforced case-insensitive callsign uniqueness and preserved the existing profile on retry.
- The production Gmail SMTP test succeeded. The live signup, login, and verification pages loaded, the database health check returned HTTP 200, and the signed-out `/account` route redirected to `/login`.
- A full browser test with a real verification code is still pending. Complete signup, reload `/account`, sign out, and log back in to check that the same callsign appears. Use a second test account to check callsign conflicts and account isolation. Reset a password and verify that the new password works and prior sessions end.
