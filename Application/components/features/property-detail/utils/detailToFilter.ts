import type { PropertyDetailData } from "./mapItemToDetail";

export type DetailToFilterPatch = Partial<{
  elevatorAvailable: "Y" | "N" | "all" | boolean;
  floorConfirmation: string | string[];
  buildingAreaRange: [number, number];
  landAreaRange: [number, number];
  buildYear: [number, number];
  currentStatus: string | string[];
  specialRights: string | string[];
  saleYears: number[];
  under100: boolean;
}>;

export function buildFilterPatchFromDetail(
  vm?: PropertyDetailData | null,
  areaTolerancePyeong: number = 1
): DetailToFilterPatch {
  if (!vm) return {};
  const patch: DetailToFilterPatch = {};

  // 엘리베이터: boolean|null → 그대로 전달(스토어에서 Y/N/all 정규화)
  if (vm.hasElevator !== null) {
    patch.elevatorAvailable = vm.hasElevator as boolean;
  }

  // 층확인: 공란 제외
  if (vm.floorConfirm && vm.floorConfirm.trim()) {
    patch.floorConfirmation = vm.floorConfirm.trim();
  }

  // 건물면적(평): ± areaTolerancePyeong
  if (Number.isFinite(vm.buildingArea) && (vm.buildingArea as number) > 0) {
    const a = vm.buildingArea as number;
    patch.buildingAreaRange = [
      Math.max(0, a - areaTolerancePyeong),
      a + areaTolerancePyeong,
    ];
  }

  // 토지면적(평): ± areaTolerancePyeong (옵션)
  if (Number.isFinite(vm.landArea) && (vm.landArea as number) > 0) {
    const l = vm.landArea as number;
    patch.landAreaRange = [
      Math.max(0, l - areaTolerancePyeong),
      l + areaTolerancePyeong,
    ];
  }

  // 건축연도: 단일 연도 고정
  if (
    Number.isFinite(vm.constructionYear) &&
    (vm.constructionYear as number) > 0
  ) {
    const y = vm.constructionYear as number;
    patch.buildYear = [y, y];
  }

  // 현재상태: "-" 제외
  if (vm.currentStatus && vm.currentStatus !== "-") {
    patch.currentStatus = vm.currentStatus;
  }

  // 특수권리: 공란 제외(CSV 가능)
  if (vm.specialRights && vm.specialRights.trim()) {
    patch.specialRights = vm.specialRights;
  }

  // 매각연도: YYYY만 추출
  if (vm.saleDate && /^\d{4}/.test(vm.saleDate)) {
    const y = parseInt(vm.saleDate.slice(0, 4), 10);
    if (y > 1900 && y < 2100) patch.saleYears = [y];
  }

  // 1억 이하 여부
  patch.under100 = !!vm.under100Million;

  return patch;
}
