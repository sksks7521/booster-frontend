# [Frontend→Backend] 실거래가(매매) 목록 API 필터 미적용(대지권면적·엘리베이터) 개선 요청 (251014)

## 요약

- 증상: 목록 API(`/api/v1/real-transactions/`)에서 대지권면적(`min/max_land_rights_area`)과 엘리베이터(`elevator_available`) 필터가 적용되지 않습니다. 동일 조건의 지도 `/map`은 정상 반영됩니다.
- 영향: 사용자 상세필터 사용 시 목록과 지도 결과가 불일치하며, 목록 total이 기본값(예: 7,729)에서 변하지 않습니다.
- 요청: 목록 API가 지도 `/map`과 동일한 필터 집합 S(표준+별칭)를 해석/적용하도록 바인딩을 추가해 주세요.

## 재현

- 지역: 경기도 고양시 덕양구
- 조건 A: 전용면적 ≤ 300, 대지권면적 200~600

지도(`/map`) 정상 필터링:

```http
GET /api/v1/real-transactions/map?dataset=sale&sort=distance_asc&ref_lat=37.69737848&ref_lng=126.8443866&limit=500&
    sido=경기도&sigungu=경기도 고양시 덕양구&
    max_exclusive_area=300&exclusive_area_max=300&
    min_land_rights_area=200&land_rights_area_min=200&
    max_land_rights_area=600&land_rights_area_max=600&
    ordering=-contract_date
→ total: 50 (예시), echo.filters에 min/max_land_rights_area 반영
```

목록(`/`) 미반영:

```http
GET /api/v1/real-transactions/?sido=경기도&sigungu=경기도 고양시 덕양구&
    max_exclusive_area=300&exclusive_area_max=300&
    min_land_rights_area=200&land_rights_area_min=200&
    max_land_rights_area=600&land_rights_area_max=600&
    ordering=-contract_date&page=1&size=20
→ total: 7,729 (변화 없음)
```

- 조건 B: 엘리베이터 있음(`elevator_available=Y`)

지도(`/map`) 정상 필터링:

```http
GET /api/v1/real-transactions/map?...&elevator_available=Y
→ total: 1,095 (예시)
```

목록(`/`) 미반영:

```http
GET /api/v1/real-transactions/?...&elevator_available=Y&page=1&size=20
→ total: 7,729 (변화 없음)
```

## 원인 추정

- `/map`은 해당 필터들을 이미 지원(정상 동작)하나, 목록 `/` 엔드포인트에서 아래 파라미터 바인딩/해석이 누락된 것으로 보입니다.
  - 대지권면적: `min_land_rights_area`, `max_land_rights_area` (별칭: `land_rights_area_min`, `land_rights_area_max`)
  - 엘리베이터: `elevator_available` (값: `Y`/`N`; 입력 별칭 `true/false`, `있음/없음`, `O/X` 등은 서버에서 Y/N으로 정규화)

## 요청 사항

1. 목록 API(`/api/v1/real-transactions/`)에서 아래 키를 지도와 동일하게 지원해 주세요.

- 표준 키(권장):
  - `min_land_rights_area`, `max_land_rights_area`
  - `elevator_available` (`Y`/`N`)
- 허용 별칭(병행 수용):
  - `land_rights_area_min`, `land_rights_area_max`
  - 엘리베이터: `true/false`, `있음/없음`, `O/X` → 서버 내부에서 `Y/N`으로 정규화

2. 기본값/누락 처리

- 값이 `null`/미지정/기본범위(예: 하한=0, 상한=무제한)인 경우 필터 미적용

3. (선택) echo 메타 제공

- `/map`과 동일하게 `echo.filters` 또는 최소한 서버가 최종 해석한 필터 스냅샷을 응답에 포함하면, FE에서 정합성 검증이 용이합니다.

## 수용 기준(검증)

- 동일 지역(경기도 고양시 덕양구)에서:
  1. 대지권면적 200~600 설정 시 `/` total이 `/map echo.totals.pre_spatial_total`과 같은 방향으로 감소 (기준 total 대비 감소 확인), `/map total`과 정합성 유지
  2. `elevator_available=Y` 설정 시 `/` total이 `/map`과 동일 조건 대비 감소
  3. 표준 키만 전송, 별칭만 전송, 표준+별칭 병행 전송 케이스 모두 정상 동작

## 참고(프론트 상태)

- 프론트는 표준 키 우선 + 별칭 병행 전송으로 정규화되어 있습니다.
- 동일 조건에서 `/map`이 정상 축소되고 있으므로, 프론트 전송/값 정규화는 정상으로 판단합니다.

## 우선순위 / 영향도

- 우선순위: P1 (사용자 상세필터의 핵심 기능)
- 영향: 목록/지도 불일치 해소 및 사용자 신뢰도 개선

감사합니다.
