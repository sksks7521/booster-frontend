"use client";

import React from "react";

export type FeatureFlags = {
  virtualTable: boolean;
  areaDisplay?: {
    mode: "both" | "m2" | "pyeong";
    rounding: "round" | "floor" | "ceil";
    digits: number;
  };
  // 서버 영역필터 사용 여부(auction_ed). 기본 OFF. NEXT_PUBLIC_AUCTION_ED_SERVER_AREA=1 시 ON.
  auctionEdServerAreaEnabled?: boolean;
  // 전월세 지도 표시상한 선별 방식: server(서버 KNN) | client(클라이언트 Top-K)
  // 기본값: client. NEXT_PUBLIC_MAP_NEAREST_LIMIT_RENT=server 면 서버 사용
  nearestLimitRentMode?: "server" | "client";
  nearestLimitRentIsServer?: boolean;
  // 매매 지도 표시상한 선별 방식: server(서버 KNN) | client(클라이언트 Top-K)
  // 기본값: server. NEXT_PUBLIC_MAP_NEAREST_LIMIT_SALE=client 면 클라이언트 사용
  nearestLimitSaleMode?: "server" | "client";
  nearestLimitSaleIsServer?: boolean;
};

const FeatureFlagContext = React.createContext<FeatureFlags>({
  virtualTable: false,
});

export function FeatureFlagProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  const vt = params.get("vt");
  const areaMode = (params.get("area") as any) || "both";
  const round = (params.get("round") as any) || "round";
  const digits = Number(params.get("digits") || 1);
  // 환경변수 기반 서버 영역필터 플래그(기본 OFF). NEXT_PUBLIC_AUCTION_ED_SERVER_AREA=1 이면 ON.
  const auctionEdServerAreaEnabled =
    (process.env.NEXT_PUBLIC_AUCTION_ED_SERVER_AREA ?? "0") === "1";
  // 전월세 가까운순 표시상한 모드: 기본 client, server 지정 시 서버 KNN 사용
  // 기본값을 'server' 로 바꿔 ENV 없이도 서버 KNN 경로가 동작하도록 함
  const nearestLimitRentModeEnv = String(
    process.env.NEXT_PUBLIC_MAP_NEAREST_LIMIT_RENT ?? "server"
  ).toLowerCase();
  const nearestLimitRentMode: "server" | "client" =
    nearestLimitRentModeEnv === "server" ? "server" : "client";
  const nearestLimitRentIsServer = nearestLimitRentMode === "server";
  // 매매 가까운순 모드: 기본 server (지도 정합성 확보 목적)
  const nearestLimitSaleModeEnv = String(
    process.env.NEXT_PUBLIC_MAP_NEAREST_LIMIT_SALE ?? "server"
  ).toLowerCase();
  const nearestLimitSaleMode: "server" | "client" =
    nearestLimitSaleModeEnv === "server" ? "server" : "client";
  const nearestLimitSaleIsServer = nearestLimitSaleMode === "server";

  const value: FeatureFlags = {
    virtualTable: vt === "1",
    areaDisplay: {
      mode: ["both", "m2", "pyeong"].includes(areaMode)
        ? (areaMode as any)
        : "both",
      rounding: ["round", "floor", "ceil"].includes(round)
        ? (round as any)
        : "round",
      digits: Number.isFinite(digits) ? digits : 1,
    },
    auctionEdServerAreaEnabled,
    nearestLimitRentMode,
    nearestLimitRentIsServer,
    nearestLimitSaleMode,
    nearestLimitSaleIsServer,
  };
  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  return React.useContext(FeatureFlagContext);
}
