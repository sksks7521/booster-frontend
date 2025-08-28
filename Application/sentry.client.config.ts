import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  // 고정 샘플링: 트레이스 5%, 프로파일 2%, 세션 리플레이 0.5%, 에러 리플레이 10%
  // tracesSampler로 라우트별 필터링 (분석/상세만 추적)
  tracesSampler: (samplingContext) => {
    try {
      const path =
        (samplingContext as any)?.location?.pathname ||
        (typeof window !== "undefined" ? window.location.pathname : "");
      if (typeof path === "string" && path.startsWith("/analysis")) return 0.05;
    } catch {}
    return 0; // 기본 비활성
  },
  profilesSampleRate: 0.02,
  // Replay: 분석/상세 라우트에서만 세션/에러 리플레이 수집
  replaysSessionSampleRate:
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/analysis")
      ? 0.005
      : 0,
  replaysOnErrorSampleRate:
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/analysis")
      ? 0.1
      : 0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
});
