export interface BuildAreaQueryParamsOptions {
  filters: Record<string, any>;
  center: { lat: number; lng: number } | null;
  radiusM: number;
  page: number;
  size: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
}

const toCsv = (v: any): string | undefined => {
  if (Array.isArray(v)) {
    const s = v.filter((x) => x != null && String(x).trim() !== "").join(",");
    return s || undefined;
  }
  if (typeof v === "string") return v || undefined;
  return undefined;
};

const clampRadius = (r: number): number => {
  const MIN_RADIUS = 500;
  const MAX_RADIUS = 100000; // 10km
  const v = Number.isFinite(r) && r > 0 ? r : 1000;
  return Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, v));
};

const clampYear = (y: any): number | undefined => {
  const n = Number(y);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(2030, Math.max(1900, n));
};

const camelToSnake = (k?: string): string | undefined =>
  k
    ? String(k)
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
    : undefined;

/**
 * Build query params for /api/v1/auction-completed/area.
 * Ensures parity with list endpoint filters; applies guards and dual elevator params.
 */
export function buildAreaQueryParams(opts: BuildAreaQueryParamsOptions) {
  const { filters, center, radiusM, page, size, sortBy, sortOrder } = opts;
  const q: Record<string, any> = {};

  // center/radius
  q.center_lat = center?.lat;
  q.center_lng = center?.lng;
  q.radius_m = clampRadius(radiusM);

  // region
  if ((filters as any)?.province) q.sido = (filters as any).province;
  if ((filters as any)?.cityDistrict)
    q.address_city = (filters as any).cityDistrict;
  if ((filters as any)?.town) q.eup_myeon_dong = (filters as any).town;

  // price (만원)
  // 백엔드 요청: 기본값(0~500000)은 '미설정' 처리 → 파라미터 자체를 전송하지 않음
  if (Array.isArray((filters as any)?.priceRange)) {
    const [minP, maxP] = (filters as any).priceRange as [number, number];
    const DEFAULT_MIN = 0;
    const DEFAULT_MAX = 500000;
    if (Number.isFinite(minP) && minP > DEFAULT_MIN)
      q.price_min = Math.max(0, minP);
    if (Number.isFinite(maxP) && maxP > 0 && maxP < DEFAULT_MAX) {
      const MAX_PRICE_CAP = 100000; // 미만(<) 규칙 상한 보정
      q.price_max = Math.min(MAX_PRICE_CAP, maxP);
    }
  }

  // area (평)
  if (Array.isArray((filters as any)?.buildingAreaRange)) {
    const [minA, maxA] = (filters as any).buildingAreaRange as [number, number];
    if (Number.isFinite(minA) && minA > 0) q.area_min = minA;
    if (Number.isFinite(maxA) && maxA > 0) q.area_max = maxA;
  }
  if (Array.isArray((filters as any)?.landAreaRange)) {
    const [minL, maxL] = (filters as any).landAreaRange as [number, number];
    if (Number.isFinite(minL) && minL > 0) q.land_area_min = minL;
    if (Number.isFinite(maxL) && maxL > 0) q.land_area_max = maxL;
  }

  // build year
  if (Array.isArray((filters as any)?.buildYear)) {
    const [minYRaw, maxYRaw] = (filters as any).buildYear as [number, number];
    const minY = clampYear(minYRaw);
    const maxY = clampYear(maxYRaw);
    if (minY) q.build_year_min = minY;
    if (maxY) q.build_year_max = maxY;
  }

  // sale year/date
  if ((filters as any)?.saleYear) {
    const y = String((filters as any).saleYear);
    q.date_from = `${y}-01-01`;
    q.date_to = `${y}-12-31`;
  } else {
    if ((filters as any)?.saleDateFrom)
      q.date_from = (filters as any).saleDateFrom;
    if ((filters as any)?.saleDateTo) q.date_to = (filters as any).saleDateTo;
  }

  // elevator - dual params (compat)
  const elev =
    (filters as any)?.hasElevator ?? (filters as any)?.elevatorAvailable;
  if (elev === true || elev === "있음") {
    q.has_elevator = true;
    q.elevator_available = "Y";
  } else if (elev === false || elev === "없음") {
    q.has_elevator = false;
    q.elevator_available = "N";
  }

  // CSV filters
  const fc = toCsv((filters as any)?.floorConfirmation);
  if (fc && fc !== "all") q.floor_confirmation = fc;
  const cs = toCsv((filters as any)?.currentStatus);
  if (cs && cs !== "all") q.current_status = cs;
  const sr = toCsv((filters as any)?.specialRights);
  if (sr) q.special_rights = sr;

  // 특수권리 불리언 컬럼용 canonical 키 CSV 전달 (권장)
  if (Array.isArray((filters as any)?.specialBooleanFlags)) {
    const keys = ((filters as any).specialBooleanFlags as any[])
      .map((s) => String(s).trim())
      .filter((s) => s !== "");
    if (keys.length > 0) q.special_conditions = keys.join(",");
  }

  // search mapping
  if ((filters as any)?.searchQuery && (filters as any)?.searchField) {
    const sq = String((filters as any).searchQuery);
    const sf = String((filters as any).searchField);
    if (sf === "road_address") q.road_address_search = sq;
    else if (sf === "case_number") q.case_number_search = sq;
    else if (sf === "address") q.address_search = sq;
  }

  // ordering
  const key = camelToSnake(sortBy);
  if (key && sortOrder) q.ordering = `${sortOrder === "desc" ? "-" : ""}${key}`;

  // paging
  q.page = page;
  q.size = Math.min(1000, Number.isFinite(size as any) ? (size as any) : 20);

  return q;
}
