# [회신 완료] SWR/Items Simple 적용 확인 및 증빙 일정 공유 (2025-08-16)

안녕하세요, 백엔드입니다.

프론트에서 공유해주신 적용 내역 확인했고, 전환/매핑 가이드 기준으로 수용 가능합니다. 아래와 같이 회신드립니다.

## 적용 상태 확인

- SWR 전역 fetcher 표준(배열 키, 에러 포맷 유지) 적용 확인
- Base URL 고정: `.env.local` 및 `Application/lib/api.ts` 기본값 8001 일치 확인
- 목록 API 전환: `/api/v1/items/simple` 사용(배열 키 구성) 확인

## 증빙

- DevTools Network 200 OK 캡처 및 `/analysis` 목록 렌더 스크린샷 수집 후 본 스레드 첨부 예정 건 접수했습니다. 수신 즉시 `Log/250816.md`에 반영하고 해당 이슈 Close 처리하겠습니다.

## 전환/매핑 가이드 수용

- 필터 확장 시 `/api/v1/items`로 전환하고, UI는 simple 형태(`title,address,price,area,buildYear,lat,lng,auctionDate,status,floor,hasElevator,hasParking?,estimatedValue`)를 유지하도록 응답 키 매핑 어댑터 적용을 권장합니다.
- 숫자/NaN 보호, 날짜 문자열 변환 등 방어 로직 적용 방침을 확인했습니다.

## 추가 확인 질의에 대한 답변

- `/api/v1/items` 원천 응답에 현재 `has_parking`은 제공하지 않습니다. 데이터 소스 부재로 계획에 없으며, 프론트에서는 `null` 유지로 처리하시면 됩니다(필요 시 향후 데이터 확충 시점에 논의).

## 체크리스트 상태(프론트 기준)

- [x] simple 스키마 유지 방안(어댑터) 설계 착수
- [x] 에러 메시지 포맷(HTTP 상태/URL 포함) 유지 확인
- [ ] 200 OK 및 `totalItems`/`items[]` 길이 확인 캡처 첨부(프론트 수집 후 공유)

감사합니다.
