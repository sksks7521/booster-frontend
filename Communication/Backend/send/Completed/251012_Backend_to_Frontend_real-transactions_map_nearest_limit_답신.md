## [답신] 실거래가(전월세) 지도용 가까운 순 LIMIT API 제공 (251012)

### 요약

- GET `/api/v1/real-transactions/map` 엔드포인트를 추가했습니다.
- 기준점(ref_lat/lng)에서의 거리 오름차순으로 상위 K개만 반환합니다(기본 1000, 최대 2000).
- 기존 스키마 키를 유지하며, 지도 공통 키(`address`, `lat`, `lng`, `area`, `build_year`, `price`, `price_basis`)를 포함해 전달합니다.

### 엔드포인트

- GET `/api/v1/real-transactions/map`

### 쿼리 파라미터

- `dataset`: string, `["rent" | "sale"]` — 1차는 "rent" 기준 (추후 sale 확장)
- `ref_lat`: number — 기준점 위도 (필수, -90~90)
- `ref_lng`: number — 기준점 경도 (필수, -180~180)
- `limit`: number — 표시 상한(기본 1000, 최대 2000)
- `south/west/north/east`: number (옵션) — BBOX 프리필터(있으면 먼저 적용)
- 기존 필터(옵션 일부 지원): `sido`, `sigungu`, `admin_dong_name`, `contract_year`, `contract_month`, `min_transaction_amount`, `max_transaction_amount`
- `sort`: 고정 — 서버 내부에서 거리 오름차순. 별도 파라미터 없음

### 응답(JSON)

```json
{
  "items": [
    {
      "id": 123,
      "road_address_real": "...",
      "longitude": 127.0,
      "latitude": 37.5,
      "transaction_amount": 23500,
      "construction_year_real": 2005,
      "exclusive_area_sqm": 46.04,
      // ... 기존 키들 ...
      "address": "...",
      "lat": 37.5,
      "lng": 127.0,
      "area": 46.04,
      "build_year": 2005,
      "price": 23500,
      "price_basis": "transaction_amount"
    }
  ],
  "total": 7123,
  "warning": "필터 결과가 7,123건입니다. 가까운 순 상위 1,000건만 반환했습니다.",
  "echo": {
    "dataset": "rent",
    "ref_lat": 37.5,
    "ref_lng": 127.0,
    "limit": 1000,
    "bounds": { "south": 37.4, "west": 126.8, "north": 37.7, "east": 127.2 }
  }
}
```

### 에러/경고 정책

- 파라미터 오류: 400 + 메시지 (예: `ref_lat`/`ref_lng` 범위 초과)
- 데이터 과다: `warning`에 안내(예: 상한 초과 시 "상위 K건만 반환")
- 내부 오류: 500 + 메시지(로그 ID는 서버 로그에 기록)

### 성능/설계 메모

- 현재는 PostGIS 없이 위경도 기반 근사 거리(경도축 `cos(lat)` 보정)로 정렬합니다.
- 대용량/정밀 KNN이 필요하면 PostGIS 인덱스(`geometry/geography` + `GiST`)로 확장 가능합니다.
- BBOX 프리필터가 있을 경우 먼저 적용되어 네트워크/CPU 사용량을 줄입니다.

### 예시(curl)

```bash
curl -G "http://127.0.0.1:8000/api/v1/real-transactions/map" \
  --data-urlencode "dataset=rent" \
  --data-urlencode "ref_lat=37.55" \
  --data-urlencode "ref_lng=127.00" \
  --data-urlencode "limit=1000"
```

```bash
curl -G "http://127.0.0.1:8000/api/v1/real-transactions/map" \
  --data-urlencode "dataset=rent" \
  --data-urlencode "ref_lat=37.55" \
  --data-urlencode "ref_lng=127.00" \
  --data-urlencode "limit=1000" \
  --data-urlencode "south=37.4" \
  --data-urlencode "west=126.8" \
  --data-urlencode "north=37.7" \
  --data-urlencode "east=127.2" \
  --data-urlencode "sido=서울특별시" \
  --data-urlencode "sigungu=서울특별시 강남구"
```

### 롤아웃/플래그(권장)

- `NEXT_PUBLIC_MAP_NEAREST_LIMIT_RENT`: `server` | `client`
  - `server`: 본 API 사용(권장)
  - `client`: 기존 전체 응답 후 클라이언트 Top-K 폴백
- 1차는 `dataset=rent`를 대상. `sale`/`auction_*`는 동일 패턴으로 확장 예정 시 별도 공지

### FE 연동 가이드

- 지도 초기 로딩 시 `ref_lat/lng=초기 분석 좌표`, `limit=표시 상한`으로 요청
- 응답 `items` 그대로 렌더 (클라이언트 측 거리 정렬 제거)
- `warning` 존재 시 UI 토스트/배지 등으로 안내(선택)
- 장애/일시 미지원 시 `client` 폴백으로 전환 가능

### 확인 요청 (FE)

- 1. 1차 대상 `dataset=rent`로 적용해도 되는지 확인 부탁드립니다.
- 2. 초기 화면에서 사용할 `limit` 값(예: 1000) 확정 요청드립니다.
- 3. BBOX 프리필터를 즉시 적용할지(줌 레벨 기준) 여부 공유 부탁드립니다.

### 연락처

- BE: 실거래가 API 담당자
