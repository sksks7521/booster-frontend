# [인프라→프론트엔드] Amplify ENV 값 확정 및 등록 절차 합의 요청 (완료) (2025-08-11)

## 1. 요청 개요 (Why?)

- Amplify 환경변수 최종 확정 및 등록/재배포 절차 합의를 위한 요청에 대해 프론트엔드 회신입니다.

## 2. 확정/제안 값 (Summary)

- Amplify App ID: 미정(최종 AWS 단계에서 제공 예정)
- 브랜치-환경 매핑(제안): `develop → staging`, `main → prod`
- ENV 변수
  - `NEXT_PUBLIC_API_BASE_URL`
    - staging: <STAGING_API_URL> (미정, 백엔드/인프라와 함께 확정 필요)
    - prod: <PRODUCTION_API_URL> (미정, 백엔드/인프라와 함께 확정 필요)
  - `NEXT_PUBLIC_VWORLD_API_KEY`: 276AABBA-2990-3BAE-B46A-82A7FE6BE021

## 3. 등록 및 재배포 절차 (How)

1. 콘솔 경로: Amplify → 앱(`booster-frontend` / `Application`) → 브랜치(develop, main) → 환경변수 → 아래 키/값 등록
2. App ID 확정 후 CLI 사용 시:

```bash
aws amplify update-branch --app-id <APP_ID> --branch-name develop \
  --environment-variables NEXT_PUBLIC_API_BASE_URL=<STAGING_API_URL>,NEXT_PUBLIC_VWORLD_API_KEY=276AABBA-2990-3BAE-B46A-82A7FE6BE021
aws amplify update-branch --app-id <APP_ID> --branch-name main \
  --environment-variables NEXT_PUBLIC_API_BASE_URL=<PRODUCTION_API_URL>,NEXT_PUBLIC_VWORLD_API_KEY=276AABBA-2990-3BAE-B46A-82A7FE6BE021
```

3. 적용 후: 브랜치별 Redeploy 진행, 배포 완료 후 FE 스모크(목록/상세/지도) 수행

## 4. 진행 상태

- Status: Done
- Requester: 인프라 팀
- Assignee: 프론트엔드 팀
- Requested At: 2025-08-11
- Completed At: 2025-08-11
- History:
  - 2025-08-11: 프론트엔드 회신(ENV 키/값 및 절차 제안) 완료
