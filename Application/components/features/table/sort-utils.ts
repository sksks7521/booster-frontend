export type SortOrder = "asc" | "desc" | undefined;

// 정렬 값 추출 함수 (숫자/날짜/문자/계산필드 지원)
function pick(raw: any, key: string): any {
  if (!raw) return undefined;
  if (raw[key] !== undefined) return raw[key];
  const extra = raw?.extra;
  if (extra && extra[key] !== undefined) return extra[key];
  return undefined;
}

function toNumberLoose(v: unknown): number | undefined {
  if (typeof v === "number" && isFinite(v)) return v;
  if (typeof v === "string") {
    const s = v.replace(/,/g, "").replace(/%$/, "").trim();
    const n = Number(s);
    return isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function getSortValue(row: any, sortBy: string): any {
  // 계산 필드: 최저가/공시가격 비율
  if (sortBy === "calculated_ratio") {
    const minBid = toNumberLoose(pick(row, "minimum_bid_price")) ?? 0;
    const publicPrice = toNumberLoose(pick(row, "public_price")) ?? 0;
    if (!isFinite(minBid) || !isFinite(publicPrice) || publicPrice === 0) {
      return Number.POSITIVE_INFINITY;
    }
    return minBid / publicPrice;
  }

  const value = pick(row, sortBy);

  // 숫자형 컬럼들(대표)
  const n = toNumberLoose(value);
  if (n !== undefined) return n;

  // 날짜형 컬럼들
  if (["sale_date", "approval_date", "use_approval_date"].includes(sortBy)) {
    const ts = new Date((value as any) || 0).getTime();
    return isFinite(ts) ? ts : 0;
  }

  // 날짜 문자열 일반 감지(YYYY-MM-DD 또는 YYYY/MM/DD 등)
  if (typeof value === "string") {
    const s = value.trim();
    if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(s)) {
      const ts = Date.parse(s.replace(/\./g, "-").replace(/\//g, "-"));
      if (isFinite(ts)) return ts;
    }
  }

  // 문자열 기본
  return String(value ?? "").toLowerCase();
}

export function clientSort<T = any>(
  items: T[],
  sortBy?: string,
  sortOrder?: SortOrder
): T[] {
  if (!sortBy || !sortOrder) return items.slice();
  const arr = items.slice();
  arr.sort((a: any, b: any) => {
    const av = getSortValue(a, sortBy);
    const bv = getSortValue(b, sortBy);
    let cmp = 0;
    if (av > bv) cmp = 1;
    if (av < bv) cmp = -1;
    return sortOrder === "desc" ? -cmp : cmp;
  });
  return arr;
}
