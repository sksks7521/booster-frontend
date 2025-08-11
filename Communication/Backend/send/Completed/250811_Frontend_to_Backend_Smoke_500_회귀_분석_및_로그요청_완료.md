# [프론트엔드→백엔드] Smoke 500 회귀 분석 및 서버 로그/원인 파악 요청 (2025-08-11)

## 1) 배경/현황

- CORS 최종 도메인 확정 및 1회차 스모크 결과를 전달드렸습니다.
- 5개 핵심 데이터 엔드포인트가 500으로 응답하여(동일 포맷, text/plain: "Internal Server Error"), 원인 파악을 위한 로그 협조를 요청드립니다.

## 2) 프론트 병행 진행 사항

- 스모크 자동화 스크립트: `scripts/smoke.ps1`, `scripts/smoke-detail.ps1` (실패 전문 요약 수집)
- UX 표준화: 상세/목록/Comparables 화면에 로딩/에러/빈 상태 및 재시도 버튼 적용
- API 레이어 안정화: 기본 타임아웃(10s), 표준 에러(`ApiError`) 도입, text/plain 오류 캡처

## 3) 요청 사항

- A. 서버 로그 공유 (가능한 범위)

  - 기간: 2025-08-11 00:42:00Z ± 2분
  - 대상: GET `items/simple`, `items`, `auction-completed`, `real-transactions`, `real-rents`
  - 항목: 상태코드/스택트레이스/DB 쿼리 오류/직렬화 에러/미들웨어 예외 등 핵심 로그

- B. 환경/데이터 확인

  - DB 마이그레이션/시드 데이터 적용 여부
  - 직렬화 스키마/응답 모델 상이 여부 (Swagger 스키마와 런타임 동기화 확인)
  - 쿼리 파라미터 기본값/필수값 누락 시 처리 정책 확인

- C. 재현 가이드 동기화
  - Swagger에 최소 성공 파라미터 예시 명시(예: `limit=1` 등)
  - text/plain 오류 대신 JSON 오류 포맷 통일 가능 여부

## 4) 수용 기준(AC)

- 5개 엔드포인트 최소 호출이 200 OK (3회 반복 일관)
- Swagger 동기화(최소 파라미터/스키마) 및 오류 응답 포맷 합의

## 5) 참고

- CORS 회신/스모크 결과: `Communication/Backend/send/Request/250811_Frontend_to_Backend_CORS_도메인_회신_및_스모크_재검증_결과.md`
- 스모크 로그 스크립트: `scripts/smoke.ps1`, `scripts/smoke-detail.ps1`
- 프론트 로그: `Log/250811.md`

---

- Status: Sent
- Requester: Frontend 팀
- Assignee: Backend 팀
- Sent At: 2025-08-11
