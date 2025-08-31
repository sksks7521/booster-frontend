import useSWR from "swr";
import { userPrefsApi } from "@/lib/api";

const PAGE = "analysis";
const KEY = "column_order";

export function useColumnOrder(defaultOrder: string[]) {
  const { data, isLoading, mutate, error } = useSWR(
    [PAGE, KEY, "user-preferences"],
    async () => {
      try {
        return await userPrefsApi.get(PAGE, KEY);
      } catch (e: any) {
        // 401(비로그인) 시 무소음으로 기본값 사용
        if (
          e && typeof e.status === "number"
            ? e.status === 401
            : /401/.test(String(e))
        ) {
          return null;
        }
        // CORS나 404 등의 에러도 조용히 처리 (백엔드 API 미구현)
        if (
          e &&
          (String(e).includes("CORS") ||
            String(e).includes("Failed to fetch") ||
            (typeof e.status === "number" && e.status === 404))
        ) {
          console.warn(
            "⚠️ User preferences API not available, using default column order"
          );
          return null;
        }
        throw e;
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 1000,
      keepPreviousData: true,
      shouldRetryOnError: false,
      onError: (error) => {
        // SWR 레벨에서도 에러를 조용히 처리
        if (
          error &&
          (String(error).includes("CORS") ||
            String(error).includes("Failed to fetch") ||
            String(error).includes("user-preferences"))
        ) {
          console.warn(
            "⚠️ User preferences API error suppressed:",
            error.message || error
          );
          return; // 에러를 조용히 무시
        }
        console.error("SWR Error in useColumnOrder:", error);
      },
    }
  );

  const serverValue = (data as any)?.value;
  const isArray =
    Array.isArray(serverValue) &&
    serverValue.every((x: any) => typeof x === "string");
  const order: string[] =
    isArray && (serverValue as string[]).length > 0
      ? (serverValue as string[])
      : defaultOrder;

  // 간단한 디바운스/락 적용
  const saveTimerRef = (globalThis as any).__col_order_timer_ref || {
    current: 0,
  };
  (globalThis as any).__col_order_timer_ref = saveTimerRef;
  const saveLockRef = (globalThis as any).__col_order_lock_ref || {
    current: false,
  };
  (globalThis as any).__col_order_lock_ref = saveLockRef;

  const save = async (next: string[]) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(async () => {
      if (saveLockRef.current) return;
      try {
        saveLockRef.current = true;
        try {
          const payload = await userPrefsApi.put(PAGE, KEY, next);
          await mutate(payload, false);
        } catch (e: any) {
          // 401(비로그인) 저장은 무시
          if (
            e && typeof e.status === "number"
              ? e.status === 401
              : /401/.test(String(e))
          ) {
            return;
          }
          throw e;
        }
      } finally {
        saveLockRef.current = false;
      }
    }, 400) as unknown as number;
  };

  const reset = async () => {
    try {
      await userPrefsApi.delete(PAGE, KEY);
      await mutate(null, false);
    } catch (e: any) {
      if (
        e && typeof e.status === "number"
          ? e.status === 401
          : /401/.test(String(e))
      ) {
        // 비로그인: 서버 상태 없음 → 단순 초기화 처리
        await mutate(null, false);
        return;
      }
      throw e;
    }
  };

  return { order, save, reset, isLoading, error };
}
