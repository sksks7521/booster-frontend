# 백엔드 API 구현 요청 - 실거래가 영역(반경) 필터 API

**작성일**: 2025-10-06  
**요청자**: Frontend Team  
**우선순위**: 중간 (Phase 5 - 그룹 C: 서버 영역 모드)

---

## 📋 요청 개요

**목적**: 지도에서 **원 그리기 기능**을 사용할 때, 서버에서 **반경 내 데이터만 효율적으로 필터링**하여 전송하기 위한 API가 필요합니다.

**배경**:

- 현재 실거래가 데이터는 페이지별로 최대 1000건씩 조회됩니다.
- 사용자가 지도에서 원을 그려 반경 필터를 적용하면, **클라이언트에서 현재 페이지(20건)만 필터링**되므로 정확도가 낮습니다.
- 경매결과(`auction_ed`)에서는 `useGlobalDataset` 훅으로 최대 5000건을 가져와 클라이언트에서 필터링하지만, **네트워크 오버헤드가 큽니다** (5개 요청 × 1000건).
- **서버에서 반경 내 데이터만 필터링**하여 전송하면 네트워크 효율이 크게 개선됩니다.

**참고**:

- 경매결과 페이지에서는 이미 `/auction/area` API를 사용 중입니다.
- 동일한 패턴을 실거래가(`/real-transactions/area`)에도 적용합니다.

---

## 🎯 API 명세

### **엔드포인트**

```
GET /api/v1/real-transactions/area
```

---

### **요청 파라미터**

| 파라미터          | 타입    | 필수 | 설명                                      | 예시             |
| ----------------- | ------- | ---- | ----------------------------------------- | ---------------- |
| `lat`             | float   | ✅   | 원 중심 위도 (latitude)                   | `37.5665`        |
| `lng`             | float   | ✅   | 원 중심 경도 (longitude)                  | `126.9780`       |
| `radius_km`       | float   | ✅   | 반경 (킬로미터), 최소 0.5km, 최대 10km    | `1.0`            |
| `sido`            | string  | ❌   | 지역 필터: 시도 (예: "서울특별시")        | `서울특별시`     |
| `sigungu`         | string  | ❌   | 지역 필터: 시군구 (예: "강남구")          | `강남구`         |
| `admin_dong_name` | string  | ❌   | 지역 필터: 읍면동 (예: "대치동")          | `대치동`         |
| `size`            | integer | ❌   | 최대 반환 개수 (기본값: 1000, 최대: 5000) | `1000`           |
| `ordering`        | string  | ❌   | 정렬 기준 (기본값: `-contract_date`)      | `-contract_date` |
| `page`            | integer | ❌   | 페이지 번호 (기본값: 1) - 선택사항        | `1`              |

---

### **반경 계산 방식**

**Haversine 공식** 사용 권장:

```python
from math import radians, cos, sin, asin, sqrt

def haversine(lon1, lat1, lon2, lat2):
    """
    두 지점 간의 거리를 km 단위로 계산 (Haversine 공식)
    """
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    km = 6371 * c  # 지구 반지름 (km)
    return km
```

**PostGIS 사용 시** (권장):

```sql
-- ST_DWithin으로 반경 내 데이터 필터링
SELECT * FROM real_transactions
WHERE ST_DWithin(
    geom::geography,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_km * 1000  -- 미터 단위로 변환
)
```

---

### **응답 형식**

```json
{
  "items": [
    {
      "id": "2031959",
      "sido": "경기도",
      "sigungu": "고양시 일산동구",
      "roadAddressReal": "경기도 고양시 일산동구 강송로125번길 52",
      "jibunAddress": "경기도 고양시 일산동구 백석동 1193",
      "buildingNameReal": "흰돌마을6(라이프)",
      "dongName": "601동",
      "transactionAmount": 43000,
      "pricePerPyeong": 1877,
      "contractYear": 2023,
      "contractMonth": 8,
      "contractDay": 15,
      "contractDate": "2023-08-15",
      "exclusiveAreaSqm": 75.57,
      "exclusiveAreaPyeong": 22.86,
      "constructionYear": 1994,
      "floorInfoReal": "3",
      "floorConfirmation": "일반층",
      "elevatorAvailable": false,
      "elevatorCount": 0,
      "latitude": 37.64849863,
      "longitude": 126.7832692,
      "transactionType": "중개거래",
      "buyerType": "개인",
      "sellerType": "개인",
      "_distance_km": 0.87 // ✅ 중심으로부터의 거리 (선택사항)
    }
    // ... 반경 내 모든 데이터
  ],
  "total_items": 127,
  "page": 1,
  "size": 1000,
  "filter_info": {
    "center": {
      "lat": 37.5665,
      "lng": 126.978
    },
    "radius_km": 1.0,
    "region": {
      "sido": "서울특별시",
      "sigungu": null,
      "admin_dong_name": null
    }
  }
}
```

**응답 필드 설명:**

- `items`: 반경 내 데이터 배열 (기존 `/real-transactions/` API와 동일한 구조)
- `total_items`: 반경 내 총 데이터 개수
- `page`, `size`: 페이지네이션 정보
- `filter_info`: 필터 조건 요약 (디버깅용)
- `_distance_km` (선택사항): 중심으로부터의 거리 (정렬에 활용 가능)

---

## 🔧 필수 요구사항

### **1. 반경 제한 ⚠️ 중요**

**안전 가드:**

```python
MIN_RADIUS_KM = 0.5   # 최소 500m
MAX_RADIUS_KM = 10.0  # 최대 10km
```

**이유:**

- 너무 작은 반경 (< 0.5km): 데이터가 거의 없어 무의미
- 너무 큰 반경 (> 10km): 서버 부하 증가, 클라이언트 렌더링 부담

**유효성 검사:**

```python
if not MIN_RADIUS_KM <= radius_km <= MAX_RADIUS_KM:
    return {"error": "radius_km must be between 0.5 and 10.0"}
```

---

### **2. 좌표 유효성 검사**

```python
# 한국 좌표 범위 (대략)
MIN_LAT, MAX_LAT = 33.0, 39.0  # 위도
MIN_LNG, MAX_LNG = 124.0, 132.0  # 경도

if not (MIN_LAT <= lat <= MAX_LAT):
    return {"error": "Invalid latitude"}
if not (MIN_LNG <= lng <= MAX_LNG):
    return {"error": "Invalid longitude"}
```

---

### **3. 결측값 처리**

- **좌표가 없는 데이터는 제외**: `latitude IS NOT NULL AND longitude IS NOT NULL`
- **좌표가 (0, 0)인 경우도 제외**: 명백한 오류 데이터
- 다른 필드의 결측값은 `null`로 반환 (기존 API와 동일)

**SQL 예시:**

```sql
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND NOT (latitude = 0 AND longitude = 0)
  AND ST_DWithin(...)
```

---

### **4. 정렬**

**기본 정렬**: `contractDate` 내림차순 (최신 거래 먼저)

**추가 정렬 옵션** (선택사항):

- `distance`: 중심으로부터의 거리 (가까운 순)
- `-distance`: 중심으로부터의 거리 (먼 순)

**예시:**

```
GET /api/v1/real-transactions/area?lat=37.5&lng=127.0&radius_km=1.0&ordering=distance
```

---

### **5. 지역 필터 조합**

반경 필터 + 지역 필터를 **AND 조건**으로 결합:

```sql
WHERE ST_DWithin(geom, center, radius)
  AND (sido = '서울특별시' OR sido IS NULL)  -- 지역 필터가 있으면 적용
  AND (sigungu = '강남구' OR sigungu IS NULL)
  AND (admin_dong_name = '대치동' OR admin_dong_name IS NULL)
```

---

### **6. 성능 최적화**

**권장 사항:**

1. **공간 인덱스 생성** (PostGIS):

   ```sql
   CREATE INDEX idx_real_transactions_geom ON real_transactions USING GIST(geom);
   ```

2. **복합 인덱스** (지역 + 날짜):

   ```sql
   CREATE INDEX idx_rt_region_date ON real_transactions(sido, sigungu, contract_date DESC);
   ```

3. **커버링 인덱스** (자주 조회되는 필드 포함):

   ```sql
   CREATE INDEX idx_rt_area_query ON real_transactions(
     latitude, longitude, contract_date, transaction_amount, exclusive_area_sqm
   );
   ```

4. **쿼리 실행 계획 확인**:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM real_transactions
   WHERE ST_DWithin(geom, ST_MakePoint(127, 37), 1000);
   ```

---

## 📊 프론트엔드 활용 방식

### **시나리오 1: 원 그리기 필터**

```typescript
// 1. 사용자가 지도에서 원을 그림
const circleCenter = { lat: 37.5665, lng: 126.978 };
const circleRadiusM = 1000; // 1km = 1000m

// 2. 서버에 반경 내 데이터 요청
const response = await realTransactionApi.getTransactionsByArea({
  lat: circleCenter.lat,
  lng: circleCenter.lng,
  radius_km: circleRadiusM / 1000, // m → km 변환
  sido: "서울특별시",
  sigungu: "강남구",
  size: 5000,
  ordering: "-contract_date",
});

// 3. 지도에 마커 표시
response.items.forEach((item) => {
  addMarkerToMap(item);
});

// 4. 테이블에 데이터 표시
renderTable(response.items);
```

---

### **시나리오 2: 대용량 데이터 처리**

```typescript
// 반경이 크거나 데이터가 많은 경우 → 단계적 로딩
async function loadAreaData(center, radiusKm) {
  // 1단계: 500건 먼저 로드
  const batch1 = await fetch(
    `/api/v1/real-transactions/area?lat=${center.lat}&lng=${center.lng}&radius_km=${radiusKm}&size=500`
  );

  // 2단계: 사용자가 "더 보기" 클릭 시 추가 로드
  const batch2 = await fetch(
    `/api/v1/real-transactions/area?lat=${center.lat}&lng=${center.lng}&radius_km=${radiusKm}&size=5000&page=2`
  );

  return [...batch1.items, ...batch2.items];
}
```

---

## 🧪 테스트 케이스

### **Case 1: 정상 케이스 (서울 강남)**

**요청:**

```
GET /api/v1/real-transactions/area?lat=37.4979&lng=127.0276&radius_km=1.0&sido=서울특별시&sigungu=강남구
```

**기대 응답:**

- 강남역 중심 반경 1km 내 실거래가 데이터
- 최신 거래 순으로 정렬
- `total_items`: 100~500건 예상

---

### **Case 2: 반경 제한 초과**

**요청:**

```
GET /api/v1/real-transactions/area?lat=37.5&lng=127.0&radius_km=15.0
```

**기대 응답:**

```json
{
  "error": "radius_km must be between 0.5 and 10.0",
  "detail": "Provided radius_km: 15.0"
}
```

HTTP Status: `400 Bad Request`

---

### **Case 3: 좌표 없음**

**요청:**

```
GET /api/v1/real-transactions/area?radius_km=1.0
```

**기대 응답:**

```json
{
  "error": "Missing required parameters",
  "detail": "lat, lng, and radius_km are required"
}
```

HTTP Status: `422 Unprocessable Entity`

---

### **Case 4: 데이터 없음**

**요청:**

```
GET /api/v1/real-transactions/area?lat=35.0&lng=125.0&radius_km=1.0
```

**기대 응답:**

```json
{
  "items": [],
  "total_items": 0,
  "page": 1,
  "size": 1000,
  "filter_info": {
    "center": { "lat": 35.0, "lng": 125.0 },
    "radius_km": 1.0
  }
}
```

HTTP Status: `200 OK`

---

### **Case 5: 지역 + 반경 조합**

**요청:**

```
GET /api/v1/real-transactions/area?lat=37.6&lng=126.9&radius_km=2.0&sido=경기도&sigungu=고양시 일산동구
```

**기대 응답:**

- 경기도 고양시 일산동구 **AND** 반경 2km 내 데이터만 반환
- 두 조건을 모두 만족하는 데이터만 포함

---

## 📐 예상 데이터 규모

| 반경  | 예상 데이터 수 (서울 강남) | 예상 응답 크기 |
| ----- | -------------------------- | -------------- |
| 0.5km | 50~200건                   | ~50KB          |
| 1km   | 100~500건                  | ~100KB         |
| 2km   | 500~2000건                 | ~500KB         |
| 5km   | 2000~5000건                | ~1MB           |
| 10km  | 5000~10000건               | ~2MB           |

**참고**: 경매결과와 비슷한 규모 예상.

---

## ⏱️ 예상 일정

- **백엔드 구현**: 2~3시간

  - API 엔드포인트 추가: 1시간
  - 공간 인덱스 최적화: 30분
  - 테스트 및 검증: 1시간

- **프론트엔드 통합**: 1시간

  - `realTransactionApi.getTransactionsByArea()` 추가
  - `SaleSearchResults.tsx` 수정 (서버 영역 모드)

- **QA 및 최종 검증**: 30분

**총 예상**: 4~5시간 (0.5~1일)

---

## 🔄 기존 API와의 차이점

| 항목      | `/real-transactions/` (기존) | `/real-transactions/area` (신규) |
| --------- | ---------------------------- | -------------------------------- |
| 필터 방식 | 지역별 (sido, sigungu, ...)  | 반경 (lat, lng, radius_km)       |
| 최대 결과 | 1000건/페이지                | 5000건 (권장: 1000건)            |
| 정렬      | 서버 정렬                    | 서버 정렬 + 거리 정렬 (옵션)     |
| 네트워크  | 5번 요청 (5000건)            | 1번 요청 (5000건)                |
| 사용 시점 | 일반 조회                    | 원 그리기 필터 활성 시           |

---

## 📝 프론트엔드 API 클라이언트 추가 (참고)

`Application/lib/api.ts`에 추가 예정:

```typescript
// 🆕 반경 내 실거래가 조회
getTransactionsByArea: async (params: {
  lat: number;
  lng: number;
  radius_km: number;
  sido?: string;
  sigungu?: string;
  admin_dong_name?: string;
  size?: number;
  ordering?: string;
  page?: number;
}): Promise<any> => {
  const queryParams = new URLSearchParams(
    Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  const response = await fetch(
    `${API_BASE_URL}/api/v1/real-transactions/area?${queryParams}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch transactions by area");
  }

  return response.json();
},
```

---

## 📞 문의사항

구현 중 문제가 있거나 추가 정보가 필요하시면 언제든지 연락 주세요!

- **프론트엔드 담당**: Frontend Team
- **관련 파일**:
  - `Application/components/features/sale/SaleSearchResults.tsx`
  - `Application/hooks/useGlobalDataset.ts`
  - `Application/lib/api.ts`
- **참고 구현**: 경매결과 `/auction/area` API 패턴

---

**감사합니다!** 🚀
