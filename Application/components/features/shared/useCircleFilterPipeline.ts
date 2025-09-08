"use client";

import { useMemo } from "react";
import { useFilterStore } from "@/store/filterStore";
import { isWithinRadius } from "@/lib/geo/distance";
import { pickLatLng, LatLng } from "@/lib/geo/coords";

export interface CirclePipelineParams {
  // 데이터셋 네임스페이스 (예: "auction_ed", "sale", "rent", "listings")
  ns: string;
  // 현재 뷰(table/map/both)
  activeView: "table" | "map" | "both";
  // 페이지네이션
  page: number;
  size: number;
  // 표준 아이템 소스(페이지 사이즈로 받는 기본 소스)
  items: any[];
  // 전역 대용량 소스(선택: 없으면 items 사용)
  globalSource?: any[];
  // 지도 표시 상한(선택, 기본 500)
  maxMarkersCap?: number;
  // 좌표 추출 커스터마이즈(선택)
  getRowLatLng?: (row: any) => LatLng | null;
  // 정렬 타임스탬프(밀리초) 계산 함수(선택). 제공되면 반경 필터 ON 시 정렬에 사용
  getRowSortTs?: (row: any) => number;
}

export interface CirclePipelineResult {
  // 반경 필터 ON 여부
  applyCircle: boolean;
  // 반경 필터 적용 후 전역 정렬된 전체 집합
  processedItemsSorted: any[];
  // 목록(페이지 사이즈로 slice)
  pagedItems: any[];
  // 지도(표시 상한 적용)
  mapItems: any[];
  // 헤더 N(원 안 전체 개수)
  circleCount: number;
}

export function useCircleFilterPipeline(
  params: CirclePipelineParams
): CirclePipelineResult {
  const {
    ns,
    activeView,
    page,
    size,
    items,
    globalSource,
    maxMarkersCap = 500,
    getRowLatLng,
    getRowSortTs,
  } = params;

  const allFilters: any = useFilterStore();
  const nsOverrides = (allFilters?.ns as any)?.[ns] as any;

  const applyCircle = Boolean(nsOverrides?.applyCircleFilter);
  const centerCandidate =
    nsOverrides?.circleCenter || nsOverrides?.refMarkerCenter;
  const centerValid =
    centerCandidate &&
    Number.isFinite(centerCandidate.lat) &&
    Number.isFinite(centerCandidate.lng) &&
    !(Number(centerCandidate.lat) === 0 && Number(centerCandidate.lng) === 0);
  const centerForFilter = centerValid
    ? { lat: Number(centerCandidate.lat), lng: Number(centerCandidate.lng) }
    : null;
  const radiusMForFilter = (() => {
    const r = Number(nsOverrides?.circleRadiusM ?? 0);
    return Number.isFinite(r) && r > 0 ? r : 1000;
  })();

  const wantAllForMap = activeView !== "table" || applyCircle;
  const globalSourceBase =
    wantAllForMap && Array.isArray(globalSource) && globalSource.length > 0
      ? globalSource
      : items;

  const pick = getRowLatLng || pickLatLng;

  const processedItemsSorted = useMemo(() => {
    // 상세필터 결과의 전역 원천(globalSourceBase)을 기준으로 반경 필터 적용
    const baseForFilter = globalSourceBase;
    let filtered = baseForFilter;
    if (applyCircle && centerForFilter) {
      filtered = (baseForFilter || []).filter((row: any) => {
        const p = pick(row);
        return p ? isWithinRadius(centerForFilter, p, radiusMForFilter) : false;
      });
    }
    if (applyCircle && centerForFilter && typeof getRowSortTs === "function") {
      const list = [...filtered];
      list.sort(
        (a: any, b: any) => (getRowSortTs(b) || 0) - (getRowSortTs(a) || 0)
      );
      return list;
    }
    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(globalSourceBase?.[0]),
    Array.isArray(globalSourceBase) ? globalSourceBase.length : 0,
    JSON.stringify(items?.[0]),
    Array.isArray(items) ? items.length : 0,
    applyCircle,
    centerForFilter?.lat,
    centerForFilter?.lng,
    radiusMForFilter,
    getRowSortTs,
  ]);

  const circleCount =
    applyCircle && Array.isArray(processedItemsSorted)
      ? processedItemsSorted.length
      : 0;

  const start = Math.max(0, (page - 1) * size);
  const end = start + size;
  // 목록 베이스: ON=processedItemsSorted, OFF=items(페이지 크기 유지)
  const pagedItems =
    applyCircle && centerForFilter
      ? processedItemsSorted.slice(start, end)
      : items;

  const mapItems = useMemo(() => {
    // 지도 베이스: ON=processedItemsSorted, OFF=globalSourceBase(페이지 크기 영향 제거)
    const base =
      applyCircle && centerForFilter ? processedItemsSorted : globalSourceBase;
    const list = Array.isArray(base)
      ? base.slice(0, Math.max(0, maxMarkersCap))
      : [];
    return list;
  }, [
    applyCircle,
    centerForFilter,
    processedItemsSorted,
    globalSourceBase,
    maxMarkersCap,
  ]);

  return {
    applyCircle,
    processedItemsSorted,
    pagedItems,
    mapItems,
    circleCount,
  };
}
