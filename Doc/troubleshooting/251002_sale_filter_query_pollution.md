# 실거래가(매매) 필터 쿼리 오염 문제

**날짜:** 2025-10-02  
**상태:** 🔴 미해결  
**우선순위:** P1 (High)  
**영향 범위:** SaleSearchResults 컴포넌트, useDataset 훅

---

## 📋 문제 요약

`SaleSearchResults`에서 `useDataset` 훅 호출 시 Zustand 스토어 전체를 전달하여:

1. **Zustand 액션 함수들이 쿼리 파라미터로 전송**됨
2. **URL이 수천 자로 비대화**됨
3. **불필요한 auction_ed 전용 필터**가 포함됨
4. 백엔드는 200 OK 반환하지만, **프론트엔드에서 데이터 렌더링 실패**

---

## 🔍 증상

### 사용자 관점

- URL: `http://localhost:3000/analysis/10071/v2?province=경기도&ds=sale&cityDistrict=경기도+고양시`
- 화면: "총 0건의 매매 거래를 분석해보세요" (데이터 없음)
- 지역 선택은 정상 표시됨

### 백엔드 로그

```
INFO: GET /api/v1/real-transactions/?
  searchField=all
  &buildingType=all
  &priceRange=0,500000
  &areaRange=0,200
  &buildingAreaRange=0,100
  &landAreaRange=0,200
  &buildYear=1980,2024
  &setFilter=(key, value)=>set({[key]: value})  ← ⚠️ 함수!
  &setRangeFilter=(key, value)=>set({[key]: value})  ← ⚠️ 함수!
  &setPage=(page)=>set({page})  ← ⚠️ 함수!
  &setSortConfig=(sortBy, sortOrder)=>set({...})  ← ⚠️ 함수!
  &resetFilters=()=>set(initialState)  ← ⚠️ 함수!
  &setThresholds=(t)=>set((state)=>{...})  ← ⚠️ 함수!
  ...
  &sido=경기도
  &sigungu=경기도 고양시
HTTP/1.1" 200 OK
```

---

## 🚨 핵심 문제점

### 1. Zustand 스토어 전체 전달

**파일:** `Application/components/features/sale/SaleSearchResults.tsx`  
**Line 61-87:**

```typescript
const allFilters = useFilterStore(); // ← 스토어 전체 (함수 포함)
// ...
useDataset("sale", allFilters, page, size, regionReady); // ← 전체 전달
```

**문제:**

- `allFilters`에는 **상태값 + 액션 함수**가 모두 포함됨
- `useDataset` → SWR → `buildListKey` 과정에서 객체 전체가 쿼리스트링으로 변환됨
- 함수는 `toString()`으로 변환되어 `"(key, value)=>set({...})"` 형태로 전송됨

### 2. camelCase 파라미터 미변환

**백엔드 로그:**

```
&sortBy=contractDate  ← ⚠️ camelCase
&sortOrder=desc
&ordering=-contract_date  ← ✅ snake_case (registry.ts에서 변환)
```

**문제:**

- `sortBy`가 변환되지 않고 camelCase로 전송됨
- `ordering`과 중복 전송
- v2 페이지에서는 변환 로직이 있지만, `SaleSearchResults`에는 없음

### 3. 불필요한 파라미터 과다 전송

**sale에 불필요한 필터:**

```
buildingAreaRange=0,100      ← auction_ed 전용 (건축면적)
landAreaRange=0,200          ← auction_ed 전용 (토지면적)
auctionStatus=all            ← auction_ed 전용 (경매 상태)
currentStatus=all            ← auction_ed 전용 (현재 상태)
specialConditions=           ← auction_ed 전용 (특수 조건)
specialBooleanFlags=         ← auction_ed 전용
under100=false               ← auction_ed 전용 (100% 미만)
```

**문제:**

- 전역 스토어가 auction_ed와 sale에서 공유됨
- 데이터셋별 필터 격리 미구현

### 4. 함수 직렬화로 인한 URL 비대화

**URL 크기:**

- 정상: ~200자
- 현재: **~8,000자** (함수 포함)

**문제:**

- 브라우저 URL 길이 제한 (IE: 2,083자, Chrome: 32,768자)
- SWR 캐시 키 비대화
- 네트워크 전송 비효율

### 5. registry.ts 정제 로직 우회

**파일:** `Application/datasets/registry.ts`  
**Line 703-747:** `buildListKey`에서 정제 로직 존재

```typescript
buildListKey: ({ filters, page, size }) => {
  const cleanFilters = { ...filters };
  // 좌표 제거
  delete cleanFilters.lat;
  delete cleanFilters.lng;
  // ...
  // 지역 매핑
  if (filters?.province) {
    cleanFilters.sido = filters.province;
    delete cleanFilters.province;
  }
  // ...
};
```

**문제:**

- `useDataset` 호출 시 원본 `allFilters`가 SWR 키로 먼저 사용됨
- `buildListKey`는 실제 fetch 시에만 실행되어 **타이밍 이슈** 발생 가능

---

## 📊 영향 분석

### 직접 영향

- ✅ 백엔드: 200 OK (파라미터 무시하고 정상 처리)
- ❌ 프론트엔드: 데이터 렌더링 실패
- ❌ SWR 캐시: 오염된 키로 캐싱됨
- ❌ 성능: 불필요한 파라미터 전송으로 네트워크 낭비

### 간접 영향

- 디버깅 어려움 (로그 분석 복잡)
- 다른 데이터셋(rent, listings)에도 동일 문제 존재 가능성
- URL 공유/딥링크 기능 저해

---

## 🔧 해결 방안 (제안)

### Option A: 필터 정제 함수 추가 (권장)

**파일:** `Application/components/features/sale/SaleSearchResults.tsx`

```typescript
// allFilters에서 필요한 필드만 추출
const cleanFilters = useMemo(() => {
  const base = allFilters as any;
  return {
    province: base?.province,
    cityDistrict: base?.cityDistrict,
    town: base?.town,
    transactionAmountRange: base?.transactionAmountRange,
    exclusiveAreaRange: base?.exclusiveAreaRange,
    buildYear: base?.buildYear,
    searchField: base?.searchField,
    searchQuery: base?.searchQuery,
    sortBy: base?.sortBy,
    sortOrder: base?.sortOrder,
  };
}, [allFilters]);

useDataset("sale", cleanFilters, page, size, regionReady);
```

**장점:**

- 명시적이고 안전
- 불필요한 필터 차단
- 각 데이터셋별 맞춤 가능

**단점:**

- 필터 추가 시 수동 업데이트 필요

### Option B: Zustand 선택자 활용

```typescript
const filters = useFilterStore((s) => ({
  province: s.province,
  cityDistrict: s.cityDistrict,
  town: s.town,
  transactionAmountRange: s.transactionAmountRange,
  exclusiveAreaRange: s.exclusiveAreaRange,
  // ...
}));
```

**장점:**

- Zustand 네이티브 방식
- 리렌더링 최적화

**단점:**

- 코드 중복

### Option C: useDataset 훅 내부에서 필터링

**파일:** `Application/hooks/useDataset.ts`

```typescript
export function useDataset(datasetId, rawFilters, page, size, enabled) {
  // 함수 제거
  const cleanFilters = useMemo(() => {
    const clean = {};
    for (const [key, value] of Object.entries(rawFilters)) {
      if (typeof value !== "function") {
        clean[key] = value;
      }
    }
    return clean;
  }, [rawFilters]);

  // ...
}
```

**장점:**

- 중앙화된 해결책
- 모든 데이터셋에 자동 적용

**단점:**

- 훅 복잡도 증가
- 데이터셋별 커스터마이징 어려움

---

## 📅 해결 일정 (제안)

### 단기 (당일)

1. ✅ 문제 문서화 (본 문서)
2. ⏳ Option A 적용 (`SaleSearchResults.tsx` 수정)
3. ⏳ 테스트 및 검증

### 중기 (1-2일)

1. `RentSearchResults.tsx`, `ListingsSearchResults.tsx`에도 동일 패턴 적용
2. `AuctionEdSearchResults.tsx` 점검 (이미 정제 로직 있는지 확인)
3. 전역 필터 구조 개선 검토

### 장기 (1주)

1. 데이터셋별 네임스페이스 격리 구현
2. `useDataset` 훅 개선 (Option C)
3. E2E 테스트 추가

---

## 🔗 관련 파일

- `Application/components/features/sale/SaleSearchResults.tsx` (Line 61-87)
- `Application/hooks/useDataset.ts`
- `Application/datasets/registry.ts` (Line 699-848)
- `Application/store/filterStore.ts`
- `Application/app/analysis/[id]/v2/page.tsx` (Line 716-746)

---

## 📌 참고 사항

### AuctionEdSearchResults는 어떻게 동작하는가?

**파일:** `Application/components/features/auction-ed/AuctionEdSearchResults.tsx`

```typescript
const allFilters: any = useFilterStore();
const nsOverrides = allFilters.ns?.auction_ed as any;
const mergedFilters = { ...allFilters, ...nsOverrides };

// 좌표 제거
const { lat, lng, south, west, north, east, radius_km, ...otherFilters } =
  mergedFilters;

const filters = {
  ...otherFilters,
  lat: undefined,
  lng: undefined,
  // ...
  sortBy: mergedFilters?.sortBy,
  sortOrder: mergedFilters?.sortOrder,
};
```

**차이점:**

- auction_ed는 **일부 필드를 명시적으로 제거**함
- 하지만 **함수는 여전히 포함됨** (동일 문제 존재 가능성)

---

## ✅ 검증 체크리스트

해결 후 다음 항목 확인:

- [ ] 백엔드 로그에서 함수 파라미터 사라짐
- [ ] URL 길이 200~500자 이내
- [ ] 데이터 정상 렌더링
- [ ] 정렬 정상 동작
- [ ] 필터 변경 시 데이터 갱신
- [ ] 브라우저 DevTools Network 탭에서 쿼리 확인
- [ ] SWR 캐시 키 정상 확인

---

**작성자:** AI Assistant  
**검토 필요:** Backend, Frontend 팀
