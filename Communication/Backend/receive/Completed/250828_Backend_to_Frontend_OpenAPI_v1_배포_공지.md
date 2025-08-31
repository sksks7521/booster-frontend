# [백엔드→프론트엔드] OpenAPI v1 스펙 배포 공지 (2025-08-28)

## 요약

- OpenAPI 스펙 최신화: 정렬/지오필터/aliases 및 `sortable_columns` 반영
- SDK 재생성 시 `sortable_columns?: string[]` 타입 포함
- 아티팩트 위치: `Communication/Frontend/send/Artifacts/openapi_v1_2025-08-28.json`

## 주요 변경

- 정렬 파라미터
  - real-transactions: `sort_by=transaction_amount|exclusive_area_sqm|contract_date`
  - real-rents: `sort_by=deposit_amount|monthly_rent|exclusive_area_sqm|contract_date`
  - auction-completed: `sort_by=final_sale_price|exclusive_area_sqm|auction_date`
- 지오필터 파라미터
  - BBOX: `south, west, north, east`
  - 반경: real-transactions/auction-completed → `lat,lng,radius_km`, real-rents → `lat_center,lng_center,radius_km`
- 페이지네이션/alias
  - page/size + `limit`(alias), 응답에 `pages`(alias)
- `/columns` 응답
  - `sortable_columns: string[]` 추가(정렬 가능 컬럼 힌트)

## 적용 가이드

- UI 정렬 옵션: `/columns`의 `sortable_columns`로 옵션 구성 권장(하드코딩 최소화)
- 파라미터 검증: `sortable_columns` 값으로 클라이언트 측 유효성 검사 가능
- SDK 재생성: 이 스펙 기반으로 타입 업데이트

## 참고

- 스모크/테스트 모두 통과(내부 CI 확인)
- 문의: 백엔드 팀

---

## 완료 로그

- 상태: Completed
- 이동: Communication/Frontend/send/Completed/250828_Backend_to_Frontend_OpenAPI_v1_배포_공지.md
- 완료일: 2025-08-30
- 메모: OpenAPI v1 아티팩트 공유 및 적용 가이드 공지 완료. 후속 피드백 없음.