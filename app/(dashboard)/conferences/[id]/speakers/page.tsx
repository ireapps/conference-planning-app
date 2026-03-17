import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";

interface Props {
  params: Promise<{ id: string }>;
}

function sessionizeSpeakerUrl(eventId: string, speakerId: string) {
  return `https://sessionize.com/app/organizer/speaker/${eventId}/${speakerId}`;
}

export default async function SpeakersPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: conference } = await supabase
    .from("conferences")
    .select("id, sessionize_event_id")
    .eq("id", id)
    .single();

  if (!conference) notFound();

  // Fetch speakers, sorted by last name.
  const { data: speakers } = await supabase
    .from("speakers")
    .select("id, full_name, first_name, last_name, tag_line, profile_picture")
    .eq("conference_id", id)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  // Fetch session titles for each speaker.
  const [{ data: sessionSpeakers }, { data: sessions }] = await Promise.all([
    supabase
      .from("session_speakers")
      .select("session_id, speaker_id")
      .eq("conference_id", id),
    supabase
      .from("sessions")
      .select("id, title")
      .eq("conference_id", id)
      .eq("is_service_session", false),
  ]);

  const sessionMap = new Map((sessions ?? []).map((s) => [s.id, s.title]));

  const sessionsBySpeaker = new Map<string, string[]>();
  for (const ss of sessionSpeakers ?? []) {
    const title = sessionMap.get(ss.session_id);
    if (!title) continue;
    const existing = sessionsBySpeaker.get(ss.speaker_id) ?? [];
    sessionsBySpeaker.set(ss.speaker_id, [...existing, title]);
  }

  const eventId = conference.sessionize_event_id;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {speakers?.length ?? 0} speaker{speakers?.length !== 1 ? "s" : ""}
        </p>
      </div>

      {!speakers?.length ? (
        <p className="mt-6 text-sm text-gray-500">
          No speakers yet — run the Sessionize sync to populate data.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Speaker</th>
                <th className="px-4 py-3">Tag line</th>
                <th className="px-4 py-3">Session(s)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {speakers.map((speaker) => {
                const speakerSessions = sessionsBySpeaker.get(speaker.id) ?? [];
                const href = eventId
                  ? sessionizeSpeakerUrl(eventId, speaker.id)
                  : null;

                return (
                  <tr key={speaker.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={speaker.profile_picture}
                          name={speaker.full_name ?? ""}
                        />
                        <div>
                          {href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-indigo-700 hover:underline"
                            >
                              {speaker.full_name}
                            </a>
                          ) : (
                            <span className="font-medium text-gray-900">
                              {speaker.full_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-gray-600">
                      {speaker.tag_line ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {speakerSessions.length ? (
                        <ul className="space-y-0.5">
                          {speakerSessions.map((title) => (
                            <li key={title} className="line-clamp-1">
                              {title}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
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

function Avatar({ src, name }: { src: string | null; name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={32}
        height={32}
        className="h-8 w-8 rounded-full object-cover bg-gray-100"
        unoptimized // profile pictures are external URLs
      />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
      {initials}
    </div>
  );
}
