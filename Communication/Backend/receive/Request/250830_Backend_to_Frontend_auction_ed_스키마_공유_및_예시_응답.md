# [Backend→Frontend] 과거경매결과(auction_ed) 스키마 공유 및 예시 응답 제공

## 1) 개요

- **데이터셋**: 과거경매결과(auction_ed)
- **테이블 매핑**: `auction_completed`
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

### B. 기본 정보

- **usage** (String(100) → string): 용도
- **case_number** (String(100) → string): 사건번호
- **case_year** (Integer → integer): 사건년도
- **current_status** (String(50) → string): 현재상태
- **sale_date** (Date → string): 매각기일 (yyyy-mm-dd)
- **sale_year** (Integer → integer): 매각년도

### C. 주소/위치

- **road_address** (String(300) → string): 도로명주소
- **road_address_converted** (String(300) → string): 도로명주소(변환)
- **address_area** (String(200) → string): 주소(구역)
- **address_city** (String(100) → string): 주소(시군구)
- **location_detail** (String(200) → string): 소재지(동)
- **building_name** (String(200) → string): 소재지(주택이름)
- **general_location** (String(300) → string): 소재지
- **sido** (String(50) → string): 시도
- **eup_myeon_dong** (String(100) → string): 읍면동

### D. 경매 가격(핵심)

- **appraised_value** (Integer → integer): 감정가(만원)
- **minimum_bid_price** (Integer → integer): 최저가(만원)
- **bid_to_appraised_ratio** (Float → number): 최저가/감정가(%)
- **final_sale_price** (Float → number): 매각가(만원)
- **sale_to_appraised_ratio** (Float → number): 매각가/감정가(%)
- **bidder_count** (Integer → integer): 응찰인원(명)

### E. 면적

- **building_area_pyeong** (Float → number): 건물평형(평)
- **building_area_range** (String(100) → string): 건물평형(범위)
- **land_area_pyeong** (Float → number): 토지평형(평)
- **land_area_sqm** (Float → number): 대지면적(㎡)
- **construction_area_sqm** (Float → number): 건축면적(㎡)
- **total_floor_area_sqm** (Float → number): 연면적(㎡)

### F. 건물 상세

- **building_coverage_ratio** (Float → number): 건폐율(%)
- **floor_area_ratio** (Float → number): 용적률(%)
- **main_structure** (String(100) → string): 주구조
- **main_usage** (String(100) → string): 주용도
- **other_usage** (String(200) → string): 기타용도
- **building_height** (Float → number): 높이
- **ground_floors** (Integer → integer): 지상층수
- **basement_floors** (Integer → integer): 지하층수
- **construction_year** (Integer → integer): 건축연도
- **usage_approval_date** (Date → string): 사용승인일

### G. 층수/편의

- **floor_info** (String(50) → string): 층수
- **floor_confirmation** (String(100) → string): 층확인
- **elevator_available** (String(2) → string): 엘리베이터 여부(O/X)
- **elevator_count** (Integer → integer): 승용승강기(대)
- **household_count** (Integer → integer): 세대수
- **family_count** (Integer → integer): 가구수
- **room_number** (String(50) → string): 호수

### H. 법적 권리/특이

- **special_rights** (Text → string): 특수권리
- **tenant_with_opposing_power** (Boolean → boolean): 대항력있는임차인
- **hug_acquisition_condition_change** (Boolean → boolean): HUG 인수조건변경
- **senior_lease_right** (Boolean → boolean): 선순위임차권
- **re_auction** (Boolean → boolean): 재매각
- **equity_sale** (Boolean → boolean): 지분매각
- **joint_collateral** (Boolean → boolean): 공동담보
- **separate_registration** (Boolean → boolean): 별도등기
- **lien_right** (Boolean → boolean): 유치권
- **illegal_building** (Boolean → boolean): 위반건축물
- **lease_sale** (Boolean → boolean): 전세권매각
- **land_rights_unregistered** (Boolean → boolean): 대지권미등기

### I. 코드/식별

- **admin_code** (String(20) → string): h_code(행정코드)
- **legal_code** (String(20) → string): b_code(법정코드)
- **jibun_address** (String(300) → string): 지번주소
- **legal_dong_unit** (String(100) → string): 법정동단위
- **admin_dong_name** (String(100) → string): 행정동명칭
- **postal_code** (String(10) → string): 우편번호
- **pnu** (String(50) → string): PNU(토지고유번호)
- **building_number** (String(100) → string): 건물명
- **dong_name** (String(100) → string): 동명
- **building_registry_pk** (String(100) → string): 관리*상위*건축물대장\_PK

### J. 좌표

- **latitude** (Float → number): y좌표(위도)
- **longitude** (Float → number): x좌표(경도)

## 3) 샘플 응답(JSON, 1건)

```json
{
  "id": 12345,
  "usage": "다세대(빌라)",
  "case_number": "2022타경12345",
  "case_year": 2022,
  "current_status": "배당종결",
  "sale_date": "2023-07-15",
  "sale_year": 2023,

  "road_address": "서울특별시 강남구 테헤란로 123",
  "road_address_converted": "서울 강남구 테헤란로 123",
  "address_area": "강남구",
  "address_city": "서울특별시 강남구",
  "location_detail": "역삼동",
  "building_name": "역삼한마음빌라",
  "general_location": "서울 강남구 역삼동",
  "sido": "서울특별시",
  "eup_myeon_dong": "역삼동",

  "appraised_value": 25000,
  "minimum_bid_price": 17500,
  "bid_to_appraised_ratio": 70.0,
  "final_sale_price": 19800,
  "sale_to_appraised_ratio": 79.2,
  "bidder_count": 3,

  "building_area_pyeong": 23.5,
  "building_area_range": "20~25평",
  "land_area_pyeong": 8.2,
  "land_area_sqm": 27.1,
  "construction_area_sqm": 58.0,
  "total_floor_area_sqm": 85.0,

  "building_coverage_ratio": 58.0,
  "floor_area_ratio": 180.0,
  "main_structure": "철근콘크리트",
  "main_usage": "공동주택",
  "other_usage": null,
  "building_height": 15.2,
  "ground_floors": 5,
  "basement_floors": 1,
  "construction_year": 2005,
  "usage_approval_date": "2005-11-30",

  "floor_info": "3층",
  "floor_confirmation": "등기상 3층",
  "elevator_available": "O",
  "elevator_count": 1,
  "household_count": 24,
  "family_count": 24,
  "room_number": "302",

  "special_rights": "말소기준권리 있음",
  "tenant_with_opposing_power": true,
  "hug_acquisition_condition_change": false,
  "senior_lease_right": false,
  "re_auction": false,
  "equity_sale": false,
  "joint_collateral": true,
  "separate_registration": false,
  "lien_right": false,
  "illegal_building": false,
  "lease_sale": false,
  "land_rights_unregistered": false,

  "admin_code": "11680101",
  "legal_code": "1168010100",
  "jibun_address": "서울특별시 강남구 역삼동 123-45",
  "legal_dong_unit": "역삼동",
  "admin_dong_name": "역삼1동",
  "postal_code": "06234",
  "pnu": "1168010100-12345",
  "building_number": "123",
  "dong_name": "역삼동",

  "latitude": 37.5013,
  "longitude": 127.0396,

  "building_registry_pk": "RGST-2023-000012345",
  "created_at": "2025-08-06T09:35:00+09:00"
}
```

## 4) 연동 참고 (엔드포인트 예)

- 목록: `GET /api/v1/auction-completed/` (필터/정렬/페이징 지원)
- 간소: `GET /api/v1/auction-completed/simple`
- 전체: `GET /api/v1/auction-completed/full`
- 커스텀: `POST /api/v1/auction-completed/custom` (선택 필드 요청)

기본 정렬/페이징은 프론트 요구에 맞춰 조정 가능합니다. 필요 시 camelCase 키 변환, 파생 필드(예: 평↔㎡ 환산, 가격 포맷)도 협의 후 제공하겠습니다.

## 5) 확인 요청 사항

- 필수/옵션 노출 컬럼 합의
- 키 네이밍(camelCase 여부) 및 정렬/페이징 기본값
- 추가 파생값 필요 여부

문의/요청은 본 문서에 코멘트로 남겨주세요. 감사합니다.

