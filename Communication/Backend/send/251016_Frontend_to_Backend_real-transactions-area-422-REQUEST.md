### 제목

실거래가 `/real-transactions/area` 422 오류 해결 요청 (전월세/매매 공통)

### 배경

프론트에서 영역 안만 보기(원형 필터) 활성 시 `/api/v1/real-transactions/area`를 호출합니다. 아래와 같은 정상 파라미터로도 422(Unprocessable Entity)가 간헐적으로 발생하여 목록 테이블이 비는 문제가 재현됩니다.

### 재현 URL 예시

1. 거리정렬 + 소수 수집

```
GET /api/v1/real-transactions/area?
  sido=경기도&
  sigungu=경기도 고양시 일산동구&
  ordering=distance&
  center_lat=37.69737848&center_lng=126.8443866&
  radius_m=1000&
  page=1&size=20
```

2. 거리정렬 + 대용량 수집 + limit 힌트

```
GET /api/v1/real-transactions/area?
  sido=경기도&
  sigungu=경기도 고양시 일산동구&
  ordering=distance&
  center_lat=37.69737848&center_lng=126.8443866&
  radius_m=1000&
  page=1&size=1000&limit=500
```

두 요청 모두 422가 발생하는 사례가 있어, 기능 일관성 확보를 위해 하단의 수정/수용을 요청드립니다.

### 요청 사항(핵심)

1. 좌표/반경 파라미터 호환

- 필수 좌표/반경 입력을 다음 2가지 문법 모두 수용해주세요.
  - `lat` / `lng` / `radius_km`
  - `center_lat` / `center_lng` / `radius_m`
- 내부에서는 한 단위로 변환하여 동일하게 처리(예: `radius_m/1000 = radius_km`).

2. 정렬/limit

- `ordering=distance`를 지원하고, 미지정 시 기본값으로 거리 오름차순을 적용해주세요.
- `limit`는 선택 파라미터(힌트)로 수용만 하되, 미지원이면 무시해도 좋고, 가능한 경우 응답 `echo.limit`로 반사해 주세요. `limit` 존재 자체가 422를 유발하지 않도록 보장 필요합니다.

3. 지역/상세 필터 수용

- 지역: `sido`, `sigungu`, `admin_dong_name`
- 기간: `contract_date_from`, `contract_date_to` (별칭: `date_from`, `date_to`)
- 면적: `min_exclusive_area`, `max_exclusive_area`
- 보증금: `min_deposit`, `max_deposit` (별칭: `min_deposit_amount`, `max_deposit_amount`)
- 전환금: `min_conversion_amount`, `max_conversion_amount` (별칭: `min_jeonse_conversion_amount`, `max_jeonse_conversion_amount`)
- 층확인: `floor_confirmation` (지도/영역=영문 토큰: `basement|first_floor|normal_floor|top_floor`)
- 엘리베이터: `elevator_available`=`Y|N`
- 주소검색: `address_search` + `address_search_type(road|jibun|both)`, 별칭 `road_address_search`, `jibun_address_search`

4. 페이징/수집 상한

- `page`/`size` 수용. `size`는 1000~3000 범위 권장(성능 허용 시), 초과 시 400/422가 아닌 clamp 후 처리 또는 적절한 메시지 반환.

5. 응답/메타

- 총계: `total` 또는 `total_items`로 영역 내 전체 개수 반환(표시 상한과 독립)
- 정렬: 응답 메타에 `ordering` 포함(예: `distance`)
- echo: 수신 주요 파라미터(`center`, `radius`, `size`, `ordering`, `limit`)를 `echo` 블록으로 반사(디버깅/검증 용)
- 아이템 키: 공통 simple 키 포함 보장(`lat`, `lng`, `address`, `area`, `build_year`, `price` 등)

### 수용 기준(프론트 검증)

- 동일 영역/필터 조건에서 목록 총합 == `/area.total` 일치
- `limit` 존재 여부와 무관하게 422 미발생
- `center_lat/center_lng/radius_m` 또는 `lat/lng/radius_km` 사용 시 동일 결과
- 거리정렬이 적용되며, 응답 `ordering` 메타 반사됨

### 예상 원인 추정

- 기존 스키마가 `lat/lng/radius_km`만 허용하거나, `limit`/`ordering` 제약으로 422가 발생하는 것으로 보입니다. 위 호환 수용으로 프론트/백엔드 불일치를 해소할 수 있습니다.

### 협조 요청

- 상기 항목 수용 여부와 일정, 스키마/응답 예시를 회신 부탁드립니다. 확정 시 프론트 로그 진단(콘솔 echo/total/ordering)으로 즉시 검증하겠습니다.

감사합니다.
