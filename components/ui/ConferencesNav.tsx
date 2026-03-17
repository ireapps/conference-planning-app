"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Conference {
  id: string;
  name: string;
  year: number | null;
  is_current: boolean;
}

export default function ConferencesNav({
  conferences,
}: {
  conferences: Conference[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = query
    ? conferences.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase())
      )
    : conferences;

  function close() {
    setOpen(false);
    setQuery("");
  }

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Close on Escape, navigate on Enter (first result)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
      } else if (e.key === "Enter" && open && filtered.length > 0) {
        router.push(`/conferences/${filtered[0].id}/sessions`);
        close();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, filtered, router]);

  // Focus the search input when the dropdown opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-1 text-sm text-gray-800 hover:text-gray-950 transition-colors"
      >
        Conferences
        <ChevronDown className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-gray-300 bg-white shadow-lg">
          {/* Search */}
          <div className="border-b border-gray-200 p-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conferences…"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Conference list */}
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-600">No matches</li>
            ) : (
              filtered.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/conferences/${c.id}/sessions`}
                    onClick={close}
                    className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{c.name}</span>
                    {c.is_current && (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                        Current
                      </span>
                    )}
                  </Link>
                </li>
              ))
            )}
          </ul>

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t border-gray-200 px-3 py-2">
            <Link
              href="/conferences"
              onClick={close}
              className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              View all
            </Link>
            <Link
              href="/conferences/new"
              onClick={close}
              className="text-xs font-medium text-indigo-700 hover:text-indigo-900 transition-colors"
            >
              + New conference
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={`h-3.5 w-3.5 text-gray-500 ${className ?? ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
