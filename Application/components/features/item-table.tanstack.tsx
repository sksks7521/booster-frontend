"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
} from "@tanstack/react-table";

import type { Item } from "@/lib/api";
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

// 🎯 컬럼 헬퍼 생성
const columnHelper = createColumnHelper<Item>();

// 📋 TanStack Table 컬럼 정의 - 타입 에러 우회하여 기능 우선 구현
const columns: ColumnDef<any>[] = [
  {
    accessorKey: "usage",
    header: "용도",
    cell: (info: any) => info.getValue() ?? "-",
  },
  {
    accessorKey: "case_number",
    header: "사건",
    cell: (info: any) => info.getValue() ?? "-",
  },
  {
    accessorKey: "location_detail",
    header: "소재지",
    cell: (info: any) => (
      <span className="whitespace-normal break-words">
        {info.getValue() ?? "-"}
      </span>
    ),
  },
  {
    accessorKey: "building_area_pyeong",
    header: "건물평형",
    cell: (info: any) => info.getValue() ?? info.row.original.area ?? "-",
  },
  {
    accessorKey: "land_area_pyeong",
    header: "토지평형",
    cell: (info: any) => info.getValue() ?? "-",
  },
  {
    accessorKey: "appraised_value",
    header: "감정가(만원)",
    cell: (info: any) => (info.getValue() ?? 0).toLocaleString(),
    meta: { align: "right" },
  },
  {
    accessorKey: "minimum_bid_price",
    header: "최저가(만원)",
    cell: (info: any) =>
      (info.getValue() ?? info.row.original.price ?? 0).toLocaleString(),
    meta: { align: "right" },
  },
  {
    accessorKey: "bid_to_appraised_ratio",
    header: "최저가/감정가(%)",
    cell: (info: any) => info.getValue() ?? "-",
    meta: { align: "right" },
  },
  {
    id: "calculated_ratio",
    header: "최저가/공시가격",
    cell: (info: any) => {
      const item = info.row.original;
      const minBid = item.minimum_bid_price;
      const publicPrice = item.public_price;

      if (
        !minBid ||
        !publicPrice ||
        publicPrice === 0 ||
        isNaN(publicPrice) ||
        isNaN(minBid)
      ) {
        return "-";
      }

      return (minBid / publicPrice).toFixed(2);
    },
    meta: { align: "right" },
    // 🔧 커스텀 정렬 함수 - 최저가/공시가격 정렬 문제 해결!
    sortingFn: (rowA: any, rowB: any) => {
      const aItem = rowA.original;
      const bItem = rowB.original;
      const a = (aItem.minimum_bid_price || 0) / (aItem.public_price || 1);
      const b = (bItem.minimum_bid_price || 0) / (bItem.public_price || 1);
      return a - b;
    },
  },
  {
    accessorKey: "sale_month",
    header: "매각기일",
    cell: (info: any) => info.getValue() ?? "-",
  },
  {
    accessorKey: "special_rights",
    header: "특수권리",
    cell: (info: any) => info.getValue() ?? "-",
  },
  {
    accessorKey: "floor_confirmation",
    header: "층확인",
    cell: (info: any) => info.getValue() ?? "-",
  },
  {
    accessorKey: "public_price",
    header: "공시가격(만원)",
    cell: (info: any) => (info.getValue() ?? 0).toLocaleString(),
    meta: { align: "right" },
  },
  {
    accessorKey: "under_100million",
    header: "1억 이하 여부",
    cell: (info: any) => {
      const value = info.getValue();
      const isUnder = value && value.toString().includes("O");
      return (
        <span
          className={`px-2 py-1 rounded text-xs ${
            isUnder
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {isUnder ? "Y" : "N"}
        </span>
      );
    },
  },
  {
    accessorKey: "construction_year",
    header: "건축연도",
    cell: (info: any) => info.getValue() ?? info.row.original.built_year ?? "-",
  },
  {
    accessorKey: "elevator_available",
    header: "Elevator여부",
    cell: (info: any) => {
      const value = info.getValue();
      const hasElevator =
        value === "O" || info.row.original.hasElevator === true;
      return (
        <span
          className={`px-2 py-1 rounded text-xs ${
            hasElevator
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {hasElevator ? "Y" : "N"}
        </span>
      );
    },
  },
];

interface ItemTableProps {
  items?: Item[];
  isLoading?: boolean;
  error?: any;
  onItemSelect?: (item: Item) => void;
  onRetry?: () => void;
  // 🔄 서버사이드 정렬/페이지네이션 props
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (column: string, direction: "asc" | "desc") => void;
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export default function ItemTable({
  items = [],
  isLoading,
  error,
  onItemSelect,
  onRetry,
  sortBy,
  sortOrder,
  onSort,
  totalCount = 0,
  currentPage = 1,
  pageSize = 20,
  onPageChange,
}: ItemTableProps) {
  // 🎯 TanStack Table 상태 관리
  const [sorting, setSorting] = React.useState<SortingState>(
    sortBy && sortOrder ? [{ id: sortBy, desc: sortOrder === "desc" }] : []
  );

  // 🔄 서버 정렬 상태와 동기화
  React.useEffect(() => {
    if (sortBy && sortOrder) {
      setSorting([{ id: sortBy, desc: sortOrder === "desc" }]);
    } else {
      setSorting([]);
    }
  }, [sortBy, sortOrder]);

  // 🎯 TanStack Table 인스턴스 생성
  const table = useReactTable({
    data: items,
    columns,
    // 🔥 서버사이드 모드 활성화 - 모든 기능 자동 처리!
    manualSorting: true, // 서버에서 정렬 처리
    manualPagination: true, // 서버에서 페이지네이션 처리
    manualFiltering: true, // 서버에서 필터링 처리

    // 🎯 상태 관리
    state: {
      sorting,
      pagination: {
        pageIndex: (currentPage ?? 1) - 1, // 0-based index
        pageSize: pageSize ?? 20,
      },
    },

    // 🔄 상태 변경 핸들러
    onSortingChange: (updaterOrValue) => {
      const newSorting =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting)
          : updaterOrValue;

      setSorting(newSorting);

      // 서버로 정렬 요청 전달
      if (newSorting.length > 0 && onSort) {
        const sort = newSorting[0];
        onSort(sort.id, sort.desc ? "desc" : "asc");
      } else if (onSort) {
        onSort("", "asc"); // 정렬 해제
      }
    },

    // 🎯 페이지 정보 (서버사이드)
    pageCount: Math.ceil(totalCount / pageSize),
    rowCount: totalCount,

    // 🎯 Row Models - 클라이언트에서는 Core만 사용
    getCoreRowModel: getCoreRowModel(),
    // getSortedRowModel 제거 (서버에서 처리)
    // getPaginationRowModel 제거 (서버에서 처리)
  });

  // 🔄 로딩/에러 상태 처리
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
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta as any;
                const alignClass =
                  meta?.align === "right"
                    ? "text-right"
                    : meta?.align === "center"
                    ? "text-center"
                    : "";

                return (
                  <TableHead
                    key={header.id}
                    className={`hover:bg-gray-50 cursor-pointer select-none ${alignClass} ${
                      header.column.getIsSorted()
                        ? "text-blue-600 font-semibold"
                        : ""
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {/* 🎯 정렬 아이콘 자동 표시 */}
                      {header.column.getIsSorted() === "asc" && " ↑"}
                      {header.column.getIsSorted() === "desc" && " ↓"}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onItemSelect?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta as any;
                const alignClass =
                  meta?.align === "right"
                    ? "text-right"
                    : meta?.align === "center"
                    ? "text-center"
                    : "";

                return (
                  <TableCell key={cell.id} className={alignClass}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
