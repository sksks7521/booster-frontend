// SWR 전역 fetcher (배열 키: [path, params])
export type SwrArrayKey =
  | [string, Record<string, any> | undefined]
  | [string]
  | null;

// SWR v2: 배열 키 사용 시 fetcher는 각 요소를 인자로 받음(fetcher(...args)).
// 문자열 키 또는 배열 키 모두 안전하게 처리하도록 구현.
export const fetcher = async (...args: any[]): Promise<any> => {
  let path: string;
  let params: Record<string, any> | undefined;

  if (Array.isArray(args[0])) {
    // SWR가 배열 키 전체를 단일 인자로 전달하는 경우 방어
    [path, params] = args[0] as [string, Record<string, any> | undefined];
  } else {
    // SWR v2 기본: 각 요소를 개별 인자로 전달
    [path, params] = args as [string, Record<string, any> | undefined];
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
  const queryObject: Record<string, string> = {};
  if (params && typeof params === "object") {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === "") continue;
      queryObject[k] = String(v);
    }
  }
  const qs = new URLSearchParams(queryObject).toString();
  const url = `${base}${path}${qs ? `?${qs}` : ""}`;

  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    // 개발 편의 로그: 최종 요청 URL/파라미터
    // 너무 시끄럽지 않게 단순 출력
    // eslint-disable-next-line no-console
    console.debug("SWR fetch:", url);
  }

  const res = await fetch(url);
  if (!res.ok) {
    // text/plain 대비
    let body: string | undefined = undefined;
    try {
      body = await res.text();
    } catch {}
    throw new Error(
      `HTTP ${res.status} ${res.statusText} | ${url}${body ? ` | ${body}` : ""}`
    );
  }
  try {
    return await res.json();
  } catch (e) {
    throw new Error(`JSON parse error | ${url}`);
  }
};
