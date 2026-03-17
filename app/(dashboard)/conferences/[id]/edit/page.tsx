import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { updateConferenceAction } from "@/app/(dashboard)/conferences/actions";
import ConferenceForm from "@/components/ui/ConferenceForm";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditConferencePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: conference } = await supabase
    .from("conferences")
    .select("id, name, year, location, starts_at, ends_at, is_current, sessionize_api_key, sessionize_event_id")
    .eq("id", id)
    .single();

  if (!conference) notFound();

  const boundAction = updateConferenceAction.bind(null, id);

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
        <Link
          href={`/conferences/${id}/sessions`}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          {conference.name}
        </Link>
        <span className="text-gray-500">/</span>
        <h1 className="text-2xl font-semibold text-gray-900">Edit</h1>
      </div>

      <ConferenceForm
        serverAction={boundAction}
        initialValues={conference}
        submitLabel="Save changes"
        pendingLabel="Saving…"
        cancelHref={`/conferences/${id}/sessions`}
      />
    </div>
  );
}
