// POST /api/sessionize/sync
// Fetches fresh data from Sessionize for a specific conference and upserts
// everything into Supabase. Protected by SYNC_SECRET for use by cron jobs
// and curl. In-app users should use the sync button in the dashboard instead.
//
// Body: { "conferenceId": "<uuid>" }

import { createClient } from "@/lib/supabase/server";
import { syncConference } from "@/lib/sessionize/sync";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.SYNC_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let conferenceId: string;
  try {
    const body = await request.json();
    conferenceId = body.conferenceId;
    if (!conferenceId) throw new Error("missing conferenceId");
  } catch {
    return NextResponse.json(
      { error: "Request body must be JSON with a conferenceId field." },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const result = await syncConference(supabase, conferenceId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sessionize/sync]", message);
    const status = message.includes("not found") ? 404
                 : message.includes("no sessionize_api_key") ? 422
                 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
