"use client";
import MapView from "@/components/features/map-view";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, ArrowLeft, Layers, List, Map, BarChart3 } from "lucide-react";
import { useItemDetail } from "@/hooks/useItemDetail";
import { LoadingState, ErrorState } from "@/components/ui/data-state";
import { mapApiErrorToMessage } from "@/lib/errors";
import { usePropertyDetail } from "@/components/features/property-detail/hooks/usePropertyDetail";
import PropertyDetailSimple from "@/components/features/property-detail/PropertyDetailSimple";
import AuctionEdList from "@/components/features/detail-v2/auction-ed-list";
import SelectedFilterBar from "@/components/features/selected-filter-bar";
import FilterControl from "@/components/features/filter-control";
import { useDataset } from "@/hooks/useDataset";
import { datasetConfigs } from "@/datasets/registry";
import { useFilterStore } from "@/store/filterStore";
import ItemTable from "@/components/features/item-table";
import { ViewState } from "@/components/ui/view-state";
import { useSortableColumns } from "@/hooks/useSortableColumns";
import dynamic from "next/dynamic";
import { useFeatureFlags } from "@/lib/featureFlags";
import { formatArea, m2ToPyeong } from "@/lib/units";
const ItemTableVirtual = dynamic(
  () => import("@/components/features/item-table-virtual"),
  { ssr: false }
);
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PropertyDetailV2Page() {
  const params = useParams();
  const router = useRouter();
  const itemId = (params as any)?.id as string;

  const { property, isLoading, isRefreshing, error, refetch } =
    useItemDetail(itemId);

  // 상세 섹션 훅은 조건부 반환보다 위에서 항상 호출되도록 배치
  const numericId = Number(itemId);
  const {
    vm,
    isLoading: isDetailLoading,
    isError: isDetailError,
    reload: reloadDetail,
  } = usePropertyDetail(Number.isFinite(numericId) ? numericId : undefined);

  const searchParams = useSearchParams();
  const initialDs = useMemo(() => {
    const ds = searchParams?.get("ds");
    const normalized = ds === "naver" ? "listings" : ds;
    return normalized &&
      ["auction_ed", "sale", "rent", "listings"].includes(normalized)
      ? (normalized as any)
      : "auction_ed";
  }, [searchParams]);
  const [activeDataset, setActiveDataset] = useState(initialDs);
  type ViewType = "list" | "map" | "integrated";
  const initialView = useMemo(() => {
    const v = searchParams?.get("view");
    return v && ["list", "map", "integrated"].includes(v)
      ? (v as ViewType)
      : ("list" as ViewType);
  }, [searchParams]);
  const [viewByDataset, setViewByDataset] = useState<Record<string, ViewType>>(
    () => ({
      auction_ed: initialDs === "auction_ed" ? initialView : "list",
      sale: initialDs === "sale" ? initialView : "list",
      rent: initialDs === "rent" ? initialView : "list",
      listings: initialDs === "listings" ? initialView : "list",
    })
  );
  const activeView =
    (viewByDataset[activeDataset] as ViewType) ?? ("list" as ViewType);
  // 탭 전환 간 스크롤 위치 보존
  const scrollByDatasetViewRef = useRef<Record<string, number>>({});
  const getScrollKey = (ds: string, v: ViewType) => `${ds}:${v}`;
  const saveScrollPosition = () => {
    try {
      scrollByDatasetViewRef.current[getScrollKey(activeDataset, activeView)] =
        typeof window !== "undefined" ? window.scrollY : 0;
    } catch {}
  };
  const restoreScrollPosition = () => {
    try {
      const y =
        scrollByDatasetViewRef.current[getScrollKey(activeDataset, activeView)];
      if (typeof y === "number") {
        setTimeout(() => {
          try {
            window.scrollTo({ top: y, left: 0, behavior: "auto" });
          } catch {}
        }, 0);
      }
    } catch {}
  };
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearch = () => {};
  const initialPage = useMemo(() => {
    const p = Number(searchParams?.get("p"));
    return Number.isFinite(p) && p > 0 ? p : 1;
  }, [searchParams]);
  const initialSize = useMemo(() => {
    const s = Number(searchParams?.get("s"));
    return Number.isFinite(s) && s > 0 ? s : 20;
  }, [searchParams]);
  const [pageNum, setPageNum] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialSize);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bounds, setBounds] = useState<{
    south: number;
    west: number;
    north: number;
    east: number;
  } | null>(null);
  const centerAndRadius = useMemo(() => {
    // 0) URL로 전달된 lat/lng/radius 우선 적용
    const qsLat = Number(searchParams?.get("lat"));
    const qsLng = Number(searchParams?.get("lng"));
    const qsRadius = Number(searchParams?.get("radius_km"));
    if (Number.isFinite(qsLat) && Number.isFinite(qsLng)) {
      const r = Number.isFinite(qsRadius) && qsRadius > 0 ? qsRadius : 5;
      return {
        lat: qsLat,
        lng: qsLng,
        radius_km: Math.min(10, Math.max(0.5, r)),
      } as const;
    }
    // 1) 지도 bounds가 있으면 중심+반경 계산
    if (bounds) {
      const lat = (bounds.south + bounds.north) / 2;
      const lng = (bounds.west + bounds.east) / 2;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const R = 6371;
      const lat1 = toRad(lat);
      const lng1 = toRad(lng);
      const lat2 = toRad(bounds.north);
      const lng2 = toRad(bounds.east);
      const dlat = lat2 - lat1;
      const dlng = lng2 - lng1;
      const a =
        Math.sin(dlat / 2) * Math.sin(dlat / 2) +
        Math.cos(lat1) *
          Math.cos(lat2) *
          Math.sin(dlng / 2) *
          Math.sin(dlng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const diagKm = R * c;
      const radius_km = Math.min(10, Math.max(0.5, diagKm / 2));
      return { lat, lng, radius_km } as const;
    }
    // 2) 초기 bounds가 없을 때: 상세(property) 좌표 기반 폴백(반경 2km)
    const plat =
      (property as any)?.lat ??
      (property as any)?.latitude ??
      (property as any)?.lat_y ??
      (property as any)?.y;
    const plng =
      (property as any)?.lng ??
      (property as any)?.longitude ??
      (property as any)?.lon ??
      (property as any)?.x;
    const latNum = typeof plat === "number" ? plat : parseFloat(String(plat));
    const lngNum = typeof plng === "number" ? plng : parseFloat(String(plng));
    if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
      // 초기 반경을 5km로 상향하여 0건 문제 완화
      return { lat: latNum, lng: lngNum, radius_km: 5 } as const;
    }
    return null;
  }, [bounds, property, searchParams]);

  // analysis → v2로 넘어올 때 URL의 지역 파라미터를 스토어에 1회 주입
  const setFilter = useFilterStore((s: any) => s.setFilter);
  useEffect(() => {
    try {
      const p = searchParams?.get("province");
      const c = searchParams?.get("cityDistrict");
      const t = searchParams?.get("town");
      let updated = false;
      if (p) {
        setFilter("province", p);
        updated = true;
      }
      if (c) {
        setFilter("cityDistrict", c);
        updated = true;
      }
      if (t) {
        setFilter("town", t);
        updated = true;
      }
      if (updated) {
        // 지역이 채워지면 첫 페이지부터 다시
        setPageNum(1);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 공통 데이터셋 훅 연결(필터는 후속 단계에서 namespace 적용 예정)
  // v2에서는 공통 스토어의 일부 필드만 쿼리로 사용 (기존 analysis와 충돌 없음)
  const zFilters = useFilterStore((s: any) => s);
  const queryFilters = {
    province: zFilters?.province,
    cityDistrict: zFilters?.cityDistrict,
    town: zFilters?.town,
    south: bounds?.south,
    west: bounds?.west,
    north: bounds?.north,
    east: bounds?.east,
    lat: centerAndRadius?.lat,
    lng: centerAndRadius?.lng,
    radius_km: centerAndRadius?.radius_km,
    price_min: Array.isArray(zFilters?.priceRange)
      ? zFilters.priceRange[0]
      : undefined,
    price_max: Array.isArray(zFilters?.priceRange)
      ? zFilters.priceRange[1]
      : undefined,
    build_year_min: Array.isArray(zFilters?.buildYear)
      ? zFilters.buildYear[0]
      : undefined,
    build_year_max: Array.isArray(zFilters?.buildYear)
      ? zFilters.buildYear[1]
      : undefined,
  } as Record<string, unknown>;

  const {
    items: dsItems,
    total: dsTotal,
    isLoading: dsLoading,
    error: dsError,
    mutate: dsRefetch,
  } = useDataset(activeDataset as any, queryFilters, pageNum, pageSize);

  // 가상 스크롤 사용 조건: 전역 플래그 또는 총 건수 임계치 초과
  const { virtualTable, areaDisplay } = useFeatureFlags();
  const useVirtual = virtualTable || (dsTotal ?? 0) > 500;

  // 정렬 상태/설정
  const setSortConfig = useFilterStore((s: any) => s.setSortConfig);
  const sortBy = useFilterStore((s: any) => s.sortBy);
  const sortOrder = useFilterStore((s: any) => s.sortOrder);
  const { sortableColumns } = useSortableColumns(activeDataset as any);

  const handleSort = (column?: string, direction?: "asc" | "desc") => {
    if (
      column &&
      Array.isArray(sortableColumns) &&
      sortableColumns.length > 0 &&
      !sortableColumns.includes(column)
    ) {
      console.warn(`[v2 Sort] 금지된 컬럼 무시: ${column}`);
      return;
    }
    setSortConfig(column || undefined, direction);
    // 정렬 변경 시 페이지 초기화
    setPageNum(1);
  };

  const handleChangeView = (next: ViewType) => {
    saveScrollPosition();
    setViewByDataset((prev) => ({ ...prev, [activeDataset]: next }));
  };

  const handleChangeDataset = (nextDs: string) => {
    saveScrollPosition();
    setActiveDataset(nextDs);
  };

  // ✅ URL 동기화: ds, p, s만 반영 (view는 로컬 상태로만 유지하여 탭 전환 시 불필요한 URL 변경 방지)
  useEffect(() => {
    try {
      const current = new URLSearchParams(searchParams?.toString() || "");
      current.set("ds", activeDataset);
      current.set("p", String(pageNum));
      current.set("s", String(pageSize));
      router.replace(`?${current.toString()}`, { scroll: false });
    } catch {}
  }, [activeDataset, pageNum, pageSize]);

  // 전환 직후 스크롤 복원
  useEffect(() => {
    restoreScrollPosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDataset, activeView]);

  // 데이터셋 변경 시 페이지 초기화
  useEffect(() => {
    setPageNum(1);
  }, [activeDataset]);

  // 위치/가격/연식 필터 변경 시 페이지 초기화
  useEffect(() => {
    setPageNum(1);
  }, [
    zFilters?.province,
    zFilters?.cityDistrict,
    zFilters?.town,
    bounds?.south,
    bounds?.west,
    bounds?.north,
    bounds?.east,
    zFilters?.priceRange,
    zFilters?.buildYear,
  ]);

  // 지역/필터 변경 시 선택 초기화
  useEffect(() => {
    try {
      if (selectedRowKeys.length > 0) setSelectedRowKeys([]);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    zFilters?.province,
    zFilters?.cityDistrict,
    zFilters?.town,
    bounds?.south,
    bounds?.west,
    bounds?.north,
    bounds?.east,
  ]);

  const schemaColumns = datasetConfigs[
    activeDataset as keyof typeof datasetConfigs
  ]?.table?.columns as { key: string; header: string }[];

  const user = { email: "user@example.com" } as any;

  const goBack = () => router.back();

  const formatNumber = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value)
      ? value.toLocaleString()
      : "-";

  useEffect(() => {
    // 향후 트래킹 이벤트 연결 지점
  }, [itemId]);

  if (isLoading || isRefreshing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <div className="container mx-auto px-4 py-8">
          <LoadingState title="불러오는 중입니다..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <div className="container mx-auto px-4 py-8 space-y-4">
          <ErrorState
            title={mapApiErrorToMessage(error)}
            onRetry={refetch}
            retryText="다시 시도"
          />
          <div>
            <Button
              variant="ghost"
              onClick={goBack}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={goBack}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> 목록으로 돌아가기
          </Button>
        </div>

        {/* 상단 요약 섹션 (auction_ing 기반 요약) */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-bold mb-2">
                  {property?.title ?? property?.address ?? "상세 정보"}
                </CardTitle>
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {property?.address ?? "-"}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>
                    {typeof property?.area === "number"
                      ? `${property?.area}㎡`
                      : "-"}
                  </span>
                  <span>
                    {property?.buildYear
                      ? `${property?.buildYear}년 건축`
                      : "-"}
                  </span>
                  <span>{property?.floor ?? "-"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">현재상태</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">경매 시작가</div>
                <div className="text-xl font-semibold text-blue-600">
                  {formatNumber(property?.price)}만원
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">감정가</div>
                <div className="text-xl font-semibold text-green-600">
                  {formatNumber((property as any)?.estimatedValue)}만원
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">예상 ROI</div>
                <div className="text-xl font-semibold text-purple-600">
                  {(property as any)?.investmentAnalysis?.expectedRoi ?? "-"}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">편의시설</div>
                <div className="text-sm text-gray-700">
                  {(property as any)?.hasParking ? "주차" : ""}
                  {(property as any)?.hasElevator
                    ? (property as any)?.hasParking
                      ? " / 엘리베이터"
                      : "엘리베이터"
                    : ""}
                  {!(property as any)?.hasParking &&
                  !(property as any)?.hasElevator
                    ? "-"
                    : ""}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 상세 정보 섹션: auction_ing 컬럼 기반(기존 컴포넌트 재사용) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">상세 정보</CardTitle>
          </CardHeader>
          <CardContent>
            {isDetailLoading && (
              <div className="py-6 text-sm text-gray-500">
                상세 정보를 불러오는 중…
              </div>
            )}
            {isDetailError && (
              <div className="py-6">
                <ErrorState
                  title="상세 정보 로딩 실패"
                  onRetry={reloadDetail}
                  retryText="다시 시도"
                />
              </div>
            )}
            {!isDetailLoading && !isDetailError && (
              <PropertyDetailSimple vm={vm ?? undefined} />
            )}
          </CardContent>
        </Card>

        {/* 데이터셋 대탭 헤더는 생략하고 아래 레이아웃에 배치 */}

        {/* 데이터셋 선택 탭 (상단) */}
        <Tabs value={activeDataset} onValueChange={handleChangeDataset}>
          <TabsList className="bg-muted text-muted-foreground h-9 items-center justify-center rounded-lg p-[3px] grid w-full grid-cols-4">
            <TabsTrigger value="auction_ed">과거경매결과</TabsTrigger>
            <TabsTrigger value="sale">실거래가(매매)</TabsTrigger>
            <TabsTrigger value="rent">실거래가(전월세)</TabsTrigger>
            <TabsTrigger value="listings">매물</TabsTrigger>
          </TabsList>

          {/* 선택된 필터 바 */}
          <SelectedFilterBar
            detailsCollapsed={detailsCollapsed}
            onToggleDetailsCollapse={() =>
              setDetailsCollapsed(!detailsCollapsed)
            }
            namespace={activeDataset}
          />

          {/* 분석 레이아웃: 좌측(목록/지도/통합) + 우측(필터) */}
          <div
            className={
              "flex flex-col lg:flex-row items-start " +
              (detailsCollapsed ? "gap-0" : "gap-8")
            }
          >
            {/* 좌측 뷰 영역 */}
            <div className="flex-1 min-w-0 w-full space-y-4">
              <Card>
                <CardContent>
                  {(["auction_ed", "sale", "rent", "listings"] as const).map(
                    (ds) => (
                      <TabsContent key={ds} value={ds} className="mt-4">
                        <Tabs
                          value={activeView}
                          onValueChange={(v) => {
                            // 탭 전환 시 데이터/지도 상태가 꼬이지 않도록 페이지를 1로 초기화하고 선택도 초기화
                            handleChangeView(v as ViewType);
                            setPageNum(1);
                            if (selectedRowKeys.length > 0)
                              setSelectedRowKeys([]);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-lg">
                              검색 결과{" "}
                              {(dsTotal ?? 0).toLocaleString?.() ??
                                dsTotal ??
                                0}
                              건
                            </div>
                            <TabsList>
                              <TabsTrigger
                                value="list"
                                className="flex items-center space-x-2"
                              >
                                <List className="w-4 h-4" />
                                <span>목록</span>
                              </TabsTrigger>
                              <TabsTrigger
                                value="map"
                                className="flex items-center space-x-2"
                              >
                                <Map className="w-4 h-4" />
                                <span>지도</span>
                              </TabsTrigger>
                              <TabsTrigger
                                value="integrated"
                                className="flex items-center space-x-2"
                              >
                                <List className="w-4 h-4" />
                                <Map className="w-4 h-4" />
                                <span>통합</span>
                              </TabsTrigger>
                            </TabsList>
                          </div>

                          <TabsContent value="list" className="mt-4" forceMount>
                            <ViewState
                              isLoading={Boolean(dsLoading)}
                              error={dsError as any}
                              total={dsTotal as number}
                              onRetry={() => dsRefetch?.()}
                            >
                              {useVirtual ? (
                                <ItemTableVirtual
                                  items={dsItems as any}
                                  isLoading={false}
                                  error={undefined}
                                  sortBy={sortBy as any}
                                  sortOrder={sortOrder as any}
                                  onSort={handleSort}
                                  selectedRowKeys={selectedRowKeys}
                                  onSelectionChange={setSelectedRowKeys}
                                  containerHeight={560}
                                  rowHeight={44}
                                  overscan={8}
                                />
                              ) : (
                                <ItemTable
                                  items={dsItems as any}
                                  isLoading={false}
                                  error={undefined}
                                  schemaColumns={schemaColumns}
                                  getValueForKey={(row: any, key: string) => {
                                    // area 컬럼 전역 플래그 기반 포맷
                                    if (key === "area") {
                                      const m2 = row?.area as
                                        | number
                                        | undefined;
                                      if (
                                        typeof m2 === "number" &&
                                        Number.isFinite(m2)
                                      ) {
                                        if (areaDisplay?.mode === "m2")
                                          return `${Math.round(m2)}㎡`;
                                        if (areaDisplay?.mode === "pyeong") {
                                          const py = m2ToPyeong(
                                            m2,
                                            areaDisplay?.rounding,
                                            areaDisplay?.digits
                                          );
                                          return py != null ? `${py}평` : "-";
                                        }
                                        return formatArea(m2, {
                                          withBoth: true,
                                          digits: areaDisplay?.digits ?? 1,
                                          rounding: areaDisplay?.rounding,
                                        });
                                      }
                                    }
                                    const direct = row?.[key];
                                    if (direct !== undefined) return direct;
                                    return row?.extra?.[key];
                                  }}
                                  sortBy={sortBy as any}
                                  sortOrder={sortOrder as any}
                                  onSort={handleSort}
                                  selectedRowKeys={selectedRowKeys}
                                  onSelectionChange={setSelectedRowKeys}
                                  totalCount={dsTotal as any}
                                  page={pageNum}
                                  pageSize={pageSize}
                                  onPageChange={(p) => setPageNum(p)}
                                />
                              )}
                            </ViewState>
                            {/* External pagination controls */}
                            <div className="mt-6 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">
                                      페이지당
                                    </span>
                                    <Select
                                      value={String(pageSize)}
                                      onValueChange={(value) => {
                                        const s = parseInt(value);
                                        if (Number.isFinite(s) && s > 0) {
                                          setPageSize(s);
                                          setPageNum(1);
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="w-20">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <span className="text-sm text-gray-600">
                                      개
                                    </span>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600">
                                  전체 {(dsTotal ?? 0).toLocaleString()}건 중{" "}
                                  {Math.min(
                                    pageSize * (pageNum - 1) + 1,
                                    dsTotal ?? 0
                                  )}
                                  -{Math.min(pageSize * pageNum, dsTotal ?? 0)}
                                  건 표시
                                </div>
                              </div>
                              <Pagination>
                                <PaginationContent>
                                  <PaginationItem>
                                    <PaginationPrevious
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        if (pageNum > 1)
                                          setPageNum(pageNum - 1);
                                      }}
                                      className={
                                        pageNum <= 1
                                          ? "pointer-events-none opacity-50"
                                          : ""
                                      }
                                    />
                                  </PaginationItem>
                                  {(() => {
                                    const totalPages = Math.max(
                                      1,
                                      Math.ceil((dsTotal ?? 0) / pageSize)
                                    );
                                    const pages: JSX.Element[] = [];
                                    const startPage = Math.max(1, pageNum - 2);
                                    const endPage = Math.min(
                                      totalPages,
                                      pageNum + 2
                                    );
                                    if (startPage > 1) {
                                      pages.push(
                                        <PaginationItem key="1">
                                          <PaginationLink
                                            href="#"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              setPageNum(1);
                                            }}
                                            isActive={pageNum === 1}
                                          >
                                            1
                                          </PaginationLink>
                                        </PaginationItem>
                                      );
                                      if (startPage > 2) {
                                        pages.push(
                                          <PaginationItem key="ellipsis1">
                                            <PaginationEllipsis />
                                          </PaginationItem>
                                        );
                                      }
                                    }
                                    for (let i = startPage; i <= endPage; i++) {
                                      pages.push(
                                        <PaginationItem key={i}>
                                          <PaginationLink
                                            href="#"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              setPageNum(i);
                                            }}
                                            isActive={pageNum === i}
                                          >
                                            {i}
                                          </PaginationLink>
                                        </PaginationItem>
                                      );
                                    }
                                    if (endPage < totalPages) {
                                      if (endPage < totalPages - 1) {
                                        pages.push(
                                          <PaginationItem key="ellipsis2">
                                            <PaginationEllipsis />
                                          </PaginationItem>
                                        );
                                      }
                                      pages.push(
                                        <PaginationItem key={totalPages}>
                                          <PaginationLink
                                            href="#"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              setPageNum(totalPages);
                                            }}
                                            isActive={pageNum === totalPages}
                                          >
                                            {totalPages}
                                          </PaginationLink>
                                        </PaginationItem>
                                      );
                                    }
                                    return pages;
                                  })()}
                                  <PaginationItem>
                                    <PaginationNext
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        const totalPages = Math.max(
                                          1,
                                          Math.ceil((dsTotal ?? 0) / pageSize)
                                        );
                                        if (pageNum < totalPages)
                                          setPageNum(pageNum + 1);
                                      }}
                                      className={
                                        pageNum >=
                                        Math.max(
                                          1,
                                          Math.ceil((dsTotal ?? 0) / pageSize)
                                        )
                                          ? "pointer-events-none opacity-50"
                                          : ""
                                      }
                                    />
                                  </PaginationItem>
                                </PaginationContent>
                              </Pagination>
                            </div>
                          </TabsContent>

                          <TabsContent value="map" className="mt-4" forceMount>
                            <ViewState
                              isLoading={Boolean(dsLoading)}
                              error={dsError as any}
                              total={dsTotal as number}
                              onRetry={() => dsRefetch?.()}
                            >
                              <MapView
                                enabled={activeView === "map"}
                                key={`${activeDataset}-map`}
                                items={dsItems as any}
                                isLoading={false}
                                error={undefined}
                                markerColorFn={
                                  datasetConfigs[
                                    activeDataset as keyof typeof datasetConfigs
                                  ]?.map?.marker as any
                                }
                                // 범례는 현재 내부 공통 레전드 사용. 필요 시 legendItems 전달
                                namespace={activeDataset}
                                highlightIds={selectedRowKeys.map((k) =>
                                  String(k)
                                )}
                                onBoundsChange={(b) => setBounds(b)}
                              />
                            </ViewState>
                          </TabsContent>

                          <TabsContent
                            value="integrated"
                            className="mt-4"
                            forceMount
                          >
                            <div className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">
                                    지도
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <ViewState
                                    isLoading={Boolean(dsLoading)}
                                    error={dsError as any}
                                    total={dsTotal as number}
                                    onRetry={() => dsRefetch?.()}
                                  >
                                    <MapView
                                      enabled={activeView === "integrated"}
                                      key={`${activeDataset}-integrated`}
                                      items={dsItems as any}
                                      isLoading={false}
                                      error={undefined}
                                      markerColorFn={
                                        datasetConfigs[
                                          activeDataset as keyof typeof datasetConfigs
                                        ]?.map?.marker as any
                                      }
                                      namespace={activeDataset}
                                      highlightIds={selectedRowKeys.map((k) =>
                                        String(k)
                                      )}
                                      onBoundsChange={(b) => setBounds(b)}
                                    />
                                  </ViewState>
                                </CardContent>
                              </Card>
                              <ViewState
                                isLoading={Boolean(dsLoading)}
                                error={dsError as any}
                                total={dsTotal as number}
                                onRetry={() => dsRefetch?.()}
                              >
                                {useVirtual ? (
                                  <ItemTableVirtual
                                    items={dsItems as any}
                                    isLoading={false}
                                    error={undefined}
                                    sortBy={sortBy as any}
                                    sortOrder={sortOrder as any}
                                    onSort={handleSort}
                                    selectedRowKeys={selectedRowKeys}
                                    onSelectionChange={setSelectedRowKeys}
                                    containerHeight={560}
                                    rowHeight={44}
                                    overscan={8}
                                  />
                                ) : (
                                  <ItemTable
                                    items={dsItems as any}
                                    isLoading={false}
                                    error={undefined}
                                    schemaColumns={schemaColumns}
                                    getValueForKey={(row: any, key: string) => {
                                      if (key === "area") {
                                        const m2 = row?.area as
                                          | number
                                          | undefined;
                                        if (
                                          typeof m2 === "number" &&
                                          Number.isFinite(m2)
                                        ) {
                                          if (areaDisplay?.mode === "m2")
                                            return `${Math.round(m2)}㎡`;
                                          if (areaDisplay?.mode === "pyeong") {
                                            const py = m2ToPyeong(
                                              m2,
                                              areaDisplay?.rounding,
                                              areaDisplay?.digits
                                            );
                                            return py != null ? `${py}평` : "-";
                                          }
                                          return formatArea(m2, {
                                            withBoth: true,
                                            digits: areaDisplay?.digits ?? 1,
                                            rounding: areaDisplay?.rounding,
                                          });
                                        }
                                      }
                                      const direct = row?.[key];
                                      if (direct !== undefined) return direct;
                                      return row?.extra?.[key];
                                    }}
                                    sortBy={sortBy as any}
                                    sortOrder={sortOrder as any}
                                    onSort={handleSort}
                                    selectedRowKeys={selectedRowKeys}
                                    onSelectionChange={setSelectedRowKeys}
                                    totalCount={dsTotal as any}
                                    page={pageNum}
                                    pageSize={pageSize}
                                    onPageChange={(p) => setPageNum(p)}
                                  />
                                )}
                              </ViewState>
                              {/* External pagination controls for integrated list */}
                              <div className="mt-6 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-600">
                                        페이지당
                                      </span>
                                      <Select
                                        value={String(pageSize)}
                                        onValueChange={(value) => {
                                          const s = parseInt(value);
                                          if (Number.isFinite(s) && s > 0) {
                                            setPageSize(s);
                                            setPageNum(1);
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="w-20">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="20">20</SelectItem>
                                          <SelectItem value="50">50</SelectItem>
                                          <SelectItem value="100">
                                            100
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <span className="text-sm text-gray-600">
                                        개
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    전체 {(dsTotal ?? 0).toLocaleString()}건 중{" "}
                                    {Math.min(
                                      pageSize * (pageNum - 1) + 1,
                                      dsTotal ?? 0
                                    )}
                                    -
                                    {Math.min(pageSize * pageNum, dsTotal ?? 0)}
                                    건 표시
                                  </div>
                                </div>
                                <Pagination>
                                  <PaginationContent>
                                    <PaginationItem>
                                      <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          if (pageNum > 1)
                                            setPageNum(pageNum - 1);
                                        }}
                                        className={
                                          pageNum <= 1
                                            ? "pointer-events-none opacity-50"
                                            : ""
                                        }
                                      />
                                    </PaginationItem>
                                    {(() => {
                                      const totalPages = Math.max(
                                        1,
                                        Math.ceil((dsTotal ?? 0) / pageSize)
                                      );
                                      const pages: JSX.Element[] = [];
                                      const startPage = Math.max(
                                        1,
                                        pageNum - 2
                                      );
                                      const endPage = Math.min(
                                        totalPages,
                                        pageNum + 2
                                      );
                                      if (startPage > 1) {
                                        pages.push(
                                          <PaginationItem key="1">
                                            <PaginationLink
                                              href="#"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                setPageNum(1);
                                              }}
                                              isActive={pageNum === 1}
                                            >
                                              1
                                            </PaginationLink>
                                          </PaginationItem>
                                        );
                                        if (startPage > 2) {
                                          pages.push(
                                            <PaginationItem key="ellipsis1">
                                              <PaginationEllipsis />
                                            </PaginationItem>
                                          );
                                        }
                                      }
                                      for (
                                        let i = startPage;
                                        i <= endPage;
                                        i++
                                      ) {
                                        pages.push(
                                          <PaginationItem key={i}>
                                            <PaginationLink
                                              href="#"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                setPageNum(i);
                                              }}
                                              isActive={pageNum === i}
                                            >
                                              {i}
                                            </PaginationLink>
                                          </PaginationItem>
                                        );
                                      }
                                      if (endPage < totalPages) {
                                        if (endPage < totalPages - 1) {
                                          pages.push(
                                            <PaginationItem key="ellipsis2">
                                              <PaginationEllipsis />
                                            </PaginationItem>
                                          );
                                        }
                                        pages.push(
                                          <PaginationItem key={totalPages}>
                                            <PaginationLink
                                              href="#"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                setPageNum(totalPages);
                                              }}
                                              isActive={pageNum === totalPages}
                                            >
                                              {totalPages}
                                            </PaginationLink>
                                          </PaginationItem>
                                        );
                                      }
                                      return pages;
                                    })()}
                                    <PaginationItem>
                                      <PaginationNext
                                        href="#"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          const totalPages = Math.max(
                                            1,
                                            Math.ceil((dsTotal ?? 0) / pageSize)
                                          );
                                          if (pageNum < totalPages)
                                            setPageNum(pageNum + 1);
                                        }}
                                        className={
                                          pageNum >=
                                          Math.max(
                                            1,
                                            Math.ceil((dsTotal ?? 0) / pageSize)
                                          )
                                            ? "pointer-events-none opacity-50"
                                            : ""
                                        }
                                      />
                                    </PaginationItem>
                                  </PaginationContent>
                                </Pagination>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </TabsContent>
                    )
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 우측 필터 영역 (불필요한 래퍼 제거) */}
            <div
              className={
                detailsCollapsed
                  ? "hidden"
                  : "shrink-0 w-full lg:w-[384px] max-w-[384px]"
              }
            >
              <FilterControl
                isCollapsed={detailsCollapsed}
                onToggleCollapse={() => setDetailsCollapsed(!detailsCollapsed)}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSearch={handleSearch}
                showDetailsOnly={true}
                preset={
                  datasetConfigs[activeDataset as keyof typeof datasetConfigs]
                    ?.filters?.ui
                }
                defaults={
                  datasetConfigs[activeDataset as keyof typeof datasetConfigs]
                    ?.filters?.defaults
                }
                namespace={activeDataset}
              />
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
