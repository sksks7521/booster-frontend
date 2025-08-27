import useSWR from "swr";
import { datasetConfigs } from "@/datasets/registry";
import type { DatasetId, ItemLike } from "@/types/datasets";

export function useDataset(
  datasetId: DatasetId,
  filters: Record<string, unknown>,
  page: number,
  size: number
) {
  const cfg = datasetConfigs[datasetId];
  const key = cfg.api.buildListKey({ filters, page, size });
  const { data, error, isLoading, mutate } = useSWR(key, async () => {
    try {
      return await cfg.api.fetchList({ filters, page, size });
    } catch (e) {
      // 백엔드 미구현/일시 오류 시에도 UI는 동작하도록 안전 결과 반환
      return { items: [], total: 0, page, size, _error: e } as any;
    }
  });

  // items 표준화: { items, total, page, size } 또는 배열 형태 모두 수용
  const rawItems: any[] = Array.isArray(data) ? data : data?.items ?? [];
  const items: ItemLike[] = rawItems.map(cfg.adapter.toItemLike);
  const total: number = data?.total ?? rawItems.length ?? 0;

  return { items, total, page, size, isLoading, error, mutate, cfg };
}
