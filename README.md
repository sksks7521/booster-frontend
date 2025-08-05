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
# .env.local 파일 생성
NEXT_PUBLIC_API_BASE_URL=your_backend_api_url
NEXT_PUBLIC_VWORLD_API_KEY=your_vworld_api_key
```

## 📋 개발 현황

### ✅ 완료된 기능
- **Phase 0**: 프로젝트 기반 설정 (Next.js, Tailwind, shadcn/ui)
- **Phase 1**: 핵심 레이아웃 및 사용자 인증
- **Phase 2**: 필터 상태 관리 (Zustand 구조 구현)
- **Phase 3**: 상세 분석 페이지 데이터 로딩 (SWR 구조 구현)

### 🔄 진행 중
- **Phase 2**: 통합 분석 화면 데이터 시각화
- **Phase 3**: 상세 분석 비교 데이터 기능

### ⏳ 대기 중 (백엔드 API 의존)
- `GET /api/v1/items` - 매물 목록 API
- `GET /api/v1/items/{id}/comparables` - 비교 데이터 API

자세한 개발 로드맵은 [`PROJECT_FRONTEND_ROADMAP.md`](./PROJECT_FRONTEND_ROADMAP.md)를 참고해주세요.

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
- **백엔드**: [`Communication/COMMUNICATION_GUIDE(Frontend-Backend).md`](./Communication/COMMUNICATION_GUIDE(Frontend-Backend).md)
- **인프라**: [`Communication/COMMUNICATION_GUIDE(Frontend-Infrastructure).md`](./Communication/COMMUNICATION_GUIDE(Frontend-Infrastructure).md)
- **데이터분석**: [`Communication/COMMUNICATION_GUIDE(Frontend-Analysis).md`](./Communication/COMMUNICATION_GUIDE(Frontend-Analysis).md)

### 일일 개발 로그
개발 진행 상황은 [`Log/`](./Log/) 폴더에서 확인할 수 있습니다.

## 📝 스크립트

```bash
# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 린팅
pnpm lint

# 타입 체크
pnpm type-check
```

## 🔧 코드 품질

- **ESLint**: 코드 품질 및 일관성 유지
- **Prettier**: 코드 포맷팅 자동화
- **TypeScript**: 타입 안전성 보장
- **Husky**: Git hooks를 통한 품질 관리

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
**마지막 업데이트**: 2025-08-05  
**버전**: MVP v1.0
