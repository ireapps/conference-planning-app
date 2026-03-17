import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ConferencesPage() {
  const supabase = await createClient();
  const { data: conferences } = await supabase
    .from("conferences")
    .select("id, name, year, location, starts_at, ends_at, is_current")
    .order("year", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Conferences</h1>

      {!conferences?.length ? (
        <p className="mt-6 text-sm text-gray-500">
          No conferences yet. Add one in Supabase and run the Sessionize sync.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-sm">
          {conferences.map((c) => (
            <li key={c.id}>
              <Link
                href={`/conferences/${c.id}/sessions`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    {c.name}
                  </span>
                  {c.is_current && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      Current
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-500">
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
                  <span className="text-gray-300">→</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
