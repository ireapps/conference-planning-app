import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Redirect to the current conference's sessions page,
// or to the conferences list if none is marked current.
export default async function RootPage() {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("conferences")
    .select("id")
    .eq("is_current", true)
    .single();

  if (current) {
    redirect(`/conferences/${current.id}/sessions`);
  }
  redirect("/conferences");
}
