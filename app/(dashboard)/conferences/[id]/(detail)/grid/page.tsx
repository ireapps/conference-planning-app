import { notFound } from "next/navigation";
import ScheduleGrid, { GridSession, GridRoom } from "@/components/ui/ScheduleGrid";
import { getConference } from "@/lib/data/conferences";
import { getConferencePageData } from "@/lib/data/conference-page-data";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GridPage({ params }: Props) {
  const { id } = await params;

  const [conference, { sessions, rooms, sessionSpeakers, speakers }] =
    await Promise.all([getConference(id), getConferencePageData(id)]);

  if (!conference) notFound();

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

  const gridSessions: GridSession[] = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    room_id: s.room_id ?? null,
    starts_at: s.starts_at,
    is_confirmed: s.is_confirmed,
    status: s.status,
    speaker_names: speakersBySession.get(String(s.id)) ?? [],
    href: eventId
      ? `https://sessionize.com/app/organizer/session/${eventId}/${s.id}`
      : null,
  }));

  const gridRooms: GridRoom[] = rooms.map((r) => ({
    id: r.id,
    name: r.name,
  }));

  return <ScheduleGrid rooms={gridRooms} sessions={gridSessions} />;
}
