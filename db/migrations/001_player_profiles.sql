BEGIN;

CREATE TABLE IF NOT EXISTS public.player_profiles (
  user_id uuid PRIMARY KEY REFERENCES neon_auth."user" (id) ON DELETE CASCADE,
  callsign text NOT NULL CHECK (callsign ~ '^[A-Za-z0-9_-]{3,20}$'),
  accepted_at timestamptz NOT NULL,
  terms_version text NOT NULL,
  privacy_version text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS player_profiles_callsign_key
  ON public.player_profiles (lower(callsign));

COMMIT;
