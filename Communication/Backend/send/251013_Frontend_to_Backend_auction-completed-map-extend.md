# [Frontend→Backend] 경매 v2 지도 `/map` 응답 확장(A안) 및 필터 일관 처리 요청 (251013)

## 배경/문제

- 분석 v2의 경매 결과 지도는 최근접(가까운 순 상위 K) 데이터를 `/api/v1/auction-completed/map`으로 수신해 표시합니다.
- 현재 `/map` 응답은 주소·좌표·일부 요약만 포함하여, 팝업 확장 필드(감정가/최저가/비율/응찰/매각기일/토지평형/층확인/엘리베이터/특수조건)가 비어 보이는 문제가 있습니다.
- 또한 지도 마커에 필터가 동일하게 적용되려면 `/map`에서도 목록(`/`)·영역(`/area`)과 동일한 필터 파라미터를 처리해야 합니다.

## 목표(요청사항 요약)

1. `/map` 응답을 목록/영역과 동일 스키마(확장 필드 포함)로 확대
2. `/map`에서 동일한 필터 파라미터를 모두 처리(지역/기간/가격/면적/층/엘베/상태/특수/정렬)
3. 기존 파라미터(center_lat/center_lng/limit/bounds)는 그대로 유지(호환)

---

## 1. 대상 엔드포인트

- GET `/api/v1/auction-completed/map`
  - 파라미터(현행): `center_lat`, `center_lng`, `limit`, `south`, `west`, `north`, `east`
  - 파라미터(확장 요청): 아래 2. 필터 파라미터 참조

## 2. 필터 파라미터(목록/영역과 동일 처리)

- 지역: `sido`, `sigungu`, `admin_dong_name`
- 기간(매각일): `date_from`, `date_to` (YYYY-MM-DD) | 호환: `sale_date_from`, `sale_date_to`
- 가격(만원): `min_final_sale_price`, `max_final_sale_price`
- 건물평형(평): `area_min`, `area_max` (＝ building_area_pyeong 범위)
- 토지평형(평): `min_land_area`, `max_land_area` (＝ land_area_pyeong 범위)
- 건축년도: `build_year_min`, `build_year_max`
- 층확인: `floor_confirmation` (CSV)
- 엘리베이터: `elevator_available=Y|N`（서버 내부 O/X 매핑 통일)
- 현재상태: `current_status` (CSV 권장)
- 특수조건/권리: `special_rights` (CSV 또는 텍스트 OR)
- 정렬: `ordering` (예: `-final_sale_price`, `sale_date`, `bidder_count`, `construction_year`)

프론트는 이미 상기 키로 전송하도록 정렬 완료(호환 키 병행 전송 포함)되어 있습니다.

## 3. 응답 스키마(목록/영역과 동일)

각 아이템에 대해 다음 필드를 포함해 주세요.

- 식별/좌표/주소
  - `id:number`, `latitude:number`, `longitude:number`
  - `road_address:string` (없을 경우 `general_location`)
- 가격/지표
  - `final_sale_price:number`, `appraised_value:number`, `minimum_bid_price:number`
  - `sale_to_appraised_ratio:number`（미제공 시 `final_sale_price/appraised_value*100` 계산）
  - `bidder_count:number`
- 상태/일자
  - `current_status:string`, `sale_date:string(YYYY-MM-DD)`
- 면적/층/편의
  - `building_area_pyeong:number`, `land_area_pyeong:number`
  - `floor_confirmation:string`, `elevator_available:"O"|"X"`, `construction_year:number`
- 특수조건
  - `special_rights:string`
- 선택(simple 키 유지)
  - `address`, `lat`, `lng`, `area`, `build_year`, `price`, `price_basis`

응답 메타(가능 시): `{ total, page, size, ordering? }` 또는 기존대로 `{ total, ordering }` 등. 최근접 특성상 `limit` 중심이므로 메타는 옵션입니다.

## 4. 동작 규칙(명시)

필터 적용 여부와 관계없이 다음 규칙을 보장해 주세요.

- 규칙 1: "필터 → 거리정렬 → 상한 K"
  - 입력 필터를 먼저 적용하여 집합 S를 만듭니다(필터 없음이면 전체가 S).
  - 중심 좌표(`center_lat/center_lng`) 기준 거리 오름차순으로 S를 정렬합니다.
  - 상한 `limit=K` 만큼만 잘라 `items`로 반환합니다.
- 규칙 2: `total`은 집합 S의 총 개수(필터 적용 후 전체 개수)를 의미합니다.
- 규칙 3: `ordering`은 기본 `distance_asc`이며, 명시 시 해당 정렬을 적용합니다.

## 5. 요청/응답 샘플

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
  "ordering": "-final_sale_price"
}
```

## 6. 호환/성능/품질

- 호환: 기존 파라미터(`center_lat/center_lng/limit/bounds`)와 simple 키는 유지. 신규 필터 키는 선택적으로 무시 가능하나, 처리 시 프론트 필터와 지도가 완전히 동기화됩니다.
- 성능: 상위 K(예: ≤1000) 캡 유지. 내부 인덱스(Haversine/PostGIS 등)로 최근접+필터 병행 처리.
- 품질 체크리스트
  - [ ] `/map`도 확장 필드 포함(목록/영역과 동일 타입)
  - [ ] 모든 필터 키 처리(`date_from/to`, `min/max_final_sale_price`, `area_min/max`, `min/max_land_area`, `build_year_min/max`, `floor_confirmation`, `elevator_available`, `current_status`, `special_rights`, `ordering`)
  - [ ] 좌표 표준화/스왑 보정 유지(`latitude/longitude`)
  - [ ] 경고(`limit` 캡 초과 시 안내) 및 메타(선택) 응답

## 7. 프론트 연동 상태

- 이미 프론트는 위 필터 키로 `/map`에 병행 전송하도록 정렬 완료.
- `/map`이 확장되면 팝업은 비동기 없이 바로 완성되며, 지도 마커도 우측 필터와 완전 동기화됩니다.

감사합니다.
