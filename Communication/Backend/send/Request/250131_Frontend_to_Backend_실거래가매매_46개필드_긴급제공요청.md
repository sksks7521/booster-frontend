# [Frontend→Backend] 실거래가(매매) 46개 필드 긴급 제공 요청

## 🚨 **긴급 상황**

- **날짜**: 2025-01-31
- **우선순위**: **최고 긴급** (사용자 경험 심각한 저하)
- **영향도**: **전체 실거래가(매매) 기능 80% 데이터 누락**

## 🔍 **문제 현황 분석**

### **현재 API 응답 상태**

```
엔드포인트: /api/v1/real-transactions/
실제 제공 필드: 11개
스키마 정의 필드: 57개
누락 필드: 46개 (80% 데이터 누락!)
```

### **실제 제공되는 11개 필드**

✅ **현재 정상 제공 중:**

```json
{
  "id": 1813174,
  "sido": "서울특별시",
  "sigungu": "서울특별시 강동구",
  "road_address_real": "서울특별시 강동구 천중로 122",
  "building_name_real": "동원빌라(214-1)",
  "transaction_amount": 32100,
  "price_per_pyeong": 1892,
  "contract_year": 2025,
  "contract_month": 7,
  "exclusive_area_sqm": 55.97,
  "construction_year_real": null
}
```

### **누락된 46개 핵심 필드**

❌ **현재 누락되어 "-" 표시:**

#### **A. 기본 메타 정보 (1개)**

- `created_at` - 등록일시

#### **B. 면적 정보 (2개)**

- `exclusive_area_range` - 전용면적 범위
- `land_rights_area_sqm` - 대지권면적(㎡)

#### **C. 거래 정보 (2개)**

- `contract_day` - 계약일
- `contract_date` - 계약일 전체

#### **D. 건물/연식 정보 (2개)**

- `floor_info_real` - 층 정보
- `construction_year_range` - 건축연도 범위

#### **E. 거래 유형 (3개)**

- `transaction_type` - 거래유형 (중개거래/직거래)
- `buyer_type` - 매수자 유형
- `seller_type` - 매도자 유형

#### **F. 좌표 정보 (2개)**

- `longitude` - 경도
- `latitude` - 위도

#### **G. 추가 주소/행정 정보 (11개)**

- `road_address` - 도로명주소
- `sido_admin` - 시도 (행정)
- `building_registry_pk` - 건축물대장PK
- `admin_code` - 행정코드
- `legal_code` - 법정코드
- `jibun_address` - 지번주소
- `postal_code` - 우편번호
- `pnu` - PNU
- `building_name` - 건물명
- `dong_name` - 동명
- `legal_dong_unit` - 법정동단위
- `admin_dong_name` - 행정동명칭
- `admin_dong` - 행정동

#### **H. 건축물 상세 정보 (21개)**

- `land_area_sqm` - 대지면적(㎡)
- `construction_area_sqm` - 건축면적(㎡)
- `total_floor_area_sqm` - 연면적(㎡)
- `building_coverage_ratio` - 건폐율(%)
- `floor_area_ratio` - 용적률(%)
- `main_structure` - 주구조
- `main_usage` - 주용도
- `other_usage` - 기타용도
- `building_height` - 높이
- `ground_floors` - 지상층수
- `basement_floors` - 지하층수
- `household_count` - 세대수
- `family_count` - 가구수
- `room_number` - 호수
- `usage_approval_date` - 사용승인일
- `elevator_count` - 승용승강기(대)
- `construction_year` - 건축연도(추가)
- `floor_confirmation` - 층확인
- `elevator_available` - 엘리베이터여부

#### **I. 계산(파생) 필드 (2개)**

- `exclusive_area_pyeong` - 전용면적(평)
- `price_per_sqm` - ㎡당 가격(만원)

## 🎯 **해결 요청 사항**

### **1단계: 즉시 수정 (1일 이내)**

**백엔드 `/api/v1/real-transactions/` 엔드포인트에서 위의 46개 필드를 모두 포함하여 응답하도록 수정**

### **2단계: 데이터 검증 (수정 후 즉시)**

```bash
# 테스트 API 호출
GET /api/v1/real-transactions/?page=1&size=1

# 기대 응답 형식
{
  "items": [
    {
      "id": 1813174,
      "created_at": "2025-01-30T10:30:00+09:00",
      "sido": "서울특별시",
      "sigungu": "서울특별시 강동구",
      "road_address_real": "서울특별시 강동구 천중로 122",
      "building_name_real": "동원빌라(214-1)",
      "exclusive_area_sqm": 55.97,
      "exclusive_area_range": "49.5~66.0",
      "land_rights_area_sqm": 15.2,
      "contract_year": 2025,
      "contract_month": 7,
      "contract_day": 15,
      "contract_date": "2025-07-15",
      "transaction_amount": 32100,
      "price_per_pyeong": 1892,
      "floor_info_real": "3/5층",
      "construction_year_real": 1998,
      "construction_year_range": "1995~2000",
      "transaction_type": "중개거래",
      "buyer_type": "개인",
      "seller_type": "개인",
      "longitude": 127.1234,
      "latitude": 37.5678,
      // ... 나머지 46개 필드 모두 포함
    }
  ],
  "total_items": 726423
}
```

## ⚡ **비즈니스 임팩트**

### **현재 문제**

- **사용자 경험**: 80% 컬럼이 "-" 표시로 **극도로 불완전한 정보 제공**
- **기능 제약**: 거래유형, 층수, 건축정보, 좌표 등 **핵심 분석 기능 완전 마비**
- **경쟁력**: 타 부동산 플랫폼 대비 **압도적으로 부족한 정보**

### **수정 후 효과**

- **완전한 거래 정보 제공**: 거래유형, 매수/매도자, 상세 건축정보
- **정확한 지도 표시**: 경위도 좌표를 통한 정확한 위치 표시
- **고급 필터링**: 층수, 건축연도, 구조 등 상세 조건 검색
- **투자 분석 고도화**: 건폐율, 용적률, 면적정보 등 투자 판단 자료

## 🔧 **기술적 요청사항**

### **1. 백엔드 수정**

```python
# real_transactions 모델의 모든 필드를 API 응답에 포함
# 현재: 11개 필드만 serialize
# 요청: 스키마에 정의된 57개 필드 모두 serialize
```

### **2. 데이터베이스 확인**

- **DB에 데이터가 있는지 확인**: `SELECT COUNT(*) WHERE field IS NOT NULL`
- **없는 필드들은 우선 `null`로 응답**: 프론트엔드에서 "-" 표시 처리 가능
- **향후 데이터 수집 계획 공유**: 언제까지 실제 데이터 제공 가능한지

### **3. 응답 형식 유지**

```json
{
  "items": [...],           // ← 기존과 동일
  "total_items": 726423     // ← 기존과 동일
}
```

## 📅 **완료 일정**

- **즉시 작업 시작**: 2025-01-31 오늘 중
- **1차 수정 완료**: 2025-02-01 오전 중 (내일 오전)
- **테스트 및 검증**: 2025-02-01 오후
- **프로덕션 배포**: 2025-02-01 저녁

## 🤝 **협업 요청**

### **백엔드팀 요청**

1. **즉시 응답**: 수정 가능 여부 및 예상 시간
2. **진행 상황 공유**: 30분마다 진행 상황 업데이트
3. **테스트 협조**: 수정 후 API 응답 샘플 공유

### **프론트엔드 준비**

- ✅ **어댑터 준비 완료**: 57개 필드 매핑 코드 이미 구현됨
- ✅ **컬럼 정의 완료**: 테이블 컬럼 54개 이미 설정됨
- ✅ **테스트 환경 준비**: 즉시 검증 가능

## 🔥 **최종 요청**

**백엔드팀께서 `/api/v1/real-transactions/` API가 위의 46개 필드를 모두 포함하여 응답하도록 긴급 수정해주시기 바랍니다.**

**현재 11개 → 57개 필드로 확장하여 완전한 실거래가(매매) 서비스를 제공할 수 있도록 도와주세요!**

---

**문의 사항이 있으시면 즉시 연락 부탁드립니다.**
