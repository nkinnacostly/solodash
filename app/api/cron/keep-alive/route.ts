import { createPublicClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { errorMessage } from "@/lib/log-redact";

/**
 * Keep-alive ping for the Supabase project.
 *
 * Supabase pauses Free-plan projects after 7 days with no database/API
 * activity. Any real query resets that clock, so this runs the cheapest
 * possible one — an exact-count HEAD request that transfers no rows.
 *
 * Guarded by CRON_SECRET because createPublicClient() is the service role.
 * Vercel Cron attaches `Authorization: Bearer $CRON_SECRET` automatically
 * once CRON_SECRET is set as a project env var.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = createPublicClient();
  const startedAt = Date.now();

  try {
    const { error } = await adminSupabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (error) throw error;

    return NextResponse.json(
      {
        ok: true,
        latencyMs: Date.now() - startedAt,
        checkedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error: unknown) {
    // Fail loudly in logs so a paused/unreachable project is visible.
    console.error("[cron/keep-alive] Supabase unreachable:", errorMessage(error));
    return NextResponse.json(
      { ok: false, error: "Supabase unreachable" },
      { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
