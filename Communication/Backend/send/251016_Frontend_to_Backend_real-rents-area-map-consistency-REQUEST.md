### 제목

실거래가(전월세) /map·/area 필터·정렬·총계 일관성 요청서

### 배경/목적

- 전월세 데이터에서 상세필터(목록)와 지도(/map KNN, /area 영역)의 결과가 일치하지 않는 사례가 있었습니다.
- 목표: 동일 필터 입력 시 목록 총합과 지도 total이 동일, 표시상한(limit)은 total과 독립. 영역 안만 보기 시 총합은 영역 내 전체 개수로 정확히 반환.

### 대상 엔드포인트

- 지도 KNN: `GET /api/v1/real-transactions/map?dataset=rent`
- 영역(반경) 필터: `GET /api/v1/real-transactions/area`

### 공통 필터/키 수용(목록·지도·영역 동일 파이프라인)

- 지역
  - `sido`, `sigungu`, `admin_dong_name`
- 계약기간(날짜)
  - 표준: `contract_date_from`, `contract_date_to`
  - 별칭(수용 요청): `date_from`, `date_to`
- 전용면적(㎡)
  - `min_exclusive_area`, `max_exclusive_area`
- 보증금(만원)
  - 표준: `min_deposit`, `max_deposit`
  - 별칭(목록 호환): `min_deposit_amount`, `max_deposit_amount`
- 전월세전환금(만원)
  - 표준: `min_conversion_amount`, `max_conversion_amount`
  - 별칭(목록 호환): `min_jeonse_conversion_amount`, `max_jeonse_conversion_amount`
- 임대 구분
  - `rent_type` (예: `월세` / 전체(all)는 미전송)
- 층확인
  - `floor_confirmation` (CSV)
  - 지도·영역: 영문 토큰(`basement|first_floor|normal_floor|top_floor`)
  - 목록: 한글 토큰(`반지하|1층|일반층|옥탑`)
  - 별칭(선택): `floor_type` 동시 수용 가능
- 엘리베이터
  - `elevator_available` = `Y|N`
- 주소 검색
  - 표준: `address_search` + `address_search_type` = `road|jibun|both`
  - 별칭(수용 요청): `road_address_search`, `jibun_address_search`
- 선택만 보기(옵션)
  - `ids` (CSV, 최대 500개)

### /map(KNN) 동작 요청(지도 상위 K개)

- 정렬: 거리 오름차순 고정(`distance_asc`).
- 제한: `limit` 반영. 결과가 limit를 초과하면:
  - `warning`: “필터 결과가 T건입니다. 가까운 순 상위 K건만 반환했습니다.”
  - `echo.limit`: 실제 limit 값을 에코로 반환.
- 총계: `total`은 전체 결과 수(표시상한과 독립). 목록 총합과 동일해야 함.
- echo: 수신 파라미터(echo.filters/bounds/limit)를 그대로 반환(디버깅/검증 용도).

### /area(영역) 동작 요청(영역 내 대용량)

- 입력(center/radius):
  - 좌표: `center_lat`/`center_lng` 또는 `lat`/`lng` 모두 수용
  - 반경: `radius_m`(미터) 또는 `radius_km`(킬로미터)
- 정렬/수집:
  - 정렬: `ordering=distance` 지원(거리 오름차순). 미지원이면 명시적으로 알려주세요.
  - 페이징: `page`/`size` 수용. `size`는 1000~3000 범위 수용 권장(성능 허용 시).
- 총계: `total` 또는 `total_items`로 영역 내 전체 개수 반환(표시상한과 독립).
- echo: `ordering`/`size`/`center`/`radius` 등 메타 정보를 응답에 포함.

### 응답 키 표준(목록·지도·영역 공통 simple 키)

- 각 item에 다음 simple 키 제공을 보장해주세요(혼용/누락 방지):
  - 좌표: `lat`, `lng`
  - 주소: `address` (또는 `road_address_real`을 address로 매핑)
  - 면적(㎡): `area` (`exclusive_area_sqm` → area로 매핑)
  - 건축연도: `build_year` (`construction_year_real` 매핑 포함)
  - 가격/보증금/월세: `price` (문맥에 맞는 기준 값을 price로 포함)

### 일관성/수용 기준(프론트 검증 포인트)

- 동일 필터에서 목록 총합 == 지도 total (`/map.total`).
- 표시상한 변경(limit)으로 total이 바뀌지 않음(경고만 변경).
- 영역 ON 시 “표시 N / 총 T”에서 T는 영역 내 총합(`area.total`)과 동일.
- 층확인/주소 검색/기간/면적/보증금/전환금 등 모든 상세필터가 /map·/area에 동일하게 반영.

### 예시

- 지도 KNN 예시
  - `GET `/api/v1/real-transactions/map?dataset=rent&ref_lat=37.5&ref_lng=127.0&limit=500&sido=경기도&sigungu=고양시 일산동구&min_exclusive_area=80&max_exclusive_area=300&rent_type=월세&contract_date_from=2025-04-14&contract_date_to=2025-10-14&address_search=대로&address_search_type=road&floor_confirmation=normal_floor``
  - 응답: `{ items: [...], total: 1510, warning: "... 상위 500건 ...", echo: { limit: 500, ... } }`
- 영역 예시
  - `GET `/api/v1/real-transactions/area?center_lat=37.5&center_lng=127.0&radius_m=1000&sido=경기도&sigungu=고양시 일산동구&ordering=distance&size=2000&min_exclusive_area=80&max_exclusive_area=300``
  - 응답: `{ items: [...], total: 336, ordering: "distance", ... }`

### 협의/QA

- 응답 필드 명세와 에코 구조를 확정해주시면 프론트에서 자동 진단 로그로 일괄 검증하겠습니다.
- 파라미터 수용/별칭 처리 범위가 상이하면 목록/지도/영역 간 불일치가 재발할 수 있으므로, 본 요청서의 키 목록을 단일 소스(공유 스키마)로 수용 부탁드립니다.

### 기대 효과

- 상세필터와 지도 결과의 완전 일치.
- 표시상한과 총계 분리로 UX 개선(“표시 N / 총 T” 일관 표시).
- 영역 안만 보기에서 총합·목록·지도 일관성 확보.

감사합니다.
