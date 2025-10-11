# [답신] 실거래가(전월세) v2 연동 지원 사항 안내

- 날짜: 2025-10-11
- 발신: Backend Team
- 수신: Frontend Team
- 대상 API: `/api/v1/real-rents/`, `/api/v1/real-rents/columns`

## 1) 결론

- 요청하신 v2 연동 요구사항을 반영했습니다. 페이지네이션, 컬럼 메타(new 포맷), 정렬 파라미터 맵핑, 지역/필터 파라미터 확장을 지원합니다.

## 2) 엔드포인트 및 응답

- GET `/api/v1/real-rents/?page={page}&size={size}`
  - 응답: `{ items: Item[], total: number, page, size, total_pages }`
- GET `/api/v1/real-rents/columns`
  - new 포맷: `{ columns: [{ key, label, sortable, type, description, example }], total_columns, sortable_columns }`
  - 비고: `sortable_columns`는 참고용으로 병행 제공합니다.

## 3) 파라미터 맵핑

- 정렬

  - 프론트: `sortBy`(camelCase), `sortOrder`(`asc|desc`)
  - 서버 내부 변환: `ordering=-snake_case`(내부적으로 `sort_by`, `sort_order` 적용)
  - 지원 키: `depositAmount→deposit_amount`, `monthlyRent→monthly_rent`, `exclusiveAreaSqm→exclusive_area_sqm`, `contractDate→contract_date`

- 지역

  - 프론트 → 서버: `province→sido`, `cityDistrict→sigungu`, `town→admin_dong_name`
  - 기존 호환 파라미터: `address_city`도 병행 지원

- 필터(범위/구분)
  - 보증금: `min_deposit_amount`, `max_deposit_amount`
  - 월세: `min_monthly_rent`, `max_monthly_rent`
  - 전용면적(㎡): `min_exclusive_area`, `max_exclusive_area`
  - 건축연도: `min_construction_year`, `max_construction_year`
  - 계약일: `contract_date_from`, `contract_date_to` (YYYY-MM-DD)
  - 전월세 구분: `rent_type` (전세|월세|연세-향후)
  - 계약 구분: `contract_type` (신규|갱신)
  - 선택 항목만: `ids` (CSV, 최대 500개)
  - 주소 검색: `address_search` + `address_search_type`(road|jibun) 또는 `road_address_search`

## 4) 컬럼 메타(/columns)

- 포맷: new 고정
  - 예시: `{ columns: [{ key: "deposit_amount", label: "Deposit Amount", sortable: true, type: "integer", ... }], total_columns: 55, sortable_columns: ["deposit_amount", "monthly_rent", "exclusive_area_sqm", "contract_date"] }`
- 주의: `label`은 단순 가공(스네이크→스페이스, 단어별 Capitalize)이며, 추가 커스텀 라벨이 필요하면 알려주세요.

## 5) 응답 필드(요약)

- 전체 컬럼 응답: 루트 엔드포인트(`/`)는 모든 주요 필드를 포함해서 반환합니다. `exclusive_area_pyeong`, `deposit_per_pyeong`, `monthly_rent_per_pyeong`, `rental_yield_monthly`, `rental_yield_annual` 등의 계산 필드도 포함됩니다.

## 6) 샘플

```bash
curl -G "http://127.0.0.1:8000/api/v1/real-rents/" \
  --data-urlencode "province=서울특별시" \
  --data-urlencode "cityDistrict=강남구" \
  --data-urlencode "town=역삼1동" \
  --data-urlencode "ordering=-contract_date" \
  --data-urlencode "min_deposit_amount=20000" \
  --data-urlencode "max_deposit_amount=100000" \
  --data-urlencode "page=1" \
  --data-urlencode "size=20"

curl -G "http://127.0.0.1:8000/api/v1/real-rents/columns"
```

## 7) 합의 필요 사항

- `/columns`에서 `sortable_columns`를 완전히 제거하고 `columns[].sortable`만 유지할지 여부
- 주소검색에서 `road`/`jibun` 이외의 키워드(예: building_name) 추가 필요 여부

## 8) 다음 단계(선택)

- 선택 엔드포인트: `/api/v1/real-rents/by-address`, `/api/v1/real-rents/rental-yield` 필요 시 바로 추가 가능합니다.

감사합니다.
