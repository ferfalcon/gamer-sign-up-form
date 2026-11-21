import { neon } from "@neondatabase/serverless";

const headers = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is not configured");

    const sql = neon(databaseUrl, {
      fetchOptions: { signal: AbortSignal.timeout(10_000) },
    });
    const [row] = await sql`SELECT 1 AS ok`;
    if (row?.ok !== 1) throw new Error("Unexpected health check result");

    return Response.json({ status: "ok" }, { headers });
  } catch {
    // Do not expose driver errors or connection details to callers.
    return Response.json({ status: "unavailable" }, { status: 503, headers });
  }
}
