"use client";
import * as React from "react";
import type { Item } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/data-state";

interface ItemTableProps {
  items?: Item[];
  isLoading?: boolean;
  error?: any;
  onItemSelect?: (item: Item) => void;
  onRetry?: () => void;
}

function ItemTable({
  items = [],
  isLoading,
  error,
  onItemSelect,
  onRetry,
}: ItemTableProps) {
  if (isLoading) {
    return <LoadingState title="목록을 불러오는 중입니다..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="목록을 불러오는 중 오류가 발생했습니다."
        description="네트워크 상태를 확인한 후 다시 시도해주세요."
        onRetry={onRetry}
      />
    );
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        title="표시할 데이터가 없습니다."
        description="필터를 조정하거나 조건을 변경해보세요."
        onRetry={onRetry}
      />
    );
  }
  return (
    <div className="rounded-md border">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead>주소</TableHead>
            <TableHead>유형</TableHead>
            <TableHead>건축연도</TableHead>
            <TableHead>면적(㎡)</TableHead>
            <TableHead className="text-right">가격(만원)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className="cursor-pointer"
              onClick={() => onItemSelect?.(item)}
            >
              <TableCell>
                <a
                  href="#"
                  onClick={(e: any) => e.preventDefault()}
                  className="hover:underline"
                >
                  {item.address}
                </a>
              </TableCell>
              <TableCell>
                {(item as any).property_type ??
                  (item as any).buildingType ??
                  "-"}
              </TableCell>
              <TableCell>
                {(item as any).built_year ?? (item as any).buildYear ?? "-"}
              </TableCell>
              <TableCell>{item.area}</TableCell>
              <TableCell className="text-right">
                {(item.price ?? 0).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
export default ItemTable;
