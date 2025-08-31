# User Preferences API 사용 가이드 (Frontend)

본 문서는 프론트엔드에서 사용자별 UI 설정(예: 분석 페이지 컬럼 순서)을 저장/조회/삭제하기 위한 사용 예시를 제공합니다.

- 기본 엔드포인트: `/api/v1/user-preferences/{page}/{key}`
- 메서드: GET, PUT, DELETE
- 인증: 운영 시 실제 인증 훅 사용(임시로 mock 인증일 수 있음)

## 1) 컬럼 순서 저장 (PUT)

```ts
// 예시: 분석 페이지의 컬럼 순서를 저장
const saveColumnOrder = async (order: string[]) => {
  const res = await fetch(`/api/v1/user-preferences/analysis/column_order`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page: "analysis",
      key: "column_order",
      value: order,
    }),
    credentials: "include", // 인증 쿠키 사용 시
  });
  if (!res.ok) throw new Error("Failed to save column order");
  return res.json();
};
```

## 2) 컬럼 순서 조회 (GET)

```ts
const getColumnOrder = async (): Promise<string[] | null> => {
  const res = await fetch(`/api/v1/user-preferences/analysis/column_order`, {
    method: "GET",
    credentials: "include",
  });
  if (res.status === 404) return null; // 설정 없을 때
  if (!res.ok) throw new Error("Failed to fetch column order");
  const data = await res.json();
  return data?.value ?? null;
};
```

## 3) 컬럼 순서 삭제 (DELETE)

```ts
const deleteColumnOrder = async () => {
  const res = await fetch(`/api/v1/user-preferences/analysis/column_order`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete column order");
};
```

## 4) React 훅 예시

```tsx
import { useEffect, useState, useCallback } from "react";

export function useColumnOrder(defaultOrder: string[]) {
  const [order, setOrder] = useState<string[]>(defaultOrder);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await getColumnOrder();
        if (saved && saved.length > 0) setOrder(saved);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = useCallback(async (next: string[]) => {
    await saveColumnOrder(next);
    setOrder(next);
  }, []);

  const reset = useCallback(async () => {
    await deleteColumnOrder();
    setOrder(defaultOrder);
  }, [defaultOrder]);

  return { order, setOrder: save, reset, loading };
}
```

## 5) UI 적용 예시

```tsx
// columns: 전체 컬럼 정의, order: 사용자 순서
function applyOrder(columns: string[], order: string[]) {
  const set = new Set(order);
  const ordered = order.filter((c) => columns.includes(c));
  const rest = columns.filter((c) => !set.has(c));
  return [...ordered, ...rest];
}
```

## 6) 주의 사항

- 운영 환경에서는 실제 인증/인가 훅이 적용되어야 하며, 사용자별로 분리 저장됩니다.
- `value`는 JSON 타입으로, 페이지별 다양한 설정(UI 필터 기본값 등) 저장에 재사용 가능합니다.
- 에러 응답은 표준 에러 처리(토스트/모달)로 사용자에게 알립니다.

---

## 7) 엔드포인트 요약

- 기본 경로: `/api/v1/user-preferences/{page}/{key}`
- 메서드/동작:
  - `GET` → 해당 `{page, key}`에 대한 사용자 설정 조회 (없으면 404)
  - `PUT` → 해당 `{page, key}`에 대한 설정 생성/갱신(UPSERT)
  - `DELETE` → 해당 `{page, key}` 설정 삭제(idempotent)

## 8) 인증/권한

- 운영: 쿠키 세션 또는 `Authorization: Bearer <token>` 중 택1
- 로컬(mock): 인증 훅 대체 시 서버가 임시 사용자로 처리 가능
- 프론트 요청 시 권장:
  - 쿠키 기반: `credentials: "include"`
  - 토큰 기반: `headers.Authorization = "Bearer ..."`

## 9) 요청/응답 스키마

- PUT 요청 바디

```json
{
  "page": "analysis",
  "key": "column_order",
  "value": ["sale_date", "usage", "price"]
}
```

- 성공 응답(예시)

```json
{
  "id": 123,
  "user_id": 45,
  "page": "analysis",
  "key": "column_order",
  "value": ["sale_date", "usage", "price"],
  "created_at": "2025-08-26T12:34:56+09:00",
  "updated_at": "2025-08-26T12:35:10+09:00"
}
```

- 에러 응답(예시)

```json
{
  "detail": "Not authenticated"
}
```

## 10) curl 예시

```bash
# 저장(UPSERT)
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"page":"analysis","key":"column_order","value":["sale_date","usage","price"]}' \
  http://127.0.0.1:8000/api/v1/user-preferences/analysis/column_order

# 조회
curl http://127.0.0.1:8000/api/v1/user-preferences/analysis/column_order

# 삭제
curl -X DELETE http://127.0.0.1:8000/api/v1/user-preferences/analysis/column_order
```

---

## 완료 로그

- 상태: Completed (가이드 배포 완료)
- 이동: Communication/Frontend/send/Completed/250826_UserDB_API_Documentation.md
- 완료일: 2025-08-30
- 메모: User Preferences API 가이드 제공 완료, 프론트 통합 가이드와 정합.

## 11) SWR 통합 예시

```ts
import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => {
    if (r.status === 404) return null;
    if (!r.ok) throw new Error("fetch failed");
    return r.json();
  });

export function useColumnOrderSWR(defaultOrder: string[]) {
  const { data, isLoading, mutate, error } = useSWR(
    "/api/v1/user-preferences/analysis/column_order",
    fetcher
  );

  const order: string[] = data?.value?.length ? data.value : defaultOrder;

  const save = async (next: string[]) => {
    const res = await fetch("/api/v1/user-preferences/analysis/column_order", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: "analysis",
        key: "column_order",
        value: next,
      }),
      credentials: "include",
    });
    if (!res.ok) throw new Error("save failed");
    const saved = await res.json();
    await mutate(saved, false); // 낙관적 업데이트
  };

  const reset = async () => {
    const res = await fetch("/api/v1/user-preferences/analysis/column_order", {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("delete failed");
    await mutate(null, false);
  };

  return { order, save, reset, isLoading, error };
}
```

## 12) DnD(드래그 앤 드롭) 적용 예시

```tsx
// onDragEnd 시점에 저장 트리거
function onDragEnd(nextOrder: string[], save: (v: string[]) => Promise<void>) {
  // 1) UI 상태 반영(로컬)
  // 2) 서버 저장
  void save(nextOrder);
}
```

## 13) 기타 자주 묻는 질문(FAQ)

- 기본값은 어디서 오나요?
  - 프론트가 보유한 `defaultOrder`를 기준으로 하되, 서버 저장값이 있으면 서버값을 우선합니다.
- 다중 기기 동기화는 되나요?
  - 같은 계정이면 서버 저장값을 조회하므로 자동 동기화됩니다.
- 다른 설정도 저장 가능한가요?
  - 네. 같은 패턴으로 `page`, `key`만 바꿔 `value`에 JSON 구조를 저장하면 됩니다(예: 필터 기본값).

---

## 14) TL;DR (바로 붙여 쓰는 최소 예시)

```ts
// 1) 조회(없으면 null)
const getColumnOrder = async (): Promise<string[] | null> => {
  const r = await fetch("/api/v1/user-preferences/analysis/column_order", {
    credentials: "include",
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("failed");
  return (await r.json())?.value ?? null;
};

// 2) 저장(UPSERT)
const saveColumnOrder = async (order: string[]) => {
  const r = await fetch("/api/v1/user-preferences/analysis/column_order", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page: "analysis",
      key: "column_order",
      value: order,
    }),
    credentials: "include",
  });
  if (!r.ok) throw new Error("failed");
};
```

## 15) 환경/베이스 URL/CORS 체크리스트

- 베이스 URL: 프론트에서 호출하는 호스트가 백엔드 CORS에 등록되어야 합니다.
- 쿠키 세션 사용 시: `credentials: "include"` + 백엔드 CORS에 `allow_credentials=true` 필요.
- 토큰 사용 시: `Authorization: Bearer <token>` 헤더.
- 프록시(예: Next.js rewrite) 사용 시: 네트워크 콘솔에서 실제 호출 URL이 백엔드로 전달되는지 확인.

## 16) TypeScript 타입 명세(권장)

```ts
export type PreferenceValue = unknown; // 자유로운 JSON 구조

export interface UserPreferenceDTO {
  id: number;
  user_id: number;
  page: string;
  key: string;
  value: PreferenceValue;
  created_at: string;
  updated_at: string;
}

export interface PutPreferencePayload {
  page: string; // 예: "analysis"
  key: string; // 예: "column_order"
  value: PreferenceValue; // 예: string[]
}
```

## 17) 오류 코드/UX 규약 제안

- 200/201: 성공(조회/생성·갱신). 토스트 "저장되었습니다"는 과도할 경우 생략하고 아이콘/스낵 최소화.
- 204(DELETE): 성공 삭제. 스낵/토스트 선택적으로 표시.
- 401: 인증 만료 → 로그인 모달/페이지로 유도.
- 403: 권한 부족 → 읽기 전용 안내.
- 404(GET): 설정 없음 → `defaultOrder` 적용, 에러 UI 금지.
- 5xx: 서버 오류 → 재시도 버튼 노출 + 오류 리포팅(Sentry 등).

## 18) Axios 사용 예시(선택)

```ts
import axios from "axios";

const api = axios.create({
  baseURL: "/",
  withCredentials: true, // 쿠키 세션 시
});

export const getColumnOrderAx = async () => {
  try {
    const { data } = await api.get<UserPreferenceDTO>(
      "/api/v1/user-preferences/analysis/column_order"
    );
    return data.value as string[];
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
};
```

## 19) Next.js App Router 예시

### 19.1 서버 액션(쿠키 세션 가정)

```ts
// app/actions/userPreferences.ts
"use server";

export async function saveColumnOrderAction(next: string[]) {
  const r = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/api/v1/user-preferences/analysis/column_order`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: "analysis",
        key: "column_order",
        value: next,
      }),
      credentials: "include",
      cache: "no-store",
    }
  );
  if (!r.ok) throw new Error("save failed");
}
```

### 19.2 서버 라우트 핸들러(프록시)

```ts
// app/api/user-preferences/analysis/column_order/route.ts
import { NextRequest, NextResponse } from "next/server";

const upstream = `${process.env.NEXT_PUBLIC_API_BASE}/api/v1/user-preferences/analysis/column_order`;

export async function GET() {
  const r = await fetch(upstream, {
    credentials: "include",
    cache: "no-store",
  });
  return new NextResponse(await r.text(), {
    status: r.status,
    headers: r.headers,
  });
}

export async function PUT(req: NextRequest) {
  const r = await fetch(upstream, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: await req.text(),
    credentials: "include",
  });
  return new NextResponse(await r.text(), {
    status: r.status,
    headers: r.headers,
  });
}

export async function DELETE() {
  const r = await fetch(upstream, { method: "DELETE", credentials: "include" });
  return new NextResponse(await r.text(), {
    status: r.status,
    headers: r.headers,
  });
}
```

## 20) dnd-kit 연동 예시(간단)

```tsx
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";

export function ColumnsDnd({
  columns,
  order,
  onSave,
}: {
  columns: string[];
  order: string[];
  onSave: (next: string[]) => Promise<void>;
}) {
  const handleDragEnd = (e: DragEndEvent) => {
    // e.active.id, e.over?.id 를 기반으로 order 재계산 (생략)
    const next = order; // TODO: 실제 재정렬 결과로 교체
    void onSave(next); // 저장 트리거
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {/* 드래그 가능한 리스트 구현 (생략) */}
    </DndContext>
  );
}
```

## 21) 오프라인/로컬스토리지 폴백(선택)

```ts
const LS_KEY = "analysis.column_order";

export async function getOrderWithFallback(defaultOrder: string[]) {
  try {
    return (
      (await getColumnOrder()) ??
      JSON.parse(localStorage.getItem(LS_KEY) || "null") ??
      defaultOrder
    );
  } catch {
    return JSON.parse(localStorage.getItem(LS_KEY) || "null") ?? defaultOrder;
  }
}

export async function saveOrderWithFallback(next: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(next));
  try {
    await saveColumnOrder(next);
  } catch {
    /* 네트워크 복구 후 재시도 */
  }
}
```

## 22) 성능/레이스 가이드

- 저장 호출은 디바운스(예: 300~500ms) 권장.
- 동시 저장 충돌 방지: 같은 키에 대해 한 번에 하나의 요청만 보내기(연속 드래그 시 마지막만 전송).
- 서버는 최종 저장(Last-Write-Wins)으로 간주. 필요한 경우 `updated_at` 비교 및 사용자 경고 고려.

## 23) 테스트 시나리오 체크리스트

- 404 → defaultOrder 적용되는지
- PUT 후 GET 재조회 시 반영되는지(SWR/캐시 무효화 확인)
- DELETE 후 GET 404 되는지
- 인증 만료(401) 시 UX 동작(로그인 유도) 확인
- CORS/쿠키 설정 정상 여부(네트워크 탭에서 Set-Cookie/쿠키 포함 확인)

## 24) 네이밍/페이지·키 전략

- page: 화면 단위(예: `analysis`, `dashboard`), 소문자-스네이크케이스 권장
- key: 설정 항목(예: `column_order`, `filter_defaults`), 소문자-스네이크케이스 권장
- value: JSON 자유형(배열/객체/스칼라). PII 금지(개인 식별 정보 저장하지 않음)

---

## 25) 실제 통합 샘플(분석 페이지 가상 컴포넌트)

```tsx
import { useEffect, useMemo } from "react";

// 앞서 정의한 훅/함수들이 존재한다고 가정(getColumnOrder/saveColumnOrder 등)
import { useColumnOrderSWR } from "./hooks/useColumnOrderSWR";

const DEFAULT_ORDER = [
  "sale_date",
  "usage",
  "price",
  "area",
  "address",
] as const;
type ColumnKey = (typeof DEFAULT_ORDER)[number];

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "sale_date", label: "매각일자" },
  { key: "usage", label: "용도" },
  { key: "price", label: "가격" },
  { key: "area", label: "면적" },
  { key: "address", label: "주소" },
];

export function AnalysisTable() {
  const { order, save, isLoading } = useColumnOrderSWR(
    DEFAULT_ORDER as unknown as string[]
  );

  const orderedColumns = useMemo(() => {
    const set = new Set(order);
    const safeOrder = order.filter((k) => ALL_COLUMNS.some((c) => c.key === k));
    const rest = ALL_COLUMNS.map((c) => c.key).filter((k) => !set.has(k));
    return [...safeOrder, ...rest] as ColumnKey[];
  }, [order]);

  useEffect(() => {
    // 초기에 필요한 데이터 로딩 or 컬럼 기반 UI 초기화
  }, []);

  if (isLoading) return <div>로딩 중…</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        {orderedColumns.map((key) => (
          <span key={key} style={{ padding: 4, border: "1px solid #ddd" }}>
            {ALL_COLUMNS.find((c) => c.key === key)?.label}
          </span>
        ))}
      </div>
      {/* DnD로 순서를 바꾼 뒤 save(nextOrder) 호출 */}
    </div>
  );
}
```

## 26) dnd-kit 정렬 로직 예시(실제 재정렬 구현)

```ts
// 배열 재정렬 유틸
export function arrayMove<T>(
  list: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const clone = list.slice();
  const [moved] = clone.splice(fromIndex, 1);
  clone.splice(toIndex, 0, moved);
  return clone;
}

// DragEnd 이벤트로부터 nextOrder 계산
import type { DragEndEvent } from "@dnd-kit/core";

export function calcNextOrder(
  currentOrder: string[],
  e: DragEndEvent
): string[] {
  const activeId = e.active.id as string;
  const overId = e.over?.id as string | undefined;
  if (!overId || activeId === overId) return currentOrder;
  const from = currentOrder.indexOf(activeId);
  const to = currentOrder.indexOf(overId);
  if (from < 0 || to < 0) return currentOrder;
  return arrayMove(currentOrder, from, to);
}
```

## 27) react-beautiful-dnd 대체 예시

```tsx
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";

export function ColumnsRBD({
  order,
  onSave,
}: {
  order: string[];
  onSave: (v: string[]) => Promise<void>;
}) {
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const next = Array.from(order);
    const [removed] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, removed);
    await onSave(next);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="cols" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{ display: "flex", gap: 8 }}
          >
            {order.map((k, i) => (
              <Draggable draggableId={k} index={i} key={k}>
                {(p) => (
                  <span
                    ref={p.innerRef}
                    {...p.draggableProps}
                    {...p.dragHandleProps}
                    style={{ padding: 4, border: "1px solid #ddd" }}
                  >
                    {k}
                  </span>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
```

## 28) 디바운스/레이스 제어 유틸

```ts
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  wait = 300
) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// 같은 키에 대해 동시에 저장 호출되는 것을 방지하는 간단한 락
const saveLocks = new Map<string, Promise<any> | null>();

export async function saveWithLock(key: string, runner: () => Promise<any>) {
  if (saveLocks.get(key)) return saveLocks.get(key);
  const p = runner().finally(() => saveLocks.set(key, null));
  saveLocks.set(key, p);
  return p;
}
```

## 29) SWR 고급 옵션(권장 프리셋)

```ts
const { data, isLoading, mutate } = useSWR(
  "/api/v1/user-preferences/analysis/column_order",
  fetcher,
  {
    revalidateOnFocus: false,
    dedupingInterval: 1_000,
    shouldRetryOnError: false,
    keepPreviousData: true,
  }
);
```

## 30) 서버 값 검증/가드(방어적 코딩)

```ts
function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

export function normalizeOrder(defaultOrder: string[], serverValue: unknown) {
  if (!isStringArray(serverValue)) return defaultOrder;
  // 중복 제거 + 허용 컬럼만 유지
  const allow = new Set(defaultOrder);
  const uniq = Array.from(new Set(serverValue)).filter((k) => allow.has(k));
  const missing = defaultOrder.filter((k) => !uniq.includes(k));
  return [...uniq, ...missing];
}
```

## 31) 레거시 로컬스토리지 → 서버 마이그레이션

```ts
const LS_KEY = "analysis.column_order";

export async function migrateLocalToServer(defaultOrder: string[]) {
  const legacy = localStorage.getItem(LS_KEY);
  if (!legacy) return;
  try {
    const parsed = JSON.parse(legacy);
    if (Array.isArray(parsed) && parsed.length) {
      await saveColumnOrder(parsed);
      localStorage.removeItem(LS_KEY);
    }
  } catch {}
}
```

## 32) 배치 저장 헬퍼(여러 키 동시 저장)

```ts
type PreferenceEntry = { page: string; key: string; value: unknown };

export async function savePreferencesBatch(entries: PreferenceEntry[]) {
  // 서버에 별도 배치 엔드포인트가 없다면 순차 처리
  for (const e of entries) {
    const url = `/api/v1/user-preferences/${encodeURIComponent(
      e.page
    )}/${encodeURIComponent(e.key)}`;
    const r = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(e),
      credentials: "include",
    });
    if (!r.ok) throw new Error(`save failed: ${e.page}/${e.key}`);
  }
}
```

## 33) 에러 UX 예시(토스트/재시도)

```ts
async function safeSave(next: string[]) {
  try {
    await saveColumnOrder(next);
    toast.success("저장되었습니다");
  } catch (e) {
    toast.error("저장 실패. 네트워크 확인 후 다시 시도해주세요.");
  }
}
```

## 34) QA 체크리스트(프론트 시나리오)

- 404 → defaultOrder 적용 및 경고 미표시
- 저장 후 새로고침 시에도 동일 순서 유지
- 연속 드래그 시 마지막 상태만 저장(디바운스/락 동작)
- 다른 브라우저/기기에서 로그인 시 동일 순서 반영
- 로그아웃/다른 계정 로그인 시 각각 독립 저장

## 35) 트러블슈팅

- 401/403이 발생해요
  - 쿠키/토큰 전달 여부 확인(`credentials: "include"`, `Authorization` 헤더)
  - 백엔드 CORS `allow_credentials` 설정 확인
- 저장해도 반영이 안 돼요
  - SWR `mutate` 또는 refetch 호출 확인
  - 서버 응답의 `value` 포맷 점검, `normalizeOrder` 적용 검토
- CORS 에러가 떠요
  - 콘솔 네트워크 탭에서 프런트 호출 도메인이 백엔드에 허용되어 있는지 확인
