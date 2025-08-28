import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  tracesSampleRate: 0.05,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
});
