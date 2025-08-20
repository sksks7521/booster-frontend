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

type SortDirection = "asc" | "desc" | null;
type SortColumn = string | null;

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
  // 정렬 상태 관리
  const [sortColumn, setSortColumn] = React.useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);

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

  // 정렬 함수
  const getSortValue = (item: any, column: string) => {
    switch (column) {
      // 숫자형 컬럼들
      case "building_area_pyeong":
        return parseFloat(item.building_area_pyeong) || 0;
      case "land_area_pyeong":
        return parseFloat(item.land_area_pyeong) || 0;
      case "appraised_value":
        return parseFloat(item.appraised_value) || 0;
      case "minimum_bid_price":
        return parseFloat(item.minimum_bid_price) || 0;
      case "public_price":
        return parseFloat(item.public_price) || 0;
      case "construction_year":
        return parseInt(item.construction_year) || 0;
      case "sale_month":
        return parseInt(item.sale_month) || 0;
      case "bid_to_appraised_ratio":
        const ratio = item.bid_to_appraised_ratio;
        return typeof ratio === "string"
          ? parseFloat(ratio.replace("%", "")) || 0
          : ratio || 0;
      case "calculated_ratio":
        const calcRatio = calculateBidToPublicRatio(item);
        return calcRatio === "-" ? 0 : parseFloat(calcRatio);

      // Y/N 컬럼들 (Y=1, N=0으로 변환)
      case "under_100million":
        // 백엔드에서 "O (이하)" 형태로 반환
        return item.under_100million &&
          item.under_100million.toString().includes("O")
          ? 1
          : 0;
      case "elevator_available":
        // 백엔드에서 "O" 문자열로 반환
        return item.elevator_available === "O" || item.hasElevator === true
          ? 1
          : 0;

      // 텍스트형 컬럼들
      case "usage":
        return (item.usage || "").toString();
      case "case_number":
        return (item.case_number || "").toString();
      case "road_address":
        return (item.road_address || item.address || "").toString();
      case "special_rights":
        return (item.special_rights || "").toString();
      case "floor_confirmation":
        // 층수를 완전 문자열로 정렬 (예: "1층" < "2층" < "지하1층")
        return (item.floor_confirmation || "").toString();

      default:
        return "";
    }
  };

  // 정렬 처리 함수
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // 같은 컬럼 클릭: 기본 → 오름차순 → 내림차순 → 기본
      if (sortDirection === null) {
        setSortDirection("asc");
      } else if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      // 다른 컬럼 클릭: 오름차순으로 시작
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // 정렬 아이콘 반환
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return "";
    if (sortDirection === "asc") return " ↑";
    if (sortDirection === "desc") return " ↓";
    return "";
  };

  // 정렬된 데이터
  const sortedItems = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return items;

    return [...items].sort((a, b) => {
      const aValue = getSortValue(a, sortColumn);
      const bValue = getSortValue(b, sortColumn);

      let result = 0;
      if (typeof aValue === "number" && typeof bValue === "number") {
        result = aValue - bValue;
      } else {
        result = String(aValue).localeCompare(String(bValue), "ko-KR");
      }

      return sortDirection === "desc" ? -result : result;
    });
  }, [items, sortColumn, sortDirection]);

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
            <TableHead
              className="cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => handleSort("usage")}
            >
              <span
                className={
                  sortColumn === "usage" ? "text-blue-600 font-semibold" : ""
                }
              >
                용도{getSortIcon("usage")}
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => handleSort("case_number")}
            >
              <span
                className={
                  sortColumn === "case_number"
                    ? "text-blue-600 font-semibold"
                    : ""
                }
              >
                사건{getSortIcon("case_number")}
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => handleSort("road_address")}
            >
              <span
                className={
                  sortColumn === "road_address"
                    ? "text-blue-600 font-semibold"
                    : ""
                }
              >
                도로명주소{getSortIcon("road_address")}
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => handleSort("building_area_pyeong")}
            >
              <span
                className={
                  sortColumn === "building_area_pyeong"
                    ? "text-blue-600 font-semibold"
                    : ""
                }
              >
                건물평형{getSortIcon("building_area_pyeong")}
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => handleSort("land_area_pyeong")}
            >
              <span
                className={
                  sortColumn === "land_area_pyeong"
                    ? "text-blue-600 font-semibold"
                    : ""
                }
              >
                토지평형{getSortIcon("land_area_pyeong")}
              </span>
            </TableHead>
            <TableHead
              className="text-right cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => handleSort("appraised_value")}
            >
              <span
                className={
                  sortColumn === "appraised_value"
                    ? "text-blue-600 font-semibold"
                    : ""
                }
              >
                감정가(만원){getSortIcon("appraised_value")}
              </span>
            </TableHead>
            <TableHead
              className="text-right cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => handleSort("minimum_bid_price")}
            >
              <span
                className={
                  sortColumn === "minimum_bid_price"
                    ? "text-blue-600 font-semibold"
                    : ""
                }
              >
                최저가(만원){getSortIcon("minimum_bid_price")}
              </span>
            </TableHead>
            <TableHead
              className="text-right cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => handleSort("bid_to_appraised_ratio")}
            >
              <span
                className={
                  sortColumn === "bid_to_appraised_ratio"
                    ? "text-blue-600 font-semibold"
                    : ""
                }
              >
                최저가/감정가(%){getSortIcon("bid_to_appraised_ratio")}
              </span>
            </TableHead>
            <TableHead
              className="text-right cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => handleSort("calculated_ratio")}
            >
              <span
                className={
                  sortColumn === "calculated_ratio"
                    ? "text-blue-600 font-semibold"
                    : ""
                }
              >
                최저가/공시가격{getSortIcon("calculated_ratio")}
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => handleSort("sale_month")}
            >
              <span
                className={
                  sortColumn === "sale_month"
                    ? "text-blue-600 font-semibold"
                    : ""
                }
              >
                매각기일{getSortIcon("sale_month")}
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => handleSort("special_rights")}
            >
              <span
                className={
                  sortColumn === "special_rights"
                    ? "text-blue-600 font-semibold"
                    : ""
                }
              >
                특수권리{getSortIcon("special_rights")}
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => handleSort("floor_confirmation")}
            >
              <span
                className={
                  sortColumn === "floor_confirmation"
                    ? "text-blue-600 font-semibold"
                    : ""
                }
              >
                층확인{getSortIcon("floor_confirmation")}
              </span>
            </TableHead>
            <TableHead
              className="text-right cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => handleSort("public_price")}
            >
              <span
                className={
                  sortColumn === "public_price"
                    ? "text-blue-600 font-semibold"
                    : ""
                }
              >
                공시가격(만원){getSortIcon("public_price")}
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => handleSort("under_100million")}
            >
              <span
                className={
                  sortColumn === "under_100million"
                    ? "text-blue-600 font-semibold"
                    : ""
                }
              >
                1억 이하 여부{getSortIcon("under_100million")}
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => handleSort("construction_year")}
            >
              <span
                className={
                  sortColumn === "construction_year"
                    ? "text-blue-600 font-semibold"
                    : ""
                }
              >
                건축연도{getSortIcon("construction_year")}
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => handleSort("elevator_available")}
            >
              <span
                className={
                  sortColumn === "elevator_available"
                    ? "text-blue-600 font-semibold"
                    : ""
                }
              >
                Elevator여부{getSortIcon("elevator_available")}
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.map((item) => (
            <TableRow
              key={item.id}
              className="cursor-pointer"
              onClick={() => onItemSelect?.(item)}
            >
              {/* 1. 용도 */}
              <TableCell>{(item as any).usage ?? "-"}</TableCell>

              {/* 2. 사건 */}
              <TableCell>{(item as any).case_number ?? "-"}</TableCell>

              {/* 3. 도로명주소 */}
              <TableCell>
                <a
                  href="#"
                  onClick={(e: any) => e.preventDefault()}
                  className="hover:underline"
                >
                  {(item as any).road_address ?? item.address ?? "-"}
                </a>
              </TableCell>

              {/* 4. 건물평형 */}
              <TableCell>
                {(item as any).building_area_pyeong ?? item.area ?? "-"}
              </TableCell>

              {/* 5. 토지평형 */}
              <TableCell>{(item as any).land_area_pyeong ?? "-"}</TableCell>

              {/* 6. 감정가(만원) */}
              <TableCell className="text-right">
                {((item as any).appraised_value ?? 0).toLocaleString()}
              </TableCell>

              {/* 7. 최저가(만원) */}
              <TableCell className="text-right">
                {(
                  (item as any).minimum_bid_price ??
                  item.price ??
                  0
                ).toLocaleString()}
              </TableCell>

              {/* 8. 최저가/감정가(%) */}
              <TableCell className="text-right">
                {(item as any).bid_to_appraised_ratio ?? "-"}
              </TableCell>

              {/* 9. 최저가/공시가격 */}
              <TableCell className="text-right">
                {calculateBidToPublicRatio(item)}
              </TableCell>

              {/* 10. 매각기일 */}
              <TableCell>
                {(item as any).sale_month
                  ? `2025년 ${(item as any).sale_month}월 15일`
                  : "-"}
              </TableCell>

              {/* 11. 특수권리 */}
              <TableCell>{(item as any).special_rights ?? "-"}</TableCell>

              {/* 12. 층확인 */}
              <TableCell>{(item as any).floor_confirmation ?? "-"}</TableCell>

              {/* 13. 공시가격(만원) */}
              <TableCell className="text-right">
                {((item as any).public_price ?? 0).toLocaleString()}
              </TableCell>

              {/* 14. 1억 이하 여부 */}
              <TableCell>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    (item as any).under_100million &&
                    (item as any).under_100million.toString().includes("O")
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {(item as any).under_100million &&
                  (item as any).under_100million.toString().includes("O")
                    ? "Y"
                    : "N"}
                </span>
              </TableCell>

              {/* 15. 건축연도 */}
              <TableCell>
                {(item as any).construction_year ??
                  (item as any).buildYear ??
                  "-"}
              </TableCell>

              {/* 16. Elevator여부 */}
              <TableCell>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    (item as any).elevator_available === "O" ||
                    (item as any).hasElevator === true
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {(item as any).elevator_available === "O" ||
                  (item as any).hasElevator === true
                    ? "Y"
                    : "N"}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
export default ItemTable;
