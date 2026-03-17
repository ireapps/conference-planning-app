import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/ui/SignOutButton";
import ConferencesNav from "@/components/ui/ConferencesNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const [{ data: { user } }, { data: conferences }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("conferences")
      .select("id, name, year, is_current")
      .order("year", { ascending: false }),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-300 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <span className="text-sm font-semibold text-gray-900">
              Conference Planner
            </span>
            <ConferencesNav conferences={conferences ?? []} />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
