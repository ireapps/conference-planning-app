import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single conference by ID.
 *
 * Wrapped in React.cache() so that every server component in the same
 * request render pass that calls this function with the same `id` shares
 * one DB round-trip. In practice this means the [id]/(detail)/layout and
 * its child pages (sessions, speakers, grid) all call this and only one
 * query is made to Supabase per page load.
 */
export const getConference = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conferences")
    .select("id, name, year, location, is_current, sessionize_event_id")
    .eq("id", id)
    .single();
  return data ?? null;
});
