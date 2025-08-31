# 전체 데이터셋 통합 긴급 수정 요청 (FINAL)

## 📋 **요청 정보**

- **날짜**: 2025-01-31
- **요청자**: Frontend Team
- **대상 API**: `/api/v1/auction-completed/`, `/api/v1/real-transactions/`, `/api/v1/real-rents/`
- **우선순위**: 최고 (사용자 경험 심각한 저하)
- **통합 발송**: 모든 데이터셋 문제 일괄 해결 요청

---

## 🚨 **핵심 문제 요약**

### **현재 상황**

- **과거경매결과**: 44개 컬럼 중 **30개 컬럼이 "-"** 표시 (68% 데이터 누락)
- **실거래가(매매)**: 54개 컬럼 중 **37개 컬럼이 null** (69% 데이터 누락)
- **실거래가(전월세)**: 59개 컬럼 중 **35개 컬럼이 null** (59% 데이터 누락)

### **사용자 임팩트**

- **전체 데이터셋에서 60-70% 컬럼이 빈 값**으로 표시되어 **극도로 불완전한 정보** 제공
- **투자 분석, 시장 동향 파악, 물건 상세 정보 확인** 등 핵심 기능 **심각한 제약**
- **사용자 만족도 급격한 저하** 및 **서비스 신뢰도 손상**

---

## 📊 **데이터셋별 상세 문제 분석**

### **1️⃣ 과거경매결과 (auction_ed)**

#### ✅ **정상 제공되는 14개 필드**

```
기본정보: 용도, 사건번호, 현재상태, 매각기일, 도로명주소, 주소(시군구), 시도
가격정보: 감정가(만원), 매각가(만원), 매각가/감정가(%), 응찰인원(명)
면적정보: 건물평형(평), 토지평형(평)
좌표정보: 위도, 경도
```

#### ❌ **null로 제공되는 30개 필드** (스키마에는 정의되어 있음)

##### **고우선순위 (12개) - 즉시 수정 필요**

```
상세주소: 주소(구역), 소재지(동), 소재지(주택이름), 소재지, 읍면동
가격정보: 최저가(만원), 최저가/감정가(%)
건축물기본: 대지면적(㎡), 건축면적(㎡), 연면적(㎡), 건축연도
편의시설: 엘리베이터 여부
```

##### **중우선순위 (18개) - 단계별 수정**

```
건축물상세: 건폐율(%), 용적률(%), 주구조, 주용도, 기타용도, 높이, 지상층수, 지하층수
편의시설: 승용승강기(대), 세대수, 층수, 층확인
기타정보: 사용승인일, 특수권리, 우편번호, PNU
행정정보: 행정동명칭
```

### **2️⃣ 실거래가(매매) (real_transactions)**

#### ✅ **정상 제공되는 17개 필드**

```
기본정보: id, created_at, sido, sigungu, road_address_real, building_name_real
면적정보: exclusive_area_sqm, exclusive_area_range, land_rights_area_sqm
거래정보: contract_year, contract_month, contract_day, transaction_amount, price_per_pyeong
건축정보: floor_info_real, construction_year_real, construction_year_range
좌표정보: longitude, latitude
```

#### ❌ **null로 제공되는 37개 필드** (스키마에는 정의되어 있음)

##### **고우선순위 (15개) - 즉시 수정 필요**

```
거래유형: transaction_type, buyer_type, seller_type
상세주소: road_address, jibun_address, postal_code, pnu
건축물기본: land_area_sqm, construction_area_sqm, main_structure, main_usage
편의시설: elevator_count, elevator_available, floor_confirmation
계산필드: exclusive_area_pyeong, price_per_sqm
```

##### **중우선순위 (15개) - 단계별 수정**

```
행정정보: sido_admin, building_registry_pk, admin_code, legal_code, admin_dong_name
건축물상세: total_floor_area_sqm, building_coverage_ratio, floor_area_ratio,
          other_usage, building_height, ground_floors, basement_floors
기타정보: building_name, dong_name, legal_dong_unit
```

##### **저우선순위 (7개) - 향후 고려**

```
household_count, family_count, room_number, usage_approval_date,
construction_year, admin_dong, contract_date
```

### **3️⃣ 실거래가(전월세) (real_rents)**

#### ✅ **정상 제공되는 24개 필드**

```
기본정보: id, created_at, sido, sigungu, road_address_real, building_name_real
거래정보: contract_year, contract_month, contract_day, deposit_amount, monthly_rent
면적정보: exclusive_area_sqm, exclusive_area_range
건축정보: floor_info_real, construction_year_real, construction_year_range
기타정보: rental_type, contract_period, contract_renewal_option
좌표정보: longitude, latitude
```

#### ❌ **null로 제공되는 35개 필드** (스키마에는 정의되어 있음)

##### **고우선순위 (15개) - 즉시 수정 필요**

```
상세주소: jibun_address, postal_code, pnu, admin_dong_name, legal_dong_unit
건축물기본: land_area_sqm, construction_area_sqm, total_floor_area_sqm,
          building_coverage_ratio, floor_area_ratio, ground_floors, basement_floors
편의시설: elevator_available, elevator_count, floor_confirmation
계산필드: exclusive_area_pyeong, deposit_per_pyeong
```

##### **중우선순위 (15개) - 단계별 수정**

```
건축상세: main_structure, main_usage, other_usage, building_height, household_count
기타정보: family_count, room_number, usage_approval_date
행정코드: building_registry_pk, admin_code, legal_code
계산필드: monthly_rent_per_pyeong, rental_yield_monthly, rental_yield_annual
```

##### **저우선순위 (5개) - 향후 고려**

```
road_address, sido_admin, building_name, dong_name, admin_dong
```

---

## 🎯 **통합 요청 사항**

### **Phase 1 (1주일 내) - 고우선순위 필드 수정**

#### **공통 필수 필드 (모든 데이터셋)**

```sql
-- 상세 주소/행정 정보
jibun_address, postal_code, pnu, admin_dong_name, legal_dong_unit

-- 건축물 기본 정보
land_area_sqm, construction_area_sqm, total_floor_area_sqm,
building_coverage_ratio, floor_area_ratio, ground_floors, basement_floors

-- 편의시설 정보
elevator_available, elevator_count, floor_confirmation

-- 계산된 필드
exclusive_area_pyeong (= exclusive_area_sqm / 3.3058)
```

#### **데이터셋별 특화 필드**

**과거경매결과 추가:**

```sql
-- 가격 정보
minimum_bid_price, bid_to_appraised_ratio

-- 위치 정보
address_area, location_detail, building_name, general_location, eup_myeon_dong
```

**실거래가(매매) 추가:**

```sql
-- 거래 당사자
transaction_type, buyer_type, seller_type

-- 건축 정보
main_structure, main_usage, construction_year

-- 계산 필드
price_per_sqm (= transaction_amount / exclusive_area_sqm)
```

**실거래가(전월세) 추가:**

```sql
-- 임대 수익률
deposit_per_pyeong (= deposit_amount / exclusive_area_pyeong)
monthly_rent_per_pyeong (= monthly_rent / exclusive_area_pyeong)
rental_yield_monthly (= monthly_rent / deposit_amount * 100)
rental_yield_annual (= rental_yield_monthly * 12)
```

### **Phase 2 (2주일 내) - 중우선순위 필드 수정**

```sql
-- 건축물 상세 정보
main_structure, main_usage, other_usage, building_height, household_count

-- 행정 코드 매핑
building_registry_pk, admin_code, legal_code, sido_admin

-- 기타 상세 정보
family_count, room_number, usage_approval_date, special_rights
```

### **Phase 3 (3주일 내) - 저우선순위 필드 수정**

```sql
-- 나머지 필드들 및 데이터 품질 개선
-- 전체 데이터 일관성 검증
-- 성능 최적화
```

---

## 🔧 **구현 가이드**

### **데이터 소스 매핑**

#### **건축물대장 정보 조인**

```sql
SELECT
  br.land_area_sqm,          -- 대지면적
  br.construction_area_sqm,   -- 건축면적
  br.total_floor_area_sqm,   -- 연면적
  br.building_coverage_ratio, -- 건폐율
  br.floor_area_ratio,       -- 용적률
  br.main_structure,         -- 주구조
  br.main_usage,            -- 주용도
  br.ground_floors,         -- 지상층수
  br.basement_floors,       -- 지하층수
  br.elevator_count,        -- 승강기수
  br.household_count,       -- 세대수
  br.construction_year,     -- 건축연도
  br.usage_approval_date    -- 사용승인일
FROM building_registry br
WHERE br.pnu = [target_table].pnu;
```

#### **행정구역 정보 조인**

```sql
SELECT
  ad.postal_code,           -- 우편번호
  ad.admin_dong_name,       -- 행정동명
  ad.legal_dong_unit,       -- 법정동단위
  ad.jibun_address         -- 지번주소
FROM administrative_district ad
WHERE ad.code = [target_table].admin_code;
```

#### **거래 당사자 정보 조인 (매매 전용)**

```sql
SELECT
  td.buyer_type,            -- 매수자유형
  td.seller_type,          -- 매도자유형
  td.transaction_type      -- 거래유형
FROM transaction_details td
WHERE td.transaction_id = real_transactions.id;
```

### **계산된 필드 로직**

```python
# 공통 계산 필드
exclusive_area_pyeong = exclusive_area_sqm / 3.3058

# 매매 전용
price_per_sqm = transaction_amount / exclusive_area_sqm

# 전월세 전용
deposit_per_pyeong = deposit_amount / exclusive_area_pyeong
monthly_rent_per_pyeong = monthly_rent / exclusive_area_pyeong

if deposit_amount > 0:
    rental_yield_monthly = (monthly_rent / deposit_amount) * 100
    rental_yield_annual = rental_yield_monthly * 12

# 경매 전용
if appraised_value > 0:
    bid_to_appraised_ratio = (minimum_bid_price / appraised_value) * 100
    sale_to_appraised_ratio = (final_sale_price / appraised_value) * 100
```

---

## ✅ **검증 방법**

### **API 응답 확인**

```bash
# 각 데이터셋별 샘플 확인
curl "http://127.0.0.1:8000/api/v1/auction-completed/?page=1&size=3"
curl "http://127.0.0.1:8000/api/v1/real-transactions/?page=1&size=3"
curl "http://127.0.0.1:8000/api/v1/real-rents/?page=1&size=3"
```

### **데이터 품질 기준**

- **null 값 비율**: 각 데이터셋별 **10% 이하**로 감소 목표
- **필수 필드 완성도**: 고우선순위 필드 **95% 이상** 실제 데이터 제공
- **계산 필드 정확성**: 수치 계산 결과 **100% 정확성** 보장

### **프론트엔드 테스트 체크리스트**

#### **과거경매결과**

- [ ] 주소(구역), 소재지(동), 건물명 실제 데이터 표시
- [ ] 최저가, 최저가/감정가(%) 실제 수치 표시
- [ ] 건축연도, 엘리베이터 여부 실제 정보 표시

#### **실거래가(매매)**

- [ ] 매수자/매도자 유형 실제 데이터 표시
- [ ] 지번주소, PNU, 우편번호 실제 정보 표시
- [ ] 건축연도, 구조, 용도 실제 데이터 표시
- [ ] 평수, ㎡당 단가 정확한 계산 결과 표시

#### **실거래가(전월세)**

- [ ] 지번주소, 행정동명 실제 데이터 표시
- [ ] 건축물 면적, 층수 정보 실제 데이터 표시
- [ ] 평당 보증금/월세, 수익률 정확한 계산 결과 표시

---

## 🚨 **긴급 처리 요청 사유**

### **비즈니스 임팩트**

1. **사용자 이탈 위험**: 현재 60-70% 빈 데이터로 인한 **극도로 불완전한 서비스**
2. **경쟁력 저하**: 타 부동산 플랫폼 대비 **현저히 부족한 정보 제공**
3. **신뢰도 손상**: **"-" 표시 남발**로 인한 **서비스 품질 의심**

### **기술적 임팩트**

1. **스키마 불일치**: 정의된 필드와 실제 API 응답의 **심각한 괴리**
2. **데이터 무결성**: 핵심 비즈니스 로직에 필요한 **필수 데이터 부족**
3. **확장성 제약**: 향후 고도화 기능 개발에 **근본적 제약**

### **사용자 경험 임팩트**

1. **투자 분석 불가**: 건축연도, 구조, 편의시설 등 **핵심 투자 판단 정보 부족**
2. **시장 동향 파악 불가**: 거래 당사자, 지역별 상세 정보 **분석 기능 제약**
3. **물건 비교 불가**: **대부분 컬럼이 빈 값**으로 **의미있는 비교 분석 불가능**

---

## 📞 **연락 및 후속 조치**

### **연락처**

- **Frontend Team**
- **긴급 연락**: 수정 진행 상황 **실시간 공유** 요청

### **검증 일정**

- **Phase 1 완료 후**: **24시간 내** 프론트엔드 검증 완료
- **Phase 2 완료 후**: **48시간 내** 전체 기능 테스트 완료
- **Phase 3 완료 후**: **1주일 내** 성능 및 안정성 검증 완료

### **성공 기준**

- **각 데이터셋별 null 필드 비율 10% 이하** 달성
- **사용자 핵심 기능 (투자 분석, 물건 비교, 시장 동향)** 정상 작동
- **프론트엔드 테이블에서 "-" 표시 90% 이상 감소**

---

## 📋 **요청서 통합 정리**

이 문서는 다음 개별 요청서들을 **통합하여 일괄 처리**를 요청합니다:

1. ~~`250131_Frontend_to_Backend_auction_ed_API_응답필드_확장_요청.md`~~ (삭제됨)
2. `250131_Frontend_to_Backend_real_transactions_API_응답필드_확장_요청.md`
3. `250131_Frontend_to_Backend_real_transactions_데이터_누락_긴급수정요청.md`
4. `250131_Frontend_to_Backend_real_rents_API_응답필드_확장_요청.md`
5. ~~`250131_Frontend_to_Backend_전체데이터셋_종합문제_긴급수정요청_v2.md`~~ (대체됨)

**본 통합 요청서로 모든 데이터셋 문제를 일괄 해결**하여 **사용자 경험 정상화** 및 **서비스 품질 향상**을 달성하고자 합니다.

---

**최종 수정일**: 2025-01-31  
**문서 버전**: FINAL  
**처리 우선순위**: 최고 (긴급)
