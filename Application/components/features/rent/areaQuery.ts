export interface BuildRentAreaParamsOptions {
  filters: Record<string, any>;
  center: { lat: number; lng: number } | null;
  radiusM: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
  limitHint?: number;
  showSelectedOnly?: boolean;
}

const clampRadius = (r: number): number => {
  const MIN = 500;
  const MAX = 10000;
  const v = Number.isFinite(r) && r > 0 ? Number(r) : 1000;
  return Math.min(MAX, Math.max(MIN, v));
};

export function buildRentAreaParams(opts: BuildRentAreaParamsOptions) {
  const {
    filters,
    center,
    radiusM,
    page,
    size,
    sortBy,
    sortOrder,
    limitHint,
    showSelectedOnly,
  } = opts;

  // 공통 빌더 사용: 표준/별칭/가드 + 층확인 토큰(지도=영문)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const {
    buildRentFilterParams,
  } = require("@/lib/filters/buildRentFilterParams");
  const params = buildRentFilterParams(filters, {
    includeAliases: true,
    stripDefaults: true,
    maxIds: 500,
    sortBy,
    sortOrder,
    floorTokenMode: "en",
    showSelectedOnly: Boolean(showSelectedOnly),
  });

  const q: Record<string, any> = {
    ...params,
    center_lat: center?.lat,
    center_lng: center?.lng,
    radius_m: clampRadius(radiusM),
    dataset: "rent",
  };

  if (page != null) q.page = page;
  if (size != null) q.size = Math.max(1, Math.min(1000, Number(size)));

  // 거리정렬 힌트 + 상한 힌트
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
