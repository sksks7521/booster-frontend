# [Frontend→Backend] 실거래가(매매) 정렬 기능 구현을 위한 `/columns` API 확인 요청 (2025-10-03)

## 1. 요청 개요 (Why?)

- 실거래가(매매) 페이지에서 사용자가 **테이블 컬럼 헤더를 클릭하여 정렬**할 수 있는 기능을 구현하고 있습니다.
- 경매결과(auction_ed) 페이지는 `/api/v1/auction/columns` API를 통해 정렬 가능한 컬럼 목록을 동적으로 가져와서 정렬 기능이 정상 작동 중입니다.
- 실거래가(매매) 페이지도 동일한 패턴으로 정렬 기능을 구현하기 위해, **정렬 가능한 컬럼 정보를 반환하는 API가 필요**합니다.

## 2. 작업 요청 사항 (What & How?)

### ✅ **요청 1: `/columns` API 존재 여부 확인**

다음 엔드포인트가 이미 구현되어 있는지 확인해 주세요:

```
GET /api/v1/real-transactions/columns
```

- **있는 경우**: 응답 형식을 공유해 주세요 (아래 "예상 응답 형식" 참고)
- **없는 경우**: 구현 가능 여부 및 예상 소요 시간을 알려주세요

---

### ✅ **요청 2: 정렬 파라미터 형식 확인**

현재 프론트엔드에서는 다음과 같은 형식으로 정렬 파라미터를 전달하고 있습니다:

**프론트엔드 → 백엔드 변환 로직:**

```typescript
// 예시: 계약일자 내림차순 정렬
sortBy: "contractDate"     // camelCase
sortOrder: "desc"          // "asc" | "desc"

↓ 변환 (camelToSnake)

ordering: "-contract_date"  // 내림차순은 "-" 접두사
```

**백엔드에서 이 형식을 지원하는지 확인해 주세요:**

- [ ] `ordering` 파라미터로 정렬을 받는가? (예: `ordering=-contract_date`)
- [ ] snake_case 필드명을 사용하는가? (예: `contract_date`, `transaction_amount`)
- [ ] 내림차순은 `-` 접두사로 처리하는가? (예: `-contract_date`)

---

## 3. 관련 정보 (Reference)

### 📌 **경매결과 페이지의 `/columns` API 응답 형식 (참고용)**

```json
GET /api/v1/auction/columns

Response:
{
  "columns": [
    {
      "key": "sale_date",
      "label": "매각일자",
      "sortable": true
    },
    {
      "key": "final_sale_price",
      "label": "매각가",
      "sortable": true
    },
    {
      "key": "building_area_pyeong",
      "label": "건축면적",
      "sortable": true
    },
    // ... 더 많은 컬럼들
  ]
}
```

---

### 📌 **실거래가(매매) 예상 응답 형식**

```json
GET /api/v1/real-transactions/columns

Response:
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
      "label": "전용면적",
      "sortable": true
    },
    {
      "key": "price_per_pyeong",
      "label": "평단가",
      "sortable": true
    },
    {
      "key": "construction_year_real",
      "label": "건축연도",
      "sortable": true
    },
    {
      "key": "floor_info_real",
      "label": "층",
      "sortable": false  // 문자열 필드라 정렬 불가능한 경우
    }
    // ... 더 많은 컬럼들
  ]
}
```

---

### 📌 **현재 프론트엔드에서 전달하는 정렬 파라미터 예시**

```
GET /api/v1/real-transactions/?sido=경기도&sigungu=고양시 덕양구&ordering=-transaction_amount&page=1&size=20
```

**파라미터 설명:**

- `ordering=-transaction_amount`: 거래금액 기준 내림차순 정렬
- `ordering=contract_date`: 계약일자 기준 오름차순 정렬

---

### 📌 **프론트엔드 구현 파일**

- `Application/hooks/useSortableColumns.ts` - 정렬 가능 컬럼 관리 훅
- `Application/datasets/registry.ts` - 정렬 파라미터 변환 로직 (line 741-751)
- `Application/lib/api.ts` - API 호출 함수

---

## 4. 진행 상태

- **Status:** Requested
- **Requester:** Frontend 담당자
- **Assignee:** Backend 담당자
- **Requested At:** 2025-10-03
- **Completed At:**
- **History:**
  - 2025-10-03: 요청서 작성 및 전달
  - Phase 4 완료를 위해 정렬 기능 구현 필요

---

## 5. 추가 질문사항

### Q1. 정렬 가능한 필드 목록

현재 `/api/v1/real-transactions/` 엔드포인트에서 **정렬을 지원하는 필드**를 알려주세요:

- 거래금액 (transaction_amount)
- 전용면적 (exclusive_area_sqm)
- 평단가 (price_per_pyeong)
- 계약일자 (contract_date)
- 건축연도 (construction_year_real)
- 기타?

### Q2. 기본 정렬 순서

지역 선택 후 데이터를 처음 로드할 때 **기본 정렬**은 무엇으로 설정하면 좋을까요?

- 제안: `ordering=-contract_date` (계약일자 내림차순 = 최신 거래부터)

### Q3. 복수 정렬 지원 여부

하나의 정렬 키만 지원하나요, 아니면 복수 정렬도 가능한가요?

- 예: `ordering=-contract_date,transaction_amount` (계약일 내림차순 → 금액 오름차순)

---

## 6. 회신 요청 사항

다음 정보를 회신해 주시면 프론트엔드 작업을 즉시 진행하겠습니다:

- [ ] `/api/v1/real-transactions/columns` API 존재 여부
  - 있으면: 응답 샘플 데이터 제공
  - 없으면: 구현 가능 여부 및 예상 일정
- [ ] `ordering` 파라미터 형식 확인 (snake_case, `-` 접두사)
- [ ] 정렬 가능한 필드 목록
- [ ] 기본 정렬 순서 권장사항

---

## 7. 긴급도 및 우선순위

- **우선순위:** 중간 (Phase 4 완료 필수 요소)
- **긴급도:** 3-5일 내 회신 요청
- **영향도:** 실거래가(매매) 페이지 사용성 향상 (정렬 기능 제공)

---

**감사합니다!** 🙏
