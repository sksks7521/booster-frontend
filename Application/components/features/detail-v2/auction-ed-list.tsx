"use client";

import useSWR from "swr";
import { useMemo } from "react";
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

  const fmt = (n?: number) =>
    typeof n === "number" && Number.isFinite(n) ? n.toLocaleString() : "-";

  return (
    <Card>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[72px]">ID</TableHead>
              <TableHead>주소</TableHead>
              <TableHead className="text-right">낙찰가(만원)</TableHead>
              <TableHead className="text-right">면적(㎡)</TableHead>
              <TableHead className="text-right">입찰일</TableHead>
              <TableHead className="text-right">입찰수</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
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
