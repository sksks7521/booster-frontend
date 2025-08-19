# [완료] Backend to Frontend — Items API 응답 키 매핑 및 전환 가이드 (2025-08-16)

## 요약

- 프론트에서 `/api/v1/items/simple` 전환 및 Base URL 8001 고정을 적용 완료한 것을 확인했습니다.
- 본 문서는 `/api/v1/items`로 전환해야 할 필요가 생길 경우를 대비한 파라미터/응답 키 매핑 가이드를 제공합니다.

## 1) 현행 권장

- 기본 목록: `/api/v1/items/simple`
- 파라미터 표준: camelCase와 snake_case 동시 허용(단, simple에 한정된 축소 집합)
- 응답 키: `totalItems`, `items[]` with `title,address,price,area,buildYear,lat,lng,auctionDate,status,floor,hasElevator,hasParking(optional),estimatedValue`

## 2) `/api/v1/items` 전환 가이드 (필터 확장 필요 시)

- 엔드포인트: `/api/v1/items`
- 파라미터(일부 예):
  - 지역: `sido,address_city,region_group,eup_myeon_dong`
  - 가격: `min_appraised_value,max_appraised_value,min_minimum_bid_price,max_minimum_bid_price,under_100million`
  - 면적: `min_building_area,max_building_area,min_land_area,max_land_area`
  - 건물: `min_construction_year,max_construction_year,main_structure,main_usage`
  - 편의: `has_elevator,min_elevator_count`
  - 상태: `current_status,sale_month`
- 응답 스키마: `total_items`, `items[]` (원천 컬럼 기반 상세 응답)

### 2.1 응답 키 매핑 어댑터 정책(프론트 권장)

| simple 응답      | items 응답(원천)                                                       | 비고                            |
| ---------------- | ---------------------------------------------------------------------- | ------------------------------- |
| `title`          | `building_name` or `location_detail` or concat(`usage`,`road_address`) | Fallback 순서 일치              |
| `address`        | `road_address`                                                         |                                 |
| `price`          | `minimum_bid_price`                                                    | 숫자/NaN 보호 필요              |
| `area`           | `building_area_pyeong`                                                 | 숫자/NaN 보호 필요              |
| `buildYear`      | `construction_year`                                                    |                                 |
| `lat`            | `latitude`                                                             |                                 |
| `lng`            | `longitude`                                                            |                                 |
| `auctionDate`    | `sale_date`                                                            | ISO 문자열 변환 필요            |
| `status`         | `current_status`                                                       |                                 |
| `floor`          | `floor_info`                                                           |                                 |
| `hasElevator`    | `elevator_available` == 'O'                                            |                                 |
| `hasParking`     | (없음)                                                                 | 항상 `null` 또는 프론트 계산 값 |
| `estimatedValue` | `appraised_value`                                                      |                                 |

### 2.2 전환 시 체크리스트

- [ ] 기존 simple 파라미터 → items 필드 매핑 어댑터 적용
- [ ] 응답 키 어댑터로 `items[]`를 simple 형태로 변환해 UI 영향 최소화
- [ ] 네트워크 캡처: 200 OK, `totalItems`/`items[]` 길이 확인
- [ ] 에러 메시지 포맷 유지(HTTP 상태/URL 포함)

## 3) 누락/권장 변경 사항 검토

- 현재 표준 파라미터/응답 키 매핑은 서버 구현과 일치합니다.
- 추가 필터 도입 시에는 `/api/v1/items` 사용을 권장하며, 위 어댑터 정책에 따라 프론트 변환 레이어를 적용해주세요.

## 4) 증빙 수집 안내

- DevTools Network 스크린샷: `http://127.0.0.1:8001/api/v1/items/simple?...` 200 OK
- `/analysis` 리스트 렌더 스크린샷: 행 표시 확인

감사합니다.
