"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
const ItemTable = dynamic(() => import("@/components/features/item-table"), {
  ssr: false,
});
// 가상 테이블 사용 제거
import MapView from "@/components/features/map-view";

import { useFilterStore } from "@/store/filterStore";
import { useSortableColumns } from "@/hooks/useSortableColumns";
import { useFeatureFlags } from "@/lib/featureFlags";
import { MAP_GUARD, BACKEND_MAX_PAGE_SIZE } from "@/lib/map/config";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
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

  // auction_ed에서는 좌표 기반 필터링 비활성화하되 정렬 파라미터는 유지
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
    // 정렬 파라미터는 명시적으로 포함
    sortBy: (mergedFilters as any)?.sortBy,
    sortOrder: (mergedFilters as any)?.sortOrder,
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
      sortBy: filters?.sortBy,
      sortOrder: filters?.sortOrder,
    });
  }
  const hasArea = Array.isArray((filters as any)?.areaRange);
  const hasBids = Array.isArray((filters as any)?.bidCountRange);
  const hasDates = Array.isArray((filters as any)?.dateRange);
  const hasSearch = Boolean((filters as any)?.searchQuery);
  const hasSort = Boolean(
    (filters as any)?.sortBy && (filters as any)?.sortOrder
  );
  // auction_ed는 지역/가격은 서버 처리, 그 외(또는 정렬 활성 시)는 클라이언트 처리
  // 정렬 활성 시에는 전역 정렬을 보장하기 위해 클라이언트 파이프라인을 사용
  const needsClientProcessing =
    hasSort || hasArea || hasBids || hasDates || hasSearch;

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

  // 지도 추가 수집은 별도 처리하고, 기본 데이터는 항상 현재 페이지/사이즈로 요청
  const wantAllForMap = activeView !== "table";
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

  // 필요 시 클라이언트 필터링 (현재 상세필터는 서버 위임, 유지)
  const applyDetailFilters = (itemsToFilter: any[]) => {
    return itemsToFilter || [];
  };

  // 현재 페이지 데이터에 상세 필터링 적용
  const items = applyDetailFilters(rawItems) || [];

  // 정렬은 서버에서 처리하므로 클라이언트에서는 그대로 사용
  const processedItems = items;

  // 총 개수는 항상 서버 total 사용 (정렬 시에도 유지)
  const effectiveTotal = serverTotal || 0;
  const pagedItems = processedItems;

  // 지도는 전체(요청된 범위 내) 데이터 사용 + 필요 시 추가 페이지 병합
  const [extraMapItems, setExtraMapItems] = useState<any[]>([]);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const markerCaps = [100, 500, 1000, 3000] as const;
  const [maxMarkersCap, setMaxMarkersCap] = useState<number>(500);
  const nextCap = () => {
    const idx = markerCaps.indexOf(maxMarkersCap as any);
    const next = markerCaps[(idx + 1) % markerCaps.length];
    setMaxMarkersCap(next);
  };

  useEffect(() => {
    // 추가 페이지 병합 로직: 지도/통합 뷰에서만, 첫 요청 완료 후 수행
    let ignore = false;
    async function loadMorePages() {
      try {
        if (!wantAllForMap) return;
        if (!Array.isArray(items) || items.length === 0) {
          setExtraMapItems([]);
          return;
        }
        const maxToCollect = Math.min(
          MAP_GUARD.maxMarkers,
          maxMarkersCap,
          typeof effectiveTotal === "number" && effectiveTotal > 0
            ? effectiveTotal
            : items.length
        );
        const pageSize = BACKEND_MAX_PAGE_SIZE;
        const totalPages = Math.ceil(maxToCollect / pageSize);
        if (totalPages <= 1) {
          setExtraMapItems([]);
          return;
        }
        setIsFetchingMore(true);
        const api = datasetConfigs["auction_ed"].api;
        const all: any[] = [];
        // 페이지 2..N 요청 (직렬로 안정성 우선)
        for (let p = 2; p <= totalPages; p++) {
          const res = await (api as any).fetchList({
            filters: mergedFilters,
            page: p,
            size: pageSize,
          });
          if (ignore) return;
          const batch: any[] = Array.isArray(res)
            ? res
            : res?.results ?? res?.items ?? [];
          all.push(...batch);
          // 상한을 넘지 않도록 조기 종료
          if (items.length + all.length >= maxToCollect) break;
        }
        if (!ignore) setExtraMapItems(all);
      } catch {
        if (!ignore) setExtraMapItems([]);
      } finally {
        if (!ignore) setIsFetchingMore(false);
      }
    }
    loadMorePages();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    wantAllForMap,
    JSON.stringify(mergedFilters),
    requestSize,
    effectiveTotal,
    items?.length,
    maxMarkersCap,
  ]);

  // 지도 전용 아이템(표시 상한/추가 페이지 병합)과 테이블 전용 아이템(전체)을 분리
  const tableItemsAll = processedItems; // 목록은 상한 없이 전체
  const mapItemsAll = wantAllForMap
    ? [...processedItems, ...extraMapItems]
    : processedItems;
  const mapItems = (() => {
    const list = [...mapItemsAll];
    list.sort((a: any, b: any) => {
      const at = a?.sale_date ? new Date(a.sale_date).getTime() : 0;
      const bt = b?.sale_date ? new Date(b.sale_date).getTime() : 0;
      return bt - at;
    });
    return list.slice(0, Math.min(MAP_GUARD.maxMarkers, maxMarkersCap));
  })();

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
  const useVirtual: boolean = false;
  const areaDisplay = (featureFlags as any)?.areaDisplay;
  const selectedIds = useFilterStore((s: any) => s.selectedIds ?? EMPTY_ARRAY);
  const setSelectedIds = useFilterStore((s: any) => s.setSelectedIds ?? NOOP);
  const setPendingMapTarget = useFilterStore(
    (s: any) => s.setPendingMapTarget ?? NOOP
  );

  // auction_ed 데이터셋 설정 가져오기
  const datasetConfig = datasetConfigs["auction_ed"];
  const schemaColumns = datasetConfig?.table?.columns;

  // 서버에서 제공하는 정렬 가능 컬럼 목록은 위 useSortableColumns 호출로 수신

  // 정렬 핸들러: 서버에 위임(상태만 갱신)
  const handleSort = (column?: string, direction?: "asc" | "desc"): void => {
    const key = column ?? "";
    const order = direction ?? "asc";
    if (process.env.NODE_ENV === "development") {
      console.log("[v2 SortClick] 요청:", { key, order });
    }
    if (!key) {
      setSortConfig(undefined as any, undefined as any);
      return;
    }
    setSortConfig(key, order);
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
          {activeView !== "table" && (
            <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-gray-700">표시 상한</span>
                <select
                  className="h-7 rounded border px-2 bg-white"
                  value={String(maxMarkersCap)}
                  onChange={(e) => setMaxMarkersCap(parseInt(e.target.value))}
                >
                  {[100, 300, 500, 1000, 2000, 3000].map((v) => (
                    <option key={v} value={v}>
                      {v.toLocaleString()}개
                    </option>
                  ))}
                </select>
              </div>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-gray-600 cursor-help select-none"
                      aria-label="도움말"
                    >
                      ?
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="start"
                    className="bg-white text-gray-800 border border-gray-200 shadow-md max-w-[280px]"
                  >
                    최대 마커 개수를 설정합니다.
                    <br />
                    너무 크게 선택하면 브라우저가 느려질 수 있어요.
                    <br />
                    최신 매각기일부터 우선 표시합니다.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        <div className="p-4">
          {/* 로딩, 에러, 빈 상태 처리 */}
          {(isLoading && items.length === 0) || error || items.length === 0 ? (
            <ViewState
              isLoading={isLoading && items.length === 0}
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
                  {
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
                      selectedRowKeys={selectedIds as any}
                      onSelectionChange={(keys) =>
                        setSelectedIds(keys.map((k) => String(k)))
                      }
                      totalCount={effectiveTotal || 0}
                      page={page}
                      pageSize={size}
                      onPageChange={(p) => setPage(p)}
                    />
                  }

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
                <div className="h-[calc(100vh-240px)]">
                  <MapView
                    items={mapItems}
                    namespace="auction_ed"
                    highlightIds={(selectedIds || []).map((k: any) =>
                      String(k)
                    )}
                  />
                </div>
              )}

              {activeView === "both" && (
                <div className="space-y-6">
                  {/* 지도 섹션 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">지도 보기</h3>
                    <div className="h-[calc(100vh-360px)]">
                      <MapView
                        items={mapItems}
                        namespace="auction_ed"
                        highlightIds={(selectedIds || []).map((k: any) =>
                          String(k)
                        )}
                      />
                    </div>
                  </div>

                  {/* 테이블 섹션 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">목록 보기</h3>
                    {
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
                        selectedRowKeys={selectedIds as any}
                        onSelectionChange={(keys) => {
                          const prev = new Set(
                            (selectedIds || []).map((k: any) => String(k))
                          );
                          const now = new Set(keys.map((k) => String(k)));
                          let added: string | undefined;
                          now.forEach((k) => {
                            if (!prev.has(String(k))) added = String(k);
                          });
                          setSelectedIds(Array.from(now));
                          if (added && activeView === "both") {
                            // 최신 선택 항목을 지도 중심으로 이동 (통합 탭에서 지도도 렌더링 중)
                            const id = added;
                            const sources: any[] = [
                              ...mapItemsAll, // 지도에 표시되는 집합(상한 적용)
                              ...tableItemsAll, // 목록 전체(상한 없음)
                              ...extraMapItems,
                              ...items,
                            ];
                            const found = sources.find(
                              (r: any) => String(r?.id ?? "") === id
                            );
                            const latRaw =
                              found?.lat ??
                              found?.latitude ??
                              (found as any)?.lat_y ??
                              (found as any)?.y;
                            const lngRaw =
                              found?.lng ??
                              found?.longitude ??
                              (found as any)?.lon ??
                              (found as any)?.x;
                            const lat =
                              typeof latRaw === "number"
                                ? latRaw
                                : parseFloat(String(latRaw));
                            const lng =
                              typeof lngRaw === "number"
                                ? lngRaw
                                : parseFloat(String(lngRaw));
                            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                              setPendingMapTarget({ lat, lng });
                            } else {
                              // 지도 상한/좌표 결측으로 마커가 없을 수 있음
                              try {
                                // 동적 임포트 없이 직접 불러오기
                                // eslint-disable-next-line @typescript-eslint/no-var-requires
                                const mod = require("@/components/ui/use-toast");
                                const show = mod?.toast as
                                  | ((opts: any) => any)
                                  | undefined;
                                show?.({
                                  title: "지도의 마커를 찾을 수 없습니다",
                                  description:
                                    "표시 상한 또는 좌표 결측으로 지도에 보이지 않을 수 있어요. 상한을 늘리거나 필터를 좁혀보세요.",
                                });
                              } catch {}
                            }
                          }
                        }}
                        totalCount={effectiveTotal || 0}
                        page={page}
                        pageSize={size}
                        onPageChange={(p) => setPage(p)}
                      />
                    }

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
