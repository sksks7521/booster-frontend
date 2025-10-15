## [Backend→Frontend] /map 필터 파라미터↔컬럼 정합성 검증 답신 (251013)

### 1) 매핑·정규화 정책 확정

| 파라미터                                | 서버 내부 매핑         | 정규화/매칭 규칙                                                                              |
| --------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------- | --- | --- | --- | ---- | ----- | ---- | ------------- | ------------------------ |
| `build_year_min/max`                    | `construction_year`    | 정수, 1900~2030 가드                                                                          |
| `area_min/max`                          | `building_area_pyeong` | 숫자(평), 경계 각각 선택 적용                                                                 |
| `min/max_land_area`                     | `land_area_pyeong`     | 숫자(평)                                                                                      |
| `min/max_final_sale_price`              | `final_sale_price`     | 숫자(만원), 별칭 `min/max_final_price`도 수용(우선순위: _\_final_sale_price > _\_final_price) |
| `date_from/to` 또는 `sale_date_from/to` | `sale_date`            | YYYY-MM-DD, 어느 쌍이든 동등 처리                                                             |
| `floor_confirmation`                    | `floor_confirmation`   | CSV OR 매칭, 공백/빈 토큰 무시                                                                |
| `elevator_available`                    | `elevator_available`   | 입력 `Y                                                                                       | N   | O   | X   | true | false | 있음 | 없음`→ 내부`O | X`로 정규화 후 필터 적용 |
| `special_rights`                        | 불리언 컬럼군 + 텍스트 | 키는 불리언 컬럼 1:1 매칭, 라벨은 텍스트 OR 보조 매칭                                         |

— 특수권리 공식 키(불리언 컬럼 매칭):
`tenant_with_opposing_power`, `hug_acquisition_condition_change`, `senior_lease_right`, `resale`, `partial_sale`, `joint_collateral`, `separate_registration`, `lien`, `illegal_building`, `lease_right_sale`, `land_right_unregistered`

— 층확인 허용 라벨(현재 DB 원문 기준): `반지하`, `1층`, `일반층`, `탑층`, `확인불가`

※ 추가 라벨(예: `옥탑`)을 `탑층`으로 매핑 원하시면 알려주세요. 즉시 추가 가능합니다.

### 2) 동작 규칙(일관)

- "필터 → 거리정렬 → 상한 K": 모든 필터로 집합 S 구성 → 중심 좌표 기준 거리 오름차순 정렬 → 상한 `limit=K` 반환
- `total`은 집합 S(필터 적용 후 전체)의 개수
- 정렬: 기본 `distance_asc`. `ordering` 지정 시 해당 정렬 사용(최근접 정렬 비활성화). 응답 `ordering`은 미지정 시 `"distance_asc"` 에코

### 3) 에코/디버그 지원

- 응답 `echo.filters`에 서버가 최종 사용한 정규화된 필터 맵을 포함합니다.
  - 예: `{ floor_confirmation: "반지하,일반층", elevator_available: "X", ... }`
- `echo.ordering`에 적용 정렬(기본 `distance_asc`)을 에코합니다.

### 4) 재현 요청 샘플(동일)

```
GET /api/v1/auction-completed/map?
  center_lat=37.5665&center_lng=126.9780&limit=500&
  date_from=2022-01-01&date_to=2022-12-31&
  floor_confirmation=반지하,1층,일반층,탑층&
  elevator_available=N&
  special_rights=tenant_with_opposing_power,선순위임차인,lien,압류
```

### 5) 상태

- 서버 반영 완료(필터/정렬/정규화/echo.filters). 목록/영역과 `/map`의 `total` 일치 확인.

필요 시, `floor_confirmation` 라벨 확장(예: `옥탑`), 특수권리 키↔라벨 매핑표를 별도 문서로 제공드리겠습니다.
