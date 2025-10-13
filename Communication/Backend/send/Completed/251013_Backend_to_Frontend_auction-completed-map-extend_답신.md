## [Backend→Frontend] 경매 v2 지도 `/map` 응답 확장(A안) 및 필터 일관 처리 답신 (251013)

### 개요

- 대상: `GET /api/v1/auction-completed/map`
- 목적: 목록(`/`), 영역(`/area`)과 동일한 필터 처리 및 확장 스키마로 `/map` 응답을 확대하여 지도 마커/팝업을 비동기 없이 완성 가능하게 합니다.

### 적용 사항(완료)

- **필터 키 일관 처리**: 목록/영역과 동일 키를 `/map`에서도 처리합니다.
  - 지역: `sido`, `sigungu`(= `address_city`), `admin_dong_name`
  - 기간: `date_from|sale_date_from`, `date_to|sale_date_to` (YYYY-MM-DD)
  - 가격(만원): `min_final_sale_price`, `max_final_sale_price`
  - 건물평형(평): `area_min`, `area_max` (호환: `min_exclusive_area`, `max_exclusive_area`)
  - 토지평형(평): `min_land_area`, `max_land_area`
  - 건축연도: `build_year_min`, `build_year_max`
  - 층확인: `floor_confirmation` (CSV)
  - 엘리베이터: `elevator_available=Y|N|O|X|true|false` (내부 `O`/`X` 표준화)
  - 상태: `current_status` (CSV)
  - 특수: `special_rights` (CSV 또는 텍스트 OR)
  - 정렬: `ordering` (`-final_sale_price|sale_date|exclusive_area_sqm|construction_year|bidder_count`)
- **중심 좌표 호환 지원**: `center_lat/center_lng` 우선, 미지정 시 `ref_lat/ref_lng` 사용. `limit`, `bounds.south|west|north|east` 유지.
- **응답 스키마 확대**: 각 아이템은 목록/영역과 동일한 확장 필드를 포함합니다.
  - 식별/좌표/주소: `id`, `latitude:number`, `longitude:number`, `road_address`(또는 `general_location`)
  - 가격/지표: `final_sale_price`, `appraised_value`, `minimum_bid_price`, `sale_to_appraised_ratio`(미제공 시 자동 계산), `bidder_count`
  - 상태/일자: `current_status`, `sale_date(YYYY-MM-DD)`
  - 면적/층/편의: `building_area_pyeong`, `land_area_pyeong`, `floor_confirmation`, `elevator_available("O"|"X")`, `construction_year`
  - 특수조건: `special_rights`
  - 공통 simple 키: `address`, `lat`, `lng`, `area`, `build_year`, `price`, `price_basis`
- **품질 보정/메타**
  - 좌표 표준화 및 스왑 보정(lat↔lng 뒤바뀜 자동 보정), 범위 밖 좌표는 무효화.
  - `sale_to_appraised_ratio`는 `final_sale_price/appraised_value*100`으로 자동 산출(가능 시).
  - 결과에 `ordering` 에코 및 `warning`(limit 초과 시) 포함.

### 요청 예시

```
GET /api/v1/auction-completed/map?
  center_lat=37.5665&center_lng=126.9780&limit=500&
  sido=경기도&sigungu=고양시&admin_dong_name=일산동&
  date_from=2020-01-01&date_to=2024-12-31&
  min_final_sale_price=1000&max_final_sale_price=50000&
  area_min=10&area_max=80&
  min_land_area=0&max_land_area=200&
  build_year_min=1980&build_year_max=2024&
  floor_confirmation=일반층,1층,옥탑&
  elevator_available=Y&
  current_status=completed,ongoing&
  special_rights=선순위,압류&
  ordering=-final_sale_price
```

### 응답 예시(아이템 일부)

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
  "total": 120,
  "ordering": "-final_sale_price",
  "warning": null,
  "echo": {
    "center_lat": 37.5665,
    "center_lng": 126.978,
    "limit": 500,
    "bounds": { "south": null, "west": null, "north": null, "east": null }
  }
}
```

### QA 체크리스트(백엔드 자체검증 기준)

- [x] `/map`도 확장 필드 포함(목록/영역과 동일 타입)
- [x] 모든 필터 키 처리(`date_from/to`, `min/max_final_sale_price`, `area_min/max`, `min/max_land_area`, `build_year_min/max`, `floor_confirmation`, `elevator_available`, `current_status`, `special_rights`, `ordering`)
- [x] 좌표 표준화/스왑 보정 유지(`latitude/longitude`), 공통 simple 키는 정규화 좌표 사용
- [x] 경고(`limit` 캡 초과 시 안내) 및 `ordering` 에코 포함

### 호환/성능/영향

- 호환: 기존 파라미터(`ref_lat/ref_lng`, `limit`, `bounds.*`) 및 simple 키 유지.
- 성능: 상위 K 캡(기본 1000, 최대 2000) 유지, 필터+근접 정렬 병행.
- 영향: 프론트는 추가 비동기 없이 팝업 완성 가능. 지도/우측 필터 완전 동기화.

### 확인/요청

- `elevator_available`의 boolean 병행 키가 필요하면 알려주세요(현재는 `"O"|"X"` 표준).
- 목록(`/`) 응답 메타에 `ordering` 에코 추가가 필요하면 회신 바랍니다(옵션으로 추가 가능).

감사합니다.
