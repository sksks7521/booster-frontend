# Frontend → Backend: Listings(매물) API 연동 요청

## 1) 목적

- v2 상세 페이지의 `매물(listings)` 탭을 실제 백엔드 데이터로 연동하기 위한 최소 API 계약 확정 및 제공 요청
- 프론트는 현재 목업 기반으로 스모크/E2E 검증까지 완료했으며, 실 API 전환만 남았습니다.

## 2) 요구사항 요약(필수)

- 목록 API와 정렬 가능 컬럼 메타 API 2종 제공
- 페이지네이션: page/size 방식(1-base page)
- 지도 필터: bbox 또는 center+radius_km 중 택1(둘 다 오면 center+radius_km 우선)
- 응답 표준: `{ items, total, page, size }` 형태, items는 공통 키 준수

## 3) 엔드포인트 제안

- GET `/api/v1/listings/`
- GET `/api/v1/listings/columns`

### 3-1) 목록 API 쿼리 파라미터

- 위치(행정):
  - `province` (시/도명)
  - `cityDistrict` (시/군/구명)
  - `town` (읍/면/동, 선택)
- 지도(택1):
  - bbox: `south, west, north, east`
  - 반경: `lat, lng, radius_km`
- 페이지네이션: `page, size` (권장 size ≤ 100)
- 정렬: `sort_by, sort_order` (asc|desc)
- 선택 필터(초기 최소):
  - 가격: `price_min, price_max` (만원)
  - 면적: `area_min, area_max` (㎡)
  - 건축년도: `build_year_min, build_year_max`

### 3-2) 목록 API 응답 스키마(표준)

{
"items": [
{
"id": "string",
"address": "string",
"price": 12345,
"area": 84.96,
"buildYear": 2008,
"lat": 37.5665,
"lng": 126.978,
"extra": { "postedAt": "2025-08-28" }
}
],
"total": 120,
"page": 1,
"size": 20
}

### 3-3) 정렬 컬럼 메타

- GET `/api/v1/listings/columns` → `{ "sortable_columns": ["price", "area", "buildYear", "postedAt" ] }`
- 프론트는 이 목록에 포함된 컬럼만 정렬 허용(화이트리스트)

## 4) 에러/상한/기타

- 에러 포맷: `{ code, message, details? }` (전역 표준과 동일)
- bbox 면적 상한: 내부 정책이 있다면 응답 400으로 가이드 (프론트도 약 1,500㎢ 상한 가드 적용 중)
- 인증/권한: 공개 데이터면 무인증, 아니면 헤더/쿠키 스펙 공유 요청
- CORS: 프론트 도메인 허용 필요 시 포함

## 5) 예시 요청

- 반경 검색(서울 시청 기준 2km, 1페이지 20개, 가격 desc)

```
curl -G 'https://{HOST}/api/v1/listings/' \
  --data-urlencode 'lat=37.5665' \
  --data-urlencode 'lng=126.978' \
  --data-urlencode 'radius_km=2' \
  --data-urlencode 'page=1' \
  --data-urlencode 'size=20' \
  --data-urlencode 'sort_by=price' \
  --data-urlencode 'sort_order=desc'
```

- bbox 검색(강동구 일대)

```
curl -G 'https://{HOST}/api/v1/listings/' \
  --data-urlencode 'south=37.52' \
  --data-urlencode 'west=127.10' \
  --data-urlencode 'north=37.57' \
  --data-urlencode 'east=127.20' \
  --data-urlencode 'page=1' --data-urlencode 'size=50'
```

## 6) 일정/전환

- 프론트는 API URL/스키마 확정 후 당일 내 전환 가능
- 컬럼 메타 합류 시 정렬 UI 화이트리스트 즉시 연결(기 구현 완료)

## 7) 추가 확인 항목(선택)

- 전월세 `price_basis`(옵션 B) 정책 확정 시, `real-rents` 응답에 `{ price_basis, price_k }` 지속 제공 여부 확인
- `real-rents` 반경 파라미터는 OpenAPI v1 기준(`lat_center/lng_center`)으로 프론트 이미 대응 중. 최종 키 확정 재확인 요청

---

담당: FE (v2 listings 연동)
요청일: 2025-08-28
