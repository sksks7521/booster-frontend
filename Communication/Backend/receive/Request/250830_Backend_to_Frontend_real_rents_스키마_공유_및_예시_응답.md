# [Backend→Frontend] 실거래가(전월세) 스키마 공유 및 예시 응답 제공

## 1) 개요

- **데이터셋**: 실거래가(전월세)
- **테이블 매핑**: `real_rents`
- **목적**: 프론트엔드 연동을 위한 컬럼명/타입/설명 공유 및 샘플 응답 제공

참고: SQL 타입 → API(JSON) 타입 매핑

- Integer → number (integer)
- Float → number
- Boolean → boolean
- String/Text → string
- Date/DateTime → string (ISO: yyyy-mm-dd 또는 ISO8601)

## 2) 스키마 요약 (컬럼/타입/설명)

### A. 기본 키/메타

- **id** (Integer → integer): 고유 식별자
- **created_at** (DateTime → string): 데이터 생성일시(ISO)

### B. 실거래 기본 정보

- **sido** (String(50) → string): (Real_price)광역시도
- **sigungu** (String(100) → string): (Real_price)시군구
- **road_address_real** (String(300) → string): (Real_price)도로명주소
- **building_name_real** (String(200) → string): (Real_price)건물명
- **construction_year_real** (Integer → integer): (Real_price)건축연도
- **exclusive_area_sqm** (Float → number): (Real_price)전용면적(㎡)

### C. 전월세 구분/계약 정보(핵심)

- **rent_type** (String(20) → string): (Real_price)전월세구분 (전세/월세)
- **contract_type** (String(20) → string): (Real_price)계약구분 (신규/갱신)
- **contract_year** (Integer → integer): (Real*price)계약*연도
- **contract_month** (Integer → integer): (Real*price)계약*월
- **contract_day** (Integer → integer): (Real*price)계약*일
- **contract_date** (Date → string): 계약일(yyyy-mm-dd)
- **floor_info_real** (String(50) → string): (Real_price)층

### D. 계약 기간 상세

- **contract_period** (String(100) → string): (Real_price)계약기간 (예: 202503~202702)
- **contract_start_date** (Date → string): (Real_price)계약시작년월
- **contract_end_date** (Date → string): (Real_price)계약종료년월
- **contract_period_years** (Float → number): (Real_price)계약기간(년)

### E. 금액(핵심)

- **deposit_amount** (Integer → integer): (Real_price)보증금(만원)
- **monthly_rent** (Integer → integer): (Real_price)월세금(만원)

### F. 갱신 비교

- **previous_deposit** (Integer → integer): (Real*price)종전계약*보증금(만원)
- **previous_monthly_rent** (Integer → integer): (Real*price)종전계약*월세금(만원)
- **deposit_change_amount** (Integer → integer): (Real*price)보증금*갱신금액차이(만원)
- **rent_change_amount** (Integer → integer): (Real*price)월세금*갱신금액차이(만원)
- **deposit_change_ratio** (Float → number): (Real*price)보증금*갱신금액차이(%)
- **rent_change_ratio** (Float → number): (Real*price)월세금*갱신금액차이(%)

### G. 전월세 전환

- **jeonse_conversion_amount** (Integer → integer): (Real_price)전월세전환금(5%)(만원)

### H. 주소/좌표/행정

- **road_address** (String(300) → string): 도로명주소
- **sido_admin** (String(50) → string): 시도
- **latitude** (Float → number): y좌표(위도)
- **longitude** (Float → number): x좌표(경도)
- **building_registry_pk** (String(100) → string): 관리*상위*건축물대장\_PK
- **admin_code** (String(20) → string): h_code(행정코드)
- **legal_code** (String(20) → string): b_code(법정코드)
- **jibun_address** (String(300) → string): 지번주소
- **legal_dong_unit** (String(100) → string): 법정동단위
- **admin_dong_name** (String(100) → string): 행정동명칭
- **postal_code** (String(10) → string): 우편번호
- **pnu** (String(50) → string): PNU(토지고유번호)
- **building_name** (String(200) → string): 건물명
- **dong_name** (String(100) → string): 동명

### I-1. 주소 필드 정규화 안내

- 빈 문자열/공백/하이픈("", " ", "-")은 API에서 `null`로 정규화됩니다.

### I. 건축물 상세/편의

- **land_area_sqm** (Float → number): 대지면적(㎡)
- **construction_area_sqm** (Float → number): 건축면적(㎡)
- **total_floor_area_sqm** (Float → number): 연면적(㎡)
- **building_coverage_ratio** (Float → number): 건폐율(%)
- **floor_area_ratio** (Float → number): 용적률(%)
- **main_structure** (String(100) → string): 주구조
- **main_usage** (String(100) → string): 주용도
- **other_usage** (String(200) → string): 기타용도
- **building_height** (Float → number): 높이
- **ground_floors** (Integer → integer): 지상층수
- **basement_floors** (Integer → integer): 지하층수
- **household_count** (Integer → integer): 세대수
- **family_count** (Integer → integer): 가구수
- **room_number** (String(50) → string): 호수
- **usage_approval_date** (Date → string): 사용승인일
- **elevator_count** (Integer → integer): 승용승강기(대)
- **floor_confirmation** (Boolean → boolean): 층확인 여부 (문자 표기 Y/N/예/아니오 → boolean 정규화)
- **elevator_available** (Boolean → boolean): 엘리베이터 여부 (문자 표기 O/X/Y/N/true/false → boolean 정규화)
- **admin_dong** (String(100) → string): 행정동

### J. 계산된 필드(참고)

- **exclusive_area_pyeong** (Float → number): 전용면적(평) - 계산값
- **deposit_per_pyeong** (Float → number): 평당 보증금(만원) - 계산값
- **monthly_rent_per_pyeong** (Float → number): 평당 월세(만원) - 계산값
- **rental_yield_monthly** (Float → number): 월 임대수익률(%) - 계산값
- **rental_yield_annual** (Float → number): 연 임대수익률(%) - 계산값

## 3) 샘플 응답(JSON, 1건)

```json
{
  "id": 65432,
  "sido": "서울특별시",
  "sigungu": "송파구",
  "road_address_real": "서울특별시 송파구 위례성대로 321",
  "building_name_real": "위례센트럴힐",
  "construction_year_real": 2012,
  "exclusive_area_sqm": 59.9,

  "rent_type": "월세",
  "contract_type": "신규",
  "contract_year": 2024,
  "contract_month": 11,
  "contract_day": 5,
  "contract_date": "2024-11-05",
  "floor_info_real": "15",

  "contract_period": "202411~202611",
  "contract_start_date": "2024-11-01",
  "contract_end_date": "2026-11-01",
  "contract_period_years": 2.0,

  "deposit_amount": 5000,
  "monthly_rent": 120,

  "previous_deposit": 4500,
  "previous_monthly_rent": 110,
  "deposit_change_amount": 500,
  "rent_change_amount": 10,
  "deposit_change_ratio": 11.11,
  "rent_change_ratio": 9.09,

  "jeonse_conversion_amount": 6000,

  "road_address": "서울특별시 송파구 위례성대로 321",
  "sido_admin": "서울특별시",
  "latitude": 37.4872,
  "longitude": 127.1223,
  "building_registry_pk": "RGST-2012-000065432",
  "admin_code": "11710101",
  "legal_code": "1171010100",
  "jibun_address": "서울특별시 송파구 잠실동 321-7",
  "legal_dong_unit": "잠실동",
  "admin_dong_name": "잠실본동",
  "postal_code": "05544",
  "pnu": "1171010100-65432",
  "building_name": "위례센트럴힐",
  "dong_name": "잠실동",

  "land_area_sqm": 85.0,
  "construction_area_sqm": 110.0,
  "total_floor_area_sqm": 160.0,
  "building_coverage_ratio": 60.0,
  "floor_area_ratio": 220.0,
  "main_structure": "철근콘크리트",
  "main_usage": "공동주택",
  "other_usage": null,
  "building_height": 48.0,
  "ground_floors": 20,
  "basement_floors": 3,
  "household_count": 300,
  "family_count": 300,
  "room_number": "1503",
  "usage_approval_date": "2012-09-15",
  "elevator_count": 4,
  "floor_confirmation": true,
  "elevator_available": true,
  "admin_dong": "잠실본동",

  "exclusive_area_pyeong": 18.12,
  "deposit_per_pyeong": 275.9,
  "monthly_rent_per_pyeong": 6.62,
  "rental_yield_monthly": 2.1,
  "rental_yield_annual": 25.2,

  "created_at": "2025-08-06T09:35:00+09:00"
}
```

## 4) 연동 참고 (엔드포인트 예)

- 목록: `GET /api/v1/real-rents/`
- 간소: `GET /api/v1/real-rents/simple`
- 전체: `GET /api/v1/real-rents/full`
- 커스텀: `POST /api/v1/real-rents/custom`

필요 시 camelCase 키 변환, 파생 필드(㎡↔평, 전월세전환가 등)도 협의 후 제공하겠습니다.

## 5) 확인 요청 사항

- 노출 컬럼 및 네이밍(camelCase) 합의
- 기본 정렬/페이징 정책
- 파생값 필요 여부
