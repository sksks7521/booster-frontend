## [요청] 실거래가(전월세) v2 — 영역(/area) 모드에서 전월세 스키마 일치 및 dataset=rent 수용 (2025-10-14)

### 배경/현상

- v2 전월세 페이지에서 "영역 안만 보기"(원형) 토글 ON 시 목록 소스가 영역 API로 전환됩니다.
- 현재 영역 API(`/api/v1/real-transactions/area`)가 매매(sale) 중심 키(`transaction_amount`, `price_per_pyeong` 등)를 반환하는 사례가 있어, 전월세 테이블이 기대하는 전월세 키(`deposit_amount`, `monthly_rent`, `jeonse_conversion_amount` 등)가 비어 보이는 문제가 발생합니다.
- 동일 조건에서 토글 OFF(목록 API)일 때는 전월세 컬럼이 정상 노출되며, 토글 ON 후에도 행 개수·총계는 유지되나, 컬럼 값 공란이 발생합니다.

참고(기존 요청서):

- `Communication/Backend/send/251016_Frontend_to_Backend_real-rents-area-schema-REQUEST.md`
- `Communication/Backend/send/251016_Frontend_to_Backend_real-rents-area-map-consistency-REQUEST.md`
- `Communication/Backend/send/251016_Frontend_to_Backend_real-transactions-area-422-REQUEST.md`

### 요청 요약(핵심)

1. 영역 API가 전월세 스키마로 응답하도록 아래 중 하나를 지원해 주세요.

   - A안(간단): `GET /api/v1/real-transactions/area?dataset=rent` → 전월세 스키마로 응답
   - B안(권장): `GET /api/v1/real-rents/area` → 전월세 전용 영역 엔드포인트 제공

2. 응답 스키마는 전월세 목록과 동일한 키를 포함해 주세요(하단 표준 키 참조). 최소 포함:

   - 금액: `deposit_amount`, `monthly_rent`, `jeonse_conversion_amount`
   - 치수/계약: `exclusive_area_sqm`, `contract_date`, `rent_type`, `floor_confirmation`, `elevator_available`
   - 위치/주소: `latitude`, `longitude`, `road_address`(+ `address_city`/`sido` 등)
   - 메타: `total`(영역 내 전체 건수), `page`, `size`, `ordering`

3. 동일 필터에서 목록 총합과 영역 `total`이 일치하도록 보장해 주세요. 총계는 페이지/표시상한과 무관하게 전체 건수를 의미합니다.

### 요청 상세 사양

#### 엔드포인트

- 선택 A: `GET /api/v1/real-transactions/area?dataset=rent`
- 선택 B: `GET /api/v1/real-rents/area`

#### 요청 파라미터

- 중심/반경(필수): `center_lat`, `center_lng`, `radius_m` (반경 가드 500m~10km)
- 페이지네이션: `page`(기본 1), `size`(기본 20, 최대 1000)
- 정렬: `ordering` — 기본 `distance`(오름차순), 허용 키 예: `contract_date`, `deposit_amount`, `monthly_rent`, `exclusive_area_sqm`
- 지역: `sido`, `sigungu`, `admin_dong_name`
- 범위 필터(전월세 전용):
  - 보증금: `min_deposit`, `max_deposit` (별칭: `min_deposit_amount`, `max_deposit_amount`)
  - 월세: `min_monthly_rent`, `max_monthly_rent`
  - 전환금: `min_conversion_amount`, `max_conversion_amount` (별칭: `min_jeonse_conversion_amount`, `max_jeonse_conversion_amount`)
  - 전용면적: `min_exclusive_area`, `max_exclusive_area`
  - 건축연도: `min_construction_year`, `max_construction_year`
- 기간 필터: `contract_date_from`, `contract_date_to`
- 구분/편의: `rent_type`(전세/월세), `floor_confirmation`(CSV, 토큰은 영문 `basement|first_floor|normal_floor|top_floor` 및 한글 별칭 모두 허용), `elevator_available`(`Y|N`)
- 주소 검색: `address_search` + `address_search_type=road|jibun|both`

예시(요청):

```
GET /api/v1/real-transactions/area?
  dataset=rent&center_lat=37.5&center_lng=127.0&radius_m=1000&page=1&size=500&ordering=distance&
  sido=경기도&sigungu=고양시 일산동구&
  min_exclusive_area=59&max_exclusive_area=84&
  rent_type=월세&contract_date_from=2025-04-14&contract_date_to=2025-10-14&
  floor_confirmation=normal_floor&
  address_search=대로&address_search_type=road
```

#### 응답 스키마(전월세 목록과 정합)

```json
{
  "items": [
    {
      "id": 123,
      "road_address": "경기도 고양시 일산동구 ...",
      "latitude": 37.5,
      "longitude": 127.0,
      "exclusive_area_sqm": 84.88,
      "rent_type": "월세",
      "contract_date": "2025-06-01",
      "deposit_amount": 32545,
      "monthly_rent": 50,
      "jeonse_conversion_amount": 82545,
      "floor_confirmation": "normal_floor",
      "elevator_available": false
    }
  ],
  "total": 3091, // 영역 내 전체 건수(표시상한/size와 무관)
  "page": 1,
  "size": 500,
  "ordering": "distance" // 요청 에코
}
```

주의/보장:

- `latitude/longitude`는 숫자형으로 반환 바랍니다(문자열 X).
- `total`은 집합 S(필터+영역) 전체 건수로 반환(페이징/상한과 독립). 과도한 영역 시 `warning` 등 안내 필드 선택 제공 가능.
- 422(Unprocessable Entity) 방지: 유효 파라미터에는 항상 200으로 응답하고, 범위 가드는 서버 내부에서 안전하게 처리합니다.

### 수용 시 기대 효과

- 전월세 목록과 영역 모드의 스키마 일치로 테이블 공란 현상 제거(보증금/월세/전환금 등 컬럼 정상 표시).
- 목록 총합과 영역 `total`의 일관성 확보. 지도 요약 "표시 N / 총 T"의 T와 영역 `total` 일치.
- 정렬/페이지 동작의 예측 가능성 향상(거리 정렬/계약일 정렬 등).

### 호환/마이그레이션

- 선택 A 지원 시: 기존 `/real-transactions/area`는 `dataset` 미지정이면 `sale`(현행)로 동작 유지, `dataset=rent` 지정 시 전월세 스키마로 전환.
- 선택 B 지원 시: 프런트는 전월세 영역 호출을 `/real-rents/area`로 교체 가능(점진적 전환).

### 프런트 연동 계획(요약)

- 프런트는 영역 파라미터 빌더에서 `dataset=rent`를 명시 전송하도록 준비되어 있습니다.
  - 파일: `Application/components/features/rent/areaQuery.ts`
  - 키: `dataset: "rent"` 추가
- 서버 반영 즉시, 영역 ON 상태에서도 전월세 테이블 컬럼 공란 없이 정상 노출됩니다.

### 수용 기준(테스트)

1. 동일 지역/필터에서 토글 OFF(목록)와 토글 ON(영역)의 전월세 컬럼 값이 일관되게 보임
2. 토글 ON 시 응답 `total`이 프런트 표기 총계(T)와 일치
3. 거리 정렬 시 상위 N개가 거리 비감소 순으로 검증됨
4. 422 미발생

### 일정 제안

- 스키마/파라미터 수용: 1~2영업일
- 스테이징 검증 후 프로덕션 반영: 1영업일

감사합니다.
