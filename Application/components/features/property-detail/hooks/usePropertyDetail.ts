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
}

export function usePropertyDetail(id?: number): UsePropertyDetailResult {
  const swrKey = id ? ["/api/v1/items/", id, "detail"] : null;
  const { data, error, isLoading, mutate } = useSWR<Item>(
    swrKey,
    () => itemApi.getItem(id as number),
    {
      revalidateOnFocus: false,
      dedupingInterval: 15000,
      keepPreviousData: true,
    }
  );

  const vm = data ? mapItemToDetail(data) : null;

  return {
    vm,
    isLoading,
    isError: Boolean(error),
    reload: () => {
      void mutate();
    },
  };
}
