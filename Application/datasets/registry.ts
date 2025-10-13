import { DatasetConfig, DatasetId } from "@/types/datasets";
import {
  columnsAuctionEd,
  columnsSale,
  columnsRent,
  columnsListings,
} from "@/datasets/contracts";
import { auctionApi, realTransactionApi, realRentApi } from "@/lib/api";

// 공통 정규화 유틸
const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = parseFloat(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : undefined;
};

const pickFirst = (...values: unknown[]) =>
  values.find((v) => v !== undefined && v !== null);

const extractAddress = (r: any): string =>
  (pickFirst(
    r?.address,
    r?.road_address,
    r?.road_address_real,
    r?.full_address,
    r?.jibun_address,
    r?.addr
  ) as string) || "";

const extractAreaM2 = (r: any): number | undefined =>
  toNumber(
    pickFirst(
      r?.area,
      r?.exclusive_area_sqm,
      r?.exclusive_area_m2,
      r?.area_sqm,
      r?.area_m2,
      r?.supply_area_sqm,
      r?.supply_area_m2
    )
  );

const extractBuildYear = (r: any): number | undefined =>
  toNumber(
    pickFirst(
      r?.buildYear,
      r?.build_year,
      r?.construction_year,
      r?.construction_year_real,
      r?.year_built,
      r?.completion_year,
      r?.built_year
    )
  );

// 정렬 키 매핑: camelCase → snake_case (백엔드 정렬 파라미터 요구 형식)
const camelToSnake = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  return value.replace(/([A-Z])/g, "_$1").toLowerCase();
};

const extractLatLng = (r: any): { lat?: number; lng?: number } => {
  const latRaw = pickFirst(
    r?.lat,
    r?.latitude,
    r?.lat_y,
    r?.y,
    r?.LAT,
    r?.lat_center
  );
  const lngRaw = pickFirst(
    r?.lng,
    r?.longitude,
    r?.lon,
    r?.x,
    r?.LONG,
    r?.LNG,
    r?.lng_center
  );
  let lat = toNumber(latRaw);
  let lng = toNumber(lngRaw);
  if (lat !== undefined && lng !== undefined) {
    // 좌표 스왑 보정: lat는 [-90,90], lng는 [-180,180]
    if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
      const t = lat;
      lat = lng;
      lng = t;
    }
  }
  return { lat, lng };
};

// 허용된 필드만 유지하는 간단 화이트리스트 빌더
const pickAllowed = (
  src: Record<string, unknown> | undefined,
  allowed: readonly string[]
) => {
  const out: Record<string, unknown> = {};
  if (!src) return out;
  for (const k of allowed) {
    if (src[k] !== undefined) out[k] = src[k];
  }
  return out;
};

// 중앙 허용 필터 목록
const ALLOWED_FILTERS = [
  "province",
  "cityDistrict",
  "town",
  "south",
  "west",
  "north",
  "east",
  "lat",
  "lng",
  "radius_km",
] as const;

const ALLOWED_FILTERS_WITH_SORT = [
  ...ALLOWED_FILTERS,
  "sortBy",
  "sortOrder",
] as const;

// auction_ed 전용: 모든 필터를 서버로 전달
const AUCTION_ED_SERVER_FILTERS = [
  "province",
  "cityDistrict",
  "town",
  "priceRange",
  "salePriceRange",
  "auctionDateFrom",
  "auctionDateTo",
  "buildingAreaRange",
  "landAreaRange",
  "buildYear",
  "floorConfirmation",
  "hasElevator",
  "currentStatus",
  "specialBooleanFlags",
  "specialRights",
  "searchQuery",
  "searchField",
] as const;

// sale 전용: 실거래가(매매) 허용 필터
const SALE_FILTERS = [
  "province",
  "cityDistrict",
  "town",
  "transactionAmountRange",
  "exclusiveAreaRange",
  "landRightsAreaRange",
  "pricePerPyeongRange",
  "buildYearRange",
  "floorConfirmation",
  "elevatorAvailable",
  "dateRange",
  "searchField",
  "searchQuery",
  "sortBy",
  "sortOrder",
] as const;

// rent 전용: 실거래가(전월세) 허용 필터
const RENT_FILTERS = [
  "province",
  "cityDistrict",
  "town",
  "depositRange",
  "monthlyRentRange",
  "areaRange",
  "buildYearRange",
  "dateRange",
  "rentType",
  "floorConfirmation",
  "elevatorAvailable",
  "searchField",
  "searchQuery",
  // 신규 확장 필터 키 (서버 지원 완료)
  "jeonseConversionAmountRange",
  "rentalYieldAnnualRange",
  "depositPerPyeongRange",
  "monthlyRentPerPyeongRange",
  "sortBy",
  "sortOrder",
] as const;

export const datasetConfigs: Record<DatasetId, DatasetConfig> = {
  auction_ed: {
    id: "auction_ed",
    title: "과거경매결과",
    api: {
      buildListKey: ({ filters, page, size }) => {
        // auction_ed는 지역 필터 + 매각가 필터를 서버로 전달, 나머지는 클라이언트 필터링
        const serverFilters = pickAllowed(
          filters as any,
          AUCTION_ED_SERVER_FILTERS
        );

        // 지역 필터를 auction_ed 백엔드 필드명으로 매핑
        const mappedFilters: Record<string, unknown> = {};
        if (serverFilters?.province) {
          // 시도 선택은 '주소(구역)' 컬럼과 연동 → address_area로 매핑
          mappedFilters.address_area = serverFilters.province;
        }
        if (serverFilters?.cityDistrict) {
          // address_city는 "경기도 고양시"를 그대로 전달
          mappedFilters.address_city = String(serverFilters.cityDistrict);
        }
        if (serverFilters?.town) {
          mappedFilters.eup_myeon_dong = serverFilters.town;
        }

        // 매각가 필터 추가
        if (Array.isArray(serverFilters?.priceRange)) {
          const [minPrice, maxPrice] = serverFilters.priceRange as [
            number,
            number
          ];
          console.log("🔍 [DEBUG] priceRange 필터 처리:", {
            minPrice,
            maxPrice,
            serverFilters,
          });

          if (typeof minPrice === "number" && minPrice > 0) {
            mappedFilters.min_final_sale_price = minPrice;
            console.log("✅ [DEBUG] 최소 매각가 설정:", minPrice);
          }
          if (
            typeof maxPrice === "number" &&
            maxPrice > 0 &&
            maxPrice < 500000
          ) {
            mappedFilters.max_final_sale_price = maxPrice;
            console.log("✅ [DEBUG] 최대 매각가 설정:", maxPrice);
          }
        }

        // 매각년도(saleYear) 또는 매각기일 범위 매핑
        if ((filters as any)?.saleYear) {
          const y = String((filters as any).saleYear);
          mappedFilters.sale_date_from = `${y}-01-01`;
          mappedFilters.sale_date_to = `${y}-12-31`;
        } else {
          if (serverFilters?.auctionDateFrom) {
            mappedFilters.sale_date_from = serverFilters.auctionDateFrom;
          }
          if (serverFilters?.auctionDateTo) {
            mappedFilters.sale_date_to = serverFilters.auctionDateTo;
          }
        }

        // 건축면적 필터 추가 (평 단위)
        if (Array.isArray(serverFilters?.buildingAreaRange)) {
          const [minArea, maxArea] = serverFilters.buildingAreaRange as [
            number,
            number
          ];
          if (typeof minArea === "number" && minArea > 0) {
            mappedFilters.min_building_area_pyeong = minArea;
          }
          if (typeof maxArea === "number" && maxArea > 0) {
            mappedFilters.max_building_area_pyeong = maxArea;
          }
        }

        // 토지면적 필터 추가 (평 단위)
        if (Array.isArray(serverFilters?.landAreaRange)) {
          const [minArea, maxArea] = serverFilters.landAreaRange as [
            number,
            number
          ];
          if (typeof minArea === "number" && minArea > 0) {
            mappedFilters.min_land_area_pyeong = minArea;
          }
          if (typeof maxArea === "number" && maxArea > 0) {
            mappedFilters.max_land_area_pyeong = maxArea;
          }
        }

        // 건축년도 필터 추가
        if (Array.isArray(serverFilters?.buildYear)) {
          const [minYear, maxYear] = serverFilters.buildYear as [
            number,
            number
          ];
          if (typeof minYear === "number" && minYear > 1900) {
            mappedFilters.min_construction_year = minYear;
          }
          if (typeof maxYear === "number" && maxYear > 1900) {
            mappedFilters.max_construction_year = maxYear;
          }
        }

        // 층확인 필터 추가
        if (
          serverFilters?.floorConfirmation &&
          serverFilters.floorConfirmation !== "all"
        ) {
          if (Array.isArray(serverFilters.floorConfirmation)) {
            mappedFilters.floor_confirmation =
              serverFilters.floorConfirmation.join(",");
          } else {
            mappedFilters.floor_confirmation = serverFilters.floorConfirmation;
          }
        }

        // 엘리베이터 필터 추가
        if (
          serverFilters?.hasElevator !== undefined &&
          serverFilters.hasElevator !== "all"
        ) {
          if (Array.isArray(serverFilters.hasElevator)) {
            mappedFilters.elevator_available =
              serverFilters.hasElevator.join(",");
          } else {
            mappedFilters.elevator_available = serverFilters.hasElevator;
          }
        }

        // 현재상태 필터 추가
        if (
          serverFilters?.currentStatus &&
          serverFilters.currentStatus !== "all"
        ) {
          if (Array.isArray(serverFilters.currentStatus)) {
            mappedFilters.current_status =
              serverFilters.currentStatus.join(",");
          } else {
            mappedFilters.current_status = serverFilters.currentStatus;
          }
        }

        // 특수조건 필터 추가
        if (
          Array.isArray(serverFilters?.specialBooleanFlags) &&
          serverFilters.specialBooleanFlags.length > 0
        ) {
          mappedFilters.special_conditions =
            serverFilters.specialBooleanFlags.join(",");
        }

        // 특수권리 필터 추가 (동적 OR 조건)
        if (
          Array.isArray(serverFilters?.specialRights) &&
          serverFilters.specialRights.length > 0
        ) {
          mappedFilters.special_rights = serverFilters.specialRights.join(",");
        }

        // 검색 필터 추가
        if (serverFilters?.searchQuery && serverFilters?.searchField) {
          if (serverFilters.searchField === "road_address") {
            mappedFilters.road_address_search = serverFilters.searchQuery;
          } else if (serverFilters.searchField === "case_number") {
            mappedFilters.case_number_search = serverFilters.searchQuery;
          } else if (serverFilters.searchField === "address") {
            // 주소 검색 - 백엔드에서 지원하는 파라미터명 확인 필요
            mappedFilters.address_search = serverFilters.searchQuery;
          }
        }

        // 정렬 파라미터 추가 (서버에서 처리)
        if (filters?.sortBy && filters?.sortOrder) {
          const serverKey = camelToSnake((filters as any).sortBy);
          if (serverKey) {
            const order: string = (filters as any).sortOrder;
            const ordering = `${order === "desc" ? "-" : ""}${serverKey}`;
            (mappedFilters as any).ordering = ordering;
            if (process.env.NODE_ENV === "development") {
              console.log("[buildListKey] sort params:", {
                ordering,
                page,
                size,
              });
            }
          }
        }

        return [
          "/api/v1/auction-completed/",
          {
            ...mappedFilters,
            page,
            size,
          },
        ] as const;
      },
      fetchList: async ({ filters, page, size }) => {
        // auction_ed는 지역 필터 + 매각가 필터를 서버로 전달, 나머지는 클라이언트 필터링
        const serverFilters = pickAllowed(
          filters as any,
          AUCTION_ED_SERVER_FILTERS
        );

        // 지역 필터를 auction_ed 백엔드 필드명으로 매핑
        const mappedFilters: Record<string, unknown> = {};
        if (serverFilters?.province) {
          // 시도 선택은 '주소(구역)' 컬럼과 연동 → address_area로 매핑
          mappedFilters.address_area = serverFilters.province;
        }
        if (serverFilters?.cityDistrict) {
          // address_city는 "경기도 고양시"를 그대로 전달
          mappedFilters.address_city = String(serverFilters.cityDistrict);
        }
        if (serverFilters?.town) {
          mappedFilters.eup_myeon_dong = serverFilters.town;
        }

        // 매각가 필터 추가 (기존 priceRange)
        if (Array.isArray(serverFilters?.priceRange)) {
          const [minPrice, maxPrice] = serverFilters.priceRange as [
            number,
            number
          ];

          if (typeof minPrice === "number" && minPrice > 0) {
            mappedFilters.min_final_sale_price = minPrice;
          }
          if (
            typeof maxPrice === "number" &&
            maxPrice > 0 &&
            maxPrice < 500000
          ) {
            mappedFilters.max_final_sale_price = maxPrice;
          }
        }

        // 매각가 범위 필터 추가 (새로운 salePriceRange)
        if (Array.isArray(serverFilters?.salePriceRange)) {
          const [minPrice, maxPrice] = serverFilters.salePriceRange as [
            number,
            number
          ];
          if (typeof minPrice === "number" && minPrice > 0) {
            mappedFilters.min_final_sale_price = minPrice;
          }
          if (
            typeof maxPrice === "number" &&
            maxPrice > 0 &&
            maxPrice < 500000
          ) {
            mappedFilters.max_final_sale_price = maxPrice;
          }
        }

        // 매각년도(saleYear) 또는 매각기일 범위 매핑
        if ((filters as any)?.saleYear) {
          const y = String((filters as any).saleYear);
          mappedFilters.sale_date_from = `${y}-01-01`;
          mappedFilters.sale_date_to = `${y}-12-31`;
        } else {
          if (serverFilters?.auctionDateFrom) {
            mappedFilters.sale_date_from = serverFilters.auctionDateFrom;
          }
          if (serverFilters?.auctionDateTo) {
            mappedFilters.sale_date_to = serverFilters.auctionDateTo;
          }
        }

        // 건축면적 필터 추가 (평 단위)
        if (Array.isArray(serverFilters?.buildingAreaRange)) {
          const [minArea, maxArea] = serverFilters.buildingAreaRange as [
            number,
            number
          ];
          if (typeof minArea === "number" && minArea > 0) {
            mappedFilters.min_building_area_pyeong = minArea;
          }
          if (typeof maxArea === "number" && maxArea > 0) {
            mappedFilters.max_building_area_pyeong = maxArea;
          }
        }

        // 토지면적 필터 추가 (평 단위)
        if (Array.isArray(serverFilters?.landAreaRange)) {
          const [minArea, maxArea] = serverFilters.landAreaRange as [
            number,
            number
          ];
          if (typeof minArea === "number" && minArea > 0) {
            mappedFilters.min_land_area_pyeong = minArea;
          }
          if (typeof maxArea === "number" && maxArea > 0) {
            mappedFilters.max_land_area_pyeong = maxArea;
          }
        }

        // 건축년도 필터 추가
        if (Array.isArray(serverFilters?.buildYear)) {
          const [minYear, maxYear] = serverFilters.buildYear as [
            number,
            number
          ];
          if (typeof minYear === "number" && minYear > 1900) {
            mappedFilters.min_construction_year = minYear;
          }
          if (typeof maxYear === "number" && maxYear > 1900) {
            mappedFilters.max_construction_year = maxYear;
          }
        }

        // 층확인 필터 추가
        if (
          serverFilters?.floorConfirmation &&
          serverFilters.floorConfirmation !== "all"
        ) {
          if (Array.isArray(serverFilters.floorConfirmation)) {
            mappedFilters.floor_confirmation =
              serverFilters.floorConfirmation.join(",");
          } else {
            mappedFilters.floor_confirmation = serverFilters.floorConfirmation;
          }
        }

        // 엘리베이터 필터 추가
        if (
          serverFilters?.hasElevator !== undefined &&
          serverFilters.hasElevator !== "all"
        ) {
          if (Array.isArray(serverFilters.hasElevator)) {
            mappedFilters.elevator_available =
              serverFilters.hasElevator.join(",");
          } else {
            mappedFilters.elevator_available = serverFilters.hasElevator;
          }
        }

        // 현재상태 필터 추가
        if (
          serverFilters?.currentStatus &&
          serverFilters.currentStatus !== "all"
        ) {
          if (Array.isArray(serverFilters.currentStatus)) {
            mappedFilters.current_status =
              serverFilters.currentStatus.join(",");
          } else {
            mappedFilters.current_status = serverFilters.currentStatus;
          }
        }

        // 특수조건 필터 추가
        if (
          Array.isArray(serverFilters?.specialBooleanFlags) &&
          serverFilters.specialBooleanFlags.length > 0
        ) {
          mappedFilters.special_conditions =
            serverFilters.specialBooleanFlags.join(",");
        }

        // 특수권리 필터 추가 (동적 OR 조건)
        if (
          Array.isArray(serverFilters?.specialRights) &&
          serverFilters.specialRights.length > 0
        ) {
          mappedFilters.special_rights = serverFilters.specialRights.join(",");
        }

        // 검색 필터 추가
        if (serverFilters?.searchQuery && serverFilters?.searchField) {
          if (serverFilters.searchField === "road_address") {
            mappedFilters.road_address_search = serverFilters.searchQuery;
          } else if (serverFilters.searchField === "case_number") {
            mappedFilters.case_number_search = serverFilters.searchQuery;
          } else if (serverFilters.searchField === "address") {
            // 주소 검색 - 백엔드에서 지원하는 파라미터명 확인 필요
            mappedFilters.address_search = serverFilters.searchQuery;
          }
        }

        // 정렬 파라미터 추가 (서버에서 처리)
        if (filters?.sortBy && filters?.sortOrder) {
          const serverKey = camelToSnake((filters as any).sortBy);
          if (serverKey) {
            const order: string = (filters as any).sortOrder;
            const ordering = `${order === "desc" ? "-" : ""}${serverKey}`;
            (mappedFilters as any).ordering = ordering;
            if (process.env.NODE_ENV === "development") {
              console.log("[fetchList] sort params:", {
                ordering,
                page,
                size,
              });
            }
          }
        }

        return auctionApi.getCompleted({
          ...mappedFilters,
          page,
          size,
        });
      },
    },
    adapter: {
      toItemLike: (r: any) => {
        // 주소 우선순위: road_address > address > full_address > jibun_address
        const address =
          (pickFirst(
            r?.road_address,
            r?.address,
            r?.full_address,
            r?.jibun_address
          ) as string) || "";

        // 좌표: 서버 표준(latitude/longitude) 및 simple(lat/lng) 우선 사용
        const lat = toNumber(pickFirst(r?.latitude, r?.lat, r?.lat_y, r?.y));
        const lng = toNumber(pickFirst(r?.longitude, r?.lng, r?.lon, r?.x));

        // 면적: building_area_pyeong → m2 변환(1평=3.306), simple area 폴백
        const area = (() => {
          const pyeong = toNumber(r?.building_area_pyeong);
          if (pyeong !== undefined) return pyeong * 3.306;
          return toNumber(
            pickFirst(r?.area, r?.exclusive_area_sqm, r?.area_sqm)
          );
        })();

        // 연도: construction_year 또는 simple build_year
        const buildYear = toNumber(
          pickFirst(
            r?.construction_year,
            r?.buildYear,
            r?.build_year,
            r?.year_built,
            r?.build_year
          )
        );

        // 가격: final_sale_price 우선, simple price 폴백
        const price = toNumber(
          pickFirst(r?.final_sale_price, r?.price, r?.finalPrice)
        );

        const id = pickFirst(r?.id, r?.doc_id, r?.uuid, r?.case_number);

        // 보조 변환기: 엘리베이터 O/X/Y/N → boolean
        const toBool = (v: any): boolean | undefined => {
          const s = String(v ?? "")
            .trim()
            .toUpperCase();
          if (["Y", "O", "TRUE", "1"].includes(s)) return true;
          if (["N", "X", "FALSE", "0"].includes(s)) return false;
          return undefined;
        };

        // 원시 숫자 보정
        const appraisedValue = toNumber(r?.appraised_value);
        const minimumBidPrice = toNumber(r?.minimum_bid_price);
        const finalSalePrice = toNumber(
          pickFirst(r?.final_sale_price, r?.price)
        );
        let saleToAppraisedRatio = toNumber(r?.sale_to_appraised_ratio);
        if (
          saleToAppraisedRatio === undefined &&
          finalSalePrice !== undefined &&
          appraisedValue !== undefined &&
          appraisedValue > 0
        ) {
          const rati = (finalSalePrice / appraisedValue) * 100;
          if (Number.isFinite(rati))
            saleToAppraisedRatio = Number(rati.toFixed(1));
        }

        return {
          id: String(id ?? ""),
          address,
          price,
          area,
          buildYear,
          lat,
          lng,
          extra: {
            // 기본 정보
            usage: r?.usage,
            caseNumber: r?.case_number,
            currentStatus: r?.current_status,
            saleDate: r?.sale_date,

            // 주소/위치 정보
            roadAddress: r?.road_address ?? address,
            addressArea: r?.address_area,
            addressCity: r?.address_city,
            locationDetail: r?.location_detail,
            buildingName: r?.building_name,
            generalLocation: r?.general_location,
            sido: r?.sido,
            eupMyeonDong: r?.eup_myeon_dong,

            // 경매 가격 정보
            appraisedValue,
            minimumBidPrice,
            bidToAppraisedRatio: toNumber(r?.bid_to_appraised_ratio),
            finalSalePrice,
            saleToAppraisedRatio,
            bidderCount: toNumber(r?.bidder_count),

            // 면적 정보
            buildingAreaPyeong: toNumber(r?.building_area_pyeong),
            landAreaPyeong: toNumber(r?.land_area_pyeong),
            landAreaSqm: toNumber(r?.land_area_sqm),
            constructionAreaSqm: toNumber(r?.construction_area_sqm),
            totalFloorAreaSqm: toNumber(r?.total_floor_area_sqm),

            // 건물 상세 정보
            buildingCoverageRatio: toNumber(r?.building_coverage_ratio),
            floorAreaRatio: toNumber(r?.floor_area_ratio),
            mainStructure: r?.main_structure,
            mainUsage: r?.main_usage,
            otherUsage: r?.other_usage,
            buildingHeight: toNumber(r?.building_height),
            groundFloors: toNumber(r?.ground_floors),
            basementFloors: toNumber(r?.basement_floors),
            constructionYear: toNumber(r?.construction_year),
            usageApprovalDate: r?.usage_approval_date,

            // 층수/편의시설
            floorInfo: r?.floor_info,
            floorConfirmation: r?.floor_confirmation,
            elevatorAvailable: toBool(r?.elevator_available),
            elevatorCount: toNumber(r?.elevator_count),
            householdCount: toNumber(r?.household_count),

            // 법적 권리/특이사항
            specialRights: r?.special_rights,

            // 코드/식별 정보
            postalCode: r?.postal_code,
            pnu: r?.pnu,

            // 좌표 정보 (추가 노출)
            latitude: toNumber(r?.latitude),
            longitude: toNumber(r?.longitude),

            // 호환성을 위한 기존 필드들 유지
            auctionDate: r?.sale_date ?? r?.auctionDate,
            bidCount: r?.bidder_count ?? r?.bidCount,
            pyeong: toNumber(r?.building_area_pyeong),
          },
        };
      },
    },
    table: {
      columns: columnsAuctionEd as any,
      defaultSort: { key: "saleDate", order: "desc" },
    },
    filters: {
      defaults: { price_min: 0, price_max: 500000 },
      ui: [
        {
          type: "dateRange",
          label: "매각기일",
          key: ["start_date", "end_date"],
        },
        { type: "range", label: "가격(만원)", key: "price" },
        { type: "range", label: "면적(㎡)", key: "area" },
      ],
    },
    map: {
      legend: [
        { label: "낮은 가격", color: "#5cb85c" },
        { label: "높은 가격", color: "#d9534f" },
      ],
      marker: (row) => ({
        color: (row.price ?? 0) > 50000 ? "#d9534f" : "#5cb85c",
      }),
      useClustering: true,
    },
  },
  sale: {
    id: "sale",
    title: "실거래가(매매)",
    api: {
      buildListKey: ({ filters, page, size }) => {
        // 화이트리스트로 허용된 필터만 선택
        const allowedFilters = pickAllowed(filters as any, SALE_FILTERS);
        const cleanFilters = { ...allowedFilters } as Record<string, unknown>;

        // 선택 항목만 보기(ids) 서버 필터 연동: showSelectedOnly && selectedIds 있을 때만 적용
        try {
          const selOnly = (filters as any)?.showSelectedOnly === true;
          const idsArr = Array.isArray((filters as any)?.selectedIds)
            ? ((filters as any)?.selectedIds as any[])
            : [];
          if (selOnly && idsArr.length > 0) {
            const capped = idsArr
              .slice(0, 500)
              .map((v) => String(v))
              .filter((s) => s && s !== "undefined" && s !== "null");
            if (capped.length > 0) (cleanFilters as any).ids = capped.join(",");
          }
        } catch {}

        // 지역 필터를 real_transactions 백엔드 필드명으로 매핑
        if (allowedFilters.province) {
          cleanFilters.sido = allowedFilters.province;
          delete cleanFilters.province;
        }
        if (allowedFilters.cityDistrict) {
          cleanFilters.sigungu = allowedFilters.cityDistrict;
          delete cleanFilters.cityDistrict;
        }
        if (allowedFilters.town) {
          cleanFilters.admin_dong_name = allowedFilters.town;
          delete cleanFilters.town;
        }

        // 정렬 파라미터를 서버 ordering 형식으로 변환 (auction_ed 패턴)
        if (allowedFilters.sortBy && allowedFilters.sortOrder) {
          const serverKey = camelToSnake(allowedFilters.sortBy as string);
          if (serverKey) {
            const order = allowedFilters.sortOrder as string;
            const ordering = `${order === "desc" ? "-" : ""}${serverKey}`;
            cleanFilters.ordering = ordering;
            delete cleanFilters.sortBy;
            delete cleanFilters.sortOrder;
          }
        }

        // 거래금액 범위 매핑
        if (Array.isArray(allowedFilters.transactionAmountRange)) {
          const [minAmount, maxAmount] = allowedFilters.transactionAmountRange;
          if (typeof minAmount === "number" && minAmount > 0) {
            cleanFilters.min_transaction_amount = minAmount;
          }
          if (
            typeof maxAmount === "number" &&
            maxAmount > 0 &&
            maxAmount < 100000
          ) {
            cleanFilters.max_transaction_amount = maxAmount;
          }
          delete cleanFilters.transactionAmountRange;
        }

        // 전용면적 범위 매핑
        if (Array.isArray(allowedFilters.exclusiveAreaRange)) {
          const [minArea, maxArea] = allowedFilters.exclusiveAreaRange;
          if (typeof minArea === "number" && minArea > 0) {
            cleanFilters.min_exclusive_area = minArea;
          }
          if (typeof maxArea === "number" && maxArea > 0) {
            cleanFilters.max_exclusive_area = maxArea;
          }
          delete cleanFilters.exclusiveAreaRange;
        }

        // 건축연도 범위 매핑
        if (Array.isArray(allowedFilters.buildYearRange)) {
          const [minYear, maxYear] = allowedFilters.buildYearRange;
          if (typeof minYear === "number" && minYear > 1900) {
            cleanFilters.min_construction_year = minYear;
          }
          if (typeof maxYear === "number" && maxYear > 1900) {
            cleanFilters.max_construction_year = maxYear;
          }
          delete cleanFilters.buildYearRange;
        }

        // 날짜 범위 매핑
        console.log("🔍 [sale buildListKey] dateRange 필터 확인:", {
          dateRange: allowedFilters.dateRange,
          isArray: Array.isArray(allowedFilters.dateRange),
          type: typeof allowedFilters.dateRange,
          allowedFilters,
        });
        if (Array.isArray(allowedFilters.dateRange)) {
          const [startDate, endDate] = allowedFilters.dateRange;
          console.log("✅ [sale buildListKey] dateRange 매핑 시도:", {
            startDate,
            endDate,
          });
          if (startDate) {
            cleanFilters.contract_date_from = startDate;
            console.log("✅ contract_date_from 설정:", startDate);
          }
          if (endDate) {
            cleanFilters.contract_date_to = endDate;
            console.log("✅ contract_date_to 설정:", endDate);
          }
          delete cleanFilters.dateRange;
        } else {
          console.log(
            "⚠️ [sale buildListKey] dateRange가 배열이 아니거나 없음"
          );
        }

        // 층확인 매핑
        if (
          allowedFilters.floorConfirmation &&
          allowedFilters.floorConfirmation !== "all"
        ) {
          if (Array.isArray(allowedFilters.floorConfirmation)) {
            cleanFilters.floor_confirmation =
              allowedFilters.floorConfirmation.join(",");
          } else {
            cleanFilters.floor_confirmation = allowedFilters.floorConfirmation;
          }
          delete cleanFilters.floorConfirmation;
        }

        // 엘리베이터 매핑
        if (
          allowedFilters.elevatorAvailable !== undefined &&
          allowedFilters.elevatorAvailable !== "all"
        ) {
          cleanFilters.elevator_available = allowedFilters.elevatorAvailable;
          delete cleanFilters.elevatorAvailable;
        }

        // 주소 검색 매핑 (백엔드 옵션 A/B 모두 지원)
        if (allowedFilters.searchQuery && allowedFilters.searchField) {
          const sf = String(allowedFilters.searchField);
          const q = allowedFilters.searchQuery as string;
          if (sf === "address") {
            // 도로명 주소 검색 (Option A)
            (cleanFilters as any).address_search = q;
            (cleanFilters as any).address_search_type = "road";
          } else if (sf === "jibun_address") {
            // 지번 주소 검색 (Option A)
            (cleanFilters as any).address_search = q;
            (cleanFilters as any).address_search_type = "jibun";
            // Option B(병행)도 추가로 세팅 가능: 서버가 우선순위 처리
            // (cleanFilters as any).jibun_address_search = q;
          } else if (sf === "road_address") {
            // 전용 도로명 파라미터 (Option B)
            (cleanFilters as any).road_address_search = q;
          }
          delete cleanFilters.searchQuery;
          delete cleanFilters.searchField;
        }

        console.log("🔵 [sale buildListKey] 최종 API 파라미터:", cleanFilters);

        return [
          "/api/v1/real-transactions/",
          {
            ...cleanFilters,
            page,
            size,
          },
        ] as const;
      },
      fetchList: async ({ filters, page, size }) => {
        // 화이트리스트로 허용된 필터만 선택
        const allowedFilters = pickAllowed(filters as any, SALE_FILTERS);
        const cleanFilters = { ...allowedFilters } as Record<string, unknown>;

        // 선택 항목만 보기(ids) 서버 필터 연동
        try {
          const selOnly = (filters as any)?.showSelectedOnly === true;
          const idsArr = Array.isArray((filters as any)?.selectedIds)
            ? ((filters as any)?.selectedIds as any[])
            : [];
          if (selOnly && idsArr.length > 0) {
            const capped = idsArr
              .slice(0, 500)
              .map((v) => String(v))
              .filter((s) => s && s !== "undefined" && s !== "null");
            if (capped.length > 0) (cleanFilters as any).ids = capped.join(",");
          }
        } catch {}

        // 지역 필터를 real_transactions 백엔드 필드명으로 매핑
        if (allowedFilters.province) {
          cleanFilters.sido = allowedFilters.province;
          delete cleanFilters.province;
        }
        if (allowedFilters.cityDistrict) {
          cleanFilters.sigungu = allowedFilters.cityDistrict;
          delete cleanFilters.cityDistrict;
        }
        if (allowedFilters.town) {
          cleanFilters.admin_dong_name = allowedFilters.town;
          delete cleanFilters.town;
        }

        // 정렬 파라미터를 서버 ordering 형식으로 변환 (auction_ed 패턴)
        if (allowedFilters.sortBy && allowedFilters.sortOrder) {
          const serverKey = camelToSnake(allowedFilters.sortBy as string);
          if (serverKey) {
            const order = allowedFilters.sortOrder as string;
            const ordering = `${order === "desc" ? "-" : ""}${serverKey}`;
            cleanFilters.ordering = ordering;
            delete cleanFilters.sortBy;
            delete cleanFilters.sortOrder;
          }
        }

        // 거래금액 범위 매핑
        if (Array.isArray(allowedFilters.transactionAmountRange)) {
          const [minAmount, maxAmount] = allowedFilters.transactionAmountRange;
          if (typeof minAmount === "number" && minAmount > 0) {
            cleanFilters.min_transaction_amount = minAmount;
          }
          if (
            typeof maxAmount === "number" &&
            maxAmount > 0 &&
            maxAmount < 100000
          ) {
            cleanFilters.max_transaction_amount = maxAmount;
          }
          delete cleanFilters.transactionAmountRange;
        }

        // 평단가 범위 매핑
        if (Array.isArray(allowedFilters.pricePerPyeongRange)) {
          const [minPrice, maxPrice] = allowedFilters.pricePerPyeongRange;
          if (typeof minPrice === "number" && minPrice > 0) {
            cleanFilters.min_price_per_pyeong = minPrice;
          }
          if (typeof maxPrice === "number" && maxPrice > 0) {
            cleanFilters.max_price_per_pyeong = maxPrice;
          }
          delete cleanFilters.pricePerPyeongRange;
        }

        // 전용면적 범위 매핑
        if (Array.isArray(allowedFilters.exclusiveAreaRange)) {
          const [minArea, maxArea] = allowedFilters.exclusiveAreaRange;
          if (typeof minArea === "number" && minArea > 0) {
            cleanFilters.min_exclusive_area = minArea;
          }
          if (typeof maxArea === "number" && maxArea > 0) {
            cleanFilters.max_exclusive_area = maxArea;
          }
          delete cleanFilters.exclusiveAreaRange;
        }

        // 대지권면적 범위 매핑
        if (Array.isArray(allowedFilters.landRightsAreaRange)) {
          const [minArea, maxArea] = allowedFilters.landRightsAreaRange;
          if (typeof minArea === "number" && minArea > 0) {
            cleanFilters.min_land_rights_area = minArea;
          }
          if (typeof maxArea === "number" && maxArea > 0) {
            cleanFilters.max_land_rights_area = maxArea;
          }
          delete cleanFilters.landRightsAreaRange;
        }

        // 건축연도 범위 매핑
        if (Array.isArray(allowedFilters.buildYearRange)) {
          const [minYear, maxYear] = allowedFilters.buildYearRange;
          if (typeof minYear === "number" && minYear > 1900) {
            cleanFilters.min_construction_year = minYear;
          }
          if (typeof maxYear === "number" && maxYear > 1900) {
            cleanFilters.max_construction_year = maxYear;
          }
          delete cleanFilters.buildYearRange;
        }

        // 날짜 범위 매핑
        console.log("🔍 [sale fetchList] dateRange 필터 확인:", {
          dateRange: allowedFilters.dateRange,
          isArray: Array.isArray(allowedFilters.dateRange),
          type: typeof allowedFilters.dateRange,
          allowedFilters,
        });
        if (Array.isArray(allowedFilters.dateRange)) {
          const [startDate, endDate] = allowedFilters.dateRange;
          console.log("✅ [sale fetchList] dateRange 매핑 시도:", {
            startDate,
            endDate,
          });
          if (startDate) {
            cleanFilters.contract_date_from = startDate;
            console.log("✅ contract_date_from 설정:", startDate);
          }
          if (endDate) {
            cleanFilters.contract_date_to = endDate;
            console.log("✅ contract_date_to 설정:", endDate);
          }
          delete cleanFilters.dateRange;
        } else {
          console.log("⚠️ [sale fetchList] dateRange가 배열이 아니거나 없음");
        }

        // 층확인 매핑
        if (
          allowedFilters.floorConfirmation &&
          allowedFilters.floorConfirmation !== "all"
        ) {
          if (Array.isArray(allowedFilters.floorConfirmation)) {
            cleanFilters.floor_confirmation =
              allowedFilters.floorConfirmation.join(",");
          } else {
            cleanFilters.floor_confirmation = allowedFilters.floorConfirmation;
          }
          delete cleanFilters.floorConfirmation;
        }

        // 엘리베이터 매핑
        if (
          allowedFilters.elevatorAvailable !== undefined &&
          allowedFilters.elevatorAvailable !== "all"
        ) {
          cleanFilters.elevator_available = allowedFilters.elevatorAvailable;
          delete cleanFilters.elevatorAvailable;
        }

        // 주소 검색 매핑 (백엔드 옵션 A/B 모두 지원)
        if (allowedFilters.searchQuery && allowedFilters.searchField) {
          const sf = String(allowedFilters.searchField);
          const q = allowedFilters.searchQuery as string;
          if (sf === "address") {
            (cleanFilters as any).address_search = q;
            (cleanFilters as any).address_search_type = "road";
          } else if (sf === "jibun_address") {
            (cleanFilters as any).address_search = q;
            (cleanFilters as any).address_search_type = "jibun";
            // (cleanFilters as any).jibun_address_search = q; // 필요 시 병행
          } else if (sf === "road_address") {
            (cleanFilters as any).road_address_search = q;
          }
          delete cleanFilters.searchQuery;
          delete cleanFilters.searchField;
        }

        console.log("🔵 [sale fetchList] 최종 API 파라미터:", cleanFilters);

        const result = await realTransactionApi.getTransactions({
          ...(cleanFilters as any),
          page,
          size,
        });

        console.log("🟢 [sale fetchList] 백엔드 응답:", {
          total: (result as any)?.count,
          itemsCount: Array.isArray((result as any)?.results)
            ? (result as any)?.results.length
            : undefined,
          hasContractDateFilter: !!(
            cleanFilters.contract_date_from || cleanFilters.contract_date_to
          ),
        });

        return result;
      },
    },
    adapter: {
      toItemLike: (r: any) => {
        const address = extractAddress(r);
        const { lat, lng } = extractLatLng(r);
        const area = extractAreaM2(r);
        const buildYear = extractBuildYear(r);
        const price = toNumber(pickFirst(r?.price, r?.transaction_amount));
        const id = pickFirst(r?.id, r?.doc_id, r?.uuid);
        return {
          id: String(id ?? ""),
          address,
          price,
          area,
          buildYear,
          lat,
          lng,
          extra: {
            // 기본 정보
            createdAt: r?.created_at,

            // 지역/주소 정보
            sido: r?.sido,
            sigungu: r?.sigungu,
            roadAddressReal: r?.road_address_real,
            buildingNameReal: r?.building_name_real,

            // 면적 정보
            exclusiveAreaSqm: toNumber(r?.exclusive_area_sqm),
            exclusiveAreaRange: r?.exclusive_area_range,
            landRightsAreaSqm: toNumber(r?.land_rights_area_sqm),

            // 거래 정보(핵심)
            contractYear: toNumber(r?.contract_year),
            contractMonth: toNumber(r?.contract_month),
            contractDay: toNumber(r?.contract_day),
            contractDate: r?.contract_date,
            transactionAmount: toNumber(r?.transaction_amount),
            pricePerPyeong: toNumber(r?.price_per_pyeong),

            // 건물/연식/층
            floorInfoReal: r?.floor_info_real,
            constructionYearReal: toNumber(r?.construction_year_real),
            constructionYearRange: r?.construction_year_range,

            // 거래 유형
            transactionType: r?.transaction_type,
            buyerType: r?.buyer_type,
            sellerType: r?.seller_type,

            // 좌표 정보
            longitude: toNumber(r?.longitude),
            latitude: toNumber(r?.latitude),

            // H. 추가 주소/행정/식별
            roadAddress: r?.road_address,
            sidoAdmin: r?.sido_admin,
            buildingRegistryPk: r?.building_registry_pk,
            adminCode: r?.admin_code,
            legalCode: r?.legal_code,
            jibunAddress: r?.jibun_address,
            postalCode: r?.postal_code,
            pnu: r?.pnu,
            buildingName: r?.building_name,
            dongName: r?.dong_name,
            legalDongUnit: r?.legal_dong_unit,
            adminDongName: r?.admin_dong_name,
            adminDong: r?.admin_dong,

            // I. 건축물 상세
            landAreaSqm: toNumber(r?.land_area_sqm),
            constructionAreaSqm: toNumber(r?.construction_area_sqm),
            totalFloorAreaSqm: toNumber(r?.total_floor_area_sqm),
            buildingCoverageRatio: toNumber(r?.building_coverage_ratio),
            floorAreaRatio: toNumber(r?.floor_area_ratio),
            mainStructure: r?.main_structure,
            mainUsage: r?.main_usage,
            otherUsage: r?.other_usage,
            buildingHeight: toNumber(r?.building_height),
            groundFloors: toNumber(r?.ground_floors),
            basementFloors: toNumber(r?.basement_floors),
            householdCount: toNumber(r?.household_count),
            familyCount: toNumber(r?.family_count),
            roomNumber: r?.room_number,
            usageApprovalDate: r?.usage_approval_date,
            elevatorCount: toNumber(r?.elevator_count),
            constructionYear: toNumber(r?.construction_year),
            floorConfirmation: r?.floor_confirmation,
            elevatorAvailable: r?.elevator_available,

            // J. 계산(파생) 필드
            exclusiveAreaPyeong: toNumber(r?.exclusive_area_pyeong),
            pricePerSqm: toNumber(r?.price_per_sqm),

            // 기존 호환성
            transactionDate: r?.transactionDate ?? r?.contract_date,
            price_per_area: r?.price_per_area, // 만원/㎡ (서버 환산/반올림 적용)
          },
        };
      },
    },
    table: {
      columns: columnsSale as any,
      defaultSort: { key: "contractDate", order: "desc" },
    },
    filters: { defaults: {}, ui: [] },
    map: {
      legend: [
        { label: "6천만원 이하", color: "#5cb85c" },
        { label: "8천만원 이하", color: "#f0ad4e" },
        { label: "1억원 이하", color: "#d9534f" },
        { label: "1.3억원 이상", color: "#c9302c" },
      ],
      marker: (row) => {
        const price = row.price ?? 0;
        if (price <= 6000) return { color: "#5cb85c" };
        if (price <= 8000) return { color: "#f0ad4e" };
        if (price <= 10000) return { color: "#d9534f" };
        return { color: "#c9302c" };
      },
      useClustering: true,
    },
  },
  rent: {
    id: "rent",
    title: "실거래가(전월세)",
    api: {
      buildListKey: ({ filters, page, size }) => {
        // 화이트리스트로 허용된 필터만 선택
        const allowedFilters = pickAllowed(filters as any, RENT_FILTERS);
        const cleanFilters = { ...allowedFilters } as Record<string, unknown>;

        // 좌표 기반 필터 제거 (일부 페이지 공통 좌표 키가 들어올 수 있어 방지)
        delete (cleanFilters as any).lat;
        delete (cleanFilters as any).lng;
        delete (cleanFilters as any).south;
        delete (cleanFilters as any).west;
        delete (cleanFilters as any).north;
        delete (cleanFilters as any).east;
        delete (cleanFilters as any).radius_km;

        // 선택 항목만 보기(ids) 서버 필터 연동: showSelectedOnly && selectedIds 있을 때만 적용
        try {
          const selOnly = (filters as any)?.showSelectedOnly === true;
          const idsArr = Array.isArray((filters as any)?.selectedIds)
            ? ((filters as any)?.selectedIds as any[])
            : [];
          if (selOnly && idsArr.length > 0) {
            const capped = idsArr
              .slice(0, 500)
              .map((v) => String(v))
              .filter((s) => s && s !== "undefined" && s !== "null");
            if (capped.length > 0) (cleanFilters as any).ids = capped.join(",");
          }
        } catch {}

        // 지역 필터를 real_rents 백엔드 필드명으로 매핑
        if (allowedFilters.province) {
          (cleanFilters as any).sido = allowedFilters.province;
          delete (cleanFilters as any).province;
        }
        if (allowedFilters.cityDistrict) {
          const pd = (allowedFilters as any).province as string | undefined;
          const cd = String((allowedFilters as any).cityDistrict || "");
          const withPrefix =
            pd && !cd.startsWith(String(pd)) ? `${pd} ${cd}` : cd;
          (cleanFilters as any).sigungu = withPrefix;
          delete (cleanFilters as any).cityDistrict;
        }
        if (allowedFilters.town) {
          (cleanFilters as any).admin_dong_name = allowedFilters.town;
          delete (cleanFilters as any).town;
        }

        // 정렬 파라미터를 서버 ordering 형식으로 변환
        if (allowedFilters.sortBy && allowedFilters.sortOrder) {
          const serverKey = camelToSnake(allowedFilters.sortBy as string);
          if (serverKey) {
            const order = allowedFilters.sortOrder as string;
            (cleanFilters as any).ordering = `${
              order === "desc" ? "-" : ""
            }${serverKey}`;
            delete (cleanFilters as any).sortBy;
            delete (cleanFilters as any).sortOrder;
          }
        }

        // 보증금 범위 매핑
        if (Array.isArray((allowedFilters as any).depositRange)) {
          const [minDeposit, maxDeposit] = (allowedFilters as any)
            .depositRange as [number, number];
          if (typeof minDeposit === "number" && minDeposit > 0)
            (cleanFilters as any).min_deposit_amount = minDeposit;
          if (typeof maxDeposit === "number" && maxDeposit > 0)
            (cleanFilters as any).max_deposit_amount = maxDeposit;
          delete (cleanFilters as any).depositRange;
        }

        // 월세 범위 매핑
        if (Array.isArray((allowedFilters as any).monthlyRentRange)) {
          const [minMonthly, maxMonthly] = (allowedFilters as any)
            .monthlyRentRange as [number, number];
          if (typeof minMonthly === "number" && minMonthly > 0)
            (cleanFilters as any).min_monthly_rent = minMonthly;
          if (typeof maxMonthly === "number" && maxMonthly > 0)
            (cleanFilters as any).max_monthly_rent = maxMonthly;
          delete (cleanFilters as any).monthlyRentRange;
        }

        // 전용면적 범위 매핑
        if (Array.isArray((allowedFilters as any).areaRange)) {
          const [minArea, maxArea] = (allowedFilters as any).areaRange as [
            number,
            number
          ];
          if (typeof minArea === "number" && minArea > 0)
            (cleanFilters as any).min_exclusive_area = minArea;
          if (typeof maxArea === "number" && maxArea > 0)
            (cleanFilters as any).max_exclusive_area = maxArea;
          delete (cleanFilters as any).areaRange;
        }

        // 건축연도 범위 매핑
        if (Array.isArray((allowedFilters as any).buildYearRange)) {
          const [minYear, maxYear] = (allowedFilters as any).buildYearRange as [
            number,
            number
          ];
          if (typeof minYear === "number" && minYear > 1900)
            (cleanFilters as any).min_construction_year = minYear;
          if (typeof maxYear === "number" && maxYear > 1900)
            (cleanFilters as any).max_construction_year = maxYear;
          delete (cleanFilters as any).buildYearRange;
        }

        // 날짜 범위 매핑
        if (Array.isArray((allowedFilters as any).dateRange)) {
          const [startDate, endDate] = (allowedFilters as any).dateRange as [
            string,
            string
          ];
          if (startDate) (cleanFilters as any).contract_date_from = startDate;
          if (endDate) (cleanFilters as any).contract_date_to = endDate;
          delete (cleanFilters as any).dateRange;
        }

        // 전월세 구분/계약 구분
        if ((allowedFilters as any).rentType) {
          (cleanFilters as any).rent_type = (allowedFilters as any).rentType;
          delete (cleanFilters as any).rentType;
        }

        // 전월세 전환금 범위 → min/max_jeonse_conversion_amount
        if (
          Array.isArray((allowedFilters as any).jeonseConversionAmountRange)
        ) {
          const [minConv, maxConv] = (allowedFilters as any)
            .jeonseConversionAmountRange as [number, number];
          if (typeof minConv === "number" && Number.isFinite(minConv))
            (cleanFilters as any).min_jeonse_conversion_amount = minConv;
          if (typeof maxConv === "number" && Number.isFinite(maxConv))
            (cleanFilters as any).max_jeonse_conversion_amount = maxConv;
          delete (cleanFilters as any).jeonseConversionAmountRange;
        }

        // 연 임대수익률(%) 범위 → min/max_rental_yield_annual
        if (Array.isArray((allowedFilters as any).rentalYieldAnnualRange)) {
          const [minY, maxY] = (allowedFilters as any)
            .rentalYieldAnnualRange as [number, number];
          if (typeof minY === "number" && Number.isFinite(minY))
            (cleanFilters as any).min_rental_yield_annual = minY;
          if (typeof maxY === "number" && Number.isFinite(maxY))
            (cleanFilters as any).max_rental_yield_annual = maxY;
          delete (cleanFilters as any).rentalYieldAnnualRange;
        }

        // 평당 보증금 → min/max_deposit_per_pyeong
        if (Array.isArray((allowedFilters as any).depositPerPyeongRange)) {
          const [minDP, maxDP] = (allowedFilters as any)
            .depositPerPyeongRange as [number, number];
          if (typeof minDP === "number" && Number.isFinite(minDP))
            (cleanFilters as any).min_deposit_per_pyeong = minDP;
          if (typeof maxDP === "number" && Number.isFinite(maxDP))
            (cleanFilters as any).max_deposit_per_pyeong = maxDP;
          delete (cleanFilters as any).depositPerPyeongRange;
        }

        // 평당 월세 → min/max_monthly_rent_per_pyeong
        if (Array.isArray((allowedFilters as any).monthlyRentPerPyeongRange)) {
          const [minMP, maxMP] = (allowedFilters as any)
            .monthlyRentPerPyeongRange as [number, number];
          if (typeof minMP === "number" && Number.isFinite(minMP))
            (cleanFilters as any).min_monthly_rent_per_pyeong = minMP;
          if (typeof maxMP === "number" && Number.isFinite(maxMP))
            (cleanFilters as any).max_monthly_rent_per_pyeong = maxMP;
          delete (cleanFilters as any).monthlyRentPerPyeongRange;
        }

        // 층확인/엘리베이터(백엔드 지원 시)
        {
          const fc = (allowedFilters as any).floorConfirmation;
          const isArray = Array.isArray(fc);
          const isString = typeof fc === "string";
          const mapFloorToken = (v: string): string => {
            switch (v) {
              case "basement":
                return "반지하";
              case "first_floor":
                return "1층";
              case "normal_floor":
                return "일반층";
              case "top_floor":
                return "옥탑";
              default:
                return v;
            }
          };
          if (isArray && (fc as any[]).length > 0) {
            const mapped = (fc as string[]).map(mapFloorToken).filter(Boolean);
            (cleanFilters as any).floor_confirmation = mapped.join(",");
          } else if (isString && (fc as string).trim() !== "" && fc !== "all") {
            (cleanFilters as any).floor_confirmation = mapFloorToken(
              fc as string
            );
          }
          delete (cleanFilters as any).floorConfirmation;
        }
        if (
          (allowedFilters as any).elevatorAvailable !== undefined &&
          (allowedFilters as any).elevatorAvailable !== "all"
        ) {
          (cleanFilters as any).elevator_available = (
            allowedFilters as any
          ).elevatorAvailable;
          delete (cleanFilters as any).elevatorAvailable;
        }

        // 주소 검색 매핑 (Option A/B)
        if (
          (allowedFilters as any).searchQuery &&
          (allowedFilters as any).searchField
        ) {
          const sf = String((allowedFilters as any).searchField);
          const q = (allowedFilters as any).searchQuery as string;
          if (sf === "address") {
            (cleanFilters as any).address_search = q;
            (cleanFilters as any).address_search_type = "road";
          } else if (sf === "jibun_address") {
            (cleanFilters as any).address_search = q;
            (cleanFilters as any).address_search_type = "jibun";
          } else if (sf === "road_address") {
            (cleanFilters as any).road_address_search = q;
          }
          delete (cleanFilters as any).searchQuery;
          delete (cleanFilters as any).searchField;
        }

        return [
          "/api/v1/real-rents/",
          {
            ...(cleanFilters as any),
            page,
            size,
          },
        ] as const;
      },
      fetchList: async ({ filters, page, size }) => {
        // 화이트리스트로 허용된 필터만 선택
        const allowedFilters = pickAllowed(filters as any, RENT_FILTERS);
        const cleanFilters = { ...allowedFilters } as Record<string, unknown>;

        // 선택 항목만 보기(ids) 서버 필터 연동: showSelectedOnly && selectedIds 있을 때만 적용
        try {
          const selOnly = (filters as any)?.showSelectedOnly === true;
          const idsArr = Array.isArray((filters as any)?.selectedIds)
            ? ((filters as any)?.selectedIds as any[])
            : [];
          if (selOnly && idsArr.length > 0) {
            const capped = idsArr
              .slice(0, 500)
              .map((v) => String(v))
              .filter((s) => s && s !== "undefined" && s !== "null");
            if (capped.length > 0) (cleanFilters as any).ids = capped.join(",");
          }
        } catch {}

        // 좌표 기반 필터 제거
        delete (cleanFilters as any).lat;
        delete (cleanFilters as any).lng;
        delete (cleanFilters as any).south;
        delete (cleanFilters as any).west;
        delete (cleanFilters as any).north;
        delete (cleanFilters as any).east;
        delete (cleanFilters as any).radius_km;

        // 지역 필터를 real_rents 백엔드 필드명으로 매핑
        if (allowedFilters.province) {
          (cleanFilters as any).sido = allowedFilters.province;
          delete (cleanFilters as any).province;
        }
        if (allowedFilters.cityDistrict) {
          const pd = (allowedFilters as any).province as string | undefined;
          const cd = String((allowedFilters as any).cityDistrict || "");
          const withPrefix =
            pd && !cd.startsWith(String(pd)) ? `${pd} ${cd}` : cd;
          (cleanFilters as any).sigungu = withPrefix;
          delete (cleanFilters as any).cityDistrict;
        }
        if (allowedFilters.town) {
          (cleanFilters as any).admin_dong_name = allowedFilters.town;
          delete (cleanFilters as any).town;
        }

        // 정렬 파라미터를 서버 ordering 형식으로 변환
        if (allowedFilters.sortBy && allowedFilters.sortOrder) {
          const serverKey = camelToSnake(allowedFilters.sortBy as string);
          if (serverKey) {
            const order = allowedFilters.sortOrder as string;
            (cleanFilters as any).ordering = `${
              order === "desc" ? "-" : ""
            }${serverKey}`;
            delete (cleanFilters as any).sortBy;
            delete (cleanFilters as any).sortOrder;
          }
        }

        // 보증금 범위 매핑
        if (Array.isArray((allowedFilters as any).depositRange)) {
          const [minDeposit, maxDeposit] = (allowedFilters as any)
            .depositRange as [number, number];
          if (typeof minDeposit === "number" && minDeposit > 0)
            (cleanFilters as any).min_deposit_amount = minDeposit;
          if (typeof maxDeposit === "number" && maxDeposit > 0)
            (cleanFilters as any).max_deposit_amount = maxDeposit;
          delete (cleanFilters as any).depositRange;
        }

        // 월세 범위 매핑
        if (Array.isArray((allowedFilters as any).monthlyRentRange)) {
          const [minMonthly, maxMonthly] = (allowedFilters as any)
            .monthlyRentRange as [number, number];
          if (typeof minMonthly === "number" && minMonthly > 0)
            (cleanFilters as any).min_monthly_rent = minMonthly;
          if (typeof maxMonthly === "number" && maxMonthly > 0)
            (cleanFilters as any).max_monthly_rent = maxMonthly;
          delete (cleanFilters as any).monthlyRentRange;
        }

        // 전용면적 범위 매핑
        if (Array.isArray((allowedFilters as any).areaRange)) {
          const [minArea, maxArea] = (allowedFilters as any).areaRange as [
            number,
            number
          ];
          if (typeof minArea === "number" && minArea > 0)
            (cleanFilters as any).min_exclusive_area = minArea;
          if (typeof maxArea === "number" && maxArea > 0)
            (cleanFilters as any).max_exclusive_area = maxArea;
          delete (cleanFilters as any).areaRange;
        }

        // 건축연도 범위 매핑
        if (Array.isArray((allowedFilters as any).buildYearRange)) {
          const [minYear, maxYear] = (allowedFilters as any).buildYearRange as [
            number,
            number
          ];
          if (typeof minYear === "number" && minYear > 1900)
            (cleanFilters as any).min_construction_year = minYear;
          if (typeof maxYear === "number" && maxYear > 1900)
            (cleanFilters as any).max_construction_year = maxYear;
          delete (cleanFilters as any).buildYearRange;
        }

        // 날짜 범위 매핑
        if (Array.isArray((allowedFilters as any).dateRange)) {
          const [startDate, endDate] = (allowedFilters as any).dateRange as [
            string,
            string
          ];
          if (startDate) (cleanFilters as any).contract_date_from = startDate;
          if (endDate) (cleanFilters as any).contract_date_to = endDate;
          delete (cleanFilters as any).dateRange;
        }

        // 전월세 구분
        if ((allowedFilters as any).rentType) {
          (cleanFilters as any).rent_type = (allowedFilters as any).rentType;
          delete (cleanFilters as any).rentType;
        }

        // 전월세 전환금 범위 → min/max_jeonse_conversion_amount
        if (
          Array.isArray((allowedFilters as any).jeonseConversionAmountRange)
        ) {
          const [minConv, maxConv] = (allowedFilters as any)
            .jeonseConversionAmountRange as [number, number];
          if (typeof minConv === "number" && Number.isFinite(minConv))
            (cleanFilters as any).min_jeonse_conversion_amount = minConv;
          if (typeof maxConv === "number" && Number.isFinite(maxConv))
            (cleanFilters as any).max_jeonse_conversion_amount = maxConv;
          delete (cleanFilters as any).jeonseConversionAmountRange;
        }

        // 연 임대수익률(%) 범위 → min/max_rental_yield_annual
        if (Array.isArray((allowedFilters as any).rentalYieldAnnualRange)) {
          const [minY, maxY] = (allowedFilters as any)
            .rentalYieldAnnualRange as [number, number];
          if (typeof minY === "number" && Number.isFinite(minY))
            (cleanFilters as any).min_rental_yield_annual = minY;
          if (typeof maxY === "number" && Number.isFinite(maxY))
            (cleanFilters as any).max_rental_yield_annual = maxY;
          delete (cleanFilters as any).rentalYieldAnnualRange;
        }

        // 평당 보증금 → min/max_deposit_per_pyeong
        if (Array.isArray((allowedFilters as any).depositPerPyeongRange)) {
          const [minDP, maxDP] = (allowedFilters as any)
            .depositPerPyeongRange as [number, number];
          if (typeof minDP === "number" && Number.isFinite(minDP))
            (cleanFilters as any).min_deposit_per_pyeong = minDP;
          if (typeof maxDP === "number" && Number.isFinite(maxDP))
            (cleanFilters as any).max_deposit_per_pyeong = maxDP;
          delete (cleanFilters as any).depositPerPyeongRange;
        }

        // 평당 월세 → min/max_monthly_rent_per_pyeong
        if (Array.isArray((allowedFilters as any).monthlyRentPerPyeongRange)) {
          const [minMP, maxMP] = (allowedFilters as any)
            .monthlyRentPerPyeongRange as [number, number];
          if (typeof minMP === "number" && Number.isFinite(minMP))
            (cleanFilters as any).min_monthly_rent_per_pyeong = minMP;
          if (typeof maxMP === "number" && Number.isFinite(maxMP))
            (cleanFilters as any).max_monthly_rent_per_pyeong = maxMP;
          delete (cleanFilters as any).monthlyRentPerPyeongRange;
        }

        // 층확인/엘리베이터(백엔드 지원 시)
        {
          const fc = (allowedFilters as any).floorConfirmation;
          const isArray = Array.isArray(fc);
          const isString = typeof fc === "string";
          const mapFloorToken = (v: string): string => {
            switch (v) {
              case "basement":
                return "반지하";
              case "first_floor":
                return "1층";
              case "normal_floor":
                return "일반층";
              case "top_floor":
                return "옥탑";
              default:
                return v;
            }
          };
          if (isArray && (fc as any[]).length > 0) {
            const mapped = (fc as string[]).map(mapFloorToken).filter(Boolean);
            (cleanFilters as any).floor_confirmation = mapped.join(",");
          } else if (isString && (fc as string).trim() !== "" && fc !== "all") {
            (cleanFilters as any).floor_confirmation = mapFloorToken(
              fc as string
            );
          }
          delete (cleanFilters as any).floorConfirmation;
        }
        if (
          (allowedFilters as any).elevatorAvailable !== undefined &&
          (allowedFilters as any).elevatorAvailable !== "all"
        ) {
          (cleanFilters as any).elevator_available = (
            allowedFilters as any
          ).elevatorAvailable;
          delete (cleanFilters as any).elevatorAvailable;
        }

        // 주소 검색 매핑 (Option A/B)
        if (
          (allowedFilters as any).searchQuery &&
          (allowedFilters as any).searchField
        ) {
          const sf = String((allowedFilters as any).searchField);
          const q = (allowedFilters as any).searchQuery as string;
          if (sf === "address") {
            (cleanFilters as any).address_search = q;
            (cleanFilters as any).address_search_type = "road";
          } else if (sf === "jibun_address") {
            (cleanFilters as any).address_search = q;
            (cleanFilters as any).address_search_type = "jibun";
          } else if (sf === "road_address") {
            (cleanFilters as any).road_address_search = q;
          }
          delete (cleanFilters as any).searchQuery;
          delete (cleanFilters as any).searchField;
        }

        return realRentApi.getRents({
          ...(cleanFilters as any),
          page,
          size,
        });
      },
    },
    adapter: {
      toItemLike: (r: any) => {
        const address = extractAddress(r);
        const { lat, lng } = extractLatLng(r);
        const area = extractAreaM2(r);
        const buildYear = extractBuildYear(r);
        // 서버: price = deposit + monthly_rent * k(기본 100)
        const price = toNumber(
          pickFirst(r?.price, r?.deposit_amount, r?.deposit)
        );
        const id = pickFirst(r?.id, r?.doc_id, r?.uuid);
        return {
          id: String(id ?? ""),
          address,
          price,
          area,
          buildYear,
          lat,
          lng,
          extra: {
            // 기본 키/메타
            createdAt: r?.created_at,

            // 실거래 기본 정보
            sido: r?.sido,
            sigungu: r?.sigungu,
            roadAddressReal: r?.road_address_real,
            buildingNameReal: r?.building_name_real,
            constructionYearReal: toNumber(r?.construction_year_real),
            exclusiveAreaSqm: toNumber(r?.exclusive_area_sqm),

            // 전월세 구분/계약 정보(핵심)
            rentType: r?.rent_type,
            contractType: r?.contract_type,
            contractYear: toNumber(r?.contract_year),
            contractMonth: toNumber(r?.contract_month),
            contractDay: toNumber(r?.contract_day),
            contractDate: r?.contract_date,
            floorInfoReal: r?.floor_info_real,

            // 계약 기간 상세
            contractPeriod: r?.contract_period,
            contractStartDate: r?.contract_start_date,
            contractEndDate: r?.contract_end_date,
            contractPeriodYears: toNumber(r?.contract_period_years),

            // 금액(핵심)
            depositAmount: toNumber(r?.deposit_amount),
            monthlyRent: toNumber(r?.monthly_rent),

            // 갱신 비교
            previousDeposit: toNumber(r?.previous_deposit),
            previousMonthlyRent: toNumber(r?.previous_monthly_rent),
            depositChangeAmount: toNumber(r?.deposit_change_amount),
            rentChangeAmount: toNumber(r?.rent_change_amount),
            depositChangeRatio: toNumber(r?.deposit_change_ratio),
            rentChangeRatio: toNumber(r?.rent_change_ratio),

            // 전월세 전환
            jeonseConversionAmount: toNumber(r?.jeonse_conversion_amount),

            // 주소/좌표/행정
            roadAddress: r?.road_address,
            sidoAdmin: r?.sido_admin,
            latitude: toNumber(r?.latitude),
            longitude: toNumber(r?.longitude),
            buildingRegistryPk: r?.building_registry_pk,
            adminCode: r?.admin_code,
            legalCode: r?.legal_code,
            jibunAddress: r?.jibun_address,
            legalDongUnit: r?.legal_dong_unit,
            adminDongName: r?.admin_dong_name,
            postalCode: r?.postal_code,
            pnu: r?.pnu,
            buildingName: r?.building_name,
            dongName: r?.dong_name,

            // 건축물 상세/편의
            landAreaSqm: toNumber(r?.land_area_sqm),
            constructionAreaSqm: toNumber(r?.construction_area_sqm),
            totalFloorAreaSqm: toNumber(r?.total_floor_area_sqm),
            buildingCoverageRatio: toNumber(r?.building_coverage_ratio),
            floorAreaRatio: toNumber(r?.floor_area_ratio),
            mainStructure: r?.main_structure,
            mainUsage: r?.main_usage,
            otherUsage: r?.other_usage,
            buildingHeight: toNumber(r?.building_height),
            groundFloors: toNumber(r?.ground_floors),
            basementFloors: toNumber(r?.basement_floors),
            householdCount: toNumber(r?.household_count),
            familyCount: toNumber(r?.family_count),
            roomNumber: r?.room_number,
            usageApprovalDate: r?.usage_approval_date,
            elevatorCount: toNumber(r?.elevator_count),
            floorConfirmation: r?.floor_confirmation,
            elevatorAvailable: r?.elevator_available,
            adminDong: r?.admin_dong,

            // 계산된 필드
            exclusiveAreaPyeong: toNumber(r?.exclusive_area_pyeong),
            depositPerPyeong: toNumber(r?.deposit_per_pyeong),
            monthlyRentPerPyeong: toNumber(r?.monthly_rent_per_pyeong),
            rentalYieldMonthly: toNumber(r?.rental_yield_monthly),
            rentalYieldAnnual: toNumber(r?.rental_yield_annual),

            // API 응답에서 실제 제공되는 추가 필드들
            constructionYear: toNumber(r?.construction_year),

            // 기존 호환성
            deposit: toNumber(pickFirst(r?.deposit_amount, r?.deposit)),
            price_basis: r?.price_basis, // "deposit_plus_monthly"
            price_k: toNumber(r?.price_k), // 100
          },
        };
      },
    },
    table: {
      columns: columnsRent as any,
      defaultSort: { key: "contractDate", order: "desc" },
    },
    filters: { defaults: {}, ui: [] },
  },
  listings: {
    id: "listings",
    title: "매물",
    api: {
      buildListKey: ({ filters, page, size }) =>
        [
          "/api/v1/naver-products/",
          {
            ...pickAllowed(filters as any, ALLOWED_FILTERS_WITH_SORT),
            page,
            size,
          },
        ] as const,
      fetchList: async ({ filters, page, size }) => {
        // 백엔드 확정 전: 개발 환경에서는 간단 목업 데이터 제공하여 지도/목록 연동 검증
        const useMock =
          (process.env.NEXT_PUBLIC_LISTINGS_MOCK ?? "") === "1" ||
          process.env.NODE_ENV !== "production";
        if (useMock) {
          const f = pickAllowed(filters as any, ALLOWED_FILTERS);
          const lat = Number((f as any)?.lat) || 37.5665;
          const lng = Number((f as any)?.lng) || 126.978;
          const radiusKm = Math.min(
            10,
            Math.max(0.5, Number((f as any)?.radius_km) || 2)
          );
          const count = Math.min(20, Number(size) || 10);
          const items: any[] = Array.from({ length: count }).map((_, i) => {
            const angle = (i / count) * Math.PI * 2;
            const dKm = radiusKm * 0.6 * (0.3 + (i % 7) / 10);
            const dLat = (dKm / 111) * Math.cos(angle);
            const dLng =
              (dKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
            return {
              id: `L-${page}-${i + 1}`,
              address: `샘플 매물 ${i + 1}`,
              price: 25000 + i * 700,
              area: 35 + (i % 5) * 8,
              lat: lat + dLat,
              lng: lng + dLng,
              postedAt: "2025-08-28",
            };
          });
          return { items, total: 120, page, size } as any;
        }
        return {
          items: [],
          total: 0,
          page,
          size,
          // 실서버 전환 시 화이트리스트 적용 유지
          _filters: pickAllowed(filters as any, ALLOWED_FILTERS),
        } as any;
      },
    },
    adapter: {
      toItemLike: (r: any) => {
        const address = extractAddress(r);
        const { lat, lng } = extractLatLng(r);
        const area = extractAreaM2(r);
        const price = toNumber(r?.price);
        const id = pickFirst(r?.id, r?.doc_id, r?.uuid);
        return {
          id: String(id ?? ""),
          address,
          price,
          area,
          lat,
          lng,
          extra: { postedAt: r?.postedAt },
        };
      },
    },
    table: {
      columns: columnsListings as any,
      defaultSort: undefined,
    },
    filters: { defaults: {}, ui: [] },
  },
};
