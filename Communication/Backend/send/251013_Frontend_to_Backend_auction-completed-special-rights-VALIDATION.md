# [Frontend→Backend] 특수권리(special_rights) 파라미터 정합성/정규화 VALIDATION 요청 (251013)

## 목적

- 목록(`/api/v1/auction-completed/`)과 지도(`/api/v1/auction-completed/map`)에서 특수권리 필터 결과가 완전히 일치하도록,
  전송 파라미터(`special_rights`)의 “공식 토큰/정규화/매칭 규칙”을 확정하고자 합니다.
- 현 상태에서 한국어 라벨 또는 혼합 전송 시 미적용 사례가 있어, 서버 측 허용 스펙을 명확히 하고 프론트는 해당 스펙으로 단일화하려 합니다.

## 대상 엔드포인트

- GET `/api/v1/auction-completed/` (리스트)
- GET `/api/v1/auction-completed/map` (지도: 필터 → 거리정렬 → 상한 K)

## 현상 요약(재현)

- 예시: `special_rights=대항력있는임차인` 과 같이 한국어 라벨로만 전송한 경우, 리스트/지도에서 필터 미적용 또는 total 변화 없음이 관찰됩니다.
- 기존에는 키(영문 스네이크케이스)와 한글 라벨을 혼합 CSV로 전송했으나, 서버가 정확 일치 토큰만 허용하는 경우 전체가 무효화되는 것으로 추정됩니다.

## 확인·합의 요청 사항

1. 공식 토큰 집합 확정(키 목록)

- 아래 키 목록이 최종 확정본이 맞는지 확인 부탁드립니다. (이전 회신 기준)
  - `tenant_with_opposing_power`, `hug_acquisition_condition_change`, `senior_lease_right`, `resale`, `partial_sale`,
    `joint_collateral`, `separate_registration`, `lien`, `illegal_building`, `lease_right_sale`, `land_right_unregistered`

2. 입력 허용 스펙(정규화 규칙)

- 파라미터명: `special_rights`
- 형식: CSV 문자열(쉼표 구분)
- 허용 값: 상기 “공식 토큰(영문 스네이크케이스)”만 허용하는지 여부
  - 한국어 라벨, 자유 텍스트, 대소문자 변형, 공백 포함 값 등은 “거부/무시/정규화” 중 어떤 동작을 원하시는지 확정 필요
- 트리밍/대소문자/URL 인코딩: 서버 측에서 적용하는 정규화(양끝 공백 제거, 소문자화 등) 규칙 명시 요청
- 알 수 없는 토큰 처리: 400/422 오류 반환 vs 해당 토큰만 무시 vs 전체 무시 중 선택

3. 매칭 규칙(OR/AND)

- 다중 토큰 입력 시 매칭 기준: OR(하나라도 해당)인지 AND(모두 해당)인지 확정 부탁드립니다.
  - 예: `special_rights=lien,illegal_building` → OR 매칭 시 두 조건 중 하나라도 참이면 포함

4. 엔드포인트 간 일관성

- 리스트(`/`)와 지도(`/map`)가 동일한 토큰 스펙/정규화/매칭 규칙을 사용하도록 보장 요청
- 동일 파라미터로 두 엔드포인트 호출 시 total 일치가 보장되어야 합니다(지도는 상한 K로 “표시 K / 총 total”만 다름)

5. 에코/디버그 협조(선택)

- 응답 본문에 선택적으로 아래를 포함해 주시면 현장 검증이 수월합니다.
  - `echo.filters.special_rights`: 서버가 최종 사용한 정규화된 토큰 CSV (예: `"lien,tenant_with_opposing_power"`)

## 프론트 단 정렬/전송 방안(합의 후 적용)

- 사용자가 라벨을 선택하더라도, 프론트는 내부 매핑 표로 “공식 토큰”으로만 치환하여 `special_rights`에 CSV로 전송하겠습니다.
- 한국어 라벨/자유 텍스트는 전송에서 제외합니다. (또는 백엔드 합의 시 별도 키 `special_rights_keywords`로 분리 전송 가능)
- 예시(전송):
  - `special_rights=tenant_with_opposing_power,lien`
- 예시(에코 기대):
  - `echo.filters.special_rights="tenant_with_opposing_power,lien"`

## 재현용 샘플

```
GET /api/v1/auction-completed/?
  address_area=경기도&address_city=경기도 고양시&
  special_rights=tenant_with_opposing_power,lien&page=1&size=20
```

```
GET /api/v1/auction-completed/map?
  center_lat=37.5665&center_lng=126.9780&limit=500&
  special_rights=tenant_with_opposing_power,lien
```

- 기대: 두 엔드포인트에서 total이 동일하게 반영되고, 지도는 거리 오름차순으로 상위 `limit`개만 `items`로 반환됩니다.

## 요청 정리

- 공식 토큰 집합과 정규화/매칭 규칙(OR/AND), 알 수 없는 토큰 처리 방식을 확정 회신 부탁드립니다.
- 리스트/지도 동일 스펙 사용 보장 및(선택) `echo.filters.special_rights` 제공 가능 여부 회신 부탁드립니다.
- 회신 받는 즉시 프론트 전송 로직을 “공식 토큰만”으로 단일화하여 반영하겠습니다.

감사합니다.
