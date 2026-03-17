// Magic-link pages: accessible without authentication.
// The [token] is a short-lived signed token validated server-side.
// Anyone with the share link can view this page.

import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ token: string }>;
}

async function validateShareToken(
  token: string
): Promise<{ valid: boolean; label?: string }> {
  // TODO: Validate the token against the database (e.g., a `share_links` table).
  // For now, any non-empty token is treated as valid for development.
  if (!token) return { valid: false };
  return { valid: true, label: "Conference Schedule Preview" };
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const { valid, label } = await validateShareToken(token);

  if (!valid) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">{label}</h1>
        <p className="mt-2 text-sm text-gray-500">
          This page is shared via a link. No sign-in required.
        </p>
        {/* Shared content will be rendered here based on the token's scope */}
      </div>
    </div>
  );
}
