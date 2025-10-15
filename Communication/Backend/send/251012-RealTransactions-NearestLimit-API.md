### 실거래가(전월세) 지도용 가까운 순 LIMIT API 요청서 (2025-10-12)

목적

- 지도 표시상한(예: 1000개)을 기준점(초기 분석 좌표)에서 가까운 순으로 선정하여 내려받기 위한 서버 API 제공
- 현재 FE는 전체 결과를 받아 클라이언트에서 Top-K 선별 중. 7천+ 건 규모에서 네트워크/CPU 낭비가 커 서버 KNN 전환 필요

요구 범위

- 데이터셋: 실거래가 전월세(rent) 1차 적용. 동일 설계로 sale/auction_ed 확장 예정
- 기준점: 상세 좌표(초기 분석 좌표)
- 반환: 거리 오름차순 상위 K개만 반환, 기존 스키마 유지

엔드포인트(제안)

- GET /api/v1/real-transactions/map

쿼리 파라미터

- dataset: string, ["rent" | "sale"] — 1차는 "rent"
- ref_lat: number — 기준점 위도
- ref_lng: number — 기준점 경도
- limit: number — 표시상한(예: 1000). 서버 가드: 최대치(예: 2000)
- bounds.south/west/north/east: number (옵션) — 우선 bbox 프리필터 가능 시 사용
- filters...: 기존 필터(지역/기간/금액/면적/엘리베이터/층확인 등) 그대로 전달
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
"dataset": "rent",
"ref_lat": number,
"ref_lng": number,
"limit": number
}
}

서버 구현 가이드

- 저장소

  - 좌표 컬럼을 공간 타입(POINT)으로 보유하는 것을 권장
  - PostGIS 사용 시: geometry(Point, 4326) 또는 geography(Point)
  - 공간 인덱스: GiST(geometry) 또는 SP-GiST/BRIN(규모/패턴에 따름)

- 조회 전략

  1. (옵션) bounds가 있으면 bbox 필터 먼저 적용(성능 최적화)
  2. 기준점 포인트: ST_SetSRID(ST_MakePoint(:ref_lng, :ref_lat), 4326)
  3. KNN 정렬 + LIMIT
     - 예: ORDER BY geom <-> ST_SetSRID(ST_MakePoint(:ref_lng, :ref_lat), 4326) LIMIT :limit
     - 또는 ST_DistanceSphere(geography) 기반 ORDER BY + LIMIT
  4. 필요한 컬럼만 SELECT(경량화). FE는 id/좌표/주소/요약만 사용

- 파라미터 가드

  - ref_lat ∈ [-90, 90], ref_lng ∈ [-180, 180] 검증
  - limit 상한(예: 2000) 초과 시 400 또는 상한으로 캡
  - bounds 면적 과다 시 400 또는 경고 + 내부 상한 축소

- 예시 SQL (PostGIS)

WITH base AS (
SELECT id, latitude, longitude, address, extra, geom
FROM rt_rent
WHERE /_ ... 기존 필터 ... _/
AND ( /_ (옵션) bounds 프리필터 _/
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

- KNN + LIMIT은 인덱스 활용 시 매우 빠름. bbox 프리필터와 결합 시 대량 데이터에서도 안정적
- sale/auction_ed 확장 시 동일 테이블/뷰 레이어에 인덱스 준비 필요

FE 연동 변경(참고)

- 전월세 지도 데이터 fetch를 본 API로 교체
- 쿼리에 ref_lat/lng=초기 분석 좌표, limit=표시상한 전달
- FE는 받은 items 그대로 렌더(클라이언트 거리 정렬 제거)
- 장애/미지원 시 클라이언트 Top-K 폴백 가능(플래그)

롤아웃/플래그

- NEXT_PUBLIC_MAP_NEAREST_LIMIT_RENT: "server" | "client"
  - server: 본 API 사용
  - client: 기존 전체 응답 후 클라이언트 Top-K

추가 요청(옵션)

- echo.bounds/filters 반환(디버그)
- total, next_cursor로 페이징 대응(확장)

담당/연락처

- FE: 실거래가 지도 모듈 담당자
- BE: 실거래가 API 담당자
