# [Frontend→Backend] CORS Origin 추가 및 스모크 테스트용 아이템 ID 공유 요청 (2025-08-08)

## 1. 요청 개요 (Why?)

- 프론트엔드 실데이터 전환이 완료되어, 브랜치별/환경별로 안정적인 API 호출을 위해 CORS Origin 등록이 필요합니다.
- 상세/Comparables 실데이터 스모크 테스트 자동화를 위해 샘플 아이템 ID(최소 5건) 공유가 필요합니다.

## 2. 작업 요청 사항 (What & How?)

- [ ] CORS 허용 Origin 등록
  - 개발: http://localhost:3000
  - 스테이징: https://staging.booster.com (예시) → 정확 도메인 확정 시 업데이트 예정
  - 운영: https://app.booster.com (예시) → 정확 도메인 확정 시 업데이트 예정
- [ ] 스모크 테스트용 아이템 ID 5건 공유
  - 항목: `id`, `주소 요약`, `데이터 가용 섹션`(comparables/real-transactions/real-rents 여부)
  - 사용처: `/analysis/{id}` 상세 진입 및 `GET /api/v1/items/{id}/comparables` 자동 점검 스크립트

## 3. 관련 정보 (Reference)

- 프론트 실데이터 전환: `USE_REAL_API = true`
- 기본 파라미터: 목록형 API `limit=20` 적용 완료 (`Application/lib/api.ts`)
- 재검증 결과: 5개 엔드포인트 3회 반복 200 OK (2025-08-08)

## 4. 진행 상태

- Status: Requested
- Requester: Frontend 팀
- Assignee: Backend 팀
- Requested At: 2025-08-08
- Completed At:
- History:
  - 2025-08-08: 요청서 작성

---

## Backend 처리/결과 (2025-08-11)

- CORS 허용 Origin(로컬) 반영: `http://localhost:3000`, `http://127.0.0.1:3000`
- 스테이징/운영 도메인: 추후 확정치 수신 시 `.env`로 반영 가능(콤마/JSON 배열 모두 지원)
- 샘플 아이템 ID(개발 DB): 101, 102, 103, 104, 105 (상세/Comparables 스모크 확인 완료)
- 체크리스트 업데이트:
  - [x] CORS 허용 Origin 등록(로컬)
  - [x] 샘플 아이템 5건 공유
  - [/ ] 스테이징/운영 최종 도메인 확정 대기
