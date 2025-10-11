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

function pickFirst<T = any>(...vals: any[]): T | undefined {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== "") return v as T;
  }
  return undefined;
}

/**
 * 실거래가(전월세) 팝업 스키마
 * 현재는 매매 스키마를 그대로 복사하여 사용합니다.
 * 이후 전월세 전용 컬럼으로 단계적으로 조정합니다.
 */
export function rentSchema(
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
    (pickFirst(
      buildingInfo?.address,
      buildingInfo?.roadAddress,
      buildingInfo?.extra?.roadAddressReal,
      buildingInfo?.road_address_real,
      buildingInfo?.jibun_address
    ) as string) || "주소 정보 없음";

  // 부제목: 건물명
  const buildingName =
    (pickFirst(
      buildingInfo?.extra?.buildingName,
      buildingInfo?.extra?.buildingNameReal,
      buildingInfo?.building_name_real,
      buildingInfo?.building_name
    ) as string) || "";
  const subtitle = buildingName || "";

  // 건물 공통 정보
  const rows: PopupRow[] = [
    {
      label: "건물명",
      value: safeValue(
        pickFirst(
          buildingInfo?.extra?.buildingName,
          buildingInfo?.building_name
        )
      ),
    },
    {
      label: "건물명(실제)",
      value: safeValue(
        pickFirst(
          buildingInfo?.extra?.buildingNameReal,
          buildingInfo?.building_name_real
        )
      ),
    },
    {
      label: "지번주소",
      value: safeValue(
        pickFirst(
          buildingInfo?.extra?.jibunAddress,
          buildingInfo?.jibun_address
        )
      ),
    },
    {
      label: "건축연도",
      value: pickFirst(
        buildingInfo?.extra?.constructionYear,
        buildingInfo?.buildYear,
        buildingInfo?.extra?.constructionYearReal,
        buildingInfo?.construction_year_real,
        buildingInfo?.construction_year
      )
        ? `${safeValue(
            pickFirst(
              buildingInfo?.extra?.constructionYear,
              buildingInfo?.buildYear,
              buildingInfo?.extra?.constructionYearReal,
              buildingInfo?.construction_year_real,
              buildingInfo?.construction_year
            )
          )}년`
        : "-",
    },
    {
      label: "엘리베이터",
      value: elevatorText(
        pickFirst(
          buildingInfo?.extra?.elevatorAvailable,
          buildingInfo?.elevator_available
        )
      ),
    },
    {
      label: "총 거래 건수",
      value: `${transactions.length}건`,
    },
  ];

  // 개별 거래 테이블(전월세 전용 컬럼 구성)
  const table = {
    headers: [
      "전월세구분",
      "계약구분",
      "계약연도",
      "계약월",
      "계약기간",
      "계약기간(년)",
      "보증금(만원)",
      "월세금(만원)",
      "전월세전환금(만원)",
      "층",
      "층확인",
      "평당보증금(만원)",
      "평당월세(만원)",
    ],
    rows: transactions.map((t: any) => {
      const rentType = safeValue(pickFirst(t?.extra?.rentType, t?.rent_type));
      const contractType = safeValue(
        pickFirst(t?.extra?.contractType, t?.contract_type)
      );
      const contractYear = safeValue(
        pickFirst(t?.extra?.contractYear, t?.contract_year)
      );
      const contractMonth = safeValue(
        pickFirst(t?.extra?.contractMonth, t?.contract_month)
      );
      const contractPeriod = safeValue(
        pickFirst(t?.extra?.contractPeriod, t?.contract_period)
      );
      const contractPeriodYears = safeValue(
        pickFirst(t?.extra?.contractPeriodYears, t?.contract_period_years)
      );
      const depositAmount = formatMoney(
        pickFirst(t?.extra?.depositAmount, t?.deposit_amount, t?.deposit)
      );
      const monthlyRent = formatMoney(
        pickFirst(t?.extra?.monthlyRent, t?.monthly_rent)
      );
      const jeonseConversionAmount = formatMoney(
        pickFirst(t?.extra?.jeonseConversionAmount, t?.jeonse_conversion_amount)
      );
      const floorInfoReal = safeValue(
        pickFirst(t?.extra?.floorInfoReal, t?.floor_info_real)
      );
      const floorConfirmation = safeValue(
        pickFirst(t?.extra?.floorConfirmation, t?.floor_confirmation)
      );
      const depositPerPyeong = safeValue(
        pickFirst(t?.extra?.depositPerPyeong, t?.deposit_per_pyeong)
      );
      const monthlyRentPerPyeong = safeValue(
        pickFirst(t?.extra?.monthlyRentPerPyeong, t?.monthly_rent_per_pyeong)
      );

      return [
        rentType,
        contractType,
        contractYear,
        contractMonth,
        contractPeriod,
        contractPeriodYears,
        depositAmount,
        monthlyRent,
        jeonseConversionAmount,
        floorInfoReal,
        floorConfirmation,
        depositPerPyeong,
        monthlyRentPerPyeong,
      ];
    }),
  };

  // 액션 버튼
  const actions = [{ label: "주소 복사", action: "copy-addr" }];

  return { title, subtitle, rows, table, actions };
}
