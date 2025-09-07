# 🏠 Booster Frontend

> **데이터 기반 빌라 가치분석 솔루션** - MVP 프론트엔드 애플리케이션

[![Technology Stack](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)](https://nextjs.org/)
[![State Management](https://img.shields.io/badge/Zustand-4.5-orange)](https://zustand-demo.pmnd.rs/)
[![Data Fetching](https://img.shields.io/badge/SWR-2.2-blue)](https://swr.vercel.app/)
[![UI Components](https://img.shields.io/badge/shadcn%2Fui-latest-black)](https://ui.shadcn.com/)
[![Styling](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

## 📖 프로젝트 개요

**Booster**는 데이터 기반 빌라 가치분석을 통해 투자자들에게 정확한 투자 의사결정을 돕는 웹 애플리케이션입니다.
실시간 매물 데이터, 시장 분석, 수익률 시뮬레이션을 통해 빌라 투자의 리스크를 최소화하고 수익을 극대화합니다.

### 🎯 핵심 기능

- **🔍 통합 분석**: 다중 조건 필터링 및 지도 기반 매물 검색
- **📊 상세 분석**: 개별 매물의 심층 시장 분석 및 비교 데이터
- **💰 수익률 계산기**: 투자 시나리오별 수익률 시뮬레이션
- **⭐ 관심 매물**: 개인화된 매물 즐겨찾기 및 관리
- **👤 사용자 관리**: 회원가입, 로그인, 구독 관리

## 🛠 기술 스택

### Frontend Core

- **Framework**: Next.js 15 (App Router, SSR/SSG)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI

### State & Data Management

- **Global State**: Zustand (필터, 인증, 즐겨찾기)
- **Server State**: SWR (데이터 페칭, 캐싱, 재검증)
- **Form Handling**: React Hook Form + Zod

### External APIs

- **Map Visualization**: VWorld API
- **Charts**: Chart.js
- **Backend**: FastAPI (Python) + AWS App Runner
- **Authentication**: Amazon Cognito

## 🏗 프로젝트 구조

```
Application/
├── app/                          # Next.js App Router
│   ├── analysis/                 # 통합 분석 페이지
│   │   └── [id]/                # 상세 분석 페이지
│   ├── calculator/               # 수익률 계산기
│   ├── favorites/                # 관심 매물
│   ├── login/ & signup/          # 인증 페이지
│   └── ...
├── components/                   # 재사용 가능한 컴포넌트
│   ├── features/                 # 기능별 컴포넌트
│   │   ├── filter-control.tsx    # 필터 제어
│   │   ├── map-view.tsx          # 지도 뷰
│   │   └── item-table.tsx        # 매물 테이블
│   ├── layout/                   # 레이아웃 컴포넌트
│   └── ui/                       # shadcn/ui 컴포넌트
├── hooks/                        # 커스텀 훅
│   ├── useItemDetail.ts          # 매물 상세 정보
│   └── use-toast.ts              # 토스트 알림
├── store/                        # Zustand 스토어
│   └── filterStore.ts            # 필터 상태 관리
├── lib/                          # 유틸리티
│   ├── api.ts                    # API 클라이언트
│   └── utils.ts                  # 공통 유틸리티
└── styles/                       # 글로벌 스타일
    └── globals.css
```

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18+
- pnpm (권장 패키지 매니저)

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/sksks7521/booster-frontend.git
cd booster-frontend/Application

# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev
```

개발 서버가 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

### 환경 변수 설정

```bash
# .env.local 파일 생성 (또는 PowerShell에서 직접 설정)
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_VWORLD_API_KEY=your_vworld_api_key
# 지도 Provider 임시 전환 (Kakao)
NEXT_PUBLIC_MAP_PROVIDER=kakao
NEXT_PUBLIC_KAKAO_APP_KEY=your_kakao_js_app_key
```

## 📋 개발 현황

### ✅ 완료된 기능

- **Phase 0**: 프로젝트 기반 설정 (Next.js, Tailwind, shadcn/ui)
- **Phase 1**: 핵심 레이아웃 및 사용자 인증
- **Phase 2**: 필터 상태 관리 (Zustand 구조 구현)
- **Phase 3**: 상세 분석 페이지 데이터 로딩 (SWR 구조 구현)
- **🎉 백엔드 API 완전 연동**: 실시간 매물 데이터 1,000건 연동
- **🎯 지역 필터 완성**: 9개 시도 → 시군구 → 읍면동 연쇄 선택
- **⚡ 개발환경 안정화**: UTF-8 인코딩, 포트 표준화 완료

### 🔄 진행 중

- **Phase 2**: 통합 분석 화면 데이터 시각화 (UI/UX 개선 완료)
- **Phase 3**: 상세 분석 비교 데이터 기능

### 📊 연동 완료 (백엔드 API)

- ✅ `GET /api/v1/locations/tree-simple` - 지역 데이터 API
- ✅ `GET /api/v1/items/simple` - 매물 목록 API (1,000건)
- 🔄 `GET /api/v1/items/{id}/comparables` - 비교 데이터 API (진행중)

자세한 개발 로드맵은 [`PROJECT_FRONTEND_ROADMAP.md`](./PROJECT_FRONTEND_ROADMAP.md)를 참고해주세요.

### 📚 런북/구축 가이드

- 분석/목록 페이지 확장을 위한 표준 런북: [`Doc/LearnBook/Analysispage.md`](./Doc/LearnBook/Analysispage.md)
 - 지도 팝업 아키텍처: [`Doc/Map/Popup_Architecture.md`](./Doc/Map/Popup_Architecture.md)
 - 새 데이터셋 팝업 스키마 추가 가이드: [`Doc/Map/Popup_Schema_Guide.md`](./Doc/Map/Popup_Schema_Guide.md)
 - 팝업 QA 체크리스트: [`Doc/QA/Popup_QA_Checklist.md`](./Doc/QA/Popup_QA_Checklist.md)

## 🏗 아키텍처 원칙

### State Management Strategy

- **Server State**: SWR로 API 데이터 캐싱 및 동기화
- **Global UI State**: Zustand로 필터, 인증, 즐겨찾기 관리
- **Local State**: useState로 컴포넌트 내부 상태 관리

### Component Architecture

- **Container/Presenter Pattern**: 데이터 로직과 UI 로직 분리
- **Single Responsibility**: 각 컴포넌트는 하나의 책임만 담당
- **Reusability**: shadcn/ui 기반의 재사용 가능한 컴포넌트

자세한 아키텍처 가이드는 [`Doc/FRONTEND_ARCHITECTURE.md`](./Doc/FRONTEND_ARCHITECTURE.md)를 참고해주세요.

## 🤝 협업 및 커뮤니케이션

### 팀 간 협업 가이드

- **백엔드**: [`Communication/COMMUNICATION_GUIDE(Frontend-Backend).md`](<./Communication/COMMUNICATION_GUIDE(Frontend-Backend).md>)
- **인프라**: [`Communication/COMMUNICATION_GUIDE(Frontend-Infrastructure).md`](<./Communication/COMMUNICATION_GUIDE(Frontend-Infrastructure).md>)
- **데이터분석**: [`Communication/COMMUNICATION_GUIDE(Frontend-Analysis).md`](<./Communication/COMMUNICATION_GUIDE(Frontend-Analysis).md>)

### 일일 개발 로그

개발 진행 상황은 [`Log/`](./Log/) 폴더에서 확인할 수 있습니다.

## 📝 스크립트

```bash
# 🚀 자동화 개발 서버 실행 (권장)
python run_server.py

# 수동 개발 서버 실행
pnpm dev:8000  # 백엔드 8000 포트 연결
pnpm dev       # 기본 실행

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 린팅
pnpm lint

# 타입 체크
pnpm type-check
```

### 🤖 자동화 스크립트 (run_server.py)

Windows 개발 환경의 복잡한 설정을 자동화하는 Python 스크립트:

- ✅ **환경변수 자동 설정**: API Base URL, SWC WASM 설정
- ✅ **포트 충돌 자동 해결**: 기존 프로세스 자동 종료
- ✅ **종속성 자동 확인**: Node.js, npm 버전 체크
- ✅ **크로스 플랫폼 지원**: Windows/Unix 호환
- ✅ **에러 처리**: 인코딩, 명령어 실패 자동 복구

## 🪟 Windows 로컬 개발 환경 가이드 (SWC WASM/경로 정책)

- 경로 정책: 영문 경로 권장(예: `C:\work\booster-frontend`), OneDrive 동기화 경로 회피
- SWC 설정: 환경변수로 WASM 강제 사용 권장
  - 개발: `pnpm dev`에 이미 반영된 값 사용
  - 수동 실행 시: `NEXT_SWC_WASM=1 NEXT_DISABLE_SWC_BINARY=1 next dev`
- 참고 문서: `booster-infra/infra/standards/Windows_Local_Dev_SWC_WASM_Policy.md`

## 🔧 코드 품질

- **ESLint**: 코드 품질 및 일관성 유지
- **Prettier**: 코드 포맷팅 자동화
- **TypeScript**: 타입 안전성 보장
- **Husky**: Git hooks를 통한 품질 관리

## 🚨 트러블슈팅 가이드

### 개발 서버 실행 문제 해결

#### ❌ 문제 1: `npm run dev:8000` 스크립트 없음

```bash
PS C:\...\booster-frontend> npm run dev:8000
npm error Missing script: "dev:8000"
```

**원인**: 프로젝트 루트에서 실행했지만, package.json이 `Application/` 디렉터리에 있음

**해결책**:

```bash
# 올바른 경로로 이동 후 실행
cd Application
npm run dev:8000

# 또는 자동화 스크립트 사용 (권장)
python run_server.py
```

#### ❌ 문제 2: SWC 바이너리 로딩 실패

```bash
⚠ Attempted to load @next/swc-win32-x64-msvc, but an error occurred
⨯ Failed to load SWC binary for win32/x64
```

**원인**: OneDrive 동기화 폴더의 한글 경로와 SWC 바이너리 호환성 문제

**해결책**:

```bash
# WASM 패키지 설치 (권장)
npm install @next/swc-wasm-nodejs @next/swc-wasm-web

# 또는 환경변수로 WASM 강제 사용
$env:NEXT_SWC_WASM="1"
$env:NEXT_DISABLE_SWC_BINARY="1"
npx next dev
```

#### ❌ 문제 3: PowerShell 구문 오류

```bash
'&&' 토큰은 이 버전에서 올바른 문 구분 기호가 아닙니다.
```

**원인**: PowerShell에서는 `&&` 연산자 대신 `;` 사용해야 함

**해결책**:

```bash
# ❌ Bash/CMD 구문
set VAR=value && command

# ✅ PowerShell 구문
$env:VAR="value"; command
```

#### ❌ 문제 4: 패키지 다운로드 프롬프트

```bash
Need to install the following packages:
next@15.4.7
Ok to proceed? (y)
```

**원인**: npx가 Next.js 패키지를 찾을 수 없어서 다운로드하려 함

**해결책**:

```bash
# 의존성이 설치되었는지 확인
npm install

# 또는 직접 Next.js 실행
npx next@latest dev
```

#### ❌ 문제 5: UTF-8 인코딩 에러

```bash
⨯ ./hooks/useLocations.ts
Error: Failed to read source code from [...]/useLocations.ts
Caused by:
stream did not contain valid UTF-8
```

**원인**: 파일 편집 중 UTF-8 인코딩이 손상됨 (특히 OneDrive 동기화 경로)

**해결책**:

```bash
# 1. 손상된 파일 삭제
Remove-Item Application/hooks/useLocations.ts -Force

# 2. 백업 파일에서 복구 (있는 경우)
Copy-Item Application/hooks/useLocations.ts.backup Application/hooks/useLocations.ts

# 3. 또는 파일 다시 생성 (UTF-8 인코딩으로)
# 코드 에디터에서 "UTF-8" 인코딩으로 저장
```

#### ❌ 문제 6: Next.js 빌드 캐시 에러

```bash
[Error: EINVAL: invalid argument, readlink 'C:\...\Application\.next\static\chunks\app']
```

**원인**: Next.js 빌드 캐시와 OneDrive 경로 충돌

**해결책**:

```bash
# 캐시 정리 후 재시작
Remove-Item .next -Recurse -Force
npm run dev:8000
```

### 💡 빠른 해결 방법 (올인원)

Windows에서 개발 서버 실행 시 아래 단계를 따르세요:

```bash
# 1. 올바른 디렉터리로 이동
cd Application

# 2. 의존성 설치 확인
npm install

# 3. PowerShell에서 환경변수 설정 후 실행
$env:NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:8000"
$env:NEXT_TELEMETRY_DISABLED="1"
npx next dev

# 또는 package.json 스크립트 사용 (추천)
npm run dev:8000

# 🚀 가장 간단한 방법: 자동화 스크립트
python run_server.py
```

### 🔍 문제 진단 체크리스트

개발 서버가 실행되지 않을 때 아래를 확인하세요:

- [ ] **위치 확인**: `Application/` 디렉터리에서 실행하고 있는가?
- [ ] **패키지 설치**: `node_modules` 폴더가 존재하는가?
- [ ] **포트 충돌**: 3000 포트가 이미 사용 중인가? (`netstat -an | findstr :3000`)
- [ ] **환경변수**: API Base URL이 올바르게 설정되었는가?
- [ ] **Node.js 버전**: 18+ 버전을 사용하고 있는가? (`node --version`)

### 📞 추가 지원

위 방법으로도 해결되지 않으면:

1. `Log/` 폴더의 최신 개발 로그 확인
2. `Communication/` 폴더의 팀 간 요청서 확인
3. GitHub Issues에 에러 로그와 함께 문의

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 👥 기여하기

1. 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

---

**개발팀**: Frontend Team  
**마지막 업데이트**: 2025-08-20  
**버전**: MVP v1.2 (Analysis 페이지 UI/UX 개선 완료)
