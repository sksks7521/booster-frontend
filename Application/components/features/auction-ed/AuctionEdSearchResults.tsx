"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
const ItemTable = dynamic(() => import("@/components/features/item-table"), {
  ssr: false,
});
const ItemTableVirtual = dynamic(
  () => import("@/components/features/item-table-virtual"),
  { ssr: false }
);
import MapView from "@/components/features/map-view";

import { useFilterStore } from "@/store/filterStore";
import { useSortableColumns } from "@/hooks/useSortableColumns";
import { useFeatureFlags } from "@/lib/featureFlags";
import { formatArea, m2ToPyeong } from "@/lib/units";
import { useDataset } from "@/hooks/useDataset";
import { datasetConfigs } from "@/datasets/registry";
import { ViewState } from "@/components/ui/view-state";
import { List, Map, Layers, Download, Bell } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

// 안정 참조 보장을 위한 상수 (selector fallback에 사용)
const NOOP = () => {};
const EMPTY_ARRAY: any[] = [];
// 지역명 정규화: 공백 제거 + 접미사(특별시/광역시/자치시/자치도/도) 제거
const normalizeRegion = (s?: string) =>
  (s ? String(s) : "")
    .replace(/\s+/g, "")
    .replace(/(특별시|광역시|자치시|자치도|도)$/u, "");
const eqRegion = (a?: string, b?: string) =>
  normalizeRegion(a) === normalizeRegion(b);

interface AuctionEdSearchResultsProps {
  activeView: "table" | "map" | "both";
  onViewChange: (view: "table" | "map" | "both") => void;
  bounds?: {
    south: number;
    west: number;
    north: number;
    east: number;
  } | null;
  onBoundsChange?: (bounds: any) => void;
}

export default function AuctionEdSearchResults({
  activeView,
  onViewChange,
  bounds,
  onBoundsChange,
}: AuctionEdSearchResultsProps) {
  // 필터 상태 가져오기 (네임스페이스 필터 포함)
  const allFilters: any = useFilterStore();

  // auction_ed 네임스페이스 필터 병합
  const namespace = "auction_ed";
  const nsOverrides = (
    allFilters.ns && namespace ? (allFilters.ns as any)[namespace] : undefined
  ) as any;
  const mergedFilters: any =
    namespace && nsOverrides ? { ...allFilters, ...nsOverrides } : allFilters;

  // 일부 전역 스토어 타입에 좌표 필드가 없을 수 있어 any로 안전 분해
  const { lat, lng, south, west, north, east, radius_km, ...otherFilters } =
    mergedFilters as any;

  // auction_ed에서는 좌표 기반 필터링 비활성화
  const filters = {
    ...otherFilters,
    // 좌표 관련 값들을 명시적으로 undefined로 설정
    lat: undefined,
    lng: undefined,
    south: undefined,
    west: undefined,
    north: undefined,
    east: undefined,
    radius_km: undefined,
  };
  const setPage = useFilterStore((s: any) => s.setPage);
  const setSize = useFilterStore((s: any) => s.setSize);
  const page = useFilterStore((s: any) => s.page);
  const size = useFilterStore((s: any) => s.size);

  // 필터/정렬 활성 시에는 전체 집합을 받아와서(큰 size) 클라이언트에서 정렬/재페이징
  const hasProvince = !!(filters as any)?.province;
  const hasCity = !!(filters as any)?.cityDistrict;
  const hasTown = !!(filters as any)?.town;
  const regionReady = hasProvince && hasCity;
  // 가격 필터는 서버에서 처리됨 (auction_ed)
  const priceRange = (filters as any)?.priceRange;
  const hasPrice = Array.isArray(priceRange); // 디버깅용으로만 유지

  // 디버깅: 필터 상태 확인
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 필터 상태 디버깅:", {
      allFilters,
      nsOverrides,
      mergedFilters,
      hasPrice,
      priceRange,
      priceChanged: Array.isArray(priceRange)
        ? `${priceRange[0]} ~ ${priceRange[1]}`
        : "not array",
      serverFiltering: "매각가 필터와 지역 필터는 서버에서 처리됨",
      clientFiltering: "면적, 입찰횟수, 날짜, 검색어는 클라이언트에서 처리됨",
      needsClientProcessing:
        Array.isArray((filters as any)?.areaRange) ||
        Array.isArray((filters as any)?.bidCountRange) ||
        Array.isArray((filters as any)?.dateRange) ||
        Boolean((filters as any)?.searchQuery),
    });
  }
  const hasArea = Array.isArray((filters as any)?.areaRange);
  const hasBids = Array.isArray((filters as any)?.bidCountRange);
  const hasDates = Array.isArray((filters as any)?.dateRange);
  const hasSearch = Boolean((filters as any)?.searchQuery);
  const hasSort = Boolean(
    (filters as any)?.sortBy && (filters as any)?.sortOrder
  );
  // auction_ed는 지역 필터 + 매각가 필터를 서버에서 처리, 나머지는 클라이언트 필터링
  // 지역 필터(province, cityDistrict, town)와 매각가 필터(priceRange)는 서버에서 처리되므로 클라이언트에서 제외
  const needsClientProcessing = hasArea || hasBids || hasDates || hasSearch;

  // 우측 필터 패널의 상세 필터가 적용되었는지 확인
  const hasDetailFilters =
    hasPrice ||
    Array.isArray((filters as any)?.buildingAreaRange) ||
    Array.isArray((filters as any)?.landAreaRange) ||
    Array.isArray((filters as any)?.constructionYearRange) ||
    Boolean((filters as any)?.floorConfirmation) ||
    Boolean((filters as any)?.elevatorAvailable) ||
    Boolean((filters as any)?.currentStatus) ||
    Boolean((filters as any)?.specialConditions) ||
    Boolean((filters as any)?.saleDateFrom) ||
    Boolean((filters as any)?.saleDateTo);

  // auction_ed는 지역 필터가 서버에서 처리되므로 항상 서버 페이지네이션 사용
  // 클라이언트 필터링은 각 페이지 내에서만 적용
  const requestPage = page;
  const requestSize = size;

  // auction_ed 데이터셋 사용 (요청 크기 동적 조정)
  const {
    items: rawItems,
    total: serverTotal,
    isLoading,
    error,
    mutate: refetch,
  } = useDataset("auction_ed", mergedFilters, requestPage, requestSize);

  // 전체 데이터 개수 조회 (지역 필터 없이)
  const { total: totalAllData } = useDataset("auction_ed", {}, 1, 1);

  // 상세 필터링 개수 계산을 위한 지역 필터링된 전체 데이터 조회
  const regionOnlyFilters = {
    province: filters.province,
    cityDistrict: filters.cityDistrict,
    town: filters.town,
  };
  // auction_ed는 항상 서버 페이지네이션만 사용 (클라이언트 필터링 비활성화)
  const { items: allRegionItems, total: regionTotal } = useDataset(
    "auction_ed",
    regionOnlyFilters,
    1,
    1 // 항상 1개만 가져와서 총 개수만 확인
  );

  // auction_ed는 모든 필터를 서버에서 처리하므로 클라이언트 필터링 비활성화
  const applyDetailFilters = (itemsToFilter: any[]) => {
    // auction_ed는 항상 서버 필터링만 사용
    return itemsToFilter || [];
  };

  // 현재 페이지 데이터에 상세 필터링 적용
  const items = applyDetailFilters(rawItems) || [];

  // auction_ed는 서버에서 모든 필터링을 처리하므로 서버 총 개수를 사용
  const detailFilteredTotal = serverTotal || 0;

  // auction_ed는 서버에서 정렬과 페이징을 모두 처리하므로 클라이언트 처리 불필요
  const processedItems = items; // 서버에서 이미 정렬된 데이터 사용
  const effectiveTotal = serverTotal || 0;
  const pagedItems = processedItems; // 서버에서 이미 페이지네이션된 데이터 사용

  // 지도는 현재 페이지의 데이터 사용
  const mapItems = pagedItems;

  // 테이블 기능을 위한 추가 상태들
  const {
    sortableColumns,
    isLoading: sortColsLoading,
    error: sortColsError,
  } = useSortableColumns("auction_ed");
  // 분석 페이지와 동일한 전역 정렬 상태 사용
  const setSortConfig = useFilterStore((s: any) => s.setSortConfig);
  const sortBy = useFilterStore((s: any) => s.sortBy);
  const sortOrder = useFilterStore((s: any) => s.sortOrder);
  const featureFlags: any = useFeatureFlags();
  const useVirtual: boolean = !!(featureFlags as any)?.useVirtual;
  const areaDisplay = (featureFlags as any)?.areaDisplay;
  const selectedRowKeys = useFilterStore(
    (s: any) => s.selectedRowKeys ?? EMPTY_ARRAY
  );
  const setSelectedRowKeys = useFilterStore(
    (s: any) => s.setSelectedRowKeys ?? NOOP
  );

  // auction_ed 데이터셋 설정 가져오기
  const datasetConfig = datasetConfigs["auction_ed"];
  const schemaColumns = datasetConfig?.table?.columns;

  // 서버에서 제공하는 정렬 가능 컬럼 목록은 위 useSortableColumns 호출로 수신

  // 정렬 핸들러
  const handleSort = (column?: string, direction?: "asc" | "desc"): void => {
    const key = column ?? "";
    const order = direction ?? "asc";
    if (
      !key ||
      (Array.isArray(sortableColumns) &&
        sortableColumns.length > 0 &&
        !sortableColumns.includes(key))
    ) {
      return;
    }
    setSortConfig(key, order);
    setPage(1);
  };

  const handleExport = () => {
    // TODO: 내보내기 기능 구현
    console.log("경매 데이터 내보내기");
  };

  const handleSetAlert = () => {
    // TODO: 알림 설정 기능 구현
    console.log("경매 알림 설정");
  };

  return (
    <div className="space-y-6">
      {/* 검색 결과 헤더 및 액션 버튼 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <h2 className="text-2xl font-bold text-gray-900">과거 경매 결과</h2>
          <p className="text-gray-600 mt-1">
            <span className="inline-block">
              전체{" "}
              <span className="font-semibold text-blue-600">
                {(totalAllData || 0).toLocaleString()}
              </span>
              건
            </span>
            {" → "}
            <span className="inline-block">
              지역필터{" "}
              <span className="font-semibold text-green-600">
                {(regionTotal || 0).toLocaleString()}
              </span>
              건
            </span>
            {hasDetailFilters && (
              <>
                {" → "}
                <span className="inline-block">
                  상세필터{" "}
                  <span className="font-semibold text-purple-600">
                    {(serverTotal || 0).toLocaleString()}
                  </span>
                  건
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
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

      {/* 뷰 전환 탭 */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <Tabs
            value={activeView}
            onValueChange={(value) =>
              onViewChange(value as "table" | "map" | "both")
            }
          >
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="table" className="flex items-center">
                <List className="w-4 h-4 mr-2" />
                목록
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center">
                <Map className="w-4 h-4 mr-2" />
                지도
              </TabsTrigger>
              <TabsTrigger value="both" className="flex items-center">
                <Layers className="w-4 h-4 mr-2" />
                통합
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="p-4">
          {/* 로딩, 에러, 빈 상태 처리 */}
          {isLoading || error || items.length === 0 ? (
            <ViewState
              isLoading={isLoading}
              error={error}
              total={items.length}
              onRetry={refetch}
            >
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-gray-500">표시할 데이터가 없습니다.</p>
                <p className="text-sm text-gray-400 mt-1">
                  필터를 조정하거나 다른 조건으로 검색해보세요.
                </p>
              </div>
            </ViewState>
          ) : (
            /* 뷰 렌더링 - 데이터가 있을 때만 */
            <>
              {activeView === "table" && (
                <div className="space-y-4">
                  {useVirtual ? (
                    <ItemTableVirtual
                      items={pagedItems as any}
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
                      items={pagedItems as any}
                      isLoading={false}
                      error={undefined}
                      schemaColumns={schemaColumns}
                      getValueForKey={(row: any, key: string) => {
                        // area 컬럼 전역 플래그 기반 포맷
                        if (key === "area") {
                          const m2 = row?.area as number | undefined;
                          if (typeof m2 === "number" && Number.isFinite(m2)) {
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
                      totalCount={effectiveTotal || 0}
                      page={page}
                      pageSize={size}
                      onPageChange={(p) => setPage(p)}
                    />
                  )}

                  {/* 테이블 뷰 페이지네이션 컨트롤 */}
                  <div className="mt-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            페이지당
                          </span>
                          <Select
                            value={String(size)}
                            onValueChange={(value) => {
                              const s = parseInt(value);
                              if (Number.isFinite(s) && s > 0) {
                                setSize(s);
                                setPage(1);
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
                          <span className="text-sm text-gray-600">개</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        전체 {(effectiveTotal || 0).toLocaleString()}건 중{" "}
                        {Math.min(size * (page - 1) + 1, effectiveTotal || 0)}-
                        {Math.min(size * page, effectiveTotal || 0)}건 표시
                      </div>
                    </div>
                    <Pagination>
                      <PaginationContent>
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
                            Math.ceil((effectiveTotal || 0) / size)
                          );
                          const pages: JSX.Element[] = [];
                          const startPage = Math.max(1, page - 2);
                          const endPage = Math.min(totalPages, page + 2);
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
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              const totalPages = Math.max(
                                1,
                                Math.ceil((effectiveTotal || 0) / size)
                              );
                              if (page < totalPages) setPage(page + 1);
                            }}
                            className={
                              page >=
                              Math.max(
                                1,
                                Math.ceil((effectiveTotal || 0) / size)
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
              )}

              {activeView === "map" && (
                <div style={{ height: "600px" }}>
                  <MapView items={mapItems} namespace="auction_ed" />
                </div>
              )}

              {activeView === "both" && (
                <div className="space-y-6">
                  {/* 지도 섹션 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">지도 보기</h3>
                    <div style={{ height: "400px" }}>
                      <MapView items={mapItems} namespace="auction_ed" />
                    </div>
                  </div>

                  {/* 테이블 섹션 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">목록 보기</h3>
                    {useVirtual ? (
                      <ItemTableVirtual
                        items={pagedItems as any}
                        isLoading={false}
                        error={undefined}
                        sortBy={sortBy as any}
                        sortOrder={sortOrder as any}
                        onSort={handleSort}
                        selectedRowKeys={selectedRowKeys}
                        onSelectionChange={setSelectedRowKeys}
                        containerHeight={400}
                        rowHeight={44}
                        overscan={8}
                      />
                    ) : (
                      <ItemTable
                        items={pagedItems as any}
                        isLoading={false}
                        error={undefined}
                        schemaColumns={schemaColumns}
                        getValueForKey={(row: any, key: string) => {
                          // area 컬럼 전역 플래그 기반 포맷
                          if (key === "area") {
                            const m2 = row?.area as number | undefined;
                            if (typeof m2 === "number" && Number.isFinite(m2)) {
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
                        totalCount={effectiveTotal || 0}
                        page={page}
                        pageSize={size}
                        onPageChange={(p) => setPage(p)}
                      />
                    )}

                    {/* 통합 뷰 페이지네이션 컨트롤 */}
                    <div className="mt-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              페이지당
                            </span>
                            <Select
                              value={String(size)}
                              onValueChange={(value) => {
                                const s = parseInt(value);
                                if (Number.isFinite(s) && s > 0) {
                                  setSize(s);
                                  setPage(1);
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
                            <span className="text-sm text-gray-600">개</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          전체 {(effectiveTotal || 0).toLocaleString()}건 중{" "}
                          {Math.min(size * (page - 1) + 1, effectiveTotal || 0)}
                          -{Math.min(size * page, effectiveTotal || 0)}건 표시
                        </div>
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (page > 1) setPage(page - 1);
                              }}
                              className={
                                page <= 1
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>
                          {(() => {
                            const totalPages = Math.max(
                              1,
                              Math.ceil((effectiveTotal || 0) / size)
                            );
                            const pages: JSX.Element[] = [];
                            const startPage = Math.max(1, page - 2);
                            const endPage = Math.min(totalPages, page + 2);
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
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                const totalPages = Math.max(
                                  1,
                                  Math.ceil((effectiveTotal || 0) / size)
                                );
                                if (page < totalPages) setPage(page + 1);
                              }}
                              className={
                                page >=
                                Math.max(
                                  1,
                                  Math.ceil((effectiveTotal || 0) / size)
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
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
