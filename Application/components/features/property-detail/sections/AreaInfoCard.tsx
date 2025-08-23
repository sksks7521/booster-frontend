"use client";

import { type PropertyDetailData } from "../utils/mapItemToDetail";
import { pyeongToM2, formatSquareMeter } from "../utils/formatters";
import { Ruler } from "lucide-react";

export default function AreaInfoCard({
  vm,
}: {
  vm?: PropertyDetailData | null;
}) {
  const b = vm?.buildingArea ?? 0;
  const l = vm?.landArea ?? 0;
  return (
    <div className="rounded-lg border p-6 bg-gradient-to-br from-white to-purple-50">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <span className="p-1.5 bg-purple-100 rounded">
          <Ruler className="w-4 h-4 text-purple-600" />
        </span>
        면적 정보
      </div>
      <div className="text-sm flex items-center gap-2">
        <span>건물평형:</span>
        <span>
          {b}평 ({formatSquareMeter(pyeongToM2(b))})
        </span>
      </div>
      <div className="text-sm flex items-center gap-2">
        <span>토지평형:</span>
        <span>
          {l}평 ({formatSquareMeter(pyeongToM2(l))})
        </span>
      </div>
    </div>
  );
}
