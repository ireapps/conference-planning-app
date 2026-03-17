"use client";

import { useState } from "react";
import Image from "next/image";

export interface SessionRow {
  id: string | number;
  title: string;
  description: string | null;
  starts_at: string | null;
  room_name: string | null;
  speaker_names: string[];
  is_confirmed: boolean;
  status: string | null;
  href: string | null;
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

function StatusBadge({ confirmed, status }: { confirmed: boolean; status: string | null }) {
  if (confirmed)
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Confirmed</span>;
  if (status)
    return <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">{status}</span>;
  return <span className="text-xs text-gray-500">—</span>;
}

export default function SessionsTable({ rows }: { rows: SessionRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = query
    ? rows.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()))
    : rows;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">
          {filtered.length !== rows.length
            ? `${filtered.length} of ${rows.length} sessions`
            : `${rows.length} session${rows.length !== 1 ? "s" : ""}`}
        </p>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by title…"
          className="w-56 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-gray-700">
          {rows.length === 0
            ? "No sessions yet — run the Sessionize sync to populate data."
            : "No sessions match your filter."}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-300 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-600">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Speaker(s)</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Starts</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                  <td className="max-w-sm px-4 py-3">
                    {session.href ? (
                      <a href={session.href} target="_blank" rel="noopener noreferrer"
                        className="font-medium text-indigo-700 hover:underline">
                        {session.title}
                      </a>
                    ) : (
                      <span className="font-medium text-gray-900">{session.title}</span>
                    )}
                    {session.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-600">
                        {session.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {session.speaker_names.length
                      ? session.speaker_names.join(", ")
                      : <span className="text-gray-500">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-800">
                    {session.room_name ?? <span className="text-gray-500">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-800">
                    {formatTime(session.starts_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge confirmed={session.is_confirmed} status={session.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
