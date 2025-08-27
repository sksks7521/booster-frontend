"use client";

import { type PropertyDetailData } from "../utils/mapItemToDetail";

export default function BasicInfoCard({
  vm,
}: {
  vm?: PropertyDetailData | null;
}) {
  const address = vm?.roadAddress ?? "-";
  const caseNumber = vm?.caseNumber ?? "-";
  const lat = vm?.latitude;
  const lng = vm?.longitude;
  const inLat = typeof lat === "number" && lat >= 33 && lat <= 39.5;
  const inLng = typeof lng === "number" && lng >= 124 && lng <= 132.5;
  const hasCoords = inLat && inLng;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const handleOpenMap = () => {
    if (!hasCoords) return;
    const id = String(vm?.id ?? "");
    const event = new CustomEvent("property:openOnMap", {
      detail: { id, lat, lng },
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="rounded-lg border p-6">
      <div className="text-sm text-gray-600 mb-2">기본 정보</div>
      <div className="text-sm">용도: {vm?.usage ?? "-"}</div>
      <div className="text-sm flex items-center gap-2">
        <span>사건번호: </span>
        <span className="font-mono" title={caseNumber}>
          {caseNumber}
        </span>
        {caseNumber !== "-" && (
          <button
            aria-label="사건번호 복사"
            className="text-xs underline"
            onClick={() => handleCopy(caseNumber)}
          >
            복사
          </button>
        )}
      </div>
      <div className="text-sm flex items-center gap-2">
        <span>도로명주소: </span>
        <span className="truncate" title={address} style={{ maxWidth: 360 }}>
          {address}
        </span>
        {address !== "-" && (
          <button
            aria-label="주소 복사"
            className="text-xs underline"
            onClick={() => handleCopy(address)}
          >
            복사
          </button>
        )}
      </div>
      <div className="text-sm">소재지: {vm?.location ?? "-"}</div>
      <div className="text-sm">PNU: {vm?.pnu ?? "-"}</div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span>좌표:</span>
        <span
          className="font-mono"
          title={hasCoords ? `${lat}, ${lng}` : "좌표 정보 없음"}
        >
          {hasCoords ? `${lat?.toFixed(6)}, ${lng?.toFixed(6)}` : "-"}
        </span>
        {hasCoords && (
          <>
            <button
              aria-label="좌표 복사"
              className="text-xs underline"
              onClick={() => handleCopy(`${lat}, ${lng}`)}
            >
              복사
            </button>
            <button
              aria-label="지도에서 보기"
              className="px-2 py-1 rounded border text-xs hover:bg-gray-50"
              onClick={handleOpenMap}
              title="지도에서 보기"
            >
              지도에서 보기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
