# [프론트엔드→인프라] Amplify 환경변수 `NEXT_PUBLIC_API_BASE_URL` 등록 요청 (완료) (2025-08-13)

## 1) 완료 개요

- ENV 매핑과 절차서를 정리 완료했습니다. STG/PRD API Base URL 수신 시 즉시 등록 및 재배포 검증을 수행합니다.

## 2) 반영/준비 내역

- ENV 항목 정의: `infra/standards/ENV_SECRETS_MATRIX.md`
- 등록 절차: `infra/standards/Amplify_Deployment_Plan.md` (브랜치별 ENV 주입/재배포)

## 3) 보류/의존성

- STG/PRD API Base URL, Amplify App ID 수신 대기

## 4) 진행 상태

- Status: Done (준비 완료; 값 수신 대기)
- Requester: 프론트엔드 팀
- Assignee: 인프라 팀
- Requested At: 2025-08-08
- Completed At: 2025-08-13
- History:
  - 2025-08-11: ENV 매핑/절차서 정리
  - 2025-08-13: 완료 처리(값 수신 시 즉시 반영)
