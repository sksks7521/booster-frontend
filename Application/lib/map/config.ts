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

// 지도 페치 가드/디바운스 환경 설정 (NEXT_PUBLIC_* 로 주입)
export const MAP_GUARD = {
  // 최소 줌 레벨(이상 시 서버 페치 억제). 예: 9
  minFetchLevel: Number(process.env.NEXT_PUBLIC_MAP_MIN_FETCH_LEVEL ?? 9),
  // 바운즈 면적 상한(㎢). 예: 1500
  maxFetchAreaKm2: Number(process.env.NEXT_PUBLIC_MAP_MAX_AREA_KM2 ?? 1500),
  // 지도에 동시에 표시할 마커 개수 상한. 예: 1500
  maxMarkers: Number(process.env.NEXT_PUBLIC_MAP_MAX_MARKERS ?? 1500),
  // 바운즈 변경 이벤트 디바운스(ms). 예: 300
  boundsDebounceMs: Number(
    process.env.NEXT_PUBLIC_MAP_BOUNDS_DEBOUNCE_MS ?? 300
  ),
  // 클러스터 정책 적용 디바운스(ms). 예: 200
  clusterPolicyDebounceMs: Number(
    process.env.NEXT_PUBLIC_MAP_CLUSTER_DEBOUNCE_MS ?? 200
  ),
} as const;

// 백엔드가 허용하는 페이지 사이즈(한 요청당 최대 개수) 상한
// 대량 로딩 시 이 값 이내로 분할 요청 권장
export const BACKEND_MAX_PAGE_SIZE: number = Number(
  process.env.NEXT_PUBLIC_MAP_BACKEND_MAX_PAGE_SIZE ?? 500
);
