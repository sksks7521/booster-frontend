### [요청] 프론트엔드: 통합 분석 화면을 위한 매물 목록 API 개발 요청

**1. 요청 일시:** 2025-08-06
**2. 요청자:** 프론트엔드 팀
**3. 관련 문서:**

- `Doc/PRD.md` (기능 1: 통합 분석 화면, C. 물건 정보 및 분석 API 명세)
- `Doc/FRONTEND_ARCHITECTURE.md` (4.2. 데이터 흐름 다이어그램)

---

### **4. 요청 배경 (Why)**

프론트엔드 개발 로드맵의 **Phase 2: 통합 분석 화면 개발**을 진행 중입니다.

현재 필터링 UI 및 전역 상태 관리(Zustand) 리팩토링까지 완료되었으나, 화면에 표시할 실제 매물 데이터가 없어 개발이 **차단(Blocked)**된 상태입니다. `mock` 데이터를 실제 서버 데이터로 교체하고 `SWR`을 이용한 데이터 연동(Step 3)을 진행하기 위해, PRD에 명시된 `GET /api/v1/items` 엔드포인트의 조속한 개발 및 배포가 필요합니다.

---

### **5. 상세 요구사항 (What)**

#### **5-1. Endpoint & Method**

- **Method:** `GET`
- **Endpoint:** `/api/v1/items`

#### **5-2. Query Parameters (쿼리 파라미터)**

프론트엔드의 `filterStore` 상태에 기반하여, 아래와 같은 쿼리 파라미터를 조합하여 요청을 보낼 예정입니다. 모든 파라미터는 선택적(Optional)입니다.

| 파라미터 명     | 타입      | 설명                                 | 예시                     |
| :-------------- | :-------- | :----------------------------------- | :----------------------- |
| `region`        | `string`  | 지역 코드 (e.g., 'seoul')            | `?region=seoul`          |
| `buildingType`  | `string`  | 건물 유형 코드 (e.g., 'villa')       | `?buildingType=villa`    |
| `minPrice`      | `number`  | 최소 가격 (만원)                     | `?minPrice=10000`        |
| `maxPrice`      | `number`  | 최대 가격 (만원)                     | `?maxPrice=30000`        |
| `minArea`       | `number`  | 최소 면적 (평)                       | `?minArea=10`            |
| `maxArea`       | `number`  | 최대 면적 (평)                       | `?maxArea=30`            |
| `minBuildYear`  | `number`  | 최소 건축연도                        | `?minBuildYear=2010`     |
| `maxBuildYear`  | `number`  | 최대 건축연도                        | `?maxBuildYear=2020`     |
| `floor`         | `string`  | 층수 코드 (e.g., '1-3')              | `?floor=1-3`             |
| `hasElevator`   | `boolean` | 엘리베이터 유무                      | `?hasElevator=true`      |
| `hasParking`    | `boolean` | 주차장 유무                          | `?hasParking=true`       |
| `auctionStatus` | `string`  | 경매 상태 코드 (e.g., 'ongoing')     | `?auctionStatus=ongoing` |
| `page`          | `number`  | 페이지 번호 (페이지네이션용)         | `?page=1`                |
| `limit`         | `number`  | 페이지 당 아이템 수 (페이지네이션용) | `?limit=20`              |

#### **5-3. 성공 응답 (Success Response)**

- **Status Code:** `200 OK`
- **Content-Type:** `application/json`
- **Body Structure:** 프론트엔드의 `PropertyItem` 타입과 일치하는 객체의 배열을 포함해야 합니다. 또한, 페이지네이션을 위한 전체 아이템 개수도 포함해 주세요.

```json
{
  "totalItems": 123,
  "items": [
    {
      "id": "1",
      "title": "서울 강남구 역삼동 빌라",
      "address": "서울특별시 강남구 역삼동 123-45",
      "price": 45000,
      "area": 25,
      "buildYear": 2010,
      "lat": 37.5,
      "lng": 127.03,
      "auctionDate": "2024-02-15",
      "status": "scheduled",
      "floor": "3층",
      "hasElevator": true,
      "hasParking": true,
      "estimatedValue": 52000
    },
    {
      // ... more items
    }
  ]
}
```

---

### **6. 희망 완료일**

- **2025-08-08 (금)**

프론트엔드 개발의 병목 현상을 해결하기 위해, 위 명시된 희망일까지 개발 완료를 간곡히 요청드립니다.
