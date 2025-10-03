import { http, HttpResponse } from "msw";

// 샘플 데이터
const sampleItems = Array.from({ length: 5 }).map((_, i) => ({
  id: 100 + i,
  address: `서울시 강남구 역삼동 ${i + 1}-1`,
  price: 50000 + i * 1000,
  area: 25 + i,
  built_year: 2010 + i,
  property_type: "빌라",
  lat: 37.5 + i * 0.001,
  lng: 127.03 + i * 0.001,
  created_at: new Date().toISOString(),
}));

const comparablesResponse = {
  baseItem: sampleItems[0],
  comparables: sampleItems.slice(1).map((it, idx) => ({
    id: it.id,
    title: it.address,
    address: it.address,
    price: it.price,
    area: it.area,
    buildYear: it.built_year,
    distance: (idx + 1) * 0.42,
    similarity: 0.7 - idx * 0.1,
    pricePerArea: Math.round(it.price / it.area),
  })),
  statistics: {
    averagePrice: Math.round(
      sampleItems.reduce((s, it) => s + it.price, 0) / sampleItems.length
    ),
    averagePricePerArea: Math.round(
      sampleItems.reduce((s, it) => s + it.price / it.area, 0) /
        sampleItems.length
    ),
    priceRange: {
      min: Math.min(...sampleItems.map((it) => it.price)),
      max: Math.max(...sampleItems.map((it) => it.price)),
    },
    totalCount: sampleItems.length,
  },
  marketAnalysis: {
    priceGradeRelativeToMarket: "average",
    investmentPotential: "medium",
    liquidityScore: 7,
  },
};

export const handlers = [
  http.get("/health", () => HttpResponse.json({ status: "ok" })),

  http.get("/api/v1/items/simple", ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    return HttpResponse.json(sampleItems.slice(0, limit));
  }),

  http.get("/api/v1/items/", ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const page = Number(url.searchParams.get("page") ?? 1);
    const size = limit;
    const items = sampleItems.slice(0, limit);
    return HttpResponse.json({
      items,
      total: 100,
      page,
      size,
      pages: Math.ceil(100 / size),
    });
  }),

  http.get("/api/v1/items/:id", ({ params }) => {
    const id = Number(params.id as string);
    const found = sampleItems.find((it) => it.id === id) ?? sampleItems[0];
    return HttpResponse.json(found);
  }),

  http.get("/api/v1/items/:id/comparables", () => {
    return HttpResponse.json(comparablesResponse);
  }),

  http.get("/api/v1/auction-completed/", () => {
    const data = sampleItems.map((it, idx) => ({
      id: it.id,
      title: `${it.address} 낙찰사례`,
      address: it.address,
      finalPrice: it.price - 1000 * idx,
      area: it.area,
      auctionDate: new Date().toISOString(),
      bidCount: 3 + idx,
    }));
    return HttpResponse.json(data);
  }),

  // real-transactions는 실제 백엔드 사용 (MSW 우회)
  // http.get("/api/v1/real-transactions/", () => {
  //   const data = sampleItems.map((it) => ({
  //     id: it.id,
  //     address: it.address,
  //     price: it.price,
  //     area: it.area,
  //     transactionDate: new Date().toISOString(),
  //     transactionType: "sale",
  //   }));
  //   return HttpResponse.json(data);
  // }),

  http.get("/api/v1/real-rents/", () => {
    const data = sampleItems.map((it) => ({
      id: it.id,
      address: it.address,
      deposit: 1000,
      monthlyRent: 80,
      area: it.area,
      contractDate: new Date().toISOString(),
      contractType: "jeonse",
    }));
    return HttpResponse.json(data);
  }),
];
