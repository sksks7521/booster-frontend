# [프론트엔드→인프라] Amplify 빌드 런타임(Node 20 LTS, pnpm 9) 고정 요청 (2025-08-11)

## 1. 요청 개요 (Why?)

- 로컬/CI 빌드 환경을 일치시켜 예측 가능한 배포를 보장하기 위해 Amplify 빌드 런타임 고정이 필요합니다.

## 2. 작업 요청 사항 (What & How?)

- [ ] Amplify 빌드 런타임 고정
  - Node: 20.x (LTS)
  - pnpm: 9.x
- [ ] 적용 위치
  - Amplify Console의 Build settings 또는 `amplify.yml`(필요 시)로 명시
- [ ] 적용 후 첫 배포 빌드 로그 공유(버전 인쇄 라인 포함)

## 3. 관련 정보 (Reference)

- Next.js(App Router) 최신 권장 런타임 호환성 기준
- 로컬 개발 환경 기준: Node 20.x, pnpm 9.x
- 문서: `Doc/FRONTEND_ARCHITECTURE.md`, `Log/250811.md`

## 4. 진행 상태

- Status: Requested
- Requester: 프론트엔드 팀
- Assignee: 인프라 팀
- Requested At: 2025-08-11
- Completed At:
- History:
  - 2025-08-11: 요청서 작성
