"use client";

import * as React from "react";

interface MapCircleControlsProps {
  enabled?: boolean; // 컨트롤 자체 노출 여부
  circleEnabled?: boolean;
  radiusM?: number;
  onToggleCircle?: () => void;
  onChangeRadius?: (radiusM: number) => void;
  // 분석물건 마커 관련
  refLocked?: boolean;
  onToggleRefLock?: () => void;
  onMoveToRefMarker?: () => void;
}

export default function MapCircleControls({
  enabled = false,
  circleEnabled = false,
  radiusM = 1000,
  onToggleCircle,
  onChangeRadius,
  refLocked,
  onToggleRefLock,
  onMoveToRefMarker,
}: MapCircleControlsProps) {
  if (!enabled) return null;

  return (
    <div className="absolute left-2 bottom-2 z-10">
      <div className="rounded-lg border border-gray-200/80 bg-white/95 px-3 py-2 text-xs text-gray-800 shadow-sm w-[224px]">
        <div className="font-semibold text-[12px] mb-2">원 반경 설정</div>
        <div className="grid grid-cols-[72px_1fr] items-center gap-2 mb-2">
          <span className="text-[11px] text-gray-600">반지름(m)</span>
          <input
            type="number"
            className="w-full rounded border px-2 py-1 text-[12px]"
            value={Math.max(0, Math.floor(Number(radiusM) || 0))}
            onChange={(e) => {
              const v = parseInt(e.target.value || "0", 10);
              if (onChangeRadius)
                onChangeRadius(Number.isFinite(v) ? Math.max(0, v) : 0);
            }}
            min={0}
            step={100}
          />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <button
            className={`flex-1 rounded border px-2 py-1 whitespace-nowrap text-[11px] ${
              circleEnabled
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-800 border-gray-300"
            }`}
            onClick={onToggleCircle}
          >
            {circleEnabled ? "원 그리기 해제" : "원 그리기"}
          </button>
          <button
            className="flex-1 rounded border px-2 py-1 whitespace-nowrap text-[11px] bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
            onClick={onMoveToRefMarker}
          >
            물건 위치로 이동
          </button>
        </div>
        <div className="hidden">
          <span className="text-[11px] text-gray-600">물건 고정</span>
          <button
            className={`rounded border px-2 py-1 whitespace-nowrap text-[11px] ${
              refLocked
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-800 border-gray-300"
            }`}
            onClick={onToggleRefLock}
          >
            {refLocked ? "설정" : "해제"}
          </button>
        </div>
      </div>
    </div>
  );
}
