"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { auctionApi, type AuctionCompleted } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/ui/data-state";

interface Props {
  baseLat?: number;
  baseLng?: number;
}

export default function AuctionEdList({ baseLat, baseLng }: Props) {
  // 정렬 상태 관리
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const params = useMemo(() => {
    const p: Record<string, any> = {};
    if (typeof baseLat === "number" && typeof baseLng === "number") {
      p.lat = baseLat;
      p.lng = baseLng;
      p.radius_km = 3;
    }
    return p;
  }, [baseLat, baseLng]);

  const paramsKey = useMemo(() => JSON.stringify(params), [params]);

  const { data, error, isLoading, mutate } = useSWR<AuctionCompleted[]>(
    ["/api/v1/auction-completed/", paramsKey],
    (_path: string, pk: string | undefined) =>
      auctionApi.getCompleted(pk ? JSON.parse(pk) : undefined)
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <LoadingState title="과거 경매결과를 불러오는 중입니다..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10">
          <ErrorState
            title="데이터 로딩 실패"
            onRetry={() => mutate()}
            retryText="다시 시도"
          />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <EmptyState title="표시할 데이터가 없습니다." />
        </CardContent>
      </Card>
    );
  }

  // 정렬 핸들러
  const handleSort = (column: string) => {
    if (sortBy !== column) {
      // 새로운 컬럼으로 정렬 - 오름차순부터 시작
      setSortBy(column);
      setSortOrder("asc");
    } else if (sortOrder === "asc") {
      // 같은 컬럼이고 오름차순이면 내림차순으로
      setSortOrder("desc");
    } else {
      // 같은 컬럼이고 내림차순이면 정렬 해제
      setSortBy(undefined);
      setSortOrder("asc");
    }
  };

  // 정렬 아이콘 표시
  const getSortIcon = (column: string) => {
    if (sortBy === column) {
      return sortOrder === "asc" ? " ▲" : " ▼";
    }
    return "";
  };

  // 정렬된 데이터 처리
  const sortedData = useMemo(() => {
    if (!data || !sortBy) return data;

    const sorted = [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "id":
          aValue = a.id;
          bValue = b.id;
          break;
        case "address":
          aValue = a.address || "";
          bValue = b.address || "";
          break;
        case "finalPrice":
          aValue = a.finalPrice || 0;
          bValue = b.finalPrice || 0;
          break;
        case "area":
          aValue = a.area || 0;
          bValue = b.area || 0;
          break;
        case "auctionDate":
          aValue = a.auctionDate || "";
          bValue = b.auctionDate || "";
          break;
        case "bidCount":
          aValue = a.bidCount || 0;
          bValue = b.bidCount || 0;
          break;
        default:
          return 0;
      }

      // 숫자 비교
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      // 문자열 비교
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      if (sortOrder === "asc") {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

    return sorted;
  }, [data, sortBy, sortOrder]);

  const fmt = (n?: number) =>
    typeof n === "number" && Number.isFinite(n) ? n.toLocaleString() : "-";

  return (
    <Card>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="w-[72px] cursor-pointer hover:bg-gray-50 select-none"
                style={{
                  color: sortBy === "id" ? "#2563eb" : undefined,
                  fontWeight: sortBy === "id" ? 600 : undefined,
                }}
                onClick={() => handleSort("id")}
              >
                ID{getSortIcon("id")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50 select-none"
                style={{
                  color: sortBy === "address" ? "#2563eb" : undefined,
                  fontWeight: sortBy === "address" ? 600 : undefined,
                }}
                onClick={() => handleSort("address")}
              >
                주소{getSortIcon("address")}
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-gray-50 select-none"
                style={{
                  color: sortBy === "finalPrice" ? "#2563eb" : undefined,
                  fontWeight: sortBy === "finalPrice" ? 600 : undefined,
                }}
                onClick={() => handleSort("finalPrice")}
              >
                낙찰가(만원){getSortIcon("finalPrice")}
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-gray-50 select-none"
                style={{
                  color: sortBy === "area" ? "#2563eb" : undefined,
                  fontWeight: sortBy === "area" ? 600 : undefined,
                }}
                onClick={() => handleSort("area")}
              >
                면적(㎡){getSortIcon("area")}
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-gray-50 select-none"
                style={{
                  color: sortBy === "auctionDate" ? "#2563eb" : undefined,
                  fontWeight: sortBy === "auctionDate" ? 600 : undefined,
                }}
                onClick={() => handleSort("auctionDate")}
              >
                입찰일{getSortIcon("auctionDate")}
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-gray-50 select-none"
                style={{
                  color: sortBy === "bidCount" ? "#2563eb" : undefined,
                  fontWeight: sortBy === "bidCount" ? 600 : undefined,
                }}
                onClick={() => handleSort("bidCount")}
              >
                입찰수{getSortIcon("bidCount")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(sortedData || []).map((row) => (
              <TableRow key={row.id} className="hover:bg-gray-50">
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.address}</TableCell>
                <TableCell className="text-right">
                  {fmt(row.finalPrice)}
                </TableCell>
                <TableCell className="text-right">{fmt(row.area)}</TableCell>
                <TableCell className="text-right">
                  {row.auctionDate ?? "-"}
                </TableCell>
                <TableCell className="text-right">
                  {fmt(row.bidCount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
