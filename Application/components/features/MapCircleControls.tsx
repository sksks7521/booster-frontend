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

  // 입력 즉시 적용 대신, 로컬 상태에 보관 후 '적용' 시 점진 적용
  const MIN_RADIUS = 500;
  const MAX_RADIUS = 100000; // 10km
  const [draftRadius, setDraftRadius] = React.useState<string>(
    String(
      Math.min(
        MAX_RADIUS,
        Math.max(MIN_RADIUS, Math.floor(Number(radiusM) || 0))
      )
    )
  );
  const [error, setError] = React.useState<string>("");

  // 외부 radiusM 변경 시 로컬 상태를 동기화(사용자가 편집 중이 아니라면 강제 동기화)
  React.useEffect(() => {
    setDraftRadius(
      String(
        Math.min(
          MAX_RADIUS,
          Math.max(MIN_RADIUS, Math.floor(Number(radiusM) || 0))
        )
      )
    );
  }, [radiusM]);

  const handleApply = () => {
    const parsed = parseInt(draftRadius || "0", 10);
    const clamped = Number.isFinite(parsed)
      ? Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, parsed))
      : MIN_RADIUS;
    if (parsed < MIN_RADIUS) {
      setError(
        `최소 반지름은 ${MIN_RADIUS}m 입니다. 자동으로 ${MIN_RADIUS}m로 적용됩니다.`
      );
    } else if (parsed > MAX_RADIUS) {
      setError(`최대 반지름은 10km 입니다. 자동으로 10km로 적용됩니다.`);
    } else {
      setError("");
    }
    if (typeof onChangeRadius === "function") onChangeRadius(clamped);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApply();
    }
  };

  return (
    <div className="absolute left-2 bottom-2 z-10">
      <div className="rounded-lg border border-gray-200/80 bg-white/95 px-3 py-2 text-xs text-gray-800 shadow-sm w-[224px]">
        <div className="font-semibold text-[12px] mb-2">원 반경 설정</div>
        <div className="grid grid-cols-[72px_1fr] items-center gap-2 mb-1">
          <span className="text-[11px] text-gray-600">반지름(m)</span>
          <input
            type="number"
            className="w-full rounded border px-2 py-1 text-[12px]"
            value={draftRadius}
            onChange={(e) => {
              setDraftRadius(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            min={MIN_RADIUS}
            max={MAX_RADIUS}
            step={100}
          />
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-gray-500">
            최소 {MIN_RADIUS}m · 최대 10km
          </span>
          <button
            className="rounded border px-2 py-1 whitespace-nowrap text-[11px] bg-blue-600 text-white border-blue-600 hover:opacity-90"
            onClick={handleApply}
          >
            적용
          </button>
        </div>
        {error ? (
          <div className="mb-2 text-[11px] text-red-600">{error}</div>
        ) : null}
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
