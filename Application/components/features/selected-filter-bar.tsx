"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFilterStore } from "@/store/filterStore";
import { X } from "lucide-react";

type SelectedFilterBarProps = {
  detailsCollapsed: boolean;
  onToggleDetailsCollapse: () => void;
  namespace?: string;
};

export default function SelectedFilterBar({
  detailsCollapsed,
  onToggleDetailsCollapse,
  namespace,
}: SelectedFilterBarProps) {
  // 스토어에서 직접 상태와 액션을 가져옵니다. (네임스페이스 대응)
  const storeAll = useFilterStore((state) => state as any);
  const setFilterBase = useFilterStore((state) => state.setFilter);
  const setRangeFilterBase = useFilterStore((state) => state.setRangeFilter);
  const resetFilters = useFilterStore((state) => state.resetFilters);
  const setSortConfig = useFilterStore((state) => state.setSortConfig);
  const setNsFilter = useFilterStore((s) => (s as any).setNsFilter);
  const setNsRangeFilter = useFilterStore((s) => (s as any).setNsRangeFilter);

  const nsOverrides = (
    storeAll.ns && namespace ? (storeAll.ns as any)[namespace] : undefined
  ) as any;
  const filters: any =
    namespace && nsOverrides ? { ...storeAll, ...nsOverrides } : storeAll;

  // 네임스페이스 라우팅 래퍼
  const setFilter = (key: any, value: any) => {
    if (namespace && typeof setNsFilter === "function") {
      (setNsFilter as any)(namespace, key, value);
    } else {
      (setFilterBase as any)(key, value);
    }
  };
  const setRangeFilter = (
    key:
      | "priceRange"
      | "areaRange"
      | "buildingAreaRange"
      | "landAreaRange"
      | "buildYear",
    value: [number, number]
  ) => {
    if (namespace && typeof setNsRangeFilter === "function") {
      (setNsRangeFilter as any)(namespace, key, value);
    } else {
      setRangeFilterBase(key, value);
    }
  };

  // 'x' 버튼 클릭 시 호출되는 함수를 수정합니다.
  const handleRemove = (key: string) => {
    if (
      key === "search_case" ||
      key === "search_road" ||
      key === "search_all"
    ) {
      setFilter("searchQuery" as any, "");
      setFilter("searchField" as any, "all");
      return;
    }
    if (key === "hasElevator") {
      setFilter(key as any, "all"); // ✅ string 방식으로 수정
    } else if (key === "floorConfirmation") {
      setFilter(key as any, "all"); // ✅ 새로운 필터 처리 추가
    } else if (key === "hasParking") {
      setFilter(key as any, false);
    } else if (key === "priceRange") {
      setRangeFilter("priceRange", [0, 500000]);
    } else if (key === "areaRange") {
      setRangeFilter("areaRange", [0, 200]);
    } else if (key === "buildYear") {
      setRangeFilter("buildYear", [1980, 2024]);
    } else {
      setFilter(key as any, "all"); // ✅ 기본값을 "all"로 변경
    }
  };

  const formatPrice = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}억`;
    }
    return `${value.toLocaleString()}만`;
  };

  const formatArea = (value: number) => {
    return `${value}㎡`;
  };

  const getSelectedFilters = () => {
    const selected = [];
    // 🔎 키워드 검색(주소/사건번호)
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim();
      if (filters.searchField === "road_address") {
        selected.push({
          key: "search_road",
          label: `주소: "${q}"`,
          value: q,
        });
      } else if (filters.searchField === "case_number") {
        selected.push({
          key: "search_case",
          label: `사건번호: "${q}"`,
          value: q,
        });
      } else {
        selected.push({
          key: "search_all",
          label: `검색: "${q}"`,
          value: q,
        });
      }
    }

    if (filters.region) {
      selected.push({
        key: "region",
        label: `지역: ${filters.region}`,
        value: filters.region,
      });
    }

    if (filters.buildingType) {
      selected.push({
        key: "buildingType",
        label: `건물유형: ${filters.buildingType}`,
        value: filters.buildingType,
      });
    }

    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 500000) {
      selected.push({
        key: "priceRange",
        label: `가격: ${formatPrice(filters.priceRange[0])} ~ ${formatPrice(
          filters.priceRange[1]
        )}`,
        value: filters.priceRange,
      });
    }

    if (filters.areaRange[0] > 0 || filters.areaRange[1] < 200) {
      selected.push({
        key: "areaRange",
        label: `면적: ${formatArea(filters.areaRange[0])} ~ ${formatArea(
          filters.areaRange[1]
        )}`,
        value: filters.areaRange,
      });
    }

    if (filters.buildYear[0] > 1980 || filters.buildYear[1] < 2024) {
      selected.push({
        key: "buildYear",
        label: `건축년도: ${filters.buildYear[0]}년 ~ ${filters.buildYear[1]}년`,
        value: filters.buildYear,
      });
    }

    // ✅ floorConfirmation 필터로 수정
    if (
      (filters as any).floorConfirmation &&
      (filters as any).floorConfirmation !== "all"
    ) {
      selected.push({
        key: "floorConfirmation",
        label: `층확인: ${(filters as any).floorConfirmation}`,
        value: (filters as any).floorConfirmation,
      });
    }

    // ✅ hasElevator를 string 방식으로 수정
    if (
      (filters as any).hasElevator &&
      (filters as any).hasElevator !== "all"
    ) {
      selected.push({
        key: "hasElevator",
        label: `엘리베이터: ${(filters as any).hasElevator}`,
        value: (filters as any).hasElevator,
      });
    }

    // 🆕 현재상태
    if (
      (filters as any).currentStatus &&
      (filters as any).currentStatus !== "all"
    ) {
      const cs = (filters as any).currentStatus as string | string[];
      const label = Array.isArray(cs) ? cs.join(", ") : cs;
      selected.push({
        key: "currentStatus",
        label: `현재상태: ${label}`,
        value: cs,
      });
    }

    // 🆕 특수조건(불리언)
    if (
      Array.isArray((filters as any).specialBooleanFlags) &&
      (filters as any).specialBooleanFlags.length > 0
    ) {
      selected.push({
        key: "specialBooleanFlags",
        label: `특수조건(불리언): ${(
          (filters as any).specialBooleanFlags as string[]
        ).join(", ")}`,
        value: (filters as any).specialBooleanFlags,
      });
    }

    // 🆕 특수조건(문자열 any-match)
    if (
      Array.isArray((filters as any).specialConditions) &&
      (filters as any).specialConditions.length > 0
    ) {
      selected.push({
        key: "specialConditions",
        label: `특수조건: ${(
          (filters as any).specialConditions as string[]
        ).join(", ")}`,
        value: (filters as any).specialConditions,
      });
    }

    if (filters.hasParking) {
      selected.push({
        key: "hasParking",
        label: "주차장",
        value: true,
      });
    }

    if (filters.auctionStatus) {
      const statusLabels = {
        scheduled: "경매예정",
        ongoing: "경매진행중",
        completed: "경매완료",
        cancelled: "경매취소",
      };
      selected.push({
        key: "auctionStatus",
        label: `상태: ${
          statusLabels[filters.auctionStatus as keyof typeof statusLabels] ||
          filters.auctionStatus
        }`,
        value: filters.auctionStatus,
      });
    }

    return selected;
  };

  const selectedFilters = getSelectedFilters();

  if (selectedFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">선택된 필터:</span>

      {selectedFilters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="flex items-center gap-1 px-3 py-1"
        >
          <span className="text-xs">{filter.label}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 ml-1 hover:bg-transparent"
            onClick={() => handleRemove(filter.key)}
          >
            <X className="w-3 h-3" />
          </Button>
        </Badge>
      ))}

      {/* '전체 해제'는 지역은 유지하고 상세 조건만 초기화 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          // 범위 초기화
          setRangeFilter("priceRange", [0, 500000]);
          setRangeFilter("areaRange", [0, 200]); // deprecated 유지 초기화
          setRangeFilter("buildingAreaRange", [0, 100]);
          setRangeFilter("landAreaRange", [0, 200]);
          setRangeFilter("buildYear", [1980, 2024]);

          // 단일값 초기화 (지역 관련 필드는 보존)
          setFilter("buildingType", "all" as any);
          setFilter("floor", "all" as any);
          setFilter("floorConfirmation", "all" as any);
          setFilter("hasElevator", "all" as any);
          setFilter("hasParking", undefined as any);
          setFilter("auctionStatus", "all" as any);
          setFilter("under100", false as any);
          setFilter("auctionDateFrom", undefined as any);
          setFilter("auctionDateTo", undefined as any);
          setFilter("currentStatus" as any, undefined);
          setFilter("specialBooleanFlags" as any, []);
          setFilter("specialConditions" as any, []);
          setSortConfig(undefined, undefined);
        }}
        className="text-xs text-gray-500 hover:text-gray-700 ml-2"
      >
        전체 해제
      </Button>

      {/* 우측 정렬: 필터 패널 접기/펼치기 */}
      <div className="ml-auto">
        <Button
          onClick={onToggleDetailsCollapse}
          size="sm"
          className={
            detailsCollapsed
              ? "h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
              : "h-8 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white"
          }
        >
          {detailsCollapsed ? "✨ 필터 펼치기" : "📁 필터 접어두기"}
        </Button>
      </div>
    </div>
  );
}
