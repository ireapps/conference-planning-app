import { cacheTag, cacheLife } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";

/**
 * Cache tag for all session/speaker/room data belonging to one conference.
 * Call revalidateTag(conferenceDataTag(id), "default") to bust on sync/delete.
 */
export const conferenceDataTag = (id: string) => `conference-data:${id}`;

/**
 * Fetch the full set of page data for a conference and cache it server-side
 * using Next.js 16's "use cache" directive.
 *
 * All three tab pages (sessions, speakers, grid) call this function.
 * The first call executes the Supabase queries; every subsequent call
 * within the cache lifetime returns the stored result with zero DB hits.
 *
 * Uses the plain anon client (no cookies) because:
 *  - "use cache" functions run outside the request lifecycle
 *  - RLS is disabled for this app; auth is enforced at the middleware level
 *
 * Column selection is the superset of what all three pages need, so a single
 * cached payload covers every tab.
 */
export async function getConferencePageData(conferenceId: string) {
  "use cache";
  cacheTag(conferenceDataTag(conferenceId));
  cacheLife("hours");

  const supabase = createAnonClient();

  const [
    { data: sessions },
    { data: rooms },
    { data: sessionSpeakers },
    { data: speakers },
  ] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, title, description, starts_at, status, is_confirmed, room_id")
      .eq("conference_id", conferenceId)
      .eq("is_service_session", false)
      .order("starts_at", { ascending: true, nullsFirst: false })
      .order("title", { ascending: true }),
    supabase
      .from("rooms")
      .select("id, name")
      .eq("conference_id", conferenceId),
    supabase
      .from("session_speakers")
      .select("session_id, speaker_id")
      .eq("conference_id", conferenceId),
    supabase
      .from("speakers")
      .select("id, full_name, tag_line, profile_picture")
      .eq("conference_id", conferenceId)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true }),
  ]);

  return {
    sessions: sessions ?? [],
    rooms: rooms ?? [],
    sessionSpeakers: sessionSpeakers ?? [],
    speakers: speakers ?? [],
  };
}
