# [프론트엔드→인프라] Vercel 프로젝트 생성/ENV 설정 사전요건 회신 및 진행계획 (2025-10-15)

## 1) 요약

- 요청서(Infra→Frontend, 2025-10-15)를 확인했고, 레포 상태 점검을 완료했습니다.
- 프론트 레포 `booster-frontend`는 실제 빌드 루트가 `Application` 폴더입니다. Vercel 프로젝트 생성 시 Root Directory를 `Application`으로 지정해야 합니다.
- ENV로는 Preview/Production 모두 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 필요합니다. Service Role Key는 서버/엣지 기능 도입 시에만 사용합니다.

## 2) 레포 준비 현황(프론트 측)

- Sentry 사용 코드 존재 → `@sentry/nextjs` 의존성 항목을 `Application/package.json`에 추가했습니다.
- 경로 별칭(`@/*`)은 `Application/tsconfig.json`에 이미 설정되어 있습니다.
- `.env.example`를 `Application/.env.example`로 추가하여 Supabase ENV 자리표시자를 제공했습니다.

## 3) 인프라 측 필요 사전요건

- Vercel 조직 접근 권한(프로젝트 생성 권한 포함)
- Supabase 프로젝트 키 2종 제공(Secrets 경로)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4) 실행 계획(체크리스트)

1. Vercel 프로젝트 생성
   - GitHub 레포: `booster-frontend`
   - Framework: Next.js
   - Root Directory: `Application`
   - Build Command: `next build` (Install Command 기본값)
   - Node.js Version: 20.x
2. ENV 등록(Preview/Production 동시)
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon key
   - (옵션) 서버/엣지 기능 도입 시 `SUPABASE_SERVICE_ROLE_KEY` 추가
3. Git 연동/자동 배포
   - 브랜치 푸시 시 Preview 자동 생성, `main` 머지 시 Production 배포
4. (선택) 프리뷰 보호/이미지 도메인 허용
   - 필요 시 프리뷰 접근 제한 설정
   - `next.config.mjs`의 이미지 도메인 허용 목록은 실제 도메인 확정 후 추가 예정

## 5) 검증(DoD)

- Preview 배포 성공 및 프리뷰 URL 정상 렌더링(메인 페이지)
- ENV 주입 확인(Supabase 클라이언트 초기화 에러 없음)
- 빌드 에러(모듈 누락/경로 별칭) 미발생

## 6) 일정 제안

- D+1: Vercel 프로젝트 생성 및 ENV 등록, 첫 Preview 확인
- D+2: (필요 시) 레포 빌드 오류 해소 후 재배포 확인
- D+3: Production ENV 반영(운영 배포는 합의 후)

## 7) 요청사항(인프라에게)

- 위 3) 항목의 권한/키 제공을 부탁드립니다. 제공 즉시 4) 실행 계획대로 착수하겠습니다.

## 8) 산출물

- Preview URL 1개(최신), Production 설정 스크린샷(ENV 탭)
