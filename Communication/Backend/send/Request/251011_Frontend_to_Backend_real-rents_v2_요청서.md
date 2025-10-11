# [요청] 실거래가(전월세) v2 연동 확정 및 전체 컬럼/필터/정렬 지원

- 날짜: 2025-10-11
- 요청자: Frontend Team
- 대상 API: `/api/v1/real-rents/`, `/api/v1/real-rents/columns`, (선택) `/api/v1/real-rents/by-address`, `/api/v1/real-rents/rental-yield`

## 1. 목적

- 매매 페이지 패턴을 재사용해 전월세(v2) 페이지를 구현합니다.
- 오류를 최소화하기 위해 계약/응답/파라미터 규격을 먼저 확정합니다.

## 2. 필수 요청 사항

1. 엔드포인트/페이지네이션

- GET `/api/v1/real-rents/?page={page}&size={size}`
- 응답: `{ items: Item[], total: number }`

2. 컬럼 메타(정렬 허용 키)

- GET `/api/v1/real-rents/columns`
- 응답 포맷(둘 중 택1, 현재 new 포맷 선호):
  - new: `{ columns: [{ key: string, label?: string, sortable?: boolean }] }`
  - legacy: `{ sortable_columns: string[] }`
- 비고: new/legacy 중 하나로 고정 부탁드립니다.

3. 정렬 파라미터

- 프론트: `sortBy`(camelCase), `sortOrder`(`asc|desc`) → 서버: `ordering=-snake_case`
- 예) `depositAmount desc` → `ordering=-deposit_amount`

4. 지역 파라미터 매핑

- 프론트: `province` | `cityDistrict` | `town`
- 서버: `sido` | `sigungu` | `admin_dong_name`

5. 서버 필터(범위/구분)

- 보증금: `min_deposit_amount`, `max_deposit_amount`
- 월세: `min_monthly_rent`, `max_monthly_rent`
- 전용면적(㎡): `min_exclusive_area`, `max_exclusive_area`
- 건축연도: `min_construction_year`, `max_construction_year`
- 계약일: `contract_date_from`, `contract_date_to` (YYYY-MM-DD)
- 전월세 구분: `rent_type` (전세|월세|연세)
- 계약 구분: `contract_type` (신규|갱신)
- 선택 항목만: `ids` (CSV, 최대 500개)
- 주소 검색(Option A 권장):
  - `address_search` + `address_search_type`(road|jibun)
  - 또는 `road_address_search`

6. 모든 컬럼 지원(프론트 테이블 노출)

- 요청: `/api/v1/real-rents/` 응답에 가능한 모든 컬럼 포함(이미 55개+ 확장됨으로 인지)
- 목적: `columnsRent`와 매핑하여 사용자 선택 컬럼으로 노출/정렬 제한 적용

## 3. 선택 요청 사항

- 상세/주소별: GET `/api/v1/real-rents/by-address?address=...&size=1000&ordering=-contract_date`
- 수익률: GET `/api/v1/real-rents/rental-yield`

## 4. 응답 필드(예시, 주요 키)

- 기본: `id`, `sido`, `sigungu`, `road_address_real`, `building_name_real`, `exclusive_area_sqm`, `construction_year_real`
- 계약: `rent_type`, `contract_type`, `contract_year`, `contract_month`, `contract_day`, `contract_date`, `floor_info_real`
- 금액: `deposit_amount`, `monthly_rent`, (파생) `price`, `price_basis`, `price_k`
- 계산: `exclusive_area_pyeong`, `deposit_per_pyeong`, `monthly_rent_per_pyeong`, `rental_yield_monthly`, `rental_yield_annual`
- 좌표/주소/행정: `latitude`, `longitude`, `jibun_address`, `admin_dong_name`, `building_registry_pk`, `pnu` 등

## 5. 합의 필요/질문

1. `/columns` 포맷 고정(new vs legacy) 가능 여부와 최종 스키마
2. 주소 검색 방안 확정(Option A vs B), 지원 범위(도로명/지번)
3. 서버 필터 지원 범위 확정(보증금/월세/면적/연식/기간/층확인/엘리베이터/ids)
4. 정렬 허용 키 목록(예: `deposit_amount`, `monthly_rent`, `contract_date`, `exclusive_area_sqm`)
5. 응답 필드 전체 목록 최신본 공유(프론트 테이블 매핑용)

## 6. 검증용 샘플

```bash
curl -G "http://127.0.0.1:8000/api/v1/real-rents/" \
  --data-urlencode "sido=서울특별시" \
  --data-urlencode "sigungu=강남구" \
  --data-urlencode "ordering=-contract_date" \
  --data-urlencode "min_deposit_amount=20000" \
  --data-urlencode "max_deposit_amount=100000" \
  --data-urlencode "page=1" \
  --data-urlencode "size=20"

curl -G "http://127.0.0.1:8000/api/v1/real-rents/columns"
```

## 7. 타임라인/위험도

- 프론트는 PHASE 1~2(계약/매핑 확정) 완료 후 PHASE 3(복제·치환) 진행 예정
- 리스크: `/columns` 포맷 상이, 필터 범위 미지원 → 프론트 분기/임시 클라 필터로 완화 가능하나 서버 확정이 최선

감사합니다.
