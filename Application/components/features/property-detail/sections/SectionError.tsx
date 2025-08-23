"use client";

export default function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-4 w-4 rounded-full bg-red-500" aria-hidden />
        <div className="flex-1">
          <div className="text-sm font-semibold text-red-700">
            섹션 데이터를 불러오지 못했습니다
          </div>
          <div className="mt-1 text-xs text-red-600">
            네트워크 상태를 확인한 뒤 다시 시도해주세요.
          </div>
          <button
            className="mt-2 inline-flex items-center px-2.5 py-1.5 text-xs rounded border border-red-300 text-red-700 hover:bg-red-100"
            onClick={onRetry}
          >
            재시도
          </button>
        </div>
      </div>
    </div>
  );
}
