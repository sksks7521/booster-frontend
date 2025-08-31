# ✅ **데이터셋 개발 체크리스트**

## 🎯 **목적**

- 새로운 데이터셋 추가 또는 기존 데이터셋 수정 시 누락 방지
- 품질 보장 및 일관성 유지
- 문제 예방 및 빠른 배포

---

## 📋 **새 데이터셋 추가 체크리스트**

### **Phase 1: 기획 및 분석**

- [ ] **백엔드 API 스펙 확인**

  - [ ] 엔드포인트 URL 확인
  - [ ] 요청 파라미터 스펙
  - [ ] 응답 데이터 구조
  - [ ] 페이지네이션 방식
  - [ ] 정렬 지원 여부
  - [ ] 필터링 파라미터

- [ ] **데이터 구조 분석**

  - [ ] 총 필드 개수 확인
  - [ ] 필수/선택 필드 구분
  - [ ] 데이터 타입 확인
  - [ ] Null 허용 여부
  - [ ] 중첩 객체 구조 파악

- [ ] **UI/UX 요구사항 정리**
  - [ ] 테이블 컬럼 구성
  - [ ] 필터 옵션
  - [ ] 정렬 기본값
  - [ ] 페이지 사이즈 기본값

### **Phase 2: 코드 구현**

#### **1. Registry 설정 (`datasets/registry.ts`)**

```typescript
// ✅ 체크리스트
- [ ] 데이터셋 ID 정의 (camelCase)
- [ ] title 설정 (사용자에게 보여질 이름)
- [ ] buildListKey 함수 구현
  - [ ] 필터 파라미터 매핑
  - [ ] 페이지네이션 파라미터
  - [ ] 정렬 파라미터
- [ ] fetchList 함수 구현
  - [ ] API 호출 로직
  - [ ] 에러 처리
  - [ ] 응답 데이터 변환 (필요시)
- [ ] adapter.toItemLike 구현 (필요시)
  - [ ] 백엔드 필드명 → 프론트엔드 필드명 매핑
  - [ ] 데이터 타입 변환
  - [ ] 계산 필드 생성
- [ ] table 설정
  - [ ] **올바른 컬럼 정의 사용** ⚠️
  - [ ] defaultSort 설정
- [ ] filters 설정
  - [ ] 기본값 설정
  - [ ] UI 컴포넌트 타입 정의
- [ ] map 설정 (필요시)
  - [ ] 마커 색상 로직
  - [ ] 클러스터링 설정
```

#### **2. 컬럼 정의 (`datasets/contracts.ts`)**

```typescript
// ✅ 체크리스트
- [ ] 새 컬럼 배열 생성 (예: `columnsNewDataset`)
- [ ] 각 컬럼별 설정
  - [ ] key: API 응답 필드명과 일치 ⚠️
  - [ ] header: 사용자에게 보여질 헤더명
  - [ ] width: 적절한 컬럼 너비
  - [ ] sortable: 정렬 가능 여부
  - [ ] type: 데이터 타입 (text, number, date 등)
- [ ] 컬럼 순서 고려 (중요한 컬럼 앞쪽 배치)
- [ ] 반응형 대응 (모바일에서 숨길 컬럼 표시)
```

#### **3. API 클라이언트 (`lib/api.ts`)**

```typescript
// ✅ 체크리스트
- [ ] API 함수 추가 (예: `getNewDataset`)
- [ ] 타입 정의 (TypeScript)
- [ ] 에러 처리
  - [ ] HTTP 에러
  - [ ] 네트워크 에러
  - [ ] 타임아웃
- [ ] 응답 데이터 변환 (필요시)
  - [ ] 백엔드 포맷 → 프론트엔드 포맷
  - [ ] 예: { items, total_items } → { results, count }
- [ ] 캐싱 설정 (필요시)
```

#### **4. 스키마 검증 (`datasets/schemas.ts`)**

````typescript
// ✅ 체크리스트
- [ ] 검증 필요성 판단
  - [ ] 대용량 데이터: 우회 권장
  - [ ] 복잡한 중첩 구조: 우회 권장
  - [ ] 단순한 구조: 검증 구현
- [ ] 검증 로직 구현 (필요시)
  - [ ] 필수 필드 존재 확인
  - [ ] 데이터 타입 검증
  - [ ] 값 범위 검증
- [ ] 우회 로직 추가 (필요시)
  ```typescript
  if (datasetId === "new_dataset") {
    console.log("✅ [validateRow] new_dataset 우회");
    return row;
  }
````

````

### **Phase 3: 컴포넌트 구현**

#### **1. 필터 컴포넌트**
- [ ] **컴포넌트 파일 생성**
  - [ ] `components/features/[dataset]/[Dataset]Filter.tsx`
  - [ ] 적절한 타입 정의
  - [ ] Zustand store 연결

- [ ] **필터 UI 구현**
  - [ ] Select 컴포넌트 value 속성 검증 ⚠️
    ```typescript
    // ❌ 잘못된 예시
    <SelectItem value="">전체</SelectItem>

    // ✅ 올바른 예시
    <SelectItem value="all">전체</SelectItem>
    ```
  - [ ] 기본값 설정
  - [ ] onChange 핸들러 구현
  - [ ] 필터 초기화 기능

#### **2. 검색결과 컴포넌트**
- [ ] **컴포넌트 파일 생성**
  - [ ] `components/features/[dataset]/[Dataset]SearchResults.tsx`
  - [ ] useDataset 훅 사용
  - [ ] 로딩/에러 상태 처리

- [ ] **테이블 구현**
  - [ ] ItemTable 컴포넌트 사용
  - [ ] 정렬 기능 연결
  - [ ] 페이지네이션 연결
  - [ ] 선택 기능 (필요시)

- [ ] **데이터 접근 함수**
  ```typescript
  function getValueForKey(row, key) {
    // ✅ 다층 접근 지원
    return row?.[key] || row?.extra?.[key] || "-";
  }
````

#### **3. 메인 페이지 연결**

- [ ] **탭 추가**

  - [ ] Tab 컴포넌트에 새 탭 추가
  - [ ] 적절한 아이콘 설정
  - [ ] 탭 순서 고려

- [ ] **조건부 렌더링 구현**
  - [ ] activeTab 상태에 따른 컴포넌트 표시
  - [ ] 동적 import 고려 (코드 스플리팅)

### **Phase 4: 테스트 및 검증**

#### **1. 단위 테스트**

- [ ] **API 함수 테스트**

  - [ ] 정상 응답 시나리오
  - [ ] 에러 응답 시나리오
  - [ ] 파라미터 전달 검증

- [ ] **데이터 변환 테스트**
  - [ ] adapter 함수 동작 확인
  - [ ] null/undefined 처리
  - [ ] 타입 변환 정확성

#### **2. 통합 테스트**

- [ ] **API → 컴포넌트 전체 플로우**
  - [ ] 데이터 로딩 확인
  - [ ] 필터링 동작 확인
  - [ ] 정렬 동작 확인
  - [ ] 페이지네이션 동작 확인

#### **3. 브라우저 테스트**

- [ ] **개발자 도구 확인**

  ```javascript
  // 브라우저 콘솔에서 실행
  fetch("http://127.0.0.1:8000/api/v1/new-dataset/?page=1&size=1")
    .then((response) => response.json())
    .then((data) => {
      console.log("API 응답:", data);
      console.log("필드 개수:", Object.keys(data.items[0]).length);
      console.log("예상 필드:", expectedFieldCount);
    });
  ```

- [ ] **UI 동작 확인**
  - [ ] 테이블 렌더링
  - [ ] 데이터 표시 (non-empty)
  - [ ] 필터 동작
  - [ ] 정렬 동작
  - [ ] 반응형 동작

### **Phase 5: 배포 준비**

#### **1. 성능 최적화**

- [ ] **번들 크기 확인**

  - [ ] 불필요한 import 제거
  - [ ] 동적 import 적용
  - [ ] Tree-shaking 확인

- [ ] **렌더링 최적화**
  - [ ] React.memo 적용
  - [ ] useMemo/useCallback 적용
  - [ ] 가상화 고려 (대용량 데이터)

#### **2. 접근성 검증**

- [ ] **키보드 네비게이션**
- [ ] **스크린 리더 호환성**
- [ ] **색상 대비 확인**
- [ ] **ARIA 속성 추가**

#### **3. 브라우저 호환성**

- [ ] **Chrome 최신버전**
- [ ] **Edge 최신버전**
- [ ] **Safari (macOS/iOS)**
- [ ] **Firefox 최신버전**

---

## 🔧 **기존 데이터셋 수정 체크리스트**

### **컬럼 추가/수정**

- [ ] **백엔드 API 변경사항 확인**

  - [ ] 새 필드 추가 여부
  - [ ] 기존 필드 변경 여부
  - [ ] 응답 구조 변경 여부

- [ ] **컬럼 정의 업데이트**

  - [ ] contracts.ts에 새 컬럼 추가
  - [ ] 기존 컬럼 수정
  - [ ] 순서 조정 (필요시)

- [ ] **adapter 업데이트** (필요시)
  - [ ] 새 필드 매핑 추가
  - [ ] 계산 로직 수정

### **필터 기능 수정**

- [ ] **필터 UI 컴포넌트 수정**
- [ ] **API 파라미터 매핑 수정**
- [ ] **기본값 업데이트**

### **성능 개선**

- [ ] **페이지네이션 최적화**
- [ ] **캐싱 전략 수정**
- [ ] **불필요한 API 호출 제거**

---

## 🚨 **중요 주의사항**

### **❌ 자주 발생하는 실수**

1. **컬럼 매핑 오류**

   ```typescript
   // ❌ 잘못된 예시
   auction_ed: {
     table: {
       columns: columnsSale;
     } // 다른 데이터셋용 컬럼 사용
   }
   ```

2. **Select 컴포넌트 value 에러**

   ```typescript
   // ❌ 잘못된 예시
   <SelectItem value="">전체</SelectItem>  // 빈 문자열 사용

   // ✅ 올바른 예시
   <SelectItem value="all">전체</SelectItem>
   ```

3. **API 응답 포맷 불일치**

   ```typescript
   // 백엔드 vs 프론트엔드 포맷 확인 필수
   // 백엔드: { items, total_items }
   // 프론트엔드: { results, count }
   ```

4. **스키마 검증 누락**
   ```typescript
   // 대용량 데이터는 검증 우회 필수
   if (datasetId === "large_dataset") {
     return row; // 검증 우회
   }
   ```

### **✅ 베스트 프랙티스**

1. **타입 안정성**

   ```typescript
   interface NewDatasetItem {
     id: number;
     name: string;
     created_at: string;
   }
   ```

2. **에러 바운더리**

   ```typescript
   // 컴포넌트 레벨 에러 처리
   if (error) {
     return <ErrorComponent error={error} />;
   }
   ```

3. **로딩 상태 관리**

   ```typescript
   if (isLoading) {
     return <SkeletonLoader />;
   }
   ```

4. **접근성 고려**
   ```typescript
   <table role="table" aria-label="데이터셋 테이블">
     <thead>
       <tr>
         <th scope="col" aria-sort="ascending">
           컬럼명
         </th>
       </tr>
     </thead>
   </table>
   ```

---

## 📊 **검증 스크립트**

### **1. 전체 데이터셋 상태 확인**

```javascript
async function checkAllDatasets() {
  const datasets = ["auction_ed", "real_transactions", "real_rents"];
  const results = {};

  for (const dataset of datasets) {
    try {
      const config = window.__REGISTRY?.[dataset];
      if (!config) continue;

      const [url] = config.api.buildListKey({}, 1, 1);
      const response = await fetch(`http://127.0.0.1:8000${url}`);
      const data = await response.json();

      results[dataset] = {
        status: response.status,
        totalItems: data.total_items || data.count || 0,
        fieldCount: Object.keys(data.items?.[0] || data.results?.[0] || {})
          .length,
        configuredColumns: config.table.columns.length,
      };
    } catch (error) {
      results[dataset] = { error: error.message };
    }
  }

  console.table(results);
  return results;
}
```

### **2. 컬럼 매핑 검증**

```javascript
function validateColumnMapping(datasetId) {
  const config = window.__REGISTRY?.[datasetId];
  if (!config) return;

  const configuredKeys = config.table.columns.map((col) => col.key);
  console.log(`✅ ${datasetId} 컬럼 매핑:`, configuredKeys);

  // 실제 API 응답과 비교
  // [실제 비교 로직 구현]
}
```

---

## 📚 **참고 문서**

- [데이터셋 아키텍처](../DATASET_ARCHITECTURE.md)
- [트러블슈팅 가이드](../troubleshooting/데이터셋_문제해결_가이드.md)
- [API 개발 표준](./API_DEVELOPMENT_GUIDE.md)

---

**버전**: 1.0  
**마지막 업데이트**: 2025-08-31  
**다음 리뷰**: 3개월 후
