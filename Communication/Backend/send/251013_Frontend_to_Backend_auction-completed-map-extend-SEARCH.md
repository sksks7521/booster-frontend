# [Frontend→Backend] /map 검색 파라미터 및 특수권리 토큰 정합성 요청 (251013)

## 배경

- 지도(`/map`)는 "필터 → 거리정렬 → 상한 K" 규칙으로 정상 동작 중입니다.
- 다만 "주소 검색"과 "사건번호 검색"이 `/map`에서 처리되지 않아, 목록/영역과 지도 간 불일치가 남아 있습니다.
- 또한 특수권리(불리언 토글 → 라벨) 매핑 시 토큰 기준을 백엔드와 명시적으로 합의해 두고자 합니다.

## 1) 검색 파라미터 지원 요청

- 대상: GET `/api/v1/auction-completed/map`
- 요청 파라미터(추가)
  - `road_address_search=...` (또는 `address_search=...`)
  - `case_number_search=...`
- 처리 규칙
  - 목록/영역과 동일한 부분 일치(ILIKE) 정책을 적용해 주세요.
  - 다른 필터와 병행 가능해야 하며, 결과 집합 S 구성 → 거리정렬 → limit K 절차는 기존과 동일합니다.
- 응답
  - 기존 스키마/메타 유지 (`items`, `total`, `warning`, `echo.ordering` 등)

## 2) 특수권리 토큰 규격 확정

- 프론트는 현재 불리언 토글을 다음 키로 사용합니다(예: 스토어 `specialBooleanFlags`).
  - `tenant_with_opposing_power`, `hug_acquisition_condition_change`, `senior_lease_right`,
    `resale`, `partial_sale`, `joint_collateral`, `separate_registration`,
    `lien`, `illegal_building`, `lease_right_sale`, `land_right_unregistered`
- 요청
  - `/map`의 `special_rights` CSV에서 위 "키"를 1차 매칭 기준으로 인정해 주세요.
  - 한글 라벨(예: "선순위임차인", "압류")도 보조 매칭으로 수용되면 좋습니다(선택).
  - 최종적으로 서버가 공식 지원하는 토큰 리스트를 회신해 주시면 프론트에서 동일 토큰으로 전송하겠습니다.

## 3) 호환/테스트

- 프론트는 다음과 같이 `/map` 쿼리를 전송합니다.
  - `...&road_address_search=서울 중구&...` 또는 `...&address_search=서울 중구&...`
  - `...&case_number_search=2024타경12345&...`
  - `...&special_rights=tenant_with_opposing_power,선순위임차인,lien,압류&...` (키+라벨 병행 전송)
- 기대 결과
  - 목록(테이블)과 지도 총량(`total`) 일치, 지도는 동일 집합에서 거리순 상위 K만 `items`로 반환.

감사합니다.
