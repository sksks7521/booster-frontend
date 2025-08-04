# 🚀 부스터(Booster) Foundation

> 부동산 분석의 새로운 기준을 제시하는 혁신적인 플랫폼

## 📋 프로젝트 개요

**부스터(Booster)**는 부동산 전문가들이 빌라, 상가, 창고 등 비정형 부동산의 가치를 효율적으로 분석할 수 있도록 돕는 통합 분석 플랫폼입니다. 데이터 기반의 객관적 분석을 통해 투자 의사결정의 확신을 제공합니다.

### 🎯 핵심 가치
- **효율성**: 3시간 → 30분으로 분석 시간 단축
- **정확성**: 다양한 데이터 소스 통합으로 신뢰도 높은 분석
- **직관성**: 지도와 차트를 통한 시각적 데이터 표현
- **전문성**: 부동산 전문가의 워크플로우에 최적화

---

## 🎨 디자인 시스템

### 색상 팔레트

#### Primary Colors
\`\`\`css
/* 메인 브랜드 컬러 */
--primary-50: #eff6ff;    /* 매우 연한 파랑 */
--primary-100: #dbeafe;   /* 연한 파랑 */
--primary-500: #3b82f6;   /* 기본 파랑 */
--primary-600: #2563eb;   /* 진한 파랑 */
--primary-700: #1d4ed8;   /* 매우 진한 파랑 */
\`\`\`

#### Neutral Colors
\`\`\`css
/* 그레이 스케일 */
--gray-50: #f9fafb;       /* 배경색 */
--gray-100: #f3f4f6;      /* 연한 배경 */
--gray-200: #e5e7eb;      /* 경계선 */
--gray-500: #6b7280;      /* 보조 텍스트 */
--gray-700: #374151;      /* 주요 텍스트 */
--gray-900: #111827;      /* 제목 텍스트 */
\`\`\`

#### Status Colors
\`\`\`css
/* 상태 표시 컬러 */
--success: #10b981;       /* 성공/진행중 */
--warning: #f59e0b;       /* 주의/예정 */
--error: #ef4444;         /* 오류/취소 */
--info: #3b82f6;          /* 정보/기본 */
\`\`\`

### 타이포그래피

#### 폰트 패밀리
\`\`\`css
/* 기본 폰트 */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

/* 숫자 표시용 */
font-variant-numeric: tabular-nums;
\`\`\`

#### 폰트 크기 체계
\`\`\`css
/* 제목 */
--text-3xl: 1.875rem;     /* 30px - 메인 제목 */
--text-2xl: 1.5rem;       /* 24px - 섹션 제목 */
--text-xl: 1.25rem;       /* 20px - 서브 제목 */
--text-lg: 1.125rem;      /* 18px - 큰 본문 */

/* 본문 */
--text-base: 1rem;        /* 16px - 기본 본문 */
--text-sm: 0.875rem;      /* 14px - 작은 본문 */
--text-xs: 0.75rem;       /* 12px - 캡션/라벨 */
\`\`\`

### 간격 체계

\`\`\`css
/* 기본 간격 단위 (4px 기준) */
--space-1: 0.25rem;       /* 4px */
--space-2: 0.5rem;        /* 8px */
--space-3: 0.75rem;       /* 12px */
--space-4: 1rem;          /* 16px */
--space-6: 1.5rem;        /* 24px */
--space-8: 2rem;          /* 32px */
--space-12: 3rem;         /* 48px */
\`\`\`

### 그림자 체계

\`\`\`css
/* 카드 및 모달 그림자 */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
\`\`\`

---

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand (전역), React Hooks (지역)
- **Data Fetching**: SWR
- **Icons**: Lucide React

### Backend (예정)
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (AWS RDS)
- **Authentication**: Amazon Cognito
- **File Storage**: AWS S3
- **Deployment**: AWS App Runner

### External APIs
- **Maps**: VWorld API (국토지리정보원)
- **Charts**: Chart.js
- **Analytics**: Google Analytics 4, Mixpanel

---

## 📁 프로젝트 구조

\`\`\`
src/
├── app/                    # Next.js App Router
│   ├── analysis/          # 통합 분석 페이지
│   ├── item/[id]/         # 상세 분석 페이지
│   ├── login/             # 로그인 페이지
│   └── layout.tsx         # 루트 레이아웃
│
├── components/            # 재사용 컴포넌트
│   ├── ui/               # 기초 UI 컴포넌트
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── ...
│   ├── layout/           # 레이아웃 컴포넌트
│   │   ├── header.tsx
│   │   └── side-panel.tsx
│   └── features/         # 기능별 컴포넌트
│       ├── filter-control.tsx
│       ├── map-view.tsx
│       ├── item-table.tsx
│       └── ...
│
├── hooks/                # 커스텀 훅
├── lib/                  # 유틸리티 함수
├── services/             # API 서비스
├── store/                # Zustand 스토어
└── styles/               # 전역 스타일
\`\`\`

---

## 🎯 UI/UX 원칙

### 1. 명확성 (Clarity)
- **정보 계층 구조**: 중요한 정보를 시각적으로 강조
- **일관된 레이블링**: 동일한 기능은 동일한 용어 사용
- **명확한 피드백**: 사용자 액션에 대한 즉각적인 반응

### 2. 효율성 (Efficiency)
- **최소 클릭**: 주요 기능은 2클릭 이내 접근
- **키보드 단축키**: 전문가 사용자를 위한 단축키 제공
- **스마트 기본값**: 사용자가 자주 사용하는 설정을 기본값으로

### 3. 일관성 (Consistency)
- **디자인 패턴**: 동일한 기능은 동일한 UI 패턴 사용
- **색상 의미**: 상태별 색상 의미 일관성 유지
- **인터랙션**: 버튼, 링크 등의 동작 방식 통일

### 4. 접근성 (Accessibility)
- **색상 대비**: WCAG 2.1 AA 기준 준수
- **키보드 네비게이션**: 모든 기능 키보드로 접근 가능
- **스크린 리더**: 적절한 ARIA 라벨 및 역할 정의

---

## 🧩 컴포넌트 설계 원칙

### 1. 원자적 설계 (Atomic Design)
\`\`\`
Atoms (원자)
├── Button, Input, Badge, Spinner...

Molecules (분자)
├── SearchBox, FilterTag, MapMarker...

Organisms (유기체)
├── FilterControl, ItemTable, MapView...

Templates (템플릿)
├── AnalysisLayout, DetailLayout...

Pages (페이지)
├── AnalysisPage, DetailPage...
\`\`\`

### 2. 컴포넌트 명명 규칙
- **PascalCase**: 모든 컴포넌트명
- **명확한 의미**: 기능을 명확히 표현하는 이름
- **일관된 접미사**: `Control`, `View`, `Modal`, `Table` 등

### 3. Props 설계
\`\`\`typescript
interface ComponentProps {
  // 필수 props
  data: DataType;
  onAction: (param: ParamType) => void;
  
  // 선택적 props (기본값 제공)
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  
  // 스타일 커스터마이징
  className?: string;
  children?: React.ReactNode;
}
\`\`\`

---

## 📱 반응형 디자인

### 브레이크포인트
\`\`\`css
/* Mobile First 접근 */
--breakpoint-sm: 640px;   /* 태블릿 */
--breakpoint-md: 768px;   /* 작은 데스크톱 */
--breakpoint-lg: 1024px;  /* 데스크톱 */
--breakpoint-xl: 1280px;  /* 큰 데스크톱 */
\`\`\`

### 레이아웃 전략
- **Mobile**: 단일 컬럼, 풀스크린 모달
- **Tablet**: 2컬럼, 사이드 패널 토글
- **Desktop**: 3컬럼, 고정 사이드 패널

---

## 🔧 개발 가이드라인

### 1. 코드 스타일
\`\`\`typescript
// ✅ Good
const FilterControl = ({ onFilterChange, isCollapsed }: FilterControlProps) => {
  const [filters, setFilters] = useState<FilterState>({});
  
  const handleChange = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    onFilterChange({ ...filters, [key]: value });
  }, [filters, onFilterChange]);
  
  return (
    <div className="w-80 bg-white border-r border-gray-200">
      {/* 컴포넌트 내용 */}
    </div>
  );
};
\`\`\`

### 2. 상태 관리
- **지역 상태**: `useState`, `useReducer` 사용
- **전역 상태**: Zustand 스토어 사용
- **서버 상태**: SWR 훅 사용

### 3. 성능 최적화
- **React.memo**: 불필요한 리렌더링 방지
- **useCallback**: 함수 메모이제이션
- **useMemo**: 계산 결과 캐싱
- **Code Splitting**: 페이지별 번들 분리

### 4. 테스트 전략
- **Unit Tests**: 개별 컴포넌트 및 함수
- **Integration Tests**: 컴포넌트 간 상호작용
- **E2E Tests**: 주요 사용자 플로우

---

## 🚀 배포 및 운영

### 개발 환경
\`\`\`bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 린트 검사
npm run lint

# 타입 검사
npm run type-check
\`\`\`

### 배포 환경
- **Frontend**: AWS Amplify Hosting
- **Backend**: AWS App Runner
- **Database**: AWS RDS (PostgreSQL)
- **CDN**: CloudFront
- **Monitoring**: CloudWatch

---

## 📈 성능 목표

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5초
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### API 성능
- **응답 시간**: < 2초 (모든 주요 API)
- **가용성**: 99.9% 업타임
- **동시 사용자**: 100명 이상 지원

---

## 🔒 보안 가이드라인

### 1. 인증 및 인가
- **JWT 토큰**: 안전한 토큰 저장 및 갱신
- **HTTPS**: 모든 통신 암호화
- **CORS**: 적절한 도메인 제한

### 2. 데이터 보호
- **개인정보**: 최소 수집 원칙
- **암호화**: 민감 데이터 암호화 저장
- **로깅**: 개인정보 로그 제외

---

## 📚 참고 자료

### 디자인 시스템
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)

### 개발 도구
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [SWR Documentation](https://swr.vercel.app/)

### 외부 API
- [VWorld API 가이드](https://www.vworld.kr/dev/)
- [Chart.js Documentation](https://www.chartjs.org/docs/)

---

## 🤝 기여 가이드

### 1. 브랜치 전략
\`\`\`
main (프로덕션)
├── develop (개발)
├── feature/기능명
├── hotfix/수정사항
└── release/버전
\`\`\`

### 2. 커밋 메시지
\`\`\`
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 코드 추가
chore: 빌드 설정 변경
\`\`\`

### 3. 코드 리뷰
- **필수 리뷰어**: 최소 1명
- **체크리스트**: 기능, 성능, 보안, 접근성
- **자동화**: ESLint, Prettier, TypeScript 검사

---

*이 문서는 부스터 프로젝트의 기술적 기반을 정의하며, 프로젝트 진행에 따라 지속적으로 업데이트됩니다.*

**마지막 업데이트**: 2024년 1월
**버전**: 1.0.0
