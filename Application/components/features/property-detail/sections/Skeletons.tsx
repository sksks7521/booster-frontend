"use client";

export function HighlightSkeleton() {
  return (
    <div className="rounded-xl p-6 mb-4 bg-gradient-to-r from-gray-50 to-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-3 w-14 bg-gray-200 rounded mb-2" />
            <div className="h-7 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border p-6">
      <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-5/6 bg-gray-100 rounded" />
        <div className="h-4 w-4/6 bg-gray-100 rounded" />
      </div>
    </div>
  );
}
