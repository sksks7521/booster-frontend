# [Frontend→Backend] 실거래가(매매) 파라미터 명칭·별칭 정합성 검증 요청 (251013)

## 목적

- /map과 목록의 파라미터명을 완전히 일치시키기 위해, 아래 키들의 정확한 명칭/허용 별칭을 확인하고자 합니다.
- 애매한 항목은 FE에서 이중 전송(date_from + contract_date_from 등)으로 잠정 호환 가능하나, 최종 표준을 합의하고 싶습니다.

## 확인 요청 키(매핑 대상)

- 지역: `sido`, `sigungu`, `admin_dong_name`
- 거래금액(만원): `min_transaction_amount`, `max_transaction_amount`
- 전용면적: `min_exclusive_area`/`max_exclusive_area` vs `exclusive_area_min`/`exclusive_area_max`
- 대지권면적: `min_land_rights_area`/`max_land_rights_area` vs `land_rights_area_min`/`land_rights_area_max`
- 평당가: `min_price_per_pyeong`/`max_price_per_pyeong` vs `price_per_pyeong_min`/`price_per_pyeong_max`
- 건축년도: `min_construction_year`/`max_construction_year` vs `build_year_min`/`build_year_max`
- 계약일: `contract_date_from`/`contract_date_to` vs `date_from`/`date_to`(연 선택의 YYYY→from/to 변환 포함)
- 층확인: `floor_confirmation`(CSV)
- 엘리베이터: `elevator_available`(Y/N/O/X/true/false/있음/없음)
- 검색: `address_search` + `address_search_type`("road"|"jibun") vs `road_address_search`/`jibun_address_search`
- 선택만 보기: `ids`(CSV)
- 정렬: `ordering`(또는 `sort_by`/`sort_order`)

## 질문

1. 위 각 항목에서 서버가 1차로 인식하는 표준 파라미터명은 무엇인가요?
2. 표준 외에 수용 가능한 별칭 목록이 있다면 알려주세요(예: `min_exclusive_area` == `exclusive_area_min`).
3. 계약일의 경우 `date_from/to`와 `contract_date_from/to` 중 어느 쌍을 표준으로 둘지 합의 부탁드립니다. 둘 다 오면 우선순위는?
4. 상한 비교 규칙은 모두 미만(<)으로 통일되는지, 항목별 예외가 있는지요?

## FE 잠정 전략(회신 전)

- 불확실한 항목은 표준+별칭을 함께 전송하여 호환(예: `exclusive_area_min` + `min_exclusive_area`).
- 회신 후에는 표준 키만 전송하도록 정리합니다.

감사합니다.

