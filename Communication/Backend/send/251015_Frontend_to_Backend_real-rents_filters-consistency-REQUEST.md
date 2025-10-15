# Frontend → Backend 요청: 실거래가(전월세) 목록·지도 필터 정합성 및 파라미터 별칭 수용

## 배경

- 목록(`/api/v1/real-rents/`)과 지도(`/api/v1/real-rents/map`)에 동일 필터를 적용해도 결과 개수/표본 경고가 일치하지 않는 사례가 있었습니다.
- 매매(sale)에서 적용한 공통 빌더·가드·별칭 전략을 전월세(rent)에도 동일하게 적용하기 위해 서버 측 파라미터 수용 범위를 정합화해 주시길 요청드립니다.

## 요청 사항

1. 파라미터 표준 키 수용(목록/지도 공통)

- 지역: `sido`, `sigungu`, `admin_dong_name`
- 날짜: `contract_date_from`, `contract_date_to`
- 면적: `min_exclusive_area`, `max_exclusive_area`
- 보증금: `min_deposit`, `max_deposit`
- 월세: `min_monthly_rent`, `max_monthly_rent`
- 전월세 전환금: `min_conversion_amount`, `max_conversion_amount`
- 평당 보증금: `min_deposit_per_pyeong`, `max_deposit_per_pyeong`
- 평당 월세: `min_monthly_rent_per_pyeong`, `max_monthly_rent_per_pyeong`
- 구분/편의: `rent_type`, `floor_confirmation`(CSV), `elevator_available`(Y|N)
- 선택: `ids`(CSV, 최대 500)
- 정렬: `ordering`(예: `-contract_date`)

2. 파라미터 별칭도 병행 수용(과도기 호환)

- 예) `exclusive_area_min/max`, `deposit_min/max`, `monthly_rent_min/max`, `conversion_amount_min/max`, `deposit_per_pyeong_min/max`, `monthly_rent_per_pyeong_min/max`
- 주소 검색: `road_address_search`, `jibun_address_search` (표준: `address_search` + `address_search_type=road|jibun|both`)

3. 지도 API(KNN) 명세 확인

- 쿼리: `dataset=rent&sort=distance_asc&ref_lat=..&ref_lng=..&limit=K`
- 응답 echo에 `sort`, `ref_lat`, `ref_lng`, `limit` 반영 및 `total`/`warning`(상위 K 반환 안내) 포함 요청

4. 기본값 가드 권고(서버해석)

- 0~max 등 무의미 기본범위 수신 시 필터 미적용 처리 권고(프론트에서도 stripDefaults 적용 중)

## 프론트엔드 적용 현황

- 공통 빌더: `Application/lib/filters/buildRentFilterParams.ts`
- 목록: `Application/datasets/registry.ts` 적용(표준+별칭 병행 전송, 기본값 가드)
- 지도: `Application/components/features/rent/mapPayload.ts`, `Application/components/features/rent/RentSearchResults.tsx` 적용(KNN, 디바운스/트레일링, echo 로그)
- 스토어 브릿지: 구키(hasElevator 등) 유입 시 표준키로 동기화

## 검증 시나리오(예)

- 지역 + 전용면적(59~84) + 전세만 + 보증금(2천~3억) + 최근 6개월 + 엘리베이터=Y + 일반층/탑층
- 목록 `total`과 지도 응답의 `pre_spatial_total`(또는 `total`)이 일관되게 변하는지 확인
- 지도 echo의 `sort=distance_asc`, `ref_lat/ref_lng`가 요청 기준점과 일치

## 추가 메모

- 엘리베이터는 Y/N 기준으로 전달합니다(문자열). 필요 시 true/false 별칭 병행 수용 검토 부탁드립니다.
