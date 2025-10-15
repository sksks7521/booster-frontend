"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
const ItemTable = dynamic(() => import("@/components/features/item-table"), {
  ssr: false,
});
// 가상 테이블 사용 제거
import AuctionEdMap from "@/components/features/auction-ed/AuctionEdMap";
import { isWithinRadius, haversineDistanceM } from "@/lib/geo/distance";
import { pickLatLng } from "@/lib/geo/coords";
import { useCircleFilterPipeline } from "@/components/features/shared/useCircleFilterPipeline";

import { useFilterStore } from "@/store/filterStore";
import { useSortableColumns } from "@/hooks/useSortableColumns";
import { useFeatureFlags } from "@/lib/featureFlags";
import { auctionApi } from "@/lib/api";
import { MAP_GUARD, BACKEND_MAX_PAGE_SIZE } from "@/lib/map/config";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { formatArea, m2ToPyeong } from "@/lib/units";
import { useDataset } from "@/hooks/useDataset";
import { useGlobalDataset } from "@/hooks/useGlobalDataset";
import { datasetConfigs } from "@/datasets/registry";
import { ViewState } from "@/components/ui/view-state";
import { List, Map, Layers, Download, Bell } from "lucide-react";
import { buildAreaQueryParams, buildAuctionAreaParams } from "./areaQuery";
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
  // 🆕 외부에서 전달받을 데이터 (v2 페이지에서 전달)
  items?: any[];
  total?: number;
  isLoading?: boolean;
  error?: any;
  // 🆕 처리된 데이터를 상위로 전달하는 콜백 (하위 호환용)
  onProcessedDataChange?: (data: {
    tableItems: any[];
    mapItems: any[];
    total: number;
  }) => void;
  // 🆕 부모(v2)에서 결정한 서버 영역 모드 전달(첫 렌더 일치 보장)
  serverAreaEnabled?: boolean;
}

export default function AuctionEdSearchResults({
  activeView,
  onViewChange,
  bounds,
  onBoundsChange,
  items: externalItems,
  total: externalTotal,
  isLoading: externalLoading,
  error: externalError,
  onProcessedDataChange,
  serverAreaEnabled,
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

  // 반경 필터(영역 안만 보기) - 서버 영역필터 분기에 필요하므로 선계산
  const applyCircle = Boolean(nsOverrides?.applyCircleFilter);
  const centerCandidate =
    (nsOverrides as any)?.circleCenter || (nsOverrides as any)?.refMarkerCenter;
  const centerValid =
    centerCandidate &&
    Number.isFinite(centerCandidate.lat) &&
    Number.isFinite(centerCandidate.lng) &&
    !(Number(centerCandidate.lat) === 0 && Number(centerCandidate.lng) === 0);
  const centerForFilter = centerValid
    ? { lat: Number(centerCandidate.lat), lng: Number(centerCandidate.lng) }
    : null;
  const radiusMForFilter = (() => {
    const MIN_RADIUS = 500;
    const MAX_RADIUS = 100000; // 10km
    const r = Number((nsOverrides as any)?.circleRadiusM ?? 0);
    const valid = Number.isFinite(r) && r > 0 ? r : 1000;
    return Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, valid));
  })();
  const flags2 = useFeatureFlags();
  // 기능 상실 방지: 영역 안만 보기 ON이면 기본적으로 /area 경로 사용
  const useServerArea =
    serverAreaEnabled !== undefined
      ? Boolean(serverAreaEnabled)
      : Boolean(applyCircle && centerForFilter);
  const debugEnabled =
    Boolean((flags2 as any)?.diagnostics) ||
    String(process.env.NEXT_PUBLIC_DETAIL_DEBUG || "") === "1";

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
  const requestPage = page;
  const requestSize = size;

  // 정렬 활성 시 전역 정렬 모드로 전환, 아니면 기존 페이지 모드 사용
  const sortByGlobal = useFilterStore((s: any) => s.sortBy);
  const sortOrderGlobal = useFilterStore((s: any) => s.sortOrder);
  const useGlobal = Boolean(sortByGlobal && sortOrderGlobal);
  const pageHook = useDataset(
    "auction_ed",
    mergedFilters,
    requestPage,
    requestSize,
    !useServerArea
  );
  const globalHook = useGlobalDataset(
    "auction_ed",
    mergedFilters,
    requestPage,
    requestSize,
    sortByGlobal,
    sortOrderGlobal,
    5000,
    !useServerArea
  );
  // 🆕 외부 데이터가 있으면 우선 사용, 없으면 기존 훅 사용
  const isLoading =
    externalLoading ?? (useGlobal ? globalHook.isLoading : pageHook.isLoading);
  const error =
    externalError ?? (useGlobal ? globalHook.error : pageHook.error);
  const refetch = useGlobal ? globalHook.mutate : pageHook.mutate;
  const rawItems = useGlobal ? globalHook.items : pageHook.items;
  const serverTotal =
    externalTotal ?? (useGlobal ? globalHook.total : pageHook.total);

  // 전체 데이터 개수 조회 (지역 필터 없이)
  const { total: totalAllData } = useDataset(
    "auction_ed",
    {},
    1,
    1,
    !useServerArea
  );

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
    1, // 항상 1개만 가져와서 총 개수만 확인
    !useServerArea
  );

  // 필요 시 클라이언트 필터링 (현재 상세필터는 서버 위임, 유지)
  const applyDetailFilters = (itemsToFilter: any[]) => {
    return itemsToFilter || [];
  };

  // 🆕 외부에서 전달받은 데이터가 있으면 우선 사용, 없으면 기존 방식
  const items = externalItems ?? (applyDetailFilters(rawItems) || []);

  // 좌표 추출은 공통 유틸 사용

  // 지도 활성 또는 반경 필터 활성 시에는 전역 대용량 소스를 확보
  const wantAllForMap = activeView !== "table" || applyCircle;

  // 정렬은 서버에서 처리하므로 클라이언트에서는 그대로 사용하되, 토글 ON이면 반경 필터 적용
  // processedItems는 전역 원천을 기준으로 필터링하도록 뒤에서 계산(전역 mapRawItems 확보 후)

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

  // 지도 전용 대용량 요청: 입력 집합은 표시상한 영향을 받지 않도록 cap를 제거
  const mapRequestSize = wantAllForMap
    ? Math.min(BACKEND_MAX_PAGE_SIZE, MAP_GUARD.maxMarkers)
    : requestSize;
  const mapPage = 1;

  // 🆕 서버 KNN(최근접 상한) 상태 (지도 대용량 중복 요청 차단에 사용)
  const [nearestItems, setNearestItems] = useState<any[] | null>(null);
  const [nearestTotal, setNearestTotal] = useState<number>(0);
  const [nearestError, setNearestError] = useState<string | null>(null);
  const [nearestWarning, setNearestWarning] = useState<string | null>(null);
  const enableMapFetch = !useServerArea && !nearestItems;

  // 🆕 서버 전달용 필터 화이트리스트 + 안정 키
  const serverFilterPayload = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {
      buildAuctionFilterParams,
    } = require("@/lib/filters/buildAuctionFilterParams");
    return buildAuctionFilterParams(mergedFilters, {
      includeAliases: true,
      stripDefaults: true,
      floorTokenMode: "kr",
    });
  }, [mergedFilters]);
  const serverFilterKey = useMemo(
    () => JSON.stringify(serverFilterPayload),
    [serverFilterPayload]
  );
  const mapPageHook = useDataset(
    "auction_ed",
    mergedFilters,
    mapPage,
    mapRequestSize,
    enableMapFetch
  );
  const mapGlobalHook = useGlobalDataset(
    "auction_ed",
    mergedFilters,
    mapPage,
    mapRequestSize,
    sortByGlobal,
    sortOrderGlobal,
    5000,
    enableMapFetch
  );
  const mapRawItems = useGlobal ? mapGlobalHook.items : mapPageHook.items;
  const mapLoading = useGlobal
    ? (mapGlobalHook as any)?.isLoading
    : (mapPageHook as any)?.isLoading;
  const globalReady =
    wantAllForMap &&
    Array.isArray(mapRawItems) &&
    mapRawItems.length > 0 &&
    !mapLoading;

  // useServerArea는 상단에서 계산

  const [serverAreaState, setServerAreaState] = useState<{
    items: any[];
    total: number;
    isLoading: boolean;
    error?: any;
  }>({ items: [], total: 0, isLoading: false });

  // 지도 전용 대용량 상태(영역 모드 전용)
  const [serverAreaMapState, setServerAreaMapState] = useState<{
    items: any[];
    isLoading: boolean;
    error?: any;
  }>({ items: [], isLoading: false });

  // 🆕 서버 KNN 호출 (맵/통합 뷰 또는 영역 적용 시)
  useEffect(() => {
    // 영역 모드일 때는 /map KNN 호출을 중단 (중복 요청 방지)
    if (useServerArea) {
      setNearestItems(null);
      setNearestTotal(0);
      setNearestError(null);
      return;
    }
    const wantMapData = activeView !== "table" || applyCircle;
    if (!wantMapData || !regionReady || !centerForFilter) {
      setNearestItems(null);
      setNearestTotal(0);
      setNearestError(null);
      return;
    }
    let aborted = false;
    // 디바운스: 잦은 중심/줌 이동 시 과호출 방지
    const tid = setTimeout(() => {
      (async () => {
        try {
          // 호출 전 상태 초기화
          setNearestError(null);
          setNearestItems(null);
          setNearestTotal(0);

          const params = {
            ref_lat: centerForFilter.lat,
            ref_lng: centerForFilter.lng,
            limit: Number(maxMarkersCap),
            bounds: bounds || undefined,
            filters: serverFilterPayload,
            timeoutMs: 10000,
          } as const;
          try {
            if (debugEnabled) {
              console.groupCollapsed(
                "%c[auction_ed] nearest(server) request",
                "color:#0aa; font-weight:bold;",
                {
                  ref_lat: params.ref_lat,
                  ref_lng: params.ref_lng,
                  limit: params.limit,
                  hasBounds: Boolean(params.bounds),
                  requestKey: serverFilterKey,
                }
              );
              console.time("[auction_ed] nearest(server) fetch");
            }
          } catch {}
          const resp = await auctionApi.getNearestAuctionMap(params as any);
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
              if (debugEnabled)
                console.warn(
                  "[auction_ed] nearest warning:",
                  resp.warning,
                  txt
                );
            } catch {}
          } else {
            setNearestWarning(null);
          }
          setNearestItems(arr as any[]);
          try {
            const t = Number((resp as any)?.total ?? arr.length ?? 0);
            if (Number.isFinite(t)) setNearestTotal(t);
          } catch {
            setNearestTotal(Array.isArray(arr) ? arr.length : 0);
          }
          try {
            (window as any).__nearestAuction = {
              ts: Date.now(),
              params: {
                ref_lat: params.ref_lat,
                ref_lng: params.ref_lng,
                limit: params.limit,
                bounds: params.bounds,
              },
              echo: (resp as any)?.echo,
              total: (resp as any)?.total,
              warning: resp?.warning ?? null,
              itemsLength: arr.length,
            };
            if (debugEnabled) {
              console.timeEnd("[auction_ed] nearest(server) fetch");
              console.info("[auction_ed] nearest(server) response", {
                itemsLength: arr.length,
                echo: (resp as any)?.echo,
                total: (resp as any)?.total,
                warning: resp?.warning ?? null,
              });
              // KNN 정렬 검증 (top 5)
              const sample = arr.slice(0, 5).map((it: any) => {
                const { lat, lng } = it || {};
                const d =
                  Number.isFinite(lat) && Number.isFinite(lng)
                    ? haversineDistanceM(
                        { lat: params.ref_lat, lng: params.ref_lng },
                        { lat, lng }
                      )
                    : null;
                return { id: it?.id, lat, lng, d };
              });
              const distances = sample
                .map((s) => s.d)
                .filter((d) => d != null) as number[];
              const isNonDecreasing = distances.every((d, i, a) =>
                i === 0 ? true : d >= (a[i - 1] ?? d)
              );
              console.info("[auction_ed] KNN check", {
                top5: sample,
                distances,
                isNonDecreasing,
                minDistance: distances.length ? Math.min(...distances) : null,
                maxDistance: distances.length ? Math.max(...distances) : null,
              });
              console.groupEnd();
            }
          } catch {}
        } catch (e: any) {
          if (aborted) return;
          setNearestItems(null);
          setNearestTotal(0);
          const msg = String(e?.message || "nearest fetch failed");
          setNearestError(msg);
          try {
            console.info("[auction_ed] fallback to client Top-K:", msg);
          } catch {}
          try {
            (window as any).__nearestAuctionError = {
              ts: Date.now(),
              message: msg,
            };
          } catch {}
        }
      })();
    }, 250);
    return () => {
      aborted = true;
      clearTimeout(tid);
    };
  }, [
    activeView !== "table",
    applyCircle,
    regionReady,
    centerForFilter?.lat,
    centerForFilter?.lng,
    maxMarkersCap,
    bounds?.south,
    bounds?.west,
    bounds?.north,
    bounds?.east,
    serverFilterKey,
  ]);

  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!useServerArea) {
        setServerAreaState((s) => ({ ...s, items: [], total: 0 }));
        return;
      }
      try {
        setServerAreaState({ items: [], total: 0, isLoading: true });
        const q = buildAreaQueryParams({
          filters: filters as any,
          center: centerForFilter,
          radiusM: radiusMForFilter,
          page,
          size,
          sortBy: (filters as any)?.sortBy,
          sortOrder: (filters as any)?.sortOrder,
        });

        const res = await auctionApi.getCompletedArea(q as any);
        if (ignore) return;
        const rawItems = ((res as any)?.results ?? []) as any[];
        const adaptedItems = Array.isArray(rawItems)
          ? rawItems.map((r: any) =>
              (datasetConfigs as any)?.["auction_ed"]?.adapter?.toItemLike
                ? (datasetConfigs as any)["auction_ed"].adapter.toItemLike(r)
                : r
            )
          : [];
        setServerAreaState({
          items: adaptedItems,
          total: (res as any)?.total ?? 0,
          isLoading: false,
          error: undefined,
        });
      } catch (e) {
        if (ignore) return;
        setServerAreaState({ items: [], total: 0, isLoading: false, error: e });
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [
    useServerArea,
    centerForFilter?.lat,
    centerForFilter?.lng,
    radiusMForFilter,
    serverFilterKey,
    page,
    size,
  ]);

  // 지도 전용 /area 대용량 요청 (page=1, size=상한)
  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!useServerArea) {
        setServerAreaMapState({ items: [], isLoading: false });
        return;
      }
      try {
        setServerAreaMapState({ items: [], isLoading: true });
        // α배수 확대 수집 후 클라이언트 KNN 폴백 정렬/절단
        const ALPHA = 3;
        const alphaCapped = Math.min(
          3000,
          BACKEND_MAX_PAGE_SIZE,
          MAP_GUARD.maxMarkers,
          Math.max(1, Number(maxMarkersCap) * ALPHA)
        );
        const q = buildAreaQueryParams({
          filters: filters as any,
          center: centerForFilter,
          radiusM: radiusMForFilter,
          page: 1,
          size: alphaCapped,
          // 서버가 지원하면 거리 오름차순으로 반환됨
          sortBy: "distance" as any,
          sortOrder: "asc" as any,
        });
        // 서버가 limit를 지원할 수 있어 힌트로 함께 전달(무시되어도 무방)
        (q as any).limit = Number(maxMarkersCap);
        try {
          if (debugEnabled) {
            console.groupCollapsed(
              "%c[auction_ed] area(server) request",
              "color:#7b5; font-weight:bold;",
              {
                center: centerForFilter,
                radiusM: radiusMForFilter,
                page: 1,
                size: alphaCapped,
                ordering_hint: "distance_asc",
                region: {
                  sido: (q as any)?.sido,
                  address_city: (q as any)?.address_city,
                  eup_myeon_dong: (q as any)?.eup_myeon_dong,
                },
                filters: {
                  date_from: (q as any)?.date_from,
                  date_to: (q as any)?.date_to,
                  min_final_sale_price: (q as any)?.min_final_sale_price,
                  max_final_sale_price: (q as any)?.max_final_sale_price,
                  area_min: (q as any)?.area_min,
                  area_max: (q as any)?.area_max,
                  min_land_area: (q as any)?.min_land_area,
                  max_land_area: (q as any)?.max_land_area,
                  floor_confirmation: (q as any)?.floor_confirmation,
                  elevator_available: (q as any)?.elevator_available,
                  address_search: (q as any)?.address_search,
                  road_address_search: (q as any)?.road_address_search,
                  case_number_search: (q as any)?.case_number_search,
                },
              }
            );
            console.time("[auction_ed] area(server) fetch");
          }
        } catch {}

        const res = await auctionApi.getCompletedArea(q as any);
        if (ignore) return;
        const rawItems = ((res as any)?.results ?? []) as any[];
        const adaptedItems = Array.isArray(rawItems)
          ? rawItems.map((r: any) =>
              (datasetConfigs as any)?.["auction_ed"]?.adapter?.toItemLike
                ? (datasetConfigs as any)["auction_ed"].adapter.toItemLike(r)
                : r
            )
          : [];
        // 서버 KNN 지원 여부 추정(정확 확인 어려움 → 폴백 정렬 적용)
        const serverOrdering = String(
          (res as any)?.ordering || ""
        ).toLowerCase();
        const serverKnnOk = serverOrdering.includes("distance");
        const areaTotalFromResp = Number(
          (res as any)?.total ?? adaptedItems.length ?? 0
        );
        try {
          if (debugEnabled) {
            console.timeEnd("[auction_ed] area(server) fetch");
            console.info("[auction_ed] area(server) response", {
              itemsLength: adaptedItems.length,
              total: (res as any)?.total,
              ordering: (res as any)?.ordering,
              warning: (res as any)?.warning,
            });
          }
        } catch {}

        // 클라이언트 KNN 정렬 및 상한 적용
        const center = centerForFilter;
        const sortedLimited = adaptedItems
          .map((it: any) => {
            const lat = Number((it?.lat ?? it?.latitude) as any);
            const lng = Number((it?.lng ?? it?.longitude) as any);
            const d =
              Number.isFinite(lat) && Number.isFinite(lng)
                ? haversineDistanceM(
                    { lat: center!.lat, lng: center!.lng },
                    { lat, lng }
                  )
                : Number.POSITIVE_INFINITY;
            return { it, d };
          })
          .sort((a, b) => a.d - b.d)
          .slice(0, Number(maxMarkersCap))
          .map((x) => x.it);

        // 경고 배지: 표시상한 초과 우선 → 그 외 서버 KNN 미지원 안내
        try {
          if (
            Number.isFinite(areaTotalFromResp) &&
            areaTotalFromResp > Number(maxMarkersCap)
          ) {
            const limitUsed = Number(maxMarkersCap);
            const txt = `필터 결과가 ${areaTotalFromResp.toLocaleString()}건입니다. 가까운 순 상위 ${limitUsed.toLocaleString()}건만 표시합니다.`;
            setNearestWarning(txt);
          } else if (!serverKnnOk) {
            setNearestWarning(
              "서버 KNN 미지원으로 클라이언트 정렬을 적용했습니다."
            );
          } else {
            setNearestWarning(null);
          }
          if (debugEnabled) {
            const sample = sortedLimited.slice(0, 5).map((it: any) => {
              const { lat, lng } = it || {};
              const d =
                Number.isFinite(lat) && Number.isFinite(lng)
                  ? haversineDistanceM(
                      { lat: center!.lat, lng: center!.lng },
                      { lat, lng }
                    )
                  : null;
              return { id: it?.id, lat, lng, d };
            });
            const distances = sample
              .map((s) => s.d)
              .filter((d) => d != null) as number[];
            const isNonDecreasing = distances.every((d, i, a) =>
              i === 0 ? true : d >= (a[i - 1] ?? d)
            );
            console.info("[auction_ed] area(server) KNN check", {
              top5: sample,
              distances,
              isNonDecreasing,
            });
            console.groupEnd();
          }
        } catch {}

        setServerAreaMapState({
          items: sortedLimited,
          isLoading: false,
          error: undefined,
        });
      } catch (e) {
        if (ignore) return;
        setServerAreaMapState({ items: [], isLoading: false, error: e });
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [
    useServerArea,
    centerForFilter?.lat,
    centerForFilter?.lng,
    radiusMForFilter,
    serverFilterKey,
    sortByGlobal,
    sortOrderGlobal,
    maxMarkersCap,
  ]);

  useEffect(() => {
    // 지도는 별도의 대용량 1페이지 요청을 사용하므로 추가 병합은 비활성화
    setExtraMapItems([]);
    setIsFetchingMore(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    wantAllForMap,
    serverFilterKey,
    requestSize,
    // effectiveTotal는 아래에서 계산되므로 의존 제거
    items?.length,
    maxMarkersCap,
  ]);

  // 공통 파이프라인 훅으로 치환
  // 지도 전용 서버 소스: 서버 영역 모드면 area 응답, 그 외엔 /map(최근접) 응답
  const areaItems = ((serverAreaMapState.items as any[]) || []) as any[];
  const knnItems = ((nearestItems as any[]) || []) as any[];
  const serverMapItems =
    useServerArea && areaItems.length > 0 ? areaItems : knnItems;

  const { processedItemsSorted, pagedItems, mapItems, circleCount } =
    useCircleFilterPipeline({
      ns: "auction_ed",
      activeView,
      page,
      size,
      items,
      // 지도 전역 소스는 서버 응답으로 단일화
      globalSource: serverMapItems,
      maxMarkersCap,
      getRowSortTs: (r: any) => (r?.sale_date ? Date.parse(r.sale_date) : 0),
    });

  const areaTotal = Number(serverAreaState.total || 0);
  const effectiveTotal =
    useServerArea && areaTotal > 0 ? areaTotal : nearestTotal;
  const tableItemsAll = useServerArea
    ? serverAreaState.items
    : processedItemsSorted; // 목록은 상한 없이 전체

  // 🆕 처리된 데이터를 상위로 전달 (useMemo로 참조 안정성 확보하여 무한루프 방지)
  const processedDataMemo = useMemo(() => {
    const mapItemsForUI = serverMapItems as any[];
    console.log("🔍 [AuctionEdSearchResults] 데이터 전달:", {
      tableItemsLength: tableItemsAll?.length,
      mapItemsLength: mapItemsForUI?.length,
      total: effectiveTotal,
      hasExternalItems: !!externalItems,
      externalItemsLength: externalItems?.length,
      wantAllForMap,
      activeView,
      extraMapItemsLength: extraMapItems?.length,
      processedItemsLength: processedItemsSorted?.length,
    });
    return {
      tableItems: tableItemsAll,
      mapItems: mapItemsForUI,
      total: effectiveTotal,
    };
  }, [
    // 🔍 실제 데이터 길이와 첫번째 아이템 ID만 비교 (참조 변경 무시)
    tableItemsAll?.length,
    (useServerArea ? serverAreaMapState.items : mapItems)?.length,
    effectiveTotal,
    tableItemsAll?.[0]?.id,
    (useServerArea ? serverAreaMapState.items : mapItems)?.[0]?.id,
  ]);

  // ViewState 게이트: 서버 영역모드에서는 서버 응답 기준으로 표시/빈 상태를 판정
  const viewIsLoading = useServerArea
    ? Boolean(serverAreaState.isLoading)
    : Boolean(isLoading);
  const viewError = useServerArea ? (serverAreaState as any)?.error : error;
  const itemsForEmpty = useServerArea
    ? (serverAreaState.items as any[])
    : (items as any[]);
  const viewTotal = effectiveTotal;

  useEffect(() => {
    if (!onProcessedDataChange) return;
    // 반경 필터 활성 시 전역 소스 준비 전에는 상위 전달을 지연해 빈 집합 전달을 방지
    if (!useServerArea && applyCircle && !globalReady) return;
    onProcessedDataChange(processedDataMemo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processedDataMemo, applyCircle, globalReady]);

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

  // 정렬 진행 상태(낙관적 UI): 헤더 클릭 즉시 활성 → 데이터 완료 시 해제
  const [isSorting, setIsSorting] = useState(false);
  useEffect(() => {
    if (isLoading && (sortBy || sortOrder)) setIsSorting(true);
    if (!isLoading) setIsSorting(false);
  }, [isLoading, sortBy, sortOrder]);

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
            {(useFilterStore.getState()?.ns?.auction_ed?.applyCircleFilter ??
              false) && (
              <>
                {" → "}
                <span className="inline-block">
                  영역 안 필터{" "}
                  <span className="font-semibold text-indigo-600">
                    {(effectiveTotal || 0).toLocaleString()}
                  </span>
                  건
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2 items-center">
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
            <>
              {/* 경고/안내 배너를 최상단에 노출 */}
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

              {/* 설정 바: 좌측 표시상한 + 요약, 우측 영역안만 보기 */}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700">표시 상한</span>
                    <select
                      className="h-7 rounded border px-2 bg-white"
                      value={String(maxMarkersCap)}
                      onChange={(e) =>
                        setMaxMarkersCap(parseInt(e.target.value))
                      }
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
                  {/* 표시 요약을 표시상한 오른쪽에 배치 */}
                  <span className="inline-flex items-center rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700">
                    표시{" "}
                    {Math.min(
                      serverMapItems?.length || 0,
                      Number(maxMarkersCap)
                    ).toLocaleString()}{" "}
                    / 총 {(effectiveTotal || 0).toLocaleString()}
                  </span>
                </div>
                {/* 우측: 영역 안만 보기 */}
                <label className="flex items-center gap-2 text-xs text-gray-700 border rounded px-2 py-1 bg-white">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={Boolean(
                      (useFilterStore.getState()?.ns?.auction_ed
                        ?.applyCircleFilter as any) ?? false
                    )}
                    onChange={(e) => {
                      try {
                        const st = (useFilterStore as any).getState?.();
                        const setNs = st?.setNsFilter;
                        const ns = st?.ns?.auction_ed || {};
                        const checked = Boolean(e.target.checked);
                        if (typeof setNs === "function") {
                          if (checked) {
                            const center =
                              ns?.circleCenter &&
                              Number.isFinite(ns.circleCenter.lat) &&
                              Number.isFinite(ns.circleCenter.lng)
                                ? ns.circleCenter
                                : ns?.refMarkerCenter &&
                                  Number.isFinite(ns.refMarkerCenter.lat) &&
                                  Number.isFinite(ns.refMarkerCenter.lng) &&
                                  !(
                                    Number(ns.refMarkerCenter.lat) === 0 &&
                                    Number(ns.refMarkerCenter.lng) === 0
                                  )
                                ? ns.refMarkerCenter
                                : null;
                            if (center) {
                              setNs(
                                "auction_ed",
                                "circleCenter" as any,
                                center
                              );
                            }
                            const r = Number(ns?.circleRadiusM ?? 0);
                            if (!Number.isFinite(r) || r <= 0) {
                              setNs("auction_ed", "circleRadiusM" as any, 1000);
                            }
                          }
                          setNs(
                            "auction_ed",
                            "applyCircleFilter" as any,
                            checked
                          );
                        }
                      } catch {}
                    }}
                  />
                  <span>영역 안만 보기</span>
                </label>
              </div>
            </>
          )}
        </div>

        <div className="p-4">
          {/* 로딩, 에러, 빈 상태 처리 */}
          {(viewIsLoading && itemsForEmpty.length === 0) ||
          viewError ||
          itemsForEmpty.length === 0 ? (
            <ViewState
              isLoading={viewIsLoading && itemsForEmpty.length === 0}
              error={viewError}
              total={viewTotal}
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
                      items={
                        useServerArea
                          ? (serverAreaState.items as any)
                          : (pagedItems as any)
                      }
                      isLoading={false}
                      error={undefined}
                      rowKeyProp={(row: any) =>
                        String(
                          row?.case_number ??
                            row?.id ??
                            row?.doc_id ??
                            row?.uuid ??
                            Math.random()
                        )
                      }
                      isSorting={isSorting}
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
                        const extra = row?.extra?.[key];
                        if (extra !== undefined) return extra;
                        // 안전망: snake_case 폴백 (어댑터 누락 시)
                        const snake = String(key)
                          .replace(/([A-Z])/g, "_$1")
                          .toLowerCase();
                        return row?.[snake] ?? row?.extra?.[snake];
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
                      columnOrderStorageKey={"table:order:auction_ed"}
                      defaultColumnOrder={
                        Array.isArray(schemaColumns)
                          ? schemaColumns.map((c: any) => c.key)
                          : undefined
                      }
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
                  <AuctionEdMap
                    items={
                      useServerArea
                        ? (serverAreaMapState.items as any[])
                        : mapItems
                    }
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
                    {/* 지도 요약(통합 뷰): 표시 N / 총 T + 경고 배지 */}
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="inline-flex items-center rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700">
                        표시{" "}
                        {Math.min(
                          serverMapItems?.length || 0,
                          Number(maxMarkersCap)
                        ).toLocaleString()}{" "}
                        / 총 {(effectiveTotal || 0).toLocaleString()}
                      </span>
                      {nearestWarning && (
                        <span className="inline-flex items-center rounded border border-yellow-200 bg-yellow-50 px-2 py-1 text-[11px] text-yellow-800">
                          ⚠️ {nearestWarning}
                        </span>
                      )}
                    </div>
                    <div className="h-[calc(100vh-360px)]">
                      <AuctionEdMap
                        items={
                          useServerArea
                            ? (serverAreaMapState.items as any[])
                            : mapItems
                        }
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
                        items={
                          useServerArea
                            ? (serverAreaState.items as any)
                            : (pagedItems as any)
                        }
                        isLoading={false}
                        error={undefined}
                        rowKeyProp={(row: any) =>
                          String(
                            row?.case_number ??
                              row?.id ??
                              row?.doc_id ??
                              row?.uuid ??
                              Math.random()
                          )
                        }
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
                              ...mapItems, // 지도에 표시되는 집합(상한 적용)
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
