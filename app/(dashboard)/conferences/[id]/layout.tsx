import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConferenceTabs from "@/components/ui/ConferenceTabs";

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ConferenceLayout({ children, params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: conference } = await supabase
    .from("conferences")
    .select("id, name, year, location, is_current")
    .eq("id", id)
    .single();

  if (!conference) notFound();

  return (
    <div>
      {/* Conference header */}
      <div className="flex items-baseline gap-3">
        <Link
          href="/conferences"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Conferences
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-semibold text-gray-900">
          {conference.name}
        </h1>
        {conference.is_current && (
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
            Current
          </span>
        )}
      </div>

      <ConferenceTabs conferenceId={id} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
