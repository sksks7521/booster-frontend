import useSWR from "swr";
import { datasetConfigs } from "@/datasets/registry";
import type { DatasetId } from "@/types/datasets";
import { clientSort } from "@/components/features/table/sort-utils";
import { validateRow } from "@/datasets/schemas";
import { normalizeItemLike } from "@/datasets/normalize";

type SortOrder = "asc" | "desc" | undefined;

export function useGlobalDataset(
  datasetId: DatasetId,
  filters: Record<string, unknown>,
  page: number,
  size: number,
  sortBy?: string,
  sortOrder?: SortOrder,
  cap: number = 5000,
  enabled: boolean = true
) {
  const cfg = datasetConfigs[datasetId];

  const enableGlobal = Boolean(sortBy && sortOrder);

  const key = !enabled
    ? null
    : enableGlobal
    ? [datasetId, "global", { filters, page, size, sortBy, sortOrder, cap }]
    : [datasetId, "page", { filters, page, size }];

  const { data, error, isLoading, mutate } = useSWR(key, async () => {
    try {
      if (!enableGlobal) {
        const res = await cfg.api.fetchList({ filters, page, size });
        const raw = Array.isArray(res)
          ? res
          : (res as any)?.results ?? (res as any)?.items ?? [];
        const items = raw
          .map((r) => validateRow(datasetId, r))
          .filter((r): r is any => r != null)
          .map((r) => cfg.adapter.toItemLike(r))
          .map((x) => normalizeItemLike(x))
          .filter((x): x is any => x != null);
        const total =
          (res as any)?.count ?? (res as any)?.total ?? items.length ?? 0;
        return { items, total };
      }

      // 정렬 활성: 1페이지 결과를 기준으로 총 수 파악 후 cap까지 집계
      const first = await cfg.api.fetchList({ filters, page: 1, size });
      const firstItemsRaw: any[] = Array.isArray(first)
        ? first
        : (first as any)?.results ?? (first as any)?.items ?? [];
      const total: number =
        (first as any)?.count ??
        (first as any)?.total ??
        firstItemsRaw.length ??
        0;
      const pageSize = size;
      const totalPages = Math.max(
        1,
        Math.ceil(Math.min(total, cap) / pageSize)
      );

      const allRaw: any[] = [...firstItemsRaw];
      for (let p = 2; p <= totalPages; p++) {
        try {
          const res = await cfg.api.fetchList({
            filters,
            page: p,
            size: pageSize,
          });
          const arr: any[] = Array.isArray(res)
            ? res
            : (res as any)?.results ?? (res as any)?.items ?? [];
          allRaw.push(...arr);
          if (allRaw.length >= cap) break;
        } catch (e) {
          break; // 안정 우선: 실패 시 더 이상 진행하지 않음
        }
      }

      // 표준화(어댑터 → 노멀라이즈) 후 정렬/슬라이스
      // 중복 제거를 위해 집계 단계에서 고유 키로 Set 관리
      const toKey = (r: any) =>
        String((r && (r.id ?? r.doc_id ?? r.uuid ?? r.case_number)) ?? "");
      const seen = new Set<string>();
      const all = allRaw
        .map((r) => validateRow(datasetId, r))
        .filter((r): r is any => r != null)
        .map((r) => cfg.adapter.toItemLike(r))
        .map((x) => normalizeItemLike(x))
        .filter((x): x is any => x != null)
        .filter((x) => {
          const k = toKey(x);
          if (!k) return false;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });

      const sorted = clientSort(all, sortBy, sortOrder);
      const start = (page - 1) * size;
      const sliced = sorted.slice(start, start + size);
      return {
        items: sliced,
        total: Math.min(total, cap),
        _allCount: all.length,
      };
    } catch (e) {
      return { items: [], total: 0, _error: e };
    }
  });

  const items: any[] = (data as any)?.items ?? [];
  const total: number = (data as any)?.total ?? 0;

  return { items, total, isLoading, error, mutate };
}
