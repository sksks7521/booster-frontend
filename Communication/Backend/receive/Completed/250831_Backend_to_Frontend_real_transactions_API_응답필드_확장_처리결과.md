# [처리결과] 실거래가(매매) API 응답 필드 확장 요청

- 날짜: 2025-08-31
- 대상 API: `/api/v1/real-transactions/`
- 상태: 배포 완료(200 OK), 전체 컬럼 응답 + 정규화 + 결측 최소화 보강 적용

## 1) 이번 조치 요약

- 루트 엔드포인트를 전체 컬럼 응답으로 유지하고, 정규화와 보강(fallback/계산) 로직을 추가했습니다.
  - 정규화: 빈 문자열/하이픈(`-`) → null, 불리언 문자열은 스키마에 맞게 정규화.
  - 보강: `road_address`←`road_address_real`, `sido_admin`←`sido`, `building_name`←`building_name_real` 등 기본값 채움.
  - 계산: `exclusive_area_pyeong`(㎡→평), `price_per_sqm`(만원/㎡) 자동 산출.

## 2) 엔드포인트 동작

- GET `/api/v1/real-transactions/?page={page}&size={size}`
  - 응답: 모델 전 컬럼 + 상기 계산 필드, 정규화/보강 적용
- GET `/api/v1/real-transactions/columns`(있다면) 또는 루트 응답으로 컬럼 확인
- GET `/api/v1/user-preferences/analysis/column_order` → 200 OK(기본 빈 배열 구조)

## 3) 검증 결과(서버 로그 기준)

- 200 OK 확인: `/api/v1/real-transactions/?page=3&size=20`, `/api/v1/user-preferences/analysis/column_order`
- 기대 효과: 테이블 “-” 표시는 감소. 다만 DB에 값이 실제로 없는 필드는 null(→ “-”)로 남습니다.

## 4) 여전히 “-”로 보이는 필드에 대하여

- 건축물대장/행정/거래세부 원천 매핑이 필요한 컬럼은 DB 원천에 값이 없으면 “-”가 유지됩니다.
  - 예) `buyer_type`, `seller_type`, `household_count`, `room_number`, `usage_approval_date`, `elevator_count`, `construction_year`, `postal_code`, `admin_dong_name`, `legal_dong_unit` 등
- 권장: ETL로 원천과 키(`pnu`, `admin_code`) 기준 병합하여 주기적 적재.

## 5) 프론트 검증 가이드

- `GET /api/v1/real-transactions/?page=1&size=5` 샘플로 확인

## 6) 후속 제안(선택)

- 원천 매핑 ETL 설계(백필·증분·모니터링 포함)
- Null 비율 리포트 엔드포인트 제공 가능

추가 요청 주시면 즉시 반영하겠습니다.
