// 공통 지도 설정 상수 (KakaoMap 기준)
// - Threshold: 최저가(만원) 구간 경계
// - Palette: 마커/범례 공통 색상

export const DEFAULT_THRESHOLDS: number[] = [6000, 8000, 10000, 13000];

export const PALETTE = {
  blue: "#2563eb",
  green: "#16a34a",
  pink: "#ec4899",
  orange: "#f59e0b",
  red: "#ef4444",
  grey: "#64748b",
} as const;

export type Thresholds = number[]; // length 1..5 supported

export function formatLegendLines(thresholds: number[]): string[] {
  const lines: string[] = [];
  const sorted = [...thresholds].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    lines.push(`≤ ${sorted[i].toLocaleString()} 만원`);
  }
  if (sorted.length > 0) {
    const last = sorted[sorted.length - 1];
    lines.push(`> ${last.toLocaleString()} 만원`);
  }
  return lines;
}

// Default ordered palette for ranges; when thresholds has N items, need N+1 colors
export const DEFAULT_PALETTE_ORDER: string[] = [
  PALETTE.blue,
  PALETTE.green,
  PALETTE.pink,
  PALETTE.orange,
  PALETTE.red,
];
