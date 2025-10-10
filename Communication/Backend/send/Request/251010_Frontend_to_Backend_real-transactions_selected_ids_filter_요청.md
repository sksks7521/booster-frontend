# [요청] 실거래가(매매) "선택 항목만 보기"용 ID 리스트 서버 필터 지원 요청

작성일: 2025-10-10  
요청자: 프론트엔드(Analysis v2 - sale)

---

## 1) 배경

- UI에서 목록 행을 다중 선택한 뒤 "선택 항목만 보기" 버튼을 누르면 선택한 항목만 필터링해 보고자 합니다.
- 현재는 프론트에서 클라이언트 필터(선택된 `id`만 남기기)로 동작 가능하나, 아래 제약으로 인해 서버 사이드 필터가 필요합니다.
  - 서버 페이지네이션/정렬과 불일치(전역 정렬, total/페이지 범위 계산의 정확도 저하)
  - 선택 건수가 많을 때(> 수백) 클라이언트 필터 비용/UX 저하
  - 지도/다른 뷰와의 일관된 total/페이지 정보를 제공하기 어렵습니다.

## 2) 요청 사항(사양)

서버에서 `id` 리스트로 필터링 할 수 있는 파라미터를 지원 바랍니다.

- 파라미터: `ids` (comma-separated, 정수 배열)

  - 예) `ids=101,205,999`
  - 최대 개수: 500 (권장). 초과 시 400/422 응답 또는 상한 내로 truncate 가능.
  - 중복/비정상 값은 무시(숫자만 허용).

- 동작 규칙

  1. `ids`가 존재하면, 기본 필터는 `id IN (:ids)`를 우선 적용합니다. (다른 필터와 교집합 적용 권장)
  2. `ordering`이 별도로 주어지면 해당 정렬을 우선합니다.
  3. `ordering`이 없고 `ids`만 전달된 경우, 요청 순서대로 반환 옵션을 지원하면 가장 좋습니다.
     - SQL: `ORDER BY FIELD(id, :id1, :id2, ...)` (지원 DB에 맞는 함수 사용)
     - 미지원 시 기본 정렬(`-contract_date`) 유지
  4. `page/size`는 `ids` 필터 적용 후 결과에 대해 적용합니다.
  5. 응답의 `total`은 필터 적용 후 총 개수를 반환합니다.

- 응답 형식: 기존 `/api/v1/real-transactions/`와 동일(`{ items, total }`).

## 3) 호출 예시

```
GET /api/v1/real-transactions/?
  ids=101,205,999&
  ordering=-contract_date&
  page=1&size=100
```

선택 항목만 보기(프론트 사용 시나리오):

- 최초 목록에서 사용자가 체크한 `id` 배열을 수집 → 위 요청으로 교체하여 서버가 필터링/정렬/페이지네이션을 수행.

## 4) 의사 SQL

```sql
-- :ids 는 정수 배열, 빈 경우 필터 미적용
SELECT *
FROM real_transactions
WHERE (:ids_count = 0 OR id = ANY(:ids))
  -- (선택) 다른 필터가 함께 온 경우 교집합 적용
  AND (:sido    IS NULL OR sido = :sido)
  AND (:sigungu IS NULL OR sigungu = :sigungu)
ORDER BY
  CASE WHEN :use_custom_order THEN POSITION(','||id||',' IN :ids_csv) END,
  contract_date DESC; -- custom order 미지원 시 기본 정렬

-- LIMIT/OFFSET 은 요청 page/size 기반으로 적용
```

## 5) 검증 항목

- [ ] `ids` 전달 시 `id IN (...)`으로만 결과가 나오는지 (교집합 규칙 확인)
- [ ] `ordering`과 병행 시 정렬이 적용되는지
- [ ] `page/size` 반영 후 `total` 값이 정확한지
- [ ] 잘못된 값(문자/중복/과다 길이) 처리(무시/상한/에러) 정책 확인

## 6) 에러/제한 제안

- 최대 개수: 500 (협의 가능). 초과 시 422 + 메시지(`ids length exceeded`) 권장
- 빈 배열 또는 모두 무효 값인 경우: `ids` 필터 미적용으로 간주

## 7) 프론트 연동 계획(참고)

- 선택된 `id[]`를 콤마 문자열로 직렬화해 `ids` 파라미터로 요청
- 선택 해제 시 `ids` 파라미터 제거 → 기존 일반 검색으로 복귀

---

서버 구현/배포 후 예시 호출/샘플 응답(10건 내외) 공유 부탁드립니다. 프론트에서 동일 시나리오로 즉시 재검증하겠습니다.
