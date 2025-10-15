## 실거래가(전월세) 확장 필터 지원 요청

### 배경

- 전월세 필터 UX를 매매와 동일 패턴으로 제공하려 합니다.
- 현재 서버에서 확실히 지원되는 필터(보증금/월세/면적/건축연도/계약일/구분/계약구분/주소검색)는 바로 연동 가능합니다.
- 아래 확장 항목(전환금/연임대수익률/평당 보증금·월세/층확인/엘리베이터)은 서버 지원 여부 확인이 필요합니다.

### 대상 엔드포인트

- GET `/api/v1/real-rents/`

### 요청 항목(신규 파라미터 제안)

1. 전월세전환금(만원) 범위

   - `min_jeonse_conversion_amount`, `max_jeonse_conversion_amount`
   - 비고: 응답 필드 `jeonse_conversion_amount` 기준

2. 연임대수익률(%) 범위

   - `min_rental_yield_annual`, `max_rental_yield_annual`
   - 비고: 응답 필드 `rental_yield_annual` 기준

3. 평당보증금(만원/평) 범위

   - `min_deposit_per_pyeong`, `max_deposit_per_pyeong`
   - 비고: 응답 필드 `deposit_per_pyeong` 기준

4. 평당월세(만원/평) 범위

   - `min_monthly_rent_per_pyeong`, `max_monthly_rent_per_pyeong`
   - 비고: 응답 필드 `monthly_rent_per_pyeong` 기준

5. 층확인 필터

   - `floor_confirmation` (CSV: 예 `"반지하,지하,옥탑"`)
   - 비고: 응답 필드 `floor_confirmation` 기준

6. 엘리베이터 여부
   - `elevator_available` (boolean)
   - 비고: 응답 필드 `elevator_available` 기준

### 기존 연동(참고: 이미 구현/검증됨)

- 지역: `sido`, `sigungu(시도+시군구 보정)`, `admin_dong_name`
- 보증금 범위: `min_deposit_amount`, `max_deposit_amount`
- 월세 범위: `min_monthly_rent`, `max_monthly_rent`
- 전용면적: `min_exclusive_area`, `max_exclusive_area`
- 건축연도: `min_construction_year`, `max_construction_year`
- 계약일자: `contract_date_from`, `contract_date_to`
- 전월세 구분: `rent_type`
- 계약 구분: `contract_type`
- 주소 검색: `address_search` + `address_search_type=road|jibun` (또는 `road_address_search`)

### 정렬(참고)

- `ordering` 지원(예: `-contract_date`)은 별도 요청서로 전달한 대로 적용 부탁드립니다.
- 확장 지표가 정렬 허용일 경우 `/api/v1/real-rents/columns`에도 해당 키(snake_case) 포함 요청드립니다.

### 수용 기준(AC)

1. 상기 신규 파라미터로 200 OK 및 필터 적용된 결과를 반환
2. 잘못된 범위/형식 입력 시 400 등 일관된 에러 정책
3. 정렬/페이징과 결합 시에도 결과 일관성 유지
4. `/columns` 메타에 정렬 가능 키 표출(해당 시)

### 테스트 예시(curl)

```bash
# 전월세전환금 + 연임대수익률 + 평당 보증금/월세 + 층확인 + 엘리베이터
curl -G "http://127.0.0.1:8000/api/v1/real-rents/" \
  --data-urlencode "sido=서울특별시" \
  --data-urlencode "sigungu=서울특별시 강남구" \
  --data-urlencode "min_jeonse_conversion_amount=6000" \
  --data-urlencode "max_jeonse_conversion_amount=13000" \
  --data-urlencode "min_rental_yield_annual=3" \
  --data-urlencode "max_rental_yield_annual=8" \
  --data-urlencode "min_deposit_per_pyeong=50" \
  --data-urlencode "max_deposit_per_pyeong=300" \
  --data-urlencode "min_monthly_rent_per_pyeong=1" \
  --data-urlencode "max_monthly_rent_per_pyeong=10" \
  --data-urlencode "floor_confirmation=반지하,옥탑" \
  --data-urlencode "elevator_available=true" \
  --data-urlencode "page=1" \
  --data-urlencode "size=20"
```

### 일정 제안

- 구현/배포 1~2d, 문서/메타 `/columns` 반영 0.5d, 프론트 검증 0.5d

감사합니다.
