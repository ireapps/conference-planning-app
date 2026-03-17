import { SupabaseClient } from "@supabase/supabase-js";

export interface SyncResult {
  conference: string;
  synced: {
    rooms: number;
    categories: number;
    speakers: number;
    sessions: number;
  };
}

/**
 * Fetches data from Sessionize and upserts it into Supabase for a given
 * conference. Used by both the API route (cron/curl) and the in-app
 * Server Action (UI sync button).
 */
export async function syncConference(
  supabase: SupabaseClient,
  conferenceId: string
): Promise<SyncResult> {
  const { data: conference, error: confError } = await supabase
    .from("conferences")
    .select("id, name, sessionize_api_key")
    .eq("id", conferenceId)
    .single();

  if (confError || !conference) {
    throw new Error(`Conference not found: ${conferenceId}`);
  }
  if (!conference.sessionize_api_key) {
    throw new Error("This conference has no sessionize_api_key set.");
  }

  const apiUrl = `https://sessionize.com/api/v2/${conference.sessionize_api_key}/view/All`;
  const res = await fetch(apiUrl, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Sessionize returned ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const cid = conferenceId;

  // Rooms
  if (data.rooms?.length) {
    const { error } = await supabase.from("rooms").upsert(
      data.rooms.map((r: { id: number; name: string; sort: number }) => ({
        id: r.id, conference_id: cid, name: r.name, sort: r.sort,
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
          id: item.id, conference_id: cid, category_id: cat.id, name: item.name, sort: item.sort,
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
        id: s.id, conference_id: cid,
        first_name: s.firstName, last_name: s.lastName, full_name: s.fullName,
        bio: s.bio, tag_line: s.tagLine, profile_picture: s.profilePicture,
        links: s.links, question_answers: s.questionAnswers,
      })),
      { onConflict: "id,conference_id" }
    );
    if (error) throw new Error(`speakers: ${error.message}`);
  }

  // Sessions
  if (data.sessions?.length) {
    const { error } = await supabase.from("sessions").upsert(
      data.sessions.map((s: {
        id: string | number; title: string; description: string | null;
        startsAt: string | null; endsAt: string | null; roomId: number | null;
        status: string; isConfirmed: boolean; isPlenumSession: boolean;
        isServiceSession: boolean; liveUrl: string | null; recordingUrl: string | null;
        questionAnswers: unknown[];
      }) => ({
        id: s.id, conference_id: cid,
        title: s.title, description: s.description,
        starts_at: s.startsAt, ends_at: s.endsAt, room_id: s.roomId,
        status: s.status, is_confirmed: s.isConfirmed,
        is_plenum_session: s.isPlenumSession, is_service_session: s.isServiceSession,
        live_url: s.liveUrl, recording_url: s.recordingUrl,
        question_answers: s.questionAnswers,
      })),
      { onConflict: "id,conference_id" }
    );
    if (error) throw new Error(`sessions: ${error.message}`);

    // Session ↔ Speaker
    const sessionSpeakers = data.sessions.flatMap(
      (s: { id: string | number; speakers: string[] }) =>
        s.speakers.map((speakerId: string) => ({
          session_id: s.id, speaker_id: speakerId, conference_id: cid,
        }))
    );
    if (sessionSpeakers.length) {
      const { error: ssErr } = await supabase
        .from("session_speakers")
        .upsert(sessionSpeakers, { onConflict: "session_id,speaker_id,conference_id" });
      if (ssErr) throw new Error(`session_speakers: ${ssErr.message}`);
    }

    // Session ↔ Category item
    const sessionCategoryItems = data.sessions.flatMap(
      (s: { id: string | number; categoryItems: number[] }) =>
        s.categoryItems.map((itemId: number) => ({
          session_id: s.id, category_item_id: itemId, conference_id: cid,
        }))
    );
    if (sessionCategoryItems.length) {
      const { error: sciErr } = await supabase
        .from("session_category_items")
        .upsert(sessionCategoryItems, { onConflict: "session_id,category_item_id,conference_id" });
      if (sciErr) throw new Error(`session_category_items: ${sciErr.message}`);
    }
  }

  return {
    conference: conference.name,
    synced: {
      rooms: data.rooms?.length ?? 0,
      categories: data.categories?.length ?? 0,
      speakers: data.speakers?.length ?? 0,
      sessions: data.sessions?.length ?? 0,
    },
  };
}
