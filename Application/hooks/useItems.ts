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

  // 주소 계층
  if (filters.province) params.province = filters.province;
  if (filters.cityDistrict) params.cityDistrict = filters.cityDistrict;
  if (filters.town) params.town = filters.town;
  if (filters.region) params.region = filters.region; // 하위호환
  if (filters.buildingType) params.buildingType = filters.buildingType;
  if (filters.hasElevator) params.has_elevator = true;
  if (filters.hasParking) params.has_parking = true;
  if (filters.floor) params.floor = filters.floor;
  if (filters.auctionStatus) params.auction_status = filters.auctionStatus;

  // 범위형 필드 (합의된 키가 없다면 보수적으로 최소/최대 키 사용)
  const [minPrice, maxPrice] = filters.priceRange;
  if (minPrice) params.min_price = minPrice;
  if (maxPrice) params.max_price = maxPrice;

  const [minArea, maxArea] = filters.areaRange;
  if (minArea) params.min_area = minArea;
  if (maxArea) params.max_area = maxArea;

  const [minYear, maxYear] = filters.buildYear;
  if (minYear) params.min_built_year = minYear;
  if (maxYear) params.max_built_year = maxYear;

  // 경매 일정
  if (filters.auctionDateFrom)
    params.auction_date_from = filters.auctionDateFrom;
  if (filters.auctionDateTo) params.auction_date_to = filters.auctionDateTo;
  if (filters.auctionMonth) params.auction_month = filters.auctionMonth;

  // 1억 이하 여부
  if (filters.under100)
    params.max_price = Math.min(params.max_price ?? 10000, 10000);

  return params;
}

export function useItems(): UseItemsResult {
  const filters = useFilterStore();

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    ["/api/v1/items/simple", buildQueryParamsFromFilters(filters)],
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
