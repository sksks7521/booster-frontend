"use client";

import React from "react";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/ui/data-state";
import { mapApiErrorToMessage } from "@/lib/errors";
import * as Sentry from "@sentry/nextjs";

interface ViewStateProps {
  isLoading?: boolean;
  error?: any;
  total?: number;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function ViewState({
  isLoading,
  error,
  total,
  onRetry,
  children,
}: ViewStateProps) {
  if (isLoading) {
    return <LoadingState title="불러오는 중입니다..." />;
  }
  if (error) {
    let eventId: string | undefined;
    try {
      eventId = Sentry.captureException(error) as unknown as string;
    } catch {}
    return (
      <ErrorState
        title={mapApiErrorToMessage(error)}
        onRetry={onRetry}
        retryText="다시 시도"
        extra={
          eventId ? (
            <div className="text-xs text-gray-500">이슈 ID: {eventId}</div>
          ) : undefined
        }
      />
    );
  }
  if ((total ?? 0) === 0) {
    return <EmptyState title="표시할 데이터가 없습니다." />;
  }
  return <>{children}</>;
}
