"use client";

import { SWRConfig } from "swr";
import React from "react";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SWRConfig
      value={{
        // 전역 재시도/캐시 정책(보수적)
        errorRetryCount: 2,
        errorRetryInterval: 2000,
        shouldRetryOnError: true,
        revalidateOnFocus: false,
        revalidateIfStale: true,
        dedupingInterval: 500,
        onError: (err, key) => {
          // 표준 로깅 훅. 필요 시 토스트/모니터링 연계
          console.error("SWR error:", { key, err });
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
