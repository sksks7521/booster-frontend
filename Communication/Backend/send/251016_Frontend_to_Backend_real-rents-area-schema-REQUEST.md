### 제목

실거래가(전월세) 영역 API(/real-transactions/area) 스키마 정합 및 dataset 수용 요청

### 배경/증상

- 영역 안만 보기(원형) ON 시 `/api/v1/real-transactions/area` 응답의 컬럼이 전월세 전용 컬럼과 불일치하여 테이블 일부가 공란(`-`)으로 표시됩니다.
- 목록 API(전월세)는 `deposit_amount`, `monthly_rent`, `jeonse_conversion_amount` 등 전월세 키를 반환하나, 영역 API는 `transaction_amount`, `price_per_pyeong` 등 매매 중심 키를 반환합니다.
- 동일 지역/필터에서 영역 ON 후 전월세 컬럼이 비어 보이는 현상 재현.

### 재현 예시 (요약)

- 목록(정상): `deposit_amount=32545`, `monthly_rent=0`, `jeonse_conversion_amount=32545`, `exclusive_area_sqm=84.88`, `contract_date=2025-06-01`, `elevator_available=false` …
- 영역(불일치): `transaction_amount=11800`, `price_per_pyeong=720.0`, `exclusive_area_sqm=54.05`, `contract_date=2021-07-23`, `elevator_available=false` … → 전월세 필드가 부재

### 요청 사항(핵심)

1. dataset 수용 또는 전용 엔드포인트 제공

- A안: `/api/v1/real-transactions/area?dataset=rent` 수용 → 전월세 스키마로 응답
- B안: `/api/v1/real-rents/area` 엔드포인트 제공(권장) → 동일 필터/정렬/총계 규칙 적용

2. 전월세 표준/별칭 컬럼 세트(응답)

- 표준 키(프론트 테이블/어댑터가 기대하는 simple 키 포함):
  - `deposit_amount`, `monthly_rent`, `jeonse_conversion_amount`
  - `deposit_per_pyeong`, `monthly_rent_per_pyeong`
  - `exclusive_area_sqm` → simple `area`
  - `construction_year_real` → simple `build_year`
  - `contract_date`(YYYY-MM-DD)
  - `elevator_available`(true/false or `Y|N`)
  - 좌표: `lat`, `lng`(또는 `latitude`,`longitude` → simple 변환)
  - 주소 simple: `address`(road_address_real 매핑 허용)
  - 가격 simple: `price` = 전월세 기준값(전세: deposit_amount, 월세: monthly_rent/복합 정책 협의 가능)
- 별칭 허용(수용 시 호환성↑):
  - `min/max_deposit_amount`, `min/max_jeonse_conversion_amount`
  - 좌표 원본(`latitude/longitude`)와 simple(`lat/lng`) 병행

3. 필터/정렬/총계 규칙 (기존 요청서와 동일)

- 정렬: `ordering=distance` 지원(미지정 시 거리 오름차순). 응답 메타에 `ordering` 반영
- limit 힌트: `limit` 수용 시 `echo.limit` 반사(미지원이면 무시해도 422 발생 금지)
- 총계: `total` 또는 `total_items`로 영역 내 전체 개수 반환(표시상한과 독립)
- echo: 요청 주요 파라미터(`center`, `radius`, `size`, `ordering`, `limit`, `dataset`) 반사

4. 좌표/반경 파라미터 호환

- `center_lat/center_lng/radius_m`와 `lat/lng/radius_km` 모두 수용(내부 단위 변환)

### 응답 예시 (dataset=rent)

```json
{
  "items": [
    {
      "id": 1911620,
      "address": "경기도 고양시 일산동구 공릉천로 45",
      "lat": 37.69737848,
      "lng": 126.8443866,
      "area": 54.05,
      "build_year": 2013,
      "contract_date": "2021-07-23",
      "deposit_amount": 11800,
      "monthly_rent": 0,
      "jeonse_conversion_amount": 11800,
      "deposit_per_pyeong": 720.0,
      "monthly_rent_per_pyeong": null,
      "elevator_available": false
    }
  ],
  "total": 336,
  "ordering": "distance",
  "echo": {
    "dataset": "rent",
    "center": { "lat": 37.69737848, "lng": 126.8443866 },
    "radius_m": 1000,
    "size": 1000,
    "limit": 500
  }
}
```

### 수용 기준(프론트 검증)

- 영역 ON에서도 전월세 테이블의 보증금/월세/전환금 등 컬럼이 공란 없이 표시
- 목록 총합 == 영역 total, 지도 “표시 N / 총 T”와 일치
- 거리정렬·limit·echo 동작이 요청서와 일치

### 참고

- 동일 날짜의 별도 요청서(422 대응, 필터/정렬/총계 일관)와 함께 검토 부탁드립니다.

감사합니다.
