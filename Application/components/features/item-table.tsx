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
// 🎯 드래그앤드롭 라이브러리
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type SortDirection = "asc" | "desc" | null;
type SortColumn = string | null;

// 🏷️ 컬럼 정의 타입
interface ColumnDef {
  id: string;
  label: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

// 📋 테이블 컬럼 정의 (기본 순서)
const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: "usage", label: "용도", sortable: true },
  { id: "case_number", label: "사건", sortable: true },
  { id: "road_address", label: "도로명주소", sortable: true },
  { id: "building_area_pyeong", label: "건물평형", sortable: true },
  { id: "land_area_pyeong", label: "토지평형", sortable: true },
  {
    id: "appraised_value",
    label: "감정가(만원)",
    align: "right",
    sortable: true,
  },
  {
    id: "minimum_bid_price",
    label: "최저가(만원)",
    align: "right",
    sortable: true,
  },
  {
    id: "bid_to_appraised_ratio",
    label: "최저가/감정가(%)",
    align: "right",
    sortable: true,
  },
  {
    id: "calculated_ratio",
    label: "최저가/공시가격",
    align: "right",
    sortable: true,
  },
  { id: "sale_month", label: "매각기일", sortable: true },
  { id: "special_rights", label: "특수권리", sortable: true },
  { id: "floor_confirmation", label: "층확인", sortable: true },
  {
    id: "public_price",
    label: "공시가격(만원)",
    align: "right",
    sortable: true,
  },
  { id: "under_100million", label: "1억 이하 여부", sortable: true },
  { id: "construction_year", label: "건축연도", sortable: true },
  { id: "elevator_available", label: "Elevator여부", sortable: true },
];

// 🎯 드래그 가능한 테이블 헤더 컴포넌트
function SortableTableHead({
  column,
  sortBy,
  sortOrder,
  onSort,
  getSortIcon,
}: {
  column: ColumnDef;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (column: string) => void;
  getSortIcon: (column: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 🎯 컬럼명 클릭 → 정렬
  const handleSortClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 드래그 이벤트 방지
    if (!column.sortable || !onSort) return;
    onSort(column.id);
  };

  const alignClass =
    column.align === "right"
      ? "text-right"
      : column.align === "center"
      ? "text-center"
      : "";

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={`hover:bg-gray-50 select-none ${alignClass} ${
        isDragging ? "opacity-50 bg-blue-50" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        {/* 🎯 드래그 핸들 - 드래그만 가능 */}
        <span
          className="drag-handle cursor-move text-gray-400 hover:text-gray-600 px-1"
          {...attributes}
          {...listeners}
          title="드래그하여 컬럼 순서 변경"
        >
          ⋮⋮
        </span>

        {/* 🎯 컬럼명 - 클릭으로 정렬만 가능 */}
        <span
          className={`flex-1 cursor-pointer hover:text-blue-600 ${
            sortBy === column.id ? "text-blue-600 font-semibold" : ""
          }`}
          onClick={column.sortable ? handleSortClick : undefined}
          title={column.sortable ? "클릭하여 정렬" : ""}
        >
          {column.label}
          {column.sortable && getSortIcon(column.id)}
        </span>
      </div>
    </TableHead>
  );
}

interface ItemTableProps {
  items?: Item[];
  isLoading?: boolean;
  error?: any;
  onItemSelect?: (item: Item) => void;
  onRetry?: () => void;
  // 🔄 서버 사이드 정렬 props
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (column: string, direction: "asc" | "desc") => void;
}

function ItemTable({
  items = [],
  isLoading,
  error,
  onItemSelect,
  onRetry,
  sortBy,
  sortOrder,
  onSort,
}: ItemTableProps) {
  // 🔄 서버 사이드 정렬 - 로컬 정렬 상태 제거 (props에서 관리)

  // 🎯 드래그앤드롭을 위한 컬럼 순서 상태
  const [columnOrder, setColumnOrder] = React.useState<string[]>(
    DEFAULT_COLUMNS.map((col) => col.id)
  );

  // 🎯 드래그 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 최저가/공시가격 비율 계산 함수 (소수점 2자리, NaN 처리)
  const calculateBidToPublicRatio = (item: any) => {
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
  };

  // 🎯 드래그 끝났을 때 컬럼 순서 변경
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        console.log("🎯 [DragDrop] 컬럼 순서 변경:", newOrder);
        return newOrder;
      });
    }
  };

  // 🔄 서버 사이드 정렬 핸들러
  const handleSort = (column: string) => {
    if (!onSort) return; // 정렬 핸들러가 없으면 아무것도 하지 않음

    let newDirection: "asc" | "desc";
    if (sortBy === column) {
      // 같은 컬럼: asc → desc → 기본(정렬없음)
      if (sortOrder === "asc") {
        newDirection = "desc";
      } else if (sortOrder === "desc") {
        // 정렬 제거
        onSort("", "asc"); // 빈 문자열로 정렬 제거
        return;
      } else {
        newDirection = "asc";
      }
    } else {
      // 다른 컬럼: 오름차순으로 시작
      newDirection = "asc";
    }

    onSort(column, newDirection);
  };

  // 📋 순서대로 정렬된 컬럼들
  const orderedColumns = React.useMemo(() => {
    return columnOrder
      .map((colId) => DEFAULT_COLUMNS.find((col) => col.id === colId)!)
      .filter(Boolean);
  }, [columnOrder]);

  // 🎨 각 컬럼의 셀 렌더링 함수
  const renderCell = (column: ColumnDef, item: any) => {
    const alignClass =
      column.align === "right"
        ? "text-right"
        : column.align === "center"
        ? "text-center"
        : "";

    switch (column.id) {
      case "usage":
        return (
          <TableCell className={alignClass}>{item.usage ?? "-"}</TableCell>
        );

      case "case_number":
        return (
          <TableCell className={alignClass}>
            {item.case_number ?? "-"}
          </TableCell>
        );

      case "road_address":
        return (
          <TableCell className={alignClass}>
            <a
              href="#"
              onClick={(e: any) => e.preventDefault()}
              className="hover:underline"
            >
              {item.road_address ?? item.address ?? "-"}
            </a>
          </TableCell>
        );

      case "building_area_pyeong":
        return (
          <TableCell className={alignClass}>
            {item.building_area_pyeong ?? item.area ?? "-"}
          </TableCell>
        );

      case "land_area_pyeong":
        return (
          <TableCell className={alignClass}>
            {item.land_area_pyeong ?? "-"}
          </TableCell>
        );

      case "appraised_value":
        return (
          <TableCell className={alignClass}>
            {(item.appraised_value ?? 0).toLocaleString()}
          </TableCell>
        );

      case "minimum_bid_price":
        return (
          <TableCell className={alignClass}>
            {(item.minimum_bid_price ?? item.price ?? 0).toLocaleString()}
          </TableCell>
        );

      case "bid_to_appraised_ratio":
        return (
          <TableCell className={alignClass}>
            {item.bid_to_appraised_ratio ?? "-"}
          </TableCell>
        );

      case "calculated_ratio":
        return (
          <TableCell className={alignClass}>
            {calculateBidToPublicRatio(item)}
          </TableCell>
        );

      case "sale_month":
        return (
          <TableCell className={alignClass}>{item.sale_month ?? "-"}</TableCell>
        );

      case "special_rights":
        return (
          <TableCell className={alignClass}>
            {item.special_rights ?? "-"}
          </TableCell>
        );

      case "floor_confirmation":
        return (
          <TableCell className={alignClass}>
            {item.floor_confirmation ?? "-"}
          </TableCell>
        );

      case "public_price":
        return (
          <TableCell className={alignClass}>
            {(item.public_price ?? 0).toLocaleString()}
          </TableCell>
        );

      case "under_100million":
        return (
          <TableCell className={alignClass}>
            <span
              className={`px-2 py-1 rounded text-xs ${
                item.under_100million &&
                item.under_100million.toString().includes("O")
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {item.under_100million &&
              item.under_100million.toString().includes("O")
                ? "Y"
                : "N"}
            </span>
          </TableCell>
        );

      case "construction_year":
        return (
          <TableCell className={alignClass}>
            {item.construction_year ?? item.buildYear ?? "-"}
          </TableCell>
        );

      case "elevator_available":
        return (
          <TableCell className={alignClass}>
            <span
              className={`px-2 py-1 rounded text-xs ${
                item.elevator_available === "O" || item.hasElevator === true
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {item.elevator_available === "O" || item.hasElevator === true
                ? "Y"
                : "N"}
            </span>
          </TableCell>
        );

      default:
        return <TableCell className={alignClass}>-</TableCell>;
    }
  };

  // 정렬 아이콘 반환
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return "";
    if (sortOrder === "asc") return " ↑";
    if (sortOrder === "desc") return " ↓";
    return "";
  };

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <SortableContext
                items={columnOrder}
                strategy={horizontalListSortingStrategy}
              >
                {orderedColumns.map((column) => (
                  <SortableTableHead
                    key={column.id}
                    column={column}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                  />
                ))}
              </SortableContext>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={item.id}
                className="cursor-pointer"
                onClick={() => onItemSelect?.(item)}
              >
                {orderedColumns.map((column) => renderCell(column, item))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DndContext>
    </div>
  );
}
export default ItemTable;
