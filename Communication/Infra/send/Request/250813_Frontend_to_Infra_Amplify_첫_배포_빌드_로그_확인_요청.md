# [프론트엔드→인프라] Amplify 첫 배포 빌드 로그 확인 요청 (2025-08-13)

## 1) 요청 개요 (Why?)

- 리포지토리에 `amplify.yml` 반영 완료. 빌드 재현성 및 러ntime 고정( Node 20, pnpm 9 ) 확인을 위해 첫 빌드 로그 검증이 필요합니다.

## 2) 요청 사항 (What & How?)

- [ ] Amplify 콘솔에서 첫 빌드 트리거 및 로그 공유
  - 로그에 아래 라인 포함 확인
    - `node -v` → 20.x
    - `pnpm -v` → 9.x
  - 설치/빌드 경로
    - preBuild: `cd Application && pnpm install --frozen-lockfile`
    - build: `cd Application && pnpm build`
- [ ] 아티팩트 경로 확인: `Application/.next`
- [ ] 캐시 경로 확인: `Application/node_modules/**/*`

### 보류 안내(비용 정책)

- 콘솔 빌드 트리거/재배포는 비용이 발생할 수 있으므로, 최종 배포 게이트에서 일괄 진행합니다.
- 현재는 문서·체크리스트·검증 포인트를 정리 완료한 상태이며, 허가 시 즉시 실행/검증/회신 가능합니다.

## 3) 참고

- 리포지토리 파일: `/amplify.yml`
- ENV 등록은 별도 요청서에 따라 진행

## 4) 진행 상태

- Status: In Progress
- Requester: 프론트엔드 팀
- Assignee: 인프라 팀
- Requested At: 2025-08-13
- Completed At:
- History:
  - 2025-08-13: 요청서 발신 (리포지토리 `amplify.yml` 반영 이후 로그 확인 요청)
  - 2025-08-13: 인프라 접수 및 빌드 로그 검증 런북 준비(`infra/runbooks/Amplify_First_Build_Verification.md`), 콘솔 실행은 비용 정책 승인 후 진행 [[보류 사유: 배포/콘솔 작업은 최종 게이트에서 일괄 수행]]
  - 2025-08-13: 비용 정책에 따라 첫 빌드 트리거를 최종 배포 직전으로 연기(보류) 결정, 허가 수령 즉시 실행 예정
