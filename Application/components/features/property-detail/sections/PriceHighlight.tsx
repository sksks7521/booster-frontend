"use client";

import { type PropertyDetailData } from "../utils/mapItemToDetail";
import { statusBadgeClasses } from "../utils/formatters";

export default function PriceHighlight({
  vm,
}: {
  vm?: PropertyDetailData | null;
}) {
  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">감정가</p>
          <p className="text-3xl font-extrabold text-blue-600">
            {Intl.NumberFormat("ko-KR").format(vm?.appraisalValue ?? 0)}만원
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">최저가</p>
          <p className="text-4xl font-extrabold text-red-600">
            {Intl.NumberFormat("ko-KR").format(vm?.minimumPrice ?? 0)}만원
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">할인율</p>
          <p className="text-3xl font-extrabold text-green-600">
            {(100 - (vm?.priceRatio ?? 0) || 0).toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">현재상태</p>
          <span
            className={`inline-flex items-center gap-1 text-base px-3 py-1.5 rounded-full ${statusBadgeClasses(
              vm?.currentStatus
            )}`}
          >
            <span aria-hidden>●</span>
            {vm?.currentStatus ?? "-"}
          </span>
        </div>
      </div>
    </div>
  );
}
