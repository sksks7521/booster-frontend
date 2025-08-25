"use client";
import * as React from "react";
import {
  PALETTE,
  DEFAULT_THRESHOLDS,
  type Thresholds,
  formatLegendLines,
} from "@/lib/map/config";
import { useFilterStore } from "@/store/filterStore";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface MapLegendProps {
  thresholds?: Thresholds;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function MapLegend({
  thresholds = DEFAULT_THRESHOLDS,
  collapsed,
  onToggle,
}: MapLegendProps) {
  const storeThresholds = useFilterStore((s) => s.thresholds);
  const setThresholds = useFilterStore((s) => s.setThresholds);
  const storePalette = useFilterStore((s) => s.palette);
  const setPalette = useFilterStore((s) => s.setPalette);
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(!!collapsed);
  const [editing, setEditing] = React.useState(false);
  const initialThresholds: number[] = Array.isArray(storeThresholds)
    ? storeThresholds
    : thresholds;
  const [localThresholds, setLocalThresholds] = React.useState<number[]>([
    ...initialThresholds,
  ]);
  const isNonDecreasing = React.useMemo(() => {
    for (let i = 1; i < localThresholds.length; i++) {
      if (localThresholds[i - 1] > localThresholds[i]) return false;
    }
    return true;
  }, [localThresholds]);
  // 색상 로컬 상태(편집 UI) - 구간 수(thresholds + 1)에 맞춤
  const defaultColorOrder = [
    (storePalette && storePalette.blue) || PALETTE.blue,
    (storePalette && storePalette.green) || PALETTE.green,
    (storePalette && storePalette.pink) || PALETTE.pink,
    (storePalette && storePalette.orange) || PALETTE.orange,
    (storePalette && storePalette.red) || PALETTE.red,
  ];
  const ensureColorsLength = (n: number, base: string[]) => {
    const arr = [...base];
    while (arr.length < n) arr.push(arr[arr.length - 1] || PALETTE.red);
    return arr.slice(0, n);
  };
  const [localColors, setLocalColors] = React.useState<string[]>(
    ensureColorsLength(initialThresholds.length + 1, defaultColorOrder)
  );
  React.useEffect(() => {
    if (typeof collapsed === "boolean") setIsCollapsed(collapsed);
  }, [collapsed]);

  const effective = (storeThresholds ?? thresholds) as Thresholds;
  const lines = formatLegendLines(effective);
  const handleToggle = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    onToggle?.();
  };
  const SWATCHES = [
    "#ef4444", // red
    "#f59e0b", // orange
    "#fbbf24", // yellow
    "#16a34a", // green
    "#2563eb", // blue
    "#ec4899", // pink
    "#64748b", // gray
  ];
  const SwatchPicker: React.FC<{
    value: string;
    onPick: (c: string) => void;
  }> = ({ value, onPick }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="색상 선택"
          className="h-6 w-6 rounded border shadow-inner"
          style={{ background: value }}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-fit p-2">
        <div className="grid grid-cols-7 gap-2">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              className={`h-6 w-6 rounded border ${
                value === c ? "ring-2 ring-black/30" : ""
              }`}
              style={{ background: c }}
              onClick={() => onPick(c)}
              title={c}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
  const saveThresholds = () => {
    setThresholds(localThresholds);
    // 첫 5개 색을 팔레트 키에 매핑하여 저장
    setPalette({
      blue: localColors[0] || defaultColorOrder[0],
      green: localColors[1] || defaultColorOrder[1],
      pink: localColors[2] || defaultColorOrder[2],
      orange: localColors[3] || defaultColorOrder[3],
      red: localColors[4] || defaultColorOrder[4],
    });
    setEditing(false);
  };
  const cancelEdit = () => {
    setLocalThresholds([...initialThresholds]);
    setLocalColors(
      ensureColorsLength(initialThresholds.length + 1, defaultColorOrder)
    );
    setEditing(false);
  };

  return (
    <div
      className="absolute top-3 right-3 z-10 select-none"
      aria-label="지도 범례: 최저가(만원) 구간과 마커 숫자 의미 안내"
    >
      <div className="rounded-xl border border-black/10 bg-white/80 backdrop-blur px-3.5 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.08)] text-[12px] text-gray-800 max-w-[280px]">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-[13px] tracking-tight">
            최저가 범례(단위: 만원)
          </div>
          <div className="flex items-center gap-1">
            <button
              className="text-xs text-gray-600 hover:text-gray-900 px-1 py-0.5 rounded hover:bg-black/5"
              onClick={() => setEditing((v) => !v)}
              aria-label={editing ? "범례 설정 닫기" : "범례 설정 열기"}
              title={editing ? "범례 설정 닫기" : "범례 설정"}
            >
              범례 설정
            </button>
            <button
              className="text-xs text-gray-600 hover:text-gray-900 px-1 py-0.5 rounded hover:bg-black/5"
              onClick={handleToggle}
              aria-pressed={isCollapsed}
              aria-label={isCollapsed ? "범례 펼치기" : "범례 접기"}
              title={isCollapsed ? "펼치기" : "접기"}
            >
              {isCollapsed ? "펼치기" : "접기"}
            </button>
          </div>
        </div>
        {editing && (
          <div className="mt-2 border border-black/10 rounded-lg p-2 bg-white/90">
            <div className="mb-2 flex items-center gap-3 text-[12px]">
              <span>구간 수</span>
              <ToggleGroup
                type="single"
                value={String(localThresholds.length)}
                onValueChange={(v) => {
                  if (!v) return;
                  const n = Math.max(0, Math.min(4, Number(v)));
                  const sorted = [...localThresholds].sort((a, b) => a - b);
                  const next = sorted.slice(0, n);
                  while (next.length < n) {
                    const last = next[next.length - 1];
                    if (typeof last === "number" && !isNaN(last)) {
                      next.push(last + 5000);
                    } else {
                      const k = next.length - sorted.length + 1;
                      next.push(5000 * (k <= 0 ? 1 : k));
                    }
                  }
                  setLocalThresholds(next);
                  const targetColorsLen = n + 1;
                  const base = localColors.slice(
                    0,
                    Math.min(localColors.length, targetColorsLen)
                  );
                  const used = new Set(base);
                  const suggested = (() => {
                    if (base.length >= targetColorsLen) return base;
                    const expanded = base.slice();
                    const pool = [
                      "#ef4444",
                      "#f59e0b",
                      "#fbbf24",
                      "#16a34a",
                      "#2563eb",
                      "#ec4899",
                      "#64748b",
                    ].filter((c) => !used.has(c));
                    // shuffle
                    for (let i = pool.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [pool[i], pool[j]] = [pool[j], pool[i]];
                    }
                    let idx = 0;
                    while (expanded.length < targetColorsLen) {
                      expanded.push(
                        pool[idx++] ||
                          [
                            "#ef4444",
                            "#f59e0b",
                            "#fbbf24",
                            "#16a34a",
                            "#2563eb",
                            "#ec4899",
                            "#64748b",
                          ][(expanded.length - base.length) % 7]
                      );
                    }
                    return expanded;
                  })();
                  setLocalColors(suggested);
                }}
                className="border rounded"
              >
                {[0, 1, 2, 3, 4].map((n) => (
                  <ToggleGroupItem
                    key={n}
                    value={String(n)}
                    className="px-1.5 py-0.5 text-[11px]"
                  >
                    {n}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            {localThresholds.map((t, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1 mb-1"
              >
                <SwatchPicker
                  value={localColors[idx]}
                  onPick={(c) => {
                    const arr = [...localColors];
                    arr[idx] = c;
                    setLocalColors(arr);
                  }}
                />
                <span className="text-[12px] text-gray-800">{`≤ ${t.toLocaleString()} 만원`}</span>
                <input
                  className={`border rounded px-1 py-0.5 text-[12px] w-24 ${
                    idx > 0 && localThresholds[idx - 1] > t
                      ? "border-red-500"
                      : ""
                  }`}
                  type="number"
                  step={1000}
                  min={0}
                  value={t}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    const arr = [...localThresholds];
                    arr[idx] = v;
                    setLocalThresholds(arr);
                  }}
                />
              </div>
            ))}
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 mt-1">
              <SwatchPicker
                value={localColors[localThresholds.length]}
                onPick={(c) => {
                  const arr = ensureColorsLength(
                    localThresholds.length + 1,
                    localColors
                  );
                  arr[localThresholds.length] = c;
                  setLocalColors(arr);
                }}
              />
              <span className="text-[12px] text-gray-800">
                {localThresholds.length > 0
                  ? `> ${localThresholds[
                      localThresholds.length - 1
                    ].toLocaleString()} 만원`
                  : `> 미설정`}
              </span>
            </div>
            {/* 프리셋 제거 (요청에 따라) */}
            {!isNonDecreasing && (
              <div className="mt-2 text-[11px] text-red-600">
                t1 ≤ t2 ≤ t3 ≤ t4 규칙을 만족해야 합니다. 각 숫자는 다음
                숫자보다 크지 않게 입력하세요.
              </div>
            )}
            <div className="mt-2 flex justify-end gap-2">
              <button
                className="text-xs px-2 py-1 rounded border"
                onClick={cancelEdit}
              >
                취소
              </button>
              <button
                className={`text-xs px-2 py-1 rounded ${
                  isNonDecreasing
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
                onClick={saveThresholds}
                disabled={!isNonDecreasing}
              >
                확인
              </button>
            </div>
          </div>
        )}
        {!isCollapsed && !editing && (
          <div className="mt-2">
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1">
              {lines.map((text, i) => (
                <React.Fragment key={i}>
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{
                      background:
                        [
                          PALETTE.blue,
                          PALETTE.green,
                          PALETTE.pink,
                          PALETTE.orange,
                          PALETTE.red,
                        ][i] || PALETTE.red,
                    }}
                  />
                  <span className="text-[12px] text-gray-800">{text}</span>
                </React.Fragment>
              ))}
            </div>
            <div className="my-2 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <div className="text-[11px] leading-snug text-gray-600">
              네모박스 숫자 예) <span className="font-semibold">40</span> =
              최저가/감정가 40~49%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapLegend;
