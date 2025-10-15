## [답신] 경매결과(완료) 지도용 가까운 순 LIMIT API 제공 (251012)

### 요약

- GET `/api/v1/auction-completed/map` 엔드포인트를 추가했습니다.
- 기준점(ref_lat/lng)에서의 거리 오름차순으로 상위 K개만 반환합니다(기본 1000, 최대 2000).
- 기존 스키마 키를 유지하며, 지도 공통 키(`address`, `lat`, `lng`, `area`, `build_year`, `price`, `price_basis`)를 포함해 전달합니다. (경매 `price`는 `final_sale_price`, `price_basis="final_price"`)

### 엔드포인트

- GET `/api/v1/auction-completed/map`

### 쿼리 파라미터

- `ref_lat`: number — 기준점 위도 (필수, -90~90)
- `ref_lng`: number — 기준점 경도 (필수, -180~180)
- `limit`: number — 표시 상한(기본 1000, 최대 2000)
- `bounds.south|west|north|east`: number (옵션) — BBOX 프리필터(있으면 먼저 적용)
- 기존 필터(옵션 일부 지원):
  - 지역: `sido`, `address_city`
  - 기간: `sale_date_from`, `sale_date_to`
  - 금액: `min_final_price`, `max_final_price`
  - 면적: `min_exclusive_area`, `max_exclusive_area`, `min_land_area`, `max_land_area`
  - 층/엘리베이터: `floor_confirmation`(CSV), `elevator_available`(Y/N)
  - 상태/특수: `current_status`(CSV), `special_rights`(CSV)
- `sort`: 고정 — 서버 내부 거리 오름차순. 별도 파라미터 없음

### 응답(JSON)

```json
{
  "items": [
    {
      "id": 10071,
      "road_address_real": "...",
      "longitude": 126.8443866,
      "latitude": 37.69737848,
      "final_price": 8540,
      "construction_year_real": 2013,
      "exclusive_area_sqm": 54.5,
      "address": "...",
      "lat": 37.69737848,
      "lng": 126.8443866,
      "area": 54.5,
      "build_year": 2013,
      "price": 8540,
      "price_basis": "final_price"
    }
  ],
  "total": 7123,
  "warning": "필터 결과가 7,123건입니다. 가까운 순 상위 1,000건만 반환했습니다.",
  "echo": {
    "ref_lat": 37.69737848,
    "ref_lng": 126.8443866,
    "limit": 1000,
    "bounds": { "south": 37.6, "west": 126.7, "north": 37.8, "east": 127.0 }
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
curl -G "http://127.0.0.1:8000/api/v1/auction-completed/map" \
  --data-urlencode "ref_lat=37.55" \
  --data-urlencode "ref_lng=127.00" \
  --data-urlencode "limit=1000"
```

```bash
curl -G "http://127.0.0.1:8000/api/v1/auction-completed/map" \
  --data-urlencode "ref_lat=37.55" \
  --data-urlencode "ref_lng=127.00" \
  --data-urlencode "limit=1000" \
  --data-urlencode "bounds.south=37.4" \
  --data-urlencode "bounds.west=126.8" \
  --data-urlencode "bounds.north=37.7" \
  --data-urlencode "bounds.east=127.2" \
  --data-urlencode "sido=서울특별시" \
  --data-urlencode "address_city=서울특별시 강남구"
```

### 롤아웃/플래그(권장)

- FE 기본값을 server로 권장합니다. 필요 시 `NEXT_PUBLIC_MAP_NEAREST_LIMIT_AUCTION=client`로 폴백 동작을 강제할 수 있습니다.
- rent/sale과 동일 패턴으로 동작하며, 지도 공통 키/응답 구조도 동일합니다.

### FE 연동 가이드

- 지도 초기 로딩 시 `ref_lat/lng=초기 분석 좌표`, `limit=표시 상한`으로 요청
- 응답 `items` 그대로 렌더(클라이언트 측 거리 정렬 제거)
- `warning` 존재 시 UI 토스트/배지 등으로 안내(선택)
- 장애/일시 미지원 시 `client` 폴백으로 전환 가능

### 확인 요청 (FE)

- 1. 초기 화면에서 사용할 `limit` 값(예: 100/300/500/1000) 확정 요청드립니다.
- 2. 지도 줌 레벨 기준으로 `bounds.*`(BBOX) 전송 여부/기준 공유 부탁드립니다.
- 3. 상태/특수/층/엘리베이터 필터 파라미터 네이밍/값 형식 확인 부탁드립니다.

### 연락처

- BE: 경매결과 API 담당자
