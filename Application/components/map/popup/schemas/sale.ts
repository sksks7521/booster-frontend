import { PopupRow } from "../BasePopup";

// 숫자 변환 유틸리티
function toNumberOrU(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = parseFloat(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : undefined;
}

// 금액 포맷 (만원 단위)
function formatMoney(n?: number | string | null): string {
  const v = toNumberOrU(n as any);
  if (v === undefined) return "-";
  return `${Number(v).toLocaleString()}만원`;
}

// 면적 포맷 (㎡)
function formatArea(n?: number | string | null): string {
  const v = toNumberOrU(n as any);
  if (v === undefined) return "-";
  return `${Number(v.toFixed(2))}㎡`;
}

// 평형 포맷
function formatPyeong(n?: number | string | null): string {
  const v = toNumberOrU(n as any);
  if (v === undefined) return "-";
  return `${Number(v.toFixed(2))}평`;
}

// 엘리베이터 여부
function elevatorText(value: unknown): string {
  if (value === true || value === "Y" || value === "O") return "있음 (O)";
  if (value === false || value === "N" || value === "X") return "없음 (X)";
  return "-";
}

// 결측값 안전 처리
function safeValue(value: any, defaultValue: string = "-"): string {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "number" && !isFinite(value))
  ) {
    return defaultValue;
  }
  return String(value);
}

/**
 * 실거래가 팝업 스키마
 * @param buildingInfo - 대표 아이템 (건물 공통 정보)
 * @param transactions - 같은 주소의 모든 거래 내역
 */
export function saleSchema(
  buildingInfo: any,
  transactions: any[]
): {
  title: string;
  subtitle: string;
  rows: PopupRow[];
  table?: {
    headers: string[];
    rows: any[][];
  };
  actions: { label: string; action: string }[];
} {
  // 제목: 도로명주소
  const title =
    buildingInfo?.address ||
    buildingInfo?.roadAddress ||
    buildingInfo?.extra?.roadAddressReal ||
    "주소 정보 없음";

  // 부제목: 건물명
  const buildingName =
    buildingInfo?.extra?.buildingName ||
    buildingInfo?.extra?.buildingNameReal ||
    "";
  const subtitle = buildingName || "";

  // 건물 공통 정보
  const rows: PopupRow[] = [
    {
      label: "건물명",
      value: safeValue(buildingInfo?.extra?.buildingName),
    },
    {
      label: "건물명(실제)",
      value: safeValue(buildingInfo?.extra?.buildingNameReal),
    },
    {
      label: "지번주소",
      value: safeValue(buildingInfo?.extra?.jibunAddress),
    },
    {
      label: "건축연도",
      value:
        buildingInfo?.extra?.constructionYear ||
        buildingInfo?.buildYear ||
        buildingInfo?.extra?.constructionYearReal
          ? `${safeValue(
              buildingInfo?.extra?.constructionYear ||
                buildingInfo?.buildYear ||
                buildingInfo?.extra?.constructionYearReal
            )}년`
          : "-",
    },
    {
      label: "엘리베이터",
      value: elevatorText(buildingInfo?.extra?.elevatorAvailable),
    },
    {
      label: "총 거래 건수",
      value: `${transactions.length}건`,
    },
  ];

  // 개별 거래 테이블
  const table = {
    headers: [
      "동명",
      "계약연도",
      "계약월",
      "전용면적(㎡)",
      "대지권면적(㎡)",
      "거래금액(만원)",
      "평단가(만원)",
      "층",
      "층확인",
    ],
    rows: transactions.map((t: any) => {
      const dongName = safeValue(t?.extra?.dongName);
      const contractYear = safeValue(t?.extra?.contractYear);
      const contractMonth = safeValue(t?.extra?.contractMonth);
      const exclusiveAreaSqm =
        toNumberOrU(t?.extra?.exclusiveAreaSqm ?? t?.area) !== undefined
          ? (
              toNumberOrU(t?.extra?.exclusiveAreaSqm ?? t?.area) as number
            ).toFixed(2)
          : "-";
      const landRightsAreaSqm =
        toNumberOrU(t?.extra?.landRightsAreaSqm) !== undefined
          ? (toNumberOrU(t?.extra?.landRightsAreaSqm) as number).toFixed(2)
          : "-";
      const price =
        toNumberOrU(t?.price ?? t?.extra?.transactionAmount) !== undefined
          ? (
              toNumberOrU(t?.price ?? t?.extra?.transactionAmount) as number
            ).toLocaleString()
          : "-";
      const pricePerPyeong = safeValue(t?.extra?.pricePerPyeong);
      const floorInfoReal = safeValue(t?.extra?.floorInfoReal);
      const floorConfirmation = safeValue(t?.extra?.floorConfirmation);

      return [
        dongName,
        contractYear,
        contractMonth,
        exclusiveAreaSqm,
        landRightsAreaSqm,
        price,
        pricePerPyeong,
        floorInfoReal,
        floorConfirmation,
      ];
    }),
  };

  // 액션 버튼
  const actions = [{ label: "주소 복사", action: "copy-addr" }];

  return { title, subtitle, rows, table, actions };
}
