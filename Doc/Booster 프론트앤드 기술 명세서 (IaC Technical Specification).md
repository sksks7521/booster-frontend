# **version : 2025.8.1**

## **Booster 프론트엔드: 기술 명세서 (Technical Specification)**

### **1. 개요 (Overview)**

#### **1-1. 문서 목표**

이 문서는 '부스터' 서비스의 프론트엔드 애플리케이션에 대한 모든 기술적 요구사항, 아키텍처, 개발 규칙을 정의하는 것을 목표로 한다. 이 문서는 프론트엔드 개발의 청사진이자, 백엔드 팀과의 협업을 위한 공식 가이드라인으로 사용된다.

#### **1-2. 시스템 목표**

모든 디바이스에서 최적의 사용자 경험을 제공하는 반응형 웹 애플리케이션을 구축한다. 백엔드 API와 효율적으로 통신하여 데이터를 시각적으로 표현하고, 사용자와의 복잡한 상호작용을 부드럽고 직관적으로 처리한다.

#### **1-3. 아키텍처 및 기술 스택**

- **언어/프레임워크**: React / Next.js
- **상태 관리**: Zustand (전역), React Hooks (지역)
- **데이터 통신**: SWR
- **스타일링**: Tailwind CSS
- **지도/차트**: VWorld API, Chart.js
- **애플리케이션 배포**: AWS Amplify Hosting

---

### **2. 프로젝트 구조 (Folder Structure)**

`src` 디렉토리 내의 폴더 구조는 아래와 같이 역할에 따라 명확하게 분리한다.

```
/src
|-- /app                 # Next.js의 App Router. 페이지 및 레이아웃
|-- /components          # 재사용 가능한 UI 컴포넌트
|   |-- /ui              # 버튼, 인풋 등 가장 작은 단위의 기초 블록
|   |-- /layout          # 헤더, 사이드 패널 등 뼈대 컴포넌트
|   |-- /features        # 특정 기능(분석, 계산기 등)을 위한 조합 컴포넌트
|-- /hooks               # 커스텀 React Hooks (예: useAuth)
|-- /lib                 # 외부 라이브러리 설정, 유틸리티 함수
|-- /services            # API 요청을 처리하는 함수들 (SWR 사용)
|-- /store               # Zustand 전역 상태 관리 스토어
|-- /styles              # 전역 CSS 파일
```

---

### **3. 아키텍처 설계 (Architecture Design)**

#### **3-1. 컴포넌트 아키텍처**

우리가 정의한 세분화된 컴포넌트 목록에 따라 개발을 진행한다.

- **기초 블록 (`/components/ui`)**: `Button.jsx`, `Input.jsx` 등 재사용 가능한 최소 단위 컴포넌트를 먼저 개발한다.
- **조합 컴포넌트 (`/components/features`)**: 기초 블록들을 조합하여 `FilterControl.jsx`, `CalculatorDashboard.jsx` 등 특정 기능을 수행하는 컴포넌트를 개발한다.

#### **3-2. 상태 관리 (State Management)**

- **전역 상태 (Global State)**: **Zustand**를 사용하여 애플리케이션 전체에서 공유되어야 하는 상태를 관리한다.
  - **관리 대상**: 로그인한 사용자 정보, 인증 토큰(Access Token), 구독 플랜 정보 등
- **서버 상태 (Server State)**: **SWR**을 사용하여 백엔드 API로부터 받아온 모든 데이터를 관리한다. SWR이 캐싱, 재검증 등을 자동으로 처리한다.
- **지역 상태 (Local State)**: 특정 컴포넌트 내에서만 사용되는 상태(예: 입력 필드의 값, 모달창의 열림/닫힘 여부)는 React의 기본 Hook인 \*\*`useState`\*\*를 사용한다.

#### **3-3. 라우팅 (Routing)**

**Next.js**의 App Router(파일 시스템 기반 라우팅) 규칙을 따른다.

- **통합 분석 화면**: `src/app/analysis/page.jsx`
- **상세 분석 화면**: `src/app/item/[itemId]/page.jsx`
- **로그인 화면**: `src/app/login/page.jsx`

---

### **4. 운영 및 관리 방안 (Operation & Management)**

#### **4-1. 버전 관리 및 배포**

- 모든 프론트엔드 관련 코드는 **Git**을 사용하여 `booster-frontend` 레포지토리에서 관리한다.
- `main` 브랜치에 코드가 병합(Merge)되면, **AWS Amplify Hosting**이 이를 자동으로 감지하여 빌드 및 운영 서버에 무중단 배포를 실행한다.

#### **4-2. API 통신**

- 백엔드 API 명세서에 정의된 모든 요청은 `/services` 폴더 내의 함수로 구현하여 일관성을 유지한다.
- 인증이 필요한 모든 API 요청 헤더에는 Zustand 스토어에 저장된 Access Token을 자동으로 포함시킨다.

#### **4-3. 코딩 컨벤션 및 품질 관리**

- **ESLint**와 **Prettier**를 도입하여 모든 코드에 일관된 스타일과 규칙을 강제한다.
- 새로운 기능 개발 및 수정 시, \*\*코드 리뷰(Code Review)\*\*를 통해 잠재적인 버그를 사전에 방지하고 코드 품질을 유지한다.
