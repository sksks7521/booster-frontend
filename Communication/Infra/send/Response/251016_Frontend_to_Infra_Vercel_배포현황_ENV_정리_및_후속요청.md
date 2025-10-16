# [FRONTEND → INFRA] Vercel 배포 현황, ENV 정리, 후속 요청 (251016)

## 1) 개요

프론트엔드 배포 안정화를 위해 필요했던 수정들을 완료했습니다. 현재 마스터 기준으로 빌드 성공 및 배포 가능 상태이며, 페이지별 메타데이터/에러 페이지/로봇스 정책을 반영했습니다. 아래에 완료 항목과 인프라에 필요한 후속 조치를 정리합니다.

## 2) 프론트엔드 측 완료 항목

- 의존성 누락으로 인한 빌드 실패 해소: `@sentry/nextjs`, `@dnd-kit/*` 추가
- Linux 환경 대소문자 이슈 수정: `Footer` import 경로 교정
- App Router 규칙 위반 수정: `useSearchParams` 사용 페이지에 `Suspense` 적용
- 글로벌 메타데이터 정비: `Application/app/layout.tsx`에 `title/description/metadataBase/OG/Twitter/robots` 적용
- 페이지별 메타데이터 적용(필수/권장 포함) 및 동적 상세 페이지 `generateMetadata` 반영
- 사이트맵/로봇스 정책 반영
  - `robots.ts`: 전역 Allow 현재 상태(요청 이력에 따라 조정 가능)
  - `sitemap.ts`: 기본 코어 경로 포함(필요 시 조정 가능)
- 에러/상태 페이지 추가
  - `Application/app/not-found.tsx` (404)
  - `Application/app/error.tsx` (500)
- 검색 비노출(noindex) 처리(페이지 레벨 robots)
  - 인증/개인화/전환: `/login`, `/signup`, `/forgot-password`, `/checkout`, `/mypage`, `/favorites`, `/popup/[id]`
  - 추가 요청 반영: `/calculator`, `/analysis/[id]/v2`

## 3) 인프라 후속 요청 (우선순위)

1. Production 사이트 URL 설정 (필수)

   - 목적: `metadataBase`, canonical, OG/Twitter의 절대 URL 정확화
   - 작업: Vercel → Project → Settings → Environment Variables
     - `NEXT_PUBLIC_SITE_URL` = 최종 프로덕션 도메인 (예: `https://example.com`)
     - 스코프: Production(필수), Preview(선택. 프리뷰용 별도 값 사용 시)

2. ENV 스코프 정리 (필수)

   - 목적: Preview/Production 간 환경값 혼선 방지
   - 작업: 다음 키를 Production/Preview 스코프로 분리 저장
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - (선택) `NEXT_PUBLIC_ENV` = `production`/`preview`

3. Vercel 빌드 설정 점검 (권장)

   - Root Directory = `Application`
   - Install Command = `pnpm install --frozen-lockfile`
   - Build Command = `next build`
   - `pnpm approve-builds` 경고는 Settings에서 승인하거나 비활성화 처리

4. Sentry 연동 준비 (선택, 추후 활성화 시)

   - Sentry 프로젝트 생성 후 Vercel ENV 등록:
     - `SENTRY_DSN` (필수)
     - (필요 시) `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`

5. 커스텀 도메인 연결 (선택, 결정 시)

   - Vercel Domains에 도메인 추가 → DNS 제공사에서 A/CNAME/TXT 설정 → Vercel 인증 완료 확인

6. 프리뷰 보호/브랜치 전략 (보류됨)
   - Password Protection은 요금제 이슈로 보류
   - 대안: 프리뷰 인덱싱 억제/도메인 분리 등은 필요 시 추후 적용

## 4) 현재 노출/비노출 정책 요약

- 노출(index): 홈, 분석, 요금제, 공지, 지원, 개인정보, 약관 등 공개 페이지
- 비노출(noindex): 로그인/회원가입/비밀번호 찾기/결제/마이페이지/관심/팝업 상세/계산기/상세분석(v2)

## 5) 검증 항목

- 마스터 푸시 시 프로덕션 배포가 정상 동작하는지
- 페이지별 `<title>`, `<meta name="description">`, OG/Twitter 카드 미리보기 정상 여부
- `robots.txt`(전역 Allow)와 각 페이지 레벨 `robots` 충돌 없음 확인
- `sitemap.xml`에 프로덕션 기본 경로 노출 확인(필요 시 목록 조정 가능)

## 6) 요청 종합

- [필수] `NEXT_PUBLIC_SITE_URL` 프로덕션 값 설정
- [필수] Supabase ENV Production/Preview 분리 저장
- [권장] 빌드 설정 확인 및 `approve-builds` 경고 정리
- [선택] Sentry/커스텀 도메인은 결정 시 진행

문의나 확인 필요 사항이 있으면 코멘트 부탁드립니다. 확인되면 프론트는 다음 공개 페이지 메타 보강 등 후속 작업을 이어가겠습니다.
