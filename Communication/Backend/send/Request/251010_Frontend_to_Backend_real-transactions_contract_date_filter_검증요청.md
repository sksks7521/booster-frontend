# [요청] 실거래가(매매) contract_date 범위 필터 동작 검증 및 수정 요청

작성일: 2025-10-10
요청자: 프론트엔드(Analysis v2 - sale)
영향 범위: 실거래가(매매) 목록/지도 결과 전부

## 1. 배경 및 현상

- 프론트에서 거래날짜 필터(dateRange)를 설정 시, API 요청에 `contract_date_from`/`contract_date_to` 파라미터가 정상 포함됩니다.
- 확인한 실제 요청 예시:

```
GET /api/v1/real-transactions/?
  floorConfirmation=all&searchField=all&
  sido=경기도&sigungu=경기도 고양시 덕양구&
  ordering=-contract_date&
  contract_date_from=2025-04-10&
  contract_date_to=2025-10-10&
  page=1&size=20
```

- 그러나 응답 데이터가 설정 범위 밖의 레코드를 포함하거나, 범위 필터링이 적용되지 않은 것처럼 보이는 사례가 있습니다. 결과적으로 전체 데이터(또는 과도하게 많은 데이터)가 반환됩니다.

## 2. 기대 동작(명세)

- 파라미터가 포함된 경우, DB 컬럼 `contract_date` 기준으로 아래 조건이 적용되어야 합니다.

```
contract_date_from 존재 시: contract_date >= contract_date_from
contract_date_to   존재 시: contract_date <= contract_date_to
두 값 모두 존재 시: contract_date BETWEEN contract_date_from AND contract_date_to (inclusive)
```

- 정렬 파라미터 `ordering=-contract_date`가 있는 경우, 계약일 내림차순으로 정렬됩니다.

## 3. 재현 절차

1. 브라우저 접속: `http://localhost:3000/analysis/10071/v2?ds=sale`
2. 지역: 시/도 = 경기도, 시군구 = 경기도 고양시 덕양구
3. 거래날짜 범위: 2025-04-10 ~ 2025-10-10
4. 네트워크 탭에서 요청 URL 확인(위 예시와 동일)
5. 응답 목록 중 `contract_date`가 범위를 벗어나는지 확인

## 4. 확인/요청 사항

- [ ] 백엔드에서 `contract_date_from`/`to` 파라미터 처리 로직을 점검 부탁드립니다.
  - SQL 또는 ORM where 절이 `contract_date` 컬럼에 정확히 적용되는지
  - 타입/타임존 변환(문자열→date, date→datetime) 이슈 여부
  - inclusive(이상/이하) 조건인지 확인(경계값 포함)
- [ ] 정렬 `ordering=-contract_date`가 동일 컬럼에 적용되는지
- [ ] 응답 페이로드가 필터 적용 이후의 레코드만 포함하는지

## 5. 추가 정보(프론트 매핑)

- 프론트 UI 키: `dateRange` → 서버 파라미터 매핑 위치:

```ts
// Application/datasets/registry.ts (sale)
if (Array.isArray(allowedFilters.dateRange)) {
  const [startDate, endDate] = allowedFilters.dateRange;
  if (startDate) cleanFilters.contract_date_from = startDate;
  if (endDate) cleanFilters.contract_date_to = endDate;
}
```

- 응답 매핑: `contract_date` → 표 컬럼 `contractDate`

```ts
// Application/datasets/registry.ts (sale adapter)
contractDate: r?.contract_date,
```

## 6. 기대 결과

- 위 범위 파라미터 요청 시, 응답 레코드의 `contract_date`가 모두 [from, to] 구간 내에 존재해야 합니다.

## 7. 확인을 위한 샘플 쿼리

```
-- 의사 SQL
SELECT *
FROM real_transactions
WHERE ( :from IS NULL OR contract_date >= :from )
  AND ( :to   IS NULL OR contract_date <= :to )
ORDER BY contract_date DESC
LIMIT :size OFFSET (:page-1)*:size;
```

## 8. 필요 시 로그 추가 제안

- 수신 파라미터 로그: from/to, ordering, page/size
- 최종 where 절/쿼리 로그(마스킹 가능)

---

검증/수정 후 응답 예시(샘플) 공유해 주시면 프론트에서도 즉시 재검증하겠습니다. 감사합니다.
