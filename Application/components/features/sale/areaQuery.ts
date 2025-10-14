export interface BuildSaleAreaParamsOptions {
  filters: Record<string, any>;
  center: { lat: number; lng: number } | null;
  radiusM: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
  limitHint?: number; // 지도 표시상한 힌트
}

const clampRadius = (r: number): number => {
  const MIN_RADIUS = 500;
  const MAX_RADIUS = 10000; // 10km
  const v = Number.isFinite(r) && r > 0 ? r : 1000;
  return Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, v));
};

export function buildSaleAreaParams(opts: BuildSaleAreaParamsOptions) {
  const { filters, center, radiusM, page, size, sortBy, sortOrder, limitHint } =
    opts;

  // 공통 빌더 사용: 표준/별칭/가드 적용
  // 런타임 require로 의존 순환 리스크 감소
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const {
    buildSaleFilterParams,
  } = require("@/lib/filters/buildSaleFilterParams");
  const params = buildSaleFilterParams(filters, {
    includeAliases: true,
    stripDefaults: true,
    maxIds: 500,
    sortBy,
    sortOrder,
  });

  const q: Record<string, any> = {
    ...params,
    center_lat: center?.lat,
    center_lng: center?.lng,
    radius_m: clampRadius(radiusM),
  };
  if (page != null) q.page = page;
  if (size != null) q.size = Math.max(1, Math.min(1000, Number(size)));

  // 지도/영역 힌트: 거리 정렬 + 표시상한
  if (!q.ordering)
    q.ordering = `${String(sortOrder) === "desc" ? "-" : ""}${
      sortBy || "distance"
    }`;
  if (
    String(q.ordering).includes("distance") &&
    Number.isFinite(limitHint as any)
  ) {
    q.limit = Number(limitHint);
  }

  return q;
}
