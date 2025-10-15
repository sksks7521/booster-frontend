# [Frontend→Backend] 실거래가(매매) `/map` 목록↔지도 정합성 확보 및 필터 표준화/별칭 지원 요청 (251013)

## 배경

- v2 실거래가(매매) 화면에서 동일한 필터 집합을 적용해도 목록과 지도 결과가 불일치합니다.
- 원인: `/api/v1/real-transactions/map?dataset=sale`가 목록과 동일한 필터를 전부 해석하지 못하거나, 키 별칭 불일치로 무시되는 항목이 다수 존재합니다.
- 경매결과(v2)에서는 동일 문제를 “표준+별칭 병행 전송 + 기본값 가드 + 화이트리스트”로 해결했습니다. 매매 `/map`도 같은 정책으로 정합성을 확보하고자 합니다.

## 목표

1. 목록과 지도에서 동일한 “필터 집합 S”가 동일하게 동작할 것
2. `/map total`은 S의 전체 개수, `items`는 거리 오름차순 상위 `limit=K`
3. 표준 키 우선, 별칭은 호환을 위해 병행 지원 (추후 단계적으로 축소 가능)

## 대상 엔드포인트

- GET `/api/v1/real-transactions/map` (필수: `dataset=sale`, `ref_lat`, `ref_lng`)

## 요청 사항

### 1. 필터 표준화(목록과 동일) 및 별칭 병행 지원

아래 표는 “표준 키(권장)”와 “허용 별칭(병행)”입니다. 서버는 두 형태 모두 수용해 동일 의미로 처리해 주세요.

- 지역
  - 표준: `sido`, `sigungu`, `admin_dong_name`
  - 별칭: (없음)
- 거래금액(만원)
  - 표준: `min_transaction_amount`, `max_transaction_amount`
  - 별칭: `transaction_amount_min`, `transaction_amount_max`
- 전용면적(㎡ 또는 평)
  - 표준: `min_exclusive_area`, `max_exclusive_area`
  - 별칭: `exclusive_area_min`, `exclusive_area_max`
- 대지권면적(㎡)
  - 표준: `min_land_rights_area`, `max_land_rights_area`
  - 별칭: `land_rights_area_min`, `land_rights_area_max`
- 평당가(만원/평)
  - 표준: `min_price_per_pyeong`, `max_price_per_pyeong`
  - 별칭: `price_per_pyeong_min`, `price_per_pyeong_max`
- 건축연도
  - 표준: `build_year_min`, `build_year_max`
  - 별칭: `min_construction_year`, `max_construction_year`
- 계약일(YYYY-MM-DD)
  - 표준: `contract_date_from`, `contract_date_to`
  - 별칭: `date_from`, `date_to`
- 층확인
  - 표준: `floor_confirmation` (CSV)
  - 값 예시: `반지하,1층,일반층,옥탑,확인불가` (서버 내부 표준으로 정규화 가능)
- 엘리베이터
  - 표준: `elevator_available` (Y/N)
  - 허용 입력: Y/N/O/X/true/false/있음/없음 → 서버에서 Y/N으로 정규화
- 검색
  - 표준 A: `address_search` + `address_search_type`(road|jibun|both)
  - 별칭 B: `road_address_search`, `jibun_address_search`
- 선택만 보기
  - 표준: `ids` (CSV)

### 2. 결과 정책

- 응답 스키마(예시):

```json
{
  "items": [
    {
      /* 지도 공통 키 포함: address, lat, lng, area, build_year, price, price_basis */
    }
  ],
  "total": 7123,
  "warning": "필터 결과가 7,123건입니다. 가까운 순 상위 1,000건만 반환했습니다.",
  "echo": {
    "dataset": "sale",
    "ref_lat": 37.5,
    "ref_lng": 127.0,
    "limit": 1000,
    "bounds": { "south": 37.4, "west": 126.8, "north": 37.7, "east": 127.2 },
    "filters": {
      /* 서버가 최종 해석한 표준화 필터 */
    },
    "totals": { "pre_spatial_total": 7123 }
  }
}
```

- `total`은 집합 S의 전체 개수(표준화 필터 적용 결과). `items`는 거리 오름차순 상위 `limit=K`만 반환.
- `warning`은 `items.length < total`일 때 안내. `echo.filters`에는 서버가 최종 해석한 표준 키만 기록.

### 3. 유효성/변환 규칙

- 금액/면적/연도 등 범위형 파라미터는 값이 기본범위(예: 하한 0, 상한 무제한/최대값)인 경우 “미설정”으로 간주 가능.
- 주소 검색은 A/B 두 방식이 동시에 들어와도 A 우선 등 내부 우선순위로 일관 처리.
- `ids`는 최대 500개 정도로 안전 상한.

### 4. 회귀 테스트 시나리오(요청)

1. 지역+건축연도(2020~2025) 적용 시 목록 total과 `/map total` 일치, `items`는 K개 제한.
2. 금액/전용면적/대지권/평당가/층확인/엘리베이터/주소검색/ids 각각·조합에서 목록↔지도 total 동등성 유지.
3. bounds 제공 시 사전 공간 프리필터 후 동일 규칙 적용.

## 일정/릴리스

- 서버 배포 후 `echo.filters`에 기반한 클라이언트 로그로 정합성 검증 → 불일치 시 즉시 리포트.

## 참고

- 경매결과(v2) `/map`에서 동일 패턴으로 정합성 확보 완료(표준+별칭 병행, 기본값 가드, echo 제공).
