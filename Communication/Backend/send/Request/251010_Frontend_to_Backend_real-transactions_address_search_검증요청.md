# [요청] 실거래가(매매) 주소 검색(address_search) 필터 동작 검증 및 보완 요청

작성일: 2025-10-10  
요청자: 프론트엔드(Analysis v2 - sale)  
영향 범위: 실거래가(매매) 목록/지도 결과 전부, 사용자의 주소 기반 탐색 UX

---

## 1) 배경/현상

- 프론트는 도로명주소 입력 시 `address_search` 파라미터로 백엔드에 검색을 위임하고 있습니다.
- 실제 호출 예시는 아래와 같습니다.

```
GET /api/v1/real-transactions/?
  sido=경기도&sigungu=경기도%20고양시%20덕양구&
  address_search=고양대로&
  ordering=-contract_date&page=1&size=20
```

- 일부 케이스에서 주소 키워드가 포함된 결과만 반환되지 않거나(부분일치 미적용), 대소문자/공백 차이로 매칭 누락되는 정황이 있습니다. 동작을 명확히 검증하고 필요시 수정이 필요합니다.

## 2) 기대 동작(명세)

주소 검색이 활성화된 경우, 다음 기준으로 필터링이 적용되어야 합니다.

- 검색 대상 컬럼(우선순위)

  1. `road_address_real` (실거래 원문 도로명주소)
  2. `road_address` (보조 도로명주소 컬럼 존재 시)

- 매칭 방식

  - 부분일치(contains) / 대소문자 무시(ILIKE) / 좌우 공백 trim
  - 입력값 내 연속 공백은 단일 공백으로 정규화하여 비교 (예: "고양 대로" → "고양 대로")
  - 한글/영문 혼용, 특수문자(`-`, 공백) 섞여도 자연스럽게 매칭

- 지역 필터(sido/sigungu/admin_dong_name)가 함께 들어온 경우, 주소 검색은 해당 지역 범위 내에서만 동작

## 3) 재현 절차

1. URL: `http://localhost:3000/analysis/10071/v2?ds=sale` 접속
2. 지역 선택: 시/도=경기도, 시군구=경기도 고양시 덕양구
3. 주소 검색: "고양대로", "원흥로", "행신동로" 등 입력 후 검색
4. Network 탭에서 `/api/v1/real-transactions/` 요청의 `address_search` 값 확인
5. 응답 목록의 도로명주소(`road_address_real`/`road_address`)가 검색어를 포함하는지 확인

## 4) 파라미터/매핑 근거(프론트)

프론트 매핑 코드 발췌:

```ts
// Application/datasets/registry.ts (sale)
// 검색 필터 매핑
if (allowedFilters.searchQuery && allowedFilters.searchField) {
  if (allowedFilters.searchField === "address") {
    cleanFilters.address_search = allowedFilters.searchQuery;
  } else if (allowedFilters.searchField === "road_address") {
    cleanFilters.road_address_search = allowedFilters.searchQuery;
  }
  delete cleanFilters.searchQuery;
  delete cleanFilters.searchField;
}
```

프론트 입력(주소검색) → `searchField="address"`, `searchQuery="<사용자 입력>"` → 서버 요청 시 `address_search`로 변환됩니다.

## 5) 서버 측 확인/수정 요청 사항

- [ ] 컨트롤러/쿼리에서 `address_search` 처리 로직 확인
  - WHERE 절에 부분일치/대소문자 무시가 적용되는지 (ILIKE/LOWER LIKE 등)
  - 검색 컬럼 우선순위(`road_address_real` → `road_address`) 적용 확인
  - 양쪽 공백 trim, 다중 공백 정규화 처리 필요 시 추가
- [ ] 지역 파라미터(sido/sigungu/admin_dong_name) 동시 적용 시, 주소 검색 결과가 해당 지역 범위로 제한되는지
- [ ] 정렬/페이지네이션 동작(ordering/page/size)과 병행해도 결과가 일관적인지

## 6) 의사 SQL 예시

```sql
-- :q = 정규화된 address_search (TRIM, MULTI-SPACE → SINGLE SPACE)
SELECT *
FROM real_transactions
WHERE (:sido      IS NULL OR sido = :sido)
  AND (:sigungu   IS NULL OR sigungu = :sigungu)
  AND (
        :q IS NULL
        OR road_address_real ILIKE '%' || :q || '%'
        OR road_address      ILIKE '%' || :q || '%'
      )
ORDER BY contract_date DESC
LIMIT :size OFFSET (:page - 1) * :size;
```

## 7) 테스트 케이스(샘플)

1. `address_search=고양대로` → `road_address_real`/`road_address`에 "고양대로" 포함된 행만 반환
2. `address_search=고양  대로`(다중 공백) → 1과 동일 결과
3. `address_search=GOYANG-DAERO`(영문/하이픈 포함) → 영문 표기 데이터가 있을 경우 매칭(가능 시 대소문자/하이픈 무시)
4. 지역 동시 필터(`sido=경기도`, `sigungu=경기도 고양시 덕양구`) → 덕양구 범위 내 도로명주소만 반환
5. 페이징/정렬 동시 적용 → 각 페이지 결과가 검색어를 포함하면서 `-contract_date` 순서를 유지

## 8) 로깅/검증 포인트

- 수신 파라미터 로그: `sido`, `sigungu`, `address_search`, `ordering`, `page`, `size`
- 정규화 후 검색어(`q`) 값
- 최종 WHERE/ORDER 쿼리(마스킹 가능)

## 9) 기대 결과

- `address_search` 지정 시, 응답 레코드의 도로명주소가 모두 검색어를 포함(부분일치)하며, 지역 조건이 있으면 해당 범위 내로 제한
- 정렬/페이징은 변함없이 동작

---

확인 후 동작 스냅샷 또는 샘플 응답(10건 내외) 공유 부탁드립니다. 프론트에서도 동일 시나리오로 즉시 재검증하겠습니다.
