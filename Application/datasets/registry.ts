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

export const datasetConfigs: Record<DatasetId, DatasetConfig> = {
  auction_ed: {
    id: "auction_ed",
    title: "과거경매결과",
    api: {
      buildListKey: ({ filters, page, size }) => {
        const allowedFilters = pickAllowed(
          filters as any,
          ALLOWED_FILTERS_WITH_SORT
        );
        // auction_ed에서는 좌표 기반 필터링 비활성화
        delete allowedFilters.lat;
        delete allowedFilters.lng;
        delete allowedFilters.south;
        delete allowedFilters.west;
        delete allowedFilters.north;
        delete allowedFilters.east;
        delete allowedFilters.radius_km;

        // 지역 필터를 auction_ed 백엔드 필드명으로 매핑
        const mappedFilters = { ...allowedFilters };
        if (filters?.province) {
          mappedFilters.sido = filters.province;
          delete mappedFilters.province;
        }
        if (filters?.cityDistrict) {
          mappedFilters.address_city = filters.cityDistrict;
          delete mappedFilters.cityDistrict;
        }
        if (filters?.town) {
          mappedFilters.eup_myeon_dong = filters.town;
          delete mappedFilters.town;
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
        const allowedFilters = pickAllowed(filters as any, ALLOWED_FILTERS);
        // auction_ed에서는 좌표 기반 필터링 비활성화
        delete allowedFilters.lat;
        delete allowedFilters.lng;
        delete allowedFilters.south;
        delete allowedFilters.west;
        delete allowedFilters.north;
        delete allowedFilters.east;
        delete allowedFilters.radius_km;

        // 지역 필터를 auction_ed 백엔드 필드명으로 매핑
        const mappedFilters = { ...allowedFilters };
        if (filters?.province) {
          mappedFilters.sido = filters.province;
          delete mappedFilters.province;
        }
        if (filters?.cityDistrict) {
          mappedFilters.address_city = filters.cityDistrict;
          delete mappedFilters.cityDistrict;
        }
        if (filters?.town) {
          mappedFilters.eup_myeon_dong = filters.town;
          delete mappedFilters.town;
        }

        return auctionApi.getCompleted({
          ...mappedFilters,
          page,
          size,
          ...(filters?.sortBy && filters?.sortOrder
            ? {
                sort_by: (filters as any).sortBy,
                sort_order: (filters as any).sortOrder,
              }
            : {}),
        });
      },
    },
    adapter: {
      toItemLike: (r: any) => {
        const address =
          (pickFirst(
            r?.road_address,
            r?.address,
            r?.full_address,
            r?.jibun_address
          ) as string) || "";

        // 좌표 처리 - latitude/longitude 필드 우선 사용
        const lat = toNumber(pickFirst(r?.latitude, r?.lat, r?.lat_y, r?.y));
        const lng = toNumber(pickFirst(r?.longitude, r?.lng, r?.lon, r?.x));

        // 면적 - building_area_pyeong을 m2로 변환 (1평 = 3.306m2)
        const area = (() => {
          const pyeong = toNumber(r?.building_area_pyeong);
          if (pyeong !== undefined) return pyeong * 3.306;
          return toNumber(
            pickFirst(r?.area, r?.exclusive_area_sqm, r?.area_sqm)
          );
        })();

        const buildYear = toNumber(
          pickFirst(
            r?.construction_year,
            r?.buildYear,
            r?.build_year,
            r?.year_built
          )
        );

        const price = toNumber(
          pickFirst(r?.final_sale_price, r?.price, r?.finalPrice)
        );

        const id = pickFirst(r?.id, r?.doc_id, r?.uuid, r?.case_number);

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
            roadAddress: r?.road_address,
            addressArea: r?.address_area,
            addressCity: r?.address_city,
            locationDetail: r?.location_detail,
            buildingName: r?.building_name,
            generalLocation: r?.general_location,
            sido: r?.sido,
            eupMyeonDong: r?.eup_myeon_dong,

            // 경매 가격 정보
            appraisedValue: toNumber(r?.appraised_value),
            minimumBidPrice: toNumber(r?.minimum_bid_price),
            bidToAppraisedRatio: toNumber(r?.bid_to_appraised_ratio),
            finalSalePrice: toNumber(r?.final_sale_price),
            saleToAppraisedRatio: toNumber(r?.sale_to_appraised_ratio),
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
            elevatorAvailable: r?.elevator_available,
            elevatorCount: toNumber(r?.elevator_count),
            householdCount: toNumber(r?.household_count),

            // 법적 권리/특이사항
            specialRights: r?.special_rights,

            // 코드/식별 정보
            postalCode: r?.postal_code,
            pnu: r?.pnu,

            // 좌표 정보 (이미 lat, lng로 처리되고 있으므로 추가)
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
        const cleanFilters = { ...filters };
        // 좌표 기반 필터 제거 (auction_ed와 동일한 문제)
        delete cleanFilters.lat;
        delete cleanFilters.lng;
        delete cleanFilters.south;
        delete cleanFilters.west;
        delete cleanFilters.north;
        delete cleanFilters.east;
        delete cleanFilters.radius_km;

        // 지역 필터를 real_transactions 백엔드 필드명으로 매핑
        if (filters?.province) {
          cleanFilters.sido = filters.province;
          delete cleanFilters.province;
        }
        if (filters?.cityDistrict) {
          cleanFilters.sigungu = filters.cityDistrict;
          delete cleanFilters.cityDistrict;
        }
        if (filters?.town) {
          cleanFilters.admin_dong_name = filters.town;
          delete cleanFilters.town;
        }

        return [
          "/api/v1/real-transactions/",
          {
            ...pickAllowed(cleanFilters as any, ALLOWED_FILTERS_WITH_SORT),
            page,
            size,
          },
        ] as const;
      },
      fetchList: async ({ filters, page, size }) => {
        const cleanFilters = { ...filters };
        // 좌표 기반 필터 제거
        delete cleanFilters.lat;
        delete cleanFilters.lng;
        delete cleanFilters.south;
        delete cleanFilters.west;
        delete cleanFilters.north;
        delete cleanFilters.east;
        delete cleanFilters.radius_km;

        // 지역 필터를 real_transactions 백엔드 필드명으로 매핑
        if (filters?.province) {
          cleanFilters.sido = filters.province;
          delete cleanFilters.province;
        }
        if (filters?.cityDistrict) {
          cleanFilters.sigungu = filters.cityDistrict;
          delete cleanFilters.cityDistrict;
        }
        if (filters?.town) {
          cleanFilters.admin_dong_name = filters.town;
          delete cleanFilters.town;
        }

        return realTransactionApi.getTransactions({
          ...pickAllowed(cleanFilters as any, ALLOWED_FILTERS),
          page,
          size,
          ...(filters?.sortBy && filters?.sortOrder
            ? {
                sort_by: (filters as any).sortBy,
                sort_order: (filters as any).sortOrder,
              }
            : {}),
        });
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
      defaultSort: { key: "transactionAmount", order: "desc" },
    },
    filters: { defaults: {}, ui: [] },
  },
  rent: {
    id: "rent",
    title: "실거래가(전월세)",
    api: {
      buildListKey: ({ filters, page, size }) => {
        const cleanFilters = { ...filters };
        // 좌표 기반 필터 제거 (sale/auction_ed와 동일한 문제)
        delete cleanFilters.lat;
        delete cleanFilters.lng;
        delete cleanFilters.south;
        delete cleanFilters.west;
        delete cleanFilters.north;
        delete cleanFilters.east;
        delete cleanFilters.radius_km;

        // 지역 필터를 real_rents 백엔드 필드명으로 매핑
        if (filters?.province) {
          cleanFilters.sido = filters.province;
          delete cleanFilters.province;
        }
        if (filters?.cityDistrict) {
          cleanFilters.sigungu = filters.cityDistrict;
          delete cleanFilters.cityDistrict;
        }
        if (filters?.town) {
          cleanFilters.admin_dong_name = filters.town;
          delete cleanFilters.town;
        }

        return [
          "/api/v1/real-rents/",
          {
            ...pickAllowed(cleanFilters as any, ALLOWED_FILTERS_WITH_SORT),
            page,
            size,
          },
        ] as const;
      },
      fetchList: async ({ filters, page, size }) => {
        const cleanFilters = { ...filters };
        // 좌표 기반 필터 제거
        delete cleanFilters.lat;
        delete cleanFilters.lng;
        delete cleanFilters.south;
        delete cleanFilters.west;
        delete cleanFilters.north;
        delete cleanFilters.east;
        delete cleanFilters.radius_km;

        // 지역 필터를 real_rents 백엔드 필드명으로 매핑
        if (filters?.province) {
          cleanFilters.sido = filters.province;
          delete cleanFilters.province;
        }
        if (filters?.cityDistrict) {
          cleanFilters.sigungu = filters.cityDistrict;
          delete cleanFilters.cityDistrict;
        }
        if (filters?.town) {
          cleanFilters.admin_dong_name = filters.town;
          delete cleanFilters.town;
        }

        return realRentApi.getRents({
          ...pickAllowed(cleanFilters as any, ALLOWED_FILTERS),
          page,
          size,
          ...(filters?.sortBy && filters?.sortOrder
            ? {
                sort_by: (filters as any).sortBy,
                sort_order: (filters as any).sortOrder,
              }
            : {}),
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
      defaultSort: { key: "depositAmount", order: "desc" },
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
