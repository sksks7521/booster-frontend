# [Backend→Frontend] 지도(/map) 특수권리 연동 요청 (251013)

## 배경 / 현상

- 특수권리 토글(예: 대항력있는임차인) 선택 시 목록 총량은 감소하나, 지도 `/map` 결과가 변하지 않는 케이스가 관측되었습니다.
- 원인: 지도 요청에서 특수권리 파라미터 누락 또는 한글 라벨만 전달되어 불리언 컬럼 매칭이 되지 않는 경우가 있음.

## 서버 현행(보강 완료)

- `/map`이 다음 파라미터를 모두 수용합니다.
  - `special_conditions`: 키/라벨 혼합 CSV → canonical 키로 정규화(불리언 컬럼 필터)
  - `special_rights`: 라벨/텍스트 CSV → 텍스트 OR 매칭(보조)
- 한글 라벨→영문 키 매핑을 목록/영역과 동일하게 적용합니다.
- 응답 `echo.filters`에 `special_rights`, `special_rights_keys`, `special_conditions_param`이 포함됩니다.

## 요청 사항(필수)

1. 특수권리 토글 ON 시, 지도 `/map` 호출에 아래 중 하나를 반드시 포함해 주세요(권장: ①).
   1. `special_conditions=<canonical_keys>` (권장)
   2. `special_rights=<canonical_keys 또는 라벨>`
2. 여러 개 선택 시 CSV로 병합(예: `special_conditions=tenant_with_opposing_power,lien`).
3. 토글 OFF 시 해당 키를 파라미터에서 제거해 주세요.

## canonical 키 목록(서버 불리언 컬럼)

```
tenant_with_opposing_power, hug_acquisition_condition_change, senior_lease_right,
resale, partial_sale, joint_collateral, separate_registration,
lien, illegal_building, lease_right_sale, land_right_unregistered
```

## 한글 라벨 ↔ 키 매핑(발췌)

```
대항력있는임차인 → tenant_with_opposing_power
HUG인수보증 / HUG인수조건변경 → hug_acquisition_condition_change
선순위임차권 → senior_lease_right
공동담보 → joint_collateral
유치권 → lien
별도등기 → separate_registration
전세권매각 → lease_right_sale
대지권미등기 → land_right_unregistered
```

## 호출 예시

- 단일 선택(대항력있는임차인):

```
GET /api/v1/auction-completed/map?...&special_conditions=tenant_with_opposing_power
```

- 다중 선택(대항력있는임차인 + 유치권):

```
GET /api/v1/auction-completed/map?...&special_conditions=tenant_with_opposing_power,lien
```

- 라벨만 사용하는 경우(보조 매칭):

```
GET /api/v1/auction-completed/map?...&special_rights=대항력있는임차인
```

## 검증 방법

- `/map` 응답의 `echo.filters.special_rights_keys` 또는 `special_conditions_param`에 선택 키가 반영되는지 확인.
- 동일 조건에서 목록 총량과 `/map`의 `echo.totals.pre_spatial_total`이 같은 방향으로 감소해야 함.

## 참고

- 가격 기본 파라미터는 미전송 원칙 유지(별도 문서 `...map-total-consistency-REQUEST.md`).
