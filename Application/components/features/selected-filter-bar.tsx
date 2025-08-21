"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFilterStore } from "@/store/filterStore";
import { X } from "lucide-react";

type SelectedFilterBarProps = Record<string, never>;

export default function SelectedFilterBar({}: SelectedFilterBarProps) {
  // 스토어에서 직접 상태와 액션을 가져옵니다.
  const filters = useFilterStore((state) => state);
  const setFilter = useFilterStore((state) => state.setFilter);
  const setRangeFilter = useFilterStore((state) => state.setRangeFilter);
  const resetFilters = useFilterStore((state) => state.resetFilters);

  // 'x' 버튼 클릭 시 호출되는 함수를 수정합니다.
  const handleRemove = (key: string) => {
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

      {/* '전체 해제' 버튼 클릭 시 resetFilters 액션을 호출합니다. */}
      <Button
        variant="ghost"
        size="sm"
        onClick={resetFilters}
        className="text-xs text-gray-500 hover:text-gray-700 ml-2"
      >
        전체 해제
      </Button>
    </div>
  );
}
