# [프론트엔드→백엔드] STAGING/PRODUCTION API Base URL 및 CORS Origin 확정 요청 (2025-08-11)

## 1. 요청 개요 (Why?)

- 프론트엔드 배포(Amplify) 환경별 ENV 주입을 위해, 백엔드의 공식 STAGING/PRODUCTION API Base URL이 필요합니다.
- 또한 브라우저 CORS 허용 도메인 목록을 사전 확정해야 배포 후 스모크 시 차단 이슈를 방지할 수 있습니다.

## 2. 작업 요청 사항 (What & How?)

- [ ] 공식 API Base URL 확정 및 회신
  - STAGING `NEXT_PUBLIC_API_BASE_URL`: (예) https://stg-api.budongsanbooster.com
  - PRODUCTION `NEXT_PUBLIC_API_BASE_URL`: (예) https://api.budongsanbooster.com
- [ ] `/health` 엔드포인트 노출/검증 가능 여부 확인
- [ ] CORS 허용 Origin 목록 확정 및 회신(프로토콜 포함)
  - dev/stg: (예) https://main.<amplify-app-id>.amplifyapp.com, https://stg.budongsanbooster.com
  - prod: https://www.budongsanbooster.com
- [ ] 샘플 아이템 ID(상세/Comparables 스모크용) 3~5건 공유

## 3. 관련 정보 (Reference)

- 프론트 최신 상태: 5개 핵심 엔드포인트 및 상세/Comparables 3회 스모크 200 OK
- 프론트 ENV 정책: `NEXT_PUBLIC_API_BASE_URL` 우선 사용(미설정 시 127.0.0.1:8000)
- 문서: `Doc/FRONTEND_ARCHITECTURE.md`, `Log/250811.md`

## 4. 진행 상태

- Status: Requested
- Requester: 프론트엔드 팀
- Assignee: 백엔드 팀
- Requested At: 2025-08-11
- Completed At:
- History:
  - 2025-08-11: 요청서 작성
