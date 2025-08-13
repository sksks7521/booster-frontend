# [인프라→프론트엔드] ENV 등록/첫 빌드/도메인 등록 회신 및 착수 타임라인 (2025-08-13)

## 1) 요약

- 런북 단일 출처 합의 반영: `infra/runbooks/Amplify_First_Build_Verification.md`
- ENV 등록 체크리스트 정리: `infra/runbooks/Amplify_ENV_Registration_Checklist.md`
- App Runner/모니터링/TF 원격상태 문서 정비: `infra/runbooks/AppRunner_Deployment_Checklist.md`, `infra/standards/CloudWatch_Dashboard_Widgets.md`, `infra/terraform/global/backend/*.backend.hcl.example`

## 2) 회신 및 후속 액션

### A) Amplify 첫 빌드 트리거/검증

- 상태: 준비 완료(콘솔 실행은 승인 시 즉시)
- 검증 포인트: node 20.x, pnpm 9.x, preBuild/build 경로, Artifacts `Application/.next`, Cache `Application/node_modules/**/*`
- 필요: 빌드 트리거 허가 시각 공유 → 즉시 실행/캡처 회신

### B) ENV 최종 등록 상태 업데이트

- 대상: `NEXT_PUBLIC_API_BASE_URL`(dev/stg/prod), `NEXT_PUBLIC_VWORLD_API_KEY`(dev/stg/prod)
- 필요: 각 환경 값 및 대상 App/브랜치 정보(App ID 포함) 공유(민감정보는 별도 채널)
- 액션: 수령 즉시 등록→재배포→`Amplify_ENV_Registration_Checklist` 템플릿으로 결과 회신

### C) VWorld 콘솔 등록 착수 타임라인

- 합의 도메인: dev=_.amplifyapp.com / stg=_.amplifyapp.com, stg.budongsanbooster.com / prod=www.budongsanbooster.com
- 타임라인 제안: 허가 수령 당일 dev/stg 등록, prod는 도메인 연결 타이밍에 맞춰 동시 진행
- 액션: 등록 완료 스크린샷/완료 안내 회신 → FE 지도 스모크 진행

## 3) 관련 변경/생성 파일(인프라)

- `infra/runbooks/Amplify_First_Build_Verification.md`
- `infra/runbooks/Amplify_ENV_Registration_Checklist.md`
- `infra/runbooks/AppRunner_Deployment_Checklist.md`
- `infra/standards/CloudWatch_Dashboard_Widgets.md`
- `infra/terraform/global/backend/{dev,stg,prod}.backend.hcl.example`
- `infra/terraform/envs/{dev,prod}/terraform.tfvars.example`

## 4) 진행 상태

- Status: Done (회신)
- Requester: 인프라 팀
- Assignee: 프론트엔드 팀
- Completed At: 2025-08-13
- History:
  - 2025-08-13: 회신 및 착수 타임라인 공유
