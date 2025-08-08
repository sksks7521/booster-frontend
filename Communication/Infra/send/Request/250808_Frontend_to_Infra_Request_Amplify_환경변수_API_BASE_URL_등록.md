# [Frontend→Infra] Amplify 환경변수 `NEXT_PUBLIC_API_BASE_URL` 등록 요청 (2025-08-08)

## 1. 요청 개요 (Why?)

- 프론트엔드가 실제 API를 사용하도록 전환됨에 따라, 배포 환경에서 API 베이스 URL을 환경변수로 주입해야 합니다.
- 브랜치(또는 환경)별로 베이스 URL을 분리 관리하여 테스트/운영 안정성을 확보합니다.

## 2. 작업 요청 사항 (What & How?)

- [ ] AWS Amplify 콘솔의 `booster-frontend` 앱 환경변수에 아래 값을 등록해주세요.
  - 변수명: `NEXT_PUBLIC_API_BASE_URL`
  - 개발: `http://127.0.0.1:8000` (로컬 개발 참고)
  - 스테이징: `<staging-api-base-url>`
  - 운영: `<prod-api-base-url>`
- [ ] 브랜치별 환경 분리 설정(예: `develop` → 스테이징, `main` → 운영)

## 3. 관련 정보 (Reference)

- 코드 기반: `Application/lib/api.ts` (환경변수 우선, 기본값 폴백)
- 프론트 실데이터 전환: `Application/hooks/useItemDetail.ts` (`USE_REAL_API = true`)
- 백엔드 재검증: 5개 엔드포인트 3회 반복 200 OK (2025-08-08)

## 4. 진행 상태

- Status: Requested
- Requester: Frontend 팀
- Assignee: Infra 팀
- Requested At: 2025-08-08
- Completed At:
- History:
  - 2025-08-08: 요청서 작성
