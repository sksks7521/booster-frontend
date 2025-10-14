import { buildRentFilterParams } from "@/lib/filters/buildRentFilterParams";

export interface BuildRentMapFiltersOptions {
  filters: Record<string, any>;
  center: { lat: number; lng: number } | null;
  limit: number;
  bounds?: { south: number; west: number; north: number; east: number } | null;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
}

// 지도용 필터 생성기(공통 유틸 사용)
// - 반환값에는 지도 전용 좌표/경계/limit는 포함하지 않습니다.
// - ref_lat/ref_lng/limit/bounds는 호출부(RentSearchResults)에서 별도 파라미터로 전달됩니다.
export function buildRentMapFilters(opts: BuildRentMapFiltersOptions) {
  const { filters, sortBy, sortOrder } = opts;
  // 표준 키로 정규화 + 과도기 동안 별칭 병행, 기본값은 제거
  const normalized = buildRentFilterParams(filters, {
    includeAliases: true,
    stripDefaults: true,
    maxIds: 500,
    sortBy,
    sortOrder: (sortOrder as any) || undefined,
  });
  return normalized;
}
