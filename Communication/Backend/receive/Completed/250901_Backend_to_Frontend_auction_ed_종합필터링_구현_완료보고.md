## 🛠️ Backend→Frontend | auction_ed 종합 필터링 구현 완료 보고 (2025-09-01)

### 1) 요약

- 요청 문서: `250901_Frontend_to_Backend_auction_ed_종합필터링_구현요청.md`
- 대상 API: `GET /api/v1/auction-completed/`
- 조치: 매각가/날짜/면적/다중선택/검색 필터를 백엔드에서 처리하도록 확장, 페이지네이션 일관성 보장
- 결과: 프론트는 단일 API 호출만으로 필터링/정렬/페이지네이션 결과를 안정적으로 수신

### 2) 구현 상세 (변경사항)

- 파일: `app/api/v1/endpoints/auction_completed.py`

  - 루트 엔드포인트에 다음 파라미터 추가 및 CRUD 전달
    - 지역: `address_area(=sido)`, `address_city`
    - 매각가(만원): `min_final_sale_price`, `max_final_sale_price`
    - 매각기일: `sale_date_from(YYYY-MM-DD)`, `sale_date_to(YYYY-MM-DD)`
    - 면적(평): `min_building_area_pyeong`, `max_building_area_pyeong`, `min_land_area_pyeong`, `max_land_area_pyeong`
    - 다중선택(쉼표구분): `floor_confirmation`, `elevator_available`, `current_status_multi`, `special_conditions`
    - 검색: `road_address_search`, `case_number_search`

- 파일: `app/crud/crud_auction_completed.py`
  - 위 파라미터들을 실제 SQLAlchemy 필터로 적용
  - 다중선택은 `IN (...)` 또는 True 필드 조건으로 결합(OR 의미)
  - 검색은 `ILIKE '%keyword%'`

### 3) 파라미터 사양 (요청 대비 매핑)

- 지역

  - `address_area` → DB `sido`
  - `address_city` → DB `address_city`

- 매각가(만원)

  - `min_final_sale_price`, `max_final_sale_price`
  - 처리 규칙: 범위 비교 시 `final_sale_price IS NULL` 레코드는 자동 제외됨

- 매각기일(날짜)

  - `sale_date_from`, `sale_date_to` (포함 범위)

- 면적(평)

  - 건물: `min_building_area_pyeong`, `max_building_area_pyeong`
  - 토지: `min_land_area_pyeong`, `max_land_area_pyeong`

- 다중선택(쉼표 구분 문자열)

  - 층확인: `floor_confirmation=반지하,1층,일반층,탑층` → `IN (...)`
  - 엘리베이터: `elevator_available=O,X` → `IN ('O','X')`
  - 현재상태: `current_status_multi=신건,유찰,재진행,변경,재매각,취하,낙찰` → `IN (...)`
  - 특수조건(True 컬럼): `special_conditions=tenant_with_opposing_power,...` → 해당 컬럼 `IS TRUE` 다중 결합

- 검색
  - 주소: `road_address_search` → `road_address ILIKE '%키워드%'`
  - 사건번호: `case_number_search` → `case_number ILIKE '%키워드%'`

### 4) 페이지네이션 일관성

- 모든 필터는 서버 측에서 선적용 후 페이징(`page`, `size`)이 수행되어, 각 페이지 아이템 수가 항상 `size`를 충족(마지막 페이지 제외)

### 5) 샘플 호출

```bash
curl -G "http://127.0.0.1:8000/api/v1/auction-completed/" \
  --data-urlencode "address_area=경기도" \
  --data-urlencode "address_city=경기도 고양시" \
  --data-urlencode "max_final_sale_price=5000" \
  --data-urlencode "sale_date_from=2025-01-01" \
  --data-urlencode "sale_date_to=2025-12-31" \
  --data-urlencode "min_building_area_pyeong=10" \
  --data-urlencode "max_building_area_pyeong=50" \
  --data-urlencode "floor_confirmation=일반층,탑층" \
  --data-urlencode "elevator_available=O" \
  --data-urlencode "current_status_multi=신건,유찰" \
  --data-urlencode "special_conditions=tenant_with_opposing_power" \
  --data-urlencode "road_address_search=강남구" \
  --data-urlencode "page=1" --data-urlencode "size=20"
```

### 6) 검증 체크리스트

- [ ] 매각가 상한(`max_final_sale_price=5000`) 설정 시 5,000만원 초과 데이터 미포함
- [ ] `sale_date_from/to` 범위 내 아이템만 반환
- [ ] `floor_confirmation=일반층,탑층` → 두 값 중 하나인 레코드만
- [ ] `elevator_available=O` → 엘리베이터 있는 레코드만
- [ ] `current_status_multi` 다중선택 OR 의미로 동작
- [ ] `road_address_search` 부분일치 정상
- [ ] 페이지당 아이템 수가 `size` 유지(마지막 페이지 제외)

### 7) 성능 및 인덱스

- 관련 인덱스: `sale_date(idx)`, `final_sale_price(idx)`, `address_city(idx)` 활용
- 추가 인덱스 필요 시(검색 패턴 증가) 별도 협의

### 8) 호환성

- 모든 파라미터는 선택사항이며, 미지정 시 기존과 동일하게 전체 데이터 페이징
- 기존 클라이언트 호출과 완전 호환

### 9) 참고 사항

- 특수조건 키 매핑(일부 예)
  - `tenant_with_opposing_power`
  - `hug_acquisition_condition_change`
  - `senior_lease_right`
  - `resale(=re_auction)`, `partial_sale(=equity_sale)`, `lien(=lien_right)` 등

—
Backend Team 드림
