# [인프라→프론트엔드] SaaS-first 전환 안내 / ENV 및 스니펫 요청 (2025-10-13)

## 1) 배경/목적

- 인프라는 MVP 운영 단순화를 위해 Vercel/Supabase/토스/Sentry/Plausible/Metabase 조합으로 전환합니다.
- 프론트는 Vercel 배포, Supabase SDK, Plausible 스니펫, Sentry SDK를 적용합니다.

## 2) 프론트 요구사항(ENV/설정)

- [ ] ENV 등록(Prod/Preview 분리)
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SENTRY_DSN`, `SENTRY_ENV`, `SENTRY_RELEASE`
  - `PLAUSIBLE_DOMAIN`
  - (결제 필요 시) `NEXT_PUBLIC_TOSS_CLIENT_KEY`
- [ ] 스니펫/SDK 적용
  - Plausible 스니펫 + Goal 정의/UTM 표준 적용
  - Sentry `@sentry/nextjs` 초기화(브라우저/서버), 소스맵 업로드
  - Supabase JS SDK 세션 연동
- [ ] 라우팅 가드
  - Next.js Middleware로 role 기반 가드(`/premium/*` 제한)

## 3) 검증(DoD)

- [ ] Preview/Prod 빌드/배포 성공, 도메인/SSL 정상
- [ ] 로그인/권한 가드 동작(guest/member/premium/admin)
- [ ] Plausible 대시보드 수치 유입, Sentry 이벤트 수집

## 4) 일정

- 요청일: 2025-10-13
- 희망 회신: 2025-10-15 EOD

## 5) 참고

- `Doc/ENV_AND_SETUP_CHECKLISTS.md`
- `Doc/INFRA_ARCHITECTURE.md` v2.0
