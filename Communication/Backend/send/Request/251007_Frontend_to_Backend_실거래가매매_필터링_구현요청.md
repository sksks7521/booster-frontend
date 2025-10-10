# 🚨 Frontend→Backend | 실거래가(매매) 필터 구현 긴급 요청 (2025-10-07)

## 📋 **요약**

- **API**: `/api/v1/real-transactions/`
- **데이터셋**: `sale` (실거래가 매매)
- **현재 상태**: 층확인, 엘리베이터 필터 파라미터가 전송되지만 실제 필터링이 작동하지 않음
- **참고**: 경매결과 API(`/api/v1/auction-completed/`)에서는 동일한 필터가 정상 작동 중

---

## 🔍 **문제 상세**

### ✅ **정상 작동하는 필터 (백엔드 구현 완료)**

다음 필터들은 현재 정상적으로 작동합니다:

1. **지역 필터**

   - `sido` (시도)
   - `sigungu` (시군구)
   - `admin_dong_name` (읍면동)

2. **거래금액 범위**

   - `min_transaction_amount` (최소 거래금액)
   - `max_transaction_amount` (최대 거래금액)

3. **평단가 범위**

   - `min_price_per_pyeong` (최소 평당 가격)
   - `max_price_per_pyeong` (최대 평당 가격)

4. **전용면적 범위**

   - `min_exclusive_area` (최소 전용면적)
   - `max_exclusive_area` (최대 전용면적)

5. **대지권면적 범위**

   - `min_land_rights_area` (최소 대지권면적)
   - `max_land_rights_area` (최대 대지권면적)

6. **건축연도 범위**

   - `min_construction_year` (최소 건축연도)
   - `max_construction_year` (최대 건축연도)

7. **거래날짜 범위**

   - `contract_date_from` (거래일자 시작)
   - `contract_date_to` (거래일자 종료)

8. **주소 검색**

   - `address_search` (지번 주소 검색)
   - `road_address_search` (도로명 주소 검색)

9. **정렬**
   - `ordering` (예: `-contract_date`, `transaction_amount`)

---

### ❌ **작동하지 않는 필터 (백엔드 구현 필요)**

다음 2개 필터가 백엔드에서 처리되지 않습니다:

#### **1. 층확인 필터 (`floor_confirmation`)**

**프론트엔드 전송 형식:**

- 단일 선택: `floor_confirmation=first_floor`
- 복수 선택: `floor_confirmation=basement,first_floor`
- 전체 선택: 파라미터 전송 안 함

**층확인 값 종류:**

- `basement` - 반지하
- `first_floor` - 1층
- `normal_floor` - 일반층
- `top_floor` - 탑층

**예상 구현 방식:**

```python
if floor_confirmation:
    floor_values = floor_confirmation.split(',')
    queryset = queryset.filter(floor_confirmation__in=floor_values)
```

#### **2. 엘리베이터 필터 (`elevator_available`)**

**프론트엔드 전송 형식:**

- 있음: `elevator_available=true`
- 없음: `elevator_available=false`
- 전체 선택: 파라미터 전송 안 함

**예상 구현 방식:**

```python
if elevator_available is not None:
    if elevator_available == 'true' or elevator_available == True:
        queryset = queryset.filter(elevator_available=True)
    elif elevator_available == 'false' or elevator_available == False:
        queryset = queryset.filter(elevator_available=False)
```

**참고:**

- 경매결과 API에서는 `elevator_available` 값으로 `"O"`, `"X"`, `"Y"`, `"N"` 등을 사용
- 실거래가 API에서는 Boolean (true/false) 사용
- DB 컬럼 타입에 따라 적절히 변환 필요

---

## 🎯 **요청사항**

### **1. 백엔드 API 수정 (`/api/v1/real-transactions/`)**

다음 2개 필터를 백엔드에서 처리하도록 구현 요청:

1. **층확인 필터** (`floor_confirmation`)

   - 콤마 구분 문자열 파싱 (예: `"basement,first_floor"`)
   - `__in` 쿼리로 다중 값 필터링
   - 값이 없으면 필터링 안 함

2. **엘리베이터 필터** (`elevator_available`)
   - Boolean 값 처리 (true/false)
   - DB 컬럼 타입에 맞게 변환
   - 값이 없으면 필터링 안 함

### **2. 테스트 케이스**

#### **층확인 필터 테스트:**

```
GET /api/v1/real-transactions/?sido=서울특별시&sigungu=강남구&floor_confirmation=first_floor
→ 1층 데이터만 반환

GET /api/v1/real-transactions/?sido=서울특별시&sigungu=강남구&floor_confirmation=basement,first_floor
→ 반지하 + 1층 데이터만 반환

GET /api/v1/real-transactions/?sido=서울특별시&sigungu=강남구
→ 모든 층 데이터 반환 (필터 없음)
```

#### **엘리베이터 필터 테스트:**

```
GET /api/v1/real-transactions/?sido=서울특별시&sigungu=강남구&elevator_available=true
→ 엘리베이터 있는 데이터만 반환

GET /api/v1/real-transactions/?sido=서울특별시&sigungu=강남구&elevator_available=false
→ 엘리베이터 없는 데이터만 반환

GET /api/v1/real-transactions/?sido=서울특별시&sigungu=강남구
→ 모든 데이터 반환 (필터 없음)
```

---

## 📊 **참고: 경매결과 API와의 비교**

### **경매결과 API (`/api/v1/auction-completed/`)**

경매결과 API에서는 다음과 같이 동일한 필터가 **정상 작동** 중입니다:

```python
# 층확인 필터 (경매결과 - 정상 작동)
if floor_confirmation:
    floor_values = floor_confirmation.split(',')
    queryset = queryset.filter(floor_confirmation__in=floor_values)

# 엘리베이터 필터 (경매결과 - 정상 작동)
# 경매결과는 "O", "X", "Y", "N" 문자열 사용
if elevator_available:
    elevator_values = elevator_available.split(',')
    queryset = queryset.filter(elevator_available__in=elevator_values)
```

**실거래가 API도 동일한 패턴으로 구현하시면 됩니다.**

단, 엘리베이터 값 형식이 다를 수 있으니 DB 스키마 확인 필요:

- 경매결과: `"O"`, `"X"` (문자열)
- 실거래가: `true`, `false` (Boolean) 또는 다른 형식

---

## 💡 **구현 가이드**

### **1. DB 컬럼 확인**

먼저 `real_transactions` 테이블에서 다음 컬럼을 확인해주세요:

```sql
-- 층확인 컬럼
SELECT DISTINCT floor_confirmation
FROM real_transactions
LIMIT 20;

-- 엘리베이터 컬럼
SELECT DISTINCT elevator_available, typeof(elevator_available)
FROM real_transactions
LIMIT 20;
```

### **2. Django 필터 구현 예시**

```python
# views.py 또는 해당 API 엔드포인트

# 층확인 필터
floor_confirmation = request.GET.get('floor_confirmation', None)
if floor_confirmation:
    floor_values = [v.strip() for v in floor_confirmation.split(',') if v.strip()]
    if floor_values:
        queryset = queryset.filter(floor_confirmation__in=floor_values)

# 엘리베이터 필터
elevator_available = request.GET.get('elevator_available', None)
if elevator_available is not None:
    # Boolean 문자열을 실제 Boolean으로 변환
    if str(elevator_available).lower() in ['true', '1', 'yes']:
        queryset = queryset.filter(elevator_available=True)
    elif str(elevator_available).lower() in ['false', '0', 'no']:
        queryset = queryset.filter(elevator_available=False)
    # 그 외 값은 무시 (전체 표시)
```

---

## 📝 **체크리스트**

구현 완료 후 다음 사항들을 확인해주세요:

- [ ] `floor_confirmation` 파라미터 파싱 및 필터링 구현
- [ ] `elevator_available` 파라미터 파싱 및 필터링 구현
- [ ] 층확인 단일 선택 테스트 (예: `first_floor`)
- [ ] 층확인 복수 선택 테스트 (예: `basement,first_floor`)
- [ ] 엘리베이터 "있음" 필터 테스트
- [ ] 엘리베이터 "없음" 필터 테스트
- [ ] 필터 미적용 시 전체 데이터 반환 확인
- [ ] 다른 필터와의 조합 테스트 (예: 지역 + 층확인 + 엘리베이터)
- [ ] 페이지네이션 정상 작동 확인
- [ ] 정렬과의 조합 테스트

---

## 🔗 **관련 문서**

- 경매결과 필터 구현 완료 보고: `Communication/Backend/receive/Completed/250901_Backend_to_Frontend_auction_ed_필터링_버그수정_긴급_완료보고.md`
- 실거래가 필터 계획: `Doc/RealTransactions/SALE_PLAN.md`
- 프론트엔드 필터 컴포넌트: `Application/components/features/sale/SaleFilter.tsx`

---

## ❓ **질문사항**

구현 중 궁금한 점이 있으시면 언제든지 문의해주세요:

1. DB 컬럼명이 다른 경우
2. 층확인/엘리베이터 값의 형식이 다른 경우
3. 특정 NULL 값 처리 방법
4. 성능 최적화 관련 사항

---

**작성일**: 2025-10-07  
**작성자**: Frontend Team  
**우선순위**: 🔴 긴급 (사용자 기능 영향)  
**예상 소요 시간**: 1-2시간
