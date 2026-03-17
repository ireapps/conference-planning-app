"use client";

import { createConferenceAction } from "@/app/(dashboard)/conferences/actions";
import ConferenceForm from "@/components/ui/ConferenceForm";
import Link from "next/link";

export default function NewConferencePage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-baseline gap-3">
        <Link
          href="/conferences"
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Conferences
        </Link>
        <span className="text-gray-500">/</span>
        <h1 className="text-2xl font-semibold text-gray-900">New conference</h1>
      </div>

      <ConferenceForm
        serverAction={createConferenceAction}
        submitLabel="Create conference"
        pendingLabel="Creating…"
        cancelHref="/conferences"
      />
    </div>
  );
}
