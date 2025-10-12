## 실거래가(전월세) 목록 API 정렬(ordering) 적용 요청

### 배경/현상

- 프론트엔드는 테이블 헤더 클릭 시 서버사이드 정렬로 위임하며, `ordering` 쿼리 파라미터를 전송하고 있습니다.
- 컬럼 메타(`/api/v1/real-rents/columns`)는 200 OK로 응답하며 정렬 가능 컬럼 정보가 제공됩니다.
- 그러나 동일 필터 조건에서 `ordering=-contract_date`(내림차순)와 `ordering=contract_date`(오름차순) 요청 간 응답 데이터 순서가 바뀌지 않는 사례가 확인되었습니다.

### 대상 엔드포인트

- GET `/api/v1/real-rents/`

### 요청 사항

1. `ordering` 파라미터의 적용을 보장해 주세요.
   - 형식(제안): DRF 표준 규약과 동일
     - 오름차순: `ordering=contract_date`
     - 내림차순: `ordering=-contract_date`
2. 정렬 허용 컬럼 확정 및 컬럼 메타와 일치하도록 유지해 주세요.
   - 예시(메타 기준): `contract_date`, `deposit_amount`, `monthly_rent`, `exclusive_area_sqm`
3. 잘못된 컬럼 지정 시 정책 명시
   - 400 응답으로 에러 반환 또는 무시(기본 정렬 유지) 중 하나를 선택하여 문서화 부탁드립니다.

### 기대 동작(수용 기준)

- A1. 동일 필터 조건에서 `ordering=-contract_date` vs `ordering=contract_date` 두 요청의 상위 레코드 순서가 반대가 됩니다.
- A2. 같은 `ordering`으로 3회 반복 호출 시 결과 순서가 동일합니다(결정적 정렬 보장).
- A3. `/api/v1/real-rents/columns`에서 `sortable=true`인 컬럼들에 대해 모두 `ordering`이 적용됩니다.
- A4. 페이징과 정렬이 결합되어도 일관성 유지(`page/size` 함께 사용 시에도 정렬 결과가 안정적).

### 프론트엔드 구현 개요(참고)

- 헤더 클릭 → 정렬 상태 저장(`sortBy/sortOrder`) → 서버 요청 시 `ordering`으로 변환(camel→snake, `-` 접두로 방향 표기)
- 관련 코드: `Application/components/features/rent/RentSearchResults.tsx`, `Application/datasets/registry.ts`, `Application/hooks/useSortableColumns.ts`, `Application/components/features/item-table.tsx`

### 재현 시나리오(예시, 강남구)

1. 내림차순(최신 계약일자 우선)

```
GET /api/v1/real-rents/?sido=서울특별시&sigungu=서울특별시 강남구&page=1&size=10&ordering=-contract_date
```

2. 오름차순(이전 계약일자 우선)

```
GET /api/v1/real-rents/?sido=서울특별시&sigungu=서울특별시 강남구&page=1&size=10&ordering=contract_date
```

→ 두 응답의 상위 3개 `contract_date`가 역순이어야 합니다.

### 로그/모니터링 제안

- 요청 수신 시 `ordering` 값, 정렬 대상 컬럼/방향, 최종 적용된 SQL ORDER BY를 1줄 로그로 남겨 주시면 프론트/QA가 확인하기 용이합니다.

### 일정 제안

- 백엔드 반영 0.5~1d → 프론트 확인 0.5d

감사합니다.
