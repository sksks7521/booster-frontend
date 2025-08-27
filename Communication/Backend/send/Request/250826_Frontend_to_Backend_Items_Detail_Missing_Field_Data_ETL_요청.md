  # [요청] Items 상세 표준 필드 데이터 보강(ETL/소스) 요청

- 일자: 2025-08-26
- 작성: Frontend
- 관련 문서:
  - receive/Request/250826*Items*상세*표준*필드\_사양.md
  - send/Request/250826*Frontend_to_Backend_Items_Detail_Single_Endpoint*요청.md

## 배경

신규 단건 상세 엔드포인트 `GET /api/v1/items/{item_id}/custom?fields=...` 적용 후, 상세 화면에서 표준 필드 스펙에 따른 건물/시설 관련 컬럼들이 다수 `null` 또는 `0`으로 표시되고 있습니다. 프론트엔드 매핑/표시는 최신 스펙에 정합하게 구현되어 있으며, 디버그 패널(raw) 확인 결과 실제 API 응답의 해당 필드 값이 `null`로 내려오고 있음을 확인했습니다.

## 검증 환경 및 방법

- 페이지: /analysis → 목록행 클릭 → 상세 팝업 → 하단 디버그 패널(raw)
- 디버그 패널 활성화: `?detailDebug=1` 또는 `localStorage.DETAIL_DEBUG = '1'`
- 호출 엔드포인트: `GET /api/v1/items/{item_id}/custom?fields=<표준필드목록>`
- 대표 케이스: item_id = 4530

## 대표 응답(raw) 요약

다음 필드들이 `null`로 확인됨:

- building_name, dong_name, main_usage, other_usage, main_structure, height, elevator_count,
  ground_floors, basement_floors, household_count, family_count, postal_code, use_approval_date,
  land_area_m2, building_area_m2, total_floor_area, building_coverage_ratio, floor_area_ratio,
  pnu, administrative_dong_name

다음 필드들은 정상 값 확인:

- case_number, sale_date, current_status, building_area_pyeong, land_area_pyeong,
  appraised_value, minimum_bid_price, bid_to_appraised_ratio, public_price, under_100million,
  bid_to_public_ratio, floor_confirmation, elevator_available, construction_year,
  road_address, longitude, latitude, id

(상세 팝업 하단 디버그 패널 raw JSON에서 직접 확인 완료)

## 요청 사항

1. 상기 `null`로 확인된 표준 필드들의 기초 데이터 소스/ETL 파이프라인을 점검하여 값이 존재할 경우 응답에 채워지도록 보강 부탁드립니다.
2. 특정 필드가 데이터 소스에 부재한 경우, 부재 사유 및 확보/대체 가능성(예: 공공데이터 조인, 변환 규칙 등)을 회신 부탁드립니다.
3. 수집 스키마 ↔ 표준 스펙 매핑표(필드명/타입/단위 포함)를 공유 부탁드립니다.

## 수용 기준(AC)

- 단건 상세 API 응답에서 위 `null` 필드들이 실제 존재하는 아이템에 대해 값으로 채워짐
- 값이 존재하지 않는 아이템의 경우 사유 명시(데이터 미수집/원천 부재 등)
- 변경 이후, 프론트 디버그 패널(raw)에서 해당 필드 값 확인 가능

## 부가 정보

- 프론트는 표준 필드 스펙에 맞춰 `mapItemToDetail` 매핑을 완료하였고, 상세 UI(`PropertyDetailSimple`)에 해당 컬럼들을 모두 표시 중입니다. 값이 채워지는 즉시 별도 코드 변경 없이 사용자에게 노출됩니다.

감사합니다.
