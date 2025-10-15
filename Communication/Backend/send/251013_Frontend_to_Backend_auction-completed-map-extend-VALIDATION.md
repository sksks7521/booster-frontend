# [Frontend→Backend] /map 필터 파라미터↔컬럼 정합성 검증 요청 (251013)

## 목적

- 동일 화면에서 목록/영역과 지도(`/map`)의 필터 결과가 일치하도록, "파라미터 이름 → 서버 내부 컬럼/쿼리" 매핑을 상호 확인하고자 합니다.
- 특히 지도에서 체감상 미적용 또는 0건으로 떨어지는 항목(층확인/엘리베이터/특수권리/매각년도)에 대한 컬럼명·정규화 규칙을 명확히 합의합니다.

## 범위(대상 엔드포인트)

- GET `/api/v1/auction-completed/map` (필터 → 거리정렬 → limit=K)

## 1) 현 상태 요약

- 정상 동작(지도 total이 목록 총량과 일치):
  - 건축년도: `build_year_min`, `build_year_max`
  - 건물평형(평): `area_min`, `area_max` (＝ `building_area_pyeong` 범위)
  - 토지평형(평): `min_land_area`, `max_land_area` (＝ `land_area_pyeong` 범위)
  - 매각가(만원): `min_final_sale_price`, `max_final_sale_price` (확인됨)
- 미적용/의심(지도 total이 변하지 않거나 0건):
  - 층확인: `floor_confirmation`(CSV)
  - 엘리베이터: `elevator_available`(Y/N/O/X/true/false/있음/없음)
  - 특수권리: `special_rights`(키+라벨 CSV)
  - 매각년도(빠른 선택): `date_from/to`(+ `sale_date_from/to`) ← 연간 경계 변환 케이스

## 2) 확인·합의하고 싶은 사항(컬럼/정규화/매핑)

- 서버 내부에서 수용하는 "파라미터명 → 대상 컬럼/정규화" 매핑을 아래와 같이 확인 요청드립니다.

| 파라미터                             | 서버 내부 매핑(예시)            | 정규화/매칭 규칙                                                                   |
| ------------------------------------ | ------------------------------- | ---------------------------------------------------------------------------------- |
| `build_year_min/max`                 | `construction_year`             | 정수, 1900~2030 가드                                                               |
| `area_min/max`                       | `building_area_pyeong`          | 숫자(평), 경계 OR 미지정 허용                                                      |
| `min/max_land_area`                  | `land_area_pyeong`              | 숫자(평)                                                                           |
| `min/max_final_sale_price`           | `final_sale_price`              | 숫자(만원)                                                                         |
| `date_from/to` / `sale_date_from/to` | `sale_date`                     | YYYY-MM-DD, 어느 쌍이든 동등 처리                                                  |
| `floor_confirmation`                 | `floor_confirmation`            | CSV OR 매칭, 허용 값(반지하, 1층, 일반층, 옥탑, 확인불가 …) 목록 확인 요청         |
| `elevator_available`                 | `elevator_available`            | 입력(Y/N/O/X/true/false/있음/없음) → 내부 표준(O/X 또는 Y/N) 정규화 규칙 확인 요청 |
| `special_rights`                     | 불리언 컬럼군(아래 키) + 텍스트 | 키: 불리언 컬럼 1:1 매칭, 라벨: 텍스트 OR(선택)                                    |

- 특수권리 공식 키(백엔드 회신):
  - `tenant_with_opposing_power`, `hug_acquisition_condition_change`, `senior_lease_right`, `resale`, `partial_sale`, `joint_collateral`, `separate_registration`, `lien`, `illegal_building`, `lease_right_sale`, `land_right_unregistered`
- 프론트 전송 예: `special_rights=tenant_with_opposing_power,선순위임차인,lien,압류`

## 3) 에코/디버그 협조 요청(검증 간편화)

- 응답 `echo`에 아래 두 필드를 선택적으로 포함해 주시면 현장 검증이 매우 수월합니다.
  - `echo.filters`: 서버가 최종 사용한 정규화된 필터 맵(예: `{ floor_confirmation: "반지하,일반층", elevator_available: "N" }`)
  - `echo.ordering`: 적용 정렬(미지정 시 `distance_asc`)

## 4) 재현용 요청 샘플

```
GET /api/v1/auction-completed/map?
  center_lat=37.5665&center_lng=126.9780&limit=500&
  // 연간 범위
  date_from=2022-01-01&date_to=2022-12-31&
  // 층확인 CSV
  floor_confirmation=반지하,1층,일반층,옥탑&
  // 엘리베이터
  elevator_available=N&
  // 특수권리(키+라벨 혼합)
  special_rights=tenant_with_opposing_power,선순위임차인,lien,압류
```

- 기대: 목록 총량과 `/map total` 일치, `items`는 거리 오름차순 상위 `limit`만 반환, `echo.filters`에 서버가 인지한 값이 반영.

## 5) 요청 정리

- 표 2)의 매핑·정규화 정책을 확정 회신 부탁드립니다(특히 `floor_confirmation` 허용 값 집합, `elevator_available` 정규화, `special_rights` 키 처리 방식).
- 가능 시 `echo.filters` 디버그 출력 추가를 부탁드립니다(옵션).

감사합니다.
