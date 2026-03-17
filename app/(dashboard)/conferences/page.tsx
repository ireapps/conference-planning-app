import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import DeleteConferenceButton from "@/components/ui/DeleteConferenceButton";

export default async function ConferencesPage() {
  const supabase = await createClient();
  const { data: conferences } = await supabase
    .from("conferences")
    .select("id, name, year, location, starts_at, ends_at, is_current")
    .order("year", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Conferences</h1>
        <Link
          href="/conferences/new"
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          New conference
        </Link>
      </div>

      {!conferences?.length ? (
        <p className="mt-6 text-sm text-gray-700">
          No conferences yet.{" "}
          <Link href="/conferences/new" className="text-indigo-700 hover:underline">
            Create your first one.
          </Link>
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-gray-300 rounded-xl border border-gray-300 bg-white shadow-sm">
          {conferences.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <Link
                  href={`/conferences/${c.id}/sessions`}
                  className="text-sm font-semibold text-indigo-700 hover:underline cursor-pointer"
                >
                  {c.name}
                </Link>
                {c.is_current && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                    Current
                  </span>
                )}
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  {c.location && <span>{c.location}</span>}
                  {c.starts_at && (
                    <span>
                      {new Date(c.starts_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
                <Link
                  href={`/conferences/${c.id}/edit`}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  Edit
                </Link>
                <DeleteConferenceButton
                  conferenceId={c.id}
                  conferenceName={c.name}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
