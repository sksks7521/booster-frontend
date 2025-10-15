"use client";
import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Item } from "@/lib/api";
import { usePropertyDetail } from "./hooks/usePropertyDetail";
import SectionError from "./sections/SectionError";
import HeaderActions from "./sections/HeaderActions";
import PropertyDetailSimple from "./PropertyDetailSimple";
import DetailDebugPanel from "./sections/DetailDebugPanel";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rowItem: Item | null;
  hideReportButton?: boolean;
  hideOpenMapButton?: boolean;
}

export default function PropertyDetailDialog({
  open,
  onOpenChange,
  rowItem,
  hideReportButton,
  hideOpenMapButton,
}: Props) {
  const detailId = (rowItem as any)?.id as number | undefined;
  const { vm, isLoading, isError, reload, raw } = usePropertyDetail(detailId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-[1080px] h-[92vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle>매물 상세</DialogTitle>
            <div className="flex items-center gap-2">
              <HeaderActions itemId={detailId} />
            </div>
          </div>
        </DialogHeader>
        {/* 구형 UI 제거: 헤더/KPI 스트립 생략, 새 UI만 사용 */}

        {/* 로딩/에러 */}
        {isLoading && <div className="p-6 text-sm text-gray-500">로딩 중…</div>}
        {isError && <SectionError onRetry={reload} />}

        {/* 본문 */}
        {!isLoading && !isError && (
          <>
            <PropertyDetailSimple
              vm={vm ?? undefined}
              hideReportButton={hideReportButton}
              hideOpenMapButton={hideOpenMapButton ?? true}
            />
            <DetailDebugPanel raw={raw ?? rowItem} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
