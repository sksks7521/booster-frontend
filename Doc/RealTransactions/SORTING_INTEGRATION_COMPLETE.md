# 실거래가(매매) 정렬 기능 통합 완료 (2025-10-03)

## 🎉 작업 완료 요약

백엔드 `/columns` API와 프론트엔드 정렬 기능 통합이 완료되었습니다!

---

## ✅ 완료된 작업

### 1. 백엔드 API 구현 완료 (백엔드 팀)

**엔드포인트:**

```
GET /api/v1/real-transactions/columns
```

**응답 형식:**

```json
{
  "columns": [
    {
      "key": "contract_date",
      "label": "계약일자",
      "sortable": true
    },
    {
      "key": "transaction_amount",
      "label": "거래금액",
      "sortable": true
    }
    // ... 더 많은 컬럼들
  ]
}
```

**정렬 가능 필드 (5개):**

1. `contract_date` - 계약일자
2. `transaction_amount` - 거래금액
3. `exclusive_area_sqm` - 전용면적(㎡)
4. `construction_year_real` - 건축연도 ⭐ 신규
5. `price_per_pyeong` - 평단가 ⭐ 신규

---

### 2. 프론트엔드 통합 완료 (방금 완료)

#### **수정된 파일 (3개)**

**1. `Application/lib/api.ts`**

```typescript
export const realTransactionApi = {
  getTransactions: (params?: Record<string, any>) =>
    apiClient.getRealTransactions(params),
  getMarketPrice: (params?: Record<string, any>) =>
    apiClient.getMarketPrice(params),
  getColumns: async (): Promise<any> => {
    // ⭐ 신규 추가
    const response = await fetch(
      `${API_BASE_URL}/api/v1/real-transactions/columns`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch columns");
    }
    return response.json();
  },
};
```

**2. `Application/hooks/useSortableColumns.ts`**

```typescript
export function useSortableColumns(datasetId: DatasetId) {
  const key = columnsPath(datasetId);
  const { data, error, isLoading } = useSWR<SortableColumns | ColumnsResponse>(
    key ? [key] : null,
    async () => {
      // sale 데이터셋은 새로운 형식 지원 ⭐
      if (datasetId === "sale") {
        const response = await realTransactionApi.getColumns();
        return response as ColumnsResponse;
      }
      // auction_ed는 기존 형식 유지
      return fetcher(key!);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30 * 60 * 1000, // 30분 캐시
    }
  );

  // 응답 형식에 따라 sortable columns 추출 ⭐
  let list: string[] = [];
  if (data) {
    if ("columns" in data) {
      // 새로운 형식 (sale)
      list = data.columns.filter((col) => col.sortable).map((col) => col.key);
    } else if ("sortable_columns" in data) {
      // 기존 형식 (auction_ed)
      list = Array.isArray(data.sortable_columns) ? data.sortable_columns : [];
    }
  }

  return { sortableColumns: list, isLoading, error };
}
```

**3. `Application/components/features/sale/SaleSearchResults.tsx`**

- 이미 `useSortableColumns("sale")` 호출 중 ✅
- 기본 정렬: `contractDate desc` 설정됨 ✅

---

## 🎯 동작 흐름

### **1. 페이지 로드 시**

```
1. SaleSearchResults 컴포넌트 마운트
2. useSortableColumns("sale") 호출
3. /api/v1/real-transactions/columns API 요청
4. 응답: { columns: [...] }
5. sortable: true인 컬럼만 필터링
6. sortableColumns: ["contract_date", "transaction_amount", ...]
```

### **2. 지역 선택 후**

```
1. regionReady = true
2. useEffect에서 기본 정렬 설정
3. setSortConfig("contractDate", "desc")
4. registry.ts에서 ordering=-contract_date로 변환
5. /api/v1/real-transactions/?ordering=-contract_date&... 요청
```

### **3. 테이블 헤더 클릭 시**

```
1. handleSort(columnKey, order) 호출
2. sortableColumns에 포함되어 있는지 확인
3. setSortConfig(columnKey, order)
4. URL 파라미터 업데이트
5. API 재요청 (ordering=-transaction_amount 등)
```

---

## 📊 지원되는 정렬 패턴

### **Backend에서 지원하는 ordering 파라미터**

| 필드     | 오름차순                          | 내림차순                           |
| -------- | --------------------------------- | ---------------------------------- |
| 계약일자 | `ordering=contract_date`          | `ordering=-contract_date` ⭐ 기본  |
| 거래금액 | `ordering=transaction_amount`     | `ordering=-transaction_amount`     |
| 전용면적 | `ordering=exclusive_area_sqm`     | `ordering=-exclusive_area_sqm`     |
| 건축연도 | `ordering=construction_year_real` | `ordering=-construction_year_real` |
| 평단가   | `ordering=price_per_pyeong`       | `ordering=-price_per_pyeong`       |

---

## 🧪 검증 방법

### **검증 1: /columns API 응답 확인**

```bash
# 브라우저 개발자 도구 Console에서 실행
fetch('http://127.0.0.1:8000/api/v1/real-transactions/columns')
  .then(res => res.json())
  .then(data => {
    console.log('전체 컬럼:', data.columns.length);
    console.log('정렬 가능:', data.columns.filter(c => c.sortable));
  });

# 예상 출력:
# 전체 컬럼: 24
# 정렬 가능: [
#   { key: "contract_date", label: "계약일자", sortable: true },
#   { key: "transaction_amount", label: "거래금액", sortable: true },
#   { key: "exclusive_area_sqm", label: "전용면적(㎡)", sortable: true },
#   { key: "construction_year_real", label: "건축연도", sortable: true },
#   { key: "price_per_pyeong", label: "평단가", sortable: true }
# ]
```

---

### **검증 2: useSortableColumns 훅 동작 확인**

```typescript
// SaleSearchResults.tsx에서 이미 호출 중
const { sortableColumns, isLoading, error } = useSortableColumns("sale");

console.log("sortableColumns:", sortableColumns);
// 예상: ["contract_date", "transaction_amount", "exclusive_area_sqm", "construction_year_real", "price_per_pyeong"]
```

---

### **검증 3: 정렬 파라미터 전달 확인**

1. 브라우저 개발자 도구 → Network 탭 열기
2. 실거래가 페이지 접속: `http://localhost:3000/analysis/10071/v2?ds=sale`
3. 지역 선택: **경기도** → **고양시 덕양구**
4. Network 탭에서 `/api/v1/real-transactions/` 요청 확인
5. Query String Parameters 확인:
   ```
   ordering: -contract_date  ✅ (기본 정렬)
   sido: 경기도
   sigungu: 고양시 덕양구
   page: 1
   size: 20
   ```

---

### **검증 4: 테이블 정렬 버튼 클릭**

1. 테이블 헤더의 "거래금액" 컬럼 클릭
2. Network 탭에서 새 요청 확인:
   ```
   ordering: -transaction_amount  ✅ (내림차순 = 비싼 순)
   ```
3. 다시 클릭:
   ```
   ordering: transaction_amount  ✅ (오름차순 = 저렴한 순)
   ```

---

## 🎨 UI 동작

### **정렬 가능한 컬럼**

- ✅ 헤더에 화살표 아이콘 표시
- ✅ 클릭 시 오름차순 ↔ 내림차순 전환
- ✅ 현재 정렬 중인 컬럼 하이라이트

### **정렬 불가능한 컬럼**

- ❌ 화살표 아이콘 없음
- ❌ 클릭 불가
- ⚪ 일반 텍스트 표시

---

## 📝 Key-Value 매핑

### **프론트엔드 → 백엔드**

| 프론트엔드 (camelCase) | 백엔드 (snake_case)      | 변환 로직        |
| ---------------------- | ------------------------ | ---------------- |
| `contractDate`         | `contract_date`          | `camelToSnake()` |
| `transactionAmount`    | `transaction_amount`     | `camelToSnake()` |
| `exclusiveAreaSqm`     | `exclusive_area_sqm`     | `camelToSnake()` |
| `constructionYearReal` | `construction_year_real` | `camelToSnake()` |
| `pricePerPyeong`       | `price_per_pyeong`       | `camelToSnake()` |

**변환 함수 (registry.ts):**

```typescript
const camelToSnake = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  return value.replace(/([A-Z])/g, "_$1").toLowerCase();
};
```

---

## 🚀 기대 효과

### **사용자 경험**

- ✨ 원하는 순서로 데이터 정렬 가능
- ✨ 최신 거래부터 기본 표시 (기본 정렬)
- ✨ 가격/면적/연도별 비교 용이

### **개발자 경험**

- 🛠️ 경매 API와 동일한 패턴
- 🛠️ 코드 재사용 가능
- 🛠️ 유지보수 용이

---

## 📌 다음 작업 (Phase 4 나머지)

현재 완료된 작업:

- [x] 작업 3: 서버 정렬 허용 키 확정 ✅
- [x] 작업 D: SWR 캐싱 최적화 ✅
- [x] 작업 C: 빈 상태 & 에러 메시지 개선 ✅

남은 작업:

- [ ] 작업 1: 테이블 컬럼 구성 최적화 (사용자 결정 필요)
- [ ] 작업 2: 모바일 반응형 UI 개선 (사용자 결정 필요)
- [ ] 작업 5: 지도 색상 임계값 검증 (선택적)

---

## ✅ 체크리스트

**백엔드:**

- [x] `/columns` API 구현
- [x] 정렬 가능 필드 5개 지원
- [x] Django 스타일 `ordering` 파라미터 지원
- [x] 테스트 완료
- [x] 문서 작성

**프론트엔드:**

- [x] `realTransactionApi.getColumns()` 추가
- [x] `useSortableColumns` 훅에 sale 지원 추가
- [x] 기본 정렬 설정 (`-contract_date`)
- [x] SWR 캐싱 최적화 (30분)
- [ ] 브라우저 검증 (다음 단계)

---

## 🎉 최종 상태

✅ **정렬 기능 통합 완료!**

- 백엔드 API 준비 완료
- 프론트엔드 코드 통합 완료
- 5개 필드 정렬 지원
- 기본 정렬 설정됨

✅ **즉시 사용 가능!**

- 브라우저에서 바로 테스트 가능
- 추가 설정 불필요

---

**다음: 브라우저에서 검증 수행** 🚀
