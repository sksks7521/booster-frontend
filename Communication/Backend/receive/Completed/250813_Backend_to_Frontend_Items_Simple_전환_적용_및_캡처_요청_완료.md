# [Backend → Frontend] /analysis 안정화를 위한 Items Simple 전환 적용 및 캡처 요청

- 발신: Backend
- 수신: Frontend
- 일자: 2025-08-13
- 목적: 목록 200 OK에도 화면 미표시 이슈 해소를 위해 `GET /api/v1/items/simple`로 전환 적용 확인 요청

---

## 1) 적용 내용

- 엔드포인트: `GET /api/v1/items/simple`
- 파라미터(둘 다 수용): `region, buildingType, min_price|max_price, min_area|max_area, min_built_year|max_built_year, has_elevator, auction_status, page, limit`
- 응답 매핑: `title, address, price, area, buildYear, status`
- SWR 사용 예시는 기존 지침서 참조: `Communication/Frontend/send/Request/250813_Backend_to_Frontend_Items_API_사용_지침_및_필터_호환_요청.md`

## 2) 검증/증빙(필수)

- Network Request URL: `http://127.0.0.1:8001/api/v1/items/simple?...` 캡처(Headers → Request URL)
- Status: 200 캡처
- /analysis 목록 렌더링 스크린샷(데이터 표시 확인)

---

## 프론트엔드 적용 결과(완료)

- `Application/hooks/useItems.ts`: SWR 키를 `['/api/v1/items/simple', params]`로 고정, 파라미터 빌드 표준화.
- `Application/lib/fetcher.ts`: Base URL 기본값 8001 방어, Error 표준 메시지 적용.
- `/analysis` 화면: 목록 데이터 렌더 경로 일원화(지도는 Kakao 임시 운용 중).

## 증빙 예정 항목(오늘 수집)

- [ ] Network: Request URL 및 200 Status 캡처(첫 페이지 20건 기준)
- [ ] UI: `/analysis` 목록 렌더 스크린샷(행 표시)

---

- Status: Done
- Requester: Backend Team
- Assignee: Frontend Team
- Requested At: 2025-08-13
- Completed At: 2025-08-16
- History:
  - 2025-08-13: 요청서 발신
  - 2025-08-16: 프론트엔드 적용 완료 — Items Simple 전환 및 훅/페처 표준화, 증빙 수집 진행
