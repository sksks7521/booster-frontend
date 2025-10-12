"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import { realTransactionApi } from "@/lib/api";

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
  // 필터 상태 가져오기 (네임스페이스 필터 포함)
  const allFilters = useFilterStore();

  // sale 네임스페이스 필터 병합
  const namespace = "sale";
  const nsOverrides = (
    allFilters.ns && namespace ? (allFilters.ns as any)[namespace] : undefined
  ) as any;
  const mergedFilters: any =
    namespace && nsOverrides ? { ...allFilters, ...nsOverrides } : allFilters;

  console.log("🔍 [SaleSearchResults] 필터 상태 확인:", {
    dateRange: mergedFilters?.dateRange,
    allDateRange: (allFilters as any)?.dateRange,
    nsDateRange: nsOverrides?.dateRange,
    mergedFilters,
  });

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

  // 🆕 원 필터 상태 먼저 가져오기 (분기 조건 판단용)
  const nsState = useFilterStore((s: any) => s.ns);
  const applyCircleFilter = Boolean(nsState?.sale?.applyCircleFilter);
  const circleCenter = nsState?.sale?.circleCenter ?? null;
  const centerValid =
    circleCenter &&
    Number.isFinite(circleCenter.lat) &&
    Number.isFinite(circleCenter.lng) &&
    !(Number(circleCenter.lat) === 0 && Number(circleCenter.lng) === 0);
  // 서버 KNN 기준점: circleCenter 우선, 없으면 refMarkerCenter 폴백
  const centerForFilter = (function () {
    if (centerValid)
      return { lat: Number(circleCenter!.lat), lng: Number(circleCenter!.lng) };
    const ref = (nsState?.sale?.refMarkerCenter as any) || null;
    if (
      ref &&
      Number.isFinite(ref.lat) &&
      Number.isFinite(ref.lng) &&
      !(Number(ref.lat) === 0 && Number(ref.lng) === 0)
    )
      return { lat: Number(ref.lat), lng: Number(ref.lng) };
    return null;
  })();

  // ✅ 실거래가는 항상 서버 페이지네이션 사용
  // - 서버가 정렬, 페이지네이션을 모두 지원
  // - 클라이언트 필터가 없음 (원 필터는 별도 파이프라인에서 처리)
  // - useGlobalDataset 불필요 (경매결과와 달리 클라이언트 필터 없음)

  // 🆕 페이지별 데이터 (서버 정렬+페이지네이션)
  const pageHook = useDataset("sale", mergedFilters, page, size, regionReady);

  // 🆕 데이터 소스 (항상 pageHook 사용)
  const isLoading = pageHook.isLoading;
  const error = pageHook.error;
  const refetch = pageHook.mutate;
  const rawItems = pageHook.items;
  const serverTotal = pageHook.total;
  const items = rawItems || [];
  const totalCount = serverTotal;

  // 📊 전체 데이터 개수 조회 (필터 없이)
  const { total: totalAllData } = useDataset("sale", {}, 1, 1, true);

  // 📊 지역필터 개수 조회 (지역 필터만)
  const regionOnlyFilters = {
    province: mergedFilters?.province,
    cityDistrict: mergedFilters?.cityDistrict,
    town: mergedFilters?.town,
  };
  const { total: regionTotal } = useDataset(
    "sale",
    regionOnlyFilters,
    1,
    1,
    regionReady
  );

  // 📊 상세필터 감지 로직
  const hasDetailFilters =
    Array.isArray(mergedFilters?.transactionAmountRange) ||
    Array.isArray(mergedFilters?.exclusiveAreaRange) ||
    Array.isArray(mergedFilters?.landRightsAreaRange) ||
    Array.isArray(mergedFilters?.pricePerPyeongRange) ||
    Array.isArray(mergedFilters?.buildYearRange) ||
    Array.isArray(mergedFilters?.dateRange) ||
    (mergedFilters?.floorConfirmation &&
      mergedFilters?.floorConfirmation !== "all") ||
    (mergedFilters?.elevatorAvailable &&
      mergedFilters?.elevatorAvailable !== "all");

  // 🗺️ 지도용 대용량 데이터 요청
  // - 지도/통합 뷰 또는 원 필터 활성 시 대용량 요청
  // - 서버 페이지네이션으로 처리 (useGlobalDataset 불필요)
  const wantAllForMap = activeView !== "table" || applyCircleFilter;

  const BACKEND_MAX_PAGE_SIZE = 1000;
  const MAP_GUARD = { maxMarkers: 5000 };

  const mapRequestSize = wantAllForMap
    ? Math.min(BACKEND_MAX_PAGE_SIZE, MAP_GUARD.maxMarkers)
    : size;

  const mapPage = 1;

  // 표시 상한(지도 렌더 개수) - 경매결과 패턴 적용
  const markerCaps = [100, 300, 500, 1000, 2000, 3000] as const;
  const [maxMarkersCap, setMaxMarkersCap] = useState<number>(() => {
    try {
      const raw =
        typeof window !== "undefined" &&
        localStorage.getItem("sale:maxMarkersCap");
      return raw ? parseInt(raw) : 500;
    } catch {}
    return 500;
  });
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("sale:maxMarkersCap", String(maxMarkersCap));
      }
    } catch {}
  }, [maxMarkersCap]);

  // 지도용 데이터 (서버 페이지네이션)
  // 서버 KNN 모드일 땐 중복 대용량 요청 방지 위해 비활성화
  const flags = useFeatureFlags();
  const nearestLimitRentIsServer = Boolean(flags.nearestLimitRentIsServer);
  const mapPageHook = useDataset(
    "sale",
    mergedFilters,
    mapPage,
    mapRequestSize,
    regionReady && wantAllForMap && !nearestLimitRentIsServer
  );

  // 지도 데이터 소스
  const mapRawItems = mapPageHook.items;

  // 플래그/최근접 서버 모드 상태 및 임시 상태
  const [nearestItems, setNearestItems] = useState<any[] | null>(null);
  const [nearestError, setNearestError] = useState<string | null>(null);
  const [nearestWarning, setNearestWarning] = useState<string | null>(null);

  // 서버에 전달할 필터 화이트리스트(객체/함수/내부 ns 제거)
  const serverFilterPayload = useMemo(() => {
    const f: any = mergedFilters || {};
    return {
      province: f.province,
      cityDistrict: f.cityDistrict,
      town: f.town,
      dateRange: f.dateRange,
      transactionAmountRange: f.transactionAmountRange,
      exclusiveAreaRange: f.exclusiveAreaRange,
      landRightsAreaRange: f.landRightsAreaRange,
      pricePerPyeongRange: f.pricePerPyeongRange,
      buildYearRange: f.buildYearRange,
      floorConfirmation: f.floorConfirmation,
      elevatorAvailable: f.elevatorAvailable,
    };
  }, [
    mergedFilters?.province,
    mergedFilters?.cityDistrict,
    mergedFilters?.town,
    mergedFilters?.dateRange?.[0],
    mergedFilters?.dateRange?.[1],
    mergedFilters?.transactionAmountRange?.[0],
    mergedFilters?.transactionAmountRange?.[1],
    mergedFilters?.exclusiveAreaRange?.[0],
    mergedFilters?.exclusiveAreaRange?.[1],
    mergedFilters?.landRightsAreaRange?.[0],
    mergedFilters?.landRightsAreaRange?.[1],
    mergedFilters?.pricePerPyeongRange?.[0],
    mergedFilters?.pricePerPyeongRange?.[1],
    mergedFilters?.buildYearRange?.[0],
    mergedFilters?.buildYearRange?.[1],
    mergedFilters?.floorConfirmation,
    mergedFilters?.elevatorAvailable,
  ]);
  const serverFilterKey = useMemo(
    () => JSON.stringify(serverFilterPayload),
    [serverFilterPayload]
  );

  // 개발 모드 중복 호출 가드
  const inFlightRef = useRef(false);

  // 🆕 서버 KNN 모드: 지도용 데이터 최근접 상위 K만 요청
  useEffect(() => {
    const shouldUseServer = Boolean(nearestLimitRentIsServer);
    const wantMapData = activeView !== "table" || applyCircleFilter;
    if (!regionReady || !shouldUseServer || !wantMapData) {
      setNearestItems(null);
      setNearestError(null);
      return;
    }
    if (!centerForFilter) {
      setNearestItems(null);
      setNearestError(null);
      return;
    }
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    let aborted = false;
    (async () => {
      try {
        setNearestError(null);
        const params = {
          ref_lat: centerForFilter.lat,
          ref_lng: centerForFilter.lng,
          limit: Number(maxMarkersCap),
          bounds: bounds || undefined,
          filters: serverFilterPayload,
          timeoutMs: 10000,
        } as const;
        try {
          console.info("[sale] nearest(server) request", {
            ref_lat: params.ref_lat,
            ref_lng: params.ref_lng,
            limit: params.limit,
            hasBounds: Boolean(params.bounds),
          });
        } catch {}
        const resp = await realTransactionApi.getNearestSaleMap(params as any);
        if (aborted) return;
        const arr = Array.isArray(resp?.items) ? resp.items : [];
        if (resp?.warning) {
          const limitUsed = Number(
            (resp as any)?.echo?.limit ?? Number(maxMarkersCap)
          );
          const txt = `물건 위치로부터 가까운 상위 ${
            Number.isFinite(limitUsed) && limitUsed > 0
              ? limitUsed.toLocaleString()
              : String(maxMarkersCap)
          }건만 반환했습니다.`;
          setNearestWarning(txt);
          try {
            console.warn("[sale] nearest warning:", resp.warning, txt);
          } catch {}
        } else {
          setNearestWarning(null);
        }
        setNearestItems(arr as any[]);
        try {
          (window as any).__nearestSale = {
            ts: Date.now(),
            params: {
              ref_lat: params.ref_lat,
              ref_lng: params.ref_lng,
              limit: params.limit,
              bounds: params.bounds,
            },
            echo: resp?.echo,
            warning: resp?.warning ?? null,
            itemsLength: arr.length,
          };
          console.info("[sale] nearest(server) response", {
            itemsLength: arr.length,
            echo: resp?.echo,
            warning: resp?.warning ?? null,
          });
        } catch {}
      } catch (e: any) {
        if (aborted) return;
        setNearestItems(null);
        const msg = String(e?.message || "nearest fetch failed");
        setNearestError(msg);
        try {
          console.info("[sale] fallback to client Top-K:", msg);
        } catch {}
        try {
          (window as any).__nearestSaleError = { ts: Date.now(), message: msg };
        } catch {}
      } finally {
        inFlightRef.current = false;
      }
    })();
    return () => {
      aborted = true;
    };
  }, [
    nearestLimitRentIsServer,
    regionReady,
    activeView !== "table",
    applyCircleFilter,
    centerForFilter?.lat,
    centerForFilter?.lng,
    maxMarkersCap,
    bounds?.south,
    bounds?.west,
    bounds?.north,
    bounds?.east,
    serverFilterKey,
  ]);

  // 🆕 원 영역 필터 파이프라인 (경매결과 패턴)
  const {
    processedItemsSorted,
    pagedItems,
    mapItems: filteredMapItems,
    circleCount,
    applyCircle,
  } = useCircleFilterPipeline({
    ns: "sale",
    activeView,
    page,
    size,
    items, // ✅ 테이블용 데이터 (현재 페이지)
    globalSource:
      nearestLimitRentIsServer && nearestItems ? nearestItems : mapRawItems,
    maxMarkersCap,
    getRowSortTs: (r: any) =>
      r?.contract_date ? Date.parse(r.contract_date) : 0,
  });

  // 🔄 최종 사용할 데이터 (원 필터 적용 여부에 따라 분기)
  const finalPagedItems = applyCircle ? pagedItems : items;
  // 경매결과와 동일하게 지도는 항상 파이프라인 결과(mapItems=filteredMapItems)에 표시 상한을 적용
  const finalMapItems = filteredMapItems;
  const finalTotalCount = applyCircle
    ? processedItemsSorted.length
    : totalCount;

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

  // 🆕 원 그리기 상태 (네임스페이스 기반) - nsState는 위에서 이미 선언됨
  const setNsFilter = useFilterStore((s: any) => s.setNsFilter);
  const circleEnabled = Boolean(nsState?.sale?.circleEnabled);
  const circleRadiusM = nsState?.sale?.circleRadiusM ?? 1000;

  // 🆕 원 이벤트 핸들러
  const handleCircleToggle = () => {
    if (typeof setNsFilter === "function") {
      const next = !circleEnabled;
      setNsFilter("sale", "circleEnabled" as any, next);
      // 원을 켤 때 중심이 비어 있으면 기본 위치로 설정
      if (next && !circleCenter) {
        // refMarkerCenter가 있으면 사용, 없으면 null 유지
        const refMarker = nsState?.sale?.refMarkerCenter as any;
        if (
          refMarker &&
          Number.isFinite(refMarker.lat) &&
          Number.isFinite(refMarker.lng)
        ) {
          setNsFilter("sale", "circleCenter" as any, refMarker);
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
        setNsFilter("sale", "circleCenter" as any, next.center);
      }
      if (Number.isFinite(next.radiusM)) {
        setNsFilter("sale", "circleRadiusM" as any, next.radiusM);
      }
    }
  };

  const handleToggleApplyCircleFilter = () => {
    if (typeof setNsFilter === "function") {
      setNsFilter("sale", "applyCircleFilter" as any, !applyCircleFilter);
    }
  };

  // sale 데이터셋 설정 가져오기
  const datasetConfig = datasetConfigs["sale"];
  // 기본 스키마에서 특정 컬럼 숨김: 광역시도(sido), 시군구(sigungu), 행정동(adminDong), 법정동단위(legalDongUnit), 엘리베이터유무(elevatorAvailable), 우편번호(postalCode)
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

  // 정렬 핸들러(분석 페이지와 동일 시그니처)
  const handleSort = (column?: string, direction?: "asc" | "desc") => {
    // 정렬 해제: column이 비어 들어오면 해제로 처리
    if (!column) {
      setSortConfig(undefined as any, undefined as any);
      return;
    }

    // 정렬 설정: 허용 컬럼만 통과 (camelCase → snake_case 비교)
    const key = column;
    const order = direction ?? "asc";
    const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();

    if (
      Array.isArray(sortableColumns) &&
      sortableColumns.length > 0 &&
      !sortableColumns.includes(snakeKey)
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

          {/* 서버 경고/폴백 안내 (지도/통합 뷰에서만) */}
          {activeView !== "table" && (
            <div className="mt-2 flex flex-col gap-2">
              {nearestWarning && (
                <div className="flex items-center justify-between rounded border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-[12px] text-yellow-800">
                  <span className="truncate">{nearestWarning}</span>
                  <button
                    className="ml-2 text-yellow-700 hover:underline"
                    onClick={() => setNearestWarning(null)}
                  >
                    닫기
                  </button>
                </div>
              )}
              {nearestError && (
                <div className="flex items-center justify-between rounded border border-blue-200 bg-blue-50 px-3 py-1.5 text-[12px] text-blue-800">
                  <span className="truncate">
                    서버 정렬 실패로 클라이언트 기준으로 표시 중입니다.
                  </span>
                  <button
                    className="ml-2 text-blue-700 hover:underline"
                    onClick={() => setNearestError(null)}
                  >
                    닫기
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 🆕 표시 상한 + 영역 안만 보기 (map, both 뷰에서만) - 경매결과 UI와 동일한 톤 */}
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
                      // 체크 ON 시 원 중심 확인
                      if (checked) {
                        const center = circleCenter;
                        if (center) {
                          setNsFilter("sale", "circleCenter" as any, center);
                        }
                        const r = Number(circleRadiusM ?? 0);
                        if (!Number.isFinite(r) || r <= 0) {
                          setNsFilter("sale", "circleRadiusM" as any, 1000);
                        }
                      }
                      setNsFilter("sale", "applyCircleFilter" as any, checked);
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
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  className="mb-4"
                >
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
                        // 건축연도 포맷: 1980년 형태로 반환
                        if (key === "constructionYearReal") {
                          const raw =
                            (row as any)?.[key] ?? (row as any)?.extra?.[key];
                          let y: number | undefined;
                          if (typeof raw === "number" && Number.isFinite(raw))
                            y = Math.round(raw);
                          else if (typeof raw === "string") {
                            const n = parseInt(
                              String(raw).replace(/[^0-9]/g, ""),
                              10
                            );
                            if (Number.isFinite(n)) y = n;
                          }
                          return y ? `${y}년` : "-";
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
                <div className="h-[calc(100vh-240px)]">
                  <MapView
                    items={finalMapItems}
                    namespace="sale"
                    markerLimit={maxMarkersCap}
                    // 클러스터 토글: 기본 on, UI 노출
                    clusterToggleEnabled={true}
                    useClustering={true}
                    legendTitle="거래금액 범례(단위: 만원)"
                    legendUnitLabel="만원"
                    legendThresholds={[5000, 10000, 30000, 50000]}
                    legendEditable={true}
                    legendHint="네모박스 내용 Y=엘베 있음, N=엘베 없음"
                    highlightIds={(selectedIds || []).map((k: any) =>
                      String(k)
                    )}
                    // 🆕 원 그리기 + 영역 필터
                    circleControlsEnabled={true}
                    circleEnabled={circleEnabled}
                    circleCenter={circleCenter}
                    circleRadiusM={circleRadiusM}
                    applyCircleFilter={applyCircleFilter}
                    onCircleToggle={handleCircleToggle}
                    onCircleChange={handleCircleChange}
                    onToggleApplyCircleFilter={handleToggleApplyCircleFilter}
                    useRefMarkerFallback={false} // 🆕 실거래가는 원 중심만 사용
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
                        items={finalMapItems}
                        namespace="sale"
                        markerLimit={maxMarkersCap}
                        // 클러스터 토글: 기본 on, UI 노출
                        clusterToggleEnabled={true}
                        useClustering={true}
                        legendTitle="거래금액 범례(단위: 만원)"
                        legendUnitLabel="만원"
                        legendThresholds={[5000, 10000, 30000, 50000]}
                        legendEditable={true}
                        legendHint="네모박스 내용 Y=엘베 있음, N=엘베 없음"
                        highlightIds={(selectedIds || []).map((k: any) =>
                          String(k)
                        )}
                        // 🆕 원 그리기 + 영역 필터
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
                        useRefMarkerFallback={false} // 🆕 실거래가는 원 중심만 사용
                      />
                    </div>
                  </div>

                  {/* 테이블 섹션 */}
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

                          // 🆕 통합 뷰에서 체크박스 선택 시 지도 이동
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
                          // 건축연도 포맷: 1980년 형태로 반환
                          if (key === "constructionYearReal") {
                            const raw =
                              (row as any)?.[key] ?? (row as any)?.extra?.[key];
                            let y: number | undefined;
                            if (typeof raw === "number" && Number.isFinite(raw))
                              y = Math.round(raw);
                            else if (typeof raw === "string") {
                              const n = parseInt(
                                String(raw).replace(/[^0-9]/g, ""),
                                10
                              );
                              if (Number.isFinite(n)) y = n;
                            }
                            return y ? `${y}년` : "-";
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
