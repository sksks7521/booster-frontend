export interface ApiErrorShape {
  message: string;
  status?: number;
  url: string;
  method: string;
  details?: unknown;
}

export function isApiError(error: unknown): error is ApiErrorShape {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in (error as any) &&
    "url" in (error as any)
  );
}

export function mapApiErrorToMessage(error: unknown): string {
  if (isApiError(error)) {
    const status = error.status ?? 0;
    const msg = String(error.message ?? "");
    if (msg.toLowerCase().includes("timeout")) {
      return "요청이 시간 초과되었습니다. 잠시 후 다시 시도해주세요.";
    }
    if (status >= 500) {
      return "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }
    if (status === 404) {
      return "데이터를 찾을 수 없습니다.";
    }
    if (status === 401 || status === 403) {
      return "접근 권한이 없습니다. 로그인 상태를 확인해주세요.";
    }
    if (status === 0) {
      return "네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.";
    }
    return error.message || "요청 처리 중 오류가 발생했습니다.";
  }
  // 비표준 에러
  try {
    const text = String((error as any)?.message ?? error ?? "");
    if (text.toLowerCase().includes("timeout")) {
      return "요청이 시간 초과되었습니다. 잠시 후 다시 시도해주세요.";
    }
    return text || "요청 처리 중 오류가 발생했습니다.";
  } catch {
    return "요청 처리 중 오류가 발생했습니다.";
  }
}
