# [프론트엔드→백엔드] STAGING/PRODUCTION API Base URL 및 CORS Origin 확정 요청 - 처리 완료 (2025-08-13)

## 1. 요청 요약

- 공식 API Base URL 확정(STG/PRD)
- `/health` 노출/검증 가능 여부
- CORS 허용 Origin 확정(dev/stg/prd)
- 스모크용 샘플 아이템 ID 3~5건

## 2. 백엔드 최종 회신 (What)

- 공식 API Base URL (확정안)

  - STAGING `NEXT_PUBLIC_API_BASE_URL`: https://stg-api.budongsanbooster.com
  - PRODUCTION `NEXT_PUBLIC_API_BASE_URL`: https://api.budongsanbooster.com
  - 비고: DNS/인프라 준비 완료 시 활성화. 현재는 정책 합의 목적의 확정안입니다.

- `/health` 엔드포인트

  - 노출 상태: 노출(200 OK)
  - 경로: GET /health
  - 예시 응답: `{ "status": "healthy", "service": "booster-backend" }`

- CORS 허용 Origin (프로토콜 포함)

  - dev: `http://localhost:3000`, `http://127.0.0.1:3000`
  - stg: `https://stg.budongsanbooster.com`, `https://main.<amplify-app-id>.amplifyapp.com`(Amplify 도메인 확정 시 업데이트)
  - prd: `https://www.budongsanbooster.com`
  - 설정 방식: 콤마 구분 문자열 또는 JSON 배열 모두 지원
    - 예) `BACKEND_CORS_ORIGINS=http://localhost:3000,https://stg.budongsanbooster.com`
    - 예) `BACKEND_CORS_ORIGINS=["http://localhost:3000","https://stg.budongsanbooster.com"]`

- 스모크 테스트용 샘플 아이템 ID (개발 DB)
  - 101, 102, 103, 104, 105
  - 사용처: 상세(`/api/v1/items/{id}`), Comparables(`/api/v1/items/{id}/comparables`)

## 3. 관련 정보 (Reference)

- 프론트 최신 상태: 5개 핵심 엔드포인트 및 상세/Comparables 3회 스모크 200 OK
- 백엔드 상태: 로컬 Docker + Postgres 정상, `/health` OK, 테스트 커버리지 ≥ 90%
- 관련 문서: `Doc/BACKEND_ARCHITECTURE.md`, `Log/250811.md`, `Log/250813.md`, `README.md`

## 4. 진행 상태

- Status: Completed
- Requester: 프론트엔드 팀
- Assignee: 백엔드 팀
- Requested At: 2025-08-11
- Completed At: 2025-08-13
- History:
  - 2025-08-11: 요청서 작성
  - 2025-08-13: 백엔드 회신 및 완료 처리(본 문서에 통합)
