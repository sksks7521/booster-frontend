# [프론트엔드→인프라] 로컬 개발 SWC 바이너리 이슈로 인한 WASM 강제 및 경로 정책 가이드 요청 (2025-08-11)

## 1) 배경/현황

- Windows + OneDrive + 한글 경로 환경에서 Next.js SWC 네이티브 바이너리(@next/swc-win32-x64-msvc) 로딩 실패로 dev 서버가 기동되지 않습니다.
- 오류: `Failed to load SWC binary for win32/x64` (경로 내 한글이 깨져 표시됨)
- 프론트는 MSW 목으로 기능 개발을 지속하지만, 로컬 검증/빌드 안정화를 위한 우회 지침이 필요합니다.

## 2) 재현/환경

- OS: Windows 10.0.26100 (한글 경로 + OneDrive 동기화)
- Node: v22.17.0
- Next: 15.2.4 (App Router)
- 경로 예: `C:\\Users\\USER\\OneDrive\\사업\\부동산부스터\\...\\Application`
- 콘솔 요약:
  - `Attempted to load @next/swc-win32-x64-msvc ... is not a valid Win32 application.`
  - `Failed to load SWC binary for win32/x64`

## 3) 프론트 임시 조치(적용)

- WASM 강제 스크립트(`Application/package.json`):
  - `dev:msw`: `cross-env NEXT_PUBLIC_ENABLE_MSW=true NEXT_SWC_WASM=1 NEXT_DISABLE_SWC_BINARY=1 next dev`
- MSW 구성: `Application/mocks/*`, `app/layout.tsx`에서 `NEXT_PUBLIC_ENABLE_MSW=true` 시 워커 구동
- `@next/swc-wasm-nodejs`, `@next/swc-wasm-web` 설치(명시 버전 15.2.4)

## 4) 요청사항(What)

- A. 경로 정책 가이드
  - 로컬 개발/빌드 경로를 영문 루트(예: `C:\\work\\booster-frontend`)로 운영 권장 가이드 문서화
  - OneDrive 제외 또는 별도 워크스페이스 권고안 포함
- B. 빌드/런타임 표준화
  - CI 및 개발 가이드에 SWC WASM 강제 옵션 명시(네이티브 실패 시 자동 WASM 폴백)
  - README/Doc에 환경변수 표준 추가: `NEXT_SWC_WASM=1`, `NEXT_DISABLE_SWC_BINARY=1`
- C. 템플릿 제공
  - Windows PowerShell/VSCode Task 예시(경로 복제 → `npm ci` → `npm run dev:msw`) 제공 요청
- D. 공지
  - 인프라 공지 채널에 가이드 배포(로컬 환경 문의 감소)

## 5) 수용 기준(AC)

- 가이드 준수 시 로컬 dev(3000) 기동 성공
- CI 빌드에서 WASM 경로 정상 적용(네이티브 미사용 또는 자동 폴백)
- 문서/스크립트 저장소 반영 및 Onboarding 체크리스트 포함

## 6) 참고

- 패키지: `@next/swc-wasm-nodejs@15.2.4`, `@next/swc-wasm-web@15.2.4`
- 스크립트: `Application/package.json`의 `dev:msw`
- 목 구성: `Application/mocks/*`, `Application/app/layout.tsx`
- 프론트 로그: `Log/250811.md`

---

- Status: Sent
- Requester: Frontend 팀
- Assignee: Infra 팀
- Sent At: 2025-08-11
