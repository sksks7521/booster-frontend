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

interface SaleSearchResultsProps {
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

export default function SaleSearchResults({
  activeView,
  onViewChange,
  bounds,
  onBoundsChange,
}: SaleSearchResultsProps) {
  // 필터 상태 가져오기
  const allFilters = useFilterStore();
  const setPage = useFilterStore((s) => s.setPage);
  const setSize = useFilterStore((s) => s.setSize);
  const setSortConfig = useFilterStore((s: any) => s.setSortConfig);
  const page = useFilterStore((s) => s.page);
  const size = useFilterStore((s) => s.size);

  // 지역 조건 체크 (auction_ed 패턴)
  const hasProvince = !!(allFilters as any)?.province;
  const hasCity = !!(allFilters as any)?.cityDistrict;
  const regionReady = hasProvince && hasCity;

  // 기본 정렬 초기화 (최초 1회만)
  useEffect(() => {
    if (regionReady && !(allFilters as any)?.sortBy) {
      setSortConfig("contractDate", "desc");
    }
  }, [regionReady, setSortConfig]);

  // sale 데이터셋 사용 (지역 조건 충족 시에만 요청)
  const {
    items,
    total: totalCount,
    isLoading,
    error,
    mutate: refetch,
  } = useDataset("sale", allFilters as any, page, size, regionReady);

  const mapItems = items;

  // 테이블 기능을 위한 추가 상태들
  const { sortableColumns } = useSortableColumns("sale");
  const sortBy = useFilterStore((s: any) => s.sortBy);
  const sortOrder = useFilterStore((s: any) => s.sortOrder);
  const { areaDisplay } = useFeatureFlags();
  const useVirtual = false; // 기본적으로 일반 테이블 사용

  // 🆕 체크박스 선택 → 지도 연동 (Zustand 스토어 사용)
  const EMPTY_ARRAY: any[] = [];
  const NOOP = () => {};
  const selectedIds = useFilterStore((s: any) => s.selectedIds ?? EMPTY_ARRAY);
  const setSelectedIds = useFilterStore((s: any) => s.setSelectedIds ?? NOOP);
  const setPendingMapTarget = useFilterStore(
    (s: any) => s.setPendingMapTarget ?? NOOP
  );

  // sale 데이터셋 설정 가져오기
  const datasetConfig = datasetConfigs["sale"];
  const schemaColumns = datasetConfig?.table?.columns;

  // 정렬 핸들러(분석 페이지와 동일 시그니처)
  const handleSort = (column?: string, direction?: "asc" | "desc") => {
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
  };

  const handleExport = () => {
    // TODO: 내보내기 기능 구현
    console.log("매매 데이터 내보내기");
  };

  const handleSetAlert = () => {
    // TODO: 알림 설정 기능 구현
    console.log("매매 알림 설정");
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* 검색 결과 헤더 및 액션 버튼 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
            실거래가(매매)
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <p className="text-gray-600">
              총{" "}
              <span className="font-semibold text-blue-600">
                {(totalCount || 0).toLocaleString()}건
              </span>
              의 매매 거래
            </p>
            {regionReady && (
              <div className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
                <span>•</span>
                <span className="font-medium">
                  {(allFilters as any)?.province}
                </span>
                {(allFilters as any)?.cityDistrict && (
                  <>
                    <span className="text-gray-400">/</span>
                    <span className="font-medium">
                      {(allFilters as any)?.cityDistrict}
                    </span>
                  </>
                )}
                {(allFilters as any)?.town && (
                  <>
                    <span className="text-gray-400">/</span>
                    <span className="font-medium">
                      {(allFilters as any)?.town}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
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
                  시/도와 시군구를 선택하면 매매 데이터를 조회할 수 있습니다.
                </p>
                <p className="text-sm text-gray-400">
                  좌측 필터에서 원하는 지역을 선택해주세요.
                </p>
              </div>
            </div>
          ) : /* 로딩 상태 */
          isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  데이터를 불러오는 중입니다...
                </h3>
                <p className="text-sm text-gray-500">잠시만 기다려주세요</p>
              </div>
            </div>
          ) : /* 에러 상태 */
          error ? (
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

                {/* 에러 종류별 메시지 */}
                {(error as any)?.status === 500 ||
                (error as any)?.code === "INTERNAL_SERVER_ERROR" ? (
                  <>
                    <p className="text-gray-600 mb-4">
                      서버에서 일시적인 문제가 발생했습니다.
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-red-800">
                        잠시 후 다시 시도해주세요. 문제가 계속되면 아래
                        고객센터로 문의해주세요.
                      </p>
                    </div>
                  </>
                ) : (error as any)?.status === 404 ? (
                  <>
                    <p className="text-gray-600 mb-4">
                      요청하신 데이터를 찾을 수 없습니다.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-yellow-800">
                        다른 지역을 선택하거나 필터 조건을 변경해보세요.
                      </p>
                    </div>
                  </>
                ) : (error as any)?.code === "ECONNABORTED" ||
                  (error as any)?.code === "ETIMEDOUT" ? (
                  <>
                    <p className="text-gray-600 mb-4">
                      네트워크 연결이 불안정하거나 요청 시간이 초과되었습니다.
                    </p>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-orange-800">
                        인터넷 연결을 확인하고 다시 시도해주세요.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 mb-4">
                      예상치 못한 오류가 발생했습니다.
                    </p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-700">
                        다시 시도해도 문제가 지속되면 고객센터로 문의해주세요.
                      </p>
                    </div>
                  </>
                )}

                {/* 다시 시도 버튼 */}
                <Button variant="outline" onClick={refetch} className="mb-4">
                  <Download className="w-4 h-4 mr-2" />
                  다시 시도
                </Button>

                {/* 고객센터 정보 */}
                <div className="text-xs text-gray-500 mt-4 pt-4 border-t">
                  <p className="mb-1">문제가 계속되시나요?</p>
                  <p className="font-medium text-gray-700">
                    고객센터: help@booster.com
                  </p>
                </div>
              </div>
            </div>
          ) : /* 데이터 없음 상태 */
          items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-center max-w-2xl">
                <List className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-gray-500 mb-4">
                  선택하신 조건에 맞는 매매 거래 내역이 없습니다.
                </p>

                {/* 현재 적용된 필터 조건 표시 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    📋 현재 조건
                  </p>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-medium">지역:</span>
                      <span>
                        {(allFilters as any)?.province} &gt;{" "}
                        {(allFilters as any)?.cityDistrict}
                        {(allFilters as any)?.town &&
                          ` > ${(allFilters as any)?.town}`}
                      </span>
                    </div>
                    {(allFilters as any)?.dateRange && (
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium">기간:</span>
                        <span>
                          {(allFilters as any)?.dateRange?.join(" ~ ")}
                        </span>
                      </div>
                    )}
                    {(allFilters as any)?.transactionAmountRange && (
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium">거래금액:</span>
                        <span>
                          {(allFilters as any)?.transactionAmountRange[0]}만원 ~{" "}
                          {(allFilters as any)?.transactionAmountRange[1] >=
                          500000
                            ? "제한없음"
                            : `${
                                (allFilters as any)?.transactionAmountRange[1]
                              }만원`}
                        </span>
                      </div>
                    )}
                    {(allFilters as any)?.exclusiveAreaRange && (
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium">전용면적:</span>
                        <span>
                          {(allFilters as any)?.exclusiveAreaRange[0]}㎡ ~{" "}
                          {(allFilters as any)?.exclusiveAreaRange[1]}㎡
                        </span>
                      </div>
                    )}
                    {(allFilters as any)?.buildYearRange && (
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium">건축연도:</span>
                        <span>
                          {(allFilters as any)?.buildYearRange[0]}년 ~{" "}
                          {(allFilters as any)?.buildYearRange[1]}년
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 개선된 제안 */}
                <div className="text-sm text-gray-600 space-y-3">
                  <p className="font-medium text-gray-700">
                    💡 다음을 시도해보세요:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-gray-700 mb-1">
                        📅 기간 확대
                      </p>
                      <p className="text-xs text-gray-600">
                        최근 거래가 적을 수 있습니다. 조회 기간을 넓혀보세요.
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-gray-700 mb-1">
                        💰 가격 범위 조정
                      </p>
                      <p className="text-xs text-gray-600">
                        가격 필터를 해제하거나 범위를 넓혀보세요.
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-gray-700 mb-1">
                        📐 면적 조건 완화
                      </p>
                      <p className="text-xs text-gray-600">
                        전용면적 범위를 넓히거나 필터를 해제해보세요.
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-gray-700 mb-1">
                        📍 지역 범위 확대
                      </p>
                      <p className="text-xs text-gray-600">
                        읍면동 필터를 해제하고 시군구 전체를 조회해보세요.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 뷰 렌더링 - 데이터가 있을 때만 */
            <>
              {activeView === "table" && (
                <div className="space-y-4">
                  {useVirtual ? (
                    <ItemTableVirtual
                      items={items as any}
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
                      items={items as any}
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
                        setSelectedIds(Array.from(keys).map((k) => String(k)));
                      }}
                      totalCount={totalCount || 0}
                      page={page}
                      pageSize={size}
                      onPageChange={(p) => setPage(p)}
                      columnOrderStorageKey={"table:order:sale"}
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
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-gray-600">개</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        전체 {(totalCount || 0).toLocaleString()}건 중{" "}
                        {Math.min(size * (page - 1) + 1, totalCount || 0)}-
                        {Math.min(size * page, totalCount || 0)}건 표시
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
                            Math.ceil((totalCount || 0) / size)
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
                                Math.ceil((totalCount || 0) / size)
                              );
                              if (page < totalPages) setPage(page + 1);
                            }}
                            className={
                              page >=
                              Math.max(1, Math.ceil((totalCount || 0) / size))
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
                  <MapView
                    items={mapItems}
                    namespace="sale"
                    legendTitle="거래금액 범례(단위: 만원)"
                    legendUnitLabel="만원"
                    legendThresholds={[5000, 10000, 30000, 50000]}
                    legendEditable={true}
                    legendHint="네모박스 내용 Y=엘베 있음, N=엘베 없음"
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
                    <div style={{ height: "400px" }}>
                      <MapView
                        items={mapItems}
                        namespace="sale"
                        legendTitle="거래금액 범례(단위: 만원)"
                        legendUnitLabel="만원"
                        legendThresholds={[5000, 10000, 30000, 50000]}
                        legendEditable={true}
                        legendHint="네모박스 내용 Y=엘베 있음, N=엘베 없음"
                        highlightIds={(selectedIds || []).map((k: any) =>
                          String(k)
                        )}
                      />
                    </div>
                  </div>

                  {/* 테이블 섹션 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">목록 보기</h3>
                    {useVirtual ? (
                      <ItemTableVirtual
                        items={items as any}
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

                          // 🆕 통합 뷰에서 체크박스 선택 시 지도 이동
                          if (added) {
                            const found = items.find(
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
                        items={items as any}
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
                          const now = new Set(
                            Array.from(keys).map((k) => String(k))
                          );
                          let added: string | undefined;
                          now.forEach((k) => {
                            if (!prev.has(String(k))) added = String(k);
                          });
                          setSelectedIds(Array.from(now));

                          // 🆕 통합 뷰에서 체크박스 선택 시 지도 이동
                          if (added) {
                            const found = items.find(
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
                        totalCount={totalCount || 0}
                        page={page}
                        pageSize={size}
                        onPageChange={(p) => setPage(p)}
                        columnOrderStorageKey={"table:order:sale"}
                        defaultColumnOrder={
                          Array.isArray(schemaColumns)
                            ? schemaColumns.map((c: any) => c.key)
                            : undefined
                        }
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
                          전체 {(totalCount || 0).toLocaleString()}건 중{" "}
                          {Math.min(size * (page - 1) + 1, totalCount || 0)}-
                          {Math.min(size * page, totalCount || 0)}건 표시
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
                              Math.ceil((totalCount || 0) / size)
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
                                  Math.ceil((totalCount || 0) / size)
                                );
                                if (page < totalPages) setPage(page + 1);
                              }}
                              className={
                                page >=
                                Math.max(1, Math.ceil((totalCount || 0) / size))
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
