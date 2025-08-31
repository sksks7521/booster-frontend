# [Backend→Frontend] 실거래가(매매) 스키마 공유 및 예시 응답 제공

## 1) 개요

- **데이터셋**: 실거래가(매매)
- **테이블 매핑**: `real_transactions`
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
- **created_at** (DateTime → string): 생성 시각(ISO)

### B. Real_price 기본 지역/주소

- **sido** (String(50) → string): (Real_price)광역시도
- **sigungu** (String(100) → string): (Real_price)시군구
- **road_address_real** (String(300) → string): (Real_price)도로명주소
- **building_name_real** (String(200) → string): (Real_price)건물명

### C. 면적(Real_price)

- **exclusive_area_sqm** (Float → number): (Real_price)전용면적(㎡)
- **exclusive_area_range** (String(100) → string): (Real_price)전용면적(㎡)\_Range
- **land_rights_area_sqm** (Float → number): (Real_price)대지권면적(㎡)

### D. 거래 정보(핵심)

- **contract_year** (Integer → integer): (Real*price)계약*연도
- **contract_month** (Integer → integer): (Real*price)계약*월
- **contract_day** (Integer → integer): (Real*price)계약*일
- **contract_date** (Date → string): 계약일(yyyy-mm-dd)
- **transaction_amount** (Integer → integer): (Real_price)거래금액(만원)
- **price_per_pyeong** (Float → number): (Real_price)평단가(만원)

### E. 건물/연식/층(Real_price)

- **floor_info_real** (String(50) → string): (Real_price)층
- **construction_year_real** (Integer → integer): (Real_price)건축연도
- **construction_year_range** (String(100) → string): (Real_price)건축연도\_Range

### F. 거래 유형

- **transaction_type** (String(50) → string): 거래유형 (중개거래, 직거래 등)
- **buyer_type** (String → string): 매수자
- **seller_type** (String → string): 매도자

### G. 좌표

- **longitude** (Float → number): x좌표(경도)
- **latitude** (Float → number): y좌표(위도)

### H. 추가 주소/행정/식별

- **road_address** (String(300) → string): 도로명주소
- **sido_admin** (String(50) → string): 시도
- **building_registry_pk** (String(100) → string): 관리*상위*건축물대장\_PK
- **admin_code** (String(20) → string): h_code(행정코드)
- **legal_code** (String(20) → string): b_code(법정코드)
- **jibun_address** (String(300) → string): 지번주소
- **postal_code** (String(10) → string): 우편번호
- **pnu** (String(50) → string): PNU(토지고유번호)
- **building_name** (String(200) → string): 건물명
- **dong_name** (String(100) → string): 동명
- **legal_dong_unit** (String(100) → string): 법정동단위
- **admin_dong_name** (String(100) → string): 행정동명칭
- **admin_dong** (String(100) → string): 행정동

### I. 건축물 상세

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
- **construction_year** (Integer → integer): 건축연도(추가)
- **floor_confirmation** (String(100) → string): 층확인
- **elevator_available** (String(2) → string): Elevator여부 (O/X)

### J. 계산(파생) 필드

- **exclusive_area_pyeong** (Float → number): 전용면적(평) - 계산값
- **price_per_sqm** (Float → number): ㎡당 가격(만원) - 계산값

## 3) 샘플 응답(JSON, 1건)

```json
{
  "id": 98765,
  "sido": "서울특별시",
  "sigungu": "영등포구",
  "road_address_real": "서울특별시 영등포구 국회대로 123",
  "building_name_real": "한강뷰리버하우스",

  "exclusive_area_sqm": 49.5,
  "exclusive_area_range": "33~49.5",
  "land_rights_area_sqm": 12.3,

  "contract_year": 2024,
  "contract_month": 5,
  "contract_day": 21,
  "contract_date": "2024-05-21",
  "transaction_amount": 38500,
  "price_per_pyeong": 2100.0,

  "floor_info_real": "12",
  "construction_year_real": 2007,
  "construction_year_range": "2005~2010",

  "transaction_type": "중개거래",
  "buyer_type": "개인",
  "seller_type": "개인",

  "road_address": "서울특별시 영등포구 국회대로 123",
  "sido_admin": "서울특별시",
  "building_registry_pk": "RGST-2007-000012345",
  "admin_code": "11560000",
  "legal_code": "1156010100",
  "jibun_address": "서울특별시 영등포구 여의도동 123-4",
  "postal_code": "07238",
  "pnu": "1156010100-1234",
  "building_name": "한강뷰리버하우스",
  "dong_name": "여의도동",
  "legal_dong_unit": "여의도동",
  "admin_dong_name": "여의동",
  "admin_dong": "여의동",

  "longitude": 126.9143,
  "latitude": 37.5284,

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
  "household_count": 50,
  "family_count": 50,
  "room_number": "1201",
  "usage_approval_date": "2007-09-15",
  "elevator_count": 2,
  "construction_year": 2007,
  "floor_confirmation": "등기상 12층",
  "elevator_available": "O",

  "exclusive_area_pyeong": 15.0,
  "price_per_sqm": 706.8,

  "created_at": "2025-08-06T09:35:00+09:00"
}
```

## 4) 연동 참고 (엔드포인트 예)

- 목록: `GET /api/v1/real-transactions/`
- 간소: `GET /api/v1/real-transactions/simple`
- 전체: `GET /api/v1/real-transactions/full`
- 커스텀: `POST /api/v1/real-transactions/custom`

참고: 빈 문자열/공백/하이픈("", " ", "-")은 API에서 `null`로 정규화됩니다.

필요 시 camelCase 키 변환, 추가 파생 필드(㎡↔평 환산, ㎡당 가격 등)도 협의 후 제공하겠습니다.

## 5) 확인 요청 사항

- 노출 컬럼 및 네이밍(camelCase) 합의
- 기본 정렬/페이징 정책
- 파생값 필요 여부
