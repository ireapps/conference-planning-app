import { notFound } from "next/navigation";
import SpeakersTable, { SpeakerRow } from "@/components/ui/SpeakersTable";
import { getConference } from "@/lib/data/conferences";
import { getConferencePageData } from "@/lib/data/conference-page-data";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SpeakersPage({ params }: Props) {
  const { id } = await params;

  const [conference, { sessions, sessionSpeakers, speakers }] =
    await Promise.all([getConference(id), getConferencePageData(id)]);

  if (!conference) notFound();

  const sessionMap = new Map(sessions.map((s) => [String(s.id), s.title]));

  const sessionsBySpeaker = new Map<string, string[]>();
  for (const ss of sessionSpeakers) {
    const title = sessionMap.get(String(ss.session_id));
    if (!title) continue;
    sessionsBySpeaker.set(ss.speaker_id, [
      ...(sessionsBySpeaker.get(ss.speaker_id) ?? []),
      title,
    ]);
  }

  const eventId = conference.sessionize_event_id;

  const rows: SpeakerRow[] = speakers.map((s) => ({
    id: s.id,
    full_name: s.full_name,
    tag_line: s.tag_line,
    profile_picture: s.profile_picture,
    session_titles: sessionsBySpeaker.get(s.id) ?? [],
    href: eventId
      ? `https://sessionize.com/app/organizer/speaker/${eventId}/${s.id}`
      : null,
  }));

  return <SpeakersTable rows={rows} />;
}
