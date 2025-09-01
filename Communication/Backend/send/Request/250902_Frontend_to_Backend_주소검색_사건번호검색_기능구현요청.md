ㄹㄹ# 🚨 Frontend → Backend 기능 구현 요청서

## 📋 요청 정보

- **요청일**: 2025-09-02
- **요청자**: Frontend Team
- **수신자**: Backend Team
- **우선순위**: 🟡 보통 (Medium)
- **관련 시스템**: auction_ed (과거경매결과) API
- **관련 기능**: 주소검색, 사건번호검색

## 🎯 요청 제목

**auction_ed API 주소검색 및 사건번호검색 필터링 기능 구현**

## 📊 현재 문제 상황

### 🚨 **검색 기능 문제점**

1. **주소검색 미작동**: 프론트엔드에서 주소검색 시 필터링되지 않음
2. **사건번호검색 미작동**: 프론트엔드에서 사건번호검색 시 필터링되지 않음
3. **검색 파라미터 미처리**: 백엔드에서 검색 관련 파라미터를 처리하지 않음

### 🔍 **현재 프론트엔드 구현**

```typescript
// 현재 프론트엔드에서 전송하는 검색 파라미터
const handleAddressSearch = () => {
  setFilter("searchField", "address");
  setFilter("searchQuery", addressSearch);
};

const handleCaseNumberSearch = () => {
  setFilter("searchField", "case_number");
  setFilter("searchQuery", caseNumberSearch);
};
```

### 🌐 **재현 경로**

1. `http://localhost:3000/analysis/101/v2?ds=auction_ed` 접속
2. 우측 필터 패널 → "주소 검색" 섹션에서 주소 입력 후 검색
3. 우측 필터 패널 → "사건번호 검색" 섹션에서 사건번호 입력 후 검색
4. 결과: 검색어와 관계없이 모든 데이터가 표시됨

## 🎯 **요청 사항**

### 1️⃣ **주소검색 기능 구현**

**필터 파라미터**:

```
GET /api/v1/auction-completed/?searchField=address&searchQuery=강남구
```

**필터링 로직**:

- **대상 컬럼**: `소재지` (location/address 컬럼)
- **검색 방식**: **부분 일치** (`ILIKE '%검색어%'` 또는 `LIKE '%검색어%'`)
- **대소문자 무시**: 한글이므로 대소문자 구분 불필요
- **공백 처리**: 검색어 앞뒤 공백 제거 (`TRIM`)

**예시**:

```sql
-- 요청: searchField=address&searchQuery=강남구
-- SQL 조건:
WHERE 소재지 IS NOT NULL
  AND 소재지 != ''
  AND 소재지 ILIKE '%강남구%'
```

**테스트 케이스**:

- `searchQuery=강남구` → 소재지에 "강남구"가 포함된 데이터만 반환
- `searchQuery=서울특별시` → 소재지에 "서울특별시"가 포함된 데이터만 반환
- `searchQuery=역삼동` → 소재지에 "역삼동"이 포함된 데이터만 반환

### 2️⃣ **사건번호검색 기능 구현**

**필터 파라미터**:

```
GET /api/v1/auction-completed/?searchField=case_number&searchQuery=2024타경12345
```

**필터링 로직**:

- **대상 컬럼**: `사건번호` (case_number 컬럼)
- **검색 방식**: **부분 일치** (`ILIKE '%검색어%'` 또는 `LIKE '%검색어%'`)
- **숫자/문자 혼합**: 사건번호는 "2024타경12345" 형태이므로 문자열 검색
- **공백 처리**: 검색어 앞뒤 공백 제거 (`TRIM`)

**예시**:

```sql
-- 요청: searchField=case_number&searchQuery=2024타경
-- SQL 조건:
WHERE 사건번호 IS NOT NULL
  AND 사건번호 != ''
  AND 사건번호 ILIKE '%2024타경%'
```

**테스트 케이스**:

- `searchQuery=2024타경` → 사건번호에 "2024타경"이 포함된 데이터만 반환
- `searchQuery=12345` → 사건번호에 "12345"가 포함된 데이터만 반환
- `searchQuery=타경` → 사건번호에 "타경"이 포함된 데이터만 반환

### 3️⃣ **검색 파라미터 처리 로직**

**파라미터 조합**:

```
GET /api/v1/auction-completed/?searchField=address&searchQuery=강남구&address_area=서울특별시
```

**우선순위**:

1. **searchField가 없거나 "all"인 경우**: 검색 필터 적용 안 함
2. **searchField="address"인 경우**: 소재지 컬럼에서 searchQuery로 검색
3. **searchField="case_number"인 경우**: 사건번호 컬럼에서 searchQuery로 검색
4. **다른 필터와 조합**: 지역 필터, 매각가 필터 등과 AND 조건으로 결합

**SQL 예시**:

```sql
-- 복합 필터 예시
WHERE address_area = '서울특별시'
  AND address_city = '서울특별시 강남구'
  AND max_final_sale_price <= 10000
  AND 소재지 ILIKE '%역삼동%'  -- 주소검색 추가
```

## 🔧 **기술적 요구사항**

### **1. 성능 최적화**

- **인덱스 추가**: `소재지`, `사건번호` 컬럼에 인덱스 생성 고려
- **LIKE 최적화**: PostgreSQL의 경우 `pg_trgm` 확장 사용 고려
- **검색어 길이 제한**: 최소 2자 이상, 최대 100자 이하

### **2. 에러 처리**

- **빈 검색어**: `searchQuery`가 빈 문자열인 경우 필터 무시
- **특수문자 처리**: SQL 인젝션 방지를 위한 이스케이프 처리
- **NULL 처리**: 컬럼 값이 NULL인 경우 검색 대상에서 제외

### **3. 응답 최적화**

- **검색 결과 개수**: 검색 적용 후 총 건수 반환
- **하이라이팅**: 검색어가 포함된 부분 표시 (선택사항)
- **응답 시간**: 검색 쿼리 응답 시간 < 2초

## 📋 **완료 조건 (DoD)**

### ✅ **API 구현 완료**

1. **주소검색**: `searchField=address&searchQuery=강남구` 파라미터로 올바른 데이터 반환
2. **사건번호검색**: `searchField=case_number&searchQuery=2024타경` 파라미터로 올바른 데이터 반환
3. **복합 필터**: 다른 필터들과 AND 조건으로 정상 작동

### ✅ **테스트 케이스**

1. **주소검색 테스트**:

   - `searchQuery=강남구` → 소재지에 "강남구" 포함 데이터만 반환
   - `searchQuery=서울` → 소재지에 "서울" 포함 데이터만 반환
   - `searchQuery=` → 모든 데이터 반환 (필터 무시)

2. **사건번호검색 테스트**:

   - `searchQuery=2024` → 사건번호에 "2024" 포함 데이터만 반환
   - `searchQuery=타경` → 사건번호에 "타경" 포함 데이터만 반환
   - `searchQuery=` → 모든 데이터 반환 (필터 무시)

3. **복합 필터 테스트**:
   - 지역 필터 + 주소검색 조합 테스트
   - 매각가 필터 + 사건번호검색 조합 테스트

### ✅ **성능 기준**

- **검색 쿼리**: 응답 시간 < 2초
- **복합 필터**: 응답 시간 < 3초
- **동시 요청**: 50 req/s 이상 처리

## 🚀 **프론트엔드 연동 계획**

**백엔드 완료 후 프론트엔드에서 확인할 사항**:

1. **검색 파라미터 전송**:

   ```typescript
   // 주소검색
   setFilter("searchField", "address");
   setFilter("searchQuery", "강남구");

   // 사건번호검색
   setFilter("searchField", "case_number");
   setFilter("searchQuery", "2024타경");
   ```

2. **검색 결과 확인**:

   - 검색어에 맞는 데이터만 표시되는지 확인
   - 다른 필터와 조합 시 정상 작동하는지 확인

3. **UI 개선**:
   - 검색 결과 하이라이팅 (선택사항)
   - 검색 중 로딩 상태 표시

## 📁 **관련 파일**

**프론트엔드**:

- `Application/components/features/auction-ed/AuctionEdFilter.tsx` (검색 UI)
- `Application/datasets/registry.ts` (검색 파라미터 매핑)

**백엔드 (예상)**:

- `app/api/v1/endpoints/auction_completed.py` (검색 파라미터 처리)
- `app/crud/crud_auction_completed.py` (검색 필터링 로직)
- `app/models/auction_completed.py` (컬럼 확인)

## 🔄 **우선순위 및 일정**

**Phase 1 (우선)**:

- 주소검색 기능 구현
- 사건번호검색 기능 구현
- 기본 테스트 케이스 검증

**Phase 2 (후속)**:

- 성능 최적화 (인덱스 추가)
- 검색 결과 하이라이팅
- 고급 검색 기능 (정확 일치, 정규식 등)

## 📞 **추가 문의사항**

1. **컬럼명 확인**: 실제 DB에서 소재지, 사건번호 컬럼명이 무엇인가요?
2. **데이터 형태**: 소재지와 사건번호 데이터가 어떤 형태로 저장되어 있나요?
3. **인덱스 현황**: 현재 소재지, 사건번호 컬럼에 인덱스가 있나요?

---

**완료 시 회신 요청사항**:

- 구현된 검색 파라미터 명세
- 테스트 결과 및 샘플 검색 쿼리
- 실제 컬럼명 및 데이터 형태 정보

이상입니다. 빠른 구현 부탁드리며, 추가 문의사항이 있으시면 언제든 연락 부탁드립니다.
