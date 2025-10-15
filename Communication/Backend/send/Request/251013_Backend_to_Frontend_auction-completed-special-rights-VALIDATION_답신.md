## [Backend→Frontend] 특수권리(special_rights) 정합성/정규화 VALIDATION 답신 (251013)

### 1) 공식 토큰 집합(확정)

다음 키는 불리언 컬럼과 1:1 매핑됩니다.
`tenant_with_opposing_power`, `hug_acquisition_condition_change`, `senior_lease_right`, `resale`, `partial_sale`, `joint_collateral`, `separate_registration`, `lien`, `illegal_building`, `lease_right_sale`, `land_right_unregistered`

### 2) 입력 허용/정규화 규칙

- 파라미터: `special_rights` (CSV)
- 허용 값: 위 “공식 토큰(영문 스네이크케이스)”
- 정규화: 각 토큰 `trim → 그대로 소문자 비교` (키는 원문 그대로 사용 권장)
- 알 수 없는 토큰: 해당 토큰만 무시(전체 무효화/오류 아님)

선택 보조 매칭(지도/목록 동일):

- 한국어 라벨/자유 텍스트는 보조 텍스트 OR 매칭으로 포함됩니다. 단, 프론트 단 전송은 “공식 토큰만” 권장합니다.

### 3) 매칭 규칙(AND/OR)

- 다중 토큰은 “토큰 간 OR”로 결합합니다.
- 각 토큰은 “불리언 컬럼(True) OR special_rights 텍스트 부분일치” 중 하나라도 만족 시 포함됩니다.

### 4) 엔드포인트 일관성/에코

- 대상: `GET /api/v1/auction-completed/`, `GET /api/v1/auction-completed/map`
- 동일 정규화/매칭 로직을 사용합니다. 동일 파라미터로 두 엔드포인트의 `total`이 일치합니다(지도는 표시 K만 상한 적용).
- 응답 `echo.filters.special_rights`에 서버가 최종 사용한 정규화된 토큰 CSV를 에코합니다(예: `"tenant_with_opposing_power,lien"`).

### 5) 프론트 권장 전송 형식(합의)

- 사용자가 라벨을 선택하더라도, 프론트는 내부 매핑으로 “공식 토큰만”을 CSV로 전송해 주세요.
- 예시 전송: `special_rights=tenant_with_opposing_power,lien`

### 6) 재현 샘플

```
GET /api/v1/auction-completed/?
  address_area=경기도&address_city=경기도 고양시&
  special_rights=tenant_with_opposing_power,lien&page=1&size=20

GET /api/v1/auction-completed/map?
  center_lat=37.5665&center_lng=126.9780&limit=500&
  special_rights=tenant_with_opposing_power,lien
```

- 기대: 두 엔드포인트 `total` 동일, 지도는 거리 오름차순 상위 `limit`만 `items`로 반환

필요 시, 라벨↔토큰 매핑표를 별도 공유하겠습니다.
