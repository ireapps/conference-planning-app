import Link from "next/link";
import { notFound } from "next/navigation";
import ConferenceTabs from "@/components/ui/ConferenceTabs";
import SyncButton from "@/components/ui/SyncButton";
import { getConference } from "@/lib/data/conferences";

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ConferenceLayout({ children, params }: Props) {
  const { id } = await params;
  const conference = await getConference(id);

  if (!conference) notFound();

  return (
    <div>
      {/* Conference header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <Link
            href="/conferences"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Conferences
          </Link>
          <span className="text-gray-500">/</span>
          <h1 className="text-2xl font-semibold text-gray-900">
            {conference.name}
          </h1>
          {conference.is_current && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
              Current
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/conferences/${id}/edit`}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Edit
          </Link>
          <SyncButton conferenceId={id} />
        </div>
      </div>

      <ConferenceTabs conferenceId={id} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
