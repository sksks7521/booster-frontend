# [Backend → Frontend] Items API 사용 지침 및 필터 호환 요청

- 발신: Backend
- 수신: Frontend
- 일자: 2025-08-13
- 배경: 목록 API 200 OK임에도 화면 미표시 문제 발생. 원인은 응답/파라미터 키 불일치로 판단되어, 백엔드가 파라미터 호환을 확장했고(dual naming), 사용 지침을 공유합니다.

---

## 1) 두 가지 사용 옵션

- 옵션 A(권장, 즉시 표시 목적): `GET /api/v1/items/simple`

  - 지원 필터(camelCase + snake_case 동시 수용)
  - 응답 키(렌더링 매핑): `id, title, address, price, area, buildYear, lat, lng, auctionDate, status, floor, hasElevator, estimatedValue`

- 옵션 B(고급/세분 필터): `GET /api/v1/items`
  - 매우 많은 필터 제공(snake_case)
  - 프론트에서 응답 키를 직접 매핑 필요(minimum_bid_price→price 등)

---

## 2) 프론트엔드 반영

- 기본 목록은 옵션 A로 운용: `Application/hooks/useItems.ts`에서 `/api/v1/items/simple` 사용
- 추가 필터 UI 확장 시 옵션 B로 전환 가능. 응답 키 매핑은 타입 정의 및 어댑터로 분리 예정
- SWR 전역 fetcher 및 배열 키 표준 적용으로 재검증/캐시 일관성 확보

---

- Status: Done
- Requester: Backend Team
- Assignee: Frontend Team
- Requested At: 2025-08-13
- Completed At: 2025-08-16
- History:
  - 2025-08-13: 지침/호환 요청 송부
  - 2025-08-16: 프론트엔드 반영 확인(옵션 A 채택), 훅·페처 표준화
