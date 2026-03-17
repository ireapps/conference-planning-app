"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createConferenceAction(
  _prevState: { error: string } | null | void,
  formData: FormData
): Promise<{ error: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Conference name is required." };

  const isCurrent = formData.get("is_current") === "on";

  const payload = {
    name,
    year: formData.get("year") ? Number(formData.get("year")) : null,
    location: (formData.get("location") as string)?.trim() || null,
    starts_at: (formData.get("starts_at") as string) || null,
    ends_at: (formData.get("ends_at") as string) || null,
    is_current: isCurrent,
    sessionize_api_key: (formData.get("sessionize_api_key") as string)?.trim() || null,
    sessionize_event_id: (formData.get("sessionize_event_id") as string)?.trim() || null,
  };

  // If marking this as current, clear the flag on any existing current conference.
  // The schema enforces uniqueness via a partial index so we must do this first.
  if (isCurrent) {
    const { error } = await supabase
      .from("conferences")
      .update({ is_current: false })
      .eq("is_current", true);
    if (error) return { error: `Failed to unset current conference: ${error.message}` };
  }

  const { data: created, error: insertError } = await supabase
    .from("conferences")
    .insert(payload)
    .select("id")
    .single();

  if (insertError || !created) {
    return { error: insertError?.message ?? "Insert failed." };
  }

  revalidatePath("/conferences", "layout");
  redirect(`/conferences/${created.id}/sessions`);
}

export async function updateConferenceAction(
  conferenceId: string,
  _prevState: { error: string } | null | void,
  formData: FormData
): Promise<{ error: string } | void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Conference name is required." };

  const isCurrent = formData.get("is_current") === "on";

  const payload = {
    name,
    year: formData.get("year") ? Number(formData.get("year")) : null,
    location: (formData.get("location") as string)?.trim() || null,
    starts_at: (formData.get("starts_at") as string) || null,
    ends_at: (formData.get("ends_at") as string) || null,
    is_current: isCurrent,
    sessionize_api_key: (formData.get("sessionize_api_key") as string)?.trim() || null,
    sessionize_event_id: (formData.get("sessionize_event_id") as string)?.trim() || null,
  };

  // If marking this as current, clear the flag on any other conference first.
  if (isCurrent) {
    const { error } = await supabase
      .from("conferences")
      .update({ is_current: false })
      .eq("is_current", true)
      .neq("id", conferenceId);
    if (error) return { error: `Failed to unset current conference: ${error.message}` };
  }

  const { error } = await supabase
    .from("conferences")
    .update(payload)
    .eq("id", conferenceId);

  if (error) return { error: error.message };

  revalidatePath("/conferences", "layout");
  redirect(`/conferences/${conferenceId}/sessions`);
}

export async function deleteConferenceAction(
  conferenceId: string
): Promise<{ error: string } | void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("conferences")
    .delete()
    .eq("id", conferenceId);

  if (error) return { error: error.message };

  revalidatePath("/conferences", "layout");
}
