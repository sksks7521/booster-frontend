"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import FilterControl from "@/components/features/filter-control";
import SelectedFilterBar from "@/components/features/selected-filter-bar";
import ItemTable from "@/components/features/item-table";
import MapView from "@/components/features/map-view";
import { useFilterStore } from "@/store/filterStore";
import { useItems } from "@/hooks/useItems";
import { useDebouncedValue } from "@/hooks/useDebounce";
import { Search, Map, List, Download, Bell } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

export default function AnalysisPage() {
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const [activeView, setActiveView] = useState<"table" | "map" | "both">(
    "table"
  );
  const { items, isLoading, error, totalCount, refetch } = useItems();
  const setPage = useFilterStore((s) => s.setPage);
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

  // useItems 훅이 필터 상태를 키로 사용하여 자동 재검증함

  const handleSearch = () => {
    console.log("Search query:", debouncedQuery);
    // TODO: debouncedQuery를 필터 스토어에 반영하여 서버 질의로 연동
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

        <div className="space-y-6">
          {/* 필터 컨트롤 (전체 너비) */}
          <FilterControl
            isCollapsed={isFilterCollapsed}
            onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
          />

          {/* 선택된 필터 표시 */}
          <SelectedFilterBar />

          {/* 뷰 전환 및 결과 요약 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  검색 결과{" "}
                  {isLoading
                    ? "로딩 중..."
                    : (totalCount ?? items?.length ?? 0) + "건"}
                </CardTitle>
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
            </CardHeader>
            <CardContent>
              {activeView === "table" && (
                <ItemTable
                  items={items}
                  isLoading={isLoading}
                  error={error}
                  onRetry={refetch}
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
                    />
                  </div>
                </div>
              )}

              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(Math.max(1, page - 1));
                        }}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="px-3 text-sm text-gray-600">
                        페이지 {page} /{" "}
                        {Math.max(1, Math.ceil((totalCount ?? 0) / size))}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          const totalPages = Math.max(
                            1,
                            Math.ceil((totalCount ?? 0) / size)
                          );
                          setPage(Math.min(totalPages, page + 1));
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 푸터 */}
      <Footer />
    </div>
  );
}
