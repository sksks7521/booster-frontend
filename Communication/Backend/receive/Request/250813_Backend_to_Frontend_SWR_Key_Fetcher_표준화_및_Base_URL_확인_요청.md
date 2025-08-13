# [Backend → Frontend] SWR Key/Fetcher 표준화 및 Base URL 확인 요청

- 발신: Backend
- 수신: Frontend
- 일자: 2025-08-13
- 현상: `/analysis` 진입 시 SWR error 발생. 콘솔에 key와 err가 동일한 문자열로 출력되는 형태 관측.
- 추정 원인: (1) Base URL 미고정 또는 상대경로 사용으로 3000으로 요청 (2) SWR 배열 키와 fetcher 시그니처 불일치, 또는 fetcher에서 Error 대신 key 문자열을 throw.

---

## 1) 환경 변수(Base URL) 확정

- `.env.local`

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001
```

- dev 재기동 후 DevTools Network에서 실제 호출이 `http://127.0.0.1:8001/api/...`로 나가는지 확인 바랍니다.

## 2) SWR 표준 패턴(강력 권장)

- 배열 키 사용 + fetcher에서 튜플 해체
- `throw new Error()`만 사용(키/문자열을 직접 throw 금지)

```ts
// src/lib/fetcher.ts
export const fetcher = async ([path, params]: [
  string,
  Record<string, any>
]) => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const qs = new URLSearchParams(
    Object.entries(params || {})
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {})
  );
  const url = `${base}${path}${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText} | ${url} | ${body}`);
  }
  return res.json();
};
```

```ts
// 사용 예: /analysis 페이지 데이터 패칭
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

const { data, error } = useSWR(
  [
    "/api/v1/items",
    {
      usage: "",
      min_minimum_bid_price: 0,
      max_minimum_bid_price: 500000,
      min_bid_ratio: 0,
      max_bid_ratio: 200,
      year_range: "1980-2024",
      p: 1,
      s: 20,
    },
  ],
  fetcher
);
```

- 문자열 키만 쓴다면 반드시 절대 URL 조립을 보장

```ts
const url = new URL("/api/v1/items", process.env.NEXT_PUBLIC_API_BASE_URL);
Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
const res = await fetch(url.toString());
if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
```

## 3) 재현/검증 체크리스트

- [ ] `.env.local`에 `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001` 지정 후 dev 재기동
- [ ] Network 탭에서 풀 URL이 8001로 향하는지 확인
- [ ] SWR 키를 배열로 전달하고, fetcher에서 `[path, params]`로 해체하는지 확인
- [ ] 에러 발생 시 Error 객체 메시지에 HTTP 상태/URL이 출력되는지 확인

## 4) 스모크 확인 커맨드 (백엔드 기준)

```bash
curl -i "http://127.0.0.1:8001/health"
curl -i "http://127.0.0.1:8001/api/v1/items/?limit=1"
```

## 5) 요청 사항

- 위 수정 적용 후 `/analysis` 재검증 결과(성공/실패 스크린샷, Network 캡처) 공유 부탁드립니다.
- fetcher/훅 코드 경로와 diff를 함께 보내주시면 백엔드가 재확인하겠습니다.

---

- Status: Requested
- Requester: Backend Team
- Assignee: Frontend Team
- Requested At: 2025-08-13
- Completed At:
- History:
  - 2025-08-13: 요청서 신규 송부
