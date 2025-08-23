"use client";

import { type PropertyDetailData } from "../utils/mapItemToDetail";
import { formatCurrencyManwon, formatPercent1 } from "../utils/formatters";
import { DollarSign } from "lucide-react";

export default function PriceDetailCard({
  vm,
}: {
  vm?: PropertyDetailData | null;
}) {
  return (
    <div className="rounded-lg border p-6 bg-gradient-to-br from-white to-green-50">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <span className="p-1.5 bg-green-100 rounded">
          <DollarSign className="w-4 h-4 text-green-600" />
        </span>
        가격 상세
      </div>
      <div className="grid grid-cols-2 gap-y-1 text-sm">
        <div className="text-gray-500">감정가</div>
        <div className="text-right font-medium">
          {formatCurrencyManwon(vm?.appraisalValue)}
        </div>
        <div className="text-gray-500">최저가</div>
        <div className="text-right font-medium text-red-600">
          {formatCurrencyManwon(vm?.minimumPrice)}
        </div>
        <div className="text-gray-500">최저가/감정가</div>
        <div className="text-right">{formatPercent1(vm?.priceRatio)}</div>
        <div className="text-gray-500">공시가격</div>
        <div className="text-right">
          {formatCurrencyManwon(vm?.publicPrice)}
        </div>
      </div>
    </div>
  );
}
