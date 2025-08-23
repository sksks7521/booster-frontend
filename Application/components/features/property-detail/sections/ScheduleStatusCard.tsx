"use client";

import { type PropertyDetailData } from "../utils/mapItemToDetail";
import { calcDDay, formatDateYmd } from "../utils/formatters";
import { Calendar } from "lucide-react";

export default function ScheduleStatusCard({
  vm,
}: {
  vm?: PropertyDetailData | null;
}) {
  const d = calcDDay(vm?.saleDate);
  const dday =
    d !== null && d >= 0 && d <= 7 ? `D-${String(d).padStart(2, "0")}` : "-";
  return (
    <div className="rounded-lg border p-6 bg-gradient-to-br from-white to-blue-50">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <span className="p-1.5 bg-blue-100 rounded">
          <Calendar className="w-4 h-4 text-blue-600" />
        </span>
        일정/상태
      </div>
      <div className="grid grid-cols-2 gap-y-1 text-sm">
        <div className="text-gray-500">매각기일</div>
        <div className="text-right">{formatDateYmd(vm?.saleDate)}</div>
        <div className="text-gray-500">D-Day</div>
        <div className="text-right font-medium">{dday}</div>
        <div className="text-gray-500">현재상태</div>
        <div className="text-right">{vm?.currentStatus ?? "-"}</div>
      </div>
    </div>
  );
}
