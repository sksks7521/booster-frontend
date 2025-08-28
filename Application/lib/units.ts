export type Rounding = "floor" | "ceil" | "round";

const PYEONG_PER_M2 = 0.3025; // 1㎡ = 0.3025평 (정확도 기준)

export function m2ToPyeong(
  m2?: number,
  rounding: Rounding = "round",
  digits = 1
): number | undefined {
  if (m2 == null || !Number.isFinite(m2)) return undefined;
  const raw = m2 * PYEONG_PER_M2;
  const factor = Math.pow(10, digits);
  const val =
    rounding === "floor"
      ? Math.floor(raw * factor) / factor
      : rounding === "ceil"
      ? Math.ceil(raw * factor) / factor
      : Math.round(raw * factor) / factor;
  return val;
}

export function formatArea(
  m2?: number,
  opts?: { rounding?: Rounding; digits?: number; withBoth?: boolean }
): string {
  if (m2 == null || !Number.isFinite(m2)) return "-";
  const d = opts?.digits ?? 1;
  const r = opts?.rounding ?? "round";
  if (opts?.withBoth) {
    const py = m2ToPyeong(m2, r, d);
    return `${Number(m2).toFixed(0)}㎡${py != null ? ` (${py}평)` : ""}`;
  }
  return `${Number(m2).toFixed(0)}㎡`;
}
