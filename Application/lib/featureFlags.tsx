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
