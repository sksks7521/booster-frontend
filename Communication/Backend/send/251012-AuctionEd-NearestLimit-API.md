### 경매결과(완료) 지도용 가까운 순 LIMIT API 요청서 (2025-10-12)

목적

- 지도 표시상한(예: 100/300/500/1000 등)을 기준점(초기 분석 좌표)으로부터 가까운 순으로 선정하여 내려받기 위한 서버 API 제공
- 현재 FE는 rent/sale에서 서버 KNN을 적용 완료. auction_ed(과거 경매결과)에도 동일 정책을 적용하고자 함

엔드포인트(제안)

- GET `/api/v1/auction-completed/map`

쿼리 파라미터

- ref_lat: number — 기준점 위도(필수, −90~90)
- ref_lng: number — 기준점 경도(필수, −180~180)
- limit: number — 표시 상한(기본 1000, 최대 2000)
- bounds.south|west|north|east: number (옵션) — BBOX 프리필터(있으면 먼저 적용)
- filters… (옵션) — 기존 경매결과 필터 일부/전부 매핑
  - 지역: `sido`, `sigungu`, `admin_dong_name`
  - 기간: `sale_date_from`, `sale_date_to`
  - 금액: `min_final_price`, `max_final_price`
  - 면적: `min_exclusive_area`, `max_exclusive_area`, `min_land_area`, `max_land_area`
  - 층확인/엘리베이터: `floor_confirmation`(CSV), `elevator_available`(Y/N)
  - 상태/특수: `current_status`, `special_rights` 등(서버 지원 범위 내)
- sort: 고정 — 서버 내부 거리 오름차순(별도 파라미터 없음)

응답(JSON)

```
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
      // 공통 지도 키(정규화)
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

서버 구현 가이드

- 저장소/인덱스

  - 좌표 컬럼을 공간 타입(POINT)으로 보유 권장
  - PostGIS: `geometry(Point, 4326)` 또는 `geography(Point)`
  - 공간 인덱스: GiST(geometry) 권장

- 조회 전략

  1. (옵션) bounds가 있으면 BBOX로 1차 필터
  2. 기준점 포인트: `ST_SetSRID(ST_MakePoint(:ref_lng, :ref_lat), 4326)`
  3. KNN 정렬 + LIMIT
     - `ORDER BY geom <-> ST_SetSRID(ST_MakePoint(:ref_lng, :ref_lat), 4326) LIMIT :limit`
     - 또는 geography + `ST_DistanceSphere` 기반 ORDER BY + LIMIT
  4. SELECT 컬럼 최소화(지도 표시/팝업 핵심 필드 위주)

- 파라미터 가드
  - ref_lat ∈ [−90, 90], ref_lng ∈ [−180, 180]
  - limit 상한(예: 2000) 초과 시 400 또는 상한으로 캡
  - bounds 면적 과다 시 400 또는 warning + 내부 상한 축소

예시 SQL (PostGIS)

```
WITH base AS (
  SELECT id, latitude, longitude, final_price, construction_year_real, exclusive_area_sqm, road_address_real, geom
  FROM auction_completed
  WHERE /* ... 기존 필터 매핑 ... */
    AND (
      :use_bounds IS FALSE OR geom && ST_MakeEnvelope(:west, :south, :east, :north, 4326)
    )
)
SELECT
  id,
  latitude AS lat,
  longitude AS lng,
  road_address_real AS address,
  exclusive_area_sqm AS area,
  construction_year_real AS build_year,
  final_price AS price,
  'final_price' AS price_basis
FROM base
ORDER BY geom <-> ST_SetSRID(ST_MakePoint(:ref_lng, :ref_lat), 4326)
LIMIT :limit;
```

에러/경고 정책

- 파라미터 오류: 400 + 메시지
- 데이터 과다: `warning`에 안내(예: 상한 초과 시 "상위 K건만 반환")
- 내부 오류: 500 + 메시지(로그 ID는 서버 로그에 기록)

성능/설계 메모

- rent/sale과 동일 패턴: BBOX 프리필터 + KNN LIMIT 조합으로 대량 데이터에서도 안정적 응답
- 초기에는 위경도 근사 거리(경도축 cos(lat) 보정)로도 충분하나, 대용량/정밀 KNN은 PostGIS 인덱스로 확장 권장

FE 연동(참고)

- `GET /api/v1/auction-completed/map?ref_lat=..&ref_lng=..&limit=..`
- 경고가 존재하면 FE는 다음 문구를 노출:
  - "물건 위치로부터 가까운 상위 {limit}건만 반환했습니다."
- 실패 시 FE는 클라이언트 Top‑K로 폴백(사용자에게 안내 배지 표시)

롤아웃/플래그(권장)

- FE는 기본값을 server로 권장(ENV 없이도 서버 경로 사용)
- 필요 시 ENV로 강제 전환 가능: `NEXT_PUBLIC_MAP_NEAREST_LIMIT_AUCTION=client`

확인 요청(백엔드)

1. 엔드포인트/쿼리 파라미터/상한(기본 1000, 최대 2000) 확정
2. 필터 지원 범위(지역/기간/금액/면적/층확인/엘리베이터/상태/특수) 최종 정의
3. 응답 스키마의 공통 키(lat/lng/area/build_year/price/price_basis) 포함 여부 확인
4. 경고/에러 메시지 포맷 합의(문구/언어/필드명)
5. 배포/롤백 계획 및 성능 가이드(예상 p75)를 공유 부탁드립니다

연락처

- FE: 경매결과 지도 모듈 담당자
- BE: 경매결과 API 담당자
