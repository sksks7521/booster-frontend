## [답신] 실거래가(전월세) 확장 필터 지원 완료 보고 (251011)

### 요약

- GET `/api/v1/real-rents/`에 확장 필터가 추가 적용되었습니다.
- 전월세전환금/연임대수익률/평당 보증금·월세/층확인/엘리베이터 필터를 지원합니다.
- 정렬(`ordering`)은 이전 답신서대로 적용되어 동작합니다.

### 신규 쿼리 파라미터(지원 범위)

- 전월세전환금(만원) 범위: `min_jeonse_conversion_amount`, `max_jeonse_conversion_amount`
- 연임대수익률(%) 범위: `min_rental_yield_annual`, `max_rental_yield_annual`
- 평당 보증금(만원/평) 범위: `min_deposit_per_pyeong`, `max_deposit_per_pyeong`
- 평당 월세(만원/평) 범위: `min_monthly_rent_per_pyeong`, `max_monthly_rent_per_pyeong`
- 층확인 CSV: `floor_confirmation` (예: `반지하,옥탑`)
  - 부분일치 OR 매칭 (예: `반지하` 포함 값 매칭)
- 엘리베이터 여부: `elevator_available` (boolean)
  - 내부 저장(`O`/`X`)에 맞춰 true→`O`, false→`X`로 매핑하여 필터링

### 정렬(참고)

- `ordering` 지원: `-contract_date`, `contract_date`, `-deposit_amount`, `-monthly_rent`, `-exclusive_area_sqm`
- 현재 정렬 허용 컬럼: `contract_date`, `deposit_amount`, `monthly_rent`, `exclusive_area_sqm`
  - 확장 지표 정렬(예: `deposit_per_pyeong`)은 추후 성능 영향 검토 후 단계적 오픈 예정
- 결정적 정렬 보장: 동일 값일 때 `id`로 tie-breaker가 적용되어 재호출 시에도 순서가 안정적입니다.

### 컬럼 메타(`/api/v1/real-rents/columns`)

- 확장 지표를 메타에 포함했습니다:
  - `deposit_per_pyeong`, `monthly_rent_per_pyeong`
- `sortable=true` 컬럼 세트는 현재 다음과 동일합니다: `deposit_amount`, `monthly_rent`, `exclusive_area_sqm`, `contract_date`

### 에러 정책(입력 유효성)

- 잘못된 범위/형식 입력 시 FastAPI 기본 검증 또는 400 계열 에러로 응답합니다.
- 파라미터 명은 스키마로 명시되어 있어 오타 키는 수신되지 않습니다.

### 테스트 예시(curl)

```bash
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

### 수용 기준(AC) 매핑

- AC1: 신규 파라미터로 200 OK 및 필터 적용 결과 반환 → 적용 완료
- AC2: 유효성 에러 시 일관된 400 정책 → 적용
- AC3: 정렬/페이징 결합 시 일관성 유지 → 결정적 정렬(tie-breaker)로 보장
- AC4: `/columns` 메타에 확장 지표 포함, 정렬 가능 키는 정책에 맞춰 표출 → 적용

### 배포/롤아웃

- 개발 브랜치: `feat/real-rents-v2-251011`
- 프론트 통합 테스트 완료 후 메인 병합/배포 예정

### 기타

- 정렬 허용 컬럼 확장(예: `deposit_per_pyeong`)이 필요하면, 데이터 분포/인덱스/성능 영향 검토 후 다음 스프린트에서 반영 가능합니다.
