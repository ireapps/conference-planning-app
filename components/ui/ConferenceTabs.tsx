"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Sessions", segment: "sessions" },
  { label: "Speakers", segment: "speakers" },
  { label: "Grid", segment: "grid" },
];

export default function ConferenceTabs({ conferenceId }: { conferenceId: string }) {
  const pathname = usePathname();

  return (
    <div className="mt-4 flex gap-1 border-b border-gray-300">
      {TABS.map(({ label, segment }) => {
        const href = `/conferences/${conferenceId}/${segment}`;
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={segment}
            href={href}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-b-2 border-indigo-600 text-indigo-700"
                : "text-gray-700 hover:text-gray-950"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
