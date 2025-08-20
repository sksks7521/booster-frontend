# [백엔드→프론트엔드] Items API 추가 컬럼 분석 및 제안 (2025-08-20)

## 1. 요청 분석 결과 (Analysis Results)

✅ **auction_items 테이블 전체 스키마 분석 완료**

- 총 48개 컬럼 보유
- 1,000개 샘플 데이터 기준 분석 완료
- 컬럼별 데이터 존재율 조사 완료

---

## 2. 현재 API vs DB 스키마 비교

### **현재 /api/v1/items/simple 제공 컬럼 (14개)**

| API 필드       | DB 컬럼                       | 데이터 존재율 | 비고                        |
| -------------- | ----------------------------- | ------------- | --------------------------- |
| id             | id                            | 100%          | ✅ 정상                     |
| title          | building_name/location_detail | 0%/100%       | ✅ location_detail 사용     |
| address        | road_address                  | 100%          | ✅ 정상                     |
| price          | minimum_bid_price             | 100%          | ✅ 정상                     |
| area           | building_area_pyeong          | 100%          | ✅ 정상                     |
| buildYear      | construction_year             | 94%           | ✅ 정상                     |
| lat/lng        | latitude/longitude            | 99.6%         | ✅ 정상                     |
| auctionDate    | sale_date                     | 0%            | ❌ **문제**: 모든 값이 NULL |
| status         | current_status                | 100%          | ✅ 정상                     |
| floor          | floor_info                    | 0%            | ❌ **문제**: 모든 값이 NULL |
| hasElevator    | elevator_available            | 100%          | ✅ 정상                     |
| hasParking     | 없음                          | N/A           | ❌ **데이터 없음**          |
| estimatedValue | appraised_value               | 100%          | ✅ 정상                     |

---

## 3. 추가 노출 제안 컬럼 (Priority 기준)

### **🔥 High Priority (즉시 추가 권장)**

| 새 API 필드           | DB 컬럼                | 데이터 존재율 | 사용 목적              | 샘플 값     |
| --------------------- | ---------------------- | ------------- | ---------------------- | ----------- |
| **buildingAreaRange** | building_area_range    | 100%          | 면적 범위 표시         | "15평~20평" |
| **landArea**          | land_area_pyeong       | 98.9%         | 토지 면적 정보         | 18.39       |
| **publicPrice**       | public_price           | 100%          | 공시가격 비교          | 9,210만원   |
| **bidRatio**          | bid_to_appraised_ratio | 100%          | 투자 판단 지표         | 49.0%       |
| **under100Million**   | under_100million       | 100%          | 투자 구분              | "O (이하)"  |
| **saleMonth**         | sale_month             | 100%          | 경매 월 정보           | 8           |
| **actualFloor**       | floor_confirmation     | 100%          | 실제 층수 (floor 대체) | "1층"       |

### **🟡 Medium Priority (선택적 추가)**

| 새 API 필드       | DB 컬럼                 | 데이터 존재율 | 사용 목적      | 샘플 값         |
| ----------------- | ----------------------- | ------------- | -------------- | --------------- |
| **specialRights** | special_rights          | 73.4%         | 권리 관계 정보 | "별도등기"      |
| **regionGroup**   | region_group            | 100%          | 지역 분류      | "etc"           |
| **sido**          | sido                    | 94%           | 시도 정보      | "경기도"        |
| **caseInfo**      | case_number + case_year | 100%          | 사건 정보      | "2024타경12345" |

---

## 4. 문제점 해결 방안

### **❌ 현재 문제되는 필드들**

1. **`auctionDate`** (sale_date): 0% 데이터 → `saleMonth` 대체 제안
2. **`floor`** (floor_info): 0% 데이터 → `actualFloor` (floor_confirmation) 대체 제안
3. **`hasParking`**: 데이터 자체 없음 → 제거 권장

---

## 5. API 확장 방안 제안

### **방안 A: 기존 API 확장 (권장)**

```typescript
// 기존 유지 + 새 필드 추가
interface ItemSimple {
  // 기존 필드들 유지...

  // 새 추가 필드들 (optional)
  buildingAreaRange?: string;
  landArea?: number;
  publicPrice?: number;
  bidRatio?: number;
  under100Million?: string;
  saleMonth?: number;
  actualFloor?: string;
  specialRights?: string;
  regionGroup?: string;
  sido?: string;
}
```

**장점**:

- 기존 코드 호환성 100% 유지
- 새 필드는 `optional`로 안전하게 추가
- 성능 영향 최소화

### **방안 B: 파라미터 기반 확장**

```
GET /api/v1/items/simple?expand=all
GET /api/v1/items/simple?expand=location,price,building
```

**장점**:

- 필요에 따라 선택적 로드 가능
- 성능 최적화 가능

---

## 6. 구현 우선순위 제안

### **Phase 1: 즉시 구현 (이번 주)**

```typescript
// 데이터 품질이 100%인 핵심 필드들
{
  buildingAreaRange: string; // "15평~20평"
  publicPrice: number; // 9210
  bidRatio: number; // 49.0
  saleMonth: number; // 8
  actualFloor: string; // "1층" (기존 floor 대체)
}
```

### **Phase 2: 선택적 구현 (다음 주)**

```typescript
// 투자 판단에 유용한 추가 필드들
{
  landArea?: number;         // 18.39
  under100Million?: string;  // "O (이하)"
  specialRights?: string;    // "별도등기"
  sido?: string;            // "경기도"
}
```

---

## 7. 코드 변경 영향도

### **백엔드 수정 사항**

- ✅ **최소 변경**: `AuctionItemSimple` 스키마에 필드 추가만
- ✅ **DB 쿼리 변경 불요**: 기존 테이블 컬럼 활용
- ✅ **성능 영향 없음**: 추가 JOIN이나 서브쿼리 불필요

### **프론트엔드 수정 사항**

- ✅ **기존 코드 안전**: 새 필드는 모두 optional
- ✅ **점진적 적용 가능**: `(item as any).newField ?? "-"` 패턴 활용
- ✅ **테이블 확장 용이**: 기존 컬럼에 새 컬럼 추가만

---

## 8. 샘플 API 응답 (확장 후)

```json
{
  "totalItems": 1000,
  "items": [
    {
      "id": 1,
      "title": "다세대(빌라) 경기도 화성시 송산면 봉가길 100",
      "address": "경기도 화성시 송산면 봉가길 100",
      "price": 6860,
      "area": 15.49,
      "buildYear": 2015,

      // 🆕 새로 추가되는 필드들
      "buildingAreaRange": "15평~20평",
      "landArea": 18.39,
      "publicPrice": 9210,
      "bidRatio": 49.0,
      "under100Million": "O (이하)",
      "saleMonth": 8,
      "actualFloor": "1층",
      "specialRights": "별도등기",
      "sido": "경기도",

      // 기존 유지
      "lat": 37.21124028,
      "lng": 126.7350413,
      "status": "유찰(2회)",
      "hasElevator": true,
      "estimatedValue": 14000
    }
  ]
}
```

---

## 9. 액션 아이템

### **백엔드 작업 (예상 소요: 30분)**

- [ ] `AuctionItemSimple` 스키마에 새 필드 7개 추가
- [ ] `auction_items.py` 엔드포인트에서 필드 매핑 추가
- [ ] API 테스트 및 검증

### **프론트엔드 확인 필요**

- [ ] Phase 1 필드들 우선 적용 희망 여부 확인
- [ ] 테이블 컬럼 추가 시 UI 레이아웃 영향도 확인
- [ ] 특정 필드 표시 형식 요구사항 (예: bidRatio를 "49.0%" vs "49.0" 중 선택)

---

## 10. 진행 상태

- **Status:** Requested
- **Requester:** 백엔드 팀
- **Assignee:** 프론트엔드 팀
- **Requested At:** 2025-08-20
- **Expected Completion:** 2025-08-21 (Phase 1)

---

**🚀 결론**: 데이터 품질이 우수한 7개 핵심 필드를 우선 추가하여 필터 검증 및 사용자 경험을 크게 개선할 수 있습니다. 기존 코드에 대한 영향은 최소화하면서도 매물 정보의 풍부함을 대폭 향상시킬 수 있는 방안을 제안드립니다.

**다음 단계**: 프론트엔드 팀의 Phase 1 승인 시 즉시 구현 착수 가능합니다.
