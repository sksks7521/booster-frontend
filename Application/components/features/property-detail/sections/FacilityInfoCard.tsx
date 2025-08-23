"use client";

import { type PropertyDetailData } from "../utils/mapItemToDetail";
import { Layers } from "lucide-react";

export default function FacilityInfoCard({
  vm,
}: {
  vm?: PropertyDetailData | null;
}) {
  return (
    <div className="rounded-lg border p-6 bg-gradient-to-br from-white to-indigo-50">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <span className="p-1.5 bg-indigo-100 rounded">
          <Layers className="w-4 h-4 text-indigo-600" />
        </span>
        층수 및 시설
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
          <p className="text-xs text-gray-600 mb-1">지상층수</p>
          <p className="text-2xl font-bold text-blue-600">
            {vm?.groundFloors ?? 0}층
          </p>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
          <p className="text-xs text-gray-600 mb-1">지하층수</p>
          <p className="text-2xl font-bold text-red-600">
            {vm?.undergroundFloors ?? 0}층
          </p>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
          <p className="text-xs text-gray-600 mb-1">세대수</p>
          <p className="text-2xl font-bold text-green-600">
            {vm?.households ?? 0}세대
          </p>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
          <p className="text-xs text-gray-600 mb-1">가구수</p>
          <p className="text-2xl font-bold text-purple-600">
            {vm?.units ?? 0}가구
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-500">승용승강기</span>
          <span className="font-medium">{vm?.elevators ?? 0}대</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-500">엘리베이터</span>
          <span className="font-medium">
            {vm?.hasElevator === true
              ? "있음"
              : vm?.hasElevator === false
              ? "없음"
              : "확인불가"}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 col-span-2">
          <span className="text-gray-500">층확인</span>
          <span className="font-medium">{vm?.floorConfirm ?? "-"}</span>
        </div>
      </div>
    </div>
  );
}
