# [인프라→프론트엔드] Amplify ENV 값 확정 필수 정보 요청 (완료) (2025-08-11)

## 1. 회신 정보 (What)

- Amplify App ID: 미정(배포 최종 단계에서 제공 예정)
- 브랜치-환경 매핑(제안): `develop → staging`, `main → prod`
- STAGING `NEXT_PUBLIC_API_BASE_URL`: <STAGING_API_URL> (미정)
- PRODUCTION `NEXT_PUBLIC_API_BASE_URL`: <PRODUCTION_API_URL> (미정)
- `NEXT_PUBLIC_VWORLD_API_KEY`: 276AABBA-2990-3BAE-B46A-82A7FE6BE021

## 2. 적용 방식 (How)

- 콘솔 또는 CLI(`aws amplify update-branch`) 중 택1
- App ID 확정 전까지 콘솔 등록 안내를 우선 적용

## 3. 진행 상태

- Status: Done
- Requester: 인프라 팀
- Assignee: 프론트엔드 팀
- Requested At: 2025-08-11
- Completed At: 2025-08-11
- History:
  - 2025-08-11: 프론트엔드 회신(필수 정보 제공, 일부 값 미정 표기) 완료
