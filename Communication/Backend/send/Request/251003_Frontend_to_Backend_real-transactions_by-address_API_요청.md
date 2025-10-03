# 백엔드 API 구현 요청 - 주소별 실거래가 조회 API

**작성일**: 2025-10-03  
**요청자**: Frontend Team  
**우선순위**: 높음 (Phase 5 - Step 3 진행 중)

---

## 📋 요청 개요

**목적**: 지도 마커 클릭 시 팝업에서 **같은 주소(건물)의 모든 실거래가 거래 내역**을 표시하기 위한 API가 필요합니다.

**배경**:

- 현재 실거래가 지도에서 마커를 클릭하면 1건의 거래 정보만 표시됩니다.
- 한 건물에는 여러 건의 거래가 존재하므로, **같은 주소의 모든 거래 내역을 조회**하는 API가 필요합니다.
- 경매결과 페이지의 `comparables` API와 유사한 패턴입니다.

---

## 🎯 API 명세

### **엔드포인트**

```
GET /api/v1/real-transactions/by-address
```

또는 기존 API에 파라미터 추가:

```
GET /api/v1/real-transactions?address={주소}&page=1&size=1000
```

---

### **요청 파라미터**

| 파라미터   | 타입    | 필수 | 설명                                                | 예시                                        |
| ---------- | ------- | ---- | --------------------------------------------------- | ------------------------------------------- |
| `address`  | string  | ✅   | 도로명주소 또는 지번주소 (완전 일치 또는 LIKE 검색) | `"경기도 고양시 일산동구 강송로125번길 52"` |
| `size`     | integer | ❌   | 최대 반환 개수 (기본값: 1000)                       | `1000`                                      |
| `ordering` | string  | ❌   | 정렬 기준 (기본값: `-contract_date`)                | `-contract_date`                            |

**주소 매칭 방식:**

- **우선순위 1**: `roadAddressReal` (도로명주소) 완전 일치
- **우선순위 2**: `jibunAddress` (지번주소) 완전 일치
- **대소문자 무시**, **공백 정규화** 권장

---

### **응답 형식**

```json
{
  "items": [
    {
      "id": "2031959",
      "address": "경기도 고양시 일산동구 강송로125번길 52",
      "buildYear": 1994,
      "price": 43000,
      "area": 75.57,
      "lat": 37.64849863,
      "lng": 126.7832692,
      "extra": {
        "buildingName": "흰돌마을",
        "buildingNameReal": "흰돌마을6(라이프)",
        "roadAddressReal": "경기도 고양시 일산동구 강송로125번길 52",
        "jibunAddress": "경기도 고양시 일산동구 백석동 1193",
        "constructionYear": 1994,
        "elevatorAvailable": false,
        "elevatorCount": 0,
        "dongName": "601동",
        "contractYear": 2023,
        "contractMonth": 8,
        "contractDay": 15,
        "contractDate": "2023-08-15",
        "exclusiveAreaSqm": 75.57,
        "exclusiveAreaPyeong": 22.86,
        "landRightsAreaSqm": 88.36,
        "transactionAmount": 43000,
        "pricePerPyeong": 1877,
        "pricePerSqm": 569.01,
        "floorInfoReal": "3",
        "floorConfirmation": "일반층",
        "transactionType": "중개거래",
        "buyerType": "개인",
        "sellerType": "개인"
      }
    },
    {
      "id": "2031960",
      "address": "경기도 고양시 일산동구 강송로125번길 52",
      "buildYear": 1994,
      "price": 43500,
      "area": 75.57,
      "lat": 37.64849863,
      "lng": 126.7832692,
      "extra": {
        "buildingName": "흰돌마을",
        "buildingNameReal": "흰돌마을6(라이프)",
        "roadAddressReal": "경기도 고양시 일산동구 강송로125번길 52",
        "jibunAddress": "경기도 고양시 일산동구 백석동 1193",
        "constructionYear": 1994,
        "elevatorAvailable": false,
        "elevatorCount": 0,
        "dongName": "602동",
        "contractYear": 2023,
        "contractMonth": 9,
        "contractDay": 12,
        "contractDate": "2023-09-12",
        "exclusiveAreaSqm": 75.57,
        "exclusiveAreaPyeong": 22.86,
        "landRightsAreaSqm": 88.36,
        "transactionAmount": 43500,
        "pricePerPyeong": 1903,
        "pricePerSqm": 576.12,
        "floorInfoReal": "2",
        "floorConfirmation": "일반층",
        "transactionType": "중개거래",
        "buyerType": "개인",
        "sellerType": "개인"
      }
    }
    // ... 더 많은 거래 내역
  ],
  "total": 15,
  "page": 1,
  "size": 1000
}
```

---

## 🔧 필수 요구사항

### **1. 결측값 처리 ⚠️ 중요**

- **모든 필드를 반환**해야 합니다.
- 값이 없는 경우 `null`을 반환 (필드 자체를 생략하지 않기)
- ❌ **결측값 때문에 데이터를 필터링하지 않기**
- ❌ **필드가 없다고 에러 반환하지 않기**

**예시:**

```json
{
  "dongName": null, // ✅ 좋음
  "contractMonth": null, // ✅ 좋음
  "floorInfoReal": null // ✅ 좋음
}
```

**잘못된 예시:**

```json
{
  // ❌ dongName 필드 자체가 없음
  "contractMonth": null
  // ❌ floorInfoReal 필드 자체가 없음
}
```

---

### **2. 정렬**

- **기본 정렬**: `contractDate` 내림차순 (최신 거래가 먼저)
- 필요시 `ordering` 파라미터로 변경 가능

---

### **3. 성능**

- 한 건물에 보통 10~100건의 거래가 있음
- 최대 1000건까지 반환 (페이지네이션 없이)
- 1000건 이상인 경우는 드물지만, 그 경우 최신 1000건만 반환

---

### **4. 주소 매칭 정확도**

- 도로명주소 우선 매칭
- 공백, 대소문자 차이 무시
- 가능하면 건물명도 함께 확인하여 정확도 향상

---

## 📊 프론트엔드 활용 방식

### **팝업 UI 구조:**

```
┌─────────────────────────────────────────────┐
│ ☆ 관심물건    🔗 공유               ✕ 닫기 │
├─────────────────────────────────────────────┤
│ 📍 경기도 고양시 일산동구 강송로125번길 52  │ ← 제목
│    [📋 주소 복사]                           │
├─────────────────────────────────────────────┤
│ 🏢 건물 정보                                │
│ ┌─────────────────────────────────────────┐ │
│ │ 건물명      : 흰돌마을 601동            │ │
│ │ 지번주소    : 경기도 고양시... 1193     │ │
│ │ 건축연도    : 1994년                    │ │
│ │ 엘리베이터  : 없음 (X)                  │ │
│ │ 총 거래     : 15건                      │ │ ← API 응답의 total
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ 📊 개별 거래 내역 (15건)      [▼ 펴기]     │
│ ┌─────────────────────────────────────────┐ │
│ │동명│년│월│전용│대지│금액│평│층│확인│    │ │
│ ├─────────────────────────────────────────┤ │
│ │다동│23│8│45.4│42│4,900│356│1│중개│    │ │ ← items[0]
│ │다동│23│9│46.0│43│4,350│312│1│중개│    │ │ ← items[1]
│ │다동│24│5│45.4│42│4,800│348│2│일반│    │ │ ← items[2]
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 📝 프론트엔드 사용 예시

### **API 호출:**

```typescript
// 1. 마커 클릭 시 주소 추출
const address = item.address || item.roadAddress;

// 2. 같은 주소의 모든 거래 조회
const response = await realTransactionApi.getTransactionsByAddress(address);

// 3. 팝업 렌더링
renderSalePopup({
  buildingInfo: response.items[0], // 대표 아이템 (건물 정보)
  transactions: response.items, // 모든 거래 내역
  total: response.total, // 총 거래 건수
});
```

---

## 🧪 테스트 케이스

### **Case 1: 정상 케이스**

**요청:**

```
GET /api/v1/real-transactions/by-address?address=경기도 고양시 일산동구 강송로125번길 52
```

**기대 응답:**

- 해당 주소의 모든 거래 반환
- 최신 거래가 먼저 (contractDate 내림차순)
- 결측값은 `null`로 표시

---

### **Case 2: 결측값 있는 케이스**

**요청:**

```
GET /api/v1/real-transactions/by-address?address=서울특별시 강남구 테헤란로 123
```

**기대 응답:**

```json
{
  "items": [
    {
      "id": "123456",
      "address": "서울특별시 강남구 테헤란로 123",
      "price": 50000,
      "extra": {
        "dongName": null, // ✅ 동명 없음 → null
        "floorInfoReal": null, // ✅ 층수 없음 → null
        "contractMonth": 3, // ✅ 있는 필드
        "elevatorAvailable": true // ✅ 있는 필드
      }
    }
  ]
}
```

---

### **Case 3: 거래 내역 없음**

**요청:**

```
GET /api/v1/real-transactions/by-address?address=존재하지않는주소
```

**기대 응답:**

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "size": 1000
}
```

---

## ⏱️ 예상 일정

- **백엔드 구현**: 1~2일
- **프론트엔드 통합**: 백엔드 완료 후 0.5일
- **테스트 및 검증**: 0.5일

**총 예상**: 2~3일

---

## 📞 문의사항

구현 중 문제가 있거나 추가 정보가 필요하시면 언제든지 연락 주세요!

- 프론트엔드 담당: Frontend Team
- 관련 파일:
  - `Application/components/features/map-view.tsx`
  - `Application/components/map/popup/schemas/sale.ts` (생성 예정)
  - `Application/lib/api.ts`

---

**감사합니다!** 🚀
