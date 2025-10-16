"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">
            문제가 발생했습니다
          </h1>
          <p className="text-gray-600">잠시 후 다시 시도해주세요.</p>
          <div className="text-xs text-gray-400">
            {process.env.NODE_ENV !== "production" ? error.message : null}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              다시 시도
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="px-4 py-2 border rounded"
            >
              홈으로
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
