"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { type Item } from "@/lib/api";
import { useFilterStore } from "@/store/filterStore";

export interface UseItemsResult {
  items: Item[] | undefined;
  isLoading: boolean;
  error: any;
  totalCount?: number;
  refetch: () => void;
  isRefreshing: boolean;
}

function buildQueryParamsFromFilters(
  filters: ReturnType<typeof useFilterStore.getState>
) {
  const params: Record<string, any> = {};

  // 기본 페이지 크기 정책
  params.limit = filters.size ?? 20;
  params.page = filters.page ?? 1;

  // ✅ 지역 (코드 기반 - 백엔드 가이드 3-1)
  if (filters.sido_code) params.sido_code = filters.sido_code;
  if (filters.city_code) params.city_code = filters.city_code;
  if (filters.town_code) params.town_code = filters.town_code;

  // 하위호환용 이름 기반 (백엔드에서 지원)
  if (!filters.sido_code && filters.province)
    params.province = filters.province;
  if (!filters.city_code && filters.cityDistrict)
    params.cityDistrict = filters.cityDistrict;
  if (!filters.town_code && filters.town) params.town = filters.town;
  if (filters.region) params.region = filters.region;

  // ✅ 건물 유형 (백엔드 가이드: buildingType → usage)
  if (filters.buildingType && filters.buildingType !== "all") {
    params.usage = filters.buildingType;
  }

  // ✅ 편의시설 (camelCase - 백엔드 가이드 3-1)
  if (filters.hasElevator && filters.hasElevator !== "all") {
    params.hasElevator = filters.hasElevator === "있음" ? true : false;
  }
  // ❌ hasParking 제거 (백엔드 데이터 없음)

  // ✅ 층수 필터 (백엔드에서 완전 지원 확인!)
  if (filters.floor && filters.floor !== "all") {
    params.floor = filters.floor;
  }

  // ❌ 경매상태 (사용자 요청에 의해 비활성화)
  // if (filters.auctionStatus && filters.auctionStatus !== "all") {
  //   params.currentStatus = filters.auctionStatus;
  // }

  // ✅ 가격 범위 (camelCase - 백엔드 가이드 3-1: minPrice/maxPrice)
  const [minPrice, maxPrice] = filters.priceRange;
  if (minPrice && minPrice > 0) params.minPrice = minPrice;
  if (maxPrice && maxPrice < 500000) params.maxPrice = maxPrice;

  // ✅ 면적 범위 (camelCase - 백엔드 가이드 3-1: minArea/maxArea)
  const [minArea, maxArea] = filters.areaRange;
  if (minArea && minArea > 0) params.minArea = minArea;
  if (maxArea && maxArea < 200) params.maxArea = maxArea;

  // ✅ 건축년도 (백엔드 가이드: minBuildYear/maxBuildYear → minYearBuilt/maxYearBuilt)
  const [minYear, maxYear] = filters.buildYear;
  if (minYear && minYear > 1980) params.minYearBuilt = minYear;
  if (maxYear && maxYear < 2024) params.maxYearBuilt = maxYear;

  // ✅ 매각기일 (백엔드 가이드 3-1)
  if (filters.auctionDateFrom) params.auctionDateFrom = filters.auctionDateFrom;
  if (filters.auctionDateTo) params.auctionDateTo = filters.auctionDateTo;

  // 하위호환 (기존 코드)
  if (filters.auctionMonth) params.auction_month = filters.auctionMonth;

  // 1억 이하 여부 (기존 로직 유지)
  if (filters.under100) {
    params.maxPrice = Math.min(params.maxPrice ?? 10000, 10000);
  }

  return params;
}

export function useItems(): UseItemsResult {
  const filters = useFilterStore();

  // 🎉 /custom API 사용 (16개 컬럼 선택 + 모든 필터링 완전 지원 확인!)
  const requiredFields = [
    "id",
    "usage",
    "case_number",
    "road_address",
    "building_area_pyeong",
    "land_area_pyeong",
    "appraised_value",
    "minimum_bid_price",
    "bid_to_appraised_ratio",
    "public_price",
    "sale_month",
    "special_rights",
    "floor_confirmation",
    "under_100million",
    "construction_year",
    "elevator_available",
  ].join(",");

  const allParams = {
    ...buildQueryParamsFromFilters(filters),
    fields: requiredFields,
  };

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    ["/api/v1/items/custom", allParams], // ✅ /custom 엔드포인트 - 완전 지원 확인!
    fetcher
  );

  return {
    items: (data as any)?.items ?? (data as any) ?? [],
    isLoading,
    error,
    totalCount:
      (data as any)?.totalItems ?? (data as any)?.total ?? (data as any)?.count,
    refetch: () => {
      void mutate();
    },
    isRefreshing: isValidating,
  };
}
