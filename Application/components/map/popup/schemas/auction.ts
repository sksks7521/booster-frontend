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

export function auctionSchema(item: any): {
  title: string;
  subtitle: string;
  rows: PopupRow[];
  actions: { label: string; action: string }[];
} {
  const usage = item?.usage ?? item?.extra?.usage ?? "";
  const caseNumber = item?.case_number ?? item?.extra?.caseNumber ?? "";
  const title = `${usage} ${caseNumber}`.trim();
  const subtitle =
    item?.general_location ??
    item?.extra?.generalLocation ??
    item?.address ??
    item?.road_address ??
    ""; // 소재지

  // 비율 필드가 없으면 계산 시도
  const saleToAppRatio =
    (item?.sale_to_appraised_ratio ?? item?.extra?.saleToAppraisedRatio) != null
      ? item?.sale_to_appraised_ratio ?? item?.extra?.saleToAppraisedRatio
      : (() => {
          const sale = toNumberOrU(
            (item?.final_sale_price ?? item?.extra?.finalSalePrice) as any
          );
          const app = toNumberOrU(
            (item?.appraised_value ?? item?.extra?.appraisedValue) as any
          );
          if (!app || !sale) return undefined;
          const r = (sale / app) * 100;
          return Number.isFinite(r) ? Number(r.toFixed(1)) : undefined;
        })();

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
      label: "매각가",
      value: formatMoney(item?.final_sale_price ?? item?.extra?.finalSalePrice),
    },
    {
      label: "매각가/감정가",
      value: saleToAppRatio != null ? formatPercent(saleToAppRatio) : "-",
    },
    {
      label: "응찰인원",
      value:
        (item?.bidder_count ?? item?.extra?.bidderCount) != null
          ? String(item?.bidder_count ?? item?.extra?.bidderCount)
          : "-",
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
      label: "건물평형",
      value:
        (item?.building_area_pyeong ?? item?.extra?.buildingAreaPyeong) !=
          null &&
        (item?.building_area_pyeong ?? item?.extra?.buildingAreaPyeong) !== ""
          ? `${Math.floor(
              parseFloat(
                String(
                  item?.building_area_pyeong ?? item?.extra?.buildingAreaPyeong
                )
              )
            )}평`
          : "",
    },
    {
      label: "토지평형",
      value:
        (item?.land_area_pyeong ?? item?.extra?.landAreaPyeong) != null &&
        (item?.land_area_pyeong ?? item?.extra?.landAreaPyeong) !== ""
          ? `${Math.floor(
              parseFloat(
                String(item?.land_area_pyeong ?? item?.extra?.landAreaPyeong)
              )
            )}평`
          : "",
    },
    {
      label: "층확인",
      value:
        item?.floor_confirmation ??
        item?.extra?.floorConfirmation ??
        item?.floor_info ??
        "",
    },
    {
      label: "Elevator",
      value: yesNo(item?.elevator_available ?? item?.extra?.elevatorAvailable),
    },
    {
      label: "건축연도",
      value:
        (item?.construction_year ?? item?.extra?.constructionYear) != null &&
        (item?.construction_year ?? item?.extra?.constructionYear) !== ""
          ? `${Math.floor(
              parseFloat(
                String(item?.construction_year ?? item?.extra?.constructionYear)
              )
            )}년`
          : "",
    },
    {
      label: "특수조건",
      value: String(item?.special_rights ?? item?.extra?.specialRights ?? ""),
    },
  ];

  const actions = [
    { label: "주소 복사", action: "copy-addr" },
    { label: "사건번호 복사", action: "copy-case" },
  ];

  return { title, subtitle, rows, actions };
}
