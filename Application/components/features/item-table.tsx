"use client";

import React from "react";
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

const { Link } = Typography;

// 🎯 드래그 가능한 헤더 컴포넌트
interface DraggableHeaderProps {
  id: string;
  children: React.ReactNode;
}

const DraggableHeader: React.FC<DraggableHeaderProps> = ({ id, children }) => {
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

  return (
    <th ref={setNodeRef} style={style} {...attributes}>
      <Space>
        <span>{children}</span>
        <HolderOutlined
          style={{ cursor: "grab", color: "#888" }}
          {...listeners}
        />
      </Space>
    </th>
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
  "building_area_pyeong",
  "land_area_pyeong",
  "appraised_value",
  "minimum_bid_price",
  "bid_to_appraised_ratio",
  "calculated_ratio",
  "sale_date",
  "special_rights",
  "floor_confirmation",
  "public_price",
  "under_100million",
  "construction_year",
  "elevator_available",
];

// 📋 Ant Design Table 컬럼 정의 - 모든 기능 완벽 지원!
const createColumns = (
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  onSort?: (column?: string, direction?: "asc" | "desc") => void
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

  return [
    {
      id: "usage",
      title: (
        <DraggableHeader id="usage">
          <span style={{ cursor: "pointer", userSelect: "none" }}>
            용도{getSortIcon("usage")}
          </span>
        </DraggableHeader>
      ),
      dataIndex: "usage",
      key: "usage",
      width: 120,
      render: (text: string) => text || "-",
      onHeaderCell: () => ({
        onClick: () => getNextSortState("usage"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "case_number",
      title: (
        <DraggableHeader id="case_number">
          <span style={{ cursor: "pointer", userSelect: "none" }}>
            사건{getSortIcon("case_number")}
          </span>
        </DraggableHeader>
      ),
      dataIndex: "case_number",
      key: "case_number",
      width: 150,
      render: (text: string) => text || "-",
      onHeaderCell: () => ({
        onClick: () => getNextSortState("case_number"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "road_address",
      title: (
        <DraggableHeader id="road_address">
          <span style={{ cursor: "pointer", userSelect: "none" }}>
            도로명주소{getSortIcon("road_address")}
          </span>
        </DraggableHeader>
      ),
      dataIndex: "road_address",
      key: "road_address",
      width: 250,
      render: (text: string, record: Item) => (
        <Link href="#" onClick={(e) => e.preventDefault()}>
          {text || record.address || "-"}
        </Link>
      ),
      onHeaderCell: () => ({
        onClick: () => getNextSortState("road_address"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "building_area_pyeong",
      title: (
        <DraggableHeader id="building_area_pyeong">
          <span style={{ cursor: "pointer", userSelect: "none" }}>
            건물평형{getSortIcon("building_area_pyeong")}
          </span>
        </DraggableHeader>
      ),
      dataIndex: "building_area_pyeong",
      key: "building_area_pyeong",
      width: 120,
      align: "right",
      render: (text: number, record: Item) => text || record.area || "-",
      onHeaderCell: () => ({
        onClick: () => getNextSortState("building_area_pyeong"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "land_area_pyeong",
      title: (
        <DraggableHeader id="land_area_pyeong">
          <span style={{ cursor: "pointer", userSelect: "none" }}>
            토지평형{getSortIcon("land_area_pyeong")}
          </span>
        </DraggableHeader>
      ),
      dataIndex: "land_area_pyeong",
      key: "land_area_pyeong",
      width: 120,
      align: "right",
      render: (text: number) => text || "-",
      onHeaderCell: () => ({
        onClick: () => getNextSortState("land_area_pyeong"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "appraised_value",
      title: (
        <DraggableHeader id="appraised_value">
          <span style={{ cursor: "pointer", userSelect: "none" }}>
            감정가(만원){getSortIcon("appraised_value")}
          </span>
        </DraggableHeader>
      ),
      dataIndex: "appraised_value",
      key: "appraised_value",
      width: 140,
      align: "right",
      render: (value: number) => (value || 0).toLocaleString(),
      onHeaderCell: () => ({
        onClick: () => getNextSortState("appraised_value"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "minimum_bid_price",
      title: (
        <DraggableHeader id="minimum_bid_price">
          <span style={{ cursor: "pointer", userSelect: "none" }}>
            최저가(만원){getSortIcon("minimum_bid_price")}
          </span>
        </DraggableHeader>
      ),
      dataIndex: "minimum_bid_price",
      key: "minimum_bid_price",
      width: 140,
      align: "right",
      render: (value: number, record: Item) =>
        (value || record.price || 0).toLocaleString(),
      onHeaderCell: () => ({
        onClick: () => getNextSortState("minimum_bid_price"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "bid_to_appraised_ratio",
      title: (
        <DraggableHeader id="bid_to_appraised_ratio">
          <span style={{ cursor: "pointer", userSelect: "none" }}>
            최저가/감정가(%){getSortIcon("bid_to_appraised_ratio")}
          </span>
        </DraggableHeader>
      ),
      dataIndex: "bid_to_appraised_ratio",
      key: "bid_to_appraised_ratio",
      width: 160,
      align: "right",
      render: (text: string) => text || "-",
      onHeaderCell: () => ({
        onClick: () => getNextSortState("bid_to_appraised_ratio"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "calculated_ratio",
      title: (
        <DraggableHeader id="calculated_ratio">
          <span style={{ cursor: "pointer", userSelect: "none" }}>
            최저가/공시가격{getSortIcon("calculated_ratio")}
          </span>
        </DraggableHeader>
      ),
      key: "calculated_ratio",
      width: 150,
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
        onClick: () => getNextSortState("calculated_ratio"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "sale_date",
      title: (
        <DraggableHeader id="sale_date">
          <span style={{ cursor: "pointer", userSelect: "none" }}>
            매각기일{getSortIcon("sale_date")}
          </span>
        </DraggableHeader>
      ),
      dataIndex: "sale_date",
      key: "sale_date",
      width: 150,
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
            <div>
              <span style={{ color: "#1890ff", fontWeight: 500 }}>
                {year}년 {month}월 {day}일
              </span>
              {diffDays > 0 && diffDays <= 7 && (
                <div
                  style={{
                    color: "#ff4d4f",
                    fontSize: "12px",
                    marginTop: "2px",
                  }}
                >
                  D-{diffDays}
                </div>
              )}
            </div>
          );
        } catch (error) {
          return saleDate || "-";
        }
      },
      onHeaderCell: () => ({
        onClick: () => getNextSortState("sale_date"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "special_rights",
      title: (
        <DraggableHeader id="special_rights">
          <span style={{ cursor: "pointer", userSelect: "none" }}>
            특수권리{getSortIcon("special_rights")}
          </span>
        </DraggableHeader>
      ),
      dataIndex: "special_rights",
      key: "special_rights",
      width: 120,
      render: (text: string) => text || "-",
      onHeaderCell: () => ({
        onClick: () => getNextSortState("special_rights"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "floor_confirmation",
      title: (
        <DraggableHeader id="floor_confirmation">
          <span style={{ cursor: "pointer", userSelect: "none" }}>
            층확인{getSortIcon("floor_confirmation")}
          </span>
        </DraggableHeader>
      ),
      dataIndex: "floor_confirmation",
      key: "floor_confirmation",
      width: 100,
      render: (text: string) => text || "-",
      onHeaderCell: () => ({
        onClick: () => getNextSortState("floor_confirmation"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "public_price",
      title: (
        <DraggableHeader id="public_price">
          <span style={{ cursor: "pointer", userSelect: "none" }}>
            공시가격(만원){getSortIcon("public_price")}
          </span>
        </DraggableHeader>
      ),
      dataIndex: "public_price",
      key: "public_price",
      width: 140,
      align: "right",
      render: (value: number) => (value || 0).toLocaleString(),
      onHeaderCell: () => ({
        onClick: () => getNextSortState("public_price"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "under_100million",
      title: (
        <DraggableHeader id="under_100million">
          <span style={{ cursor: "pointer", userSelect: "none" }}>
            1억 이하 여부{getSortIcon("under_100million")}
          </span>
        </DraggableHeader>
      ),
      dataIndex: "under_100million",
      key: "under_100million",
      width: 130,
      render: (value: string) => {
        const isUnder = value && value.toString().includes("O");
        return (
          <Tag color={isUnder ? "green" : "default"} icon={<HomeOutlined />}>
            {isUnder ? "Y" : "N"}
          </Tag>
        );
      },
      onHeaderCell: () => ({
        onClick: () => getNextSortState("under_100million"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "construction_year",
      title: (
        <DraggableHeader id="construction_year">
          <span style={{ cursor: "pointer", userSelect: "none" }}>
            건축연도{getSortIcon("construction_year")}
          </span>
        </DraggableHeader>
      ),
      dataIndex: "construction_year",
      key: "construction_year",
      width: 120,
      align: "right",
      render: (value: number, record: Item) =>
        value || record.built_year || "-",
      onHeaderCell: () => ({
        onClick: () => getNextSortState("construction_year"),
        style: { cursor: "pointer" },
      }),
    },
    {
      id: "elevator_available",
      title: (
        <DraggableHeader id="elevator_available">
          <span style={{ cursor: "pointer", userSelect: "none" }}>
            Elevator여부{getSortIcon("elevator_available")}
          </span>
        </DraggableHeader>
      ),
      dataIndex: "elevator_available",
      key: "elevator_available",
      width: 130,
      render: (value: string, record: Item) => {
        const hasElevator = value === "O" || record.hasElevator === true;
        return (
          <Tag color={hasElevator ? "blue" : "default"}>
            {hasElevator ? "Y" : "N"}
          </Tag>
        );
      },
      onHeaderCell: () => ({
        onClick: () => getNextSortState("elevator_available"),
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
}) => {
  // 🎯 컬럼 순서 상태 관리 (드래그앤드롭용)
  const [columnOrder, setColumnOrder] =
    React.useState<string[]>(DEFAULT_COLUMN_ORDER);

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
  const baseColumns = createColumns(sortBy, sortOrder, onSort);
  const orderedColumns = React.useMemo(() => {
    return columnOrder
      .map((id) => baseColumns.find((col) => col.id === id))
      .filter(Boolean) as ColumnWithId[];
  }, [columnOrder, baseColumns, sortBy, sortOrder]);

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
  const handleRowClick = (record: Item) => {
    return {
      onClick: () => {
        console.log("🖱️ [Row] 클릭:", record.case_number);
        onItemSelect?.(record);
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
            // 🔥 서버사이드 설정 - 핵심 기능들!
            loading={isLoading}
            onChange={handleTableChange}
            // 🎯 페이지네이션 설정 - 완벽 지원!
            pagination={{
              current: page,
              pageSize: pageSize,
              total: totalCount,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} 항목`,
              pageSizeOptions: ["10", "20", "50", "100"],
              onChange: (current, size) => {
                onPageChange?.(current);
                onPageSizeChange?.(size);
              },
            }}
            // 🎨 테이블 설정
            scroll={{ x: 1500, y: 600 }}
            size="middle"
            bordered
            // 🚫 줄바꿈 방지 설정
            className="no-wrap-table"
            // 🖱️ 행 이벤트
            onRow={handleRowClick}
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
            // 🎯 테이블 제목
            title={() => (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography.Title level={5} style={{ margin: 0 }}>
                  🏘️ 경매 매물 목록 ({totalCount.toLocaleString()}건)
                </Typography.Title>
                <Tooltip title="컬럼을 드래그하여 순서를 변경할 수 있습니다">
                  <SortAscendingOutlined style={{ color: "#888" }} />
                </Tooltip>
              </div>
            )}
          />
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default ItemTable;
