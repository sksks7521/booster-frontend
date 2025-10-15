# [인프라→프론트엔드] Vercel 프로젝트 생성 및 ENV 설정 요청 (2025-10-15)

## 1) 배경/목적

- SaaS-first 전환에 따라 프론트 배포는 Vercel을 표준으로 사용합니다.
- 프론트 레포(`booster-frontend`)를 Vercel에 연결하고, Preview/Production 환경변수로 Supabase 키를 주입해 자동 배포 파이프라인을 활성화합니다.

참고 문서

- `Doc/Vercel_Setup_Guide.md`
- `Doc/Supabase_Integration_Plan.md`
- `Log/251014.md`

## 2) 요청 항목(체크리스트)

- [ ] Vercel 프로젝트 생성
  - GitHub 레포: `booster-frontend`
  - Framework: Next.js
  - Root Directory: `Application`
  - Build Command: `next build` (Install Command 기본값)
  - Node.js Version: 20.x
- [ ] ENV 등록(Preview/Production 모두)
  - `NEXT_PUBLIC_SUPABASE_URL` = Supabase Project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon key
  - (서버/Edge 전용 필요 시) `SUPABASE_SERVICE_ROLE_KEY`는 나중에 서버 기능 도입 시에만 등록
- [ ] Git 연동/자동 배포
  - 브랜치 푸시 시 Preview 자동 생성, `main` 머지 시 Production 배포
- [ ] (선택) 프리뷰 보호/이미지 도메인 허용
  - 필요 시 프리뷰 접근 제한 설정
  - `next.config.mjs`의 이미지 도메인 허용 목록 추가(향후 실제 도메인 확정 시)

## 3) 레포 측 빌드 오류 대응(권장)

- 누락 패키지 설치(프로젝트 루트가 아닌 `Application` 폴더에서 실행)
  - `@sentry/nextjs`
  - `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- 경로 별칭 설정(`Application/tsconfig.json`)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  }
}
```

## 4) 검증(DoD)

- [ ] Preview 배포 성공 및 프리뷰 URL 정상 렌더링(메인 페이지)
- [ ] ENV가 런타임에서 주입되어 Supabase 클라이언트 초기화 에러 없음
- [ ] 빌드 에러(모듈 누락/경로 별칭) 미발생

## 5) 일정 제안

- D+1: Vercel 프로젝트 생성 및 ENV 등록, 첫 Preview 확인
- D+2: 레포 빌드 오류(패키지/tsconfig) 해소 → 재배포 확인
- D+3: Production ENV 반영(운영 배포는 합의 후)

## 6) 공유/출력물

- Preview URL 1개(최신), Production 설정 스크린샷(ENV 탭)

## 7) 문의/의존

- Supabase 키는 인프라가 제공(Secrets 경로 참고).
- 프리뷰 도메인 확정 전까지는 CORS/Redirect 설정에 로컬만 반영되어 있어도 무방(배포 후 \*.vercel.app 추가 예정).
