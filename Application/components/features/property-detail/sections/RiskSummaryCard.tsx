"use client";

import React from "react";
import { type PropertyDetailData } from "../utils/mapItemToDetail";

const RISK_KEYWORDS = [
  "근저당",
  "선순위",
  "선순위임차인",
  "임차인",
  "관련사건",
  "유치권",
  "법정지상권",
  "가등기",
  "압류",
  "가처분",
];

function highlightRiskText(text: string): React.ReactNode {
  if (!text) return "-";
  const regex = new RegExp(`(${RISK_KEYWORDS.join("|")})`, "g");
  const parts = text.split(regex);
  return parts.map((part, idx) =>
    RISK_KEYWORDS.includes(part) ? (
      <span
        key={idx}
        className="text-red-700 underline underline-offset-2 font-medium"
      >
        {part}
      </span>
    ) : (
      <span key={idx}>{part}</span>
    )
  );
}

export default function RiskSummaryCard({
  vm,
}: {
  vm?: PropertyDetailData | null;
}) {
  const special = vm?.specialRights ?? "-";
  const isRisk = special && special !== "-" && special.trim().length > 0;
  return (
    <div
      className={`rounded-lg border p-6 ${
        isRisk ? "border-red-200 bg-red-50" : ""
      }`}
    >
      <div className="text-sm text-gray-600 mb-2">특수권리 요약</div>
      <div className={`text-sm ${isRisk ? "text-red-700" : "text-gray-800"}`}>
        {isRisk ? highlightRiskText(special) : "특이사항 없음"}
      </div>
    </div>
  );
}
