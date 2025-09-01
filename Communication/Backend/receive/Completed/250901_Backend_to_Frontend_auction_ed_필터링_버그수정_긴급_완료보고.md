## 🛠️ Backend→Frontend | auction_ed 필터링 버그 긴급 수정 완료 보고 (2025-09-01)

### 1) 요약

- 접수 문서: `250901_Frontend_to_Backend_auction_ed_필터링_버그수정_긴급요청.md`
- 대상 API: `GET /api/v1/auction-completed/`
- 조치 결과: 매각가 상한/하한, 엘리베이터(불리언/CSV), 기타 범위·다중·검색 필터가 서버 측에서 정상 동작하도록 수정/보강 완료

### 2) 원인 및 수정 사항

1. 매각가 필터 미작동

   - **원인**: 범위 비교 시 `final_sale_price`의 `NULL`/`0` 값이 함께 섞여 반환될 가능성 존재
   - **수정**: 가격 범위 필터 사용 시 `final_sale_price IS NOT NULL AND final_sale_price > 0`을 선적용 후 `>= / <=` 비교 적용

2. 엘리베이터 필터 미작동

   - **원인**: 프론트가 `elevator_available=false`(불리언 표현)로 전달하는 케이스 미해석
   - **수정**: 파라미터 호환 확장(우선순위 순)
     - `has_elevator`(boolean) → 최우선
     - `elevator_available`가 `true/false/o/x/1/0` 등 불리언 표현이면 boolean으로 해석
     - 그 외에는 `elevator_available=O,X` 같은 CSV 다중값으로 처리

3. 종합 필터 보강(요청서 반영)
   - 매각기일: `sale_date_from`, `sale_date_to`
   - 면적(평): `min_building_area_pyeong`, `max_building_area_pyeong`, `min_land_area_pyeong`, `max_land_area_pyeong`
   - 건축연도: `min_construction_year`, `max_construction_year`
   - 층확인(다중): `floor_confirmation=반지하,1층,일반층,탑층`
   - 현재상태(다중): `current_status_multi=신건,유찰,...` (단일 `current_status`도 호환 처리)
   - 특수조건(다중): boolean 컬럼 True OR `special_rights ILIKE '%키%'` 포함 검색 동시 지원
   - 검색: `road_address_search`, `case_number_search` 부분 일치

### 3) 변경 파일

- `app/api/v1/endpoints/auction_completed.py`

  - 불리언/CSV 혼용 엘리베이터 파라미터 파싱 추가
  - 루트 엔드포인트에 건축연도/기타 필터 파라미터 확장 및 CRUD 전달

- `app/crud/crud_auction_completed.py`
  - 가격 범위 사용 시 `NULL/0` 제외 후 범위 비교 적용
  - 특수조건: boolean True OR 텍스트 포함(OR)로 매칭 확대
  - 날짜/면적/층확인/현재상태/검색 등 서버 필터 일괄 적용

### 4) 재현 및 검증 방법

1. 매각가 상한 + 엘리베이터 없음

```bash
curl -G "http://127.0.0.1:8000/api/v1/auction-completed/" \
  --data-urlencode "max_final_sale_price=15000" \
  --data-urlencode "elevator_available=false" \
  --data-urlencode "page=1" --data-urlencode "size=20"
```

2. 엘리베이터 있음(불리언 우선)

```bash
curl -G "http://127.0.0.1:8000/api/v1/auction-completed/" \
  --data-urlencode "has_elevator=true" \
  --data-urlencode "page=1" --data-urlencode "size=20"
```

3. 종합 예시(요청서 기준)

```bash
curl -G "http://127.0.0.1:8000/api/v1/auction-completed/" \
  --data-urlencode "address_area=경기도" \
  --data-urlencode "address_city=경기도 고양시" \
  --data-urlencode "sale_date_from=2025-06-01" \
  --data-urlencode "sale_date_to=2025-07-31" \
  --data-urlencode "max_final_sale_price=15000" \
  --data-urlencode "max_building_area_pyeong=100" \
  --data-urlencode "max_land_area_pyeong=200" \
  --data-urlencode "min_construction_year=1980" \
  --data-urlencode "max_construction_year=2024" \
  --data-urlencode "elevator_available=false" \
  --data-urlencode "page=1" --data-urlencode "size=20"
```

### 5) 추가 체크리스트

- [ ] `max_final_sale_price` 적용 시 15,000만원 초과 값 미포함(경계값 15,000은 포함)
- [ ] `elevator_available=false` 또는 `has_elevator=false` 사용 시 "X"만 반환
- [ ] 날짜/면적/층확인/현재상태/검색 필터 개별 및 조합 시 AND로 정상 동작
- [ ] 페이지네이션: 필터 적용 후 `size` 개수 유지(마지막 페이지 제외)

### 6) 후속

- 프론트에서 동일 조건으로 재검증 부탁드립니다. 문제가 재현되면 실제 호출 URL을 그대로 공유해 주시면 즉시 재현/수정하겠습니다.

—
Backend Team 드림
