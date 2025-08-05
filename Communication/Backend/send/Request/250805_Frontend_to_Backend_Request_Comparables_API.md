### [요청] 프론트엔드: 상세 분석 화면을 위한 비교 매물 데이터 API 개발 요청

**1. 요청 일시:** 2025-08-05
**2. 요청자:** 프론트엔드 팀
**3. 관련 문서:**

- `Doc/PRD.md` (기능 2: 상세 분석 화면, 비교 분석 기능)
- `Doc/FRONTEND_ARCHITECTURE.md` (4.2. 데이터 흐름 다이어그램)
- `PROJECT_FRONTEND_ROADMAP.md` (Phase 3: Task 4.2.2)

---

### **4. 요청 배경 (Why)**

프론트엔드 개발 로드맵의 **Phase 3: 상세 분석 화면 개발** 중 '비교 데이터 분석 기능'을 구현하기 위해 필요합니다.

현재 `useItemDetail` 훅을 통한 개별 매물 상세 정보는 구현되었으나, 해당 매물과 **유사한 매물들의 비교 데이터**를 가져오는 API가 없어 비교 분석 탭 기능 개발이 **차단(Blocked)**된 상태입니다.

---

### **5. 상세 요구사항 (What)**

#### **5-1. Endpoint & Method**

- **Method:** `GET`
- **Endpoint:** `/api/v1/items/{item_id}/comparables`

#### **5-2. Path Parameters**

| 파라미터 명 | 타입     | 설명                  | 예시                            |
| :---------- | :------- | :-------------------- | :------------------------------ |
| `item_id`   | `string` | 기준이 되는 매물의 ID | `/api/v1/items/123/comparables` |

#### **5-3. Query Parameters (선택적)**

| 파라미터 명 | 타입     | 설명                              | 예시             |
| :---------- | :------- | :-------------------------------- | :--------------- |
| `radius`    | `number` | 검색 반경 (km, 기본값: 1)         | `?radius=2`      |
| `limit`     | `number` | 최대 비교 매물 수 (기본값: 10)    | `?limit=5`       |
| `sort`      | `string` | 정렬 기준 (distance, price, area) | `?sort=distance` |

#### **5-4. 성공 응답 (Success Response)**

- **Status Code:** `200 OK`
- **Content-Type:** `application/json`
- **Body Structure:** 기준 매물과 유사한 매물들의 배열과 비교 통계 정보

```json
{
  "baseItem": {
    "id": "123",
    "title": "서울 강남구 역삼동 빌라",
    "price": 45000,
    "area": 25,
    "buildYear": 2010
  },
  "comparables": [
    {
      "id": "124",
      "title": "서울 강남구 역삼동 빌라 2",
      "address": "서울특별시 강남구 역삼동 124-46",
      "price": 47000,
      "area": 27,
      "buildYear": 2012,
      "distance": 0.3,
      "pricePerArea": 1741,
      "similarity": 0.85
    }
  ],
  "statistics": {
    "averagePrice": 46500,
    "averagePricePerArea": 1720,
    "priceRange": {
      "min": 42000,
      "max": 50000
    },
    "totalCount": 8
  },
  "marketAnalysis": {
    "priceGradeRelativeToMarket": "average",
    "investmentPotential": "medium",
    "liquidityScore": 7.2
  }
}
```

#### **5-5. 에러 응답**

- **404 Not Found**: 기준 매물이 존재하지 않는 경우
- **400 Bad Request**: 잘못된 파라미터 값

---

### **6. 우선순위 및 희망 완료일**

- **우선순위:** Medium (GET /api/v1/items 완료 후)
- **희망 완료일:** 2025-08-10 (일)

GET /api/v1/items API 개발 완료 후 순차적으로 진행해 주시면 됩니다.

---

### **7. 참고사항**

이 API는 Phase 3의 핵심 기능인 '비교 분석 탭'에서 사용되며, 사용자에게 매물의 시장 내 위치와 투자 가치를 판단할 수 있는 중요한 정보를 제공합니다.
