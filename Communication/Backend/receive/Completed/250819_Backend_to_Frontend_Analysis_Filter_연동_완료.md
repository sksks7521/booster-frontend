# [완료 회신] Analysis 필터 백엔드 연동 정상화 (Backend → Frontend)

- 상태: Completed
- 날짜: 2025-08-19

---

## 1) 결론

- DB 복구 및 데이터 적재(auction_items 1000건) 완료, API 정상 응답
- 프론트는 기존 코드 그대로 `.env.local`의 `NEXT_PUBLIC_API_BASE_URL`만 `http://127.0.0.1:8000`로 맞추면 동작합니다.

## 2) 사용 API (카탈로그)

- 주소 트리(간단 구조)
  - `GET /api/v1/locations/tree-simple`
  - 응답 예시(요약):
    ```json
    {
      "provinces": ["서울특별시", "경기도", ...],
      "cities": { "경기도": ["수원시", "성남시", ...], ... },
      "districts": { "수원시": ["영통구", "팔달구", ...], ... }
    }
    ```
- 시도 목록
  - `GET /api/v1/locations/sido`
  - 응답: `[ { code, name, count } ]`
- 시군구 목록
  - `GET /api/v1/locations/cities?sido=<이름>` 또는 `?sido_code=<코드>`
- 읍면동 목록
  - `GET /api/v1/locations/towns?sido=<이름>&city=<이름>` 또는 `?city_code=<코드>`
- 아이템 목록(간소)
  - `GET /api/v1/items/simple`
  - 주요 쿼리 파라미터(모두 선택적):
    - 지역: `sido` | `sido_code`, `city` | `city_code`, `town` | `town_code`
    - 가격(만원): `minPrice`, `maxPrice`
    - 면적(평): `minArea`, `maxArea`
    - 건축연도: `minYearBuilt`, `maxYearBuilt`
    - 건물유형: `usage`
    - 엘리베이터: `hasElevator=true|false`
    - 경매상태: `currentStatus`
    - 페이지네이션: `page`, `size` (기본 size=20)

## 3) 요청/응답 예시

- 주소 트리 로드

  ```bash
  curl "http://127.0.0.1:8000/api/v1/locations/tree-simple"
  ```

- 시도/시군구/읍면동 단계 로드

  ```bash
  curl "http://127.0.0.1:8000/api/v1/locations/sido"
  curl "http://127.0.0.1:8000/api/v1/locations/cities?sido=경기도"
  curl "http://127.0.0.1:8000/api/v1/locations/towns?sido=경기도&city=수원시"
  ```

- 아이템 목록(예: 경기도 수원시, 가격 2억~6억, 면적 10~40평)
  ```bash
  curl "http://127.0.0.1:8000/api/v1/items/simple?sido=경기도&city=수원시&minPrice=2000&maxPrice=6000&minArea=10&maxArea=40&page=1&size=20"
  ```

## 4) 프론트 연동 가이드 (코드 스니펫)

- 환경변수

  ```bash
  # .env.local
  NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
  ```

- 공통 fetcher

  ```typescript
  // lib/fetcher.ts
  const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
  export const apiGet = async <T>(path: string): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };
  ```

- 주소 트리 로드 및 선택 연쇄

  ```typescript
  // hooks/useLocationsSimple.ts
  import useSWR from "swr";
  import { apiGet } from "@/lib/fetcher";

  type LocationSimpleTree = {
    provinces: string[];
    cities: Record<string, string[]>;
    districts: Record<string, string[]>;
  };

  export function useLocationsSimple() {
    const { data, isLoading, error } = useSWR<LocationSimpleTree>(
      "/api/v1/locations/tree-simple",
      apiGet
    );
    return { data, isLoading, error };
  }
  ```

- 아이템 목록(필터 적용)

  ```typescript
  // hooks/useItemsSimple.ts
  import useSWR from "swr";
  import { apiGet } from "@/lib/fetcher";

  export function useItemsSimple(params: URLSearchParams) {
    const qs = params.toString();
    const { data, isLoading, error } = useSWR(
      `/api/v1/items/simple?${qs}`,
      apiGet
    );
    return { data, isLoading, error };
  }
  ```

- 필터 파라미터 구성 예시
  ```typescript
  const params = new URLSearchParams();
  params.set("sido", selectedSido);
  params.set("city", selectedCity);
  if (minPrice) params.set("minPrice", String(minPrice));
  if (maxPrice) params.set("maxPrice", String(maxPrice));
  if (minArea) params.set("minArea", String(minArea));
  if (maxArea) params.set("maxArea", String(maxArea));
  if (minYear) params.set("minYearBuilt", String(minYear));
  if (maxYear) params.set("maxYearBuilt", String(maxYear));
  if (usage) params.set("usage", usage);
  if (hasElevator !== undefined) params.set("hasElevator", String(hasElevator));
  params.set("page", String(page));
  params.set("size", String(size));
  ```

## 5) QA 체크리스트

- 환경변수: Base URL이 실제 서버 포트와 일치한다
- 초기 로드: `tree-simple` 200 OK, `provinces` 길이 ≥ 1
- 필터 연쇄: 시도 선택 시 시군구 목록이 제한되고, 시군구 선택 시 읍면동 목록이 제한된다
- 목록 필터링: 가격/면적/연도/유형/엘리베이터 조합 시 결과가 합리적으로 변한다
- 네트워크: CORS 에러 없음, 응답 시간 < 1s(로컬 기준)

## 6) 트러블슈팅

- 목록/주소가 비어있음 → DB에 데이터가 없거나 포트/ENV 불일치
  - 확인: `python scripts/verify_data.py --table auction_items`
  - 적재: `python scripts/load_data.py --table auction_items --limit 1000`
- CORS 에러 → 백엔드 `BACKEND_CORS_ORIGINS`에 `http://localhost:3000`,`http://127.0.0.1:3000` 포함
- 포트 불일치 → 백엔드 실제 포트(8000/8001)와 프론트 Base URL 일치
- 콘솔 한글 깨짐 → PowerShell에서 `chcp 65001` + `$OutputEncoding = ...UTF8...`

## 7) 검증 결과(요약)

- `/api/v1/locations/sido` → 200 OK, 데이터 반환
- `/api/v1/locations/tree-simple` → 200 OK, { provinces/cities/districts }
- `/api/v1/items/simple` → 200 OK

## 8) 참고

- PowerShell 콘솔에서 한글이 깨져 보일 수 있습니다(브라우저/프론트에서는 정상). 필요 시 아래 설정:
  - 일시: `chcp 65001` 후 `$OutputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()`
  - 영구: `notepad $PROFILE` 열어 위 2줄 추가 후 저장

---

Backend 담당 드림.
