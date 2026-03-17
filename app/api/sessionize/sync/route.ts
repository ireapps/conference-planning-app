// POST /api/sessionize/sync
// Fetches fresh data from Sessionize for a specific conference and upserts
// everything into Supabase. Protected by a shared secret (SYNC_SECRET).
//
// Body: { "conferenceId": "<uuid>" }
//
// Can be triggered manually, from a GitHub Actions cron, or a Vercel cron job.

import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();

  // Look up the conference to get its Sessionize API key.
  const { data: conference, error: confError } = await supabase
    .from("conferences")
    .select("id, name, sessionize_api_key")
    .eq("id", conferenceId)
    .single();

  if (confError || !conference) {
    return NextResponse.json(
      { error: `Conference not found: ${conferenceId}` },
      { status: 404 }
    );
  }

  if (!conference.sessionize_api_key) {
    return NextResponse.json(
      { error: "This conference has no sessionize_api_key set." },
      { status: 422 }
    );
  }

  const apiUrl = `https://sessionize.com/api/v2/${conference.sessionize_api_key}/view/All`;

  let data;
  try {
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Sessionize returned ${res.status} ${res.statusText}`);
    }
    data = await res.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to fetch from Sessionize: ${message}` },
      { status: 502 }
    );
  }

  const cid = conferenceId; // shorthand

  try {
    // Rooms
    if (data.rooms?.length) {
      const { error } = await supabase.from("rooms").upsert(
        data.rooms.map((r: { id: number; name: string; sort: number }) => ({
          id: r.id,
          conference_id: cid,
          name: r.name,
          sort: r.sort,
        })),
        { onConflict: "id,conference_id" }
      );
      if (error) throw new Error(`rooms: ${error.message}`);
    }

    // Categories + items
    for (const cat of data.categories ?? []) {
      const { error: catErr } = await supabase.from("categories").upsert(
        { id: cat.id, conference_id: cid, title: cat.title, type: cat.type, sort: cat.sort },
        { onConflict: "id,conference_id" }
      );
      if (catErr) throw new Error(`categories: ${catErr.message}`);

      if (cat.items?.length) {
        const { error: itemErr } = await supabase.from("category_items").upsert(
          cat.items.map((item: { id: number; name: string; sort: number }) => ({
            id: item.id,
            conference_id: cid,
            category_id: cat.id,
            name: item.name,
            sort: item.sort,
          })),
          { onConflict: "id,conference_id" }
        );
        if (itemErr) throw new Error(`category_items: ${itemErr.message}`);
      }
    }

    // Speakers
    if (data.speakers?.length) {
      const { error } = await supabase.from("speakers").upsert(
        data.speakers.map((s: {
          id: string; firstName: string; lastName: string; fullName: string;
          bio: string | null; tagLine: string | null; profilePicture: string | null;
          links: unknown[]; questionAnswers: unknown[];
        }) => ({
          id: s.id,
          conference_id: cid,
          first_name: s.firstName,
          last_name: s.lastName,
          full_name: s.fullName,
          bio: s.bio,
          tag_line: s.tagLine,
          profile_picture: s.profilePicture,
          links: s.links,
          question_answers: s.questionAnswers,
        })),
        { onConflict: "id,conference_id" }
      );
      if (error) throw new Error(`speakers: ${error.message}`);
    }

    // Sessions
    if (data.sessions?.length) {
      const { error } = await supabase.from("sessions").upsert(
        data.sessions.map((s: {
          id: number; title: string; description: string | null;
          startsAt: string | null; endsAt: string | null; roomId: number | null;
          status: string; isConfirmed: boolean; isPlenumSession: boolean;
          isServiceSession: boolean; liveUrl: string | null; recordingUrl: string | null;
          questionAnswers: unknown[];
        }) => ({
          id: s.id,
          conference_id: cid,
          title: s.title,
          description: s.description,
          starts_at: s.startsAt,
          ends_at: s.endsAt,
          room_id: s.roomId,
          status: s.status,
          is_confirmed: s.isConfirmed,
          is_plenum_session: s.isPlenumSession,
          is_service_session: s.isServiceSession,
          live_url: s.liveUrl,
          recording_url: s.recordingUrl,
          question_answers: s.questionAnswers,
        })),
        { onConflict: "id,conference_id" }
      );
      if (error) throw new Error(`sessions: ${error.message}`);

      // Session ↔ Speaker
      const sessionSpeakers = data.sessions.flatMap((s: { id: number; speakers: string[] }) =>
        s.speakers.map((speakerId: string) => ({
          session_id: s.id,
          speaker_id: speakerId,
          conference_id: cid,
        }))
      );
      if (sessionSpeakers.length) {
        const { error: ssErr } = await supabase
          .from("session_speakers")
          .upsert(sessionSpeakers, { onConflict: "session_id,speaker_id,conference_id" });
        if (ssErr) throw new Error(`session_speakers: ${ssErr.message}`);
      }

      // Session ↔ Category item
      const sessionCategoryItems = data.sessions.flatMap((s: { id: number; categoryItems: number[] }) =>
        s.categoryItems.map((itemId: number) => ({
          session_id: s.id,
          category_item_id: itemId,
          conference_id: cid,
        }))
      );
      if (sessionCategoryItems.length) {
        const { error: sciErr } = await supabase
          .from("session_category_items")
          .upsert(sessionCategoryItems, {
            onConflict: "session_id,category_item_id,conference_id",
          });
        if (sciErr) throw new Error(`session_category_items: ${sciErr.message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      conference: conference.name,
      synced: {
        rooms: data.rooms?.length ?? 0,
        categories: data.categories?.length ?? 0,
        speakers: data.speakers?.length ?? 0,
        sessions: data.sessions?.length ?? 0,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sessionize/sync]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
