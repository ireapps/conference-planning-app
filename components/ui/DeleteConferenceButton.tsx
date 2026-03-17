"use client";

import { useState, useTransition } from "react";
import { deleteConferenceAction } from "@/app/(dashboard)/conferences/actions";

export default function DeleteConferenceButton({
  conferenceId,
  conferenceName,
}: {
  conferenceId: string;
  conferenceName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (
      !confirm(
        `Delete "${conferenceName}"?\n\nThis will permanently delete all sessions, speakers, and rooms for this conference. This cannot be undone.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteConferenceAction(conferenceId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-red-700" title={error}>
          Failed
        </span>
      )}
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="cursor-pointer rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Delete ${conferenceName}`}
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
