"use client";

import { Button } from "@/components/ui/button";
import { mapApiErrorToMessage } from "@/lib/errors";
import { AlertCircle, RefreshCw, Search } from "lucide-react";
import React from "react";

interface StateBaseProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export function LoadingState({
  title = "불러오는 중입니다...",
  description,
  className,
}: Omit<StateBaseProps, "onRetry" | "retryText">) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-8 ${
        className ?? ""
      }`}
    >
      <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
      <p className="mt-2 text-sm text-gray-700">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}

export function ErrorState({
  title = "데이터를 불러오는 중 오류가 발생했습니다.",
  description = "잠시 후 다시 시도해주세요.",
  onRetry,
  retryText = "다시 시도",
  className,
}: StateBaseProps & { error?: unknown }) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-8 ${
        className ?? ""
      }`}
    >
      <AlertCircle className="h-5 w-5 text-red-500" />
      <p className="mt-2 text-sm text-red-700">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-red-500/80">{description}</p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-1" />
          {retryText}
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "표시할 데이터가 없습니다.",
  description = "필터를 조정하거나 다른 조건으로 검색해보세요.",
  onRetry,
  retryText = "다시 불러오기",
  className,
}: StateBaseProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-8 ${
        className ?? ""
      }`}
    >
      <Search className="h-5 w-5 text-gray-400" />
      <p className="mt-2 text-sm text-gray-700">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      )}
      {onRetry && (
        <Button variant="ghost" size="sm" className="mt-3" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-1" />
          {retryText}
        </Button>
      )}
    </div>
  );
}
