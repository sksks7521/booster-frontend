### 제목

실거래가(매매) 영역(/area 또는 map radius) API: 거리정렬+상한(KNN) 및 필터 일관성 개선 요청

### 요약

- 목적: 프런트의 “영역 안만 보기” ON 시 서버가 영역 내 데이터를 거리 기준으로 정렬하고 상위 K개(limit)만 반환하도록 표준화하여, 현재의 α배수 수집 + 클라이언트 KNN 폴백을 서버 KNN으로 대체하고 성능/일관성을 향상시키고자 합니다.
- 범위: `GET /api/v1/real-transactions/area`(신규) 또는 현행 `GET /api/v1/real-transactions/map` 확장(중심/반경 입력 시 area 동작)
- 핵심 요청
  - 정렬·상한: `ordering=distance_asc`, `limit` 지원 및 `echo.limit`, `ordering` 반환
  - 총계: `total`(= 영역 내 전체 건수, pre_spatial_total) 보장
  - 필터: 리스트와 동일한 상세필터 전부 반영(지역/금액/평단가/면적/대지권/건축년도/계약일/층확인/엘리베이터/주소검색)
  - 경고: 상한 컷 발생 시 `warning` 메시지(예: "필터 결과가 T건입니다. 가까운 순 상위 K건만 반환했습니다.")

---

### 배경

- 실거래가(매매) 화면은 applyCircle ON 시 영역 기반(원형)으로 지도·목록을 단일화하는 것이 목표입니다.
- 현재 `/map?dataset=sale`는 최근접 Top-K(거리정렬+limit)를 일부/유사 지원하며, 영역(반경) 선필터 및 총계 표준화가 부족합니다.
- 프런트는 임시로 α배수로 받아 클라이언트 KNN 정렬 후 표시상한만큼 절단하는 폴백을 운영 중입니다. 서버 KNN 정식 지원으로 성능/일관성을 개선하려 합니다.

---

### 요청 사항(필수)

- 정렬/상한
  - `ordering=distance_asc` 지원 (기준점: `center_lat`,`center_lng`)
  - `limit` 지원(예: 100/300/500/1000/2000/3000), 초과 시 상위 K만 반환
  - 응답에 `ordering`, `echo.limit`(서버가 실제 적용한 limit) 포함
- 총계
  - `total` 필드에 영역 내 전체 건수 반환(상한과 무관. pre_spatial_total)
- 경고
  - `total > limit`일 때 `warning` 문구 포함(프런트 UI에 그대로 표기)
- 필터 반영(AND)
  - 지역: `sido`, `sigungu`, `admin_dong_name`
  - 거래금액(만원): `min_transaction_amount`, `max_transaction_amount` (기본값 범위는 미전송 시 무시)
  - 평단가(만원/평): `min_price_per_pyeong`, `max_price_per_pyeong`
  - 전용면적(㎡): `min_exclusive_area`, `max_exclusive_area`
  - 대지권면적(㎡): `min_land_rights_area`, `max_land_rights_area`
  - 건축년도: `min_construction_year`, `max_construction_year` (또는 `build_year_min/max` 수용)
  - 계약일: `contract_date_from`, `contract_date_to` (또는 `date_from/to` 수용)
  - 층확인: `floor_confirmation`(CSV)
  - 엘리베이터: `elevator_available`(`Y`/`N`)
  - 주소검색: `address_search`, `address_search_type`(`road|jibun|both`), `road_address_search`, `jibun_address_search`

---

### 요청 파라미터 스펙(제안)

- 필수(영역 동작 시)
  - `center_lat`(float), `center_lng`(float)
  - `radius_m`(float>0)
- 선택
  - 지역: `sido`, `sigungu`, `admin_dong_name`
  - 금액/평단가: `min/max_transaction_amount`, `min/max_price_per_pyeong`
  - 면적: `min/max_exclusive_area`, 대지권: `min/max_land_rights_area`
  - 건축년도: `min/max_construction_year`
  - 계약일: `contract_date_from`, `contract_date_to`
  - 층확인: `floor_confirmation`(CSV)
  - 엘리베이터: `elevator_available`(`Y`/`N`)
  - 검색: `address_search | road_address_search | jibun_address_search`, `address_search_type`
  - 정렬: `ordering=distance_asc`
  - 페이지/상한: `page`, `size`(선택), `limit`(지도 상한용)

---

### 응답 스펙(제안)

```json
{
  "items": [ { /* sale item */ }, ... ],           // 또는 "results"
  "total": 3091,                                   // 영역 내 전체 건수
  "page": 1,
  "size": 500,
  "ordering": "distance_asc",
  "warning": "필터 결과가 7,719건입니다. 가까운 순 상위 500건만 반환했습니다.",
  "echo": {
    "limit": 500,
    "filters": {
      "sido": "경기도",
      "sigungu": "경기도 고양시 덕양구",
      "admin_dong_name": null,
      "contract_date_from": "2024-01-01",
      "contract_date_to": "2024-12-31",
      "min_exclusive_area": 0,
      "max_exclusive_area": 300,
      "min_transaction_amount": null,
      "max_transaction_amount": null,
      "floor_confirmation": "normal_floor",
      "elevator_available": "Y"
    },
    "totals": { "pre_spatial_total": 3091 }
  }
}
```

---

### 파라미터 매핑(참고: 프런트 → 서버)

- 프런트는 `buildSaleFilterParams`로 표준 키로 정규화하여 전송합니다(별칭 허용/기본값 가드 적용).
- 예시
  - 지역: `province/cityDistrict/town` → `sido/sigungu/admin_dong_name`
  - 거래금액: `transactionAmountRange` → `min/max_transaction_amount`
  - 평단가: `pricePerPyeongRange` → `min/max_price_per_pyeong`
  - 전용면적: `exclusiveAreaRange` → `min/max_exclusive_area`
  - 대지권면적: `landRightsAreaRange` → `min/max_land_rights_area`
  - 건축년도: `buildYearRange` → `min/max_construction_year`(또는 `build_year_min/max`)
  - 계약일: `dateRange` → `contract_date_from/to`(또는 `date_from/to`)
  - 층확인: `floorConfirmation`(배열/CSV) → `floor_confirmation`
  - 엘리베이터: `elevatorAvailable(Y/N/all)` → `elevator_available(Y/N)`
  - 검색: `searchField+searchQuery(address|road|jibun|both)` → `address_search(+type) | road_address_search | jibun_address_search`

---

### 검증 시나리오

- S1. 영역 총계: 동일 필터에서 /area(or map radius) `total`이 프런트 표기 총계와 일치
- S2. 상한 컷: `total > limit`일 때 `warning` 존재, `items.length ≤ limit`
- S3. 거리정렬: 상위 5개까지 중심점 거리 비감소(오름차순) 확인
- S4. 필터 일관성: 지역/금액/평단가/면적/대지권/건축/계약일/층/엘베/검색 조합에서도 결과 일치
- S5. 역호환: `page/size` 제공 시에도 `limit` 정상 동작(우선순위는 서버 판단 가능, echo로 명시)

---

### 역호환/릴리즈 계획

- 서버가 `ordering=distance_asc`와 `limit`을 지원하면 프런트는 α배수+클라이언트 KNN 폴백을 비활성화하고 서버 KNN 결과를 그대로 사용합니다.
- 미지원/부분지원 시 프런트는 현행 폴백을 유지하되, `echo/ordering/total`을 기반으로 UI 경고를 표준화합니다.

---

### 타임라인/우선순위

- 1순위: `ordering=distance_asc` + `limit` + `total`
- 2순위: `warning` 메시지 및 `echo.limit/filters/totals`
- 3순위: 상세필터 최종 반영 범위 점검(층/엘베/검색 포함)

---

### 문의/연락

- 필요한 경우 샘플 요청/응답 캡쳐와 프런트 콘솔 로그(그룹/타이머/echo 표시)를 함께 공유드리겠습니다.
