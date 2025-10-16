"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Header/Footer are provided globally by AppShell
import FilterControl from "@/components/features/filter-control";
import SelectedFilterBar from "@/components/features/selected-filter-bar";
import dynamic from "next/dynamic";
const ItemTable = dynamic(() => import("@/components/features/item-table"), {
  ssr: false,
});
// 가상 테이블 제거: 항상 일반 테이블 사용
import MapView from "@/components/features/map-view";
import PropertyDetailDialog from "@/components/features/property-detail/PropertyDetailDialog";
import { useFilterStore } from "@/store/filterStore";
import { useItems } from "@/hooks/useItems";
import { useDebouncedValue } from "@/hooks/useDebounce";
import useSWR from "swr";
import { itemApi } from "@/lib/api";
import { Search, Map, List, Download, Bell } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useFeatureFlags } from "@/lib/featureFlags";
import { useDataset } from "@/hooks/useDataset";
import { datasetConfigs } from "@/datasets/registry";
import { ViewState } from "@/components/ui/view-state";
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

export default function AnalysisPage() {
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const [activeView, setActiveView] = useState<"table" | "map" | "both">(
    "table"
  );
  const [bounds, setBounds] = useState<{
    south: number;
    west: number;
    north: number;
    east: number;
  } | null>(null);
  const {
    items,
    mapItems,
    isLoading,
    error,
    totalCount,
    baseTotalCount,
    refetch,
  } = useItems();
  // 로딩 표시 최적화: 기존 데이터가 있을 때는 로딩 오버레이를 숨겨 테이블/스크롤을 유지
  const hasListData = Array.isArray(items) && items.length > 0;
  const hasMapData = Array.isArray(mapItems) && mapItems.length > 0;
  const showLoadingList = isLoading && !hasListData;
  const showLoadingMap = isLoading && !hasMapData && !hasListData;
  const setPage = useFilterStore((s) => s.setPage);
  const setSize = useFilterStore((s) => s.setSize);
  const page = useFilterStore((s) => s.page);
  const size = useFilterStore((s) => s.size);

  // /api/v1/items/columns 에서 정렬 허용 컬럼 로드
  const { data: itemsColumnsMeta } = useSWR(
    ["/api/v1/items/columns"],
    () => itemApi.getItemsColumns(),
    { keepPreviousData: true }
  );
  const sortableColumns: string[] = Array.isArray(
    (itemsColumnsMeta as any)?.sortable_columns
  )
    ? ((itemsColumnsMeta as any).sortable_columns as string[])
    : [];

  // 스토어에서 필터 상태를 직접 구독합니다.
  const filters = useFilterStore((state) => state);

  // 개발용: 공통 파이프라인 병행(기본 off) → ?ds_v2=1&ds=auction_ed
  const searchParams = useSearchParams();
  const dsV2Enabled = (searchParams?.get("ds_v2") || "0") === "1";
  const dsIdParam = (searchParams?.get("ds") as any) || ("auction_ed" as const);
  const centerAndRadius = (() => {
    if (!bounds) return null;
    const lat = (bounds.south + bounds.north) / 2;
    const lng = (bounds.west + bounds.east) / 2;
    const toRad = (d: number) => (d * Math.PI) / 180;
    // 대각선 절반을 반지름으로 근사
    const R = 6371; // km
    const lat1 = toRad(lat);
    const lng1 = toRad(lng);
    const lat2 = toRad(bounds.north);
    const lng2 = toRad(bounds.east);
    const dlat = lat2 - lat1;
    const dlng = lng2 - lng1;
    const a =
      Math.sin(dlat / 2) * Math.sin(dlat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng / 2) * Math.sin(dlng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const diagKm = R * c;
    const radius_km = Math.min(10, Math.max(0.5, diagKm / 2)); // 서버 상한 10km 적용
    return { lat, lng, radius_km };
  })();
  const queryFilters = {
    province: filters?.province,
    cityDistrict: filters?.cityDistrict,
    town: filters?.town,
    // 지도 bbox (있을 때만 전송)
    south: bounds?.south,
    west: bounds?.west,
    north: bounds?.north,
    east: bounds?.east,
    // 보조: center + radius_km (서버가 bbox 우선 사용)
    lat: centerAndRadius?.lat,
    lng: centerAndRadius?.lng,
    radius_km: centerAndRadius?.radius_km,
    price_min: Array.isArray(filters?.priceRange)
      ? filters.priceRange[0]
      : undefined,
    price_max: Array.isArray(filters?.priceRange)
      ? filters.priceRange[1]
      : undefined,
    build_year_min: Array.isArray(filters?.buildYear)
      ? filters.buildYear[0]
      : undefined,
    build_year_max: Array.isArray(filters?.buildYear)
      ? filters.buildYear[1]
      : undefined,
  } as Record<string, unknown>;
  const { total: devTotal = 0 } = dsV2Enabled
    ? useDataset(dsIdParam, queryFilters, page, size)
    : ({ total: 0 } as any);

  // 가상 스크롤 제거: 항상 일반 테이블 사용

  // 사용자 정보
  const user = {
    email: "user@example.com",
    subscription: {
      plan: "Pro",
      expiresAt: "2024-12-31",
    },
  };

  // 팝업에서 지도 열기 이벤트를 수신해 지도 탭으로 전환
  useEffect(() => {
    const handler = (e: Event) => {
      setActiveView("map");
      try {
        const d = (e as CustomEvent).detail as
          | { id?: string; lat?: number; lng?: number }
          | undefined;
        if (d && typeof d.lat === "number" && typeof d.lng === "number") {
          (useFilterStore.getState() as any).setPendingMapTarget?.({
            lat: d.lat,
            lng: d.lng,
          });
        }
      } catch {}
    };
    window.addEventListener("property:openOnMap", handler as EventListener);
    return () =>
      window.removeEventListener(
        "property:openOnMap",
        handler as EventListener
      );
  }, []);

  // 전역: 관심 토글 이벤트 처리(스토어 favorites 연동)
  useEffect(() => {
    const onToggleFav = (e: Event) => {
      try {
        const id = String((e as CustomEvent).detail?.id || "");
        if (!id) return;
        const state = useFilterStore.getState() as any;
        const isFav = (state.favorites || []).includes(id);
        if (isFav) state.removeFavorite?.(id);
        else state.addFavorites?.([id]);
      } catch {}
    };
    window.addEventListener(
      "property:toggleFavorite",
      onToggleFav as EventListener
    );
    return () =>
      window.removeEventListener(
        "property:toggleFavorite",
        onToggleFav as EventListener
      );
  }, []);

  // 전역: 보고서 요청 이벤트 처리(임시 안내)
  useEffect(() => {
    const onOpenReport = (e: Event) => {
      try {
        const id = String((e as CustomEvent).detail?.id || "");
        console.log("report open requested for id=", id);
        // TODO: 페이지 준비 시 라우팅으로 교체 가능
        alert("보고서 생성은 준비 중입니다. (id=" + id + ")");
      } catch {}
    };
    window.addEventListener(
      "property:openReport",
      onOpenReport as EventListener
    );
    return () =>
      window.removeEventListener(
        "property:openReport",
        onOpenReport as EventListener
      );
  }, []);

  // useItems 훅이 필터 상태를 키로 사용하여 자동 재검증함

  // 필터 스토어에서 setFilter와 정렬 관련 함수들 가져오기
  const setFilter = useFilterStore((s) => s.setFilter);
  const setSortConfig = useFilterStore((s) => s.setSortConfig);
  const sortBy = useFilterStore((s) => s.sortBy);
  const sortOrder = useFilterStore((s) => s.sortOrder);
  const addFavorites = useFilterStore((s) => (s as any).addFavorites);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const setSelectedIds = useFilterStore((s) => (s as any).setSelectedIds);
  const showSelectedOnly = useFilterStore((s) => (s as any).showSelectedOnly);
  const setShowSelectedOnly = useFilterStore(
    (s) => (s as any).setShowSelectedOnly
  );

  useEffect(() => {
    // 목록 선택 변경 → 스토어 selectedIds 반영
    try {
      setSelectedIds(selectedRowKeys.map((k) => String(k)));
    } catch {}
  }, [selectedRowKeys]);

  // 지역 변경 시 선택 전용 보기 자동 해제
  useEffect(() => {
    try {
      if (showSelectedOnly) setShowSelectedOnly(false);
      if (selectedRowKeys.length > 0) setSelectedRowKeys([]);
      setSelectedIds([]);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.sido_code,
    filters.city_code,
    filters.town_code,
    filters.province,
    filters.cityDistrict,
    filters.town,
  ]);

  const handleSearch = () => {
    console.log("🔍 [Search] 키워드 검색 실행:", debouncedQuery);
    // ✅ 키워드를 필터 스토어에 반영하여 즉시 검색 실행
    setFilter("searchQuery", debouncedQuery);

    // 페이지를 1페이지로 초기화 (검색 시 새로운 결과)
    setPage(1);

    console.log(
      "🔍 [Search] 필터 업데이트 완료 - 자동으로 useItems가 재검색됩니다"
    );
  };

  // 🔄 서버 사이드 정렬 핸들러
  const handleSort = (column?: string, direction?: "asc" | "desc") => {
    if (
      column &&
      sortableColumns.length > 0 &&
      !sortableColumns.includes(column)
    ) {
      console.warn(
        `[Sort] 금지된 컬럼 무시: ${column}. 허용: ${sortableColumns.join(
          ", "
        )}`
      );
      return;
    }
    console.log(`🔄 [Sort] 정렬 변경: ${column} ${direction}`);
    setSortConfig(column || undefined, direction);
  };

  const handleExport = () => {
    console.log("Exporting data...");
    // 데이터 내보내기 로직 구현
  };

  const handleSetAlert = () => {
    console.log("Setting up alert...");
    // 알림 설정 로직 구현
  };

  // 지도 팝업에서 '상세보기' 클릭 시 상세 다이얼로그 오픈
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<any | null>(null);
  useEffect(() => {
    const handler = async (e: Event) => {
      const id = String((e as CustomEvent).detail?.id || "");
      if (!id) return;
      // 현재 데이터에서 우선 탐색, 없으면 단건 조회(선택)
      const findIn = (list?: any[]) =>
        list?.find?.((x: any) => String(x?.id) === id);
      const found = findIn(items) || findIn(mapItems);
      if (found) {
        setDetailItem(found);
        setDetailOpen(true);
        return;
      }
      try {
        // 필요한 경우 단건 API 폴백 (옵션)
        // const one = await itemApi.getItem(Number(id));
        // setDetailItem(one);
        // setDetailOpen(true);
      } catch {}
    };
    window.addEventListener("property:openDetail", handler as EventListener);
    return () =>
      window.removeEventListener(
        "property:openDetail",
        handler as EventListener
      );
  }, [items, mapItems]);

  // 상세 다이얼로그 렌더링(전역에서 열림)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 페이지 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">매물 분석</h1>
            <p className="text-gray-600">
              AI 기반 분석으로 최적의 투자 기회를 찾아보세요
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
            <Button variant="outline" onClick={handleSetAlert}>
              <Bell className="w-4 h-4 mr-2" />
              알림 설정
            </Button>
          </div>
        </div>

        {/* 🎯 1단계: 상단 지역 선택 (전체 너비) */}
        <div className="space-y-6 mb-8">
          <FilterControl
            isCollapsed={isFilterCollapsed}
            onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
            showLocationOnly={true}
          />
          <SelectedFilterBar
            detailsCollapsed={detailsCollapsed}
            onToggleDetailsCollapse={() =>
              setDetailsCollapsed(!detailsCollapsed)
            }
          />
        </div>

        {/* 🔀 2단계: 좌측=결과, 우측=필터 (반응형) */}
        <div
          className={
            "flex flex-col lg:flex-row items-start " +
            (detailsCollapsed ? "gap-0" : "gap-8")
          }
        >
          {/* 📊 좌측: 결과 뷰 */}
          <div className="flex-1 min-w-0 w-full">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-lg">
                    {filters.cityDistrict ? (
                      <>
                        {filters.cityDistrict}
                        <span className="text-gray-400 mx-2">|</span>
                        <span className="text-gray-800">
                          전체 {(baseTotalCount ?? 0).toLocaleString()}건
                        </span>
                        <span className="text-gray-400 mx-2">·</span>
                        <span className="text-gray-800">
                          필터{" "}
                          {(totalCount ?? items?.length ?? 0).toLocaleString()}
                          건
                        </span>
                        {dsV2Enabled && (
                          <>
                            <span className="text-gray-400 mx-2">·</span>
                            <span className="text-gray-500">
                              v2 {(devTotal ?? 0).toLocaleString()}건
                            </span>
                          </>
                        )}
                        <span className="text-gray-400 mx-2">·</span>
                        <span className="text-gray-800">
                          선택 {selectedRowKeys.length}건
                        </span>
                      </>
                    ) : (
                      <CardTitle className="text-lg">
                        검색 결과{" "}
                        {isLoading
                          ? "로딩 중..."
                          : (totalCount ?? items?.length ?? 0) + "건"}
                        {dsV2Enabled && (
                          <span className="text-sm text-gray-500 ml-2">
                            (v2 {(devTotal ?? 0).toLocaleString()}건)
                          </span>
                        )}
                      </CardTitle>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        selectedRowKeys.length > 0 &&
                        addFavorites(selectedRowKeys.map((k) => String(k)))
                      }
                      disabled={selectedRowKeys.length === 0}
                      title={
                        selectedRowKeys.length === 0
                          ? "선택된 항목이 없습니다"
                          : "선택 항목을 관심물건에 추가"
                      }
                    >
                      관심물건으로 넣기
                    </Button>
                    <Tabs
                      value={activeView}
                      onValueChange={(value) =>
                        setActiveView(value as "table" | "map" | "both")
                      }
                    >
                      <TabsList>
                        <TabsTrigger
                          value="table"
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
                          value="both"
                          className="flex items-center space-x-2"
                        >
                          <List className="w-4 h-4" />
                          <Map className="w-4 h-4" />
                          <span>통합</span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {activeView === "table" && (
                  <ViewState
                    isLoading={showLoadingList}
                    error={error}
                    total={totalCount}
                    onRetry={refetch}
                  >
                    {
                      <ItemTable
                        items={items}
                        isLoading={false}
                        error={undefined}
                        onRetry={undefined}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                        selectedRowKeys={selectedRowKeys}
                        onSelectionChange={setSelectedRowKeys}
                      />
                    }
                  </ViewState>
                )}
                {activeView === "map" && (
                  <ViewState
                    isLoading={showLoadingMap}
                    error={error}
                    total={totalCount}
                    onRetry={refetch}
                  >
                    <div className="h-[calc(100vh-240px)]">
                      <MapView
                        key={`${filters.sido_code || filters.province}-${
                          filters.city_code || filters.cityDistrict
                        }-${filters.town_code || filters.town || ""}`}
                        locationKey={`${
                          filters.sido_code || filters.province
                        }-${filters.city_code || filters.cityDistrict}-${
                          filters.town_code || filters.town || ""
                        }`}
                        items={mapItems || items}
                        isLoading={false}
                        error={undefined}
                        onRetry={undefined}
                        highlightIds={selectedRowKeys.map((k) => String(k))}
                        onBoundsChange={(b) => setBounds(b)}
                        // 클러스터 토글: 기본 on, UI 노출
                        clusterToggleEnabled={true}
                        useClustering={true}
                      />
                    </div>
                  </ViewState>
                )}
                {activeView === "both" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">지도</h3>
                      <ViewState
                        isLoading={showLoadingMap}
                        error={error}
                        total={totalCount}
                        onRetry={refetch}
                      >
                        <div className="h-[calc(100vh-360px)]">
                          <MapView
                            key={`${filters.sido_code || filters.province}-${
                              filters.city_code || filters.cityDistrict
                            }-${filters.town_code || filters.town || ""}-both`}
                            locationKey={`${
                              filters.sido_code || filters.province
                            }-${filters.city_code || filters.cityDistrict}-${
                              filters.town_code || filters.town || ""
                            }`}
                            items={mapItems || items}
                            isLoading={false}
                            error={undefined}
                            onRetry={undefined}
                            highlightIds={selectedRowKeys.map((k) => String(k))}
                            onBoundsChange={(b) => setBounds(b)}
                            // 클러스터 토글: 기본 on, UI 노출
                            clusterToggleEnabled={true}
                            useClustering={true}
                          />
                        </div>
                      </ViewState>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3">목록</h3>
                      <ViewState
                        isLoading={showLoadingList}
                        error={error}
                        total={totalCount}
                        onRetry={refetch}
                      >
                        {
                          <ItemTable
                            items={items}
                            isLoading={false}
                            error={undefined}
                            onRetry={undefined}
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                            onSort={handleSort}
                            selectedRowKeys={selectedRowKeys}
                            onSelectionChange={setSelectedRowKeys}
                          />
                        }
                      </ViewState>
                    </div>
                  </div>
                )}

                {/* 🚀 완전한 페이지네이션 시스템 (지도 단독 뷰에서는 숨김) */}
                {activeView !== "map" && (
                  <div className="mt-6 space-y-4">
                    {/* 페이지 크기 선택과 정보 표시 */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            페이지당
                          </span>
                          <Select
                            value={size.toString()}
                            onValueChange={(value) => {
                              setSize(parseInt(value));
                              setPage(1); // 페이지 크기 변경시 첫 페이지로
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
                          <span className="text-sm text-gray-600">개</span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        전체 {(totalCount ?? 0).toLocaleString()}건 중{" "}
                        {Math.min(size * (page - 1) + 1, totalCount ?? 0)}-
                        {Math.min(size * page, totalCount ?? 0)}건 표시
                      </div>
                    </div>

                    {/* 페이지 번호 네비게이션 */}
                    <Pagination>
                      <PaginationContent>
                        {/* 이전 페이지 */}
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (page > 1) setPage(page - 1);
                            }}
                            className={
                              page <= 1 ? "pointer-events-none opacity-50" : ""
                            }
                          />
                        </PaginationItem>

                        {(() => {
                          const totalPages = Math.max(
                            1,
                            Math.ceil((totalCount ?? 0) / size)
                          );
                          const pages = [] as JSX.Element[];

                          // 페이지 번호 생성 로직
                          const startPage = Math.max(1, page - 2);
                          const endPage = Math.min(totalPages, page + 2);

                          // 첫 페이지 (항상 표시)
                          if (startPage > 1) {
                            pages.push(
                              <PaginationItem key="1">
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setPage(1);
                                  }}
                                  isActive={page === 1}
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

                          // 현재 페이지 주변 번호들
                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                              <PaginationItem key={i}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setPage(i);
                                  }}
                                  isActive={page === i}
                                >
                                  {i}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }

                          // 마지막 페이지 (필요시 표시)
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
                                    setPage(totalPages);
                                  }}
                                  isActive={page === totalPages}
                                >
                                  {totalPages}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }

                          return pages;
                        })()}

                        {/* 다음 페이지 */}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              const totalPages = Math.max(
                                1,
                                Math.ceil((totalCount ?? 0) / size)
                              );
                              if (page < totalPages) setPage(page + 1);
                            }}
                            className={
                              page >=
                              Math.max(1, Math.ceil((totalCount ?? 0) / size))
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 📋 우측: 상세 필터 (접어두기 지원) */}
          <div
            className={
              detailsCollapsed ? "hidden" : "w-full lg:w-[384px] max-w-[384px]"
            }
          >
            <FilterControl
              isCollapsed={detailsCollapsed}
              onToggleCollapse={() => setDetailsCollapsed(!detailsCollapsed)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearch={handleSearch}
              showDetailsOnly={true}
            />
          </div>
        </div>
      </div>

      {/* 푸터는 AppShell 공통 컴포넌트 사용 */}
      {/* 전역 상세 다이얼로그 */}
      <PropertyDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        rowItem={detailItem}
      />
    </div>
  );
}
