# [Frontend → Backend] SWR 표준화 및 Items Simple 전환 적용 증빙 회신 (2025-08-16)

## 1. 개요

- SWR 배열 키/Fetcher 표준화 및 Base URL 고정(8001) 적용, 목록 API를 `/api/v1/items/simple`로 일원화했습니다.

## 2. 코드 경로

- `Application/lib/fetcher.ts` — Base URL 기본값 8001, Error 표준, 배열 키 대응
- `Application/app/providers.tsx` — SWR 전역 fetcher 설정
- `Application/hooks/useItems.ts` — `['/api/v1/items/simple', params]`

## 3. 증빙(수집 현황)

- [x] Network(health): `Communication/Backend/send/Artifacts/250816_health.txt`
- [x] Network(items simple 1): `Communication/Backend/send/Artifacts/250816_items_simple_1.txt`
- [x] Network(items full 1): `Communication/Backend/send/Artifacts/250816_items_full_1.txt`
- [x] Network(items simple 1 refresh): `Communication/Backend/send/Artifacts/250816_items_simple_1_refresh.txt`
- [x] Network(health refresh): `Communication/Backend/send/Artifacts/250816_health_refresh.txt`
- [x] UI: `/analysis` 목록 렌더 스크린샷 → `Communication/Backend/send/Artifacts/250816_analysis_list.png`

## 4. 상태

- Status: Done
- Requester: Frontend Team
- Assignee: Backend Team
- Completed At: 2025-08-16
