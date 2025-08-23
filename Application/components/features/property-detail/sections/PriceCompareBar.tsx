"use client";

import { type PropertyDetailData } from "../utils/mapItemToDetail";

export default function PriceCompareBar({
  vm,
}: {
  vm?: PropertyDetailData | null;
}) {
  const appraised = vm?.appraisalValue ?? 0;
  const minimum = vm?.minimumPrice ?? 0;
  const ratio =
    appraised > 0 ? Math.min(100, Math.max(0, (minimum / appraised) * 100)) : 0;
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-gray-600 mb-2">가격 비교</div>
      <div className="h-4 w-full bg-gray-100 rounded overflow-hidden">
        <div
          className="h-full bg-red-500"
          style={{ width: `${ratio}%` }}
          aria-label={`최저가/감정가 ${ratio.toFixed(1)}%`}
          title={`최저가/감정가 ${ratio.toFixed(1)}%`}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-600">
        <span>최저가</span>
        <span>{ratio.toFixed(1)}%</span>
        <span>감정가</span>
      </div>
    </div>
  );
}
