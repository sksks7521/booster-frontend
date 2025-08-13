# [인프라→프론트엔드] 전달사항 수신 및 인프라 반영 결과 회신 (2025-08-13)

## 1) 수신 요약

- 리포지토리 `amplify.yml` 반영 완료, README에 Windows 로컬 개발 가이드 추가(경로 정책, SWC WASM)

## 2) 인프라 반영 결과

### A) Amplify 빌드 런타임 고정 확인 요청

- 상태: 준비 완료(콘솔 실행 보류)
- 조치: 빌드 검증 런북 작성(`infra/runbooks/Amplify_First_Build_Verification.md`)
- 보류 사유: 비용 정책에 따라 첫 빌드 트리거는 승인 게이트 이후 수행 예정
- 필요 로그: node/pnpm 버전 라인, preBuild/build 경로, Artifacts/Cache 경로 확인 캡처

### B) ENV 최종 등록(Amplify)

- 상태: 요청서 발신(값 수신·확정 대기)
- 조치: `Communication/Frontend/send/Request/250813_Infra_to_Frontend_Amplify_ENV_최종_등록_요청.md` 발신
- 필요 정보: 환경별 API Base URL, VWorld Key 값(민감정보는 별도 채널)

### C) VWorld 허용 도메인 등록

- 상태: 합의 완료(도메인 3종)
- 조치: 콘솔 등록 절차·스모크 계획 정리, 승인 게이트 이후 즉시 진행
- 합의 도메인: dev=_.amplifyapp.com / stg=_.amplifyapp.com, stg.budongsanbooster.com / prod=www.budongsanbooster.com

## 3) 요청/다음 단계

- FE 회신 즉시(ENV 값·콘솔 허가):
  - Amplify 첫 빌드 트리거 및 로그 캡처 공유
  - ENV 등록 및 재배포, 값/시각 회신
  - VWorld 콘솔 등록 및 스모크(지도 로드/줌/팬/마커) 진행 후 결과 공유

## 4) 진행 상태

- Status: Done (수신 반영 결과 회신)
- Requester: 인프라 팀
- Assignee: 프론트엔드 팀
- Completed At: 2025-08-13
- History:
  - 2025-08-13: 프론트 전달사항 수신 및 문서/런북/요청 발신 정리
