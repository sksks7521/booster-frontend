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
      buildListKey: ({ filters, page, size }) =>
        [
          "/api/v1/auction-completed/",
          {
            ...pickAllowed(filters as any, ALLOWED_FILTERS_WITH_SORT),
            page,
            size,
          },
        ] as const,
      fetchList: async ({ filters, page, size }) =>
        auctionApi.getCompleted({
          ...pickAllowed(filters as any, ALLOWED_FILTERS),
          page,
          size,
          ...(filters?.sortBy && filters?.sortOrder
            ? {
                sort_by: (filters as any).sortBy,
                sort_order: (filters as any).sortOrder,
              }
            : {}),
        }),
    },
    adapter: {
      toItemLike: (r: any) => {
        const address = extractAddress(r);
        const { lat, lng } = extractLatLng(r);
        const area = extractAreaM2(r);
        const buildYear = extractBuildYear(r);
        const price = toNumber(
          pickFirst(r?.price, r?.finalPrice, r?.final_sale_price)
        );
        const id = pickFirst(
          r?.id,
          r?.doc_id,
          r?.uuid,
          r?.case_number,
          (r as any)?.CASE_NO,
          r?.caseNo
        );
        return {
          id: String(id ?? ""),
          address,
          price,
          area,
          buildYear,
          lat,
          lng,
          extra: {
            auctionDate: r?.auctionDate ?? r?.sale_date,
            bidCount: r?.bidCount,
          },
        };
      },
    },
    table: {
      columns: columnsAuctionEd as any,
      defaultSort: { key: "auctionDate", order: "desc" },
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
      buildListKey: ({ filters, page, size }) =>
        [
          "/api/v1/real-transactions/",
          {
            ...pickAllowed(filters as any, ALLOWED_FILTERS_WITH_SORT),
            page,
            size,
          },
        ] as const,
      fetchList: async ({ filters, page, size }) =>
        realTransactionApi.getTransactions({
          ...pickAllowed(filters as any, ALLOWED_FILTERS),
          page,
          size,
          ...(filters?.sortBy && filters?.sortOrder
            ? {
                sort_by: (filters as any).sortBy,
                sort_order: (filters as any).sortOrder,
              }
            : {}),
        }),
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
            transactionDate: r?.transactionDate ?? r?.contract_date,
            transactionType: r?.transactionType,
            price_per_area: r?.price_per_area, // 만원/㎡ (서버 환산/반올림 적용)
          },
        };
      },
    },
    table: {
      columns: columnsSale as any,
      defaultSort: { key: "transactionDate", order: "desc" },
    },
    filters: { defaults: {}, ui: [] },
  },
  rent: {
    id: "rent",
    title: "실거래가(전월세)",
    api: {
      buildListKey: ({ filters, page, size }) =>
        [
          "/api/v1/real-rents/",
          {
            ...pickAllowed(filters as any, ALLOWED_FILTERS_WITH_SORT),
            page,
            size,
            // OpenAPI v1: 전월세는 반경 모드에서 lat_center/lng_center 사용
            lat_center: (filters as any)?.lat,
            lng_center: (filters as any)?.lng,
          },
        ] as const,
      fetchList: async ({ filters, page, size }) =>
        realRentApi.getRents({
          ...pickAllowed(filters as any, ALLOWED_FILTERS),
          page,
          size,
          // OpenAPI v1: 전월세는 반경 모드에서 lat_center/lng_center 사용
          lat_center: (filters as any)?.lat,
          lng_center: (filters as any)?.lng,
          ...(filters?.sortBy && filters?.sortOrder
            ? {
                sort_by: (filters as any).sortBy,
                sort_order: (filters as any).sortOrder,
              }
            : {}),
        }),
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
            deposit: toNumber(pickFirst(r?.deposit_amount, r?.deposit)),
            monthlyRent: toNumber(pickFirst(r?.monthly_rent, r?.monthlyRent)),
            rentType: r?.rentType,
            price_basis: r?.price_basis, // "deposit_plus_monthly"
            price_k: toNumber(r?.price_k), // 100
          },
        };
      },
    },
    table: {
      columns: columnsRent as any,
      defaultSort: { key: "price", order: "desc" },
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
