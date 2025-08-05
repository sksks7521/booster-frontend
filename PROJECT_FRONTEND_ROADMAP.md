### **Booster MVP 프론트엔드 개발 상세 로드맵**

- **1.1. 프로젝트 생성 및 초기 설정**
  - 1.1.1. `Next.js` 프로젝트 생성 (App Router, TypeScript 기반)
  - 1.1.2. `tsconfig.json`에 절대 경로(`@/*`) 및 개발 환경에 맞는 설정 추가
- **1.2. 핵심 라이브러리 및 개발 도구 설치/설정**
  - 1.2.1. **UI & 스타일링:** `Tailwind CSS`, `shadcn/ui` 설치 및 `tailwind.config.ts` 초기 설정
  - 1.2.2. **상태 관리 & 데이터 통신:** `Zustand`, `SWR` 라이브러리 설치
  - 1.2.3. **코드 품질:** `ESLint`, `Prettier` 설치 및 규칙(Rule) 설정
  - 1.2.4. **Git Hooks:** `husky`를 설정하여 커밋 전 `lint` 및 `format` 자동 실행
- **1.3. 프로젝트 구조 및 버전 관리**
  - 1.3.1. `FRONTEND_ARCHITECTURE.md` 문서에 명시된 디렉토리 구조(`app`, `components`, `hooks` 등) 생성
  - 1.3.2. GitHub에 `booster-frontend` 레포지토리 생성 및 연동, 초기 설정 내용 Push

| Task                                           | Status   | 담당자 | 완료일         | 비고                        |
| :--------------------------------------------- | :------- | :----- | :------------- | :-------------------------- |
| **Phase 0: 프로젝트 기반 설정**                | **Done** |        | **2025-08-04** |                             |
| 1.1. 프로젝트 생성 및 초기 설정                | Done     |        | 2025-08-04     |                             |
| 1.1.1. Next.js 프로젝트 생성                   | Done     |        | 2025-08-04     | App Router, TypeScript      |
| 1.1.2. tsconfig.json 절대 경로 설정            | Done     |        | 2025-08-04     | `@/*` 패턴 추가             |
| 1.2. 핵심 라이브러리 및 개발 도구 설치/설정    | Done     |        | 2025-08-04     |                             |
| 1.2.1. UI & 스타일링 설정                      | Done     |        | 2025-08-04     | Tailwind, shadcn/ui         |
| 1.2.2. 상태 관리 & 데이터 통신 라이브러리 설치 | Done     |        | 2025-08-04     | Zustand, SWR                |
| 1.2.3. 코드 품질 도구 설정                     | Done     |        | 2025-08-04     | ESLint, Prettier            |
| 1.2.4. Git Hooks 설정                          | Done     |        | 2025-08-04     | husky, lint-staged          |
| 1.3. 프로젝트 구조 및 버전 관리                | Done     |        | 2025-08-04     |                             |
| 1.3.1. 아키텍처 기반 디렉토리 구조 생성        | Done     |        | 2025-08-04     |                             |
| 1.3.2. GitHub 레포지토리 연동                  | Done     |        | 2025-08-04     | `booster-frontend`          |
|                                                |          |        |                |                             |
| **Phase 1: 핵심 레이아웃 및 사용자 인증**      | **Done** |        | **2025-08-05** |                             |
| 2.1. 공통 레이아웃 및 UI 컴포넌트 개발         | Done     |        | 2025-08-05     |                             |
| 2.1.1. 전역 레이아웃 컴포넌트 구현             | Done     |        | 2025-08-05     | Header, Footer 등           |
| 2.1.2. 기초 재사용 UI 컴포넌트 등록            | Done     |        | 2025-08-05     | Button, Input, Card 등      |
| 2.2. 인증 페이지 UI 개발                       | Done     |        | 2025-08-05     |                             |
| 2.2.1. 로그인 페이지 UI 구현                   | Done     |        | 2025-08-05     | `/login`                    |
| 2.2.2. 회원가입 페이지 UI 구현                 | Done     |        | 2025-08-05     | `/signup`                   |
| 2.2.3. 비밀번호 찾기 페이지 UI 구현            | Done     |        | 2025-08-05     | `/forgot-password`          |
| 2.3. 인증 로직 구현                            | Done     |        | 2025-08-05     |                             |
| 2.3.1. 인증 API 연동 함수 작성                 | Done     |        | 2025-08-05     | `/services/auth.ts`         |
| 2.3.2. 전역 인증 스토어(Zustand) 생성          | Done     |        | 2025-08-05     | `/store/authStore.ts`       |
| 2.3.3. 사용자 정보 동기화를 위한 `useUser` 훅  | Done     |        | 2025-08-05     | SWR 기반                    |
| 2.3.4. 인증 폼 상태 및 유효성 검사 로직 구현   | Done     |        | 2025-08-05     | react-hook-form             |
| 2.4. 접근 제어(Routing Guard) 구현             | Done     |        | 2025-08-05     |                             |
|                                                |          |        |                |                             |
| **Phase 2: 통합 분석 화면 개발**               | Pending  |        |                |                             |
| 3.1. 화면 레이아웃 구현                        | Pending  |        |                |                             |
| 3.1.1. 3단 분할 뷰(SplitView) 구현             | Pending  |        |                | Resizable 라이브러리 사용   |
| 3.1.2. 좌측 필터 패널(`FilterControl`) 구현    | Pending  |        |                |                             |
| 3.1.3. 상단 선택 필터 바(`SelectedFilterBar`)  | Pending  |        |                |                             |
| 3.2. 필터링 기능 구현                          | Done     |        | 2025-08-05     |                             |
| 3.2.1. 전역 필터 스토어(Zustand) 생성          | Done     |        | 2025-08-05     | `/store/filterStore.ts`     |
| 3.2.2. 필터 UI 및 스토어 연동                  | Done     |        | 2025-08-05     |                             |
| 3.3. 데이터 시각화 (지도 & 테이블)             | Pending  |        |                |                             |
| 3.3.1. 데이터 Fetching `useItems` 훅 개발      | Blocked  |        |                | 백엔드 API 개발 대기        |
| 3.3.2. 지도(`MapView`) 개발                    | Pending  |        |                | VWorld API, 마커 클러스터링 |
| 3.3.3. 테이블(`ItemTable`) 개발                | Pending  |        |                | 페이지네이션 포함           |
| 3.3.4. 지도-테이블 상호작용 기능 구현          | Pending  |        |                |                             |
|                                                |          |        |                |                             |
| **Phase 3: 상세 분석 화면 개발**               | Pending  |        |                |                             |
| 4.1. 상세 페이지 기본 구조 구현                | Done     |        | 2025-08-05     |                             |
| 4.1.1. 동적 페이지 `/analysis/[id]` 생성       | Done     |        | 2025-08-05     |                             |
| 4.1.2. `useItemDetail` 훅 개발                 | Done     |        | 2025-08-05     | SWR 기반 (모의 fetcher)     |
| 4.1.3. 매물 정보 헤더(`PropertyHeader`) 구현   | Done     |        | 2025-08-05     |                             |
| 4.2. 탭 기반 비교 데이터 분석 기능 구현        | Pending  |        |                |                             |
| 4.2.1. 분석 탭(`AnalysisTabs`) UI 구현         | Pending  |        |                |                             |
| 4.2.2. `useComparableData` 훅 개발             | Blocked  |        |                | 백엔드 API 개발 대기        |
| 4.2.3. 비교 데이터 뷰(`ComparableDataView`)    | Pending  |        |                |                             |
|                                                |          |        |                |                             |
| **Phase 4: 수익률 계산기 및 구독 기능**        | Pending  |        |                |                             |
| 5.1. 수익률 계산기 기능 개발                   | Pending  |        |                |                             |
| 5.1.1. 계산기 대시보드 UI 개발                 | Pending  |        |                |                             |
| 5.1.2. 실시간 계산 로직 및 차트 연동           | Pending  |        |                | Chart.js                    |
| 5.2. 구독 및 결제 기능 개발                    | Pending  |        |                |                             |
| 5.2.1. 가격 정책 페이지(`/pricing`) UI 개발    | Pending  |        |                |                             |
| 5.2.2. 외부 결제 PG 연동                       | Pending  |        |                | 포트원 등                   |
| 5.2.3. 구독 상태 확인 `useSubscription` 훅     | Pending  |        |                |                             |
| 5.2.4. 유료 기능 접근 제어 로직 구현           | Pending  |        |                |                             |
|                                                |          |        |                |                             |
| **Phase 5: 최종 검수 및 배포**                 | Pending  |        |                |                             |
| 6.1. 품질 보증 (QA)                            | Pending  |        |                |                             |
| 6.1.1. 반응형 UI 및 브라우저 호환성 테스트     | Pending  |        |                |                             |
| 6.1.2. 기능 명세서 기반 QA 테스트              | Pending  |        |                |                             |
| 6.2. 성능 및 분석                              | Pending  |        |                |                             |
| 6.2.1. 성능 측정 및 최적화                     | Pending  |        |                | Lighthouse                  |
| 6.2.2. 분석 도구(GA4, Mixpanel) 연동           | Pending  |        |                |                             |
| 6.3. 배포 (Deployment)                         | Pending  |        |                |                             |
| 6.3.1. CI/CD 파이프라인 구축                   | Pending  |        |                | AWS Amplify Hosting         |
| 6.3.2. 프로덕션 배포 및 도메인 연결            | Pending  |        |                | `booster.com`, HTTPS        |
