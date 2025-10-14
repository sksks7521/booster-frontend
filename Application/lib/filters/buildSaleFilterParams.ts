/*
  공통 필터 빌더: 실거래가(매매)
  - 목적: 목록/지도 공통으로 사용할 표준 필터 파라미터를 생성
  - 옵션:
    - includeAliases: 표준 키와 함께 서버가 수용 가능한 별칭도 병행 전송
    - stripDefaults: 기본값(미설정에 해당) 범위는 파라미터 제거
    - maxIds: 선택만 보기(ids) CSV 상한
*/

export interface BuildSaleFilterParamsOptions {
  includeAliases?: boolean;
  stripDefaults?: boolean;
  maxIds?: number;
}

const DEFAULTS = {
  maxIds: 500,
  priceUpperGuard: 100000, // 만원 단위 상한 가드(무제한/기본값으로 간주)
};

function toCsv(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const s = value
      .filter((v) => v !== undefined && v !== null && String(v).trim() !== "")
      .map((v) => String(v).trim())
      .join(",");
    return s || undefined;
  }
  if (typeof value === "string") return value || undefined;
  return undefined;
}

function camelToSnake(input: string): string {
  return String(input)
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase();
}

function normalizeElevatorYN(value: unknown): "Y" | "N" | undefined {
  if (value === undefined || value === null) return undefined;
  const raw = String(value).trim().toUpperCase();
  const ySet = new Set(["Y", "TRUE", "O", "있음"]);
  const nSet = new Set(["N", "FALSE", "X", "없음"]);
  if (ySet.has(raw)) return "Y";
  if (nSet.has(raw)) return "N";
  return undefined;
}

export function buildSaleFilterParams(
  filters: Record<string, any>,
  options?: BuildSaleFilterParamsOptions
): Record<string, any> {
  const f: any = filters || {};
  const includeAliases = options?.includeAliases === true;
  const stripDefaults = options?.stripDefaults !== false; // 기본 true
  const maxIds = Number.isFinite(options?.maxIds)
    ? Number(options?.maxIds)
    : DEFAULTS.maxIds;

  const out: Record<string, any> = {};

  // 지역
  if (f.province) out.sido = f.province;
  if (f.cityDistrict) out.sigungu = f.cityDistrict;
  if (f.town) out.admin_dong_name = f.town;

  // 거래금액(만원)
  if (Array.isArray(f.transactionAmountRange)) {
    const [minV, maxV] = f.transactionAmountRange as [number, number];
    if (Number.isFinite(minV) && (!stripDefaults || Number(minV) > 0)) {
      out.min_transaction_amount = Number(minV);
      if (includeAliases) out.transaction_amount_min = Number(minV);
    }
    if (
      Number.isFinite(maxV) &&
      (!stripDefaults ||
        (Number(maxV) > 0 && Number(maxV) < DEFAULTS.priceUpperGuard))
    ) {
      out.max_transaction_amount = Number(maxV);
      if (includeAliases) out.transaction_amount_max = Number(maxV);
    }
  }

  // 전용면적(㎡ 또는 평)
  if (Array.isArray(f.exclusiveAreaRange)) {
    const [minA, maxA] = f.exclusiveAreaRange as [number, number];
    if (Number.isFinite(minA) && (!stripDefaults || Number(minA) > 0)) {
      out.min_exclusive_area = Number(minA);
      if (includeAliases) out.exclusive_area_min = Number(minA);
    }
    if (Number.isFinite(maxA) && (!stripDefaults || Number(maxA) > 0)) {
      out.max_exclusive_area = Number(maxA);
      if (includeAliases) out.exclusive_area_max = Number(maxA);
    }
  }

  // 대지권면적(㎡)
  if (Array.isArray(f.landRightsAreaRange)) {
    const [minL, maxL] = f.landRightsAreaRange as [number, number];
    if (Number.isFinite(minL) && (!stripDefaults || Number(minL) > 0)) {
      out.min_land_rights_area = Number(minL);
      if (includeAliases) out.land_rights_area_min = Number(minL);
    }
    if (Number.isFinite(maxL) && (!stripDefaults || Number(maxL) > 0)) {
      out.max_land_rights_area = Number(maxL);
      if (includeAliases) out.land_rights_area_max = Number(maxL);
    }
  }

  // 평당가(만원/평)
  if (Array.isArray(f.pricePerPyeongRange)) {
    const [minP, maxP] = f.pricePerPyeongRange as [number, number];
    if (Number.isFinite(minP) && (!stripDefaults || Number(minP) > 0)) {
      out.min_price_per_pyeong = Number(minP);
      if (includeAliases) out.price_per_pyeong_min = Number(minP);
    }
    if (Number.isFinite(maxP) && (!stripDefaults || Number(maxP) > 0)) {
      out.max_price_per_pyeong = Number(maxP);
      if (includeAliases) out.price_per_pyeong_max = Number(maxP);
    }
  }

  // 건축연도
  if (Array.isArray(f.buildYearRange)) {
    const [minY, maxY] = f.buildYearRange as [number, number];
    if (Number.isFinite(minY) && (!stripDefaults || Number(minY) > 0)) {
      out.build_year_min = Number(minY);
      if (includeAliases) out.min_construction_year = Number(minY);
    }
    if (Number.isFinite(maxY) && (!stripDefaults || Number(maxY) > 0)) {
      out.build_year_max = Number(maxY);
      if (includeAliases) out.max_construction_year = Number(maxY);
    }
  }

  // 계약일: saleYear 또는 dateRange
  if (f.saleYear && Number.isFinite(Number(f.saleYear))) {
    const y = String(f.saleYear).trim();
    const from = `${y}-01-01`;
    const to = `${y}-12-31`;
    out.contract_date_from = from;
    out.contract_date_to = to;
    if (includeAliases) {
      out.date_from = from;
      out.date_to = to;
    }
  } else if (Array.isArray(f.dateRange)) {
    const [from, to] = f.dateRange as [string, string];
    if (from && (!stripDefaults || String(from).trim() !== "")) {
      out.contract_date_from = String(from);
      if (includeAliases) out.date_from = String(from);
    }
    if (to && (!stripDefaults || String(to).trim() !== "")) {
      out.contract_date_to = String(to);
      if (includeAliases) out.date_to = String(to);
    }
  }

  // 층확인 CSV
  const fc = toCsv(f.floorConfirmation);
  if (fc && fc !== "all") out.floor_confirmation = fc;

  // 엘리베이터(Y/N 정규화)
  const el = normalizeElevatorYN(f.elevatorAvailable);
  if (el) out.elevator_available = el;

  // 검색
  if (f.searchQuery && f.searchField) {
    const q = String(f.searchQuery).trim();
    const sf = String(f.searchField).trim();
    if (q) {
      if (sf === "address" || sf === "road_address") {
        out.address_search = q;
        out.address_search_type = "road";
        if (includeAliases) out.road_address_search = q;
      } else if (sf === "jibun_address") {
        out.address_search = q;
        out.address_search_type = "jibun";
        if (includeAliases) out.jibun_address_search = q;
      } else {
        out.address_search = q;
        out.address_search_type = "both";
      }
    }
  }

  // 선택만 보기(ids)
  try {
    const selOnly = f.showSelectedOnly === true;
    const idsArr = Array.isArray(f.selectedIds) ? (f.selectedIds as any[]) : [];
    if (selOnly && idsArr.length > 0) {
      const capped = idsArr
        .slice(0, maxIds)
        .map((v) => String(v))
        .filter((s) => s && s !== "undefined" && s !== "null");
      if (capped.length > 0) out.ids = capped.join(",");
    }
  } catch {}

  // 정렬(선택): 목록 측에서 주로 사용, 지도는 무시 가능
  if (f.sortBy && f.sortOrder) {
    const serverKey = camelToSnake(String(f.sortBy));
    const ordering = `${String(f.sortOrder) === "desc" ? "-" : ""}${serverKey}`;
    if (serverKey) out.ordering = ordering;
  }

  return out;
}
