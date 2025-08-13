# [Backend → Frontend] Items API 사용 지침 및 필터 호환 요청

- 발신: Backend
- 수신: Frontend
- 일자: 2025-08-13
- 배경: 목록 API 200 OK임에도 화면 미표시 문제 발생. 원인은 응답/파라미터 키 불일치로 판단되어, 백엔드가 파라미터 호환을 확장했고(dual naming), 사용 지침을 공유합니다.

---

## 1) 두 가지 사용 옵션

- 옵션 A(권장, 즉시 표시 목적): `GET /api/v1/items/simple`

  - 지원 필터(camelCase + snake_case 동시 수용)
    - 지역: `region`
    - 건물유형: `buildingType`
    - 가격: `minPrice|min_price`, `maxPrice|max_price`
    - 면적: `minArea|min_area`, `maxArea|max_area`
    - 건축연도: `minBuildYear|min_built_year`, `maxBuildYear|max_built_year`
    - 엘리베이터: `hasElevator|has_elevator`
    - 경매 상태: `auctionStatus|auction_status`
  - 주의: 주차장(`hasParking`) 데이터는 현 소스에 없어 필터 미적용, `floor` 필터는 데이터 특성상 1차 배제(협의 시 활성화 가능)
  - 응답 키(렌더링 매핑): `id, title, address, price, area, buildYear, lat, lng, auctionDate, status, floor, hasElevator, estimatedValue`

- 옵션 B(고급/세분 필터): `GET /api/v1/items`
  - 매우 많은 필터 제공(snake_case)
  - 프론트에서 응답 키를 직접 매핑 필요(minimum_bid_price→price 등)

---

## 2) 즉시 반영 안내(옵션 A)

- SWR 예시

```ts
useSWR(
  [
    "/api/v1/items/simple",
    {
      region: "",
      buildingType: "",
      min_built_year: 1980,
      max_built_year: 2024,
      min_price: 0,
      max_price: 500000,
      min_area: 0,
      max_area: 200,
      has_elevator: undefined,
      auction_status: undefined,
      page: 1,
      limit: 20,
    },
  ],
  fetcher
);
```

- 응답 렌더링 매핑
  - 제목: `title`
  - 주소: `address`
  - 가격(만원): `price`
  - 면적(평): `area`
  - 건축연도: `buildYear`
  - 상태: `status`

---

## 3) 옵션 B 사용 시(고급 필터)

- 요청 파라미터: `min_minimum_bid_price`, `max_minimum_bid_price`, `min_building_area`, `max_building_area`, `min_construction_year`, `max_construction_year`, `has_elevator`, `current_status`, `sido`, `address_city` 등
- 응답 키 매핑(예)
  - `minimum_bid_price` → price
  - `building_area_pyeong` → area
  - `construction_year` → buildYear
  - `road_address` → address
  - `current_status` → status

---

## 4) 요청 사항

- A 또는 B 중 택 1로 적용 계획을 알려 주세요.
- 적용 후 `/analysis` 재검증(렌더링 + Network 상태 200) 캡처 공유 부탁드립니다.
- `hasParking`, `floor` 등 추가 필터가 필요하면, 백엔드 적용 범위를 합의 후 확장하겠습니다.

---

- Status: Requested
- Requester: Backend Team
- Assignee: Frontend Team
- Requested At: 2025-08-13
- Completed At:
- History:
  - 2025-08-13: 지침/호환 요청 송부
