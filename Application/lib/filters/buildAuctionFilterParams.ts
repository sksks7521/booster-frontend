type BuildOptions = {
  includeAliases?: boolean;
  stripDefaults?: boolean;
  floorTokenMode?: "en" | "kr";
};

const isValid = (v: unknown) =>
  v !== undefined && v !== null && String(v) !== "";
const toNumber = (v: any): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const clampYear = (y: any): number | undefined => {
  const n = Number(y);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(2030, Math.max(1900, n));
};

const toCsv = (v: any): string | undefined => {
  if (Array.isArray(v)) {
    const s = v
      .filter((x) => isValid(x))
      .map((x) => String(x).trim())
      .join(",");
    return s || undefined;
  }
  if (typeof v === "string") return v || undefined;
  return undefined;
};

const normalizeFloorKr = (label: string): string => {
  const v = String(label).trim().toLowerCase();
  if (["normal_floor", "저층", "고층", "일반층", "normal"].includes(v))
    return "일반층";
  if (["first_floor", "1층", "first"].includes(v)) return "1층";
  if (["top_floor", "옥탑", "탑층", "top"].includes(v)) return "탑층";
  if (["basement", "banjiha", "반지하(직입력)", "반지하"].includes(v))
    return "반지하";
  if (["unknown", "확인불가", "unknown_floor"].includes(v)) return "확인불가";
  return String(label).trim();
};

export function buildAuctionFilterParams(
  filters: Record<string, any> | undefined,
  opts?: BuildOptions
): Record<string, any> {
  const includeAliases = Boolean(opts?.includeAliases);
  const stripDefaults = opts?.stripDefaults !== false;
  const floorTokenMode = opts?.floorTokenMode ?? "kr";

  const f = filters || {};
  const q: Record<string, any> = {};

  // region
  if (isValid(f.province)) q.sido = f.province;
  if (isValid(f.cityDistrict)) q.address_city = f.cityDistrict;
  if (isValid(f.town)) q.eup_myeon_dong = f.town;

  if (includeAliases) {
    if (isValid(f.sido) && !q.sido) q.sido = f.sido;
    if (isValid(f.address_city) && !q.address_city)
      q.address_city = f.address_city;
    if (isValid(f.eup_myeon_dong) && !q.eup_myeon_dong)
      q.eup_myeon_dong = f.eup_myeon_dong;
  }

  // price range (만원)
  const DEFAULT_PRICE_MIN = 0;
  const DEFAULT_PRICE_MAX = 500000;
  const priceRange = Array.isArray(f.priceRange)
    ? f.priceRange
    : Array.isArray(f.salePriceRange)
    ? f.salePriceRange
    : undefined;
  if (Array.isArray(priceRange)) {
    const [minP, maxP] = priceRange;
    const minN = toNumber(minP);
    const maxN = toNumber(maxP);
    if (!stripDefaults || (minN && minN > DEFAULT_PRICE_MIN))
      if (minN !== undefined) q.min_final_sale_price = Math.max(0, minN);
    if (!stripDefaults || (maxN && maxN > 0 && maxN < DEFAULT_PRICE_MAX))
      if (maxN !== undefined) q.max_final_sale_price = Math.min(100000, maxN);
  }

  // building area (평) → area_min/max
  const buildingArea = Array.isArray(f.buildingAreaRange)
    ? f.buildingAreaRange
    : Array.isArray(f.exclusiveAreaRange)
    ? f.exclusiveAreaRange
    : undefined;
  if (Array.isArray(buildingArea)) {
    const [minA, maxA] = buildingArea;
    const minN = toNumber(minA);
    const maxN = toNumber(maxA);
    if (!stripDefaults || (minN && minN > 0))
      if (minN !== undefined) q.area_min = minN;
    if (!stripDefaults || (maxN && maxN > 0))
      if (maxN !== undefined) q.area_max = maxN;
  }

  // land area (평)
  if (Array.isArray(f.landAreaRange)) {
    const [minL, maxL] = f.landAreaRange;
    const minN = toNumber(minL);
    const maxN = toNumber(maxL);
    if (!stripDefaults || (minN && minN > 0))
      if (minN !== undefined) q.min_land_area = minN;
    if (!stripDefaults || (maxN && maxN > 0))
      if (maxN !== undefined) q.max_land_area = maxN;
  }

  // build year
  if (Array.isArray(f.buildYear)) {
    const [minY, maxY] = f.buildYear;
    const y1 = clampYear(minY);
    const y2 = clampYear(maxY);
    if (y1) q.build_year_min = y1;
    if (y2) q.build_year_max = y2;
  }

  // sale year/date
  if (isValid(f.saleYear)) {
    const y = String(f.saleYear).trim();
    q.date_from = `${y}-01-01`;
    q.date_to = `${y}-12-31`;
  } else {
    if (isValid(f.saleDateFrom)) q.date_from = f.saleDateFrom;
    if (isValid(f.saleDateTo)) q.date_to = f.saleDateTo;
    if (isValid(f.auctionDateFrom)) q.date_from = f.auctionDateFrom;
    if (isValid(f.auctionDateTo)) q.date_to = f.auctionDateTo;
  }

  // floor confirmation
  if (f.floorConfirmation && f.floorConfirmation !== "all") {
    const src = Array.isArray(f.floorConfirmation)
      ? f.floorConfirmation
      : [f.floorConfirmation];
    const csv = src
      .map((s: any) =>
        floorTokenMode === "kr" ? normalizeFloorKr(String(s)) : String(s)
      )
      .filter((s: string) => s.trim() !== "")
      .join(",");
    if (csv) q.floor_confirmation = csv;
  }

  // elevator (dual)
  const elevSrc = isValid(f.elevatorAvailable)
    ? f.elevatorAvailable
    : isValid(f.hasElevator)
    ? f.hasElevator
    : undefined;
  if (elevSrc !== undefined) {
    if (typeof elevSrc === "boolean") {
      q.has_elevator = Boolean(elevSrc);
      q.elevator_available = elevSrc ? "Y" : "N";
    } else {
      const raw = String(elevSrc).trim().toUpperCase();
      if (["Y", "TRUE", "있음", "O", "1"].includes(raw)) {
        q.has_elevator = true;
        q.elevator_available = "Y";
      } else if (["N", "FALSE", "없음", "X", "0"].includes(raw)) {
        q.has_elevator = false;
        q.elevator_available = "N";
      }
    }
  }

  // current status CSV
  {
    const cs = toCsv(f.currentStatus);
    if (cs && cs !== "all") q.current_status = cs;
  }

  // special rights/conditions (간략 버전: 들어온 CSV/배열 그대로 전달)
  {
    const sr = toCsv(f.specialRights);
    if (sr) q.special_rights = sr;
    const sc = toCsv(f.specialBooleanFlags);
    if (sc) q.special_conditions = sc;
  }

  // search
  if (isValid(f.searchQuery) && isValid(f.searchField)) {
    const sq = String(f.searchQuery).trim();
    const sf = String(f.searchField).trim();
    if (sq) {
      if (sf === "road_address") q.road_address_search = sq;
      else if (sf === "case_number") q.case_number_search = sq;
      else if (sf === "address") q.address_search = sq;
    }
  }

  // ordering (옵션)
  if (isValid(f.sortBy) && isValid(f.sortOrder)) {
    const order = String(f.sortOrder) === "desc" ? "-" : "";
    q.ordering = `${order}${String(f.sortBy)}`;
  }

  return q;
}
