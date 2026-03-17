"use server";

import { createClient } from "@/lib/supabase/server";
import { syncConference, SyncResult } from "@/lib/sessionize/sync";
import { revalidatePath, revalidateTag } from "next/cache";
import { conferenceDataTag } from "@/lib/data/conference-page-data";

export async function syncConferenceAction(
  conferenceId: string
): Promise<{ ok: true; result: SyncResult } | { ok: false; error: string }> {
  const supabase = await createClient();

  // Verify the user is authenticated before doing any work.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not authenticated." };
  }

  try {
    const result = await syncConference(supabase, conferenceId);
    // Bust the server-side data cache so all three tab pages get fresh data.
    revalidateTag(conferenceDataTag(conferenceId), "default");
    // Also clear the router cache so the user sees the update immediately
    // even if they're already on one of the tab pages.
    revalidatePath(`/conferences/${conferenceId}`, "layout");
    return { ok: true, result };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[syncConferenceAction]", error);
    return { ok: false, error };
  }
}
