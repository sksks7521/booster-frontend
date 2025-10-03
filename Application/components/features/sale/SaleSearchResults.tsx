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
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

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
    <div className="space-y-6">
      {/* 검색 결과 헤더 및 액션 버튼 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <h2 className="text-2xl font-bold text-gray-900">실거래가(매매)</h2>
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} size="sm">
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
          <Button variant="outline" onClick={handleSetAlert} size="sm">
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
          ) : /* 로딩, 에러, 빈 상태 처리 */
          isLoading || error || items.length === 0 ? (
            <ViewState
              isLoading={isLoading}
              error={error}
              total={items.length}
              onRetry={refetch}
            >
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-center">
                  <List className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    검색 결과가 없습니다
                  </h3>
                  <p className="text-gray-500 mb-4">
                    선택하신 조건에 맞는 매매 데이터가 없습니다.
                  </p>
                  <div className="text-sm text-gray-600 space-y-1 max-w-md mx-auto">
                    <p>💡 다음 사항을 확인해보세요:</p>
                    <ul className="text-left list-disc list-inside space-y-1 mt-2">
                      <li>거래 날짜 범위를 넓혀보세요</li>
                      <li>가격 범위를 조정해보세요</li>
                      <li>면적 조건을 완화해보세요</li>
                      <li>건축연도 범위를 넓혀보세요</li>
                    </ul>
                  </div>
                </div>
              </div>
            </ViewState>
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
                      selectedRowKeys={selectedRowKeys}
                      onSelectionChange={setSelectedRowKeys}
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
                      selectedRowKeys={selectedRowKeys}
                      onSelectionChange={setSelectedRowKeys}
                      totalCount={totalCount || 0}
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
                  <MapView items={mapItems} namespace="sale" />
                </div>
              )}

              {activeView === "both" && (
                <div className="space-y-6">
                  {/* 지도 섹션 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">지도 보기</h3>
                    <div style={{ height: "400px" }}>
                      <MapView items={mapItems} namespace="sale" />
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
                        selectedRowKeys={selectedRowKeys}
                        onSelectionChange={setSelectedRowKeys}
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
                        selectedRowKeys={selectedRowKeys}
                        onSelectionChange={setSelectedRowKeys}
                        totalCount={totalCount || 0}
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
