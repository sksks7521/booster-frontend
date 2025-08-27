"use client";

import { type Item } from "@/lib/api";
import { type PropertyDetailData } from "../utils/mapItemToDetail";
import { formatDateYmd } from "../utils/formatters";
import { MapPin, FileText, Calendar } from "lucide-react";

interface Props {
  vm?: PropertyDetailData | null;
  rowItem?: Item | null;
}

export default function PropertyDetailHeader({ vm, rowItem }: Props) {
  const id =
    (vm?.id as unknown as string) ?? String((rowItem as any)?.id ?? "-");
  const address =
    vm?.location ||
    (rowItem as any)?.location_detail ||
    vm?.roadAddress ||
    (rowItem as any)?.road_address ||
    (rowItem as any)?.address ||
    "주소 정보 없음";
  const usage = vm?.usage || (rowItem as any)?.usage || "-";
  const caseNumber = vm?.caseNumber || (rowItem as any)?.case_number || "-";
  const saleDate = vm?.saleDate || (rowItem as any)?.sale_date || null;

  return (
    <div className="mb-4">
      <div className="text-[11px] text-gray-400">ID: {id}</div>
      <h2 className="mt-1 text-2xl md:text-3xl font-bold text-gray-900 leading-tight whitespace-normal break-words">
        {address}
      </h2>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <span className="flex items-center">
          <MapPin className="w-4 h-4 mr-1" />
          {usage}
        </span>
        <span className="flex items-center">
          <FileText className="w-4 h-4 mr-1" />
          <span className="font-mono">{caseNumber}</span>
        </span>
        {saleDate ? (
          <span className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            매각기일: {formatDateYmd(saleDate)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
