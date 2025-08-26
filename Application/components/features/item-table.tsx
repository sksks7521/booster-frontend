"use client";

import React, { useEffect } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { itemApi } from "@/lib/api";
import { Table, Space, Tag, Typography, Tooltip } from "antd";
import {
  HomeOutlined,
  HolderOutlined,
  SortAscendingOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TableProps, ColumnType } from "antd/es/table";
import type { SortOrder } from "antd/es/table/interface";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Item } from "@/lib/api";
import PropertyDetailDialog from "@/components/features/property-detail/PropertyDetailDialog";

// const { Link } = Typography; // 링크 색상(파랑) 제거를 위해 사용 안 함

// 🔒 헤더 리사이즈 중에는 정렬 클릭을 억제하기 위한 타이머
let suppressSortUntil = 0;

// 🎯 드래그 가능한 헤더 컴포넌트
interface DraggableHeaderProps {
  id: string;
  children: React.ReactNode;
  width?: number;
  onResize?: (deltaX: number) => void;
}

const DraggableHeader: React.FC<DraggableHeaderProps> = ({
  id,
  children,
  width,
  onResize,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!onResize) return;
    e.stopPropagation();
    e.preventDefault();
    suppressSortUntil = Date.now() + 400; // 드래그 직후 헤더 정렬 방지
    let lastX = e.clientX;
    const onMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - lastX; // 증분 델타만 전달
      lastX = ev.clientX;
      onResize(deltaX);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      suppressSortUntil = Date.now() + 200; // 드래그 종료 직후 클릭 억제
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: "relative",
        display: "flex",
        alignItems: "center",
      }}
      {...attributes}
    >
      <Space>
        <HolderOutlined
          style={{ cursor: "grab", color: "#888" }}
          {...listeners}
        />
        <span>{children}</span>
      </Space>
      <div
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          height: "100%",
          width: 6,
          cursor: "col-resize",
          userSelect: "none",
        }}
        title="크기 조절"
      />
    </div>
  );
};

// 🎯 컬럼 정의 (ID와 함께) - TypeScript 안정적 구문으로 수정
interface ColumnWithId extends ColumnType<Item> {
  id: string;
}

// 🎯 기본 컬럼 순서 정의
const DEFAULT_COLUMN_ORDER = [
  "usage",
  "case_number",
  "road_address",
  "sale_date",
  "current_status",
  "building_area_pyeong",
  "land_area_pyeong",
  "appraised_value",
  "minimum_bid_price",
  "bid_to_appraised_ratio",
  "public_price",
  "calculated_ratio",
  "construction_year",
  "floor_confirmation",
  "under_100million",
  "elevator_available",
  "special_rights",
];

// 📋 Ant Design Table 컬럼 정의 - 모든 기능 완벽 지원!
const createColumns = (
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  onSort?: (column?: string, direction?: "asc" | "desc") => void,
  getWidth?: (id: string) => number | undefined,
  onResizeColumn?: (id: string, deltaX: number) => void,
  onAddressClick?: (item: Item) => void
): ColumnWithId[] => {
  // 🔄 3단계 순환 정렬 로직
  const getNextSortState = (column: string) => {
    if (sortBy !== column) {
      // 정렬 없음 → 오름차순
      onSort?.(column, "asc");
    } else if (sortOrder === "asc") {
      // 오름차순 → 내림차순
      onSort?.(column, "desc");
    } else {
      // 내림차순 → 정렬해제
      onSort?.(undefined, undefined);
    }
  };

  // 📊 정렬 아이콘 표시 헬퍼
  const getSortIcon = (column: string) => {
    if (sortBy === column) {
      return sortOrder === "asc" ? " ▲" : " ▼";
    }
    return "";
  };

  // 🎨 정렬된 컬럼 헤더 스타일
  const renderHeaderLabel = (column: string, label: string) => (
    <span
      style={{
        cursor: "pointer",
        userSelect: "none",
        color: sortBy === column ? "#2563eb" : undefined, // tailwind blue-600
        fontWeight: sortBy === column ? 600 : undefined,
      }}
    >
      {label}
      {getSortIcon(column)}
    </span>
  );

  const safeHeaderClick = (column: string) => {
    if (Date.now() < suppressSortUntil) return;
    getNextSortState(column);
  };

  return [
    {
      id: "usage",
      title: (
        <DraggableHeader
          id="usage"
          width={getWidth?.("usage")}
          onResize={(dx) => onResizeColumn?.("usage", dx)}
        >
          {renderHeaderLabel("usage", "용도")}
        </DraggableHeader>
      ),
      dataIndex: "usage",
      key: "usage",
      width: getWidth?.("usage") ?? 120,
      render: (text: string) => text || "-",
      onHeaderCell: () => ({
        onClick: () => safeHeaderClick("usage"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "current_status",
      title: (
        <DraggableHeader
          id="current_status"
          width={getWidth?.("current_status")}
          onResize={(dx) => onResizeColumn?.("current_status", dx)}
        >
          <span style={{ cursor: "pointer", userSelect: "none" }}>
            현재상태{getSortIcon("current_status")}
          </span>
        </DraggableHeader>
      ),
      dataIndex: "current_status",
      key: "current_status",
      width: getWidth?.("current_status") ?? 120,
      render: (text: string) => {
        if (!text) return "-";
        const lower = text.toLowerCase();
        let color: string = "default";
        if (lower.startsWith("유찰")) color = "orange";
        else if (lower.includes("신건")) color = "blue";
        else if (lower.includes("낙찰")) color = "green";
        else if (lower.includes("재진행")) color = "geekblue";
        else if (lower.includes("변경")) color = "gold";
        else if (lower.includes("재매각")) color = "purple";
        else if (lower.includes("취하")) color = "red";
        return <Tag color={color}>{text}</Tag>;
      },
      onHeaderCell: () => ({
        onClick: () => safeHeaderClick("current_status"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "case_number",
      title: (
        <DraggableHeader
          id="case_number"
          width={getWidth?.("case_number")}
          onResize={(dx) => onResizeColumn?.("case_number", dx)}
        >
          {renderHeaderLabel("case_number", "사건")}
        </DraggableHeader>
      ),
      dataIndex: "case_number",
      key: "case_number",
      width: getWidth?.("case_number") ?? 150,
      render: (text: string) => text || "-",
      onHeaderCell: () => ({
        onClick: () => safeHeaderClick("case_number"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "road_address",
      title: (
        <DraggableHeader
          id="road_address"
          width={getWidth?.("road_address")}
          onResize={(dx) => onResizeColumn?.("road_address", dx)}
        >
          {renderHeaderLabel("road_address", "도로명주소")}
        </DraggableHeader>
      ),
      dataIndex: "road_address",
      key: "road_address",
      width: getWidth?.("road_address") ?? Math.round(250 * 1.3),
      render: (text: string, record: Item) => {
        const display = text || (record as any).address || "-";
        const handleClick: React.MouseEventHandler<HTMLSpanElement> = (e) => {
          e.stopPropagation();
          e.preventDefault();
          onAddressClick?.(record);
        };
        // Phase 5: 주소 셀 호버 프리패치 (디바운스/디듀프)
        const prefetch = (() => {
          let timer: number | undefined;
          let lastRun = 0;
          const DEBOUNCE_MS = 200;
          const MIN_INTERVAL_MS = 1200; // 1.2s 내 중복 금지
          return () => {
            const now = Date.now();
            if (now - lastRun < MIN_INTERVAL_MS) return;
            if (timer) window.clearTimeout(timer);
            timer = window.setTimeout(async () => {
              try {
                const id = (record as any)?.id as number | undefined;
                if (!id) return;
                const key = ["/api/v1/items/", id, "detail"] as const;
                await globalMutate(key, itemApi.getItem(id), {
                  revalidate: false,
                });
                lastRun = Date.now();
              } catch {}
            }, DEBOUNCE_MS);
          };
        })();
        return (
          <span
            onClick={handleClick}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseEnter={() => prefetch()}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick(e as unknown as React.MouseEvent<HTMLSpanElement>);
              }
            }}
            style={{
              color: "#1d4ed8",
              textDecoration: "underline",
              cursor: "pointer",
            }}
            title={display}
          >
            {display}
          </span>
        );
      },
      onHeaderCell: () => ({
        onClick: () => safeHeaderClick("road_address"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "building_area_pyeong",
      title: (
        <DraggableHeader
          id="building_area_pyeong"
          width={getWidth?.("building_area_pyeong")}
          onResize={(dx) => onResizeColumn?.("building_area_pyeong", dx)}
        >
          {renderHeaderLabel("building_area_pyeong", "건물평형")}
        </DraggableHeader>
      ),
      dataIndex: "building_area_pyeong",
      key: "building_area_pyeong",
      width: getWidth?.("building_area_pyeong") ?? 120,
      align: "right",
      render: (text: number, record: Item) => text || record.area || "-",
      onHeaderCell: () => ({
        onClick: () => safeHeaderClick("building_area_pyeong"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "land_area_pyeong",
      title: (
        <DraggableHeader
          id="land_area_pyeong"
          width={getWidth?.("land_area_pyeong")}
          onResize={(dx) => onResizeColumn?.("land_area_pyeong", dx)}
        >
          {renderHeaderLabel("land_area_pyeong", "토지평형")}
        </DraggableHeader>
      ),
      dataIndex: "land_area_pyeong",
      key: "land_area_pyeong",
      width: getWidth?.("land_area_pyeong") ?? 120,
      align: "right",
      render: (text: number) => text || "-",
      onHeaderCell: () => ({
        onClick: () => safeHeaderClick("land_area_pyeong"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "appraised_value",
      title: (
        <DraggableHeader
          id="appraised_value"
          width={getWidth?.("appraised_value")}
          onResize={(dx) => onResizeColumn?.("appraised_value", dx)}
        >
          {renderHeaderLabel("appraised_value", "감정가(만원)")}
        </DraggableHeader>
      ),
      dataIndex: "appraised_value",
      key: "appraised_value",
      width: getWidth?.("appraised_value") ?? 140,
      align: "right",
      render: (value: number) => (value || 0).toLocaleString(),
      onHeaderCell: () => ({
        onClick: () => safeHeaderClick("appraised_value"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "minimum_bid_price",
      title: (
        <DraggableHeader
          id="minimum_bid_price"
          width={getWidth?.("minimum_bid_price")}
          onResize={(dx) => onResizeColumn?.("minimum_bid_price", dx)}
        >
          {renderHeaderLabel("minimum_bid_price", "최저가(만원)")}
        </DraggableHeader>
      ),
      dataIndex: "minimum_bid_price",
      key: "minimum_bid_price",
      width: getWidth?.("minimum_bid_price") ?? 140,
      align: "right",
      render: (value: number, record: Item) =>
        (value || record.price || 0).toLocaleString(),
      onHeaderCell: () => ({
        onClick: () => safeHeaderClick("minimum_bid_price"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "bid_to_appraised_ratio",
      title: (
        <DraggableHeader
          id="bid_to_appraised_ratio"
          width={getWidth?.("bid_to_appraised_ratio")}
          onResize={(dx) => onResizeColumn?.("bid_to_appraised_ratio", dx)}
        >
          {renderHeaderLabel("bid_to_appraised_ratio", "최저가/감정가(%)")}
        </DraggableHeader>
      ),
      dataIndex: "bid_to_appraised_ratio",
      key: "bid_to_appraised_ratio",
      width: getWidth?.("bid_to_appraised_ratio") ?? 160,
      align: "right",
      render: (text: string) => text || "-",
      onHeaderCell: () => ({
        onClick: () => safeHeaderClick("bid_to_appraised_ratio"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "calculated_ratio",
      title: (
        <DraggableHeader
          id="calculated_ratio"
          width={getWidth?.("calculated_ratio")}
          onResize={(dx) => onResizeColumn?.("calculated_ratio", dx)}
        >
          {renderHeaderLabel("calculated_ratio", "최저가/공시지가")}
        </DraggableHeader>
      ),
      key: "calculated_ratio",
      width: getWidth?.("calculated_ratio") ?? 150,
      align: "right",
      render: (_, record: Item) => {
        const minBid = record.minimum_bid_price;
        const publicPrice = record.public_price;

        if (
          !minBid ||
          !publicPrice ||
          publicPrice === 0 ||
          isNaN(publicPrice) ||
          isNaN(minBid)
        ) {
          return "-";
        }

        const ratio = (minBid / publicPrice).toFixed(2);
        const numRatio = parseFloat(ratio);

        return (
          <span
            style={{
              fontWeight: "bold",
            }}
          >
            {ratio}
          </span>
        );
      },
      onHeaderCell: () => ({
        onClick: () => safeHeaderClick("calculated_ratio"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "sale_date",
      title: (
        <DraggableHeader
          id="sale_date"
          width={getWidth?.("sale_date")}
          onResize={(dx) => onResizeColumn?.("sale_date", dx)}
        >
          {renderHeaderLabel("sale_date", "매각기일")}
        </DraggableHeader>
      ),
      dataIndex: "sale_date",
      key: "sale_date",
      width: getWidth?.("sale_date") ?? Math.round(150 * 1.2),
      render: (saleDate: string) => {
        if (!saleDate) return "-";

        try {
          // "2025-08-22" → "2025년 8월 22일" 변환
          const date = new Date(saleDate);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const day = date.getDate();

          // D-Day 계산
          const today = new Date();
          const diffTime = date.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          return (
            <span>
              {year}년 {month}월 {day}일
              {diffDays >= 0 &&
                diffDays <= 7 &&
                (() => {
                  const dayStr = String(diffDays).padStart(2, "0");
                  return (
                    <Tag
                      style={{
                        marginLeft: 6,
                        color: "#cf1322",
                        background: "#fff1f0",
                        borderColor: "#ffa39e",
                        fontSize: "12px",
                        lineHeight: "20px",
                        padding: "0 8px",
                      }}
                    >
                      D-{dayStr}
                    </Tag>
                  );
                })()}
            </span>
          );
        } catch (error) {
          return saleDate || "-";
        }
      },
      onHeaderCell: () => ({
        onClick: () => safeHeaderClick("sale_date"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "special_rights",
      title: (
        <DraggableHeader
          id="special_rights"
          width={getWidth?.("special_rights")}
          onResize={(dx) => onResizeColumn?.("special_rights", dx)}
        >
          {renderHeaderLabel("special_rights", "특수권리")}
        </DraggableHeader>
      ),
      dataIndex: "special_rights",
      key: "special_rights",
      width: getWidth?.("special_rights") ?? Math.round(120 * 2),
      render: (text: string) => text || "-",
      onHeaderCell: () => ({
        onClick: () => safeHeaderClick("special_rights"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "floor_confirmation",
      title: (
        <DraggableHeader
          id="floor_confirmation"
          width={getWidth?.("floor_confirmation")}
          onResize={(dx) => onResizeColumn?.("floor_confirmation", dx)}
        >
          {renderHeaderLabel("floor_confirmation", "층수 확인")}
        </DraggableHeader>
      ),
      dataIndex: "floor_confirmation",
      key: "floor_confirmation",
      width: getWidth?.("floor_confirmation") ?? 100,
      render: (text: string) => text || "-",
      onHeaderCell: () => ({
        onClick: () => safeHeaderClick("floor_confirmation"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "public_price",
      title: (
        <DraggableHeader
          id="public_price"
          width={getWidth?.("public_price")}
          onResize={(dx) => onResizeColumn?.("public_price", dx)}
        >
          {renderHeaderLabel("public_price", "공시가격(만원)")}
        </DraggableHeader>
      ),
      dataIndex: "public_price",
      key: "public_price",
      width: getWidth?.("public_price") ?? 140,
      align: "right",
      render: (value: number) => (value || 0).toLocaleString(),
      onHeaderCell: () => ({
        onClick: () => safeHeaderClick("public_price"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "under_100million",
      title: (
        <DraggableHeader
          id="under_100million"
          width={getWidth?.("under_100million")}
          onResize={(dx) => onResizeColumn?.("under_100million", dx)}
        >
          {renderHeaderLabel("under_100million", "공시지가 기준(1억)")}
        </DraggableHeader>
      ),
      dataIndex: "under_100million",
      key: "under_100million",
      width: getWidth?.("under_100million") ?? Math.round(130 * 1.15),
      render: (value: string) => {
        if (
          value === undefined ||
          value === null ||
          String(value).trim() === ""
        ) {
          return <Tag>확인불가</Tag>;
        }
        const isUnder = String(value).includes("O");
        const text = isUnder ? "1억 이하 ⬇️" : "1억 이상 ⬆️";
        const color = isUnder ? "orange" : "green";
        return <Tag color={color}>{text}</Tag>;
      },
      onHeaderCell: () => ({
        onClick: () => safeHeaderClick("under_100million"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "construction_year",
      title: (
        <DraggableHeader
          id="construction_year"
          width={getWidth?.("construction_year")}
          onResize={(dx) => onResizeColumn?.("construction_year", dx)}
        >
          {renderHeaderLabel("construction_year", "건축년도")}
        </DraggableHeader>
      ),
      dataIndex: "construction_year",
      key: "construction_year",
      width: getWidth?.("construction_year") ?? 120,
      align: "right",
      render: (value: number, record: Item) =>
        value || record.built_year || "-",
      onHeaderCell: () => ({
        onClick: () => safeHeaderClick("construction_year"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "elevator_available",
      title: (
        <DraggableHeader
          id="elevator_available"
          width={getWidth?.("elevator_available")}
          onResize={(dx) => onResizeColumn?.("elevator_available", dx)}
        >
          {renderHeaderLabel("elevator_available", "엘리베이터")}
        </DraggableHeader>
      ),
      dataIndex: "elevator_available",
      key: "elevator_available",
      width: getWidth?.("elevator_available") ?? 130,
      render: (value: string, record: Item) => {
        const raw = value ?? (record.hasElevator ? "Y" : undefined);
        const yes = raw === "O" || raw === "Y";
        const no = raw === "X" || raw === "N";
        if (yes) return <Tag color="blue">있음</Tag>;
        if (no) return <Tag>없음</Tag>;
        return <Tag color="default">확인불가</Tag>;
      },
      onHeaderCell: () => ({
        onClick: () => safeHeaderClick("elevator_available"),
        style: { cursor: "pointer" },
      }),
    },
  ];
}; // createColumns 함수의 닫는 중괄호 추가

// 🎯 Props 인터페이스
interface ItemTableProps {
  items?: Item[];
  isLoading?: boolean;
  error?: any;
  onItemSelect?: (item: Item) => void;
  onRetry?: () => void;
  // 🔥 서버사이드 정렬/페이지네이션 props
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (column?: string, direction?: "asc" | "desc") => void;
  totalCount?: number;
  page?: number; // 1-based
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  // ✅ 행 선택 제어 (선택 개수 표시용)
  selectedRowKeys?: React.Key[];
  onSelectionChange?: (keys: React.Key[]) => void;
}

// 🚀 Ant Design Table 컴포넌트 - 완전 새로운 구현!
const ItemTable: React.FC<ItemTableProps> = ({
  items = [],
  isLoading = false,
  error,
  onItemSelect,
  onRetry,
  sortBy,
  sortOrder,
  onSort,
  totalCount = 0,
  page = 1,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  selectedRowKeys: controlledSelectedKeys,
  onSelectionChange,
}) => {
  // 🎯 컬럼 순서 상태 관리 (드래그앤드롭용)
  const [columnOrder, setColumnOrder] =
    React.useState<string[]>(DEFAULT_COLUMN_ORDER);

  // 🔍 도로명주소 팝업 상태
  const [addressDialogOpen, setAddressDialogOpen] = React.useState(false);
  const [addressDialogItem, setAddressDialogItem] = React.useState<Item | null>(
    null
  );

  // 지도 이벤트로 상세 오픈은 페이지 상위에서 처리하도록 변경

  // 🎯 드래그앤드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    })
  );

  // 🔄 컬럼 드래그 완료 핸들러
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setColumnOrder((prev) => {
        const activeIndex = prev.indexOf(active.id as string);
        const overIndex = prev.indexOf(over?.id as string);
        return arrayMove(prev, activeIndex, overIndex);
      });
    }
  };

  // 📋 컬럼 생성 및 순서 적용
  const [columnWidths, setColumnWidths] = React.useState<
    Record<string, number>
  >({});

  const getWidth = (id: string) => columnWidths[id];
  const onResizeColumn = (id: string, deltaX: number) => {
    setColumnWidths((prev) => {
      const current =
        prev[id] ??
        (baseColumns.find((c) => c.id === id)?.width as number) ??
        120;
      // 최소 너비: 컬럼명(+ 핸들 아이콘 공간) 고려하여 100~140 사이로 보수적으로 설정
      const minById: Record<string, number> = {
        usage: 100,
        case_number: 120,
        road_address: 200,
        building_area_pyeong: 110,
        land_area_pyeong: 110,
        appraised_value: 130,
        minimum_bid_price: 130,
        bid_to_appraised_ratio: 150,
        calculated_ratio: 140,
        sale_date: 140,
        special_rights: 160,
        floor_confirmation: 110,
        public_price: 130,
        under_100million: 140,
        construction_year: 120,
        elevator_available: 130,
        current_status: 120,
      };
      const minWidth = minById[id] ?? 100;
      const next = Math.max(minWidth, current + deltaX);
      return { ...prev, [id]: next };
    });
  };

  const handleAddressClick = (item: Item) => {
    setAddressDialogItem(item);
    setAddressDialogOpen(true);
  };

  const baseColumns = createColumns(
    sortBy,
    sortOrder,
    onSort,
    getWidth,
    onResizeColumn,
    handleAddressClick
  );
  const orderedColumns = React.useMemo(() => {
    return columnOrder
      .map((id) => baseColumns.find((col) => col.id === id))
      .filter(Boolean) as ColumnWithId[];
  }, [columnOrder, baseColumns, sortBy, sortOrder]);

  // ✅ 행 선택(체크박스) - 맨 앞 고정
  const [selectedRowKeysState, setSelectedRowKeysState] = React.useState<
    React.Key[]
  >([]);
  const effectiveSelectedKeys = controlledSelectedKeys ?? selectedRowKeysState;
  const rowSelection = {
    selectedRowKeys: effectiveSelectedKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeysState(keys);
      onSelectionChange?.(keys);
    },
    fixed: true as const,
  };

  // Drag 선택으로 내부 상태가 변한 경우 부모에 비동기 알림(렌더 중 상위 업데이트 경고 방지)
  React.useEffect(() => {
    if (!controlledSelectedKeys && onSelectionChange) {
      Promise.resolve().then(() => onSelectionChange(selectedRowKeysState));
    }
  }, [selectedRowKeysState, controlledSelectedKeys, onSelectionChange]);

  // 🖱️ 드래그로 여러 행 체크 선택 지원
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [selectionIntent, setSelectionIntent] = React.useState<
    "add" | "remove" | null
  >(null);
  const [anchorIndex, setAnchorIndex] = React.useState<number | null>(null);
  const keyToIndex = React.useMemo(() => {
    const map = new Map<React.Key, number>();
    items.forEach((it, idx) => {
      // rowKey="id"
      map.set((it as any).id, idx);
    });
    return map;
  }, [items]);

  const applySelectionRange = React.useCallback(
    (fromIdx: number, toIdx: number, intent: "add" | "remove") => {
      const [start, end] =
        fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
      const rangeKeys: React.Key[] = [];
      for (let i = start; i <= end; i++) {
        const key = (items[i] as any)?.id;
        if (key !== undefined) rangeKeys.push(key);
      }
      setSelectedRowKeysState((prev) => {
        const set = new Set(prev);
        if (intent === "add") {
          rangeKeys.forEach((k) => set.add(k));
        } else {
          rangeKeys.forEach((k) => set.delete(k));
        }
        const next = Array.from(set);
        return next;
      });
    },
    [items, onSelectionChange]
  );

  React.useEffect(() => {
    const onUp = () => {
      if (isSelecting) {
        setIsSelecting(false);
        setSelectionIntent(null);
        setAnchorIndex(null);
      }
    };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, [isSelecting]);

  // 🎯 Ant Design Table onChange 핸들러 - 핵심 기능!
  const handleTableChange: TableProps<Item>["onChange"] = (
    pagination,
    filters,
    sorter
  ) => {
    console.log("🔄 [Ant Table] onChange 이벤트:", {
      pagination,
      filters,
      sorter,
    });

    // 🔥 페이지네이션 처리 - 100% 안정적!
    if (pagination?.current !== page) {
      onPageChange?.(pagination?.current || 1);
    }

    if (pagination?.pageSize !== pageSize) {
      onPageSizeChange?.(pagination?.pageSize || 20);
    }

    // 🔥 서버사이드 정렬 처리 - TanStack 문제 완전 해결!
    if (sorter && !Array.isArray(sorter)) {
      if (sorter.field && sorter.order) {
        const direction = sorter.order === "ascend" ? "asc" : "desc";
        console.log(`🎯 [Sort] 정렬 요청: ${sorter.field} ${direction}`);
        onSort?.(sorter.field as string, direction);
      } else {
        // 정렬 해제
        onSort?.("", "asc");
      }
    }
  };

  // 🎯 행 클릭 핸들러
  const handleRowClick = (record: Item, rowIndex?: number) => {
    return {
      onClick: () => {
        console.log("🖱️ [Row] 클릭:", record.case_number);
        onItemSelect?.(record);
      },
      onMouseDown: (e: React.MouseEvent) => {
        // 좌클릭만 처리
        if (e.button !== 0) return;
        const key = (record as any).id as React.Key;
        const idx = rowIndex ?? keyToIndex.get(key) ?? 0;
        const already = effectiveSelectedKeys?.includes(key) ?? false;
        setIsSelecting(true);
        setSelectionIntent(already ? "remove" : "add");
        setAnchorIndex(idx);
        // 시작 행 즉시 반영
        applySelectionRange(idx, idx, already ? "remove" : "add");
      },
      onMouseEnter: () => {
        if (!isSelecting || selectionIntent === null) return;
        const key = (record as any).id as React.Key;
        const idx = rowIndex ?? keyToIndex.get(key) ?? 0;
        if (anchorIndex !== null) {
          applySelectionRange(anchorIndex, idx, selectionIntent);
        }
      },
      style: { cursor: "pointer" },
    };
  };

  // 🔄 에러 상태 처리
  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "48px" }}>
        <Typography.Title level={4} type="danger">
          데이터를 불러오는 중 오류가 발생했습니다
        </Typography.Title>
        <Typography.Text type="secondary">
          네트워크 상태를 확인한 후 다시 시도해주세요.
        </Typography.Text>
        {onRetry && (
          <div style={{ marginTop: 16 }}>
            <button onClick={onRetry} style={{ padding: "8px 16px" }}>
              다시 시도
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: "8px" }}>
      <style jsx global>{`
        .no-wrap-table .ant-table-tbody > tr > td {
          white-space: nowrap !important;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .no-wrap-table .ant-table-thead > tr > th {
          white-space: nowrap !important;
        }
      `}</style>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext
          items={columnOrder}
          strategy={horizontalListSortingStrategy}
        >
          <Table<Item>
            // 🎯 기본 설정
            dataSource={items}
            columns={orderedColumns}
            rowKey="id"
            rowSelection={rowSelection}
            // 🔥 서버사이드 설정 - 핵심 기능들!
            loading={isLoading}
            onChange={handleTableChange}
            // 🎯 내부 페이지네이션 제거 (외부 페이지네이션 사용)
            pagination={false}
            // 🎨 테이블 설정: 세로 스크롤 제거, 가로만 유지
            scroll={{ x: 1500 }}
            size="middle"
            bordered
            // 🚫 줄바꿈 방지 설정
            className="no-wrap-table"
            // 🖱️ 행 이벤트
            onRow={(rec, idx) => handleRowClick(rec, idx)}
            // 🎯 빈 상태 처리
            locale={{
              emptyText: (
                <div style={{ padding: "24px" }}>
                  <Typography.Title level={5} type="secondary">
                    표시할 데이터가 없습니다
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    필터를 조정하거나 조건을 변경해보세요.
                  </Typography.Text>
                </div>
              ),
            }}
          />
          {/* 도로명주소 팝업 */}
          <PropertyDetailDialog
            open={addressDialogOpen}
            onOpenChange={setAddressDialogOpen}
            rowItem={addressDialogItem}
          />
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default ItemTable;
