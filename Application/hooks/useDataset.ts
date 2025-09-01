import useSWR from "swr";
import { datasetConfigs } from "@/datasets/registry";
import {
  normalizeItemLike,
  roundBounds,
  isValidBounds,
  sanitizeFilters,
} from "@/datasets/normalize";
import type { DatasetId, ItemLike } from "@/types/datasets";
import { validateRow } from "@/datasets/schemas";

export function useDataset(
  datasetId: DatasetId,
  filters: Record<string, unknown>,
  page: number,
  size: number
) {
  const cfg = datasetConfigs[datasetId];
  const safeFilters = roundBounds(sanitizeFilters(filters));
  // 중심+반경이 존재하면(bounds가 함께 오더라도) bounds 유효성 검사는 건너뛰고
  // 쿼리에서 bounds를 제거하여 서버에 center+radius만 전달한다.
  const hasCenterRadius =
    (safeFilters as any).lat != null && (safeFilters as any).lng != null;
  const filtersForQuery: Record<string, unknown> = { ...safeFilters };
  if (hasCenterRadius) {
    delete (filtersForQuery as any).south;
    delete (filtersForQuery as any).west;
    delete (filtersForQuery as any).north;
    delete (filtersForQuery as any).east;
  }
  const key = cfg.api.buildListKey({ filters: filtersForQuery, page, size });
  const { data, error, isLoading, mutate } = useSWR(key, async () => {
    try {
      // bounds 간단 검증 실패 시 네트워크 요청 생략
      // 단, 중심+반경 모드일 때는 bounds 무효여도 요청을 진행한다.
      if (!hasCenterRadius && !isValidBounds(safeFilters)) {
        console.log("bounds 검증 실패로 빈 결과 반환");
        return { items: [], total: 0, page, size } as any;
      }

      const result = await cfg.api.fetchList({
        filters: filtersForQuery,
        page,
        size,
      });

      return result;
    } catch (e) {
      // 백엔드 미구현/일시 오류 시에도 UI는 동작하도록 안전 결과 반환
      console.error("=== API 요청 실패 ===", e);
      return { items: [], total: 0, page, size, _error: e } as any;
    }
  });

  // items 표준화: { results, count, page, size }, { items, total, page, size } 또는 배열 형태 모두 수용
  const rawItemsAll: any[] = Array.isArray(data)
    ? data
    : data?.results ?? data?.items ?? [];

  const rawItems: any[] = rawItemsAll
    .map((r) => validateRow(datasetId, r))
    .filter((r): r is any => r != null);

  const items: ItemLike[] = rawItems
    .map((r) => {
      const itemLike = cfg.adapter.toItemLike(r);
      if (!itemLike) {
        console.log("❌ [toItemLike] 실패:", { id: r?.id });
      }
      return itemLike;
    })
    .map((item) => {
      const normalized = normalizeItemLike(item);
      if (!normalized) {
        console.log("❌ [normalizeItemLike] 실패:", { id: item?.id });
      }
      return normalized;
    })
    .filter((x): x is ItemLike => x != null);

  const total: number = data?.count ?? data?.total ?? rawItems.length ?? 0;

  return { items, total, page, size, isLoading, error, mutate, cfg };
}
