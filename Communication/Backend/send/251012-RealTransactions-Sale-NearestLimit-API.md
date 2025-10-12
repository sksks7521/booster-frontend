### 실거래가(매매) 지도용 가까운 순 LIMIT API 요청서 (2025-10-12)

목적

- 지도 표시상한(예: 100/300/500/1000 등)을 기준점(초기 분석 좌표)으로부터 가까운 순으로 선정하여 내려받기 위한 서버 API 제공
- 현재 FE는 rent(전월세)에서 서버 KNN을 사용 중이며, sale(매매)에도 동일 정책을 적용하고자 함

요구 범위

- 데이터셋: 실거래가 매매(sale)
- 기준점: 상세에서 전달된 분석 좌표(ref_lat/ref_lng)
- 반환: 거리 오름차순 상위 K개의 거래만 반환(기존 스키마 유지)

엔드포인트(제안)

- GET /api/v1/real-transactions/map

쿼리 파라미터

- dataset: string, "sale"
- ref_lat: number — 기준점 위도
- ref_lng: number — 기준점 경도
- limit: number — 표시상한(예: 1000). 서버 가드 상한(예: 2000)
- bounds.south/west/north/east: number (옵션) — 가능 시 bbox 프리필터
- filters...: 기존 매매 필터(지역/기간/금액/면적/층확인/엘리베이터 등) 그대로 전달
- sort: string (고정) — "distance_asc"

응답(JSON)

{
"items": [
// 기존 지도 아이템 스키마와 동일
// 최소 필드: id, latitude/longitude(or lat/lng), address/roadAddress, extra.*
],
"total": number, // 필터 전체 건수(선택)
"warning": string|null, // 경고 메시지(예: 상한 초과, 영역 과다 등)
"echo": {
"dataset": "sale",
"ref_lat": number,
"ref_lng": number,
"limit": number
}
}

서버 구현 가이드

- 저장소/인덱스

  - 좌표 컬럼을 공간 타입(POINT)으로 보유 권장
  - PostGIS: geometry(Point, 4326) 또는 geography(Point)
  - 공간 인덱스: GiST(geometry) 권장

- 조회 전략

  1. (옵션) bounds가 있으면 bbox로 1차 필터
  2. 기준점 포인트: ST_SetSRID(ST_MakePoint(:ref_lng, :ref_lat), 4326)
  3. KNN 정렬 + LIMIT
     - ORDER BY geom <-> ST_SetSRID(ST_MakePoint(:ref_lng, :ref_lat), 4326) LIMIT :limit
     - 또는 geography + ST_DistanceSphere 기반 ORDER BY + LIMIT
  4. SELECT 컬럼 최소화(지도 표시/팝업에 필요한 핵심 필드 위주)

- 파라미터 가드

  - ref_lat ∈ [-90, 90], ref_lng ∈ [-180, 180]
  - limit 상한(예: 2000) 초과 시 400 또는 상한으로 캡
  - bounds 면적 과다 시 400 또는 warning + 내부 상한 축소

- 예시 SQL (PostGIS)

WITH base AS (
SELECT id, latitude, longitude, address, extra, geom
FROM rt*sale
WHERE /* ... 기존 필터 ... \_/
AND (
:use_bounds IS FALSE OR geom && ST_MakeEnvelope(:west, :south, :east, :north, 4326)
)
)
SELECT id, latitude, longitude, address, extra
FROM base
ORDER BY geom <-> ST_SetSRID(ST_MakePoint(:ref_lng, :ref_lat), 4326)
LIMIT :limit;

에러/경고 정책

- 파라미터 오류: 400 + 메시지
- 데이터 과다: warning에 안내(예: "요청 영역이 넓어 제한 수만 반환")
- 내부 오류: 500 + 메시지(로그 ID 첨부)

성능/확장

- rent와 동일한 패턴으로 동작. bbox 프리필터 + KNN LIMIT 조합으로 대량 데이터에서도 안정적으로 응답
- 향후 auction_ed에도 동일 패턴 확장 가능

FE 연동(참고)

- `GET /api/v1/real-transactions/map?dataset=sale&sort=distance_asc&ref_lat=..&ref_lng=..&limit=..`
- 경고가 존재하면 FE는 다음 문구를 노출함:
  - "물건 위치로부터 가까운 상위 {limit}건만 반환했습니다."
- 실패 시 FE는 클라이언트 Top‑K로 폴백(사용자에게 안내 배지 표시)

롤아웃/플래그

- FE는 기본값을 server로 두었음(ENV 없이도 서버 경로 사용)
- 필요 시 ENV로 강제 전환 가능: NEXT_PUBLIC_MAP_NEAREST_LIMIT_RENT=client

담당/연락처

- FE: 실거래가 지도 모듈 담당자
- BE: 실거래가 API 담당자
