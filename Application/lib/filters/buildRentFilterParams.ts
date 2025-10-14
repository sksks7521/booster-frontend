/*
 * buildRentFilterParams
 * - 전월세(실거래가 전월세) 공통 필터 파라미터 빌더
 * - 목록/지도 공용. 표준 키 → 백엔드 파라미터 매핑, 별칭(optional), 기본값 가드(stripDefaults)
 */

type BuildOptions = {
  includeAliases?: boolean;
  stripDefaults?: boolean;
  maxIds?: number;
  sortBy?: string | undefined;
  sortOrder?: "asc" | "desc" | undefined;
  floorTokenMode?: "eng" | "kr"; // 지도(map)는 eng, 목록(list)은 kr
};

const YES_SET = new Set(["Y", "TRUE", "1", "O", "YES", "있음"]);
const NO_SET = new Set(["N", "FALSE", "0", "X", "NO", "없음"]);

function toYN(input: unknown): "Y" | "N" | undefined {
  if (input == null) return undefined;
  const s = String(input).trim().toUpperCase();
  if (YES_SET.has(s)) return "Y";
  if (NO_SET.has(s)) return "N";
  if (typeof input === "boolean") return input ? "Y" : "N";
  return undefined;
}

function isValidNumber(n: any): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function clampRange(
  min?: number,
  max?: number
): [number | undefined, number | undefined] {
  if (!isValidNumber(min) && !isValidNumber(max)) return [undefined, undefined];
  if (isValidNumber(min) && isValidNumber(max) && min > max) {
    return [max, min];
  }
  return [
    isValidNumber(min) ? min : undefined,
    isValidNumber(max) ? max : undefined,
  ];
}

function pushRange(
  out: Record<string, any>,
  keyMin: string,
  keyMax: string,
  range: any,
  defaults: [number, number] | undefined,
  includeAliases: boolean,
  aliasMin?: string,
  aliasMax?: string,
  stripDefaults?: boolean
) {
  if (!Array.isArray(range) || range.length < 2) return;
  const rawMin = typeof range[0] === "string" ? parseFloat(range[0]) : range[0];
  const rawMax = typeof range[1] === "string" ? parseFloat(range[1]) : range[1];
  let [mn, mx] = clampRange(rawMin, rawMax);
  // 기본값 가드
  if (stripDefaults && defaults && isValidNumber(mn) && isValidNumber(mx)) {
    if (mn === defaults[0] && mx === defaults[1]) {
      mn = undefined;
      mx = undefined;
    }
  }
  if (isValidNumber(mn)) {
    out[keyMin] = mn;
    if (includeAliases && aliasMin) out[aliasMin] = mn;
  }
  if (isValidNumber(mx)) {
    out[keyMax] = mx;
    if (includeAliases && aliasMax) out[aliasMax] = mx;
  }
}

function normalizeOrdering(
  sortBy?: string,
  sortOrder?: "asc" | "desc"
): string | undefined {
  if (!sortBy) return undefined;
  const snake = sortBy.replace(/([A-Z])/g, "_$1").toLowerCase();
  if (sortOrder === "desc") return `-${snake}`;
  return snake;
}

export function buildRentFilterParams(
  filters: Record<string, any> | undefined,
  opts?: BuildOptions
): Record<string, any> {
  const includeAliases = Boolean(opts?.includeAliases);
  const stripDefaults = opts?.stripDefaults !== false; // 기본 true
  const maxIds = Math.max(1, Math.min(500, Number(opts?.maxIds ?? 500)));

  const f = filters || {};
  const q: Record<string, any> = {};
  const floorMode = (opts?.floorTokenMode || "eng") as "eng" | "kr";

  // 지역
  const sido = f.province;
  const sigungu = f.cityDistrict;
  const adminDong = f.town;
  if (sido) q.sido = String(sido);
  if (sigungu) q.sigungu = String(sigungu);
  if (adminDong) q.admin_dong_name = String(adminDong);

  // 가격/임대료 범위
  pushRange(
    q,
    "min_deposit",
    "max_deposit",
    f.depositRange,
    [0, 100000],
    includeAliases,
    "deposit_min",
    "deposit_max",
    stripDefaults
  );
  // 목록 API 호환 별칭(min_deposit_amount/max_deposit_amount)
  if (includeAliases) {
    if (q.min_deposit != null) (q as any).min_deposit_amount = q.min_deposit;
    if (q.max_deposit != null) (q as any).max_deposit_amount = q.max_deposit;
  }

  pushRange(
    q,
    "min_monthly_rent",
    "max_monthly_rent",
    f.monthlyRentRange,
    [0, 500],
    includeAliases,
    "monthly_rent_min",
    "monthly_rent_max",
    stripDefaults
  );

  pushRange(
    q,
    "min_conversion_amount",
    "max_conversion_amount",
    f.jeonseConversionAmountRange,
    [0, 200000],
    includeAliases,
    "conversion_amount_min",
    "conversion_amount_max",
    stripDefaults
  );
  // 목록 API 호환 별칭(min_jeonse_conversion_amount/max_jeonse_conversion_amount)
  if (includeAliases) {
    if (q.min_conversion_amount != null)
      (q as any).min_jeonse_conversion_amount = q.min_conversion_amount;
    if (q.max_conversion_amount != null)
      (q as any).max_jeonse_conversion_amount = q.max_conversion_amount;
  }

  pushRange(
    q,
    "min_deposit_per_pyeong",
    "max_deposit_per_pyeong",
    f.depositPerPyeongRange,
    [0, 500],
    includeAliases,
    "deposit_per_pyeong_min",
    "deposit_per_pyeong_max",
    stripDefaults
  );

  pushRange(
    q,
    "min_monthly_rent_per_pyeong",
    "max_monthly_rent_per_pyeong",
    f.monthlyRentPerPyeongRange,
    [0, 20],
    includeAliases,
    "monthly_rent_per_pyeong_min",
    "monthly_rent_per_pyeong_max",
    stripDefaults
  );

  // 면적/연도/날짜
  pushRange(
    q,
    "min_exclusive_area",
    "max_exclusive_area",
    f.areaRange,
    [0, 300],
    includeAliases,
    "exclusive_area_min",
    "exclusive_area_max",
    stripDefaults
  );

  pushRange(
    q,
    "min_construction_year",
    "max_construction_year",
    f.buildYearRange,
    [1970, new Date().getFullYear()],
    includeAliases,
    undefined,
    undefined,
    stripDefaults
  );

  if (Array.isArray(f.dateRange) && f.dateRange.length >= 2) {
    const from = String(f.dateRange[0] || "").trim();
    const to = String(f.dateRange[1] || "").trim();
    if (from) q.contract_date_from = from;
    if (to) q.contract_date_to = to;
  }

  // 구분/편의
  if (f.rentType && String(f.rentType).trim()) {
    q.rent_type = String(f.rentType).trim();
  }

  // 층확인: 배열 또는 CSV → CSV
  if (f.floorConfirmation && f.floorConfirmation !== "all") {
    const src = Array.isArray(f.floorConfirmation)
      ? f.floorConfirmation
      : String(f.floorConfirmation)
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
    if (Array.isArray(src) && src.length > 0) {
      const mapFloorTokenKr = (v: string): string => {
        switch (v) {
          case "basement":
            return "반지하";
          case "first_floor":
            return "1층";
          case "normal_floor":
            return "일반층";
          case "top_floor":
            return "옥탑";
          default:
            return v;
        }
      };
      const tokens = floorMode === "kr" ? src.map(mapFloorTokenKr) : src;
      q.floor_confirmation = tokens.join(",");
    }
  }

  const elev = toYN(f.elevatorAvailable);
  if (elev) {
    // 표준 Y/N, 필요 시 서버가 true/false도 수용하게끔 별칭 제공
    q.elevator_available = elev;
    if (includeAliases) q.elevator = elev; // 예비 별칭
  }

  // 검색 정규화
  if (f.searchQuery && String(f.searchQuery).trim()) {
    const rawField = String(f.searchField || "all").toLowerCase();
    const query = String(f.searchQuery).trim();
    if (rawField === "address") {
      q.address_search = query;
      q.address_search_type = "road";
      if (includeAliases) q.road_address_search = query;
    } else if (rawField === "jibun_address") {
      q.address_search = query;
      q.address_search_type = "jibun";
      if (includeAliases) q.jibun_address_search = query;
    } else {
      q.address_search = query;
      q.address_search_type = "both";
      if (includeAliases) {
        q.road_address_search = query;
        q.jibun_address_search = query;
      }
    }
  }

  // 선택만 보기 ids (showSelectedOnly=true일 때만 전송)
  if (
    f.showSelectedOnly === true &&
    Array.isArray(f.selectedIds) &&
    f.selectedIds.length > 0
  ) {
    const csv = Array.from(new Set(f.selectedIds.map((x: any) => String(x))))
      .slice(0, maxIds)
      .join(",");
    if (csv) q.ids = csv;
  }

  // 정렬
  const ordering = normalizeOrdering(opts?.sortBy, opts?.sortOrder);
  if (ordering) q.ordering = ordering;

  // 개발 편의 로깅(필요 시)
  try {
    // eslint-disable-next-line no-console
    console.log("🔵 [rent buildFilterParams] params:", q);
  } catch {}

  return q;
}
