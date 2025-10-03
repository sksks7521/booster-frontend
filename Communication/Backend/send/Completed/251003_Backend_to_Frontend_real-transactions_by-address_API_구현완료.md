# [Backend→Frontend] 주소별 실거래가 조회 API 구현 완료

**작성일**: 2025-10-03  
**응답자**: Backend Team  
**상태**: ✅ Completed  
**우선순위**: 높음 (Phase 5 - Step 3 완료)

---

## 📋 요약

지도 마커 팝업에서 **같은 주소(건물)의 모든 실거래가 거래 내역**을 조회하는 API를 구현했습니다.

**주요 기능:**

- ✅ 주소 기반 전체 거래 내역 조회
- ✅ 동명(dongName) 정보 제공 (35%의 데이터에서 사용 가능)
- ✅ 5개 필드 정렬 지원 (계약일, 금액, 면적, 건축연도, 평단가)
- ✅ 결과가 너무 많을 때 경고 메시지 제공
- ✅ 우편번호, 호수 포맷 정리 (`.0` 제거)
- ✅ 결측값 `null` 처리 (필드 생략 없음)

---

## 🎯 API 명세

### **엔드포인트**

```
GET /api/v1/real-transactions/by-address
```

### **요청 파라미터**

| 파라미터   | 타입    | 필수 | 기본값           | 설명                                      |
| ---------- | ------- | ---- | ---------------- | ----------------------------------------- |
| `address`  | string  | ✅   | -                | 도로명주소 또는 지번주소                  |
| `size`     | integer | ❌   | 1000             | 최대 반환 개수 (1~1000)                   |
| `ordering` | string  | ❌   | `-contract_date` | 정렬 기준 (Django 스타일, `-` = 내림차순) |

**정렬 가능 필드:**

- `contract_date`: 계약일자 (기본값: 최신순)
- `transaction_amount`: 거래금액
- `exclusive_area_sqm`: 전용면적
- `construction_year_real`: 건축연도
- `price_per_pyeong`: 평단가

**주소 매칭 방식:**

- `ILIKE` 연산자 사용 (대소문자 무시, 부분 매칭)
- `road_address_real` OR `jibun_address` 검색
- 공백 정규화 자동 처리

---

## 📤 응답 형식

### **응답 구조**

```typescript
{
  items: RealTransactionByAddressItem[];  // 거래 내역 배열
  total: number;                          // 총 거래 건수
  page: number;                           // 페이지 번호 (항상 1)
  size: number;                           // 요청한 size
  warning?: string | null;                // ⭐ 경고 메시지 (선택적)
}
```

### **경고 메시지 (warning)**

결과가 1000건을 초과할 때 자동으로 추가됩니다:

```json
{
  "warning": "검색 결과가 5,234건으로 너무 많습니다. 상위 1,000건만 표시됩니다. 더 구체적인 주소를 입력하시면 정확한 결과를 확인하실 수 있습니다."
}
```

**프론트엔드 처리 방법:**

```typescript
if (response.warning) {
  // 사용자에게 경고 토스트/배너 표시
  showWarningToast(response.warning);
}
```

---

## 📊 개별 아이템 구조

### **RealTransactionByAddressItem**

```typescript
interface RealTransactionByAddressItem {
  // 최상위 필드 (주요 정보)
  id: number; // 고유 ID
  address: string; // 주소 (도로명 우선, 없으면 지번)
  buildYear: number | null; // 건축연도
  price: number; // 거래금액 (만원)
  area: number; // 전용면적 (㎡)
  lat: number; // 위도
  lng: number; // 경도

  // 중첩 필드 (상세 정보)
  extra: {
    // 건물 정보
    buildingName: string | null; // 건물명 (간단)
    buildingNameReal: string | null; // 건물명 (전체)
    roadAddressReal: string | null; // 도로명주소
    jibunAddress: string | null; // 지번주소
    constructionYear: number | null; // 건축연도

    // 엘리베이터 정보
    elevatorAvailable: boolean | null; // 엘리베이터 유무
    elevatorCount: number | null; // 엘리베이터 대수

    // ⭐ 동명 (35%의 데이터에서 제공)
    dongName: string | null; // 동명 (예: "101동", "가동")

    // 계약 정보
    contractYear: number; // 계약 연도
    contractMonth: number; // 계약 월
    contractDay: number; // 계약 일
    contractDate: string; // 계약일 (YYYY-MM-DD)

    // 면적 정보
    exclusiveAreaSqm: number; // 전용면적 (㎡)
    exclusiveAreaPyeong: number; // 전용면적 (평)
    landRightsAreaSqm: number | null; // 대지권면적 (㎡)

    // 가격 정보
    transactionAmount: number; // 거래금액 (만원)
    pricePerPyeong: number; // 평단가 (만원/평)
    pricePerSqm: number; // ㎡당 가격 (만원/㎡)

    // 층 정보
    floorInfoReal: string | null; // 층 정보 (예: "3", "지하1")
    floorConfirmation: string | null; // 층 확인 (예: "일반층", "반지하")

    // 거래 유형
    transactionType: string | null; // 거래유형 (예: "중개거래")
    buyerType: string | null; // 매수자 유형 (예: "개인")
    sellerType: string | null; // 매도자 유형 (예: "개인")
  };
}
```

---

## 🔧 TypeScript 인터페이스

### **전체 인터페이스**

```typescript
// 응답 타입
interface RealTransactionByAddressResponse {
  items: RealTransactionByAddressItem[];
  total: number;
  page: number;
  size: number;
  warning?: string | null;
}

// 개별 아이템 타입
interface RealTransactionByAddressItem {
  id: number;
  address: string;
  buildYear: number | null;
  price: number;
  area: number;
  lat: number;
  lng: number;
  extra: RealTransactionExtraInfo;
}

// Extra 정보 타입
interface RealTransactionExtraInfo {
  buildingName: string | null;
  buildingNameReal: string | null;
  roadAddressReal: string | null;
  jibunAddress: string | null;
  constructionYear: number | null;
  elevatorAvailable: boolean | null;
  elevatorCount: number | null;
  dongName: string | null; // ⭐ 동명
  contractYear: number;
  contractMonth: number;
  contractDay: number;
  contractDate: string;
  exclusiveAreaSqm: number;
  exclusiveAreaPyeong: number;
  landRightsAreaSqm: number | null;
  transactionAmount: number;
  pricePerPyeong: number;
  pricePerSqm: number;
  floorInfoReal: string | null;
  floorConfirmation: string | null;
  transactionType: string | null;
  buyerType: string | null;
  sellerType: string | null;
}
```

---

## 💻 사용 예제

### **1. 기본 사용법**

```typescript
// API 호출 함수
async function getTransactionsByAddress(
  address: string
): Promise<RealTransactionByAddressResponse> {
  const params = new URLSearchParams({
    address: address,
    size: "1000",
    ordering: "-contract_date", // 최신 거래부터
  });

  const response = await fetch(
    `${API_BASE_URL}/api/v1/real-transactions/by-address?${params}`
  );

  if (!response.ok) {
    throw new Error("거래 내역을 불러올 수 없습니다.");
  }

  return response.json();
}

// 사용 예시
const address = "경기도 고양시 일산동구 강송로125번길 52";
const result = await getTransactionsByAddress(address);

console.log(`총 ${result.total}건의 거래`);
console.log(`표시: ${result.items.length}건`);

// 경고 메시지 처리
if (result.warning) {
  showWarningToast(result.warning);
}
```

### **2. 지도 마커 클릭 시**

```typescript
// 마커 클릭 이벤트
async function handleMarkerClick(item: RealTransactionItem) {
  const address = item.address || item.roadAddress;

  try {
    const response = await getTransactionsByAddress(address);

    // 팝업 렌더링
    renderSalePopup({
      buildingInfo: response.items[0], // 대표 아이템 (건물 정보)
      transactions: response.items, // 모든 거래 내역
      total: response.total, // 총 거래 건수
      warning: response.warning, // 경고 메시지
    });
  } catch (error) {
    showErrorToast("거래 내역을 불러올 수 없습니다.");
  }
}
```

### **3. 정렬 변경**

```typescript
// 거래금액 비싼 순으로 정렬
async function getExpensiveFirst(address: string) {
  const params = new URLSearchParams({
    address: address,
    ordering: "-transaction_amount", // 비싼 순
  });

  return fetch(
    `${API_BASE_URL}/api/v1/real-transactions/by-address?${params}`
  ).then((res) => res.json());
}

// 면적 큰 순으로 정렬
async function getLargestFirst(address: string) {
  const params = new URLSearchParams({
    address: address,
    ordering: "-exclusive_area_sqm", // 큰 면적 순
  });

  return fetch(
    `${API_BASE_URL}/api/v1/real-transactions/by-address?${params}`
  ).then((res) => res.json());
}
```

---

## 🎨 UI 활용 예시

### **팝업 UI 구조**

```
┌─────────────────────────────────────────────┐
│ ☆ 관심물건    🔗 공유               ✕ 닫기 │
├─────────────────────────────────────────────┤
│ 📍 경기도 고양시 일산동구 강송로125번길 52  │
│    [📋 주소 복사]                           │
├─────────────────────────────────────────────┤
│ ⚠️ 검색 결과가 1,234건으로 너무 많습니다.  │  ← warning 표시
│    상위 1,000건만 표시됩니다.               │
├─────────────────────────────────────────────┤
│ 🏢 건물 정보                                │
│ ┌─────────────────────────────────────────┐ │
│ │ 건물명      : 흰돌마을6(라이프)         │ │
│ │ 지번주소    : 경기도 고양시... 1193     │ │
│ │ 건축연도    : 1994년                    │ │
│ │ 엘리베이터  : 없음                      │ │
│ │ 총 거래     : 49건                      │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ 📊 개별 거래 내역 (49건)      [▼ 펴기]     │
│ ┌─────────────────────────────────────────┐ │
│ │동명│년월│전용㎡│거래가│평단가│층│유형│  │ │
│ ├─────────────────────────────────────────┤ │
│ │6동 │25-06│75.6│4,300│1,877│3│중개│    │ │ ← items[0]
│ │6동 │25-05│75.6│4,250│1,854│2│중개│    │ │ ← items[1]
│ │null│25-04│75.6│4,200│1,831│4│중개│    │ │ ← dongName 없음
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### **React 컴포넌트 예시**

```typescript
function SalePopup({ address }: { address: string }) {
  const [data, setData] = useState<RealTransactionByAddressResponse | null>(
    null
  );

  useEffect(() => {
    getTransactionsByAddress(address).then(setData);
  }, [address]);

  if (!data) return <Loading />;

  const building = data.items[0]?.extra;

  return (
    <div className="popup">
      <header>
        <h2>{address}</h2>
      </header>

      {/* 경고 메시지 */}
      {data.warning && <Alert type="warning">{data.warning}</Alert>}

      {/* 건물 정보 */}
      <section>
        <h3>건물 정보</h3>
        <dl>
          <dt>건물명</dt>
          <dd>{building?.buildingNameReal || "-"}</dd>

          <dt>건축연도</dt>
          <dd>{building?.constructionYear}년</dd>

          <dt>엘리베이터</dt>
          <dd>{building?.elevatorAvailable ? "있음" : "없음"}</dd>

          <dt>총 거래</dt>
          <dd>{data.total}건</dd>
        </dl>
      </section>

      {/* 거래 내역 테이블 */}
      <section>
        <h3>개별 거래 내역 ({data.total}건)</h3>
        <table>
          <thead>
            <tr>
              <th>동명</th>
              <th>계약일</th>
              <th>전용면적</th>
              <th>거래금액</th>
              <th>평단가</th>
              <th>층</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id}>
                <td>{item.extra.dongName || "-"}</td>
                <td>{item.extra.contractDate}</td>
                <td>{item.extra.exclusiveAreaPyeong.toFixed(1)}평</td>
                <td>{item.price.toLocaleString()}만원</td>
                <td>{item.extra.pricePerPyeong.toLocaleString()}만원</td>
                <td>{item.extra.floorInfoReal || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

---

## ✅ 테스트 결과

### **Phase 1: 기본 기능**

| 항목           | 결과    | 비고                        |
| -------------- | ------- | --------------------------- |
| 주소 기반 조회 | ✅ 통과 | 49건 조회 성공              |
| camelCase 변환 | ✅ 통과 | 모든 필드 정확              |
| 계산 필드      | ✅ 통과 | 평수, 평단가, ㎡당가격 정확 |
| 날짜 포맷      | ✅ 통과 | YYYY-MM-DD                  |
| 결측값 처리    | ✅ 통과 | null 반환, 필드 생략 없음   |
| 기본 정렬      | ✅ 통과 | 최신순 정상                 |

### **Phase 2: 개선 사항**

| 항목             | 결과    | 비고                         |
| ---------------- | ------- | ---------------------------- |
| dongName 로직    | ✅ 완료 | DB 컬럼 직접 사용 (35% 제공) |
| 정렬 5개 필드    | ✅ 통과 | 10개 테스트 모두 통과        |
| postal_code 수정 | ✅ 완료 | `10253.0` → `10253`          |
| room_number 수정 | ✅ 완료 | `0.0` → `0`                  |
| 경고 메시지      | ✅ 완료 | 1000건 초과 시 표시          |

---

## 🚨 주의사항

### **1. dongName 필드**

- **35%의 데이터만 제공됨** (253,921건 / 727,423건)
- `null`인 경우 UI에서 "-" 또는 "미상"으로 표시 권장
- 없을 때 건물명(`buildingNameReal`)으로 대체 가능

```typescript
const displayDong = item.extra.dongName || item.extra.buildingNameReal || "-";
```

### **2. 경고 메시지 (warning)**

- 결과가 1000건 초과 시에만 표시됨
- 사용자에게 토스트/배너로 안내 권장
- 더 구체적인 주소 입력 유도

```typescript
if (response.warning) {
  toast.warning(response.warning, {
    duration: 5000,
    action: {
      label: "확인",
      onClick: () => toast.dismiss(),
    },
  });
}
```

### **3. 결측값 처리**

- **모든 필드가 응답에 포함됨** (생략 없음)
- 값이 없으면 `null` 반환
- UI에서 fallback 값 지정 필요

```typescript
// 안전한 렌더링
<td>{item.extra.floorInfoReal ?? '-'}</td>
<td>{item.extra.dongName ?? '미상'}</td>
<td>{item.extra.elevatorAvailable ? '있음' : '없음'}</td>
```

### **4. 부분 주소 매칭**

- `ILIKE` 연산자로 부분 매칭 지원
- 너무 광범위한 주소는 결과가 많을 수 있음
- 사용자에게 상세 주소 입력 유도 권장

```typescript
// 너무 광범위
GET /by-address?address=서울
→ total: 50,000건, warning 표시

// 적절
GET /by-address?address=서울특별시 강남구 테헤란로 123
→ total: 10건, warning 없음
```

### **5. postal_code, room_number**

- ✅ `.0` 제거 완료
- 문자열로 반환됨 (숫자 아님)
- UI에서 그대로 표시 가능

```typescript
// 변환 전: "10253.0", "0.0"
// 변환 후: "10253", "0"

<span>{item.extra.postalCode}</span>  // "10253"
<span>{item.extra.roomNumber}</span>   // "0"
```

---

## 📖 관련 문서

- **원본 요청서**: `Communication/Frontend/receive/Request/251003_Frontend_to_Backend_real-transactions_by-address_API_요청.md`
- **백엔드 로그**: `Log/251003.md`
- **스키마 정의**: `app/schemas/real_transaction.py`
- **API 구현**: `app/api/v1/endpoints/real_transactions.py`
- **CRUD 함수**: `app/crud/crud_real_transaction.py`

---

## 📊 예상 응답 샘플

### **정상 케이스 (49건)**

```json
{
  "items": [
    {
      "id": 2031959,
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
        "elevatorCount": null,
        "dongName": "6동",
        "contractYear": 2025,
        "contractMonth": 6,
        "contractDay": 27,
        "contractDate": "2025-06-27",
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
    }
    // ... 48개 더
  ],
  "total": 49,
  "page": 1,
  "size": 1000,
  "warning": null
}
```

### **경고 케이스 (5,000건)**

```json
{
  "items": [
    // ... 1000개 아이템
  ],
  "total": 5000,
  "page": 1,
  "size": 1000,
  "warning": "검색 결과가 5,000건으로 너무 많습니다. 상위 1,000건만 표시됩니다. 더 구체적인 주소를 입력하시면 정확한 결과를 확인하실 수 있습니다."
}
```

### **빈 결과 (0건)**

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "size": 1000,
  "warning": null
}
```

---

## 🔗 API 테스트

### **cURL 예시**

```bash
# 기본 조회
curl "http://127.0.0.1:8000/api/v1/real-transactions/by-address?address=경기도%20고양시%20일산동구%20강송로125번길%2052"

# 정렬 변경 (거래금액 비싼 순)
curl "http://127.0.0.1:8000/api/v1/real-transactions/by-address?address=경기도%20고양시%20일산동구%20강송로125번길%2052&ordering=-transaction_amount"

# 크기 제한
curl "http://127.0.0.1:8000/api/v1/real-transactions/by-address?address=경기도%20고양시%20일산동구%20강송로125번길%2052&size=10"
```

---

## 🎯 구현 완료 체크리스트

- [x] 기본 API 구조 구현
- [x] 주소 기반 검색 (도로명/지번)
- [x] camelCase 응답 형식
- [x] 계산 필드 (평수, 평단가 등)
- [x] 정렬 기능 (5개 필드)
- [x] dongName 정보 제공
- [x] postal_code, room_number 포맷 수정
- [x] 결측값 `null` 처리
- [x] 경고 메시지 (1000건 초과 시)
- [x] 에러 핸들링
- [x] 테스트 완료
- [x] 문서 작성

---

## 📞 문의 및 피드백

구현 과정에서 궁금한 점이나 추가 요청사항이 있으시면 언제든지 연락 주세요!

- **담당자**: Backend Team
- **작업 일시**: 2025-10-03
- **작업 시간**: Phase 1 (2시간) + Phase 2 (2시간)
- **우선순위**: 높음
- **상태**: ✅ **완료 및 배포 준비 완료**

---

**감사합니다!** 🚀
