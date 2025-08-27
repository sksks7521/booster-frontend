import { DatasetConfig, DatasetId } from "@/types/datasets";
import { auctionApi, realTransactionApi, realRentApi } from "@/lib/api";

export const datasetConfigs: Record<DatasetId, DatasetConfig> = {
  auction_ed: {
    id: "auction_ed",
    title: "과거경매결과",
    api: {
      buildListKey: ({ filters, page, size }) =>
        [
          "/api/v1/auction-completed/",
          { ...(filters ?? {}), page, limit: size },
        ] as const,
      fetchList: async ({ filters, page, size }) =>
        auctionApi.getCompleted({ ...(filters ?? {}), page, limit: size }),
    },
    adapter: {
      toItemLike: (r: any) => ({
        id: String(r?.id ?? ""),
        address: r?.address ?? "",
        price: r?.finalPrice ?? r?.price ?? null,
        area: r?.area,
        buildYear: r?.buildYear ?? r?.construction_year,
        lat: r?.lat,
        lng: r?.lng,
        extra: { auctionDate: r?.auctionDate, bidCount: r?.bidCount },
      }),
    },
    table: {
      columns: [
        { key: "address", header: "주소" },
        { key: "price", header: "낙찰가(만원)" },
        { key: "area", header: "면적(㎡)" },
        { key: "auctionDate", header: "매각기일" },
        { key: "bidCount", header: "입찰수" },
      ],
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
          { ...(filters ?? {}), page, limit: size },
        ] as const,
      fetchList: async ({ filters, page, size }) =>
        realTransactionApi.getTransactions({
          ...(filters ?? {}),
          page,
          limit: size,
        }),
    },
    adapter: {
      toItemLike: (r: any) => ({
        id: String(r?.id ?? ""),
        address: r?.address,
        price: r?.price,
        area: r?.area,
        buildYear: r?.buildYear,
        lat: r?.lat,
        lng: r?.lng,
        extra: {
          transactionDate: r?.transactionDate,
          transactionType: r?.transactionType,
        },
      }),
    },
    table: {
      columns: [
        { key: "address", header: "주소" },
        { key: "price", header: "거래가(만원)" },
        { key: "area", header: "면적(㎡)" },
        { key: "transactionDate", header: "거래일" },
      ],
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
          { ...(filters ?? {}), page, limit: size },
        ] as const,
      fetchList: async ({ filters, page, size }) =>
        realRentApi.getRents({ ...(filters ?? {}), page, limit: size }),
    },
    adapter: {
      toItemLike: (r: any) => ({
        id: String(r?.id ?? ""),
        address: r?.address,
        price: r?.deposit, // 표시는 프론트에서 월세 표기 병행 가능
        area: r?.area,
        buildYear: r?.buildYear,
        lat: r?.lat,
        lng: r?.lng,
        extra: {
          deposit: r?.deposit,
          monthlyRent: r?.monthlyRent,
          rentType: r?.rentType,
        },
      }),
    },
    table: {
      columns: [
        { key: "address", header: "주소" },
        { key: "deposit", header: "보증금(만원)" },
        { key: "monthlyRent", header: "월세(만원)" },
        { key: "area", header: "면적(㎡)" },
      ],
      defaultSort: { key: "deposit", order: "desc" },
    },
    filters: { defaults: {}, ui: [] },
  },
  naver: {
    id: "naver",
    title: "네이버매물",
    api: {
      buildListKey: ({ filters, page, size }) =>
        [
          "/api/v1/naver-products/",
          { ...(filters ?? {}), page, limit: size },
        ] as const,
      fetchList: async ({ filters, page, size }) =>
        Promise.resolve({ items: [], total: 0, page, size }), // 백엔드 확정 전 목업
    },
    adapter: {
      toItemLike: (r: any) => ({
        id: String(r?.id ?? ""),
        address: r?.address,
        price: r?.price,
        area: r?.area,
        lat: r?.lat,
        lng: r?.lng,
        extra: { postedAt: r?.postedAt },
      }),
    },
    table: {
      columns: [
        { key: "address", header: "주소" },
        { key: "price", header: "가격(만원)" },
      ],
      defaultsort: undefined as any,
    },
    filters: { defaults: {}, ui: [] },
  },
};
