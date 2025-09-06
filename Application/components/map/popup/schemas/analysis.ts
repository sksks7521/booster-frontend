import { PopupRow } from "../BasePopup";

function toNumberOrU(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = parseFloat(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : undefined;
}

function formatMoney(n?: number | string | null): string {
  const v = toNumberOrU(n as any);
  if (v === undefined) return "-";
  return `${Number(v).toLocaleString()}만원`;
}

function formatPercent(n?: number | string | null): string {
  const v = toNumberOrU(n as any);
  if (v === undefined) return "-";
  return `${Number(v).toLocaleString()}%`;
}

function yesNo(value: unknown): string {
  const s = String(value ?? "").toUpperCase();
  if (["Y", "O", "TRUE", "1"].includes(s)) return "Y";
  if (["N", "X", "FALSE", "0"].includes(s)) return "N";
  return s ? String(value) : "";
}

export function analysisSchema(item: any): {
  title: string;
  subtitle: string;
  rows: PopupRow[];
  actions: { label: string; action: string }[];
} {
  const usage = item?.usage ?? item?.extra?.usage ?? "";
  const caseNumber = item?.case_number ?? item?.extra?.caseNumber ?? "";
  const title = `${usage} ${caseNumber}`.trim() || String(item?.id ?? "");
  const subtitle =
    item?.road_address ?? item?.address ?? item?.extra?.roadAddress ?? "";

  // 기존 분석 팝업에 노출되던 항목 구성
  const rows: PopupRow[] = [
    {
      label: "감정가",
      value: formatMoney(item?.appraised_value ?? item?.extra?.appraisedValue),
    },
    {
      label: "최저가",
      value: formatMoney(
        item?.minimum_bid_price ?? item?.extra?.minimumBidPrice
      ),
    },
    {
      label: "최저가/감정가",
      value: formatPercent(
        item?.bid_to_appraised_ratio ?? item?.extra?.bidToAppraisedRatio
      ),
    },
    {
      label: "현재상태",
      value: item?.current_status ?? item?.extra?.currentStatus ?? "",
    },
    {
      label: "매각기일",
      value: item?.sale_date ?? item?.extra?.saleDate ?? "-",
    },
    {
      label: "공시가격",
      value: formatMoney(item?.public_price ?? item?.extra?.publicPrice),
    },
    {
      label: "최저가/공시가격",
      value: (() => {
        const minV = toNumberOrU(
          item?.minimum_bid_price ?? item?.extra?.minimumBidPrice
        );
        const pubV = toNumberOrU(
          item?.public_price ?? item?.extra?.publicPrice
        );
        if (!minV || !pubV) return "-";
        const r = (minV / pubV) * 100;
        return Number.isFinite(r) ? `${r.toFixed(1)}%` : "-";
      })(),
    },
    {
      label: "건물평형",
      value: (() => {
        const v = item?.building_area_pyeong ?? item?.extra?.buildingAreaPyeong;
        if (v === undefined || v === "") return "";
        const n = toNumberOrU(v);
        return n !== undefined ? `${Math.floor(n)}평` : String(v);
      })(),
    },
    {
      label: "층확인",
      value: item?.floor_confirmation ?? item?.extra?.floorConfirmation ?? "",
    },
    {
      label: "Elevator",
      value: yesNo(item?.elevator_available ?? item?.extra?.elevatorAvailable),
    },
    {
      label: "건축연도",
      value: (() => {
        const y = item?.construction_year ?? item?.extra?.constructionYear;
        if (y === undefined || y === "") return "";
        const n = toNumberOrU(y);
        return n !== undefined ? `${Math.floor(n)}년` : String(y);
      })(),
    },
    {
      label: "특수조건",
      value: (() => {
        // 기존 분석 팝업은 여러 불리언 플래그를 조합해 표시
        const text = String(
          item?.special_rights ?? item?.extra?.specialRights ?? ""
        ).trim();
        if (text) return text;
        const keys = [
          "tenant_with_opposing_power",
          "hug_acquisition_condition_change",
          "senior_lease_right",
          "resale",
          "partial_sale",
          "joint_collateral",
          "separate_registration",
          "lien",
          "illegal_building",
          "lease_right_sale",
          "land_right_unregistered",
        ];
        const labelMap: Record<string, string> = {
          tenant_with_opposing_power: "대항력있는임차인",
          hug_acquisition_condition_change: "HUG인수조건변경",
          senior_lease_right: "선순위임차권",
          resale: "재매각",
          partial_sale: "지분매각",
          joint_collateral: "공동담보",
          separate_registration: "별도등기",
          lien: "유치권",
          illegal_building: "위반건축물",
          lease_right_sale: "전세권매각",
          land_right_unregistered: "대지권미등기",
        };
        const yes = (v: any) => {
          if (typeof v === "boolean") return v;
          const s = String(v).toUpperCase();
          return ["Y", "O", "TRUE", "1"].includes(s);
        };
        const picked = keys
          .filter((k) => yes((item as any)[k] ?? (item?.extra as any)?.[k]))
          .map((k) => labelMap[k]);
        return picked.length ? picked.join(", ") : "";
      })(),
    },
  ];

  const actions = [
    { label: "주소 복사", action: "copy-addr" },
    { label: "사건번호 복사", action: "copy-case" },
  ];

  return { title, subtitle, rows, actions };
}
