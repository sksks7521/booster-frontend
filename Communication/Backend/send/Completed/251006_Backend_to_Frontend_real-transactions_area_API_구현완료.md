# 백엔드 API 구현 완료 - 실거래가 영역(반경) 필터 API

**작성일**: 2025-10-06  
**작성자**: Backend Team  
**참조**: [251006_Frontend_to_Backend_real-transactions_area_API_요청.md](../../receive/Request/251006_Frontend_to_Backend_real-transactions_area_API_요청.md)

---

## 📋 구현 개요

프론트엔드 팀에서 요청하신 **실거래가 영역(반경) 필터 API**가 구현 완료되어 전달드립니다.

### ✅ 구현 완료 항목

- [x] 엔드포인트: `GET /api/v1/real-transactions/area`
- [x] 필수 파라미터: `lat`, `lng`, `radius_km` (0.5~10km)
- [x] 선택 파라미터: `sido`, `sigungu`, `admin_dong_name`, `size`, `ordering`, `page`
- [x] 좌표 유효성 검증 (한국 좌표 범위)
- [x] 반경 제한 검증 (0.5~10km)
- [x] 좌표 결측값 자동 필터링
- [x] 요청서 스펙에 맞는 응답 형식
- [x] 프론트엔드 공통 simple 키 제공
- [x] 로깅 및 에러 처리
- [x] 테스트 검증 완료

---

## 🎯 API 명세

### **엔드포인트**

```
GET /api/v1/real-transactions/area
```

### **요청 파라미터**

#### 필수 파라미터

| 파라미터 | 타입 | 제약 | 설명 | 예시 |
|---------|------|------|------|------|
| `lat` | float | 필수 | 중심 위도 (33.0~39.0) | `37.5665` |
| `lng` | float | 필수 | 중심 경도 (124.0~132.0) | `126.9780` |
| `radius_km` | float | 필수, 0.5~10.0 | 반경(km) | `1.0` |

#### 선택 파라미터

| 파라미터 | 타입 | 기본값 | 설명 | 예시 |
|---------|------|--------|------|------|
| `sido` | string | None | 시도 | `서울특별시` |
| `sigungu` | string | None | 시군구 | `강남구` |
| `admin_dong_name` | string | None | 읍면동 | `대치동` |
| `size` | integer | 1000 | 최대 반환 개수 (1~5000) | `1000` |
| `ordering` | string | `-contract_date` | 정렬 기준 | `-contract_date` |
| `page` | integer | 1 | 페이지 번호 | `1` |

---

### **응답 형식**

#### 성공 응답 (200 OK)

```json
{
  "items": [
    {
      // === 전체 필드 (57개) ===
      "id": 2031959,
      "sido": "경기도",
      "sigungu": "고양시 일산동구",
      "road_address_real": "경기도 고양시 일산동구 강송로125번길 52",
      "building_name_real": "흰돌마을6(라이프)",
      "exclusive_area_sqm": 75.57,
      "transaction_amount": 43000,
      "price_per_pyeong": 1877,
      "contract_year": 2023,
      "contract_month": 8,
      "contract_day": 15,
      "contract_date": "2023-08-15",
      "construction_year_real": 1994,
      "floor_info_real": "3",
      "floor_confirmation": "일반층",
      "elevator_available": false,
      "latitude": 37.64849863,
      "longitude": 126.7832692,
      "transaction_type": "중개거래",
      "buyer_type": "개인",
      "seller_type": "개인",
      // ... (나머지 필드 생략)
      
      // === 🌟 프론트엔드 공통 simple 키 ===
      "address": "경기도 고양시 일산동구 강송로125번길 52",
      "lat": 37.64849863,
      "lng": 126.7832692,
      "area": 75.57,
      "build_year": 1994,
      "price": 43000,
      "price_basis": "transaction_amount"
    }
    // ... 더 많은 아이템
  ],
  "total_items": 127,
  "page": 1,
  "size": 1000,
  "filter_info": {
    "center": {
      "lat": 37.5665,
      "lng": 126.9780
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

#### 에러 응답

**1. 좌표 범위 초과 (400 Bad Request)**

```json
{
  "detail": {
    "error": "Invalid latitude",
    "message": "위도는 33.0~39.0 범위여야 합니다.",
    "provided": 50.0
  }
}
```

**2. 반경 제한 초과 (422 Unprocessable Entity)**

```json
{
  "detail": [
    {
      "type": "less_than_equal",
      "loc": ["query", "radius_km"],
      "msg": "Input should be less than or equal to 10",
      "input": "15.0"
    }
  ]
}
```

**3. 필수 파라미터 누락 (422 Unprocessable Entity)**

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["query", "lat"],
      "msg": "Field required"
    }
  ]
}
```

---

## 📖 사용 예시

### **1. 기본 사용 (서울 강남역 반경 1km)**

```typescript
const response = await realTransactionApi.getTransactionsByArea({
  lat: 37.4979,
  lng: 127.0276,
  radius_km: 1.0,
  sido: "서울특별시",
  sigungu: "강남구",
  size: 1000,
  ordering: "-contract_date"
});

console.log(`총 ${response.total_items}건 검색`);
console.log(`반환: ${response.items.length}건`);
```

### **2. 지도 마커 표시**

```typescript
// 원 그리기 이벤트
const circleCenter = { lat: 37.5665, lng: 126.9780 };
const circleRadiusM = 1000; // 1km = 1000m

// API 호출
const response = await realTransactionApi.getTransactionsByArea({
  lat: circleCenter.lat,
  lng: circleCenter.lng,
  radius_km: circleRadiusM / 1000, // m → km 변환
  size: 5000,
  ordering: "-contract_date"
});

// 마커 표시 (공통 simple 키 사용)
response.items.forEach((item) => {
  const marker = new google.maps.Marker({
    position: { lat: item.lat, lng: item.lng },
    map: map,
    title: `${item.price.toLocaleString()}만원`
  });
});
```

### **3. 지역 필터 조합**

```typescript
// 경기도 고양시 + 반경 2km (AND 조건)
const response = await realTransactionApi.getTransactionsByArea({
  lat: 37.6,
  lng: 126.9,
  radius_km: 2.0,
  sido: "경기도",
  sigungu: "고양시 일산동구",
  size: 1000
});

// 두 조건을 모두 만족하는 데이터만 반환됨
```

---

## 🔧 기술 구현 세부사항

### **1. 반경 계산 방식**

현재 **Bounding Box 근사 방식** 사용:

```python
lat_delta = radius_km / 111.0
lng_delta = radius_km / (111.0 * max(0.1, cos(radians(center_lat))))
```

- 빠른 성능
- 대부분의 경우 정확도 충분
- 향후 PostGIS `ST_DWithin` 업그레이드 가능

### **2. 좌표 결측값 필터링**

자동으로 다음 데이터를 제외:
- `latitude IS NULL` 또는 `longitude IS NULL`
- `latitude = 0 AND longitude = 0` (명백한 오류)

### **3. 정렬 지원**

지원 컬럼 (5개):
- `contract_date` (기본값: 최신순)
- `transaction_amount`
- `exclusive_area_sqm`
- `construction_year_real`
- `price_per_pyeong`

Django 스타일: `-field` (내림차순), `field` (오름차순)

---

## 🧪 테스트 결과

### **테스트 환경**
- 로컬 개발 서버: `http://localhost:8000`
- 테스트 스크립트: `test_area_api.py`

### **테스트 케이스 결과**

| # | 테스트 | 결과 | 상태 코드 |
|---|--------|------|-----------|
| 1 | 정상 케이스 | ✅ | 200 |
| 2 | 반경 제한 초과 (15km) | ✅ | 422 |
| 3 | 좌표 누락 | ✅ | 422 |
| 4 | 데이터 없음 (바다) | ✅ | 200 |
| 5 | 지역 + 반경 조합 | ✅ | 200 |
| 6 | 잘못된 좌표 (범위 외) | ✅ | 400 |

**결과**: 6/6 통과 (100%) ✅

---

## 📊 성능 특성

| 항목 | 값 | 비고 |
|------|-----|------|
| 최대 반환 개수 | 5000건 | `size` 파라미터로 조정 |
| 권장 반환 개수 | 1000건 | 기본값 |
| 반경 범위 | 0.5~10km | 안전 가드 |
| 응답 크기 (1000건) | ~200KB | 압축 전 |
| 평균 응답 시간 | <500ms | 인덱스 최적화 시 |

---

## 🔗 프론트엔드 통합 가이드

### **1. API 클라이언트 추가**

`Application/lib/api.ts`에 추가:

```typescript
// 🆕 반경 내 실거래가 조회
export const getTransactionsByArea = async (params: {
  lat: number;
  lng: number;
  radius_km: number;
  sido?: string;
  sigungu?: string;
  admin_dong_name?: string;
  size?: number;
  ordering?: string;
  page?: number;
}): Promise<RealTransactionAreaResponse> => {
  const queryParams = new URLSearchParams(
    Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  const response = await fetch(
    `${API_BASE_URL}/api/v1/real-transactions/area?${queryParams}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch transactions by area: ${response.status}`);
  }

  return response.json();
};
```

### **2. 타입 정의 추가**

```typescript
interface RealTransactionAreaResponse {
  items: RealTransactionItem[];
  total_items: number;
  page: number;
  size: number;
  filter_info: {
    center: { lat: number; lng: number };
    radius_km: number;
    region: {
      sido: string | null;
      sigungu: string | null;
      admin_dong_name: string | null;
    };
  };
}

interface RealTransactionItem {
  // 전체 필드 (57개)
  id: number;
  sido: string;
  sigungu: string;
  // ... 생략
  
  // 공통 simple 키
  address: string;
  lat: number;
  lng: number;
  area: number;
  build_year: number;
  price: number;
  price_basis: string;
}
```

### **3. 컴포넌트 통합 예시**

```typescript
// SaleSearchResults.tsx
const handleCircleComplete = async (circle: google.maps.Circle) => {
  const center = circle.getCenter();
  const radiusM = circle.getRadius();
  
  try {
    const response = await api.getTransactionsByArea({
      lat: center.lat(),
      lng: center.lng(),
      radius_km: radiusM / 1000,
      sido: filters.sido,
      sigungu: filters.sigungu,
      size: 5000,
      ordering: "-contract_date"
    });
    
    setTransactions(response.items);
    setTotalCount(response.total_items);
    
    // 마커 표시
    displayMarkersOnMap(response.items);
  } catch (error) {
    console.error("Failed to fetch area data:", error);
    showErrorToast("반경 내 데이터 조회 실패");
  }
};
```

---

## 🚨 주의사항

### **1. 단위 변환**

⚠️ **중요**: 프론트엔드에서 반경 단위 변환 필요

```typescript
// Google Maps Circle API는 미터(m) 단위 사용
const circleRadiusM = circle.getRadius(); // 예: 1000

// 백엔드 API는 킬로미터(km) 단위 사용
const apiParams = {
  radius_km: circleRadiusM / 1000  // ✅ m → km 변환
};
```

### **2. 반경 제한**

- **최소**: 0.5km (500m)
- **최대**: 10km (10,000m)
- 범위 외 값 전달 시 422 에러 발생

### **3. 좌표 범위**

- **위도**: 33.0 ~ 39.0 (한국 좌표)
- **경도**: 124.0 ~ 132.0
- 범위 외 값 전달 시 400 에러 발생

### **4. 데이터 없음 처리**

```typescript
if (response.total_items === 0) {
  showInfoToast("선택한 영역에 데이터가 없습니다.");
  return;
}
```

---

## 📚 참고 자료

### **FastAPI 자동 문서**

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- `/api/v1/real-transactions/area` 엔드포인트 확인 가능

### **참고 구현**

- 경매결과 `/auction/area` API (동일한 패턴)
- 실거래가 `/by-address` API (지도 팝업용)

### **로그 이벤트**

```python
# 요청 로그
real_transactions_area_request

# 성공 로그
real_transactions_area_success

# 에러 로그
real_transactions_area_error
```

---

## 🎉 구현 완료 체크리스트

- [x] API 엔드포인트 구현 완료
- [x] 요청서 스펙 100% 준수
- [x] 유효성 검증 구현
- [x] 좌표 결측값 자동 필터링
- [x] 프론트엔드 공통 키 제공
- [x] 로깅 및 에러 처리
- [x] 테스트 검증 완료
- [x] 문서화 완료
- [x] Lint 오류 없음

---

## 📞 문의사항

구현 관련 문의사항이나 추가 요청이 있으시면 언제든지 연락 주세요!

**백엔드 팀**  
2025-10-06

---

## 🔄 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2025-10-06 | 1.0 | 초기 구현 완료 |

---

**감사합니다!** 🚀
