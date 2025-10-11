"use client";

import { useState, useEffect } from "react";
import type { Key } from "react";
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
import { useCircleFilterPipeline } from "@/components/features/shared/useCircleFilterPipeline";
import { ViewState } from "@/components/ui/view-state";
import { List, Map, Layers, Download, Bell } from "lucide-react";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
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

interface RentSearchResultsProps {
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

export default function RentSearchResults({
  activeView,
  onViewChange,
  bounds,
  onBoundsChange,
}: RentSearchResultsProps) {
  // 필터 상태 가져오기 (네임스페이스 필터 포함)
  const allFilters = useFilterStore();

  // rent 네임스페이스 필터 병합
  const namespace = "rent";
  const nsOverrides = (
    allFilters.ns && namespace ? (allFilters.ns as any)[namespace] : undefined
  ) as any;
  const mergedFilters: any =
    namespace && nsOverrides ? { ...allFilters, ...nsOverrides } : allFilters;

  const setPage = useFilterStore((s) => s.setPage);
  const setSize = useFilterStore((s) => s.setSize);
  const setSortConfig = useFilterStore((s: any) => s.setSortConfig);
  const page = useFilterStore((s) => s.page);
  const size = useFilterStore((s) => s.size);

  // 지역 조건 체크
  const hasProvince = !!(allFilters as any)?.province;
  const hasCity = !!(allFilters as any)?.cityDistrict;
  const regionReady = hasProvince && hasCity;

  // 기본 정렬 초기화 (최초 1회만)
  useEffect(() => {
    if (regionReady && !(allFilters as any)?.sortBy) {
      setSortConfig("contractDate", "desc");
    }
  }, [regionReady, setSortConfig]);

  // 🆕 원 필터 상태 먼저 가져오기 (분기 조건 판단용)
  const nsState = useFilterStore((s: any) => s.ns);
  const applyCircleFilter = Boolean(nsState?.rent?.applyCircleFilter);
  const circleCenter = nsState?.rent?.circleCenter ?? null;
  const centerValid =
    circleCenter &&
    Number.isFinite(circleCenter.lat) &&
    Number.isFinite(circleCenter.lng) &&
    !(Number(circleCenter.lat) === 0 && Number(circleCenter.lng) === 0);
  const centerForFilter = centerValid
    ? { lat: Number(circleCenter.lat), lng: Number(circleCenter.lng) }
    : null;

  // 🆕 페이지별 데이터 (서버 정렬+페이지네이션)
  const pageHook = useDataset("rent", mergedFilters, page, size, regionReady);

  // 🆕 데이터 소스 (항상 pageHook 사용)
  const isLoading = pageHook.isLoading;
  const error = pageHook.error;
  const refetch = pageHook.mutate;
  const rawItems = pageHook.items;
  const serverTotal = pageHook.total;
  const items = rawItems || [];
  const totalCount = serverTotal;

  // 📊 전체 데이터 개수 조회 (필터 없이)
  const { total: totalAllData } = useDataset("rent", {}, 1, 1, true);

  // 📊 지역필터 개수 조회 (지역 필터만)
  const regionOnlyFilters = {
    province: mergedFilters?.province,
    cityDistrict: mergedFilters?.cityDistrict,
    town: mergedFilters?.town,
  };
  const { total: regionTotal } = useDataset(
    "rent",
    regionOnlyFilters,
    1,
    1,
    regionReady
  );

  // 📊 상세필터 감지 로직 (전월세 전용)
  const hasDetailFilters =
    Array.isArray(mergedFilters?.depositRange) ||
    Array.isArray(mergedFilters?.monthlyRentRange) ||
    Array.isArray(mergedFilters?.areaRange) ||
    Array.isArray(mergedFilters?.buildYearRange) ||
    Array.isArray(mergedFilters?.dateRange) ||
    (mergedFilters?.floorConfirmation &&
      mergedFilters?.floorConfirmation !== "all") ||
    (mergedFilters?.elevatorAvailable &&
      mergedFilters?.elevatorAvailable !== "all");

  // 🗺️ 지도용 대용량 데이터 요청
  const wantAllForMap = activeView !== "table" || applyCircleFilter;
  const BACKEND_MAX_PAGE_SIZE = 1000;
  const MAP_GUARD = { maxMarkers: 5000 };
  const mapRequestSize = wantAllForMap
    ? Math.min(BACKEND_MAX_PAGE_SIZE, MAP_GUARD.maxMarkers)
    : size;
  const mapPage = 1;

  // 표시 상한(지도 렌더 개수)
  const markerCaps = [100, 300, 500, 1000, 2000, 3000] as const;
  const [maxMarkersCap, setMaxMarkersCap] = useState<number>(() => {
    try {
      const raw =
        typeof window !== "undefined" &&
        localStorage.getItem("rent:maxMarkersCap");
      return raw ? parseInt(raw) : 500;
    } catch {}
    return 500;
  });
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("rent:maxMarkersCap", String(maxMarkersCap));
      }
    } catch {}
  }, [maxMarkersCap]);

  // 지도용 데이터 (서버 페이지네이션)
  const mapPageHook = useDataset(
    "rent",
    mergedFilters,
    mapPage,
    mapRequestSize,
    regionReady && wantAllForMap
  );
  const mapRawItems = mapPageHook.items;

  // 원 영역 필터 파이프라인
  const {
    processedItemsSorted,
    pagedItems,
    mapItems: filteredMapItems,
    circleCount,
    applyCircle,
  } = useCircleFilterPipeline({
    ns: "rent",
    activeView,
    page,
    size,
    items,
    globalSource: mapRawItems,
    maxMarkersCap,
    getRowSortTs: (r: any) =>
      r?.contract_date ? Date.parse(r.contract_date) : 0,
  });

  const finalPagedItems = applyCircle ? pagedItems : items;
  const finalMapItems = filteredMapItems;
  const finalTotalCount = applyCircle
    ? processedItemsSorted.length
    : totalCount;

  // 테이블 기능을 위한 추가 상태들
  const { sortableColumns } = useSortableColumns("rent");
  const sortBy = useFilterStore((s: any) => s.sortBy);
  const sortOrder = useFilterStore((s: any) => s.sortOrder);
  const { areaDisplay } = useFeatureFlags();
  const useVirtual = false;

  // 체크박스 선택 → 지도 연동
  const EMPTY_ARRAY: any[] = [];
  const NOOP = () => {};
  const selectedIds = useFilterStore((s: any) => s.selectedIds ?? EMPTY_ARRAY);
  const setSelectedIds = useFilterStore((s: any) => s.setSelectedIds ?? NOOP);
  const setPendingMapTarget = useFilterStore(
    (s: any) => s.setPendingMapTarget ?? NOOP
  );

  // 원 그리기 상태 (네임스페이스 기반)
  const setNsFilter = useFilterStore((s: any) => s.setNsFilter);
  const circleEnabled = Boolean(nsState?.rent?.circleEnabled);
  const circleRadiusM = nsState?.rent?.circleRadiusM ?? 1000;

  const handleCircleToggle = () => {
    if (typeof setNsFilter === "function") {
      const next = !circleEnabled;
      setNsFilter("rent", "circleEnabled" as any, next);
      if (next && !circleCenter) {
        const refMarker = nsState?.rent?.refMarkerCenter as any;
        if (
          refMarker &&
          Number.isFinite(refMarker.lat) &&
          Number.isFinite(refMarker.lng)
        ) {
          setNsFilter("rent", "circleCenter" as any, refMarker);
        }
      }
    }
  };

  const handleCircleChange = (next: {
    center: { lat: number; lng: number } | null;
    radiusM: number;
  }) => {
    if (typeof setNsFilter === "function") {
      if (next.center) {
        setNsFilter("rent", "circleCenter" as any, next.center);
      }
      if (Number.isFinite(next.radiusM)) {
        setNsFilter("rent", "circleRadiusM" as any, next.radiusM);
      }
    }
  };

  const handleToggleApplyCircleFilter = () => {
    if (typeof setNsFilter === "function") {
      setNsFilter("rent", "applyCircleFilter" as any, !applyCircleFilter);
    }
  };

  // rent 데이터셋 설정 가져오기
  const datasetConfig = datasetConfigs["rent"];
  const schemaColumns = (datasetConfig?.table?.columns || []).filter(
    (c: any) => {
      const hideKeys = new Set([
        "sido",
        "sigungu",
        "adminDong",
        "legalDongUnit",
        "elevatorAvailable",
        "postalCode",
      ]);
      return !hideKeys.has(c.key);
    }
  );

  // 정렬 핸들러: 서버 허용 키만
  const handleSort = (column?: string, direction?: "asc" | "desc") => {
    const key = column ?? "";
    const order = direction ?? "asc";
    const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    if (
      !key ||
      (Array.isArray(sortableColumns) &&
        sortableColumns.length > 0 &&
        !sortableColumns.includes(snakeKey))
    ) {
      return;
    }
    setSortConfig(key, order);
  };

  const handleExport = () => {
    console.log("전월세 데이터 내보내기");
  };
  const handleSetAlert = () => {
    console.log("전월세 알림 설정");
  };

  // 범례 임계값(ENV → 기본값 폴백)
  const legendCsv =
    (process.env.NEXT_PUBLIC_RENT_LEGEND as string) || "6000,8000,10000,13000";
  const legendThresholds = legendCsv
    .split(",")
    .map((v) => parseInt(v.trim()))
    .filter((n) => Number.isFinite(n));

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* 검색 결과 헤더 및 액션 버튼 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
            실거래가(전월세)
          </h2>
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
                    {(totalCount || 0).toLocaleString()}
                  </span>
                  건
                </span>
              </>
            )}
            {applyCircle && circleCount > 0 && (
              <>
                {" → "}
                <span className="inline-block">
                  원 안 필터{" "}
                  <span className="font-semibold text-indigo-600">
                    {circleCount.toLocaleString()}
                  </span>
                  건
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleExport}
            size="sm"
            className="text-xs lg:text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">내보내기</span>
            <span className="sm:hidden">내보내기</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleSetAlert}
            size="sm"
            className="text-xs lg:text-sm"
          >
            <Bell className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">알림 설정</span>
            <span className="sm:hidden">알림</span>
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

          {/* 표시 상한 + 영역 안만 보기 (map, both에서 노출) */}
          {activeView !== "table" && (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">표시 상한</span>
                  <select
                    className="h-7 rounded border px-2 bg-white"
                    value={String(maxMarkersCap)}
                    onChange={(e) => setMaxMarkersCap(parseInt(e.target.value))}
                  >
                    {markerCaps.map((cap) => (
                      <option key={cap} value={cap}>
                        {cap.toLocaleString()}개
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
                      최신 계약일자부터 우선 표시합니다.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-700 border rounded px-2 py-1 bg-white">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={applyCircleFilter}
                  onChange={(e) => {
                    const checked = Boolean(e.target.checked);
                    if (typeof setNsFilter === "function") {
                      if (checked) {
                        const center = circleCenter;
                        if (center) {
                          setNsFilter("rent", "circleCenter" as any, center);
                        }
                        const r = Number(circleRadiusM ?? 0);
                        if (!Number.isFinite(r) || r <= 0) {
                          setNsFilter("rent", "circleRadiusM" as any, 1000);
                        }
                      }
                      setNsFilter("rent", "applyCircleFilter" as any, checked);
                    }
                  }}
                />
                <span>영역 안만 보기</span>
              </label>
            </div>
          )}
        </div>

        <div className="p-4">
          {/* 지역 미선택 상태 */}
          {!regionReady ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-center">
                <Map className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  지역을 선택해주세요
                </h3>
                <p className="text-gray-500 mb-1">
                  시/도와 시군구를 선택하면 전월세 데이터를 조회할 수 있습니다.
                </p>
                <p className="text-sm text-gray-400">
                  좌측 필터에서 원하는 지역을 선택해주세요.
                </p>
              </div>
            </div>
          ) : isLoading ? (
            // 로딩
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  데이터를 불러오는 중입니다...
                </h3>
                <p className="text-sm text-gray-500">잠시만 기다려주세요</p>
              </div>
            </div>
          ) : error ? (
            // 에러
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 text-red-400">
                  <svg
                    className="w-full h-full"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  데이터를 불러오는 중 오류가 발생했습니다
                </h3>
                <p className="text-gray-600 mb-4">잠시 후 다시 시도해주세요.</p>
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  className="mb-4"
                >
                  <Download className="w-4 h-4 mr-2" />
                  다시 시도
                </Button>
              </div>
            </div>
          ) : items.length === 0 ? (
            // 빈 상태
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-center max-w-2xl">
                <List className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-gray-500 mb-4">
                  선택하신 조건에 맞는 전월세 거래 내역이 없습니다.
                </p>
              </div>
            </div>
          ) : (
            // 데이터 표시
            <>
              {activeView === "table" && (
                <div className="space-y-4">
                  {useVirtual ? (
                    <ItemTableVirtual
                      items={finalPagedItems as any}
                      isLoading={false}
                      error={undefined}
                      sortBy={sortBy as any}
                      sortOrder={sortOrder as any}
                      onSort={handleSort}
                      selectedRowKeys={selectedIds as any}
                      onSelectionChange={(keys) => {
                        setSelectedIds(Array.from(keys).map((k) => String(k)));
                      }}
                      containerHeight={560}
                      rowHeight={44}
                      overscan={8}
                    />
                  ) : (
                    <ItemTable
                      items={finalPagedItems as any}
                      isLoading={false}
                      error={undefined}
                      schemaColumns={schemaColumns}
                      getValueForKey={(row: any, key: string) => {
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
                        setSelectedIds(Array.from(keys).map((k) => String(k)));
                      }}
                      totalCount={finalTotalCount || 0}
                      page={page}
                      pageSize={size}
                      onPageChange={(p) => setPage(p)}
                      columnOrderStorageKey={"table:order:rent"}
                      defaultColumnOrder={
                        Array.isArray(schemaColumns)
                          ? schemaColumns.map((c: any) => c.key)
                          : undefined
                      }
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
                        전체 {(finalTotalCount || 0).toLocaleString()}건 중{" "}
                        {Math.min(size * (page - 1) + 1, finalTotalCount || 0)}-
                        {Math.min(size * page, finalTotalCount || 0)}건 표시
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
                            Math.ceil((finalTotalCount || 0) / size)
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
                                Math.ceil((finalTotalCount || 0) / size)
                              );
                              if (page < totalPages) setPage(page + 1);
                            }}
                            className={
                              page >=
                              Math.max(
                                1,
                                Math.ceil((finalTotalCount || 0) / size)
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
                    items={finalMapItems}
                    namespace="rent"
                    clusterToggleEnabled={true}
                    useClustering={true}
                    legendTitle="전월세전환금 범례(단위: 만원)"
                    legendUnitLabel="만원"
                    legendHint="네모박스 내용 Y=엘베 있음, N=엘베 없음"
                    legendThresholds={legendThresholds}
                    legendEditable={true}
                    highlightIds={(selectedIds || []).map((k: any) =>
                      String(k)
                    )}
                    circleControlsEnabled={true}
                    circleEnabled={circleEnabled}
                    circleCenter={circleCenter}
                    circleRadiusM={circleRadiusM}
                    applyCircleFilter={applyCircleFilter}
                    onCircleToggle={handleCircleToggle}
                    onCircleChange={handleCircleChange}
                    onToggleApplyCircleFilter={handleToggleApplyCircleFilter}
                    useRefMarkerFallback={false}
                  />
                </div>
              )}

              {activeView === "both" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">지도 보기</h3>
                    <div className="h-[calc(100vh-360px)]">
                      <MapView
                        items={finalMapItems}
                        namespace="rent"
                        clusterToggleEnabled={true}
                        useClustering={true}
                        legendTitle="전월세전환금 범례(단위: 만원)"
                        legendUnitLabel="만원"
                        legendHint="네모박스 내용 Y=엘베 있음, N=엘베 없음"
                        legendThresholds={legendThresholds}
                        legendEditable={true}
                        highlightIds={(selectedIds || []).map((k: any) =>
                          String(k)
                        )}
                        circleControlsEnabled={true}
                        circleEnabled={circleEnabled}
                        circleCenter={circleCenter}
                        circleRadiusM={circleRadiusM}
                        applyCircleFilter={applyCircleFilter}
                        onCircleToggle={handleCircleToggle}
                        onCircleChange={handleCircleChange}
                        onToggleApplyCircleFilter={
                          handleToggleApplyCircleFilter
                        }
                        useRefMarkerFallback={false}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">목록 보기</h3>
                    {useVirtual ? (
                      <ItemTableVirtual
                        items={finalPagedItems as any}
                        isLoading={false}
                        error={undefined}
                        sortBy={sortBy as any}
                        sortOrder={sortOrder as any}
                        onSort={handleSort}
                        selectedRowKeys={selectedIds as any}
                        onSelectionChange={(keys) => {
                          const prev = new Set(
                            (selectedIds || []).map((k: any) => String(k))
                          );
                          const now = new Set(
                            Array.from(keys).map((k) => String(k))
                          );
                          let added: string | undefined;
                          now.forEach((k) => {
                            if (!prev.has(String(k))) added = String(k);
                          });
                          setSelectedIds(Array.from(now));
                          if (added) {
                            const found = finalPagedItems.find(
                              (r: any) => String(r?.id ?? "") === added
                            );
                            const latRaw =
                              (found as any)?.lat ??
                              (found as any)?.latitude ??
                              (found as any)?.lat_y ??
                              (found as any)?.y;
                            const lngRaw =
                              (found as any)?.lng ??
                              (found as any)?.longitude ??
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
                            }
                          }
                        }}
                        containerHeight={400}
                        rowHeight={44}
                        overscan={8}
                      />
                    ) : (
                      <ItemTable
                        items={finalPagedItems as any}
                        isLoading={false}
                        error={undefined}
                        schemaColumns={schemaColumns}
                        getValueForKey={(row: any, key: string) => {
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
                          const now = new Set(
                            Array.from(keys).map((k) => String(k))
                          );
                          let added: string | undefined;
                          now.forEach((k) => {
                            if (!prev.has(String(k))) added = String(k);
                          });
                          setSelectedIds(Array.from(now));
                          if (added) {
                            const found = finalPagedItems.find(
                              (r: any) => String(r?.id ?? "") === added
                            );
                            const latRaw =
                              (found as any)?.lat ??
                              (found as any)?.latitude ??
                              (found as any)?.lat_y ??
                              (found as any)?.y;
                            const lngRaw =
                              (found as any)?.lng ??
                              (found as any)?.longitude ??
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
                            }
                          }
                        }}
                        totalCount={finalTotalCount || 0}
                        page={page}
                        pageSize={size}
                        onPageChange={(p) => setPage(p)}
                        columnOrderStorageKey={"table:order:rent"}
                        defaultColumnOrder={
                          Array.isArray(schemaColumns)
                            ? schemaColumns.map((c: any) => c.key)
                            : undefined
                        }
                      />
                    )}
                    {/* 통합 뷰 페이지네이션 */}
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
                          전체 {(finalTotalCount || 0).toLocaleString()}건 중{" "}
                          {Math.min(
                            size * (page - 1) + 1,
                            finalTotalCount || 0
                          )}
                          -{Math.min(size * page, finalTotalCount || 0)}건 표시
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
                              Math.ceil((finalTotalCount || 0) / size)
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
                                  Math.ceil((finalTotalCount || 0) / size)
                                );
                                if (page < totalPages) setPage(page + 1);
                              }}
                              className={
                                page >=
                                Math.max(
                                  1,
                                  Math.ceil((finalTotalCount || 0) / size)
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
