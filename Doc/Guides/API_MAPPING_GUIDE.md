# 🔄 **API 매핑 가이드**

## 📋 **개요**

- **목적**: 백엔드 API와 프론트엔드 간의 데이터 매핑 표준화
- **범위**: 요청 파라미터, 응답 데이터, 에러 처리
- **대상**: 프론트엔드 개발자, 백엔드 개발자

---

## 🎯 **매핑 원칙**

### **1. 일관성 원칙**

- 모든 데이터셋은 동일한 매핑 패턴 사용
- 필드명 변환 규칙 통일
- 에러 처리 방식 표준화

### **2. 호환성 원칙**

- 기존 API와 하위 호환성 유지
- 점진적 마이그레이션 지원
- 다중 버전 API 대응

### **3. 확장성 원칙**

- 새로운 필드 추가 용이성
- 타입 변환 로직 재사용
- 조건부 매핑 지원

---

## 📊 **데이터셋별 매핑 정의**

## **1. Auction_ed (경매결과)**

### **요청 파라미터 매핑**

```typescript
// 프론트엔드 → 백엔드
interface FrontendFilters {
  province: string; // 시도
  cityDistrict: string; // 시군구
  town: string; // 읍면동
  page: number;
  size: number;
}

interface BackendParams {
  sido: string; // province → sido
  address_city: string; // cityDistrict → address_city
  eup_myeon_dong: string; // town → eup_myeon_dong
  page: number;
  size: number;
}

// 매핑 로직
const mappedFilters = { ...allowedFilters };
if (filters?.province) {
  mappedFilters.sido = filters.province;
  delete mappedFilters.province;
}
if (filters?.cityDistrict) {
  mappedFilters.address_city = filters.cityDistrict;
  delete mappedFilters.cityDistrict;
}
if (filters?.town) {
  mappedFilters.eup_myeon_dong = filters.town;
  delete mappedFilters.town;
}
```

### **응답 데이터 매핑**

```typescript
// 백엔드 응답
interface BackendAuctionResponse {
  items: BackendAuctionItem[];
  total_items: number;
  page: number;
  size: number;
}

interface BackendAuctionItem {
  id: number;
  case_number: string;
  current_status: string;
  sale_date: string;
  road_address: string;
  sido: string;
  address_city: string;
  // ... 72개 필드
}

// 프론트엔드 변환 (필요시)
const adapter = {
  toItemLike: (r: BackendAuctionItem) => ({
    id: r?.id,
    caseNumber: r?.case_number, // snake_case → camelCase
    currentStatus: r?.current_status,
    saleDate: r?.sale_date,
    roadAddress: r?.road_address,
    sido: r?.sido, // 그대로 유지
    addressCity: r?.address_city,
    // 계산 필드
    pyeong: toNumber(r?.building_area_pyeong),
    // 위치 정보 (extra 객체)
    extra: {
      sido: r?.sido,
      addressCity: r?.address_city,
      eupMyeonDong: r?.eup_myeon_dong,
    },
  }),
};
```

### **컬럼 키 매핑**

```typescript
// contracts.ts의 columnsAuctionEd
export const columnsAuctionEd = [
  { key: "usage", header: "용도", width: 120 },
  { key: "caseNumber", header: "사건번호", width: 150 },
  { key: "currentStatus", header: "현재상태", width: 120 },
  { key: "saleDate", header: "매각기일", width: 120 },
  { key: "roadAddress", header: "도로명주소", width: 300 },
  { key: "sido", header: "시도", width: 100 },
  { key: "addressCity", header: "주소(시군구)", width: 150 },
  // ... 44개 컬럼
];
```

---

## **2. Real_transactions (실거래가 매매)**

### **API 응답 포맷 변환**

```typescript
// 백엔드 응답 포맷
interface BackendSaleResponse {
  items: BackendSaleItem[]; // ← 백엔드 필드명
  total_items: number; // ← 백엔드 필드명
}

// 프론트엔드 기대 포맷
interface FrontendSaleResponse {
  results: FrontendSaleItem[]; // ← 프론트엔드 필드명
  count: number; // ← 프론트엔드 필드명
}

// api.ts에서 변환
export async function getRealTransactions(
  params
): Promise<FrontendSaleResponse> {
  const response = await fetch(buildUrl(params));
  const data: BackendSaleResponse = await response.json();

  // ✅ 응답 포맷 변환
  return {
    results: data.items, // items → results
    count: data.total_items, // total_items → count
  };
}
```

### **데이터 접근 호환성**

```typescript
// useDataset.ts에서 호환성 보장
function useDataset(datasetId) {
  // ... SWR 호출

  // ✅ 다양한 응답 포맷 지원
  const rawItemsAll = data?.results || data?.items || [];
  const total = data?.count || data?.total || 0;

  return { items: rawItemsAll, total, ... };
}
```

### **필드 매핑 (57개 필드)**

```typescript
// 주요 필드 매핑 예시
const saleFieldMapping = {
  // 기본 정보
  id: "id",
  contract_date: "contractDate",
  transaction_amount: "transactionAmount",
  exclusive_area: "exclusiveArea",

  // 위치 정보
  sido: "sido",
  sigungu: "sigungu",
  road_address_real: "roadAddress",
  building_name: "buildingName",

  // 건물 정보
  construction_year: "constructionYear",
  building_coverage_ratio: "buildingCoverageRatio",
  floor_area_ratio: "floorAreaRatio",
  main_structure: "mainStructure",
  main_usage: "mainUsage",

  // 계산 필드 (adapter에서 생성)
  pyeong: "(calculated from exclusive_area)",
  price_per_sqm: "(calculated from transaction_amount / exclusive_area)",
};
```

---

## **3. Real_rents (실거래가 전월세)**

### **응답 구조 (매매와 동일한 패턴)**

```typescript
export async function getRealRents(params) {
  const response = await fetch(buildUrl(params));
  const data = await response.json();

  // 매매와 동일한 변환 패턴
  return {
    results: data.items,
    count: data.total_items,
  };
}
```

### **전월세 특화 필드**

```typescript
const rentSpecificFields = {
  deposit: "deposit", // 보증금
  monthly_rent: "monthlyRent", // 월세
  lease_term: "leaseTerm", // 계약기간
  lease_type: "leaseType", // 전세/월세 구분
};
```

---

## 🔧 **매핑 유틸리티 함수**

### **1. 타입 변환 함수**

```typescript
// lib/utils.ts
export function toNumber(value: any): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/,/g, ""));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function toDateString(value: any): string {
  if (!value) return "";
  try {
    return new Date(value).toISOString().split("T")[0];
  } catch {
    return value.toString();
  }
}

export function toBoolean(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "1", "yes", "Y", "O"].includes(value.toLowerCase());
  }
  if (typeof value === "number") return value !== 0;
  return false;
}
```

### **2. 필드 존재 확인 함수**

```typescript
export function getValueForKey(row: any, key: string): any {
  // 1차: 직접 접근
  if (row?.hasOwnProperty(key)) {
    return row[key];
  }

  // 2차: extra 객체 접근
  if (row?.extra?.hasOwnProperty(key)) {
    return row.extra[key];
  }

  // 3차: camelCase ↔ snake_case 변환 시도
  const snakeKey = camelToSnake(key);
  if (row?.hasOwnProperty(snakeKey)) {
    return row[snakeKey];
  }

  const camelKey = snakeToCamel(key);
  if (row?.hasOwnProperty(camelKey)) {
    return row[camelKey];
  }

  return null;
}

function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase();
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
```

### **3. 배열/객체 변환 함수**

```typescript
export function normalizeApiResponse<T>(
  data: any,
  itemsKey: "items" | "results" = "items",
  countKey: "total_items" | "count" | "total" = "total_items"
): { results: T[]; count: number } {
  return {
    results: data?.[itemsKey] || data?.results || data?.items || [],
    count:
      data?.[countKey] || data?.count || data?.total || data?.total_items || 0,
  };
}
```

---

## 🚨 **에러 매핑**

### **1. HTTP 상태 코드 매핑**

```typescript
interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

export function mapApiError(error: any): ApiError {
  if (error?.response) {
    const { status, data } = error.response;
    return {
      status,
      message: data?.message || getDefaultErrorMessage(status),
      code: data?.code,
      details: data?.details,
    };
  }

  if (error?.request) {
    return {
      status: 0,
      message: "네트워크 연결을 확인해주세요.",
      code: "NETWORK_ERROR",
    };
  }

  return {
    status: -1,
    message: error?.message || "알 수 없는 오류가 발생했습니다.",
    code: "UNKNOWN_ERROR",
  };
}

function getDefaultErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: "잘못된 요청입니다.",
    401: "인증이 필요합니다.",
    403: "접근 권한이 없습니다.",
    404: "요청한 데이터를 찾을 수 없습니다.",
    500: "서버 내부 오류가 발생했습니다.",
    502: "서버가 응답하지 않습니다.",
    503: "서비스를 일시적으로 사용할 수 없습니다.",
  };
  return messages[status] || "오류가 발생했습니다.";
}
```

### **2. 데이터 검증 에러**

```typescript
export function validateDataStructure(
  data: any,
  expectedFields: string[]
): boolean {
  if (!data || typeof data !== "object") return false;

  const missingFields = expectedFields.filter((field) => !(field in data));

  if (missingFields.length > 0) {
    console.warn("누락된 필드:", missingFields);
    return false;
  }

  return true;
}
```

---

## 🔄 **버전 관리 및 마이그레이션**

### **1. API 버전 대응**

```typescript
interface ApiVersionConfig {
  version: string;
  endpoints: Record<string, string>;
  fieldMappings: Record<string, Record<string, string>>;
}

const API_VERSIONS: Record<string, ApiVersionConfig> = {
  v1: {
    version: "v1",
    endpoints: {
      auction_ed: "/api/v1/auction-completed/",
      real_transactions: "/api/v1/real-transactions/",
      real_rents: "/api/v1/real-rents/",
    },
    fieldMappings: {
      auction_ed: {
        /* v1 매핑 */
      },
    },
  },
  v2: {
    version: "v2",
    endpoints: {
      auction_ed: "/api/v2/auctions/", // 엔드포인트 변경
      // ...
    },
    fieldMappings: {
      auction_ed: {
        /* v2 매핑 */
      },
    },
  },
};
```

### **2. 점진적 마이그레이션**

```typescript
export function createApiAdapter(datasetId: string, version: string = "v1") {
  const config = API_VERSIONS[version];
  if (!config) throw new Error(`Unsupported API version: ${version}`);

  return {
    buildUrl: (params: any) => {
      const endpoint = config.endpoints[datasetId];
      return buildUrlWithParams(endpoint, params);
    },

    transformResponse: (data: any) => {
      const mapping = config.fieldMappings[datasetId];
      return applyFieldMapping(data, mapping);
    },
  };
}
```

---

## 📋 **매핑 검증 체크리스트**

### **새로운 API 추가시**

- [ ] **요청 파라미터 매핑 정의**

  - [ ] 필터 파라미터
  - [ ] 페이지네이션 파라미터
  - [ ] 정렬 파라미터

- [ ] **응답 데이터 구조 확인**

  - [ ] 필드 개수 확인
  - [ ] 중첩 객체 구조 파악
  - [ ] 배열/객체 타입 확인

- [ ] **변환 로직 구현**

  - [ ] 필수 변환 (snake_case ↔ camelCase)
  - [ ] 타입 변환 (string → number, boolean 등)
  - [ ] 계산 필드 생성

- [ ] **에러 처리 추가**
  - [ ] HTTP 에러 매핑
  - [ ] 네트워크 에러 처리
  - [ ] 데이터 검증 에러

### **기존 API 수정시**

- [ ] **하위 호환성 검증**

  - [ ] 기존 필드 유지 확인
  - [ ] 새 필드 추가시 기본값 설정
  - [ ] 타입 변경시 변환 로직 추가

- [ ] **점진적 배포**
  - [ ] 기능 플래그 사용
  - [ ] A/B 테스트 적용
  - [ ] 롤백 계획 수립

---

## 🔍 **디버깅 및 모니터링**

### **1. 매핑 상태 확인**

```javascript
// 브라우저 콘솔에서 실행
function debugApiMapping(datasetId) {
  const config = window.__REGISTRY?.[datasetId];
  if (!config) return;

  console.group(`🔄 ${datasetId} 매핑 디버그`);

  // API 설정 확인
  const [url, params] = config.api.buildListKey({}, 1, 1);
  console.log("API URL:", url);
  console.log("API Params:", params);

  // 실제 API 호출
  fetch(`http://127.0.0.1:8000${url}`)
    .then((response) => response.json())
    .then((data) => {
      const firstItem = data.items?.[0] || data.results?.[0];
      if (!firstItem) return;

      console.log("백엔드 필드:", Object.keys(firstItem));
      console.log(
        "프론트엔드 컬럼:",
        config.table.columns.map((c) => c.key)
      );

      // 매핑 검증
      const unmappedFields = config.table.columns
        .filter((col) => !(col.key in firstItem) && !firstItem.extra?.[col.key])
        .map((col) => col.key);

      if (unmappedFields.length > 0) {
        console.warn("❌ 매핑되지 않은 필드:", unmappedFields);
      } else {
        console.log("✅ 모든 필드 매핑 완료");
      }
    });

  console.groupEnd();
}
```

### **2. 성능 모니터링**

```typescript
export function createPerformanceMonitor(datasetId: string) {
  return {
    startTiming: (operation: string) => {
      const startTime = performance.now();
      return {
        end: () => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          console.log(`⏱️ ${datasetId} ${operation}: ${duration.toFixed(2)}ms`);

          // 성능 임계값 체크
          if (duration > 1000) {
            console.warn(
              `🐌 ${operation} 응답 속도가 느립니다: ${duration.toFixed(2)}ms`
            );
          }
        },
      };
    },
  };
}
```

---

## 📚 **참고 자료**

### **관련 문서**

- [데이터셋 아키텍처](../DATASET_ARCHITECTURE.md)
- [개발 체크리스트](./DATASET_DEVELOPMENT_CHECKLIST.md)
- [트러블슈팅 가이드](../troubleshooting/데이터셋_문제해결_가이드.md)

### **외부 참조**

- [RESTful API 설계 가이드](https://restfulapi.net/)
- [JSON API 표준](https://jsonapi.org/)
- [OpenAPI 명세서](https://swagger.io/specification/)

---

**작성일**: 2025-08-31  
**최종 업데이트**: 2025-08-31  
**다음 리뷰**: 백엔드 API 변경시
