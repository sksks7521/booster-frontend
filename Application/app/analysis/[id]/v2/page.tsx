"use client";
import MapView from "@/components/features/map-view";

import { useEffect, useMemo, useState } from "react";
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
    return ds && ["auction_ed", "sale", "rent", "naver"].includes(ds)
      ? ds
      : "auction_ed";
  }, [searchParams]);
  const [activeDataset, setActiveDataset] = useState(initialDs);
  const [activeView, setActiveView] = useState("list");
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearch = () => {};
  const [pageNum, setPageNum] = useState(1);
  const [pageSize] = useState(20);

  // 공통 데이터셋 훅 연결(필터는 후속 단계에서 namespace 적용 예정)
  // v2에서는 공통 스토어의 일부 필드만 쿼리로 사용 (기존 analysis와 충돌 없음)
  const zFilters = useFilterStore((s: any) => s);
  const queryFilters = {
    province: zFilters?.province,
    cityDistrict: zFilters?.cityDistrict,
    town: zFilters?.town,
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

  const { items: dsItems, total: dsTotal } = useDataset(
    activeDataset as any,
    queryFilters,
    pageNum,
    pageSize
  );

  // ✅ 데이터셋 탭 변경 시 URL의 ds 동기화 및 해당 데이터셋 defaults를 필터에 주입
  useEffect(() => {
    try {
      const current = new URLSearchParams(searchParams?.toString() || "");
      current.set("ds", activeDataset);
      router.replace(`?${current.toString()}`, { scroll: false });
    } catch {}
  }, [activeDataset]);

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
        <Tabs value={activeDataset} onValueChange={setActiveDataset}>
          <TabsList className="bg-muted text-muted-foreground h-9 items-center justify-center rounded-lg p-[3px] grid w-full grid-cols-4">
            <TabsTrigger value="auction_ed">과거경매결과</TabsTrigger>
            <TabsTrigger value="sale">실거래가(매매)</TabsTrigger>
            <TabsTrigger value="rent">실거래가(전월세)</TabsTrigger>
            <TabsTrigger value="naver">네이버매물</TabsTrigger>
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
                  {(["auction_ed", "sale", "rent", "naver"] as const).map(
                    (ds) => (
                      <TabsContent key={ds} value={ds} className="mt-4">
                        <Tabs value={activeView} onValueChange={setActiveView}>
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

                          <TabsContent value="list" className="mt-4">
                            <ItemTable
                              items={dsItems as any}
                              isLoading={false}
                              error={undefined}
                              schemaColumns={schemaColumns}
                              getValueForKey={(row: any, key: string) => {
                                const direct = row?.[key];
                                if (direct !== undefined) return direct;
                                return row?.extra?.[key];
                              }}
                              totalCount={dsTotal as any}
                              page={pageNum}
                              pageSize={pageSize}
                              onPageChange={(p) => setPageNum(p)}
                            />
                          </TabsContent>

                          <TabsContent value="map" className="mt-4">
                            <MapView
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
                            />
                          </TabsContent>

                          <TabsContent value="integrated" className="mt-4">
                            <div className="space-y-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">
                                    지도
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <MapView
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
                                  />
                                </CardContent>
                              </Card>
                              <ItemTable
                                items={dsItems as any}
                                isLoading={false}
                                error={undefined}
                                schemaColumns={schemaColumns}
                                getValueForKey={(row: any, key: string) => {
                                  const direct = row?.[key];
                                  if (direct !== undefined) return direct;
                                  return row?.extra?.[key];
                                }}
                                totalCount={dsTotal as any}
                                page={pageNum}
                                pageSize={pageSize}
                                onPageChange={(p) => setPageNum(p)}
                              />
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
