"use client";

import { useState } from "react";
import { syncConferenceAction } from "@/app/(dashboard)/conferences/[id]/actions";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function SyncButton({ conferenceId }: { conferenceId: string }) {
  const [state, setState] = useState<State>({ status: "idle" });

  async function handleSync() {
    setState({ status: "loading" });
    const response = await syncConferenceAction(conferenceId);

    if (response.ok) {
      const { rooms, speakers, sessions } = response.result.synced;
      setState({
        status: "success",
        message: `Synced: ${sessions} sessions, ${speakers} speakers, ${rooms} rooms`,
      });
      setTimeout(() => setState({ status: "idle" }), 5000);
    } else {
      setState({ status: "error", message: response.error });
      setTimeout(() => setState({ status: "idle" }), 8000);
    }
  }

  const isLoading = state.status === "loading";

  return (
    <div className="flex items-center gap-3">
      {state.status === "success" && (
        <span className="text-xs text-green-600">{state.message}</span>
      )}
      {state.status === "error" && (
        <span className="text-xs text-red-600" title={state.message}>
          Sync failed — {state.message}
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={isLoading}
        className="flex items-center gap-1.5 rounded-lg border border-gray-400 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <SyncIcon spinning={isLoading} />
        {isLoading ? "Syncing…" : "Sync from Sessionize"}
      </button>
    </div>
  );
}

function SyncIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 ${spinning ? "animate-spin" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}
