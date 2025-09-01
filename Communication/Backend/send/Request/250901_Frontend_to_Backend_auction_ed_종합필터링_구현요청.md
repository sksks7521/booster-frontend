# 백엔드 개발 요청: auction_ed 종합 필터링 구현

## 요청 개요

- **요청일**: 2025-09-01
- **요청자**: 프론트엔드 팀
- **대상 API**: `/api/v1/auction-completed/`
- **목적**: v2 페이지에서 사용할 auction_ed 데이터의 서버사이드 필터링 기능 구현

## 현재 문제점

### 1. 매각가 필터링 문제

- **현상**: 프론트엔드에서 매각가 범위(예: 0~15,000만원)를 설정해도 범위를 벗어나는 데이터가 표시됨
- **원인**:
  - 백엔드에서 `min_final_sale_price`, `max_final_sale_price` 파라미터를 처리하지 않음
  - null 값이나 0 값 처리 로직 부재
- **영향**: 사용자가 설정한 필터가 동작하지 않아 UX 저하

### 2. 페이지네이션 문제

- **현상**: 클라이언트 사이드 필터링으로 인해 페이지당 표시되는 항목 수가 불규칙함
- **원인**: 서버에서 전체 데이터를 반환한 후 클라이언트에서 필터링하여 실제 표시 항목이 줄어듦
- **영향**: 페이지네이션이 부정확하게 동작

## 구현 요청 사항

### 필수 구현 파라미터

#### 1. 매각가 필터링

```
min_final_sale_price: number (만원 단위)
max_final_sale_price: number (만원 단위)
```

- 매각가가 null이거나 0인 경우 처리 로직 필요
- 범위 검증: min ≤ final_sale_price ≤ max

#### 2. 매각기일 필터링

```
sale_date_from: string (YYYY-MM-DD 형식)
sale_date_to: string (YYYY-MM-DD 형식)
```

- 매각기일이 지정된 날짜 범위 내에 있는 데이터만 반환

#### 3. 건축면적 필터링

```
min_building_area_pyeong: number (평 단위)
max_building_area_pyeong: number (평 단위)
```

- 건물평형 컬럼 기준으로 필터링

#### 4. 토지면적 필터링

```
min_land_area_pyeong: number (평 단위)
max_land_area_pyeong: number (평 단위)
```

- 토지평형 컬럼 기준으로 필터링

#### 5. 건축년도 필터링

```
min_construction_year: number (년도)
max_construction_year: number (년도)
```

- 건축연도 컬럼 기준으로 필터링

#### 6. 층확인 필터링

```
floor_confirmation: string (쉼표로 구분된 값들)
```

- 가능한 값: "반지하", "1층", "일반층", "탑층"
- 예시: "1층,일반층" (여러 값 선택 시)

#### 7. 엘리베이터 필터링

```
elevator_available: string
```

- 가능한 값: "O" (있음), "X" (없음)
- 여러 값 선택 시 쉼표로 구분: "O,X"

#### 8. 현재상태 필터링

```
current_status: string (쉼표로 구분된 값들)
```

- 가능한 값: "신건", "유찰", "재진행", "변경", "재매각", "취하", "낙찰", "매각"
- 예시: "매각,낙찰" (여러 값 선택 시)

#### 9. 특수조건 필터링

```
special_conditions: string (쉼표로 구분된 값들)
```

- 가능한 값: "대항력있는임차인", "HUG인수조건변경", "선순위임차권", "재매각", "지분매각", "공동담보", "별도등기", "유치권", "위반건축물", "전세권매각", "대지권미등기"
- 특수권리 컬럼에서 해당 문자열이 포함된 데이터 검색

#### 10. 주소 검색

```
road_address_search: string
```

- 도로명주소 컬럼에서 부분 일치 검색 (LIKE 검색)

#### 11. 사건번호 검색

```
case_number_search: string
```

- 사건번호 컬럼에서 부분 일치 검색 (LIKE 검색)

### 기존 파라미터 (이미 구현된 것으로 추정)

```
address_area: string (시도)
address_city: string (시군구)
eup_myeon_dong: string (읍면동)
page: number
size: number
sort_by: string
sort_order: string ("asc" | "desc")
```

## 프론트엔드 구현 현황

### 이미 구현된 부분

1. **UI 컴포넌트**: 모든 필터 UI가 analysis 페이지와 동일한 스타일로 구현 완료
2. **상태 관리**: useFilterStore를 통한 필터 상태 관리 구현
3. **API 매핑**: registry.ts에서 프론트엔드 필터 → 백엔드 파라미터 매핑 완료

### 매핑 관계

| 프론트엔드 필터                | 백엔드 파라미터                                    | 설명            |
| ------------------------------ | -------------------------------------------------- | --------------- |
| priceRange                     | min_final_sale_price, max_final_sale_price         | 매각가 범위     |
| auctionDateFrom, auctionDateTo | sale_date_from, sale_date_to                       | 매각기일 범위   |
| buildingAreaRange              | min_building_area_pyeong, max_building_area_pyeong | 건축면적 범위   |
| landAreaRange                  | min_land_area_pyeong, max_land_area_pyeong         | 토지면적 범위   |
| buildYear                      | min_construction_year, max_construction_year       | 건축년도 범위   |
| floorConfirmation              | floor_confirmation                                 | 층확인          |
| hasElevator                    | elevator_available                                 | 엘리베이터 여부 |
| currentStatus                  | current_status                                     | 현재상태        |
| specialBooleanFlags            | special_conditions                                 | 특수조건        |
| searchQuery + searchField      | road_address_search, case_number_search            | 검색            |

## 테스트 케이스

### 1. 매각가 필터링 테스트

```
GET /api/v1/auction-completed/?min_final_sale_price=10000&max_final_sale_price=50000
```

- 예상 결과: 매각가가 1억~5억 사이인 데이터만 반환

### 2. 복합 필터링 테스트

```
GET /api/v1/auction-completed/?min_final_sale_price=20000&max_final_sale_price=100000&floor_confirmation=일반층,탑층&elevator_available=O
```

- 예상 결과: 매각가 2억~10억, 일반층 또는 탑층, 엘리베이터 있는 데이터만 반환

### 3. 검색 테스트

```
GET /api/v1/auction-completed/?road_address_search=강남구&case_number_search=2024
```

- 예상 결과: 도로명주소에 '강남구'가 포함되고 사건번호에 '2024'가 포함된 데이터만 반환

## 우선순위

1. **High**: 매각가 필터링 (min_final_sale_price, max_final_sale_price)
2. **High**: 매각기일 필터링 (sale_date_from, sale_date_to)
3. **Medium**: 면적 필터링 (건축면적, 토지면적)
4. **Medium**: 건축년도, 층확인, 엘리베이터, 현재상태 필터링
5. **Low**: 특수조건, 검색 기능

## 완료 확인 방법

1. 각 파라미터별로 필터링이 정상 동작하는지 확인
2. 복합 필터링 시 AND 조건으로 정확히 동작하는지 확인
3. 페이지네이션이 필터링된 결과 기준으로 정확히 동작하는지 확인
4. null 값이나 빈 값 처리가 적절한지 확인

## 연락처

- 프론트엔드 팀: [연락처]
- 관련 파일:
  - `Application/datasets/registry.ts` (API 매핑)
  - `Application/components/features/auction-ed/AuctionEdFilter.tsx` (UI)

---

**참고**: 이 요청은 사용자 경험 개선을 위한 필수 기능입니다. 특히 매각가 필터링은 사용자가 가장 많이 사용하는 핵심 기능이므로 우선적으로 구현해 주시기 바랍니다.
