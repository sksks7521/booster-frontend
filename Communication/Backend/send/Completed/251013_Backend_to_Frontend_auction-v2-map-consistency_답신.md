## [Backend→Frontend] 경매 v2 지도 마커/팝업 데이터 일관성 답신서 (251013)

### 개요

- 대상 엔드포인트: `GET /api/v1/auction-completed/`(목록), `GET /api/v1/auction-completed/area`(영역)
- 목적: 지도 마커 표시 안정화 및 팝업 데이터(동기 렌더) 일관성 확보

### 적용 사항 요약 (완료)

- 좌표 표준화: 항상 `latitude:number`, `longitude:number` 제공. 문자열 입력 시 숫자 변환, 범위 이탈 시 무효화, 축 뒤바뀜(lat↔lng) 탐지 시 서버에서 스왑 보정 적용.
- 식별자 일관성: `id` 일관 유지(int). 목록/영역 동일 값.
- 가격/비율: `final_sale_price`, `appraised_value`, `minimum_bid_price` 숫자 제공. `sale_to_appraised_ratio` 미제공 시 `(final_sale_price / appraised_value) * 100` 자동 계산.
- 주소 필드: `road_address` 기본 제공(없을 경우 `general_location`로 대체 권장).
- 공통 simple 키: `address`, `lat`, `lng`, `area`, `build_year`, `price`, `price_basis`를 양 엔드포인트 공통 제공. 좌표는 정규화 결과를 사용.
- 페이징/정렬:
  - 목록(`/`)에 `page`, `size`, `ordering` 지원(예: `-final_sale_price|final_sale_price|construction_year|exclusive_area_sqm|bidder_count|sale_date`).
  - 영역(`/area`)은 기존대로 `ordering` 에코 포함 응답.

### 스키마(핵심 필드) 보장

- id: number
- latitude: number
- longitude: number
- road_address: string (또는 general_location)
- final_sale_price: number(만원)
- appraised_value: number(만원)
- minimum_bid_price: number(만원)
- sale_to_appraised_ratio: number(%)
- current_status: string
- sale_date: string(YYYY-MM-DD)
- building_area_pyeong: number
- land_area_pyeong: number
- floor_confirmation: string
- elevator_available: "O"|"X" (boolean이 필요하면 별도 키 추가 가능)
- construction_year: number
- special_rights: string

### 샘플 응답

#### 1) 목록: GET /api/v1/auction-completed/?page=1&size=2&ordering=-final_sale_price

```json
{
  "items": [
    {
      "id": 12345,
      "latitude": 37.5665,
      "longitude": 126.978,
      "road_address": "서울특별시 중구 세종대로 110",
      "final_sale_price": 25000,
      "appraised_value": 50000,
      "minimum_bid_price": 35000,
      "sale_to_appraised_ratio": 50.0,
      "bidder_count": 3,
      "current_status": "completed",
      "sale_date": "2025-07-31",
      "building_area_pyeong": 25.3,
      "land_area_pyeong": 12.1,
      "floor_confirmation": "일반층",
      "elevator_available": "O",
      "construction_year": 2004,
      "special_rights": "선순위임차인",
      "address": "서울특별시 중구 세종대로 110",
      "lat": 37.5665,
      "lng": 126.978,
      "area": 25.3,
      "build_year": 2004,
      "price": 25000,
      "price_basis": "final_sale_price"
    }
  ],
  "total": 5000,
  "page": 1,
  "size": 2,
  "total_pages": 250,
  "pages": 250
}
```

#### 2) 영역: GET /api/v1/auction-completed/area?center_lat=37.56&center_lng=126.98&radius_m=1000&page=1&size=2&ordering=-final_sale_price

```json
{
  "results": [
    {
      "id": 12345,
      "latitude": 37.5665,
      "longitude": 126.978,
      "road_address": "서울특별시 중구 세종대로 110",
      "final_sale_price": 25000,
      "appraised_value": 50000,
      "minimum_bid_price": 35000,
      "sale_to_appraised_ratio": 50.0,
      "bidder_count": 3,
      "current_status": "completed",
      "sale_date": "2025-07-31",
      "building_area_pyeong": 25.3,
      "construction_year": 2004,
      "address": "서울특별시 중구 세종대로 110",
      "lat": 37.5665,
      "lng": 126.978,
      "area": 25.3,
      "build_year": 2004,
      "price": 25000,
      "price_basis": "final_sale_price"
    }
  ],
  "total": 120,
  "page": 1,
  "size": 2,
  "ordering": "-final_sale_price"
}
```

### 좌표 품질 보정(서버)

- 문자열 좌표를 숫자로 변환(비정상/NaN 무효화).
- 좌표 범위 확인 후 lat∈[-90,90], lng∈[-180,180]이 뒤바뀐 패턴이면 서버에서 스왑 보정.
- 최종 범위 밖이면 좌표 무효화(null)하여 마커 오표시 방지.

### 호환 및 주의 사항

- 기존 키는 유지되며, 공통 simple 키는 프론트 지도/팝업 렌더에 바로 사용 가능합니다.
- `elevator_available`는 현재 "O"/"X" 표준을 유지합니다. boolean 변환 키가 필요하면 회신 바랍니다.
- 메타: 목록(`/`)은 `{ total, page, size, total_pages, pages }` 제공, 영역(`/area`)은 `{ total, page, size, ordering }` 제공.

### QA 체크리스트 (백엔드 자체검증 기준)

- [x] 목록/영역 모두 `latitude/longitude` 숫자형 제공, 스왑 보정 동작 확인
- [x] `id` 일관 유지(목록↔영역 동일)
- [x] `final_sale_price/appraised_value/minimum_bid_price` 숫자 및 비율 자동 계산
- [x] 주소 필드 존재(road_address 또는 general_location)
- [x] 정렬(ordering) 및 페이징 메타 응답 반영

### 릴리스/영향

- 서버 변경은 비파괴적이며, 프론트는 추가 핫픽스 없이 마커/팝업 안정화 효과를 기대할 수 있습니다.
- 프론트의 범위 기반 좌표 스왑 보정은 그대로 유지해도 무관하나, 서버 표준화로 비정상 좌표 혼입 리스크가 크게 낮아집니다.

### 요청/후속

- `elevator_available`의 boolean 병행 제공 필요 여부
- 목록(`/`) 응답 메타에 `ordering` 에코가 필요하면 알려주세요(옵션으로 추가 가능)

감사합니다.
