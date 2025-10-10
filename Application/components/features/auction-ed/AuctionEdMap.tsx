"use client";
import React, { useMemo } from "react";
import MapView from "@/components/features/map-view";
import { useFilterStore } from "@/store/filterStore";
import { PALETTE } from "@/lib/map/config";

interface AuctionEdMapProps {
  enabled?: boolean;
  items?: any[];
  isLoading?: boolean;
  error?: any;
  onRetry?: () => void;
  onBoundsChange?: (b: {
    south: number;
    west: number;
    north: number;
    east: number;
  }) => void;
  locationKey?: string;
  highlightIds?: string[];
  // 원/반경 컨트롤 연동 (옵션: 미지정 시 ns.auction_ed 값 사용)
  circleControlsEnabled?: boolean;
  circleEnabled?: boolean;
  circleCenter?: { lat: number; lng: number } | null;
  circleRadiusM?: number;
  applyCircleFilter?: boolean;
  onCircleToggle?: () => void;
  onCircleChange?: (next: {
    center: { lat: number; lng: number } | null;
    radiusM: number;
  }) => void;
  onToggleApplyCircleFilter?: () => void;
  // 분석물건 마커
  refMarkerEnabled?: boolean;
  refMarkerLocked?: boolean;
  refMarkerCenter?: { lat: number; lng: number } | null;
  onRefMarkerToggleLock?: () => void;
  onRefMarkerMove?: (nextCenter: { lat: number; lng: number }) => void;
  onMoveToRefMarker?: () => void;
}

export default function AuctionEdMap({
  enabled = true,
  items = [],
  isLoading,
  error,
  onRetry,
  onBoundsChange,
  locationKey,
  highlightIds,
  circleControlsEnabled,
  circleEnabled,
  circleCenter,
  circleRadiusM,
  applyCircleFilter,
  onCircleToggle,
  onCircleChange,
  onToggleApplyCircleFilter,
  refMarkerEnabled,
  refMarkerLocked,
  refMarkerCenter,
  onRefMarkerToggleLock,
  onRefMarkerMove,
  onMoveToRefMarker,
}: AuctionEdMapProps) {
  const nsState = useFilterStore((s: any) => (s as any).ns) as any;
  const setNsFilter = useFilterStore((s: any) => (s as any).setNsFilter) as
    | (undefined | ((ns: string, key: any, value: any) => void))
    | any;
  const palette =
    (nsState?.auction_ed?.palette as Partial<typeof PALETTE> | undefined) ||
    ((useFilterStore as any)?.getState?.()?.palette as
      | Partial<typeof PALETTE>
      | undefined) ||
    PALETTE;
  const thresholds = useMemo(() => {
    const t =
      (nsState?.auction_ed?.thresholds as number[] | undefined) ||
      ((useFilterStore as any)?.getState?.()?.thresholds as
        | number[]
        | undefined);
    return Array.isArray(t) && t.length > 0
      ? [...t].sort((a, b) => a - b)
      : [6000, 8000, 10000, 15000];
  }, [nsState]);

  const markerColorFn = useMemo(() => {
    const colors = [
      palette.blue ?? PALETTE.blue,
      palette.green ?? PALETTE.green,
      palette.pink ?? PALETTE.pink,
      palette.orange ?? PALETTE.orange,
      palette.red ?? PALETTE.red,
    ];
    const sorted = [...thresholds];
    return (row: any): string => {
      // 비율 결측 시 검정색 마커
      const ratioRaw =
        row?.percentage ??
        row?.sale_to_appraised_ratio ??
        row?.extra?.saleToAppraisedRatio;
      const ratioNum =
        typeof ratioRaw === "string" ? parseFloat(ratioRaw) : ratioRaw;
      if (
        ratioRaw === undefined ||
        ratioRaw === null ||
        ratioRaw === "" ||
        !Number.isFinite(ratioNum as number)
      ) {
        return "#111827"; // black (gray-900)
      }
      const raw =
        row?.price ?? row?.final_sale_price ?? row?.extra?.finalSalePrice;
      const v = typeof raw === "string" ? parseFloat(raw) : (raw as number);
      const price = Number.isFinite(v) ? (v as number) : 0;
      for (let i = 0; i < sorted.length; i++) {
        if (price <= sorted[i]) return colors[i] ?? colors[colors.length - 1];
      }
      return colors[Math.min(sorted.length, colors.length - 1)];
    };
  }, [palette, thresholds]);

  // 🆕 마커 숫자(10% 버킷) 계산을 위해 MapView가 참조하는 percentage 필드를 주입
  const itemsWithPercentage = useMemo(() => {
    return (items || []).map((row: any) => {
      const ratioRaw =
        row?.sale_to_appraised_ratio ?? row?.extra?.saleToAppraisedRatio;
      return {
        ...row,
        percentage: ratioRaw,
      };
    });
  }, [items]);

  return (
    <MapView
      enabled={enabled}
      items={itemsWithPercentage}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      onBoundsChange={onBoundsChange}
      locationKey={locationKey}
      highlightIds={highlightIds}
      // 🆕 클러스터 토글: 기본 ON, UI 노출
      clusterToggleEnabled={true}
      useClustering={true}
      markerColorFn={markerColorFn}
      namespace="auction_ed"
      legendTitle="매각가 범례(단위: 만원)"
      legendUnitLabel="만원"
      legendHint="네모박스 숫자 예) 40 = 매각가/감정가 40~49%"
      legendThresholds={thresholds}
      legendEditable={true}
      // 원/반경 컨트롤
      circleControlsEnabled={
        typeof circleControlsEnabled === "boolean"
          ? circleControlsEnabled
          : true
      }
      circleEnabled={
        typeof circleEnabled === "boolean"
          ? circleEnabled
          : Boolean(nsState?.auction_ed?.circleEnabled)
      }
      circleCenter={
        circleCenter !== undefined
          ? circleCenter
          : (nsState?.auction_ed?.circleCenter as any) ?? null
      }
      circleRadiusM={
        typeof circleRadiusM === "number"
          ? circleRadiusM
          : (nsState?.auction_ed?.circleRadiusM as any) ?? 1000
      }
      applyCircleFilter={
        typeof applyCircleFilter === "boolean"
          ? applyCircleFilter
          : Boolean(nsState?.auction_ed?.applyCircleFilter)
      }
      onCircleToggle={
        onCircleToggle ||
        (() =>
          typeof setNsFilter === "function" &&
          (function () {
            const next = !Boolean(nsState?.auction_ed?.circleEnabled);
            setNsFilter("auction_ed", "circleEnabled" as any, next);
            // 원을 켤 때 중심이 비어 있으면 분석물건 마커 위치로 설정
            if (
              next &&
              !(
                nsState?.auction_ed?.circleCenter &&
                Number.isFinite(
                  (nsState?.auction_ed?.circleCenter as any).lat
                ) &&
                Number.isFinite((nsState?.auction_ed?.circleCenter as any).lng)
              )
            ) {
              const ref = nsState?.auction_ed?.refMarkerCenter as any;
              if (
                ref &&
                Number.isFinite(ref.lat) &&
                Number.isFinite(ref.lng) &&
                !(Number(ref.lat) === 0 && Number(ref.lng) === 0)
              ) {
                setNsFilter("auction_ed", "circleCenter" as any, ref);
              }
            }
          })())
      }
      onCircleChange={
        onCircleChange ||
        ((next) => {
          if (typeof setNsFilter !== "function") return;
          // 중심이 비어 있으면 분석물건 마커를 폴백으로 사용
          const ref = (nsState?.auction_ed?.refMarkerCenter as any) || null;
          const useCenter =
            next?.center &&
            Number.isFinite((next.center as any).lat) &&
            Number.isFinite((next.center as any).lng)
              ? next.center
              : ref;
          setNsFilter("auction_ed", "circleCenter" as any, useCenter ?? null);
          setNsFilter(
            "auction_ed",
            "circleRadiusM" as any,
            Math.max(0, Number(next?.radiusM ?? 0))
          );
        })
      }
      onToggleApplyCircleFilter={
        onToggleApplyCircleFilter ||
        (() =>
          typeof setNsFilter === "function" &&
          setNsFilter(
            "auction_ed",
            "applyCircleFilter" as any,
            !Boolean(nsState?.auction_ed?.applyCircleFilter)
          ))
      }
      // 분석물건 마커
      refMarkerEnabled={
        typeof refMarkerEnabled === "boolean" ? refMarkerEnabled : true
      }
      refMarkerLocked={
        typeof refMarkerLocked === "boolean"
          ? refMarkerLocked
          : Boolean(nsState?.auction_ed?.refMarkerLocked ?? true)
      }
      refMarkerCenter={
        refMarkerCenter !== undefined
          ? refMarkerCenter
          : (nsState?.auction_ed?.refMarkerCenter as any) ?? null
      }
      onRefMarkerToggleLock={
        onRefMarkerToggleLock ||
        (() =>
          typeof setNsFilter === "function" &&
          setNsFilter(
            "auction_ed",
            "refMarkerLocked" as any,
            !Boolean(nsState?.auction_ed?.refMarkerLocked ?? true)
          ))
      }
      onRefMarkerMove={
        onRefMarkerMove ||
        ((next) =>
          typeof setNsFilter === "function" &&
          setNsFilter("auction_ed", "refMarkerCenter" as any, next))
      }
      onMoveToRefMarker={onMoveToRefMarker}
    />
  );
}
