# 프론트엔드 연동 가이드 v2.0

> **부동산 부스터 백엔드 API 완전 연동 가이드**  
> **마지막 업데이트**: 2025-08-21  
> **API 버전**: v1  
> **대상**: 프론트엔드 개발팀

---

## **📋 목차**

1. [시스템 개요](#시스템-개요)
2. [API 기본 정보](#api-기본-정보)
3. [4개 API 시스템 상세](#4개-api-시스템-상세)
4. [한글 UTF-8 처리](#한글-utf-8-처리)
5. [성능 최적화 활용](#성능-최적화-활용)
6. [에러 처리](#에러-처리)
7. [실전 예제 코드](#실전-예제-코드)
8. [테스트 및 디버깅](#테스트-및-디버깅)

---

## **🏗️ 시스템 개요**

### **데이터 규모**

- **830,000개+ 부동산 데이터** (1.3GB+ CSV 원본)
- **4개 API 시스템**, 20개 엔드포인트
- **완벽한 한글 UTF-8 지원**
- **고성능 캐싱 시스템** 구현

### **API 시스템 구성**

| API 시스템            | 데이터 특성   | 레코드 수   | 주요 용도        |
| --------------------- | ------------- | ----------- | ---------------- |
| **auction-items**     | 경매 진행     | 5,539개     | 실시간 경매 매물 |
| **auction-completed** | 경매 완료     | 99,075개    | 낙찰 내역 분석   |
| **real-transactions** | 실거래 매매   | 726,423개   | 시세 분석        |
| **real-rents**        | 실거래 전월세 | 1,398,729개 | 임대 시장 분석   |

---

## **🔗 API 기본 정보**

### **Base URL**

```
http://localhost:8000/api/v1
```

### **표준 엔드포인트 패턴**

모든 API 시스템은 동일한 엔드포인트 패턴을 사용합니다:

```
GET /{api-system}/columns      # 컬럼 메타데이터
GET /{api-system}/simple       # 간단한 필드 조회 (캐싱)
GET /{api-system}/full         # 전체 필드 조회
GET /{api-system}/custom       # 선택적 필드 조회
GET /{api-system}/{id}         # 개별 항목 조회
```

### **페이징 방식 (API별로 다름)**

#### **🔄 API 시스템별 페이징 방식**

| API 시스템            | 페이징 방식 | 파라미터          |
| --------------------- | ----------- | ----------------- |
| **auction-items**     | skip/limit  | `skip=0&limit=10` |
| **real-transactions** | page/size   | `page=1&size=10`  |
| **real-rents**        | page/size   | `page=1&size=10`  |
| **auction-completed** | page/size   | `page=1&size=10`  |

#### **공통 필터 파라미터**

- `sido`: 광역시도 필터
- `sigungu`: 시군구 필터

### **📋 API 응답 구조 차이점**

#### **⚠️ 중요: 응답 구조가 API별로 다름**

| API 시스템            | 페이징 필드     | 총 개수 필드 | 예시                                      |
| --------------------- | --------------- | ------------ | ----------------------------------------- |
| **auction-items**     | `skip`, `limit` | `totalItems` | `{items: [...], totalItems: 5539}`        |
| **real-transactions** | `page`, `size`  | `total`      | `{items: [...], total: 726428, page: 1}`  |
| **real-rents**        | `page`, `size`  | `total`      | `{items: [...], total: 1398729, page: 1}` |
| **auction-completed** | `page`, `size`  | `total`      | `{items: [...], total: 99075, page: 1}`   |

#### **프론트엔드 처리 방법**

```javascript
// ✅ API별 응답 구조 차이 처리
const processApiResponse = (apiType, response) => {
  if (apiType === "auction-items") {
    return {
      items: response.items,
      total: response.totalItems, // auction-items만 totalItems 사용
      currentPage: Math.floor(response.skip / response.limit) + 1,
    };
  } else {
    return {
      items: response.items,
      total: response.total, // 나머지는 total 사용
      currentPage: response.page,
    };
  }
};
```

---

## **🏡 4개 API 시스템 상세**

### **1. 경매 진행 매물 (auction-items)**

**엔드포인트**: `/api/v1/items`

**주요 필터**:

```typescript
interface AuctionItemsFilters {
  usage?: string; // 용도 (예: "다세대(빌라)")
  current_status?: string; // 현재상태
  min_appraised_value?: number; // 최소 감정가(만원)
  max_appraised_value?: number; // 최대 감정가(만원)
  min_minimum_bid_price?: number; // 최소 최저가(만원)
  max_minimum_bid_price?: number; // 최대 최저가(만원)
  sale_year?: number; // 매각년도
  sale_month?: number; // 매각월
}
```

**실제 호출 예시**:

```javascript
// 1억 이하 다세대 매물 조회
const response = await fetch(
  "/api/v1/items/simple?" +
    new URLSearchParams({
      usage: "다세대(빌라)",
      max_minimum_bid_price: "10000", // 1억원(만원 단위)
      limit: "50",
    })
);
```

### **2. 경매 완료 매물 (auction-completed)**

**엔드포인트**: `/api/v1/auction-completed`

**🎯 핵심 특징**: 낙찰가(`final_sale_price`) 정보 포함

**주요 필터**:

```typescript
interface AuctionCompletedFilters {
  usage?: string; // 용도
  current_status?: string; // 현재상태 (배당종결 등)
  sale_year?: number; // 매각년도
  min_final_sale_price?: number; // 최소 낙찰가(만원) ⭐
  max_final_sale_price?: number; // 최대 낙찰가(만원) ⭐
  min_appraised_value?: number; // 최소 감정가(만원)
  max_appraised_value?: number; // 최대 감정가(만원)
}
```

**실제 호출 예시**:

```javascript
// 2024년 낙찰된 서울 아파트 조회
const response = await fetch(
  "/api/v1/auction-completed/simple?" +
    new URLSearchParams({
      sido: "서울특별시",
      usage: "아파트",
      sale_year: "2024",
      page: "1",
      size: "100",
    })
);
```

### **3. 실거래 매매 (real-transactions)**

**엔드포인트**: `/api/v1/real-transactions`

**🏠 핵심 특징**: 실제 거래가격(`transaction_amount`) 정보

**주요 필터**:

```typescript
interface RealTransactionsFilters {
  contract_year?: number; // 계약 연도
  contract_month?: number; // 계약 월
  min_transaction_amount?: number; // 최소 거래금액(만원) ⭐
  max_transaction_amount?: number; // 최대 거래금액(만원) ⭐
  min_price_per_pyeong?: number; // 최소 평단가(만원)
  max_price_per_pyeong?: number; // 최대 평단가(만원)
  min_exclusive_area?: number; // 최소 전용면적(㎡)
  max_exclusive_area?: number; // 최대 전용면적(㎡)
}
```

**실제 호출 예시**:

```javascript
// 2024년 강남구 5억 이하 거래 조회
const response = await fetch(
  "/api/v1/real-transactions/simple?" +
    new URLSearchParams({
      sigungu: "서울특별시 강남구",
      contract_year: "2024",
      max_transaction_amount: "50000", // 5억원(만원 단위)
      page: "1",
      size: "200",
    })
);
```

### **4. 실거래 전월세 (real-rents)**

**엔드포인트**: `/api/v1/real-rents`

**🏠 핵심 특징**: 전월세 특화 데이터

**주요 필터**:

```typescript
interface RealRentsFilters {
  rent_type?: string; // 전월세구분 ("전세" | "월세") ⭐
  contract_year?: number; // 계약 연도
  contract_month?: number; // 계약 월
  contract_type?: string; // 계약구분 ("신규" | "갱신")
  min_deposit?: number; // 최소 보증금(만원) ⭐
  max_deposit?: number; // 최대 보증금(만원) ⭐
  min_monthly_rent?: number; // 최소 월세금(만원) ⭐
  max_monthly_rent?: number; // 최대 월세금(만원) ⭐
  min_exclusive_area?: number; // 최소 전용면적(㎡)
  max_exclusive_area?: number; // 최대 전용면적(㎡)
}
```

**실제 호출 예시**:

```javascript
// 서울 월세 100만원 이하 조회
const response = await fetch(
  "/api/v1/real-rents/simple?" +
    new URLSearchParams({
      sido: "서울특별시",
      rent_type: "월세",
      max_monthly_rent: "100", // 100만원(만원 단위)
      page: "1",
      size: "100",
    })
);
```

---

## **🌐 한글 UTF-8 처리**

### **✅ 완벽 지원 확인됨**

백엔드는 **커스텀 UnicodeJSONResponse**를 사용하여 한글을 완벽 지원합니다:

```javascript
// ✅ 올바른 한글 출력 예시
{
  "sido": "서울특별시",
  "usage": "다세대(빌라)",
  "road_address": "서울특별시 영등포구 당산로41길 11"
}
```

### **프론트엔드 권장사항**

#### **1. Fetch API 사용시**

```javascript
const response = await fetch("/api/v1/real-rents/simple");
const data = await response.json(); // 자동으로 UTF-8 파싱됨
console.log(data.items[0].sido); // "서울특별시" 정상 출력
```

#### **2. Axios 사용시**

```javascript
import axios from "axios";

// 기본 설정으로 충분함 (특별한 설정 불필요)
const response = await axios.get("/api/v1/real-rents/simple");
console.log(response.data.items[0].sido); // "서울특별시" 정상 출력
```

#### **3. 브라우저 직접 확인**

```
# auction-items (skip/limit 방식)
http://localhost:8000/api/v1/items/simple?limit=1

# real-rents (page/size 방식)
http://localhost:8000/api/v1/real-rents/simple?page=1&size=1

# real-transactions (page/size 방식)
http://localhost:8000/api/v1/real-transactions/simple?page=1&size=1

# auction-completed (page/size 방식)
http://localhost:8000/api/v1/auction-completed/simple?page=1&size=1
```

→ 모든 API에서 한글이 깨지지 않고 정상 표시됨

---

## **⚡ 성능 최적화 활용**

### **1. 캐싱 시스템 활용**

#### **자동 캐싱 적용 엔드포인트**

- `/columns` 엔드포인트: **1시간 캐싱**
- `/simple` 엔드포인트: **5분 캐싱**

#### **캐시 효과적 활용법**

```javascript
// ✅ 컬럼 메타데이터는 자주 호출해도 성능 영향 없음
const columns = await fetch("/api/v1/real-rents/columns");

// ✅ 동일한 필터 조건은 5분간 캐싱됨
const data1 = await fetch(
  "/api/v1/real-rents/simple?sido=서울특별시&page=1&size=10"
);
const data2 = await fetch(
  "/api/v1/real-rents/simple?sido=서울특별시&page=1&size=10"
); // 캐시됨
```

#### **캐시 통계 모니터링**

```javascript
// 캐시 성능 확인
const cacheStats = await fetch("/api/v1/system/cache/stats");
console.log(cacheStats.hit_rate); // 캐시 히트율 확인
```

### **2. 페이징 최적화**

#### **권장 페이지 크기**

- **일반 목록**: `size=50`
- **상세 분석**: `size=100`
- **대시보드**: `size=20`

```javascript
// ✅ 효율적인 페이징 구현 (page/size 방식 - real-rents, real-transactions, auction-completed)
const loadPageNew = async (page, pageSize = 50) => {
  const response = await fetch(
    `/api/v1/real-transactions/simple?page=${page}&size=${pageSize}`
  );
  return response.json();
};

// ✅ auction-items만 skip/limit 방식 사용
const loadPageLegacy = async (page, pageSize = 50) => {
  const skip = (page - 1) * pageSize;
  const response = await fetch(
    `/api/v1/items/simple?skip=${skip}&limit=${pageSize}`
  );
  return response.json();
};
```

### **3. 필드 선택적 조회**

#### **Custom API 활용**

필요한 필드만 선택해서 조회하면 **응답 속도 3-5배 향상**:

```javascript
// ✅ 필요한 필드만 조회 (빠름)
const essentialData = await fetch(
  "/api/v1/real-rents/custom?" +
    new URLSearchParams({
      fields: "id,sido,rent_type,deposit_amount,monthly_rent",
      page: "1",
      size: "100",
    })
);

// ❌ 모든 필드 조회 (느림)
const fullData = await fetch("/api/v1/real-rents/full?page=1&size=100");
```

---

## **🚨 에러 처리**

### **표준 에러 형식**

```typescript
interface APIError {
  detail: string; // 에러 메시지
  status_code: number; // HTTP 상태 코드
  error_type?: string; // 에러 유형
}
```

### **주요 에러 상황**

#### **400 Bad Request**

```javascript
// 잘못된 필드명 사용시
{
  "detail": "유효하지 않은 필드: invalid_field. 사용 가능한 필드는 /api/v1/real-rents/columns에서 확인하세요.",
  "status_code": 400
}
```

#### **404 Not Found**

```javascript
// 존재하지 않는 항목 조회시
{
  "detail": "Real rent with id 999999 not found",
  "status_code": 404
}
```

### **권장 에러 처리 패턴**

```javascript
const fetchWithErrorHandling = async (url) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error ${response.status}: ${error.detail}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API 호출 실패:", error.message);
    throw error;
  }
};
```

---

## **💻 실전 예제 코드**

### **1. React Hook 예제**

```typescript
// hooks/useRealEstate.ts
import { useState, useEffect } from 'react';

interface RealEstateData {
  items: any[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
}

export const useRealEstate = (apiPath: string, filters: Record<string, any>) => {
  const [data, setData] = useState<RealEstateData>({
    items: [],
    total: 0,
    page: 1,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchData = async () => {
      setData(prev => ({ ...prev, loading: true, error: null }));

      try {
        const params = new URLSearchParams(
          Object.entries(filters).filter(([_, v]) => v != null)
        );

        const response = await fetch(`/api/v1/${apiPath}/simple?${params}`);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail);
        }

        const result = await response.json();
        setData({
          items: result.items,
          total: result.total,
          page: result.page,
          loading: false,
          error: null
        });
      } catch (error) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    fetchData();
  }, [apiPath, JSON.stringify(filters)]);

  return data;
};

// 사용 예시
const RentListComponent = () => {
  const filters = {
    sido: '서울특별시',
    rent_type: '월세',
    max_monthly_rent: 1000,
    limit: 50
  };

  const { items, total, loading, error } = useRealEstate('real-rents', filters);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error}</div>;

  return (
    <div>
      <h2>전월세 매물 ({total:,}개)</h2>
      {items.map(item => (
        <div key={item.id}>
          {item.sido} {item.sigungu} -
          보증금: {item.deposit_amount?.toLocaleString()}만원 /
          월세: {item.monthly_rent?.toLocaleString()}만원
        </div>
      ))}
    </div>
  );
};
```

### **2. Vue.js 예제**

```vue
<!-- components/RealEstateList.vue -->
<template>
  <div>
    <h2>{{ title }} ({{ total.toLocaleString() }}개)</h2>

    <div v-if="loading" class="loading">데이터 로딩 중...</div>

    <div v-else-if="error" class="error">에러 발생: {{ error }}</div>

    <div v-else>
      <div v-for="item in items" :key="item.id" class="item">
        {{ item.sido }} {{ item.sigungu }}
        <span v-if="apiType === 'real-rents'">
          - {{ item.rent_type }}: 보증금
          {{ formatPrice(item.deposit_amount) }} / 월세
          {{ formatPrice(item.monthly_rent) }}
        </span>
        <span v-else-if="apiType === 'real-transactions'">
          - 거래가: {{ formatPrice(item.transaction_amount) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "RealEstateList",
  props: {
    apiType: {
      type: String,
      required: true, // 'real-rents', 'real-transactions', etc.
    },
    filters: {
      type: Object,
      default: () => ({}),
    },
    title: {
      type: String,
      default: "부동산 매물",
    },
  },
  data() {
    return {
      items: [],
      total: 0,
      loading: true,
      error: null,
    };
  },
  watch: {
    filters: {
      handler() {
        this.fetchData();
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    async fetchData() {
      this.loading = true;
      this.error = null;

      try {
        const params = new URLSearchParams();
        Object.entries(this.filters).forEach(([key, value]) => {
          if (value != null) {
            params.append(key, String(value));
          }
        });

        const response = await fetch(
          `/api/v1/${this.apiType}/simple?${params}`
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail);
        }

        const data = await response.json();
        this.items = data.items;
        this.total = data.total;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    formatPrice(price) {
      return price ? `${price.toLocaleString()}만원` : "-";
    },
  },
};
</script>
```

### **3. 다중 API 조합 예제**

```javascript
// utils/realEstateAPI.js
class RealEstateAPI {
  constructor(baseURL = "/api/v1") {
    this.baseURL = baseURL;
  }

  // 공통 fetch 메서드
  async fetch(endpoint, filters = {}) {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([_, v]) => v != null)
    );

    const response = await fetch(`${this.baseURL}${endpoint}?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail);
    }

    return response.json();
  }

  // 지역별 종합 시세 분석
  async getRegionalAnalysis(sido, sigungu) {
    const [rentals, sales, auctions] = await Promise.all([
      this.fetch("/real-rents/simple", {
        sido,
        sigungu,
        limit: 100,
      }),
      this.fetch("/real-transactions/simple", {
        sido,
        sigungu,
        limit: 100,
      }),
      this.fetch("/auction-completed/simple", {
        sido,
        sigungu,
        limit: 50,
      }),
    ]);

    return {
      region: `${sido} ${sigungu}`,
      rentals: {
        total: rentals.total,
        avgDeposit: this.calculateAverage(rentals.items, "deposit_amount"),
        avgMonthlyRent: this.calculateAverage(rentals.items, "monthly_rent"),
      },
      sales: {
        total: sales.total,
        avgPrice: this.calculateAverage(sales.items, "transaction_amount"),
      },
      auctions: {
        total: auctions.total,
        avgSalePrice: this.calculateAverage(auctions.items, "final_sale_price"),
      },
    };
  }

  calculateAverage(items, field) {
    const validItems = items.filter((item) => item[field] != null);
    if (validItems.length === 0) return 0;

    const sum = validItems.reduce((acc, item) => acc + item[field], 0);
    return Math.round(sum / validItems.length);
  }
}

// 사용 예시
const api = new RealEstateAPI();

const analyze = async () => {
  try {
    const analysis = await api.getRegionalAnalysis("서울특별시", "강남구");

    console.log(`${analysis.region} 부동산 시세 분석:`);
    console.log(
      `- 전월세 평균 보증금: ${analysis.rentals.avgDeposit.toLocaleString()}만원`
    );
    console.log(
      `- 전월세 평균 월세: ${analysis.rentals.avgMonthlyRent.toLocaleString()}만원`
    );
    console.log(
      `- 매매 평균 가격: ${analysis.sales.avgPrice.toLocaleString()}만원`
    );
    console.log(
      `- 경매 평균 낙찰가: ${analysis.auctions.avgSalePrice.toLocaleString()}만원`
    );
  } catch (error) {
    console.error("분석 실패:", error.message);
  }
};
```

---

## **🧪 테스트 및 디버깅**

### **1. 브라우저 테스트 도구**

#### **통합 테스트 페이지 활용**

```html
<!-- test_web_integration.html (이미 생성됨) -->
<!-- 브라우저에서 http://localhost:8000/test_web_integration.html 접속 -->
```

이 페이지에서 다음을 확인할 수 있습니다:

- ✅ 4개 API 시스템 모든 엔드포인트 테스트
- ✅ 한글 문자 정상 표시 확인
- ✅ 데이터 개수 및 응답 시간 측정

### **2. 개발자 도구 활용**

#### **네트워크 탭에서 확인사항**

```javascript
// 콘솔에서 직접 테스트
fetch("/api/v1/real-rents/simple?page=1&size=1")
  .then((res) => res.json())
  .then((data) => {
    console.log("API 응답:", data);
    console.log("한글 정상 출력:", data.items[0]?.sido);
  });
```

#### **캐시 성능 확인**

```javascript
// 캐시 히트율 확인
fetch("/api/v1/system/cache/stats")
  .then((res) => res.json())
  .then((stats) => {
    console.log(`캐시 히트율: ${stats.cache_stats.hit_rate}`);
    console.log(
      `캐시 사용률: ${stats.cache_stats.cache_size}/${stats.cache_stats.max_size}`
    );
  });
```

### **3. 성능 측정 도구**

```javascript
// API 응답 시간 측정
const measureAPIPerformance = async (endpoint, iterations = 5) => {
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fetch(endpoint);
    const end = performance.now();
    results.push(end - start);
  }

  const avg = results.reduce((a, b) => a + b) / results.length;
  console.log(`${endpoint}: 평균 ${avg.toFixed(2)}ms`);
  console.log(`- 첫 요청: ${results[0].toFixed(2)}ms (캐시 미스)`);
  console.log(`- 두번째: ${results[1].toFixed(2)}ms (캐시 적용)`);

  return { average: avg, results };
};

// 사용 예시
measureAPIPerformance("/api/v1/real-rents/simple?page=1&size=10");
```

---

## **🎯 Best Practices 요약**

### **1. 성능 최적화**

- ✅ `simple` API 우선 사용 (캐싱 적용)
- ✅ 필요한 경우만 `custom` API로 필드 선택
- ✅ 적절한 페이지 크기 설정 (`size=20-100` 또는 `limit=20-100`)
- ✅ 동일 조건 반복 호출시 캐싱 효과 활용

### **2. 데이터 처리**

- ✅ 한글 데이터는 자동으로 정상 처리됨
- ✅ 숫자 필드 null 값 체크 필수
- ✅ 가격은 만원 단위임 주의
- ✅ 날짜 필터는 연도/월 분리 사용

### **3. 에러 처리**

- ✅ 모든 API 호출에 에러 핸들링 적용
- ✅ `/columns` 엔드포인트로 유효 필드 사전 확인
- ✅ 네트워크 에러와 API 에러 구분 처리

### **4. 개발 효율성**

- ✅ 브라우저 통합 테스트 페이지 활용
- ✅ 캐시 통계로 성능 모니터링
- ✅ 개발자 도구 네트워크 탭 적극 활용

---

## **🆘 문제 해결 가이드**

### **한글 깨짐 현상**

**문제**: API 응답에서 한글이 `ë¤ì¸ë` 형태로 깨짐  
**해결**: 백엔드는 정상이므로 프론트엔드 UTF-8 설정 확인

```html
<meta charset="UTF-8" />
```

### **캐시 문제**

**문제**: 데이터가 업데이트되지 않음  
**해결**: 캐시 초기화

```javascript
await fetch("/api/v1/system/cache/clear", { method: "DELETE" });
```

### **성능 이슈**

**문제**: API 응답이 느림  
**해결**:

1. `simple` API 사용 확인
2. 페이지 크기 적정한지 확인 (`size=100` 이하 또는 `limit=100` 이하 권장)
3. 불필요한 필터 제거

### **필터링 오류**

**문제**: 필터가 동작하지 않음  
**해결**:

1. `/columns` 엔드포인트로 유효 필드명 확인
2. 데이터 타입 확인 (문자열 vs 숫자)
3. null 값 처리 확인

---

## **🚨 중요: 2025-08-21 변경사항 (필독)**

### **⚠️ API 페이징 방식 변경됨**

**이전 (v1.5)**:

- 모든 API가 `skip`/`limit` 방식 사용

**현재 (v2.0)**:

- **auction-items만**: `skip`/`limit` 방식 유지 (기존 호환성)
- **나머지 3개 API**: `page`/`size` 방식으로 변경
  - `real-transactions`
  - `real-rents`
  - `auction-completed`

### **⚠️ API 응답 구조 차이**

| API             | 총 개수 필드 | 페이징 정보                   |
| --------------- | ------------ | ----------------------------- |
| `auction-items` | `totalItems` | `skip`, `limit`               |
| 나머지 3개 API  | `total`      | `page`, `size`, `total_pages` |

### **🔧 기존 코드 수정 필요사항**

```javascript
// ❌ 기존 코드 (real-rents 등에서 오류 발생)
fetch("/api/v1/real-rents/simple?skip=0&limit=10");

// ✅ 수정된 코드
fetch("/api/v1/real-rents/simple?page=1&size=10");

// ❌ 기존 응답 처리 (real-rents 등에서 undefined)
console.log(data.totalItems);

// ✅ 수정된 응답 처리
console.log(data.total); // real-rents, real-transactions, auction-completed
console.log(data.totalItems); // auction-items만
```

### **🎯 변경 이유**

1. **API 일관성 향상**: 대부분 API가 표준 `page`/`size` 방식 사용
2. **프론트엔드 편의성**: 페이지 번호 기반 네비게이션 구현 용이
3. **성능 최적화**: 캐싱 시스템과 최적화된 호환성

---

**🎉 이제 부동산 부스터 백엔드 API를 완전히 활용할 수 있습니다!**

**업데이트 완료**: 2025-08-21  
**다음 단계**: 프론트엔드 연동 테스트  
**문의**: 백엔드 개발팀
