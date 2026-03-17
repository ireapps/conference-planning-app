export default function Loading() {
  return (
    <div className="animate-pulse space-y-3">
      {/* Mimics the filter row */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="h-8 w-48 rounded-lg bg-gray-200" />
      </div>
      {/* Mimics the table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-100 px-4 py-3">
          <div className="h-3 w-64 rounded bg-gray-300" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-6 border-b border-gray-100 px-4 py-3 last:border-b-0">
            <div className="h-4 w-40 rounded bg-gray-200" />
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-4 w-32 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
