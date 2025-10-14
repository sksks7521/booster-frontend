# [Backend→Frontend] 실거래가(매매) `/map` 목록↔지도 정합성 확보 및 필터 표준화/별칭 지원 적용 보고 (251013)

## 적용 요약

- `/api/v1/real-transactions/map`에 목록과 동일한 필터·별칭·정규화 로직을 반영했습니다.
- `total`은 집합 S(공간/좌표 제약 전) 총량을 의미하며, 응답 `echo.totals.pre_spatial_total`로 제공합니다.
- `items`는 기준점(`ref_lat`,`ref_lng`)으로 거리 오름차순 상위 `limit=K`만 반환합니다. `total > K`면 `warning`을 동봉합니다.
- `echo.filters`에는 서버가 최종 해석한 “표준 키”만 기록됩니다(별칭/혼용 입력 시에도 표준으로 통일 기록).

## 표준 필터 및 허용 별칭

- 지역: `sido`, `sigungu`, `admin_dong_name` (별칭: `address_city`→`sigungu`)
- 거래금액(만원): `min_transaction_amount`, `max_transaction_amount` (별칭: `transaction_amount_min`, `transaction_amount_max`)
- 전용면적(㎡): `min_exclusive_area`, `max_exclusive_area` (별칭: `exclusive_area_min`, `exclusive_area_max`)
- 대지권면적(㎡): `min_land_rights_area`, `max_land_rights_area` (별칭: `land_rights_area_min`, `land_rights_area_max`)
- 평당가(만원/평): `min_price_per_pyeong`, `max_price_per_pyeong` (별칭: `price_per_pyeong_min`, `price_per_pyeong_max`)
- 건축연도: `min_construction_year`, `max_construction_year`
- 계약일(YYYY-MM-DD): `contract_date_from`, `contract_date_to` (별칭: `date_from`, `date_to`)
- 주소검색(표준 A): `address_search` + `address_search_type`(`road|jibun|both`) / (별칭 B): `road_address_search`, `jibun_address_search` (A 우선 규칙)
- 선택만 보기: `ids`(CSV, 최대 500개·숫자·중복제거)
- 층확인: `floor_confirmation`(CSV) — `basement|first_floor|normal_floor|top_floor` → `반지하|1층|일반층|탑층`으로 정규화
- 엘리베이터: `elevator_available` — `Y/N/O/X/true/false/있음/없음` → 내부 `O/X`로 정규화, `echo`에는 `Y/N`로 노출
- 지도 BBOX: `bounds.south|west|north|east` (옵션)

## 응답 포맷(요지)

```json
{
  "items": [
    {
      /* address, lat, lng, area, build_year, price, price_basis 포함 */
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

## 회귀 테스트(스모크) 포인트

1. 지역 + 건축연도(예: 2020~2025) 적용 시 목록(Simple) `total`과 `/map echo.totals.pre_spatial_total`이 일치해야 합니다.
2. 금액/전용면적/대지권/평당가/계약일/층확인/엘리베이터/주소검색/ids 단독·조합에서도 동일성 유지.
3. `bounds` 제공 시에도 `total`은 집합 S 기준(사전 공간 필터 전)으로 유지됩니다.

## 배포/사용 안내

- 클라이언트는 표준 키만 전송 권장(과도기엔 표준+별칭 동시 전송 가능, 표준 우선 규칙 적용).
- 날짜(연 단위 빠른 선택)는 `YYYY-01-01`~`YYYY-12-31` 범위로 확장하여 표준 키로 전송 권장.

## 스모크 스크립트

- 경로: `scripts/smoke_sale_map_consistency.ps1`
- 기능: 동일 필터로 목록(Simple)↔지도(Map)의 `total` 일치 여부를 자동 점검. 기본 포트(127.0.0.1:8000) 시 자동 탐지 시도(8000~8099), 필요 시 `-BaseUrl`로 지정 가능.
- 실행 예시:
  - 기본: `powershell -ExecutionPolicy Bypass -File scripts/smoke_sale_map_consistency.ps1`
  - 포트 지정: `powershell -ExecutionPolicy Bypass -File scripts/smoke_sale_map_consistency.ps1 -BaseUrl "http://127.0.0.1:8001"`
  - 지역 지정: `... -Sido "경기도" -Sigungu "고양시 일산동구" -RefLat 37.66 -RefLng 126.78`

감사합니다.
