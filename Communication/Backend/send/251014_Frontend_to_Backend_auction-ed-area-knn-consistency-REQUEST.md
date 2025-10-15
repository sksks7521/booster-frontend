### 제목

경매결과 영역(/area) API: 거리정렬+상한(KNN) 및 필터 일관성 개선 요청

### 요약

- 목적: 프런트의 "영역 안만 보기" ON 시 서버가 영역 내 데이터를 거리 기준으로 정렬하고 상위 K개(limit)만 반환하도록 표준화하여, 현재의 α배수 수집 + 클라이언트 KNN 폴백을 서버 KNN으로 대체하고 성능/일관성을 향상시키고자 합니다.
- 범위: `GET /api/v1/auction-completed/area`
- 핵심 요청
  - 정렬·상한: `ordering=distance_asc`, `limit` 지원 및 `echo.limit`, `ordering` 반환
  - 총계: `total`(= 영역 내 전체 건수, pre_spatial_total) 보장
  - 필터: 가격/면적/토지/건축년도/매각일/층확인/엘리베이터/검색(주소/도로명/사건번호) 모두 반영
  - 경고: 상한 컷 발생 시 `warning` 메시지(예: "필터 결과가 T건입니다. 가까운 순 상위 K건만 반환했습니다.")

---

### 배경

- 프론트는 영역 안 보기 ON 시 지도/목록을 영역 기반으로 단일화하고 있습니다.
- 현행 /area API는 거리정렬+상한이 일부/미지원이라 프론트가 α배수로 넉넉히 받아 클라이언트 KNN 정렬 후 상위 K개를 잘라 쓰고 있습니다.
- 이 방식은 브라우저 성능 저하(대량 소트/거리계산)와 서버-프론트 결과 불일치 가능성을 초래합니다. 서버 KNN 정식 지원이 필요합니다.

---

### 요청 사항(필수)

- 정렬/상한
  - `ordering=distance_asc` 지원 (기준점은 요청의 `center_lat`,`center_lng`)
  - `limit` 지원(예: 100/300/500/1000/2000/3000), 초과 시 상위 K만 반환
  - 응답에 `ordering`, `echo.limit`(서버가 실제 적용한 limit) 포함
- 총계
  - `total` 필드로 영역 내 전체 건수 반환 (상한 컷 여부 판정에 필수)
- 경고
  - 상한 컷 시 `warning` 문구 포함(프론트 UI에 그대로 표기)
- 필터 반영(AND)
  - 지역: `sido`, `address_city`, `eup_myeon_dong`
  - 가격(만원): `min_final_sale_price`, `max_final_sale_price` (기본값 범위는 미전송 시 무시)
  - 면적(평): `area_min`, `area_max`
  - 토지면적(평): `min_land_area`, `max_land_area`
  - 건축년도: `build_year_min`, `build_year_max`
  - 매각일: `date_from`, `date_to` (또는 `saleYear`를 날짜범위로 변환)
  - 층확인: `floor_confirmation`(CSV, 한글 라벨: 반지하/1층/일반층/탑층/확인불가)
  - 엘리베이터: `elevator_available`(`Y`/`N`) — 가능하면 `has_elevator`(bool)도 병행 허용
  - 검색: `address_search`, `road_address_search`, `case_number_search`

---

### 요청 파라미터 스펙(제안)

- 필수
  - `center_lat`(float), `center_lng`(float)
  - `radius_m`(float>0)
- 선택
  - 지역: `sido`, `address_city`, `eup_myeon_dong`
  - 가격: `min_final_sale_price`, `max_final_sale_price`
  - 면적: `area_min`, `area_max`
  - 토지: `min_land_area`, `max_land_area`
  - 건축년도: `build_year_min`, `build_year_max`
  - 매각일: `date_from`, `date_to`
  - 층확인: `floor_confirmation`(CSV)
  - 엘리베이터: `elevator_available`(`Y`/`N`)
  - 검색: `address_search | road_address_search | case_number_search`
  - 정렬: `ordering=distance_asc` (기본값으로 처리 가능)
  - 페이지/상한: `page`, `size`(선택), `limit`(지도 상한용)

---

### 응답 스펙(제안)

```json
{
  "results": [ { /* item */ }, ... ],
  "total": 3091,
  "page": 1,
  "size": 500,
  "ordering": "distance_asc",
  "warning": "필터 결과가 7,719건입니다. 가까운 순 상위 500건만 반환했습니다.",
  "echo": {
    "limit": 500,
    "filters": {
      "sido": "경기도",
      "address_city": "경기도 고양시",
      "eup_myeon_dong": null,
      "date_from": "2024-01-01",
      "date_to": "2024-12-31",
      "area_min": 0,
      "area_max": 300,
      "min_final_sale_price": null,
      "max_final_sale_price": null,
      "floor_confirmation": "일반층",
      "elevator_available": "Y"
    }
  }
}
```

---

### 파라미터 매핑(참고: 프런트 → 서버)

- 프런트는 공통 빌더를 통해 표준 키로 변환해 전송합니다.
- 예시(이미 사용 중)
  - 지역: `province/cityDistrict/town` → `sido/address_city/eup_myeon_dong`
  - 가격: `priceRange/salePriceRange` → `min_final_sale_price/max_final_sale_price`
  - 면적: `buildingAreaRange/exclusiveAreaRange` → `area_min/area_max`
  - 토지: `landAreaRange` → `min_land_area/max_land_area`
  - 건축년도: `buildYear` → `build_year_min/max`
  - 매각일: `saleYear` 또는 `(auctionDateFrom/To | dateRange)` → `date_from/to`
  - 층확인: `floorConfirmation`(배열/CSV, 한글 라벨 정규화) → `floor_confirmation`
  - 엘리베이터: `elevatorAvailable | hasElevator` → `elevator_available(Y/N)` (가능 시 `has_elevator` 병행 허용)
  - 검색: `searchField+searchQuery` → `address_search | road_address_search | case_number_search`

---

### 검증 시나리오

- S1. 영역 총계: 동일 필터에서 /area `total`이 프런트 표기 총계와 일치
- S2. 상한 컷: `total > limit`일 때 `warning` 존재, `results.length ≤ limit`
- S3. 거리정렬: 상위 5개까지 중심점 거리 비감소(오름차순) 확인
- S4. 필터 일관성: 가격/면적/토지/건축/매각일/층/엘베/검색 조합에서도 /area 결과와 목록/지도가 일치
- S5. 역호환: `page/size` 제공 시에도 `limit` 정상 동작(우선순위는 서버 판단 가능, echo로 명시)

---

### 역호환/릴리즈 계획

- 서버가 `ordering=distance_asc`와 `limit`을 지원하면 프런트는 α배수+클라 KNN 폴백을 비활성화하고 서버 KNN 결과를 그대로 사용합니다.
- 미지원/부분지원 시 프런트는 현재와 동일하게 폴백을 유지하되, echo/ordering/total을 기반으로 UI 경고를 표준화합니다.

---

### 타임라인/우선순위

- 1순위: `ordering=distance_asc` + `limit` + `total`
- 2순위: `warning` 메시지 및 `echo.limit/filters`
- 3순위: 필터 최종 반영 범위 점검(층/엘베/검색 포함)

---

### 문의/연락

- 필요한 경우 샘플 요청/응답 캡쳐와 프런트 로그(콘솔 그룹/타이머/echo 표시)를 함께 공유드립니다.
