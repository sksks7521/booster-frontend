# [Backend→Frontend] 실거래가(매매) 파라미터 명칭·별칭 정합성 답신 (251013)

## 1) 표준 파라미터(목록/지도 공통)

- 지역: `sido`, `sigungu`, `admin_dong_name`
- 거래금액(만원): `min_transaction_amount`, `max_transaction_amount`
- 전용면적(㎡): `min_exclusive_area`, `max_exclusive_area`
- 대지권면적(㎡): `min_land_rights_area`, `max_land_rights_area` (데이터 보유 시)
- 평당가(만원): `min_price_per_pyeong`, `max_price_per_pyeong`
- 건축년도: `min_construction_year`, `max_construction_year`
- 계약일: `contract_date_from`, `contract_date_to` (YYYY-MM-DD)
- 층확인: `floor_confirmation`(CSV)
- 엘리베이터: `elevator_available` (Y/N/O/X/true/false/있음/없음)
- 검색: `address_search` + `address_search_type`("road"|"jibun"|"both")
- 선택만 보기: `ids`(CSV)
- 정렬: `ordering`(또는 `sort_by`/`sort_order`)

## 2) 허용 별칭(서버 수용/동작 동일)

- 지역: `address_city` → `sigungu`
- 전용면적: `exclusive_area_min` → `min_exclusive_area`, `exclusive_area_max` → `max_exclusive_area`
- 대지권면적: `land_rights_area_min` → `min_land_rights_area`, `land_rights_area_max` → `max_land_rights_area`
- 평당가: `price_per_pyeong_min` → `min_price_per_pyeong`, `price_per_pyeong_max` → `max_price_per_pyeong`
- 계약일: `date_from` → `contract_date_from`, `date_to` → `contract_date_to` (연 선택 YYYY는 1/1~12/31로 FE에서 확장 or 서버에서 동등 처리)

## 3) 우선순위 규칙

- 표준 키가 오면 표준 우선.
- 표준이 없고 별칭만 오면 별칭을 표준으로 매핑 적용.
- 표준·별칭이 동시에 오면 표준 우선(별칭은 무시).

## 4) 비교/경계 규칙(기본)

- 금액/면적/평당가: 하한 ≥, 상한 <(미만) 권고. 상한 ≤(이하)가 필요한 항목은 사전 합의 시 반영.
- 계약일: inclusive(시작일 ≤ 계약일 ≤ 종료일).
- 기본값 가드: 0~기본상한(또는 비어 있음)은 "미설정"으로 간주(미전송 권장).

## 5) 지도(/map) 적용 확인

- `/map`에서도 위 표준/별칭을 동일 규칙으로 처리합니다.
- `total`은 집합 S(공간/좌표 제약 전) 총량이며, 응답 `echo.totals.pre_spatial_total`로 노출됩니다.

## 6) FE 권장 구현

- 필터 빌더에서 표준 키만 전송. 과도기에는 표준+별칭 동시 전송 허용(표준 우선).
- 날짜 빠른선택(연도)은 FE에서 `date_from=YYYY-01-01`, `date_to=YYYY-12-31`로 변환해 표준키에 맵핑.

## 7) 추후(선택) 백엔드 보강

- 별칭 자동 매핑을 `/map`과 목록 모두에 방어적으로 추가(현재 다수 수용 중). 추가 별칭이 필요하면 목록을 공유 바랍니다.

감사합니다.
