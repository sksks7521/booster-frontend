"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Item } from "@/lib/api";
import { usePropertyDetail } from "./hooks/usePropertyDetail";
import SectionError from "./sections/SectionError";
import {
  formatCurrencyManwon,
  formatDateYmd,
  formatPercent1,
  calcDDay,
} from "./utils/formatters";
import PropertyDetailHeader from "./sections/Header";
import PriceDetailCard from "./sections/PriceDetailCard";
import AreaInfoCard from "./sections/AreaInfoCard";
import ScheduleStatusCard from "./sections/ScheduleStatusCard";
import PriceHighlight from "./sections/PriceHighlight";
import BasicInfoCard from "./sections/BasicInfoCard";
import FooterActions from "./sections/FooterActions";
import { HighlightSkeleton, CardSkeleton } from "./sections/Skeletons";
import PriceCompareBar from "./sections/PriceCompareBar";
import KeyBadges from "./sections/KeyBadges";
import RiskSummaryCard from "./sections/RiskSummaryCard";
import HeaderActions from "./sections/HeaderActions";
import BuildingInfoCard from "./sections/BuildingInfoCard";
import FacilityInfoCard from "./sections/FacilityInfoCard";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rowItem: Item | null;
}

export default function PropertyDetailDialog({
  open,
  onOpenChange,
  rowItem,
}: Props) {
  const detailId = (rowItem as any)?.id as number | undefined;
  const { vm, isLoading, isError, reload } = usePropertyDetail(detailId);

  const fallbackCoords = {
    lat: (rowItem as any)?.lat as number | undefined,
    lng: (rowItem as any)?.lng as number | undefined,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-[1300px] h-[80vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle>매물 상세</DialogTitle>
            <HeaderActions />
          </div>
        </DialogHeader>

        {/* 헤더 + 핵심 배지 */}
        <PropertyDetailHeader
          vm={vm ?? undefined}
          rowItem={rowItem ?? undefined}
        />
        <div className="mb-3">
          <KeyBadges vm={vm ?? undefined} />
        </div>

        {/* KPI 스트립 */}
        {isLoading ? (
          <HighlightSkeleton />
        ) : (
          <PriceHighlight vm={vm ?? undefined} />
        )}

        {/* 로딩/에러 */}
        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}
        {isError && <SectionError onRetry={reload} />}

        {/* 본문: Risk → Price/Area → Building/Facility → Basic */}
        {!isLoading && !isError && (
          <>
            <div className="grid gap-6 sm:grid-cols-2">
              {/* 리스크 요약 */}
              <RiskSummaryCard vm={vm ?? undefined} />

              {/* 가격/면적 */}
              <PriceDetailCard vm={vm ?? undefined} />
              <AreaInfoCard vm={vm ?? undefined} />
              <PriceCompareBar vm={vm ?? undefined} />
              <ScheduleStatusCard vm={vm ?? undefined} />

              {/* 건물/시설 */}
              <BuildingInfoCard vm={vm ?? undefined} />
              <FacilityInfoCard vm={vm ?? undefined} />

              {/* 기본 정보 */}
              <BasicInfoCard vm={vm ?? undefined} />
            </div>

            {/* 푸터 */}
            <FooterActions
              vm={vm ?? undefined}
              coords={fallbackCoords}
              onClose={() => onOpenChange(false)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
