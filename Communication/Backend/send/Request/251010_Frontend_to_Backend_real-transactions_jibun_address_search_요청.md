# [요청] 실거래가(매매) 지번주소 검색(jibun_address) 지원 요청

작성일: 2025-10-10  
요청자: 프론트엔드(Analysis v2 - sale)  
영향 범위: 실거래가(매매) 목록/지도 결과 전부, 주소 기반 탐색 UX

---

## 1) 배경

- 프론트 필터에 주소 검색 유형 선택(도로명/지번)을 추가했습니다.
- 현재 백엔드는 도로명 주소용 `address_search`(또는 `road_address_search`)만 명확히 보장되어 있고, 지번주소 검색은 명세가 없습니다.
- 지번주소(예: "○○동 123-45")로도 검색이 가능하도록 서버 지원이 필요합니다.

## 2) 제안 파라미터(옵션)

옵션 A(권장, 단일 파라미터):

- `address_search` + `address_search_type`
  - `address_search_type` ∈ { `road`, `jibun`, `both` } (기본: `both`)
  - 동작: 타입에 맞는 컬럼에서 부분일치(ILIKE) 검색

옵션 B(간단, 분리 파라미터):

- `jibun_address_search` (지번주소 부분일치 검색)
- 기존 `address_search`(도로명)와 병행 가능. 둘 다 있을 시 교집합 또는 OR 여부는 정책 선택(권장: OR, 단 둘 다 길이가 충분할 때 교집합 선택 가능)

프론트는 우선 아래 형태로 호출 예정입니다(옵션 A 기준):

```
GET /api/v1/real-transactions/?
  sido=경기도&sigungu=경기도%20고양시%20덕양구&
  address_search=원흥동%20123-45&
  address_search_type=jibun&
  ordering=-contract_date&page=1&size=20
```

옵션 B 기준 예시:

```
GET /api/v1/real-transactions/?
  sido=경기도&sigungu=경기도%20고양시%20덕양구&
  jibun_address_search=원흥동%20123-45&
  ordering=-contract_date&page=1&size=20
```

## 3) 기대 동작(명세)

- 지번주소 컬럼(예: `jibun_address`)에서 부분일치(contains) / 대소문자 무시(ILIKE) / 좌우 공백 trim / 다중 공백 1개로 정규화 후 비교
- 지역 파라미터(sido/sigungu/admin_dong_name)가 함께 들어오면 해당 범위 내 레코드만 대상으로 검색
- 정렬/페이지네이션은 현행 규칙 유지(`ordering`, `page`, `size`)

## 4) 의사 SQL

옵션 A:

```sql
-- :q = 정규화된 검색어, :type in ('road','jibun','both')
WHERE (:sido    IS NULL OR sido = :sido)
  AND (:sigungu IS NULL OR sigungu = :sigungu)
  AND (
        :q IS NULL
        OR (
             (:type = 'road'  AND (road_address_real ILIKE '%'||:q||'%' OR road_address ILIKE '%'||:q||'%'))
          OR (:type = 'jibun' AND  jibun_address      ILIKE '%'||:q||'%')
          OR (:type = 'both'  AND (road_address_real ILIKE '%'||:q||'%' OR road_address ILIKE '%'||:q||'%' OR jibun_address ILIKE '%'||:q||'%'))
        )
      )
ORDER BY contract_date DESC
LIMIT :size OFFSET (:page-1)*:size;
```

옵션 B:

```sql
WHERE (:sido    IS NULL OR sido = :sido)
  AND (:sigungu IS NULL OR sigungu = :sigungu)
  AND (
        (:address_q IS NULL AND :jibun_q IS NULL)
        OR (COALESCE(road_address_real,'') ILIKE '%'||COALESCE(:address_q,'')||'%' OR COALESCE(road_address,'') ILIKE '%'||COALESCE(:address_q,'')||'%')
        OR (COALESCE(jibun_address,'')      ILIKE '%'||COALESCE(:jibun_q,'')||'%')
      )
ORDER BY contract_date DESC
LIMIT :size OFFSET (:page-1)*:size;
```

## 5) 검증 케이스

1. `address_search_type=jibun`, `address_search="원흥동 123-45"` → `jibun_address`에 해당 문자열 포함된 행만 반환
2. `address_search_type=road`, `address_search="고양대로"` → 도로명 포함 행만 반환
3. `address_search_type=both`, `address_search="원흥로 12"` → 도로명/지번 어느 한쪽에라도 포함되면 반환
4. 지역 동시 필터(sido/sigungu) 적용 → 해당 지역 범위 내에서만 검색
5. 페이징/정렬 병행 시 결과 일관성 유지

## 6) 로깅/검증 포인트

- 수신 파라미터: `address_search`, `address_search_type`(또는 `jibun_address_search`), `sido`, `sigungu`, `ordering`, `page`, `size`
- 정규화 후 검색어 값
- 최종 WHERE/ORDER 쿼리(마스킹 가능)

## 7) 프론트 연동(참고)

- 프론트는 이미 주소 유형 선택(도로명/지번)을 구현했고, 선택에 따라 `searchField`를 `address | jibun_address`로 저장합니다.
- 서버가 옵션 A를 채택할 경우, 프론트 매핑을 `address_search` + `address_search_type` 형태로 업데이트할 예정입니다. (옵션 B 채택 시 `jibun_address_search`로 매핑)

---

확인 후 동작 스냅샷 또는 샘플 응답 공유 부탁드립니다. 프론트에서도 동일 시나리오로 즉시 재검증하겠습니다.
