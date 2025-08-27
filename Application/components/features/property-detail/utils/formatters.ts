export function formatCurrencyManwon(value: number | undefined | null): string {
  const n = typeof value === "number" && isFinite(value) ? value : 0;
  return `${new Intl.NumberFormat("ko-KR").format(n)}만원`;
}

export function formatPercent1(value: number | undefined | null): string {
  const n = typeof value === "number" && isFinite(value) ? value : 0;
  return `${n.toFixed(1)}%`;
}

export function formatFixed1(value: number | undefined | null): string {
  const n = typeof value === "number" && isFinite(value) ? value : 0;
  return n.toFixed(1);
}

export function formatDateYmd(value: string | undefined | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (String(d) === "Invalid Date") return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function calcDDay(value: string | undefined | null): number | null {
  if (!value) return null;
  const d = new Date(value);
  if (String(d) === "Invalid Date") return null;
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function statusBadgeClasses(status?: string): string {
  if (!status) return "bg-gray-100 text-gray-700";
  const s = status.toLowerCase();
  if (s.startsWith("유찰")) return "bg-orange-100 text-orange-700";
  if (s.includes("신건")) return "bg-blue-100 text-blue-700";
  if (s.includes("낙찰")) return "bg-green-100 text-green-700";
  if (s.includes("재진행")) return "bg-indigo-100 text-indigo-700";
  if (s.includes("변경")) return "bg-amber-100 text-amber-800";
  if (s.includes("취하")) return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
}

export function pyeongToM2(value: number | undefined | null): number {
  const n = typeof value === "number" && isFinite(value) ? value : 0;
  return n * 3.3058;
}

export function formatSquareMeter(value: number | undefined | null): string {
  const n = typeof value === "number" && isFinite(value) ? value : 0;
  return `${n.toFixed(1)}㎡`;
}
