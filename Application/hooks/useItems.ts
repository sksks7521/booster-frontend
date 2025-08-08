"use client";

import useSWR from "swr";
import { itemApi, type Item } from "@/lib/api";
import { useFilterStore } from "@/store/filterStore";

export interface UseItemsResult {
  items: Item[] | undefined;
  isLoading: boolean;
  error: any;
  totalCount?: number;
  refetch: () => void;
}

function buildQueryParamsFromFilters(
  filters: ReturnType<typeof useFilterStore.getState>
) {
  const params: Record<string, any> = {};

  // 기본 페이지 크기 정책
  params.limit = 20;

  // 매핑 가능한 필드 위주 최소 적용 (백엔드 스키마와의 합의 필요)
  if (filters.region) params.region = filters.region;
  if (filters.buildingType) params.property_type = filters.buildingType;
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

  return params;
}

export function useItems(): UseItemsResult {
  const filters = useFilterStore();

  const swrKey = [
    "/api/v1/items/",
    filters.region,
    filters.buildingType,
    filters.priceRange.join("-"),
    filters.areaRange.join("-"),
    filters.buildYear.join("-"),
    filters.floor,
    String(filters.hasElevator),
    String(filters.hasParking),
    filters.auctionStatus,
  ];

  const { data, error, isLoading, mutate } = useSWR(swrKey, async () => {
    const params = buildQueryParamsFromFilters(filters);
    const response = await itemApi.getItems(params);
    // `ItemsResponse` 스키마 상이 시 대응 (lib/api.ts 기준으로 우선 처리)
    const items = (response as any).items ?? (response as any) ?? [];
    const total = (response as any).total ?? (response as any).total_items;
    return { items, total } as { items: Item[]; total?: number };
  });

  return {
    items: data?.items,
    isLoading,
    error,
    totalCount: data?.total,
    refetch: () => {
      void mutate();
    },
  };
}
