# [Backend→Frontend] 실거래가(매매) `/columns` API 구현 완료 및 정렬 필드 확장 (2025-10-03)

## 📋 요약

실거래가(매매) 페이지의 정렬 기능 구현을 위한 `/columns` API가 **이미 구현되어 있었으나**, 프론트엔드가 원하는 형식과 달라 **응답 형식을 개선**했습니다.

추가로 정렬 가능한 필드를 **3개에서 5개로 확장**했습니다.

---

## ✅ 구현 완료 사항

### 1. `/columns` API 응답 형식 개선

**변경 전 (구 형식):**
```json
{
  "total_columns": 20,
  "columns": [
    {
      "name": "contract_date",
      "type": "string",
      "description": "계약 연도",
      "example": "2020"
    }
  ],
  "sortable_columns": [
    "transaction_amount",
    "exclusive_area_sqm",
    "contract_date"
  ]
}
```

**변경 후 (새 형식) ⭐:**
```json
{
  "columns": [
    {
      "key": "contract_date",
      "label": "계약일자",
      "sortable": true
    },
    {
      "key": "transaction_amount",
      "label": "거래금액",
      "sortable": true
    },
    {
      "key": "sido",
      "label": "시도",
      "sortable": false
    }
  ]
}
```

**개선 사항:**
- ✅ `key`, `label`, `sortable` 필드로 통일 (경매 API와 동일)
- ✅ 각 컬럼마다 정렬 가능 여부 명시
- ✅ 불필요한 필드 제거 (`type`, `example`, `total_columns`)
- ✅ 프론트엔드 코드 재사용 가능

---

### 2. 정렬 가능 필드 확장

**기존 (3개):**
- `contract_date` (계약일자)
- `transaction_amount` (거래금액)
- `exclusive_area_sqm` (전용면적)

**추가 (2개):**
- `construction_year_real` (건축연도) ⭐ 신규
- `price_per_pyeong` (평단가) ⭐ 신규

**총 5개 정렬 가능!**

---

## 📊 API 상세 정보

### 엔드포인트

```
GET /api/v1/real-transactions/columns
```

### 응답 예시 (전체)

```json
{
  "columns": [
    {
      "key": "contract_date",
      "label": "계약일자",
      "sortable": true
    },
    {
      "key": "transaction_amount",
      "label": "거래금액",
      "sortable": true
    },
    {
      "key": "exclusive_area_sqm",
      "label": "전용면적(㎡)",
      "sortable": true
    },
    {
      "key": "construction_year_real",
      "label": "건축연도",
      "sortable": true
    },
    {
      "key": "price_per_pyeong",
      "label": "평단가",
      "sortable": true
    },
    {
      "key": "id",
      "label": "ID",
      "sortable": false
    },
    {
      "key": "sido",
      "label": "시도",
      "sortable": false
    },
    {
      "key": "sigungu",
      "label": "시군구",
      "sortable": false
    },
    {
      "key": "admin_dong_name",
      "label": "읍면동",
      "sortable": false
    },
    {
      "key": "road_address_real",
      "label": "도로명주소",
      "sortable": false
    },
    {
      "key": "building_name_real",
      "label": "건물명",
      "sortable": false
    },
    {
      "key": "exclusive_area_range",
      "label": "전용면적 범위",
      "sortable": false
    },
    {
      "key": "land_rights_area_sqm",
      "label": "대지권면적(㎡)",
      "sortable": false
    },
    {
      "key": "contract_year",
      "label": "계약 연도",
      "sortable": false
    },
    {
      "key": "contract_month",
      "label": "계약 월",
      "sortable": false
    },
    {
      "key": "contract_day",
      "label": "계약 일",
      "sortable": false
    },
    {
      "key": "floor_info_real",
      "label": "층",
      "sortable": false
    },
    {
      "key": "construction_year_range",
      "label": "건축연도 범위",
      "sortable": false
    },
    {
      "key": "transaction_type",
      "label": "거래유형",
      "sortable": false
    },
    {
      "key": "buyer_type",
      "label": "매수자",
      "sortable": false
    },
    {
      "key": "seller_type",
      "label": "매도자",
      "sortable": false
    },
    {
      "key": "longitude",
      "label": "경도",
      "sortable": false
    },
    {
      "key": "latitude",
      "label": "위도",
      "sortable": false
    },
    {
      "key": "created_at",
      "label": "생성 시각",
      "sortable": false
    }
  ]
}
```

---

## 🎯 프론트엔드 사용 가이드

### TypeScript 예시

```typescript
// 1. /columns API 호출
interface Column {
  key: string;
  label: string;
  sortable: boolean;
}

interface ColumnsResponse {
  columns: Column[];
}

const response = await fetch('/api/v1/real-transactions/columns');
const data: ColumnsResponse = await response.json();

// 2. 정렬 가능한 컬럼만 필터링
const sortableColumns = data.columns.filter(col => col.sortable);
console.log(sortableColumns);
// [
//   { key: "contract_date", label: "계약일자", sortable: true },
//   { key: "transaction_amount", label: "거래금액", sortable: true },
//   { key: "exclusive_area_sqm", label: "전용면적(㎡)", sortable: true },
//   { key: "construction_year_real", label: "건축연도", sortable: true },
//   { key: "price_per_pyeong", label: "평단가", sortable: true }
// ]

// 3. 테이블 헤더에 정렬 버튼 추가
data.columns.forEach(col => {
  if (col.sortable) {
    // 정렬 가능한 컬럼에만 화살표 아이콘 표시
    renderSortableHeader(col.key, col.label);
  } else {
    // 정렬 불가능한 컬럼은 일반 헤더
    renderHeader(col.label);
  }
});

// 4. 정렬 파라미터 생성
function handleSort(columnKey: string, order: 'asc' | 'desc') {
  const ordering = order === 'desc' ? `-${columnKey}` : columnKey;
  fetchData({ ordering }); // ordering=-transaction_amount
}
```

---

## 🔍 정렬 파라미터 형식

### Django 스타일 (현재 지원 ✅)

**형식:**
```
ordering=[-]field_name
```

**예시:**
```bash
# 계약일 내림차순 (최신순) - 권장 기본값
GET /api/v1/real-transactions/?ordering=-contract_date

# 거래금액 오름차순 (저렴한순)
GET /api/v1/real-transactions/?ordering=transaction_amount

# 거래금액 내림차순 (비싼순)
GET /api/v1/real-transactions/?ordering=-transaction_amount

# 건축연도 내림차순 (최신 건물순) ⭐ 신규
GET /api/v1/real-transactions/?ordering=-construction_year_real

# 평단가 오름차순 (저렴한순) ⭐ 신규
GET /api/v1/real-transactions/?ordering=price_per_pyeong
```

---

## ✅ 정렬 가능 필드 5개

| key | label | 설명 | 예시 |
|-----|-------|------|------|
| `contract_date` | 계약일자 | 계약 연/월/일 복합 정렬 | `ordering=-contract_date` (최신순) |
| `transaction_amount` | 거래금액 | 거래금액(만원) | `ordering=-transaction_amount` (비싼순) |
| `exclusive_area_sqm` | 전용면적(㎡) | 전용면적 제곱미터 | `ordering=-exclusive_area_sqm` (넓은순) |
| `construction_year_real` | 건축연도 | 건축연도 | `ordering=-construction_year_real` (최신순) ⭐ |
| `price_per_pyeong` | 평단가 | 평당 가격(만원) | `ordering=-price_per_pyeong` (비싼순) ⭐ |

---

## 🧪 테스트 결과

### `/columns` API 테스트
```bash
GET /api/v1/real-transactions/columns

✅ 상태: 200
✅ columns 개수: 24
✅ 정렬 가능 컬럼: 5개
✅ 정렬 불가능 컬럼: 19개
✅ 응답 형식: key/label/sortable 확인됨
```

### 새로운 정렬 필드 테스트

**건축연도 정렬:**
```bash
GET /?ordering=construction_year_real&page=1&size=3
→ ✅ [1910, 1938, 1955] (오래된순 정렬 성공)

GET /?ordering=-construction_year_real&page=1&size=3
→ ✅ [2024, 2023, 2023] (최신순 정렬 성공)
```

**평단가 정렬:**
```bash
GET /?ordering=price_per_pyeong&page=1&size=3
→ ✅ [23, 23, 24] (저렴한순 정렬 성공)

GET /?ordering=-price_per_pyeong&page=1&size=3
→ ✅ [30200, 29747, 28822] (비싼순 정렬 성공)
```

---

## 🎨 프론트엔드 질문 답변

### Q1. 정렬 가능한 필드 목록

**✅ 답변:**
총 5개 필드 지원
- `contract_date` (계약일자)
- `transaction_amount` (거래금액)
- `exclusive_area_sqm` (전용면적)
- `construction_year_real` (건축연도) ⭐ 신규
- `price_per_pyeong` (평단가) ⭐ 신규

---

### Q2. 기본 정렬 순서

**✅ 권장:**
```typescript
defaultOrdering: '-contract_date' // 계약일 내림차순 (최신 거래부터)
```

**이유:**
- 사용자가 가장 최근 거래를 먼저 보고 싶어함
- 경매 API도 동일한 패턴 (`-sale_date`)

---

### Q3. 복수 정렬 지원 여부

**❌ 미지원**

현재는 단일 정렬만 지원합니다.
```bash
# 지원
ordering=-contract_date

# 미지원
ordering=-contract_date,transaction_amount
```

**필요 시:**
향후 구현 가능합니다. 필요하시면 요청해주세요.

---

## 🔄 경매 API와의 일관성

| 항목 | 경매(auction_ed) | 실거래가(real_transactions) | 일치 |
|------|------------------|---------------------------|------|
| **API 경로** | `/api/v1/auction/columns` | `/api/v1/real-transactions/columns` | ✅ 동일 패턴 |
| **응답 형식** | `key`/`label`/`sortable` | `key`/`label`/`sortable` | ✅ 동일 |
| **정렬 파라미터** | `ordering=-sale_date` | `ordering=-contract_date` | ✅ 동일 |
| **복수 정렬** | 미지원 | 미지원 | ✅ 동일 |

**장점:**
- 프론트엔드 코드 재사용 가능
- 학습 곡선 감소
- 유지보수 용이

---

## 📝 변경 내역

### Backend 파일

1. **`app/schemas/real_transaction.py`**
   - `ColumnInfo` 스키마 변경: `name`/`type`/`description` → `key`/`label`/`sortable`
   - `ColumnsResponse` 간소화: `total_columns`, `sortable_columns` 제거

2. **`app/api/v1/endpoints/real_transactions.py`**
   - `_get_columns_metadata()` 함수 전면 수정
   - 한글 label 제공
   - 각 컬럼에 `sortable` 정보 포함
   - `/columns` 엔드포인트 응답 로직 간소화

3. **`app/crud/crud_real_transaction.py`**
   - 정렬 화이트리스트 확장: 3개 → 5개
   - `construction_year_real`, `price_per_pyeong` 정렬 로직 추가

---

## 🚀 다음 단계

### 프론트엔드 작업

1. **`/columns` API 통합**
   ```typescript
   const { columns } = await fetchColumns();
   const sortable = columns.filter(c => c.sortable);
   ```

2. **테이블 헤더 정렬 버튼 추가**
   - `sortable: true`인 컬럼에만 화살표 아이콘
   - 클릭 시 `ordering` 파라미터 변경

3. **기본 정렬 설정**
   ```typescript
   initialOrdering: '-contract_date'
   ```

4. **정렬 상태 UI 표시**
   - 현재 정렬 중인 컬럼 하이라이트
   - 오름차순/내림차순 아이콘

---

## 📞 추가 지원

### 필요 시 추가 구현 가능 항목

1. **복수 정렬**
   - 예: `ordering=-contract_date,transaction_amount`
   - 필요하시면 요청해주세요

2. **추가 정렬 필드**
   - 다른 필드도 정렬 가능하게 만들 수 있습니다
   - 필요한 필드 알려주세요

3. **정렬 성능 개선**
   - 인덱스 추가 등

---

## ✅ 체크리스트

**백엔드:**
- [x] `/columns` API 응답 형식 개선
- [x] 정렬 가능 필드 5개로 확장
- [x] 한글 label 제공
- [x] 테스트 완료
- [x] 문서 작성

**프론트엔드 (다음 작업):**
- [ ] `/columns` API 호출 코드 작성
- [ ] 정렬 버튼 UI 구현
- [ ] `ordering` 파라미터 통합
- [ ] 기본 정렬 설정 (`-contract_date`)
- [ ] 통합 테스트

---

## 📌 요약

✅ **`/columns` API 준비 완료!**
- 프론트엔드가 원하는 형식으로 응답
- 정렬 가능 필드 5개 지원
- 경매 API와 일관된 패턴

✅ **정렬 파라미터 지원!**
- Django 스타일 `ordering=-field_name`
- 루트(`/`) 및 `/full` 엔드포인트 지원
- 5개 필드 정렬 가능

✅ **즉시 사용 가능!**
- 추가 백엔드 작업 불필요
- 프론트엔드 작업만 진행하면 됩니다

---

**궁금한 점이나 추가 요청 사항이 있으시면 언제든지 알려주세요!** 🙏

