import { notFound } from "next/navigation";
import SessionsTable, { SessionRow } from "@/components/ui/SessionsTable";
import { getConference } from "@/lib/data/conferences";
import { getConferencePageData } from "@/lib/data/conference-page-data";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SessionsPage({ params }: Props) {
  const { id } = await params;

  const [conference, { sessions, rooms, sessionSpeakers, speakers }] =
    await Promise.all([getConference(id), getConferencePageData(id)]);

  if (!conference) notFound();

  const roomMap = new Map(rooms.map((r) => [r.id, r.name]));
  const speakerMap = new Map(speakers.map((s) => [s.id, s.full_name]));

  const speakersBySession = new Map<string, string[]>();
  for (const ss of sessionSpeakers) {
    const name = speakerMap.get(ss.speaker_id);
    if (!name) continue;
    speakersBySession.set(ss.session_id, [
      ...(speakersBySession.get(ss.session_id) ?? []),
      name,
    ]);
  }

  const eventId = conference.sessionize_event_id;

  const rows: SessionRow[] = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    starts_at: s.starts_at,
    room_name: s.room_id ? (roomMap.get(s.room_id) ?? null) : null,
    speaker_names: speakersBySession.get(s.id) ?? [],
    is_confirmed: s.is_confirmed,
    status: s.status,
    href: eventId
      ? `https://sessionize.com/app/organizer/session/${eventId}/${s.id}`
      : null,
  }));

  return <SessionsTable rows={rows} />;
}
