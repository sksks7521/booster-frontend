import type { ItemLike } from "@/types/datasets";

function toFiniteNumber(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

export function normalizeItemLike(raw: any): ItemLike | null {
  const id = String(raw?.id ?? "").trim();
  if (!id) return null;

  const address = (raw?.address ?? "").toString().trim();
  const price = toFiniteNumber(raw?.price);
  const area = toFiniteNumber(raw?.area);
  const buildYear = toFiniteNumber(raw?.buildYear);
  const lat = toFiniteNumber(raw?.lat);
  const lng = toFiniteNumber(raw?.lng);

  const item: ItemLike = {
    id,
    address,
    price,
    area,
    buildYear,
    lat,
    lng,
    extra: raw?.extra ?? undefined,
  };

  // 좌표 유효성: 위도[-90,90], 경도[-180,180]
  if (item.lat !== undefined && (item.lat < -90 || item.lat > 90))
    item.lat = undefined;
  if (item.lng !== undefined && (item.lng < -180 || item.lng > 180))
    item.lng = undefined;

  return item;
}

export function roundBounds(
  filters: Record<string, unknown>
): Record<string, unknown> {
  const f = { ...filters } as any;
  const keys = ["south", "west", "north", "east"] as const;
  for (const k of keys) {
    if (f[k] != null) {
      const n = toFiniteNumber(f[k]);
      if (n === undefined) delete f[k];
      else f[k] = Number(n.toFixed(4));
    }
  }
  if (f.radius_km != null) {
    const r = toFiniteNumber(f.radius_km) ?? 0;
    f.radius_km = Math.max(0.1, Math.min(10, r));
  }
  return f;
}

export function isValidBounds(f: Record<string, unknown>): boolean {
  const s = toFiniteNumber((f as any).south);
  const w = toFiniteNumber((f as any).west);
  const n = toFiniteNumber((f as any).north);
  const e = toFiniteNumber((f as any).east);
  if (s === undefined || w === undefined || n === undefined || e === undefined)
    return true; // bounds 미사용
  if (s < -90 || n > 90 || w < -180 || e > 180) return false;
  if (n <= s || e <= w) return false;
  // 면적 상한 검사(약 1,500㎢)
  const latMid = (s + n) / 2;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const heightKm = (n - s) * 111.0;
  const widthKm = (e - w) * 111.0 * Math.cos(toRad(latMid));
  const areaKm2 = Math.abs(widthKm * heightKm);
  if (Number.isFinite(areaKm2) && areaKm2 > 1500) return false;
  return true;
}

export function sanitizeFilters(filters: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string") {
      const s = v.trim();
      if (s === "") continue;
      out[k] = s;
      continue;
    }
    out[k] = v;
  }
  return out;
}
