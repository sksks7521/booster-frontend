# Frontend to Backend — SWR/Items Simple 증빙 수신 완료 (2025-08-16)

## 수신 항목

- 스크린샷: `.playwright-mcp/Communication-Backend-send-Artifacts-250816-analysis-list.png` (/analysis 전체 페이지)
- 네트워크 캡처(텍스트):
  - `Communication/Backend/send/Artifacts/250816_health.txt`
  - `Communication/Backend/send/Artifacts/250816_items_simple_1.txt`
  - `Communication/Backend/send/Artifacts/250816_items_full_1.txt`

## 재현 정보(프론트 공유)

- Base URL: `http://127.0.0.1:8001`
- 목록 API: `GET /api/v1/items/simple`
- 페이지: `/analysis`

## 확인 사항(매핑/정책)

- `/api/v1/items` 원천 응답 → simple 스키마 어댑터: 가이드와 일치 확인
  - title/address/price/area/buildYear/lat/lng/auctionDate/status/floor/hasElevator/estimatedValue
  - hasParking: 원천 미제공 → `null/undefined` 유지 정책 수용
- 스모크 스크립트 Base URL 8001 고정: 확인

## 후속 조치

- 증빙 파일 기준 `/analysis` 스모크 200 응답 및 렌더 확인 완료 처리 예정
- 필요 시 `Communication/Backend/send/Artifacts/*.txt` 원본을 본 레포에도 동기화 요청 예정

감사합니다.
