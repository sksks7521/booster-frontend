"use client";

import { type PropertyDetailData } from "../utils/mapItemToDetail";

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "warn" | "ok";
}) {
  const toneClass =
    tone === "warn"
      ? "bg-orange-100 text-orange-800"
      : tone === "ok"
      ? "bg-green-100 text-green-700"
      : "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs rounded ${toneClass}`}
    >
      {children}
    </span>
  );
}

export default function KeyBadges({ vm }: { vm?: PropertyDetailData | null }) {
  const under100 = vm?.under100Million ? (
    <Badge tone="warn">1억 이하</Badge>
  ) : null;
  const elev =
    vm?.hasElevator === true ? (
      <Badge tone="ok">엘리베이터</Badge>
    ) : vm?.hasElevator === false ? (
      <Badge>엘리베이터 없음</Badge>
    ) : (
      <Badge>엘리베이터 확인불가</Badge>
    );
  const floor = vm?.floorConfirm ? (
    <Badge>{vm.floorConfirm}</Badge>
  ) : (
    <Badge>층확인 미상</Badge>
  );
  return (
    <div className="flex flex-wrap gap-2">
      {under100}
      {elev}
      {floor}
    </div>
  );
}
