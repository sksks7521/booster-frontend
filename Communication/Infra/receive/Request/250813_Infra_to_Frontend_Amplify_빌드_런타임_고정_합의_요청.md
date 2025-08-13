# [인프라→프론트엔드] Amplify 빌드 런타임(Node 20, pnpm 9) 고정 합의 요청 (2025-08-13)

## 1) 요청 개요 (Why?)

- 로컬/CI/배포 환경의 빌드 재현성을 확보하기 위해 Amplify 빌드 런타임을 Node 20 LTS, pnpm 9로 고정하고자 합니다.

## 2) 작업 요청 사항 (What & How?)

- [ ] 아래 스니펫 기준으로 Amplify Console 또는 리포지토리 `amplify.yml`에 반영 합의
- [x] 아래 스니펫 기준으로 Amplify Console 또는 리포지토리 `amplify.yml`에 반영 합의 (리포지토리 `amplify.yml` 추가 완료)
- [ ] 첫 배포 빌드 로그에 `node -v`/`pnpm -v` 출력 확인

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - corepack enable
        - corepack prepare pnpm@9.0.0 --activate
        - node -v && pnpm -v
        - cd Application && pnpm install --frozen-lockfile
    build:
      commands:
        - pnpm build
  artifacts:
    baseDirectory: Application/.next
    files:
      - "**/*"
  cache:
    paths:
      - Application/node_modules/**/*
```

## 3) DoD

- 빌드 로그에 Node 20.x, pnpm 9.x 버전 라인 확인
- 빌드 성공 및 산출물 경로 `Application/.next` 확인

## 4) 진행 상태

- Status: Completed
- Requester: 인프라 팀
- Assignee: 프론트엔드 팀
- Requested At: 2025-08-13
- Completed At: 2025-08-13
- History:
  - 2025-08-13: 요청서 발신
  - 2025-08-13: `amplify.yml` 반영 및 합의 완료
