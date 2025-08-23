"use client";

import React from "react";
import { type PropertyDetailData } from "../utils/mapItemToDetail";

interface Props {
  vm?: PropertyDetailData | null;
  onClose: () => void;
  onOpenAnalysis?: (id: string) => void;
  coords?: { lat?: number; lng?: number } | null;
}

export default function FooterActions({
  vm,
  onClose,
  onOpenAnalysis,
  coords,
}: Props) {
  const effLat = vm?.latitude ?? coords?.lat;
  const effLng = vm?.longitude ?? coords?.lng;
  const hasCoords = typeof effLat === "number" && typeof effLng === "number";
  const id = String(vm?.id ?? "");

  const handleOpenMap = () => {
    if (!hasCoords) return;
    const event = new CustomEvent("property:openOnMap", {
      detail: { id, lat: effLat, lng: effLng },
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="text-xs text-gray-500">
        {hasCoords ? (
          <span>
            좌표: {effLat?.toFixed(6) ?? 0}, {effLng?.toFixed(6) ?? 0}
          </span>
        ) : (
          <span>좌표 정보 없음</span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          aria-label="지도에서 보기"
          className={`px-3 py-2 rounded border text-sm ${
            hasCoords ? "hover:bg-gray-50" : "opacity-50 cursor-not-allowed"
          }`}
          onClick={handleOpenMap}
          disabled={!hasCoords}
          title={
            hasCoords ? "지도에서 보기" : "좌표 정보가 없어 이동할 수 없습니다"
          }
        >
          지도에서 보기
        </button>
        {onOpenAnalysis && id && (
          <button
            aria-label="상세 보기"
            className="px-3 py-2 rounded border text-sm hover:bg-gray-50"
            onClick={() => onOpenAnalysis(id)}
          >
            상세 보기
          </button>
        )}
        <button
          aria-label="닫기"
          className="px-3 py-2 rounded bg-black text-white text-sm hover:opacity-90"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  );
}
