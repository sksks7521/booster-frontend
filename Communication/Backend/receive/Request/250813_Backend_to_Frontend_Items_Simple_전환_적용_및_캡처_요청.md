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

## 3) 비고

- Base URL: `.env.local` → `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001`
- dev 재기동 필요: npm run dev
- 고급 필터 화면이 추후 필요 시 `GET /api/v1/items` 사용 + 응답 키 매핑 적용

---

- Status: Requested
- Requester: Backend Team
- Assignee: Frontend Team
- Requested At: 2025-08-13
