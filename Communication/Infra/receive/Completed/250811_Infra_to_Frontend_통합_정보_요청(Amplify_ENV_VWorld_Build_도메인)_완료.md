# [인프라→프론트엔드] 통합 정보 요청 (Amplify ENV · VWorld · Build · 도메인) (완료) (2025-08-11)

## 1. 요약(회신)

- Amplify App ID: 미정(최종 AWS 단계에서 제공 예정)
- 브랜치-환경 매핑(제안): `develop → staging`, `main → prod`
- ENV
  - `NEXT_PUBLIC_API_BASE_URL`
    - staging: <STAGING_API_URL> (미정)
    - prod: <PRODUCTION_API_URL> (미정)
  - `NEXT_PUBLIC_VWORLD_API_KEY`: 276AABBA-2990-3BAE-B46A-82A7FE6BE021
- VWorld 허용 도메인(제안):
  - dev: `*.amplifyapp.com`
  - stg: `*.amplifyapp.com` (또는 `stg.budongsanbooster.com` 확정 시 교체)
  - prod: `www.budongsanbooster.com`
- 빌드 고정값(제안): Node 20.x, pnpm 9.x, 추가 빌드 플래그 없음

## 2. 적용 방법

- Amplify 콘솔/CLI로 브랜치별 ENV 주입 후 Redeploy
- VWorld 콘솔에 도메인 등록 → 키 도메인 제한 적용 → FE 스모크(지도/목록/상세)

## 3. 진행 상태

- Status: Done
- Requester: 인프라 팀
- Assignee: 프론트엔드 팀
- Requested At: 2025-08-11
- Completed At: 2025-08-11
- History:
- 2025-08-11: 프론트엔드 회신(통합 값 및 절차 제안) 완료
