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
}: AuctionEdMapProps) {
  const nsState = useFilterStore((s: any) => (s as any).ns) as any;
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
      markerColorFn={markerColorFn}
      namespace="auction_ed"
      legendTitle="매각가 범례(단위: 만원)"
      legendUnitLabel="만원"
      legendHint="네모박스 숫자 예) 40 = 매각가/감정가 40~49%"
      legendThresholds={thresholds}
      legendEditable={true}
    />
  );
}
