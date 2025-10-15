# 경매 v2 지도 마커/팝업 데이터 일관성 요청서

## 배경

- 분석 v2의 경매 결과 지도(auction_ed)에서 일부 지역/조건에서 마커 클릭 시 팝업 데이터가 비어 보이거나, 마커 자체가 표시되지 않는 사례가 관찰됩니다.
- 프론트는 `GET /api/v1/auction-completed/`(목록)와 `GET /api/v1/auction-completed/area`(서버 원형 필터; 현재 `NEXT_PUBLIC_AUCTION_ED_SERVER_AREA=1`) 응답을 받아 지도·팝업을 구성합니다.
- 현재 두 엔드포인트 간, 또는 지역/데이터 소스별로 필드 이름/타입/좌표 키가 상이한 경우가 있어 일관된 표시가 깨질 수 있습니다.

## 목표

1. 지도 마커가 항상 표시될 수 있도록 좌표/식별자 필드를 표준화
2. 팝업(동기 렌더)에서 사용하는 핵심 필드가 항상 같은 이름과 타입으로 제공
3. 목록/영역 API 간 스키마 일관 유지

## 대상 엔드포인트

- 목록: `GET /api/v1/auction-completed/?page={n}&size={m}&ordering={-field}&...`
- 영역(원형) 필터: `GET /api/v1/auction-completed/area?center_lat=..&center_lng=..&radius_m=..&page={n}&size={m}&ordering={-field}&...`

## 요청 사항(스키마/타입)

다음 필드는 각 아이템에 대해 항상 동일한 이름과 타입으로 내려 주세요.

### 필수(마커/팝업 공통)

- id: string|number (식별자; 목록/영역 동일)
- latitude: number (위도; 문자열 불가)
- longitude: number (경도; 문자열 불가)
  - 주의: `x/y`, `lon/lat_y` 등 대체 키가 존재하더라도 서버에서 `latitude/longitude`로 변환해 표준화해 주세요.

### 주소

- road_address: string (도로명주소) 또는 general_location: string (소재지)

### 가격/지표

- final_sale_price: number (매각가, 단위: 만원)
- appraised_value: number (감정가, 만원)
- minimum_bid_price: number (최저가, 만원)
- sale_to_appraised_ratio: number (매각가/감정가 비율, %)
  - 미제공 시, `(final_sale_price / appraised_value) * 100` 계산 가능하도록 원시값 제공 유지

### 상태/일자

- current_status: string (예: completed/ongoing/...)
- sale_date: string (YYYY-MM-DD)

### 면적/층/편의

- building_area_pyeong: number
- land_area_pyeong: number
- floor_confirmation: string
- elevator_available: boolean|"Y"|"N" (가능하면 boolean 권장)
- construction_year: number

### 특수조건

- special_rights: string

## 페이징/정렬

- 요청 파라미터: `page`, `size`, `ordering`(`-final_sale_price` 등)
- 응답 메타(가능 시): `{ total, page, size, ordering? }`

## 샘플 응답 아이템(JSON)

```json
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
  "elevator_available": true,
  "construction_year": 2004,
  "special_rights": "선순위임차인"
}
```

## 체크리스트

- [ ] 목록/영역 API 모두에서 `latitude/longitude` 제공(문자열 아님)
- [ ] `id` 일관 유지(문자열/숫자 중 하나로 통일 또는 항상 파싱 가능)
- [ ] 가격/비율 필드 존재 또는 계산 가능
- [ ] 주소 필드(road_address 또는 general_location) 존재
- [ ] 정렬(ordering) 및 페이징 메타 포함

## 부가 설명(프론트 동작)

- 프론트 지도/팝업은 비동기 상세 호출 없이 목록/영역 응답만으로 렌더합니다.
- 좌표가 뒤바뀐 응답(예: lat=127.x, lng=37.x)이 드물게 섞일 경우에도 프론트에서 범위 기반 스왑 보정을 추가해 완화할 예정이나, 근본적으로는 서버에서 `latitude/longitude` 표준화를 보장해 주셔야 품질이 안정됩니다.

## 일정/영향

- 서버가 위 스키마를 보장하면 프론트는 추가 핫픽스 없이도 안정적으로 마커/팝업이 복구됩니다.
- 프론트는 좌표 스왑 보정(경미 수정)을 병행 배포하여 과도기 데이터를 방어할 계획입니다.

감사합니다.
