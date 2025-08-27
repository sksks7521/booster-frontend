# Items API 완전 가이드 - 모든 컬럼 사용법 (2025-08-20)

## 📋 **개요**

부동산 경매 매물 데이터(auction_items)의 **모든 73개 컬럼**에 대한 완전한 API 가이드입니다.  
프론트엔드에서 필요한 컬럼만 선택적으로 요청하여 성능을 최적화할 수 있습니다.

---

## 🎯 **API 엔드포인트**

### **기본 API (기존 제공)**

```
GET /api/v1/items/simple
```

### **✅ 새로운 확장 API (신규 구현 완료 - 즉시 사용 가능)**

```bash
GET /api/v1/items/full        # 모든 73개 컬럼 (주의: 응답 크기 대용량)
GET /api/v1/items/custom?fields=필드1,필드2,필드3  # 선택 컬럼만 (권장)
GET /api/v1/items/columns     # 사용 가능한 컬럼 목록 조회
```

### **🚀 API 테스트 완료 상태**

- ✅ **Status 200 OK**: 모든 엔드포인트 정상 동작 확인
- ✅ **73개 컬럼**: 전체 데이터베이스 컬럼 완전 노출
- ✅ **선택적 호출**: 성능 최적화를 위한 필드 선택 기능
- ✅ **메타데이터**: 각 컬럼의 한국어명, 데이터타입, 품질 정보 제공

---

## 📊 **전체 컬럼 매핑표**

| 순번 | 한국어 컬럼명      | DB 컬럼명                          | 데이터 타입 | 샘플 값                           | 데이터 품질 |
| ---- | ------------------ | ---------------------------------- | ----------- | --------------------------------- | ----------- |
| 1    | unique_key         | `id`                               | INTEGER     | 1                                 | ✅ 100%     |
| 2    | 용도               | `usage`                            | VARCHAR     | "다세대(빌라)"                    | ✅ 100%     |
| 3    | 사건               | `case_number`                      | VARCHAR     | "2024-374(2)"                     | ✅ 100%     |
| 4    | 사건년도           | `case_year`                        | INTEGER     | 2024                              | ✅ 100%     |
| 5    | 도로명주소         | `road_address`                     | VARCHAR     | "경기도 화성시 송산면 봉가길 100" | ✅ 100%     |
| 6    | 주소(구역)         | `address_region`                   | VARCHAR     | "경기도"                          | ✅ 100%     |
| 7    | 주소(시군구)       | `address_city`                     | VARCHAR     | "경기도 화성시"                   | ✅ 100%     |
| 8    | 소재지(동)         | `location_dong`                    | VARCHAR     | null                              | ❌ 0%       |
| 9    | 소재지(주택이름)   | `location_building_name`           | VARCHAR     | null                              | ❌ 0%       |
| 10   | 소재지             | `location_detail`                  | VARCHAR     | null                              | ❌ 0%       |
| 11   | (public)도로명주소 | `public_road_address`              | VARCHAR     | null                              | ❌ 0%       |
| 12   | (public)PK주소     | `public_pk_address`                | VARCHAR     | null                              | ❌ 0%       |
| 13   | 건물평형           | `building_area_pyeong`             | FLOAT       | 15.49                             | ✅ 100%     |
| 14   | 건물평형(범위)     | `building_area_range`              | VARCHAR     | "15평~20평"                       | ✅ 100%     |
| 15   | 토지평형           | `land_area_pyeong`                 | FLOAT       | 18.39                             | ✅ 98.9%    |
| 16   | 감정가(만원)       | `appraised_value`                  | INTEGER     | 14000                             | ✅ 100%     |
| 17   | 최저가(만원)       | `minimum_bid_price`                | INTEGER     | 6860                              | ✅ 100%     |
| 18   | 최저가/감정가(%)   | `bid_to_appraised_ratio`           | FLOAT       | 49.0                              | ✅ 100%     |
| 19   | 최저가/공시가격    | `bid_to_public_ratio`              | FLOAT       | null                              | ❌ 0%       |
| 20   | 공시가격(만원)     | `public_price`                     | INTEGER     | 9210                              | ✅ 100%     |
| 21   | 1억 이하 여부      | `under_100million`                 | VARCHAR     | "O (이하)"                        | ✅ 100%     |
| 22   | 현재상태           | `current_status`                   | VARCHAR     | "유찰(2회)"                       | ✅ 100%     |
| 23   | 매각기일           | `sale_date`                        | DATE        | null                              | ❌ 0%       |
| 24   | 매각\_월           | `sale_month`                       | INTEGER     | 8                                 | ✅ 100%     |
| 25   | 특수권리           | `special_rights`                   | VARCHAR     | "별도등기"                        | ✅ 73.4%    |
| 26   | 대항력있는임차인   | `tenant_with_opposing_power`       | BOOLEAN     | null                              | ❌ 0%       |
| 27   | HUG인수조건변경    | `hug_acquisition_condition_change` | BOOLEAN     | null                              | ❌ 0%       |
| 28   | 선순위임차권       | `senior_lease_right`               | BOOLEAN     | null                              | ❌ 0%       |
| 29   | 재매각             | `resale`                           | BOOLEAN     | null                              | ❌ 0%       |
| 30   | 지분매각           | `partial_sale`                     | BOOLEAN     | null                              | ❌ 0%       |
| 31   | 공동담보           | `joint_collateral`                 | BOOLEAN     | null                              | ❌ 0%       |
| 32   | 별도등기           | `separate_registration`            | BOOLEAN     | null                              | ❌ 0%       |
| 33   | 유치권             | `lien`                             | BOOLEAN     | null                              | ❌ 0%       |
| 34   | 위반건축물         | `illegal_building`                 | BOOLEAN     | null                              | ❌ 0%       |
| 35   | 전세권매각         | `lease_right_sale`                 | BOOLEAN     | null                              | ❌ 0%       |
| 36   | 대지권미등기       | `land_right_unregistered`          | BOOLEAN     | null                              | ❌ 0%       |
| 37   | 층수               | `floor_info`                       | VARCHAR     | null                              | ❌ 0%       |
| 38   | (public)층수       | `public_floor`                     | VARCHAR     | null                              | ❌ 0%       |
| 39   | 층확인             | `floor_confirmation`               | VARCHAR     | "1층"                             | ✅ 100%     |
| 40   | region_group       | `region_group`                     | VARCHAR     | "etc"                             | ✅ 100%     |
| 41   | 읍면동             | `eup_myeon_dong`                   | VARCHAR     | null                              | ❌ 0%       |
| 42   | 시도               | `sido`                             | VARCHAR     | "경기도"                          | ✅ 94%      |
| 43   | x좌표(경도)        | `longitude`                        | FLOAT       | 126.7350413                       | ✅ 99.6%    |
| 44   | y좌표(위도)        | `latitude`                         | FLOAT       | 37.21124028                       | ✅ 99.6%    |
| 45   | h_code(행정코드)   | `h_code`                           | BIGINT      | null                              | ❌ 0%       |
| 46   | b_code(법정코드)   | `b_code`                           | BIGINT      | null                              | ❌ 0%       |
| 47   | 지번주소           | `jibun_address`                    | VARCHAR     | null                              | ❌ 0%       |
| 48   | 법정동단위         | `legal_dong_unit`                  | VARCHAR     | null                              | ❌ 0%       |
| 49   | 행정동명칭         | `administrative_dong_name`         | VARCHAR     | null                              | ❌ 0%       |
| 50   | 우편번호           | `postal_code`                      | VARCHAR     | null                              | ❌ 0%       |
| 51   | PNU                | `pnu`                              | BIGINT      | null                              | ❌ 0%       |
| 52   | 건물명             | `building_name`                    | VARCHAR     | null                              | ❌ 0%       |
| 53   | 동명               | `dong_name`                        | VARCHAR     | null                              | ❌ 0%       |
| 54   | 대지면적(㎡)       | `land_area_m2`                     | FLOAT       | null                              | ❌ 0%       |
| 55   | 건축면적(㎡)       | `building_area_m2`                 | FLOAT       | null                              | ❌ 0%       |
| 56   | 연면적(㎡)         | `total_floor_area`                 | FLOAT       | null                              | ❌ 0%       |
| 57   | 건폐율(%)          | `building_coverage_ratio`          | FLOAT       | null                              | ❌ 0%       |
| 58   | 용적률(%)          | `floor_area_ratio`                 | FLOAT       | null                              | ❌ 0%       |
| 59   | 주구조             | `main_structure`                   | VARCHAR     | null                              | ❌ 0%       |
| 60   | 주용도             | `main_usage`                       | VARCHAR     | null                              | ❌ 0%       |
| 61   | 기타용도           | `other_usage`                      | VARCHAR     | null                              | ❌ 0%       |
| 62   | 높이               | `height`                           | FLOAT       | null                              | ❌ 0%       |

↳ 단위: m
| 63 | 지상층수 | `ground_floors` | INTEGER | null | ❌ 0% |
| 64 | 지하층수 | `basement_floors` | INTEGER | null | ❌ 0% |
| 65 | 세대수 | `household_count` | INTEGER | null | ❌ 0% |
| 66 | 가구수 | `family_count` | INTEGER | null | ❌ 0% |
| 67 | 호수 | `unit_number` | VARCHAR | null | ❌ 0% |
| 68 | 사용승인일 | `use_approval_date` | DATE | null | ❌ 0% |
| 69 | 승용승강기(대) | `elevator_count` | INTEGER | null | ❌ 0% |
| 70 | 건축연도 | `construction_year` | INTEGER | 2015 | ✅ 94% |
| 71 | Elevator여부 | `elevator_available` | VARCHAR | "O" | ✅ 100% |
| 72 | 관리*상위*건축물대장\_PK | `management_upper_building_pk` | BIGINT | null | ❌ 0% |
| 73 | 생성일시 | `created_at` | DATETIME | "2025-08-19 12:16:58" | ✅ 100% |

---

## 🎨 **데이터 품질별 분류**

### **✅ High Quality (100% 데이터)**

**핵심 매물 정보** - 항상 안전하게 사용 가능

```typescript
const highQualityFields = [
  "id",
  "usage",
  "case_number",
  "case_year",
  "road_address",
  "address_region",
  "address_city",
  "building_area_pyeong",
  "building_area_range",
  "appraised_value",
  "minimum_bid_price",
  "bid_to_appraised_ratio",
  "public_price",
  "under_100million",
  "current_status",
  "sale_month",
  "floor_confirmation",
  "region_group",
  "elevator_available",
];
```

### **⚠️ Medium Quality (70-99% 데이터)**

**부가 정보** - 기본값 처리 필요

```typescript
const mediumQualityFields = [
  "land_area_pyeong", // 98.9%
  "longitude",
  "latitude", // 99.6%
  "construction_year", // 94%
  "sido", // 94%
  "special_rights", // 73.4%
];
```

### **❌ Low Quality (0% 데이터)**

**사용 불가 또는 향후 확장용** - 현재는 제외 권장

```typescript
const lowQualityFields = [
  "location_dong",
  "location_building_name",
  "location_detail",
  "sale_date",
  "floor_info",
  // ... 기타 null이 많은 필드들
];
```

---

## 🚀 **API 사용법**

### **1. 기본 사용 (현재)**

```typescript
// 현재 제공되는 14개 기본 필드
const response = await fetch('/api/v1/items/simple');
const data = await response.json();

// 응답 구조
{
  totalItems: 1000,
  items: [{
    id: 1,
    title: "다세대(빌라) 경기도 화성시 송산면 봉가길 100",
    address: "경기도 화성시 송산면 봉가길 100",
    price: 6860,
    area: 15.49,
    buildYear: 2015,
    lat: 37.21124028,
    lng: 126.7350413,
    auctionDate: null, // ❌ 데이터 없음
    status: "유찰(2회)",
    floor: null,       // ❌ 데이터 없음
    hasElevator: true,
    hasParking: false, // ❌ 데이터 없음
    estimatedValue: 14000
  }]
}
```

### **2. 전체 컬럼 사용 (신규)**

```typescript
// 모든 73개 컬럼 포함
const response = await fetch("/api/v1/items/full");
const data = await response.json();

// 응답에는 모든 DB 컬럼이 포함됨
// 주의: 응답 크기가 크므로 필요시에만 사용
```

### **3. 선택적 컬럼 사용 (신규 - 권장)**

```typescript
// 필요한 컬럼만 선택하여 성능 최적화
const fields = [
  'id', 'usage', 'road_address', 'building_area_pyeong',
  'minimum_bid_price', 'appraised_value', 'current_status',
  'floor_confirmation', 'elevator_available'
].join(',');

const response = await fetch(`/api/v1/items/custom?fields=${fields}`);
const data = await response.json();

// 응답 구조
{
  totalItems: 1000,
  requestedFields: ["id", "usage", "road_address", ...],
  items: [{
    id: 1,
    usage: "다세대(빌라)",
    road_address: "경기도 화성시 송산면 봉가길 100",
    building_area_pyeong: 15.49,
    minimum_bid_price: 6860,
    appraised_value: 14000,
    current_status: "유찰(2회)",
    floor_confirmation: "1층",
    elevator_available: "O"
  }]
}
```

### **3-1. 단건 보강(공식) - id 파라미터 사용**

```bash
# 단건 보강: 상세에서 부족한 필드만 선택해 보강
curl -X GET \
"$BASE/api/v1/items/custom?fields=id,usage,case_number,road_address,building_area_pyeong,land_area_pyeong,minimum_bid_price,appraised_value,bid_to_appraised_ratio,construction_year,elevator_available,floor_confirmation,special_rights,current_status,latitude,longitude,public_price,under_100million,sale_month,building_name,dong_name,unit_number,ground_floors,basement_floors,household_count,family_count,elevator_count,main_structure,other_usage,height&id=4579&limit=1"

# 응답은 단건이어도 동일 포맷 유지
{
  "total_items": 1,
  "requested_fields": ["..."],
  "items": [ { /* 단건 */ } ]
}
```

### **3-2. 잘못된 필드 요청 시 400 응답**

```json
{
  "detail": {
    "error": "Invalid fields",
    "invalid_fields": ["room_number", "underground_floors"],
    "valid_fields": ["id", "usage", "road_address", "..."]
  }
}
```

### **4. 컬럼 정보 조회**

```typescript
// 사용 가능한 모든 컬럼 메타데이터 조회
const response = await fetch('/api/v1/items/columns');
const columns = await response.json();

// 응답 구조
{
  totalColumns: 73,
  highQuality: ["id", "usage", "case_number", ...],
  mediumQuality: ["land_area_pyeong", "longitude", ...],
  lowQuality: ["location_dong", "sale_date", ...],
  columns: [{
    koreanName: "unique_key",
    dbColumn: "id",
    dataType: "INTEGER",
    sampleValue: "1",
    dataQuality: "high",
    description: "매물 고유 식별자"
  }, ...]
}
```

---

## 💡 **권장 사용 패턴**

### **Pattern 1: 테이블 기본 표시**

```typescript
// 필터링 없는 기본 테이블 표시용
const basicFields = [
  "id",
  "usage",
  "road_address",
  "building_area_pyeong",
  "minimum_bid_price",
  "appraised_value",
  "current_status",
  "floor_confirmation",
  "elevator_available",
];
```

### **Pattern 2: 상세 정보 표시**

```typescript
// 매물 상세 페이지나 팝업용
const detailFields = [
  "id",
  "usage",
  "case_number",
  "case_year",
  "road_address",
  "address_region",
  "address_city",
  "building_area_pyeong",
  "building_area_range",
  "land_area_pyeong",
  "minimum_bid_price",
  "appraised_value",
  "bid_to_appraised_ratio",
  "public_price",
  "under_100million",
  "current_status",
  "sale_month",
  "special_rights",
  "floor_confirmation",
  "construction_year",
  "elevator_available",
  "longitude",
  "latitude",
];
```

### **Pattern 3: 지도 표시용**

```typescript
// 지도 마커나 클러스터링용
const mapFields = [
  "id",
  "usage",
  "road_address",
  "minimum_bid_price",
  "current_status",
  "longitude",
  "latitude",
];
```

### **Pattern 4: 필터링/검색용**

```typescript
// 필터 조건 검증이나 검색 결과용
const filterFields = [
  "id",
  "usage",
  "address_region",
  "address_city",
  "sido",
  "building_area_range",
  "under_100million",
  "region_group",
  "current_status",
  "construction_year",
  "elevator_available",
];
```

---

## ⚡ **성능 최적화 가이드**

### **응답 크기 비교**

- **기본 API** (`/simple`): ~5KB per 100 items
- **전체 API** (`/full`): ~25KB per 100 items
- **선택형 API** (`/custom`): 선택한 필드에 따라 가변

### **권장 사항**

1. **소량 데이터**: 전체 컬럼 사용 가능
2. **대량 데이터**: 필요한 컬럼만 선택 사용
3. **실시간 업데이트**: 최소 필드로 제한
4. **초기 로드**: 기본 필드 + 점진적 확장

---

## 🔧 **구현 예정 API**

### **A. 전체 컬럼 API**

```
GET /api/v1/items/full
- 모든 73개 컬럼 반환
- 큰 응답 크기 주의
```

### **B. 선택적 컬럼 API**

```
GET /api/v1/items/custom?fields=id,usage,price
- 쿼리 파라미터로 원하는 필드 지정
- 콤마(,)로 구분
- 성능 최적화된 응답
```

### **C. 컬럼 메타데이터 API**

```
GET /api/v1/items/columns
- 사용 가능한 모든 컬럼 정보
- 데이터 품질, 타입, 샘플 값 포함
```

---

## 📝 **프론트엔드 적용 가이드**

### **1. 기존 코드 호환성**

```typescript
// 기존 코드는 그대로 동작
const items = await fetchItems(); // 기존 /simple API 사용
```

### **2. 새 컬럼 점진적 추가**

```typescript
// 새 컬럼들을 optional로 안전하게 추가
interface ItemRow {
  // 기존 필드들...

  // 새 필드들 (optional)
  usage?: string;
  floorConfirmation?: string;
  saleMonth?: number;
  bidRatio?: number;
}

// 사용 시 기본값 처리
const displayFloor = (item as any).floorConfirmation ?? "-";
const displayMonth = (item as any).saleMonth ?? "";
```

### **3. 동적 컬럼 선택**

```typescript
// 사용자 설정에 따른 동적 컬럼 선택
const userColumns = getUserPreferences();
const fields = userColumns.map((col) => col.dbField).join(",");
const items = await fetch(`/api/v1/items/custom?fields=${fields}`);
```

---

## 🎉 **구현 완료 및 다음 단계**

### **✅ Phase 1: API 구현 완료** (2025-08-20)

- ✅ `/api/v1/items/full` 구현 완료 (73개 전체 컬럼)
- ✅ `/api/v1/items/custom` 구현 완료 (선택적 컬럼 호출)
- ✅ `/api/v1/items/columns` 구현 완료 (컬럼 메타데이터)
- ✅ **모든 API 테스트 완료 (Status 200 OK)**

### **🚀 바로 사용 가능한 기능들**

```bash
# 즉시 사용 가능한 엔드포인트들
curl "http://127.0.0.1:8000/api/v1/items/columns"
curl "http://127.0.0.1:8000/api/v1/items/custom?fields=id,usage,road_address,minimum_bid_price&limit=5"
curl "http://127.0.0.1:8000/api/v1/items/full?limit=1"
```

### **📋 Phase 2: 프론트엔드 연동** (추천 작업 순서)

1. **컬럼 메타데이터 확인**: `/columns` API로 사용 가능한 73개 컬럼 파악
2. **기본 테이블 확장**: 기존 컬럼 + `usage`, `floor_confirmation`, `sale_month` 추가
3. **필터 검증용**: `case_year`, `construction_year`, `special_rights` 등으로 필터링 테스트
4. **지도 최적화**: `latitude`, `longitude` 좌표 데이터만 선택적 호출
5. **상세 정보**: `case_number`, `appraised_value`, `bid_to_appraised_ratio` 등 추가

### **⚡ 성능 권장사항**

- **일반 테이블**: `/custom?fields=필요한5-10개필드` (권장)
- **지도용**: `/custom?fields=id,latitude,longitude,minimum_bid_price` (권장)
- **상세보기**: `/custom?fields=상세필드15개정도` (권장)
- **전체 데이터**: `/full` (개발/테스트용만, 응답 용량 주의)
- [ ] 필터링 기능 검증
- [ ] 성능 최적화 확인

---

## 📞 **지원**

### **백엔드 문의사항**

- 새 API 요청이나 수정사항
- 성능 이슈나 최적화 문의
- 데이터 품질 개선 요청

### **프론트엔드 확인 필요**

- 필요한 컬럼 조합 확인
- UI/UX 레이아웃 영향도 검토
- 특정 필드 표시 형식 요구사항

---

**📌 이 문서는 auction_items 테이블의 모든 컬럼을 완전히 매핑한 영구 참조 문서입니다. 필요한 데이터를 자유롭게 선택하여 최적화된 API를 활용하세요!**
