"use client";

import { type PropertyDetailData } from "../utils/mapItemToDetail";

export default function BasicInfoCard({
  vm,
}: {
  vm?: PropertyDetailData | null;
}) {
  const address = vm?.roadAddress ?? "-";
  const caseNumber = vm?.caseNumber ?? "-";

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
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
    </div>
  );
}
