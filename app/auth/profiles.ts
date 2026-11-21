import "server-only";
import { NeonDbError, neon } from "@neondatabase/serverless";
import type { ProfileAcceptance } from "./signup-draft";

function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url, { fetchOptions: { signal: AbortSignal.timeout(10_000) } });
}

export async function findProfile(userId: string) {
  const sql = database();
  const [row] = await sql`
    SELECT callsign FROM public.player_profiles WHERE user_id = ${userId}
  `;
  return row ? { callsign: row.callsign as string } : null;
}

export async function saveProfile(userId: string, acceptance: ProfileAcceptance) {
  try {
    const sql = database();
    await sql`
      INSERT INTO public.player_profiles (user_id, callsign, accepted_at, terms_version, privacy_version)
      VALUES (${userId}, ${acceptance.callsign}, ${acceptance.acceptedAt}, ${acceptance.termsVersion}, ${acceptance.privacyVersion})
      ON CONFLICT (user_id) DO NOTHING
    `;
    return "saved";
  } catch (error) {
    if (error instanceof NeonDbError && error.code === "23505" && error.constraint === "player_profiles_callsign_key") {
      return "callsign-taken";
    }
    return "unavailable";
  }
}
