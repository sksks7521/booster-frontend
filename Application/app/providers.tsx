"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import React from "react";
import { useEffect } from "react";
import {
  computeDefaultSuperProps,
  initAnalytics,
  setSuperProperties,
} from "@/lib/analytics";
import { FeatureFlagProvider } from "@/lib/featureFlags.tsx";
import * as Sentry from "@sentry/nextjs";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    void (async () => {
      await initAnalytics();
      setSuperProperties(computeDefaultSuperProps());
    })();
  }, []);
  return (
    <SWRConfig
      value={{
        fetcher,
        // 전역 재시도/캐시 정책(보수적)
        errorRetryCount: 2,
        errorRetryInterval: 1500,
        shouldRetryOnError: false,
        revalidateOnFocus: false,
        revalidateIfStale: true,
        dedupingInterval: 1000,
        keepPreviousData: true,
        onError: (err, key) => {
          // 표준 로깅 훅. 필요 시 토스트/모니터링 연계
          console.error("SWR error:", { key, err });
          try {
            Sentry.captureException(err, { extra: { swrKey: key } });
          } catch {}
        },
      }}
    >
      <FeatureFlagProvider>{children}</FeatureFlagProvider>
    </SWRConfig>
  );
}
