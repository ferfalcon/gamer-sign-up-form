# Gamer sign-up form

NEONCORE sign-up preview built with the Next.js App Router. The current milestone is the route foundation at `/`. [Figma WIP](https://www.figma.com/design/45xWfb2GJsOCfNp19eHClJ/gamer-sign-up-form?node-id=477-1812)

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The preview runs without database configuration.

## Implemented

- The home route renders the NEONCORE heading and a single-column form shell. The root layout sets the page metadata and loads the bundled Orbitron and JetBrains Mono fonts. [Home page](app/page.tsx) · [Root layout](app/layout.tsx) · [Styles](app/globals.css)
- One Client Component handles callsign, email, password, confirmation and the terms checkbox. It displays a trimmed callsign as the Operator ID, shows how many of the five controls are filled or checked, and lets users reveal each password independently. The preview disables account submission. [Sign-up form](app/signup-form.tsx)
- The logo, visibility icons, favicon and font licenses are bundled with the app. [Brand assets](public/neoncore/) · [App icon](app/icon.png) · [Fonts](app/fonts/)

The remaining milestones cover the responsive Figma layouts, validation and password strength, submission and success states, and login and policy destinations. Account mode is still open, with a local demo and managed authentication as the two paths.

## Checks

```bash
pnpm lint
pnpm exec tsc --noEmit
```

Both checks passed for the route foundation. The compiled Turbopack route also returned HTTP 200 and completed Instant Navigation validation in local request simulations for an initial load, client navigation and hot refresh. Browser interaction and production build verification are pending.

## Neon Postgres

The existing database health route uses the pooled Neon `DATABASE_URL` on the server. For a local connectivity check, set that variable in `.env.local`, keep the credentials out of version control, and start the development server.

```sh
curl --fail-with-body -i http://localhost:3000/api/health/db
```

The endpoint runs a read-only `SELECT 1`. It returns HTTP 200 with `{"status":"ok"}` when the database responds and HTTP 503 when it is unavailable. [Health route](app/api/health/db/route.ts)
