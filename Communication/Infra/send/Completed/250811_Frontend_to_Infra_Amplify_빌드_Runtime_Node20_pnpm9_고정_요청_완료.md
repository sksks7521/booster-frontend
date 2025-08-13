# [프론트엔드→인프라] Amplify 빌드 런타임(Node 20, pnpm 9) 고정 요청 (완료) (2025-08-13)

## 1) 완료 개요

- Amplify 빌드 런타임 고정에 대한 설정 스니펫과 절차를 준비 완료했습니다. 콘솔/리포 `amplify.yml` 반영은 합의 후 적용합니다.

## 2) 준비 내역

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

## 3) 진행 상태

- Status: Done (스니펫/절차 준비; 적용 보류)
- Requester: 프론트엔드 팀
- Assignee: 인프라 팀
- Requested At: 2025-08-11
- Completed At: 2025-08-13
- History:
  - 2025-08-13: 스니펫/절차 준비 및 완료 처리
