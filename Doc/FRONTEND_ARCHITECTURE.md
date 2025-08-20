# Booster 프론트엔드 아키텍처 (v1.1)

## 1. 개요 (Overview)

### 1-1. 문서의 목표

이 문서는 Booster 프론트엔드 애플리케이션의 아키텍처를 정의하고, 기술적 의사결정의 배경과 기준을 공유하는 것을 목표로 합니다. 단순한 기술 목록을 넘어, **"왜 이 기술을 선택했고, 어떻게 조합하여 우리의 비즈니스 목표(PRD)를 달성할 것인가?"** 에 대한 명확한 청사진을 제시합니다.

이 문서는 새로운 팀원이 빠르게 프로젝트 구조를 파악하고, 기존 팀원들이 일관된 패턴으로 개발하며, 타 팀(백엔드, 인프라)이 프론트엔드를 이해하는 데 사용되는 **'살아있는 가이드'** 입니다.

### 1-2. 아키텍처 목표

우리가 지향하는 프론트엔드 아키텍처의 핵심 목표는 다음과 같습니다.

- **유지보수성 (Maintainability):** 코드는 예측 가능하고 쉽게 이해하고 수정할 수 있어야 합니다. 각 컴포넌트와 모듈은 명확한 단일 책임을 가져야 합니다.
- **확장성 (Scalability):** 새로운 기능이나 페이지가 추가될 때, 기존 아키텍처를 크게 변경하지 않고도 유연하게 확장할 수 있어야 합니다.
- **개발자 경험 (Developer Experience):** 명확한 구조와 규칙을 제공하여 개발자가 기능 구현 자체에 집중하고, 생산성을 극대화할 수 있는 환경을 제공합니다.

---

## 2. 핵심 기술 스택 및 선정 이유

| 역할            | 기술                     | 선정 이유 (Why?)                                                                                                                                                                                                        |
| :-------------- | :----------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **프레임워크**  | **Next.js (App Router)** | 서버 사이드 렌더링(SSR)과 정적 사이트 생성(SSG)을 지원하여 **초기 로딩 성능(FCP)과 검색 엔진 최적화(SEO)를 극대화**합니다. 파일 시스템 기반 라우팅은 직관적이고 관리가 용이합니다.                                      |
| **상태 관리**   | **Zustand**              | Redux의 복잡성과 보일러플레이트 없이, **간결하고 직관적인 API**로 전역 상태를 관리합니다. 특히 여러 컴포넌트에 걸쳐 공유되는 복잡한 필터 상태를 효율적으로 처리하는 데 적합합니다.                                      |
| **데이터 통신** | **SWR**                  | Next.js 개발사 Vercel이 직접 만든 라이브러리로 호환성이 뛰어납니다. **캐싱, 자동 재검증, 포커스 추적** 등 API 데이터를 항상 최신 상태로 유지하는 강력한 기능을 내장하여 개발 생산성을 높입니다.                         |
| **UI 컴포넌트** | **shadcn/ui & Radix UI** | 미리 디자인된 컴포넌트가 아닌, **재사용성과 접근성이 높은 코드 조각**을 제공하여 디자인 시스템을 밑바닥부터 완전하게 제어할 수 있습니다. Radix UI를 기반으로 하여 키보드 네비게이션 등 웹 접근성을 기본으로 보장합니다. |
| **스타일링**    | **Tailwind CSS**         | 유틸리티-우선(Utility-First) 접근법을 통해, 별도의 CSS 파일을 작성하지 않고 HTML 내에서 직접 스타일을 적용하여 **빠른 개발 속도와 일관된 디자인 시스템** 구축을 가능하게 합니다.                                        |

---

## 3. 디렉토리 구조 및 역할

프로젝트는 역할에 따라 명확하게 분리된 폴더 구조를 따릅니다.

```
/Application
|-- /app                 # Next.js의 App Router. 페이지 및 레이아웃
|-- /components          # 재사용 가능한 UI 컴포넌트
|   |-- /ui              # (Atoms) 버튼, 인풋 등 가장 작은 단위의 기초 블록 (shadcn/ui)
|   |-- /features        # (Organisms) 특정 기능(분석, 계산기 등)을 위한 조합 컴포넌트
|   |-- /layout          # (Templates) 헤더, 사이드 패널 등 뼈대 컴포넌트
|-- /hooks               # 커스텀 React Hooks (예: useMobile, useItems)
|-- /lib                 # API 클라이언트, 유틸리티 함수 (22개 API 엔드포인트, utils.ts)
|-- /store               # Zustand 전역 상태 관리 스토어 (예: filterStore.ts)
|-- /styles              # 전역 CSS 파일 (globals.css)
```

---

## 4. 아키텍처 패턴 및 데이터 흐름

### 4-1. 상태 관리 전략

Booster 프론트엔드는 데이터의 성격에 따라 3가지 종류의 상태를 명확히 구분하여 관리합니다.

| 상태 종류        | 관리 도구      | 관리 대상 데이터 예시                                                                  | 설명                                                                                           |
| :--------------- | :------------- | :------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **서버 상태**    | **SWR**        | - 매물 목록<br>- 사용자 정보<br>- 구독 플랜 정보                                       | 백엔드 API로부터 받아온 모든 데이터. SWR이 캐싱, 재검증, 로딩/에러 상태를 자동으로 관리합니다. |
| **전역 UI 상태** | **Zustand**    | - 통합 분석 화면의 필터 조건<br>- 사이드바 열림/닫힘 여부<br>- 수익률 계산기의 입력 값 | 여러 컴포넌트에서 공유되지만, 서버에 저장되지 않는 순수 UI 상태.                               |
| **지역 상태**    | **`useState`** | - Input 컴포넌트의 입력 값<br>- 모달의 열림/닫힘 여부                                  | 특정 단일 컴포넌트 내에서만 사용되는 임시 상태.                                                |

### 4-2. 데이터 흐름 다이어그램 (통합 분석 화면)

사용자가 필터를 변경했을 때의 데이터 흐름은 다음과 같습니다.

```mermaid
graph TD
    subgraph "A. 사용자 액션 (User Action)"
        A1(사용자가 FilterControl에서 '엘리베이터 유무' 체크)
    end

    subgraph "B. 상태 변경 (State Update)"
        A1 -- "onChange 이벤트 발생" --> B1("필터 스토어 액션 호출<br>setFilter({ has_elevator: true })")
        B1 --> B2{Zustand: filterStore<br>필터 상태 업데이트}
    end

    subgraph "C. 데이터 재검증 (Data Re-validation)"
        B2 -- "스토어 상태 변경 감지" --> C1("MapView, ItemTable 리렌더링")
        C1 --> C2("useItems 훅 실행")
        C2 -- "SWR 키 변경<br>(필터 조건이 키의 일부)" --> C3{SWR<br>API 자동 재요청<br>GET /api/v1/items?has_elevator=true}
    end

    subgraph "D. UI 업데이트 (UI Update)"
        C3 -- "API 응답 (매물 데이터)" --> D1("MapView, ItemTable에<br>새로운 데이터 전달 및 렌더링")
    end
```

---

## 5. 주요 기능 구현 전략

### 5-1. 통합 분석 화면

- **핵심 전략:** 컴포넌트의 완벽한 분리.
- `FilterControl` 컴포넌트는 오직 **Zustand 스토어의 상태를 변경하는 역할**만 수행합니다.
- `MapView`와 `ItemTable` 컴포넌트는 **Zustand 스토어의 상태를 구독**하고, 그 상태를 기반으로 각자 `useItems` 훅을 통해 필요한 데이터를 SWR로 가져와 렌더링합니다.
- 이 구조를 통해 각 컴포넌트는 서로를 전혀 알지 못하며, 오직 중앙 상태 저장소(Zustand)를 통해 통신하여 강력한 디커플링을 유지합니다.

### 5-2. 상세 분석 화면

- **핵심 전략:** 동적 라우팅과 조건부 데이터 로딩.
- Next.js의 동적 라우팅 (`/app/analysis/[id]/page.tsx`)을 사용하여 특정 매물의 상세 페이지를 구현합니다.
- 페이지 진입 시, `SWR`을 사용하여 해당 매물의 기본 정보(`GET /api/v1/items/{item_id}`)만 우선 로드하여 사용자에게 빠르게 화면을 보여줍니다.
- `AnalysisTabs` 컴포넌트에서 사용자가 특정 탭(예: '실거래가(매매)')을 클릭하면, 해당 탭에 필요한 비교 데이터(`GET /api/v1/items/{item_id}/comparables?data_type=trade_sale`)를 `SWR`로 **그 시점에 로드**합니다. 이를 통해 초기 로딩 시간을 단축하고 불필요한 API 호출을 방지합니다.

---

## 6. 핵심 컴포넌트 아키텍처 (2025-08-11 업데이트)

### 6-1. 투자 분석 플랫폼 구조

Booster는 단순한 매물 검색을 넘어 **완전한 투자 분석 플랫폼**으로 진화했습니다.

#### **핵심 기능 컴포넌트**

| 컴포넌트               | 파일 위치                                      | 역할                      | API 연동         |
| ---------------------- | ---------------------------------------------- | ------------------------- | ---------------- |
| **InvestmentAnalysis** | `/components/features/investment-analysis.tsx` | 3탭 투자 분석 UI          | Comparables API  |
| **FavoritesSystem**    | `/components/features/favorites-system.tsx`    | 완전한 즐겨찾기 관리      | 5개 즐겨찾기 API |
| **FilterControl**      | `/components/features/filter-control.tsx`      | 40+ 고급 필터링           | Items API        |
| **MapView**            | `/components/features/map-view.tsx`            | 지도 시각화 (vworld)      | Items API        |
| **ItemTable**          | `/components/features/item-table.tsx`          | 테이블 시각화             | Items API        |
| **CalculatorPage**     | `/app/calculator/page.tsx`                     | 수익률 계산기 전체 시스템 | 독립적 계산 로직 |
| **PricingPage**        | `/app/pricing/page.tsx`                        | 4단계 구독 플랜 관리      | 결제 API (예정)  |

#### **InvestmentAnalysis 컴포넌트 구조**

```typescript
// 3탭 구조로 완전한 투자 분석 제공
<Tabs defaultValue="comparison">
  <TabsList>
    <TabsTrigger value="comparison">비교 분석</TabsTrigger>
    <TabsTrigger value="statistics">시장 통계</TabsTrigger>
    <TabsTrigger value="investment">투자 분석</TabsTrigger>
  </TabsList>

  <TabsContent value="comparison">
    {/* 유사 매물 비교, 가격 분석 */}
    <ComparablePropertiesSection data={comparables} />
  </TabsContent>

  <TabsContent value="statistics">
    {/* 평균 가격, 가격 범위, 통계 차트 */}
    <MarketStatisticsSection data={statistics} />
  </TabsContent>

  <TabsContent value="investment">
    {/* 투자 잠재력, 유동성 점수, 위험도 평가 */}
    <InvestmentAnalysisSection data={marketAnalysis} />
  </TabsContent>
</Tabs>
```

#### **CalculatorPage 컴포넌트 구조**

```typescript
// 완전한 부동산 투자 수익률 계산 시스템
export default function CalculatorPage() {
  // 8개 카테고리 상태 관리
  const [inputs, setInputs] = useState<CalculationInputs>({
    // 1. 물건 정보
    purchasePrice: 50000,
    area: 25,
    location: "서울특별시",
    buildingType: "빌라",

    // 2. 임대 수익
    monthlyRent: 80,
    deposit: 1000,
    vacancyRate: 5,
    rentIncreaseRate: 2,

    // 3-4. 비용 (취득비용 + 운영비용)
    acquisitionTax: 4,
    brokerageFee: 0.5,
    monthlyManagementFee: 10,
    propertyTax: 0.2,

    // 5. 자금 조달
    loanAmount: 30000,
    loanInterestRate: 4.5,
    loanPeriod: 20,

    // 6. 투자 조건
    holdingPeriod: 5,
    expectedAppreciationRate: 3,
    taxRate: 22,
  });

  // 실시간 계산 엔진
  const calculateReturns = () => {
    // 1. 취득비용 계산
    const totalAcquisitionCost =
      purchasePrice + (purchasePrice * acquisitionTax) / 100;

    // 2. 수익률 계산 (표면수익률, 실질수익률, ROI)
    const grossYield = (annualRentIncome / purchasePrice) * 100;
    const netYield = (annualNetIncome / totalInvestment) * 100;

    // 3. 현금흐름 분석
    const monthlyNetIncome = annualNetIncome / 12;
    const totalCashFlow = annualNetIncome * holdingPeriod;

    // 4. 투자 지표 계산
    const breakEvenPoint = totalInvestment / monthlyNetIncome;
    const paybackPeriod = totalInvestment / annualNetIncome;
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="inputs">입력</TabsTrigger>
        <TabsTrigger value="results">결과</TabsTrigger>
        <TabsTrigger value="analysis">분석</TabsTrigger>
      </TabsList>

      <TabsContent value="inputs">{/* 8개 카테고리 입력 폼 */}</TabsContent>

      <TabsContent value="results">
        {/* 수익률, 현금흐름, 비용 분석 결과 */}
      </TabsContent>

      <TabsContent value="analysis">
        {/* 투자 등급, 리스크 분석, 권장사항 */}
      </TabsContent>
    </Tabs>
  );
}
```

#### **PricingPage 컴포넌트 구조**

```typescript
// 4단계 구독 플랜 시스템
export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  const plans: PricingPlan[] = [
    {
      id: "free",
      name: "Free Trial",
      price: { monthly: 0, yearly: 0 },
      features: [
        { name: "월 5회 분석", included: true, limit: "5회" },
        { name: "관심 물건 저장", included: true, limit: "10개" },
        { name: "기본 분석 리포트", included: true },
        { name: "고급 분석 도구", included: false },
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: { monthly: 79000, yearly: 790000 },
      features: [
        { name: "월 200회 분석", included: true, limit: "200회" },
        { name: "API 접근", included: true },
        { name: "우선 지원", included: true },
      ],
      popular: true,
    },
    // Basic, Enterprise 플랜...
  ];

  return (
    <div>
      {/* 요금제 토글 (월간/연간) */}
      <Switch checked={isYearly} onCheckedChange={setIsYearly} />

      {/* 플랜 카드들 */}
      <div className="grid lg:grid-cols-4 gap-8">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={plan.popular ? "ring-2 ring-purple-500" : ""}
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="text-3xl font-bold">
                {formatPrice(isYearly ? plan.price.yearly : plan.price.monthly)}
              </div>
            </CardHeader>

            <CardContent>
              {/* 기능 목록 체크박스 */}
              {plan.features.map((feature) => (
                <div key={feature.name} className="flex items-center">
                  {feature.included ? <Check /> : <X />}
                  <span>{feature.name}</span>
                </div>
              ))}
            </CardContent>

            <CardFooter>
              <Button asChild>
                <Link href={`/checkout?plan=${plan.id}`}>플랜 선택하기</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* 상세 기능 비교표 */}
      <table>
        <thead>
          <tr>
            <th>기능</th>
            {plans.map((plan) => (
              <th key={plan.id}>{plan.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>{/* 기능별 비교 행들 */}</tbody>
      </table>

      {/* FAQ 섹션 */}
      <div>
        <h2>자주 묻는 질문</h2>
        {/* FAQ 아이템들 */}
      </div>
    </div>
  );
}
```

### 6-2. API 클라이언트 아키텍처

#### **22개 API 엔드포인트 체계적 관리**

```typescript
// /lib/api.ts - 완전한 API 클라이언트
export const apiClient = {
  // 1. 시스템 (1개)
  getHealth: () => GET("/health"),

  // 2. 인증 (1개)
  signup: (userData) => POST("/api/v1/auth/signup", userData),

  // 3. 사용자 (1개)
  getCurrentUser: () => GET("/api/v1/users/me"),

  // 4. 매물 + 투자 분석 (5개)
  getItems: (filters) => GET("/api/v1/items/", { params: filters }),
  getItemsSimple: (filters) => GET("/api/v1/items/simple", { params: filters }),
  getItem: (id) => GET(`/api/v1/items/${id}`),
  getComparables: (id, params) =>
    GET(`/api/v1/items/${id}/comparables`, { params }),
  createItem: (data) => POST("/api/v1/items/", data),

  // 5. 완전한 즐겨찾기 시스템 (5개)
  getFavorites: () => GET("/api/v1/users/me/favorites/"),
  addFavorite: (itemId) =>
    POST("/api/v1/users/me/favorites/", { auction_item_id: itemId }),
  removeFavorite: (itemId) => DELETE(`/api/v1/users/me/favorites/${itemId}`),
  getFavoriteCount: () => GET("/api/v1/users/me/favorites/count"),
  checkFavoriteStatus: (itemId) =>
    GET(`/api/v1/users/me/favorites/check/${itemId}`),

  // 6. 경매 완료 데이터 (3개)
  getAuctionCompleted: (params) =>
    GET("/api/v1/auction-completed/", { params }),
  getAuctionCompletedItem: (id) => GET(`/api/v1/auction-completed/${id}`),
  getAuctionMarketAnalysis: (params) =>
    GET("/api/v1/auction-completed/market-analysis/", { params }),

  // 7. 실거래 매매 (2개)
  getRealTransactions: (params) =>
    GET("/api/v1/real-transactions/", { params }),
  getMarketPriceAnalysis: (params) =>
    GET("/api/v1/real-transactions/market-price/", { params }),

  // 8. 실거래 전월세 (2개)
  getRealRents: (params) => GET("/api/v1/real-rents/", { params }),
  getRentalYieldAnalysis: (params) =>
    GET("/api/v1/real-rents/rental-yield/", { params }),
};
```

#### **그룹별 편의 함수**

```typescript
// 사용하기 쉬운 그룹별 API
export const itemApi = {
  getItems: (filters) => apiClient.getItems(filters),
  getComparables: (id, params) => apiClient.getComparables(id, params),
  // ...
};

export const favoriteApi = {
  getFavorites: () => apiClient.getFavorites(),
  addFavorite: (itemId) => apiClient.addFavorite(itemId),
  // ...
};
```

### 6-3. 실제 데이터 전환 아키텍처

#### **환경 플래그 기반 전환**

```typescript
// /hooks/useItemDetail.ts (현행)
const USE_REAL_API = true; // 실제 API 사용 활성화
```

#### **API 타임아웃 및 표준 에러(2025-08-11 반영)**

```typescript
// /lib/api.ts
export interface ApiError {
  message: string;
  status?: number;
  url: string;
  method: string;
  details?: unknown;
}

class ApiClient {
  constructor(baseURL = API_BASE_URL, defaultTimeoutMs = 10000) {}
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeoutMs = 10000
  ): Promise<T> {
    // AbortController 기반 타임아웃 + text/plain 오류 캡처
  }
}
```

#### **TypeScript 타입 안전성**

```typescript
// 모든 API 응답에 대한 완전한 타입 정의
export interface ComparablesResponse {
  baseItem: AuctionItem; // 기준 매물
  comparables: ComparableItem[]; // 비교 매물들
  statistics: MarketStatistics; // 시장 통계
  marketAnalysis: MarketAnalysis; // 시장 분석
}

export interface FavoriteCheck {
  isFavorite: boolean;
  favoriteId?: number;
}
```

---

## 7. 코딩 컨벤션 및 품질 관리

### 7-1. 네이밍 컨벤션

| 종류         | 규칙              | 예시                                 |
| :----------- | :---------------- | :----------------------------------- |
| **컴포넌트** | PascalCase        | `FilterControl.tsx`, `ItemTable.tsx` |
| **Hooks**    | `use` 접두사      | `useMobile.ts`, `useItems.ts`        |
| **Store**    | `...Store` 접미사 | `filterStore.ts`, `authStore.ts`     |
| **Types**    | PascalCase        | `interface ItemProps { ... }`        |

### 7-2. Pull Request (PR) 템플릿

모든 PR은 아래 템플릿을 사용하여 작성하여, 코드 리뷰어가 변경 사항을 쉽게 이해할 수 있도록 합니다.

```markdown
## 🧐 PR의 목적이 무엇인가요?

- (e.g., 통합 분석 화면의 필터링 기능 추가)

## 📝 주요 변경 사항은 무엇인가요?

- (e.g., Zustand를 이용한 필터 스토어 생성)
- (e.g., useItems 훅에 필터 로직 연동)

## 🖼️ 스크린샷 (선택 사항)

- (UI 변경이 있을 경우, 변경 전후 스크린샷 첨부)

## ✅ 체크리스트

- [ ] self-review를 진행했나요?
- [ ] 관련 문서를 업데이트했나요?
```

### 7-3. 반드시 피해야 할 패턴 (Anti-patterns)

- **Prop Drilling:** 2-depth 이상의 prop 전달은 피하고, Zustand나 컴포넌트 조합(Composition)으로 해결합니다.
- **거대 컴포넌트 (God Component):** 하나의 컴포넌트가 너무 많은 역할을 하도록 만들지 않습니다. 최대한 작은 단위로 분리하고 각자 단일 책임 원칙을 지키도록 합니다.
- **UI 컴포넌트 내 비즈니스 로직:** API 호출, 데이터 가공 등의 로직은 컴포넌트가 아닌 커스텀 훅(`use...`)이나 서비스 함수(`services/...`)로 분리합니다.

---

## 8. 2025-08-08 아키텍처 업데이트

### 8-1. 실제 데이터 전환 및 기본 파라미터 정책

- `Application/hooks/useItemDetail.ts`의 `USE_REAL_API = true`로 실데이터 전환(현행)
- `Application/lib/api.ts` 목록형 API에 `limit=20` 기본값 주입 정책 적용

### 8-2. 상세페이지 Comparables 연동

- `Application/app/analysis/[id]/page.tsx`에 SWR로 `itemApi.getComparables` 호출하여 `InvestmentAnalysis`에 데이터 공급
- SWR 키: `['/api/v1/items/', id, 'comparables']`

### 8-3. 환경변수

- `NEXT_PUBLIC_API_BASE_URL` 우선 사용, 미설정 시 `http://127.0.0.1:8000`
- `NEXT_PUBLIC_VWORLD_API_KEY` 추가 (vworld 지도 스크립트 로딩용)
- 배포 환경에서는 Amplify 환경변수로 주입 필요

### 8-4. 2025-08-11 업데이트(회귀 대응 → 재검증 합격 및 UX/안정화)

- 백엔드 Fix 반영 확인: 5개 데이터 엔드포인트 3회 반복 스모크 200 OK 일관성, 상세/Comparables(101~105) 200 OK 추가 확인
- 프론트 UX 표준화: 로딩/에러/빈 상태 컴포넌트(`LoadingState`, `ErrorState`, `EmptyState`) 도입 및 재시도 버튼 연결
- Comparables 섹션 에러 시 재시도 버튼 제공(`InvestmentAnalysis.onRetry`)
- API 레이어: 기본 10s 타임아웃, `ApiError` 표준화, `text/plain` 오류 메시지 캡처

### 8-5. 2025-08-13 업데이트(지도 Provider 임시 전환 정책)

- VWorld 운영키 승인 대기(약 10일) 동안 지도 Provider를 Kakao JS로 임시 전환
- ENV 스위치: `NEXT_PUBLIC_MAP_PROVIDER` = `vworld`(기본) / `kakao`(임시), Kakao 키 `NEXT_PUBLIC_KAKAO_APP_KEY`
- 코드 위치: `Application/lib/map/kakaoLoader.ts`, `Application/components/features/map-view.tsx` (Provider 스위치 적용)

---

### 2025-08-13 업데이트: 데이터/지도 전환 안정화

- 목록 데이터 소스 전환: /api/v1/items/simple (안정 우선)
  - SWR 키: ["/api/v1/items/simple", params]
  - 파라미터 표준: region, buildingType, min_built_year, max_built_year, min_price, max_price, min_area, max_area, has_elevator, auction_status, page, limit
  - 신규 파라미터 확장: province, cityDistrict, town, auction_date_from, auction_date_to, auction_month, under100
  - 응답 총건수: totalItems | total | count 호환 처리
  - 테이블 컬럼 매핑: buildYear|built_year, buildingType|property_type
- SWR 전역 fetcher 도입: 배열 키 해체 + 표준 Error throw, SWRConfig.fetcher 등록, dev 모드 URL 로그(debug)
- Dev 설정: next.config.mjs의 experimental.allowedDevOrigins=["127.0.0.1","localhost"]로 정적 자산 404 해소
- 지도 Provider: .env.local로 Kakao 임시 전환 (NEXT_PUBLIC_MAP_PROVIDER=kakao, NEXT_PUBLIC_KAKAO_APP_KEY=<issued>)

---

## 9. 2025-08-19 아키텍처 업데이트 (백엔드 API 완전 연동)

### 9-1. 백엔드 API 완전 연동 달성

- **포트 표준화**: 백엔드팀과 협업으로 8001 포트 이슈 해결 → 8000 포트 단일 표준화
- **실시간 데이터 연결**: `/api/v1/locations/tree-simple` 완전 연동 (9개 시도, 전체 시군구/읍면동)
- **매물 데이터 적재**: 실제 경매 매물 1,000건 연동 (`/api/v1/items/simple`)
- **API 응답 성능**: 평균 < 500ms, 데이터 크기 4,319 bytes (locations API)

### 9-2. 신규 위치 데이터 훅 아키텍처

**`Application/hooks/useLocations.ts` 전체 재설계:**

```typescript
// 주요 훅 구조
export function useLocationsSimple(); // 일괄 지역 데이터
export function useLocationsTree(); // 풀 트리 + 매물 수량
export function useLocationsSido(); // 단계별: 시도 목록
export function useLocationsCities(); // 단계별: 시군구 목록
export function useLocationsTowns(); // 단계별: 읍면동 목록

// 헬퍼 함수
export function findCodeByName(); // 이름 → 코드 변환
export function findNameByCode(); // 코드 → 이름 변환
```

**임시 데이터 폴백 시스템:**

- 백엔드 연결 실패 시 `TEMP_SAMPLE_ADDRESSES` 자동 활용
- `usingFallback` 플래그로 UI에서 상태 표시
- 개발환경 디버깅 로그 (`console.log`) 내장

### 9-3. 개발 환경 안정화

**UTF-8 인코딩 문제 해결:**

- OneDrive 동기화 경로의 파일 인코딩 손상 문제 진단 및 해결
- 백업 파일 시스템 도입 (`*.backup` 파일)
- PowerShell 환경에서의 인코딩 에러 대응 가이드

**자동화 스크립트 강화 (`run_server.py`):**

- 크로스 플랫폼 호환성 (Windows/Unix)
- 포트 충돌 자동 해결 (`taskkill`, `lsof`)
- 환경변수 자동 설정 (`NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`)
- 인코딩 에러 복구 (`encoding='utf-8', errors='ignore'`)
- 다중 명령어 시도 체계 (`npm run dev:8000` 우선)

### 9-4. 필터 시스템 백엔드 연동

**FilterControl 컴포넌트 진화:**

- 지역 선택: 버튼 방식 → `Select` 드롭다운 전환
- 실시간 데이터 바인딩: `useLocationsSimple` 훅 연결
- 연쇄 선택 로직: 시도 → 시군구 → 읍면동 의존성 관리
- 진행률 표시: 필터 설정 단계별 가이드 제공

**백엔드 필터 파라미터 매핑:**

```typescript
// 프론트엔드 → 백엔드 파라미터 변환
province → sido_code
city → city_code
district → town_code
buildingType → usage (건물용도)
priceRange → minPrice/maxPrice (만원 단위)
areaRange → minArea/maxArea (평 단위)
buildYear → minBuildYear/maxBuildYear
hasElevator → hasElevator (boolean 변환)
```

### 9-5. 사용자 경험 혁신

**Before vs After 성과:**

| 항목          | Before (2025-08-18) | After (2025-08-19)  | 개선율    |
| ------------- | ------------------- | ------------------- | --------- |
| 지역 데이터   | 5개 임시 데이터     | 9개 실제 시도       | +80%      |
| 매물 데이터   | 0건                 | 1,000건 실제 데이터 | +∞%       |
| API 응답속도  | N/A                 | < 500ms             | 신규      |
| 컴파일 안정성 | UTF-8 에러 지속     | 0건 에러            | -100%     |
| 개발자 경험   | 수동 설정 필요      | 원클릭 실행         | 대폭 개선 |

**UI/UX 최적화:**

- "임시 데이터로 테스트 중" 메시지 → 완전 제거
- 필터 진행률 표시 (`20% 완료 → 100% 완료`)
- 예상 검색 결과 미리보기 (`약 648개 매물`)
- 실시간 연쇄 선택 가이드

### 9-6. 팀 간 협업 성과

**Communication 프로세스 완성:**

- `Communication/Backend/send/Request/` 표준화된 요청서 작성
- `Communication/Backend/receive/Completed/` 백엔드 완료 보고서 수신
- 24시간 내 크로스팀 이슈 해결 달성

**기술 문서 업데이트:**

- `README.md`: 트러블슈팅 가이드 및 스크립트 섹션 강화
- `Log/250819.md`: 상세한 개발 일지 작성
- 아키텍처 문서 v1.1 업데이트

### 9-7. 향후 확장 기반

**확립된 패턴:**

- 백엔드 API 연동 표준 (`SWR + 타입 안전 fetcher`)
- 폴백 시스템 패턴 (임시 데이터 → 실제 데이터 전환)
- 개발 환경 자동화 (`run_server.py` 확장성)
- UTF-8 인코딩 문제 대응책

**다음 단계 준비:**

- VWorld 지도 API 최종 전환 기반 마련
- AWS Amplify 배포 환경변수 설정 가이드 완성
- 성능 최적화 (메모이제이션, 디바운싱) 적용 준비

---

## 10. 2025-08-20 아키텍처 업데이트 (필터링 시스템 완성 및 테이블 고도화)

### 10-1. 🎉 API 연동 방식 혁신적 개선

**기존 딜레마 완전 해결:**

- **Before**: `/simple` API (필터링 지원) vs `/custom` API (컬럼 선택) 선택 불가
- **After**: `/custom` API가 필터링까지 완전 지원 확인 → 양쪽 장점 모두 확보

**새로운 API 연동 아키텍처:**

```typescript
// Application/hooks/useItems.ts (2025-08-20 업데이트)
export function useItems(): UseItemsResult {
  // 🎉 Custom API: 16개 컬럼 선택 + 모든 필터링 완전 지원 확인!
  const requiredFields = [
    "id",
    "usage",
    "case_number",
    "road_address",
    "building_area_pyeong",
    "land_area_pyeong",
    "appraised_value",
    "minimum_bid_price",
    "bid_to_appraised_ratio",
    "public_price",
    "sale_month",
    "special_rights",
    "floor_confirmation",
    "under_100million",
    "construction_year",
    "elevator_available",
  ].join(",");

  const allParams = {
    ...buildQueryParamsFromFilters(filters),
    fields: requiredFields, // 성능 최적화: 필요한 컬럼만 요청
  };

  // ✅ 필터링 + 컬럼 선택 동시 지원
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    ["/api/v1/items/custom", allParams],
    fetcher
  );
}
```

### 10-2. 🏆 16개 컬럼 테이블 시스템 완성

**고도화된 테이블 아키텍처:**

```typescript
// Application/components/features/item-table.tsx
export default function ItemTable({ items }: ItemTableProps) {
  // 🔧 클라이언트 사이드 정렬 시스템
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null
  );

  // 🎯 데이터 타입별 정렬 로직
  const getSortValue = (item: any, column: string) => {
    switch (column) {
      // 숫자형 컬럼들
      case "minimum_bid_price":
        return parseFloat(item.minimum_bid_price) || 0;
      case "appraised_value":
        return parseFloat(item.appraised_value) || 0;

      // Y/N 컬럼들 (실제 데이터 형식 반영)
      case "elevator_available":
        return item.elevator_available === "O" ? 1 : 0; // ← "O" 문자열
      case "under_100million":
        return item.under_100million?.toString().includes("O") ? 1 : 0; // ← "O (이하)"

      // 완전 문자열 정렬 (한글 지원)
      case "floor_confirmation":
        return (item.floor_confirmation || "").toString();

      default:
        return "";
    }
  };

  // 🎨 반응형 정렬 UI
  const handleSort = (column: string) => {
    // 3단계 정렬: null → asc → desc → null
    if (sortColumn === column) {
      if (sortDirection === null) setSortDirection("asc");
      else if (sortDirection === "asc") setSortDirection("desc");
      else {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // 📊 16개 컬럼 구조
  return (
    <Table>
      <TableHeader>
        {/* 클릭 가능한 정렬 헤더들 */}
        <TableHead onClick={() => handleSort("usage")}>
          <span
            className={
              sortColumn === "usage" ? "text-blue-600 font-semibold" : ""
            }
          >
            용도{getSortIcon("usage")}
          </span>
        </TableHead>
        {/* ... 15개 추가 컬럼 */}
      </TableHeader>
      <TableBody>
        {sortedItems.map((item) => (
          <TableRow>
            {/* 16개 컬럼 데이터 표시 */}
            <TableCell>{item.usage}</TableCell>
            <TableCell>{item.case_number}</TableCell>
            {/* 계산된 컬럼 */}
            <TableCell>{calculateBidToPublicRatio(item)}</TableCell>
            {/* ... */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### 10-3. ✅ 완성된 필터링 시스템 아키텍처

**실제 데이터 기반 필터 UI:**

```typescript
// Application/components/features/filter-control.tsx
export default function FilterControl() {
  return (
    <div>
      {/* ✅ 엘리베이터 필터 (실제 데이터 맞춤) */}
      <ButtonGroup
        options={[
          { value: "all", label: "전체" },
          { value: "있음", label: "있음" }, // hasElevator=true
          { value: "없음", label: "없음" }, // hasElevator=false
          // "모름" 옵션 제거 (실제 데이터에는 O/null만 있음)
        ]}
      />

      {/* ✅ 층수 필터 (백엔드 완전 지원 확인) */}
      <ButtonGroup
        options={[
          { value: "all", label: "전체" },
          { value: "1-2", label: "1-2층" },
          { value: "3-4", label: "3-4층" },
          { value: "5+", label: "5층 이상" },
          { value: "지하", label: "지하" },
        ]}
        // 경고 메시지 제거 - 백엔드에서 완전 지원 확인!
      />
    </div>
  );
}
```

**필터 파라미터 매핑 최종 버전:**

```typescript
// Application/hooks/useItems.ts - buildQueryParamsFromFilters
function buildQueryParamsFromFilters(filters: FilterState) {
  const params: Record<string, any> = {};

  // ✅ 완전 지원 확인된 필터들
  if (filters.hasElevator && filters.hasElevator !== "all") {
    params.hasElevator = filters.hasElevator === "있음" ? true : false;
  }

  // ✅ 층수 필터 (백엔드 완전 지원)
  if (filters.floor && filters.floor !== "all") {
    params.floor = filters.floor;
  }

  // ✅ 기존 필터들 (모두 정상 작동 확인)
  const [minPrice, maxPrice] = filters.priceRange;
  if (minPrice && minPrice > 0) params.minPrice = minPrice;
  if (maxPrice && maxPrice < 500000) params.maxPrice = maxPrice;

  return params;
}
```

### 10-4. 📞 백엔드 커뮤니케이션 성과

**완벽한 기술적 협업 달성:**

1. **Custom API 필터링 지원 확인**: 4/4 테스트 성공 (100%)
2. **매각기일 실제 컬럼 문의**: 정확한 데이터 요청 진행
3. **기술적 딜레마 완전 해소**: Simple vs Custom API 선택 고민 종료

**Communication 문서 체계:**

```
📁 Communication/Backend/
├── send/Request/
│   └── 250820_Frontend_to_Backend_매각기일_컬럼_확인_요청.md
└── receive/Request/
    └── 250820_Backend_to_Frontend_Custom_API_필터링_완전_지원_확인.md
```

### 10-5. 🎯 성능 및 사용자 경험 최적화

**Data Fetching 최적화:**

```typescript
// 성능 최적화된 API 호출
const apiUrl = `/api/v1/items/custom?fields=${requiredFields}&minPrice=5000&maxPrice=20000&hasElevator=true&limit=20`;

// 예상 성능:
// - 요청 크기: 16개 필드만 선택적 요청
// - 응답 속도: < 500ms (백엔드 확인)
// - 메모리 효율: 불필요한 58개 컬럼 제거
```

**UX 개선 성과:**

| **기능**          | **Before**    | **After**        | **개선율**    |
| ----------------- | ------------- | ---------------- | ------------- |
| **테이블 컬럼**   | 5개 기본 컬럼 | 16개 선택 컬럼   | **+220%**     |
| **정렬 기능**     | 없음          | 전체 컬럼 정렬   | **신규**      |
| **필터 작동률**   | 50% (일부만)  | 100% (모든 필터) | **+100%**     |
| **데이터 정확도** | Y/N 오류      | 실제 데이터 반영 | **완전 개선** |

### 10-6. 🏗️ 아키텍처 패턴 진화

**새로운 패턴 확립:**

1. **하이브리드 API 활용**: 단일 API로 컬럼 선택 + 필터링 동시 지원
2. **클라이언트 사이드 정렬**: 백엔드 부하 없이 UX 향상
3. **실시간 데이터 매핑**: 백엔드 데이터 형식 변경에 즉시 대응
4. **타입 안전 필터링**: TypeScript로 필터 상태 완전 관리

**코드 품질 향상:**

```typescript
// 타입 안전한 정렬 시스템
type SortDirection = "asc" | "desc" | null;
type SortColumn = string | null;

interface TableSortState {
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  handleSort: (column: string) => void;
  getSortIcon: (column: string) => string;
}
```

### 10-7. 📈 프로젝트 완성도 급상승

**전체 시스템 완성도 평가:**

- **Phase 3 (상세 분석 화면)**: 95% → **100%** ✅
- **Phase 4 (수익률 계산기)**: 97% → **98%** ⬆️
- **전체 프로젝트**: 97% → **98%** ⬆️

**핵심 기능 완성 현황:**

- ✅ **매물 검색 및 필터링**: 완성 (100%)
- ✅ **16개 컬럼 테이블 시스템**: 완성 (100%)
- ✅ **클라이언트 사이드 정렬**: 완성 (100%)
- ✅ **실시간 데이터 연동**: 완성 (100%)
- 🔄 **매각기일 정확 표시**: 90% (백엔드 답변 대기)

---

**최종 업데이트**: 2025-08-20  
**아키텍처 버전**: v1.2  
**주요 성과**: 필터링 시스템 완성, 16개 컬럼 테이블 고도화, API 연동 방식 혁신적 개선
