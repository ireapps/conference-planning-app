"use client";

import { useState } from "react";
import Image from "next/image";

export interface SpeakerRow {
  id: string;
  full_name: string | null;
  tag_line: string | null;
  profile_picture: string | null;
  session_titles: string[];
  href: string | null;
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
      <Image src={src} alt={name} width={32} height={32}
        className="h-8 w-8 rounded-full object-cover bg-gray-100"
        unoptimized />
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
      {initials}
    </div>
  );
}

export default function SpeakersTable({ rows }: { rows: SpeakerRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = query
    ? rows.filter((r) =>
        (r.full_name ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : rows;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">
          {filtered.length !== rows.length
            ? `${filtered.length} of ${rows.length} speakers`
            : `${rows.length} speaker${rows.length !== 1 ? "s" : ""}`}
        </p>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name…"
          className="w-56 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-gray-700">
          {rows.length === 0
            ? "No speakers yet — run the Sessionize sync to populate data."
            : "No speakers match your filter."}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-300 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-600">
                <th className="px-4 py-3">Speaker</th>
                <th className="px-4 py-3">Tag line</th>
                <th className="px-4 py-3">Session(s)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((speaker) => (
                <tr key={speaker.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={speaker.profile_picture} name={speaker.full_name ?? ""} />
                      <div>
                        {speaker.href ? (
                          <a href={speaker.href} target="_blank" rel="noopener noreferrer"
                            className="font-medium text-indigo-700 hover:underline">
                            {speaker.full_name}
                          </a>
                        ) : (
                          <span className="font-medium text-gray-900">{speaker.full_name}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-gray-800">
                    {speaker.tag_line ?? <span className="text-gray-500">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    {speaker.session_titles.length ? (
                      <ul className="space-y-0.5">
                        {speaker.session_titles.map((title) => (
                          <li key={title} className="line-clamp-1">{title}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
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
