"use client";

import { useState } from "react";

export interface GridSession {
  id: string | number;
  title: string;
  room_id: string | null;
  starts_at: string | null;
  is_confirmed: boolean;
  status: string | null;
  speaker_names: string[];
  href: string | null;
}

export interface GridRoom {
  id: string;
  name: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// en-CA gives YYYY-MM-DD, which avoids timezone boundary edge cases
function toDateKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA");
}

function formatDayLabel(dateKey: string) {
  return new Date(dateKey + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function SessionCell({ session }: { session: GridSession }) {
  return (
    <div className="min-w-0">
      {session.href ? (
        <a
          href={session.href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-indigo-700 hover:underline"
        >
          {session.title}
        </a>
      ) : (
        <span className="font-medium text-gray-900">{session.title}</span>
      )}
      {session.speaker_names.length > 0 && (
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
          {session.speaker_names.join(", ")}
        </p>
      )}
      {session.is_confirmed ? (
        <span className="mt-1 inline-block rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">
          Confirmed
        </span>
      ) : session.status ? (
        <span className="mt-1 inline-block rounded-full bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-700">
          {session.status}
        </span>
      ) : null}
    </div>
  );
}

export default function ScheduleGrid({
  rooms,
  sessions,
}: {
  rooms: GridRoom[];
  sessions: GridSession[];
}) {
  // Only sessions that are placed (have both starts_at and room_id)
  const placed = sessions.filter((s) => s.starts_at && s.room_id);

  // Group by day
  const dayMap = new Map<string, GridSession[]>();
  for (const s of placed) {
    const day = toDateKey(s.starts_at!);
    if (!dayMap.has(day)) dayMap.set(day, []);
    dayMap.get(day)!.push(s);
  }
  const days = Array.from(dayMap.keys()).sort();

  const [selectedDay, setSelectedDay] = useState(days[0] ?? "");

  if (days.length === 0) {
    return (
      <p className="mt-6 text-sm text-gray-700">
        No scheduled sessions yet — run the Sessionize sync to populate data.
      </p>
    );
  }

  const daySessions = dayMap.get(selectedDay) ?? [];

  // Unique slots for this day, sorted chronologically
  const slots = Array.from(new Set(daySessions.map((s) => s.starts_at!))).sort();

  // Lookup: starts_at → room_id → session
  const lookup = new Map<string, Map<string, GridSession>>();
  for (const s of daySessions) {
    if (!s.room_id || !s.starts_at) continue;
    if (!lookup.has(s.starts_at)) lookup.set(s.starts_at, new Map());
    lookup.get(s.starts_at)!.set(s.room_id, s);
  }

  // Only show rooms that appear on this day, preserving original room order
  const activeRoomIds = new Set(daySessions.map((s) => s.room_id));
  const activeRooms = rooms.filter((r) => activeRoomIds.has(r.id));

  return (
    <div>
      {/* Day selector */}
      <div className="flex flex-wrap gap-2">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedDay === day
                ? "bg-indigo-600 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {formatDayLabel(day)}
          </button>
        ))}
      </div>

      {/* Scrollable grid */}
      <div
        className="mt-4 overflow-auto rounded-xl border border-gray-300 shadow-sm"
        style={{ maxHeight: "calc(100vh - 20rem)" }}
      >
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              {/* Sticky corner */}
              <th className="sticky left-0 top-0 z-30 w-20 min-w-[5rem] border-b border-r border-gray-300 bg-gray-100 px-3 py-2" />
              {activeRooms.map((room) => (
                <th
                  key={room.id}
                  className="sticky top-0 z-20 min-w-[10rem] max-w-[14rem] border-b border-r border-gray-300 bg-gray-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 last:border-r-0"
                >
                  {room.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot, i) => {
              const rowBg = i % 2 === 0 ? "bg-white" : "bg-gray-50/60";
              return (
                <tr key={slot}>
                  {/* Sticky time label */}
                  <td
                    className={`sticky left-0 z-10 whitespace-nowrap border-b border-r border-gray-200 px-3 py-3 text-xs font-semibold text-gray-600 ${rowBg}`}
                  >
                    {formatTime(slot)}
                  </td>
                  {activeRooms.map((room) => {
                    const session = lookup.get(slot)?.get(room.id);
                    return (
                      <td
                        key={room.id}
                        className={`border-b border-r border-gray-200 px-3 py-3 align-top last:border-r-0 ${rowBg}`}
                      >
                        {session && <SessionCell session={session} />}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
