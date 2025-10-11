import useSWR from "swr";
import type { DatasetId } from "@/types/datasets";
import { realTransactionApi, realRentApi } from "@/lib/api";
import { fetcher } from "@/lib/fetcher";

export type SortableColumns = {
  sortable_columns?: string[];
};

export type ColumnsResponse = {
  columns: { key: string; label: string; sortable: boolean }[];
};

function columnsPath(datasetId: DatasetId): string | null {
  switch (datasetId) {
    case "auction_ed":
      return "/api/v1/auction-completed/columns";
    case "sale":
      return "/api/v1/real-transactions/columns";
    case "rent":
      return "/api/v1/real-rents/columns";
    default:
      return null;
  }
}

export function useSortableColumns(datasetId: DatasetId) {
  const key = columnsPath(datasetId);
  const { data, error, isLoading } = useSWR<SortableColumns | ColumnsResponse>(
    key ? [key] : null,
    async () => {
      // sale 데이터셋은 새로운 형식 지원
      if (datasetId === "sale") {
        const response = await realTransactionApi.getColumns();
        return response as ColumnsResponse;
      }
      // rent 데이터셋도 API 클라이언트 경유(신규/구형 포맷 모두 허용)
      if (datasetId === "rent") {
        const response = await realRentApi.getColumns();
        return response as ColumnsResponse;
      }
      // auction_ed는 기존 형식 유지
      return fetcher(key!);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30 * 60 * 1000, // 30분 캐시
    }
  );

  // 응답 형식에 따라 sortable columns 추출
  let list: string[] = [];
  if (data) {
    if ("columns" in data) {
      // 새로운 형식 (sale): columns 배열에서 sortable: true인 것만 필터링
      list = data.columns.filter((col) => col.sortable).map((col) => col.key);
    } else if ("sortable_columns" in data) {
      // 기존 형식 (auction_ed): sortable_columns 배열 사용
      list = Array.isArray(data.sortable_columns) ? data.sortable_columns : [];
    }
  }

  return { sortableColumns: list, isLoading, error };
}
