export type SortableColumns = {
  sortable_columns?: string[];
};

import useSWR from "swr";
import type { DatasetId } from "@/types/datasets";

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
  const { data, error, isLoading } = useSWR<SortableColumns>(
    key ? [key] : null
  );
  const list = Array.isArray(data?.sortable_columns)
    ? (data!.sortable_columns as string[])
    : [];
  return { sortableColumns: list, isLoading, error };
}
