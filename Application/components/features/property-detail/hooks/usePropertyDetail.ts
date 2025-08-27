"use client";

import useSWR from "swr";
import { itemApi, type Item } from "@/lib/api";
import {
  mapItemToDetail,
  type PropertyDetailData,
} from "../utils/mapItemToDetail";

export interface UsePropertyDetailResult {
  vm: PropertyDetailData | null;
  isLoading: boolean;
  isError: boolean;
  reload: () => void;
  raw: Item | null;
}

export function usePropertyDetail(id?: number): UsePropertyDetailResult {
  const swrKey = id ? ["/api/v1/items/detail-merged", id] : null;
  const fetcher = async (): Promise<Item> => {
    const itemId = id as number;
    // 단건 전용 커스텀 엔드포인트만 사용 (백엔드 확정)
    const fieldsParam = [
      "case_number",
      "location_detail",
      "sale_date",
      "current_status",
      "building_area_pyeong",
      "land_area_pyeong",
      "appraised_value",
      "minimum_bid_price",
      "bid_to_appraised_ratio",
      "special_rights",
      "public_price",
      "under_100million",
      "bid_to_public_ratio",
      "floor_info",
      "floor_confirmation",
      "elevator_available",
      "building_name",
      "dong_name",
      "construction_year",
      "main_usage",
      "other_usage",
      "main_structure",
      "height",
      "elevator_count",
      "ground_floors",
      "basement_floors",
      "household_count",
      "family_count",
      "postal_code",
      "use_approval_date",
      "land_area_m2",
      "building_area_m2",
      "total_floor_area",
      "building_coverage_ratio",
      "floor_area_ratio",
      "pnu",
      "administrative_dong_name",
      "road_address",
      "longitude",
      "latitude",
    ].join(",");

    const single = await itemApi.getItemCustom(itemId, { fields: fieldsParam });
    const extra = (single && (single.item || single)) as any;
    if (extra && typeof extra === "object") {
      if (extra.id == null) (extra as any).id = itemId;
      return extra as Item;
    }
    // 안전 폴백(이상 케이스): 단건 상세
    return await itemApi.getItem(itemId);
  };

  const { data, error, isLoading, mutate } = useSWR<Item>(swrKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 15000,
    keepPreviousData: true,
  });

  const vm = data ? mapItemToDetail(data) : null;

  return {
    vm,
    isLoading,
    isError: Boolean(error),
    reload: () => {
      void mutate();
    },
    raw: data ?? null,
  };
}
