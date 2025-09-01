# 🚨 Frontend → Backend 기능 개선 요청서

## 📋 요청 정보

- **요청일**: 2025-09-02
- **요청자**: Frontend Team
- **수신자**: Backend Team
- **우선순위**: 🟡 보통 (Medium)
- **관련 시스템**: auction_ed (과거경매결과) API
- **관련 기능**: 특수권리 필터링

## 🎯 요청 제목

**auction_ed 특수권리 필터링 기능 개선 - 실제 데이터 기반 동적 필터 구현**

## 📊 현재 문제 상황

### 🚨 **특수권리 필터 문제점**

1. **하드코딩된 필터 옵션**: 프론트엔드에서 고정된 특수권리 옵션 사용
2. **실제 데이터와 불일치**: 실제 과거경매결과 데이터의 특수권리와 필터 옵션이 다름
3. **필터링 정확도 부족**: 실제 존재하지 않는 특수권리로 필터링 시도

### 🔍 **현재 프론트엔드 구현**

```typescript
// 현재 하드코딩된 특수권리 옵션들
const specialRights = [
  "근저당권",
  "전세권",
  "임차권",
  "지상권",
  "지역권",
  "유치권",
  "법정지상권",
  "분묘기지권",
  "기타",
];
```

### 🌐 **재현 경로**

1. `http://localhost:3000/analysis/101/v2?ds=auction_ed` 접속
2. 우측 필터 패널 → "특수권리" 섹션 확인
3. 하드코딩된 옵션들과 실제 데이터의 특수권리 값 비교

## 🎯 **요청 사항**

### 1️⃣ **특수권리 Unique 값 조회 API 구현**

**새로운 엔드포인트 요청**:

```
GET /api/v1/auction-completed/special-rights/unique
```

**응답 형태**:

```json
{
  "special_rights": [
    "근저당권",
    "전세권",
    "임차권",
    "지상권",
    "유치권",
    "법정지상권",
    "기타실제권리1",
    "기타실제권리2"
  ],
  "total_count": 8
}
```

**요구사항**:

- `special_rights` 컬럼에서 NULL이 아닌 모든 unique 값 반환
- 빈 문자열("") 제외
- 알파벳순 정렬
- 실제 데이터에 존재하는 권리만 포함

### 2️⃣ **특수권리 OR 조건 필터링 구현**

**기존 필터 파라미터 개선**:

```
GET /api/v1/auction-completed/?special_rights=근저당권,전세권,임차권
```

**필터링 로직**:

- **OR 조건**: 선택된 특수권리 중 **하나라도** 포함된 데이터 반환
- **CSV 형태**: 쉼표(,)로 구분된 다중 값 지원
- **부분 일치**: `LIKE '%근저당권%'` 또는 `ILIKE '%근저당권%'` 사용
- **NULL 처리**: `special_rights IS NOT NULL AND special_rights != ''` 선조건

**예시**:

```sql
-- 요청: special_rights=근저당권,전세권
-- SQL 조건:
WHERE special_rights IS NOT NULL
  AND special_rights != ''
  AND (
    special_rights ILIKE '%근저당권%' OR
    special_rights ILIKE '%전세권%'
  )
```

### 3️⃣ **지역별 특수권리 조회 API (선택사항)**

**고급 기능 요청**:

```
GET /api/v1/auction-completed/special-rights/unique?address_area=경기도&address_city=경기도+고양시
```

**목적**: 선택된 지역에서만 존재하는 특수권리 옵션 제공

## 🔧 **기술적 요구사항**

### **1. 데이터 정합성**

- 실제 `special_rights` 컬럼의 데이터 형태 확인
- 다중 권리가 하나의 필드에 저장된 경우 파싱 로직 필요
- 예: "근저당권, 전세권" → ["근저당권", "전세권"]

### **2. 성능 최적화**

- `special_rights` 컬럼에 인덱스 추가 고려
- 캐싱 적용 (Redis 등) - unique 값은 자주 변경되지 않음
- 페이지네이션 지원 (필요시)

### **3. 에러 처리**

- 존재하지 않는 특수권리로 필터링 시 빈 결과 반환
- 잘못된 CSV 형태 파라미터 처리
- API 응답 시간 최적화

## 📋 **완료 조건 (DoD)**

### ✅ **API 구현 완료**

1. **Unique 값 조회**: `/api/v1/auction-completed/special-rights/unique` 정상 응답
2. **OR 조건 필터링**: `special_rights=근저당권,전세권` 파라미터로 올바른 데이터 반환
3. **실제 데이터 검증**: 프론트엔드에서 실제 특수권리 값들로 필터링 테스트 성공

### ✅ **테스트 케이스**

1. **단일 특수권리**: `special_rights=근저당권` → 근저당권 포함 데이터만 반환
2. **다중 특수권리**: `special_rights=근저당권,전세권` → 둘 중 하나라도 포함된 데이터 반환
3. **존재하지 않는 권리**: `special_rights=없는권리` → 빈 결과 반환
4. **빈 값 처리**: `special_rights=` → 모든 데이터 반환 (필터 무시)

### ✅ **성능 기준**

- Unique 값 조회: 응답 시간 < 500ms
- 필터링 쿼리: 응답 시간 < 1000ms
- 동시 요청 처리: 100 req/s 이상

## 🚀 **프론트엔드 구현 계획**

**백엔드 완료 후 프론트엔드에서 구현할 기능**:

1. **동적 특수권리 버튼 생성**

   ```typescript
   // API에서 받은 unique 값들로 버튼 동적 생성
   const { data: specialRights } = useSWR(
     "/api/v1/auction-completed/special-rights/unique"
   );
   ```

2. **다중 선택 UI**

   ```typescript
   // 복수 버튼 클릭 시 OR 조건으로 필터링
   const [selectedRights, setSelectedRights] = useState<string[]>([]);
   ```

3. **필터 적용**
   ```typescript
   // CSV 형태로 서버에 전송
   const rightsParam = selectedRights.join(",");
   ```

## 📁 **관련 파일**

**프론트엔드**:

- `Application/components/features/auction-ed/AuctionEdFilter.tsx` (특수권리 필터 UI)
- `Application/datasets/registry.ts` (필터 파라미터 매핑)

**백엔드 (예상)**:

- `app/api/v1/endpoints/auction_completed.py` (엔드포인트 추가)
- `app/crud/crud_auction_completed.py` (필터링 로직 추가)
- `app/models/auction_completed.py` (모델 확인)

## 🔄 **우선순위 및 일정**

**Phase 1 (우선)**:

- Unique 값 조회 API 구현
- 기본 OR 조건 필터링 구현

**Phase 2 (후속)**:

- 지역별 특수권리 조회 API
- 성능 최적화 및 캐싱

## 📞 **추가 문의사항**

1. **데이터 형태**: `special_rights` 컬럼에 여러 권리가 어떤 형태로 저장되어 있나요?
2. **구분자**: 다중 권리 저장 시 구분자는 무엇인가요? (쉼표, 세미콜론, 파이프 등)
3. **데이터 양**: 전체 특수권리 unique 값이 대략 몇 개 정도 예상되나요?

---

**완료 시 회신 요청사항**:

- 구현된 API 엔드포인트 URL
- 테스트 결과 및 샘플 응답 데이터
- 특수권리 데이터 형태 및 구분자 정보

이상입니다. 빠른 구현 부탁드리며, 추가 문의사항이 있으시면 언제든 연락 부탁드립니다.
