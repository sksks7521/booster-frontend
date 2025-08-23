"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import FilterControl from "@/components/features/filter-control";
import SelectedFilterBar from "@/components/features/selected-filter-bar";
import dynamic from "next/dynamic";
const ItemTable = dynamic(() => import("@/components/features/item-table"), {
  ssr: false,
});
import MapView from "@/components/features/map-view";
import { useFilterStore } from "@/store/filterStore";
import { useItems } from "@/hooks/useItems";
import { useDebouncedValue } from "@/hooks/useDebounce";
import { Search, Map, List, Download, Bell } from "lucide-react";
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
  const { items, isLoading, error, totalCount, baseTotalCount, refetch } =
    useItems();
  const setPage = useFilterStore((s) => s.setPage);
  const setSize = useFilterStore((s) => s.setSize);
  const page = useFilterStore((s) => s.page);
  const size = useFilterStore((s) => s.size);

  // 스토어에서 필터 상태를 직접 구독합니다.
  const filters = useFilterStore((state) => state);

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
    const handler = () => setActiveView("map");
    window.addEventListener("property:openOnMap", handler as EventListener);
    return () =>
      window.removeEventListener(
        "property:openOnMap",
        handler as EventListener
      );
  }, []);

  // useItems 훅이 필터 상태를 키로 사용하여 자동 재검증함

  // 필터 스토어에서 setFilter와 정렬 관련 함수들 가져오기
  const setFilter = useFilterStore((s) => s.setFilter);
  const setSortConfig = useFilterStore((s) => s.setSortConfig);
  const sortBy = useFilterStore((s) => s.sortBy);
  const sortOrder = useFilterStore((s) => s.sortOrder);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

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
        <div className="flex flex-col lg:flex-row items-start gap-8">
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
                      </CardTitle>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
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
                  <ItemTable
                    items={items}
                    isLoading={isLoading}
                    error={error}
                    onRetry={refetch}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    selectedRowKeys={selectedRowKeys}
                    onSelectionChange={setSelectedRowKeys}
                  />
                )}
                {activeView === "map" && (
                  <MapView
                    items={items}
                    isLoading={isLoading}
                    error={error}
                    onRetry={refetch}
                  />
                )}
                {activeView === "both" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">지도</h3>
                      <MapView
                        items={items}
                        isLoading={isLoading}
                        error={error}
                        onRetry={refetch}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3">목록</h3>
                      <ItemTable
                        items={items}
                        isLoading={isLoading}
                        error={error}
                        onRetry={refetch}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
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
              detailsCollapsed
                ? "w-0 max-w-0 overflow-hidden"
                : "w-full lg:w-[384px] max-w-[384px]"
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

      {/* 푸터 */}
      <Footer />
    </div>
  );
}
