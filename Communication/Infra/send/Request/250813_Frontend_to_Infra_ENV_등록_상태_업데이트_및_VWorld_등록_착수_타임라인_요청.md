# [프론트엔드→인프라] ENV 등록 상태 업데이트 및 VWorld 등록 착수 타임라인 요청 (2025-08-13)

## 1) 요청 개요 (Why?)

- 프론트는 `amplify.yml` 반영 및 Dev 서버/스모크/QA 준비를 완료했으며, 배포 환경 검증을 위해 Amplify ENV 값 등록 상태와 VWorld 도메인 등록 착수 일정을 확인하고자 합니다.

## 2) 요청 사항 (What & How?)

- [ ] Amplify ENV 등록 상태 업데이트
  - `NEXT_PUBLIC_API_BASE_URL` (dev / stg / prod)
  - `NEXT_PUBLIC_VWORLD_API_KEY` (dev / stg / prod)
  - 완료 후 반영 시각/대상 App/브랜치 정보 공유
- [ ] VWorld 콘솔 등록 착수 타임라인 공유
  - 합의 도메인: dev=`*.amplifyapp.com`, stg=`*.amplifyapp.com`, `stg.budongsanbooster.com`, prod=`www.budongsanbooster.com`
  - 등록 완료 후 스크린샷 또는 완료 안내 회신
- [ ] Amplify 첫 빌드 트리거 허가 시점 공유
  - 허가 즉시 FE가 빌드 실행 및 런북 기준 검증 결과 회신

### 보류/대체 안내

- Amplify ENV 등록/재배포는 콘솔 동작으로 비용 발생 가능 → 최종 배포 게이트에서 일괄 진행합니다.
- VWorld는 운영 전환 승인까지(약 10일) 등록 불가 상태 → 임시로 Kakao JS 지도 사용 전환 결정.
- 프론트 적용 체크리스트: Kakao JavaScript 키 발급, 도메인 등록, `NEXT_PUBLIC_MAP_PROVIDER=kakao`, `NEXT_PUBLIC_KAKAO_APP_KEY` 설정.

## 3) 참고

- 단일 출처 런북: `booster-infra/infra/runbooks/Amplify_First_Build_Verification.md`
- 리포지토리: `/amplify.yml`

## 4) 진행 상태

- Status: In Progress
- Requester: 프론트엔드 팀
- Assignee: 인프라 팀
- Requested At: 2025-08-13
- Completed At:
- History:
  - 2025-08-13: 요청서 발신 (런북 단일 출처 합의 이후)
  - 2025-08-13: 비용 정책에 따라 Amplify ENV 등록 보류 결정(최종 배포 직전 일괄), VWorld 운영 전환 대기 및 Kakao 전환 안내
