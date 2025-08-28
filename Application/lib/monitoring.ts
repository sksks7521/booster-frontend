import * as Sentry from "@sentry/nextjs";

export function captureError(err: unknown, extra?: Record<string, unknown>) {
  try {
    Sentry.captureException(err, extra ? { extra } : undefined);
  } catch {}
}
