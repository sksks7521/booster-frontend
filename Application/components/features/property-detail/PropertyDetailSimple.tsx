"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type PropertyDetailData } from "./utils/mapItemToDetail";
import {
  formatCurrencyManwon,
  formatPercent1,
  formatDateYmd,
  formatFixed1,
} from "./utils/formatters";
import PropertyDetailHeader from "./sections/Header";
import KeyBadges from "./sections/KeyBadges";
import LocationMiniMap from "./sections/LocationMiniMap";
import regions from "@/regions.json";

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div
        className="mb-3 text-sm font-semibold text-gray-800"
        role="heading"
        aria-level={3}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  copyable,
  wrap,
  clamp2,
}: {
  label: string;
  value?: React.ReactNode;
  copyable?: boolean;
  wrap?: boolean;
  clamp2?: boolean;
}) {
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(value ?? ""));
    } catch {}
  };
  const text = typeof value === "string" ? value : undefined;
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <span className="text-gray-500 text-sm min-w-[92px]">{label}</span>
      <span className="flex items-center gap-2 text-sm font-medium">
        <span
          className={
            wrap
              ? "whitespace-normal break-words text-left max-w-none"
              : "truncate text-right break-words max-w-[260px] sm:max-w-[360px] lg:max-w-[420px]"
          }
          title={text}
          style={
            clamp2
              ? ({
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                } as any)
              : undefined
          }
        >
          {value ?? "-"}
        </span>
        {copyable && value ? (
          <button
            className="text-xs underline"
            onClick={onCopy}
            aria-label={`${label} 복사`}
          >
            복사
          </button>
        ) : null}
      </span>
    </div>
  );
}

export default function PropertyDetailSimple({
  vm,
  hideReportButton,
  hideOpenMapButton,
}: {
  vm?: PropertyDetailData | null;
  hideReportButton?: boolean;
  hideOpenMapButton?: boolean;
}) {
  const router = useRouter();
  // 관심 토글 이벤트 디스패치
  const toggleFavorite = React.useCallback(() => {
    try {
      const id = String(vm?.id ?? "");
      if (!id) return;
      window.dispatchEvent(
        new CustomEvent("property:toggleFavorite", { detail: { id } })
      );
    } catch {}
  }, [vm?.id]);

  const openReport = React.useCallback(() => {
    try {
      const id = String(vm?.id ?? "");
      if (!id) return;
      const address = String(
        vm?.roadAddress || vm?.locationAddress || ""
      ).trim();
      const extract = (
        addr: string
      ): { province?: string; cityDistrict?: string } => {
        if (!addr) return {};
        const provs = ((regions as any)["시도"] as string[]) || [];
        const byProv: Record<string, string[]> =
          ((regions as any)["시군구"] as any) || {};
        const province = provs.find((p) => addr.startsWith(p));
        if (!province) return {};
        const fulls = byProv[province] || [];
        const foundFull = fulls.find((f) => addr.includes(f));
        const collapseCity = (full: string): string => {
          const idx = full.indexOf("시 ");
          return idx >= 0 ? full.slice(0, idx + 1).trim() : full;
        };
        const cityDistrict = foundFull ? collapseCity(foundFull) : province;
        return { province, cityDistrict };
      };
      const { province, cityDistrict } = extract(address);
      const qs = new URLSearchParams();
      if (province) qs.set("province", province);
      if (cityDistrict) qs.set("cityDistrict", cityDistrict);
      router.push(
        `/analysis/${id}/v2${qs.toString() ? `?${qs.toString()}` : ""}`
      );
    } catch {}
  }, [vm?.id, vm?.roadAddress, vm?.locationAddress, router]);

  // (임시) 상세 내 필터 적용 UI 제거: 통일성 있는 정보 표시만 유지
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 기존 UI와 동일한 헤더/배지 */}
        <div className="lg:col-span-2">
          <PropertyDetailHeader vm={vm ?? undefined} />
          <div className="mb-3">
            <KeyBadges vm={vm ?? undefined} />
          </div>
        </div>

        <div className="space-y-6">
          <Card title="경매 기본 정보">
            <InfoRow label="사건번호" value={vm?.caseNumber} copyable />
            <InfoRow
              label="도로명주소"
              value={vm?.roadAddress ?? "-"}
              wrap
              clamp2
            />
            <InfoRow label="매각기일" value={formatDateYmd(vm?.saleDate)} />
            <InfoRow label="현재상태" value={vm?.currentStatus ?? "-"} />
            <InfoRow
              label="건물평형"
              value={
                typeof vm?.buildingArea === "number"
                  ? `${vm?.buildingArea}평`
                  : "-"
              }
            />
            <InfoRow
              label="토지평형"
              value={
                typeof vm?.landArea === "number" ? `${vm?.landArea}평` : "-"
              }
            />
            <InfoRow
              label="감정가(만원)"
              value={formatCurrencyManwon(vm?.appraisalValue)}
            />
            <InfoRow
              label="최저가(만원)"
              value={formatCurrencyManwon(vm?.minimumPrice)}
            />
            <InfoRow
              label="최저가/감정가"
              value={formatPercent1(vm?.priceRatio)}
            />
            <InfoRow
              label="특수권리"
              value={vm?.specialRights ?? "-"}
              wrap
              clamp2
            />
          </Card>

          {/* 필터 적용 UI 제거됨 */}

          <Card title="물건 분석">
            <InfoRow
              label="공시가격(만원)"
              value={formatCurrencyManwon(vm?.publicPrice)}
            />
            <InfoRow
              label="1억 이하 여부"
              value={
                vm?.under100Million === true
                  ? "O"
                  : vm?.under100Million === false
                  ? "X"
                  : "-"
              }
            />
            <InfoRow
              label="최저가/공시가격"
              value={formatFixed1(vm?.publicPriceRatio)}
            />
            <InfoRow
              label="층수"
              value={(() => {
                const v: any = vm?.floors as any;
                if (v && String(v).trim()) {
                  const n = Number(v);
                  return Number.isFinite(n) ? String(Math.trunc(n)) : String(v);
                }
                const g = vm?.groundFloors;
                const b = vm?.undergroundFloors;
                if (Number.isFinite(g) || Number.isFinite(b)) {
                  return `지상 ${g ?? 0}층 / 지하 ${b ?? 0}층`;
                }
                return "-";
              })()}
            />
            <InfoRow label="층확인" value={vm?.floorConfirm?.trim() || "-"} />
            <InfoRow
              label="Elevator여부"
              value={
                vm?.hasElevator === null
                  ? "-"
                  : vm?.hasElevator
                  ? "있음"
                  : "없음"
              }
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="건물 정보">
            <InfoRow label="건물명" value={vm?.buildingName ?? "-"} />
            <InfoRow label="동명" value={vm?.dongName ?? "-"} />
            <InfoRow
              label="건축연도"
              value={
                typeof vm?.constructionYear === "number" &&
                vm?.constructionYear > 0
                  ? `${vm.constructionYear}년`
                  : "-"
              }
            />
            <InfoRow label="주용도" value={vm?.mainPurpose ?? "-"} />
            <InfoRow label="기타용도" value={vm?.otherPurpose ?? "-"} />
            <InfoRow label="주구조" value={vm?.mainStructure ?? "-"} />
            <InfoRow label="높이" value={vm?.height ? `${vm.height}m` : "-"} />
            <InfoRow
              label="승용승강기"
              value={
                typeof vm?.elevators === "number" ? `${vm.elevators}대` : "-"
              }
            />
            <InfoRow
              label="지상층수"
              value={vm?.groundFloors ? `${vm.groundFloors}층` : "-"}
            />
            <InfoRow
              label="지하층수"
              value={vm?.undergroundFloors ? `${vm.undergroundFloors}층` : "-"}
            />
            <InfoRow
              label="세대수"
              value={
                typeof vm?.households === "number"
                  ? `${vm.households}세대`
                  : "-"
              }
            />
            <InfoRow
              label="가구수"
              value={typeof vm?.units === "number" ? `${vm.units}가구` : "-"}
            />
            <InfoRow
              label="우편번호"
              value={
                vm?.postalCode ? String(Math.trunc(Number(vm.postalCode))) : "-"
              }
            />
            <InfoRow
              label="사용승인일"
              value={formatDateYmd(vm?.approvalDate)}
            />
            <InfoRow
              label="대지면적(㎡)"
              value={
                typeof vm?.landSize === "number"
                  ? vm.landSize.toLocaleString() + "㎡"
                  : "-"
              }
            />
            <InfoRow
              label="건축면적(㎡)"
              value={
                typeof vm?.buildingSize === "number"
                  ? vm.buildingSize.toLocaleString() + "㎡"
                  : "-"
              }
            />
            <InfoRow
              label="연면적(㎡)"
              value={
                typeof vm?.totalFloorArea === "number"
                  ? vm.totalFloorArea.toLocaleString() + "㎡"
                  : "-"
              }
            />
            <InfoRow
              label="건폐율(%)"
              value={
                typeof vm?.buildingCoverageRatio === "number"
                  ? `${vm.buildingCoverageRatio}%`
                  : "-"
              }
            />
            <InfoRow
              label="용적률(%)"
              value={
                typeof vm?.floorAreaRatio === "number"
                  ? `${vm.floorAreaRatio}%`
                  : "-"
              }
            />
            <InfoRow label="PNU" value={vm?.pnu ?? "-"} />
            <InfoRow label="행정동명칭" value={vm?.adminDongName ?? "-"} />
            <InfoRow
              label="경도"
              value={
                typeof vm?.longitude === "number"
                  ? vm.longitude.toFixed(6)
                  : "-"
              }
            />
            <InfoRow
              label="위도"
              value={
                typeof vm?.latitude === "number" ? vm.latitude.toFixed(6) : "-"
              }
            />
          </Card>

          {/* 상단 버튼 그룹 제거: 하단(위치 정보 섹션)에서만 노출 */}
        </div>
      </div>

      {/* 위치 정보: 그리드 밖 풀폭 섹션 */}
      <div className="mt-6">
        <Card title="위치 정보">
          {(() => {
            const lat = vm?.latitude;
            const lng = vm?.longitude;
            const inLat = typeof lat === "number" && lat >= 33 && lat <= 39.5;
            const inLng = typeof lng === "number" && lng >= 124 && lng <= 132.5;
            const hasKey = Boolean(process.env.NEXT_PUBLIC_KAKAO_APP_KEY);
            return inLat && inLng && hasKey ? (
              <div className="mb-3">
                <LocationMiniMap lat={lat!} lng={lng!} level={7} />
              </div>
            ) : (
              <div className="h-[360px] mb-3 flex items-center justify-center rounded bg-gray-50 border text-xs text-gray-500">
                지도 API 연동 영역
              </div>
            );
          })()}
          <div className="space-y-2">
            {hideOpenMapButton !== true && (
              <button
                className="w-full rounded border px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => {
                  const lat = vm?.latitude;
                  const lng = vm?.longitude;
                  const inLat =
                    typeof lat === "number" && lat >= 33 && lat <= 39.5;
                  const inLng =
                    typeof lng === "number" && lng >= 124 && lng <= 132.5;
                  if (inLat && inLng) {
                    window.dispatchEvent(
                      new CustomEvent("property:openOnMap", {
                        detail: { id: String(vm?.id ?? ""), lat, lng },
                      })
                    );
                  }
                }}
                disabled={
                  !(
                    typeof vm?.latitude === "number" &&
                    vm.latitude >= 33 &&
                    vm.latitude <= 39.5 &&
                    typeof vm?.longitude === "number" &&
                    vm.longitude >= 124 &&
                    vm.longitude <= 132.5
                  )
                }
              >
                지도에서 보기
              </button>
            )}
            <div className="flex gap-2">
              <button
                className="flex-1 rounded bg-black text-white px-3 py-2 text-sm"
                onClick={toggleFavorite}
                aria-label="관심 물건 토글"
                aria-pressed={false}
              >
                관심 물건으로 추가
              </button>
              {hideReportButton !== true && (
                <button
                  className="flex-1 rounded border px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={openReport}
                  aria-label="분석 보고서"
                >
                  분석 보고서 생성
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
