import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

function sessionizeSessionUrl(eventId: string, sessionId: number) {
  return `https://sessionize.com/app/organizer/session/${eventId}/${sessionId}`;
}

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default async function SessionsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: conference } = await supabase
    .from("conferences")
    .select("id, sessionize_event_id")
    .eq("id", id)
    .single();

  if (!conference) notFound();

  // Fetch all non-service sessions, ordered by start time then title.
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, description, starts_at, ends_at, status, is_confirmed, room_id")
    .eq("conference_id", id)
    .eq("is_service_session", false)
    .order("starts_at", { ascending: true, nullsFirst: false })
    .order("title", { ascending: true });

  // Fetch supporting data to denormalize for display.
  const [{ data: rooms }, { data: sessionSpeakers }, { data: speakers }] =
    await Promise.all([
      supabase.from("rooms").select("id, name").eq("conference_id", id),
      supabase
        .from("session_speakers")
        .select("session_id, speaker_id")
        .eq("conference_id", id),
      supabase
        .from("speakers")
        .select("id, full_name")
        .eq("conference_id", id),
    ]);

  const roomMap = new Map((rooms ?? []).map((r) => [r.id, r.name]));
  const speakerMap = new Map((speakers ?? []).map((s) => [s.id, s.full_name]));

  const speakersBySession = new Map<number, string[]>();
  for (const ss of sessionSpeakers ?? []) {
    const name = speakerMap.get(ss.speaker_id);
    if (!name) continue;
    const existing = speakersBySession.get(ss.session_id) ?? [];
    speakersBySession.set(ss.session_id, [...existing, name]);
  }

  const eventId = conference.sessionize_event_id;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {sessions?.length ?? 0} session{sessions?.length !== 1 ? "s" : ""}
        </p>
      </div>

      {!sessions?.length ? (
        <p className="mt-6 text-sm text-gray-500">
          No sessions yet — run the Sessionize sync to populate data.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Speaker(s)</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Starts</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((session) => {
                const sessionSpeakerNames = speakersBySession.get(session.id) ?? [];
                const roomName = session.room_id ? roomMap.get(session.room_id) : null;
                const href = eventId
                  ? sessionizeSessionUrl(eventId, session.id)
                  : null;

                return (
                  <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                    <td className="max-w-sm px-4 py-3">
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-indigo-700 hover:underline"
                        >
                          {session.title}
                        </a>
                      ) : (
                        <span className="font-medium text-gray-900">{session.title}</span>
                      )}
                      {session.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
                          {session.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {sessionSpeakerNames.length
                        ? sessionSpeakerNames.join(", ")
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {roomName ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {formatTime(session.starts_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge confirmed={session.is_confirmed} status={session.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  confirmed,
  status,
}: {
  confirmed: boolean;
  status: string | null;
}) {
  if (confirmed) {
    return (
      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
        Confirmed
      </span>
    );
  }
  if (status) {
    return (
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        {status}
      </span>
    );
  }
  return <span className="text-gray-300 text-xs">—</span>;
}
