"use client";

import { type PropertyDetailData } from "../utils/mapItemToDetail";
import { Building, Info } from "lucide-react";

export default function BuildingInfoCard({
  vm,
}: {
  vm?: PropertyDetailData | null;
}) {
  return (
    <div className="rounded-lg border p-6 bg-gradient-to-br from-white to-orange-50">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <span className="p-1.5 bg-orange-100 rounded">
          <Building className="w-4 h-4 text-orange-600" />
        </span>
        건물 정보
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex justify-between items-center py-2 border-b border-gray-100 col-span-2">
          <span className="text-gray-500">건물명</span>
          <span className="font-medium">{vm?.buildingName ?? "-"}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-500">동명</span>
          <span className="font-medium">{vm?.dongName ?? "-"}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-500">호수</span>
          <span className="font-medium text-blue-600">
            {vm?.roomNumber ?? "-"}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-500">건축연도</span>
          <span className="font-medium">{vm?.constructionYear ?? 0}년</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100 col-span-2">
          <span className="text-gray-500">주구조</span>
          <span className="text-right">{vm?.mainStructure ?? "-"}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-500">주용도</span>
          <span>{vm?.mainPurpose ?? "-"}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-500">기타용도</span>
          <span>{vm?.otherPurpose ?? "-"}</span>
        </div>
        <div className="flex justify-between items-center py-2 col-span-2">
          <span className="text-gray-500">높이</span>
          <span className="font-medium">{vm?.height ?? 0}m</span>
        </div>
      </div>
    </div>
  );
}
