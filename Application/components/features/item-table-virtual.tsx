"use client";

import React from "react";

type SortOrder = "asc" | "desc" | undefined;

interface ItemTableVirtualProps {
  items?: any[];
  isLoading?: boolean;
  error?: any;
  onRetry?: () => void;
  // 정렬(서버사이드) - analysis에서 그대로 전달
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (column?: string, direction?: "asc" | "desc") => void;
  // 선택 제어
  selectedRowKeys?: React.Key[];
  onSelectionChange?: (keys: React.Key[]) => void;
  // 선택 시 콜백(상세 열기 등)
  onItemSelect?: (item: any) => void;
  // 가상 스크롤 설정
  containerHeight?: number; // px
  rowHeight?: number; // px
  overscan?: number; // 추가 렌더 행 수
}

const HEADER_COLS: {
  key: string;
  label: string;
  width: number;
  align?: "left" | "right";
}[] = [
  { key: "case_number", label: "사건", width: 160 },
  { key: "location_detail", label: "소재지", width: 360 },
  {
    key: "minimum_bid_price",
    label: "최저가(만원)",
    width: 160,
    align: "right",
  },
  { key: "sale_date", label: "매각기일", width: 160 },
  { key: "current_status", label: "현재상태", width: 120 },
];

const ROW_HEIGHT = 44;
const CONTAINER_HEIGHT = 480; // 약 10~12행 가시 영역
const OVERSCAN = 8;

interface RowProps {
  row: any;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  columnsCss: string;
}

const VirtualRow: React.FC<RowProps> = React.memo(
  ({ row, selected, onMouseDown, onDoubleClick, columnsCss }) => {
    return (
      <div
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        style={{
          display: "grid",
          gridTemplateColumns: columnsCss,
          columnGap: 12,
          height: ROW_HEIGHT,
          alignItems: "center",
          padding: "0 12px",
          borderBottom: "1px solid #f3f4f6",
          background: selected ? "#eff6ff" : undefined,
          cursor: "pointer",
        }}
      >
        {HEADER_COLS.map((col) => {
          const v = (row as any)?.[col.key];
          const text = typeof v === "number" ? v.toLocaleString() : v ?? "-";
          return (
            <div key={col.key} style={{ textAlign: col.align || "left" }}>
              {text}
            </div>
          );
        })}
      </div>
    );
  }
);
VirtualRow.displayName = "VirtualRow";

function computeRowKey(row: any): React.Key {
  return (
    row?.id ??
    row?.doc_id ??
    row?.uuid ??
    row?.case_number ??
    `${row?.road_address || row?.location_detail || ""}|${
      row?.sale_date || ""
    }|${row?.minimum_bid_price || ""}`
  );
}

const ItemTableVirtual: React.FC<ItemTableVirtualProps> = ({
  items = [],
  isLoading,
  error,
  onRetry,
  sortBy,
  sortOrder,
  onSort,
  selectedRowKeys,
  onSelectionChange,
  onItemSelect,
  containerHeight,
  rowHeight,
  overscan,
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = React.useState(0);

  const RH = rowHeight ?? ROW_HEIGHT;
  const CH = containerHeight ?? CONTAINER_HEIGHT;
  const OV = overscan ?? OVERSCAN;

  const total = items.length;
  const totalHeight = total * RH;
  const visibleCount = Math.ceil(CH / RH) + OV;
  const startIndex = Math.max(0, Math.floor(scrollTop / RH) - OV);
  const endIndex = Math.min(total - 1, startIndex + visibleCount);
  const columnsCss = React.useMemo(
    () => HEADER_COLS.map((c) => `${c.width}px`).join(" "),
    []
  );

  const handleScroll: React.UIEventHandler<HTMLDivElement> = React.useCallback(
    (e) => {
      setScrollTop((e.currentTarget as HTMLDivElement).scrollTop);
    },
    []
  );

  const toggleSort = React.useCallback(
    (key: string) => {
      if (!onSort) return;
      if (sortBy !== key) {
        onSort(key, "asc");
      } else if (sortOrder === "asc") {
        onSort(key, "desc");
      } else {
        onSort(undefined, undefined);
      }
    },
    [onSort, sortBy, sortOrder]
  );

  const selectedKeySet = React.useMemo(
    () => new Set(selectedRowKeys || []),
    [selectedRowKeys]
  );
  const isSelected = React.useCallback(
    (key: React.Key) => selectedKeySet.has(key),
    [selectedKeySet]
  );

  const handleRowMouseDown = React.useCallback(
    (key: React.Key) => (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if (key === undefined) return;
      const already = isSelected(key);
      const next = new Set(selectedKeySet);
      if (already) next.delete(key);
      else next.add(key);
      onSelectionChange?.(Array.from(next));
    },
    [isSelected, selectedKeySet, onSelectionChange]
  );

  const handleRowDoubleClick = React.useCallback(
    (row: any) => () => onItemSelect?.(row),
    [onItemSelect]
  );

  const visibleItems = React.useMemo(
    () => items.slice(startIndex, endIndex + 1),
    [items, startIndex, endIndex]
  );

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: 24 }}>
        <div style={{ fontWeight: 600, color: "#dc2626", marginBottom: 8 }}>
          데이터를 불러오는 중 오류가 발생했습니다
        </div>
        <div style={{ color: "#6b7280" }}>
          네트워크 상태를 확인하고 다시 시도하세요.
        </div>
        {onRetry && (
          <div style={{ marginTop: 12 }}>
            <button onClick={onRetry} style={{ padding: "6px 12px" }}>
              다시 시도
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: columnsCss,
          columnGap: 12,
          padding: "10px 12px",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          background: "#fafafa",
          zIndex: 1,
        }}
      >
        {HEADER_COLS.map((col) => (
          <div
            key={col.key}
            onClick={() => toggleSort(col.key)}
            style={{
              cursor: "pointer",
              userSelect: "none",
              fontWeight: 600,
              color: sortBy === col.key ? "#2563eb" : undefined,
              textAlign: col.align || "left",
            }}
            title={col.label}
          >
            {col.label}
            {sortBy === col.key ? (sortOrder === "asc" ? " ▲" : " ▼") : ""}
          </div>
        ))}
      </div>

      {/* Body (virtualized) */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: CH,
          overflow: "auto",
          position: "relative",
        }}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: startIndex * RH,
              left: 0,
              right: 0,
            }}
          >
            {visibleItems.map((row) => {
              const key = computeRowKey(row);
              const selected = isSelected(key);
              const onMouseDown = handleRowMouseDown(key);
              const onDoubleClick = handleRowDoubleClick(row);
              return (
                <VirtualRow
                  key={key}
                  row={row}
                  selected={!!selected}
                  onMouseDown={onMouseDown}
                  onDoubleClick={onDoubleClick}
                  columnsCss={columnsCss}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
          표시할 데이터가 없습니다. 필터를 조정해보세요.
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
          로딩 중...
        </div>
      )}
    </div>
  );
};

export default ItemTableVirtual;
