# [프론트엔드→백엔드] auction-completed 404 원인 확인 요청 (2025-08-28)

## 1) 개요

- 스모크 결과 로컬 기준 `/api/v1/auction-completed/?page=1&size=1`이 `404`를 반환합니다.
- 동일 시점에 `real-transactions`, `real-rents`는 `200 OK`입니다.

## 2) 재현 정보

- BaseURL: `http://127.0.0.1:8000`
- 요청: `GET /api/v1/auction-completed/?page=1&size=1`
- 기대: `200 OK` + `{ items,total,page,size,... }`
- 실제: `404`

## 3) 확인 요청 항목

1. 경로/라우팅: `/api/v1/auction-completed/` 라우트 활성화 여부
2. 권한/인증: 로컬에서 인증 요구 조건 또는 권한 제한 존재 여부
3. 데이터: 테이블 준비/마이그레이션 여부(데이터 미존재 시 404 처리되는지)
4. 에러 포맷: 404 응답 바디가 표준 에러 포맷 `{ message,status,detail }`로 내려오는지

## 4) 참고

- 프런트는 `page/size` 파라미터로 호출 및 응답 `{items,total,page,size,pages}` 표준을 기대합니다.
- 분석 v2에서는 서버 에러 시 빈 상태/재시도 가드 적용되어 UX 저하를 최소화합니다.

— Frontend Team, 2025-08-28
