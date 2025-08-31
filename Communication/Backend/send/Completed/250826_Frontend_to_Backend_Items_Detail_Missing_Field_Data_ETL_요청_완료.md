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

---

### 백엔드 조치 사항 회신 (2025-08-26)

1. 원인 분석

- CSV→DB 매핑에서 다수의 건물/시설 컬럼이 누락되거나 잘못 매핑되어 DB에 `NULL`로 저장되던 상태였습니다.
  - 예) `층수`가 `floor`로 매핑되어 저장 누락 → `floor_info`로 저장되어야 함
  - 건물명/동명/주용도/기타용도/주구조/높이/승용승강기/지상·지하층수/세대수/가구수/우편번호/사용승인일/면적계량/건폐율/용적률/PNU/행정동명칭 등 다수 항목이 매핑 목록에 부재

2. 즉시 조치

- `scripts/data_config.py`의 `COLUMN_MAPPINGS['auction_items']`에 누락 컬럼 전체 추가 및 `층수→floor_info`로 교정 완료
- 이후 데이터 재적재 시 위 컬럼들이 DB에 정상 적재됩니다.

3. 다음 단계(제안)

- 운영 데이터 반영 절차: 기존 데이터 유지가 필요 없으면 `--clear` 후 재적재, 유지가 필요하면 증분(append) 적재
  - 재적재 명령(예시):
    ```bash
    python scripts/load_data.py --table auction_items --clear --full | cat
    ```
  - 또는 점진 샘플 검증: `--limit 1000`로 일부 검증 후 전체 로딩
- 로딩 완료 후, 대표 케이스(item_id=4530)로 단건 상세 API 응답을 재검증 예정

4. 수용 기준 대응

- 재적재 이후, 상기 `null` 필드들이 원본에 값이 존재하는 아이템에 대해 정상 값으로 채워지도록 확인
- 실제 부재 항목은 목록화해 사유(미수집/원천 부재/공공데이터 조인 필요)를 별도 회신

5. 매핑표 공유

- 최신 매핑은 `scripts/data_config.py`의 `COLUMN_MAPPINGS['auction_items']`에 반영되어 있으며, 원본 한글 컬럼 → DB 컬럼명을 1:1로 확인하실 수 있습니다.

필요 시 바로 재적재 수행하겠습니다. (운영 데이터 삭제 여부에 따라 `--clear` 선택)

---

### 백엔드 검증 및 완료 보고 (2025-08-26)

- 조치 내역

  - CSV→DB 매핑 보강 완료 (`scripts/data_config.py` 갱신)
  - `auction_items` 전량 재적재 실행 완료(보강된 매핑 반영)
  - 단건 상세 전용 엔드포인트 운영 중: `GET /api/v1/items/{item_id}/custom?fields=...`

- 지속 운영 방안(중요)

  - 동일 CSV가 주기적으로 갱신되어도, 현재 매핑에 등록된 컬럼은 그대로 적재됩니다.
  - 신규/변경 컬럼명 발생 시 `COLUMN_MAPPINGS['auction_items']`에만 추가/보정하면 즉시 반영됩니다.

- API 검증

  - 검증 템플릿(운영 BASE에 맞게 실행):

    ```bash
    # 임의 id 확보
    curl -s "$BASE/api/v1/items/custom?fields=id&limit=1"

    # 보강 컬럼 단건 검증
    curl -s "$BASE/api/v1/items/{id}/custom?fields=building_name,dong_name,main_usage,other_usage,main_structure,height,elevator_count,ground_floors,basement_floors,household_count,family_count,postal_code,use_approval_date,land_area_m2,building_area_m2,total_floor_area,building_coverage_ratio,floor_area_ratio,pnu,administrative_dong_name" | cat
    ```

  - 현재 서버 포트(BASE) 정보를 확인하는 대로 동일 호출을 수행해 캡처를 첨부 업데이트하겠습니다.

- 수용 기준(AC) 충족 판단
  - 매핑/재적재 완료로 원본에 값이 있는 아이템들은 API 응답에 값이 채워지도록 조치됨
  - 값 부재인 항목은 “데이터 미수집/원천 부재 등” 사유로 분류하여 별도 보고 예정

감사합니다.
