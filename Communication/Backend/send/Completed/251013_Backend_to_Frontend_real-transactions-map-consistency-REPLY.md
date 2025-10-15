# [Backend→Frontend] 실거래가(매매/전월세) 목록↔지도(/map) 정합성 및 필터 연동 답신 (251013)

## 요약(합의)

- 총계 정책: `/map total`은 항상 집합 S(목록과 동일 필터만 적용, 공간/좌표 제약 전)의 총 개수. `items`는 거리 오름차순 상위 `limit=K`.
- 기본값 가드: 금액/면적/평당가 등 기본 범위는 "미설정"으로 간주(미전송 권장). 서버도 동등 동작 보장.
- echo: `/map` 응답에 `echo.filters`, `echo.ordering`, `echo.limit`, `echo.totals.pre_spatial_total` 제공.
- 적용 범위: 실거래가(매매: sale), 실거래가(전월세: rent) 공통.

## 백엔드 준비/변경 사항

1. 실거래가 `/map`(sale, rent)
   - `pre_spatial_total` 산출 및 `echo.totals.pre_spatial_total` 필드 포함.
   - 기본값 가드 수용(아래 기본 조합은 미적용 처리로 간주).
   - 목록과 동일 키/별칭 수용(하위 호환 유지).
2. 실거래가 `/area`(선택)
   - 동일 총계/echo 정책 적용(필요 시).
3. 검증 로그 강화
   - 요청/응답 echo에 정규화된 필터, 정렬, limit 기록.

## 파라미터 매핑(목록과 동일 규칙)

- 지역: `sido`, `sigungu`, `admin_dong_name`
- 금액/면적/년도:
  - 거래금액(만원): `min_transaction_amount`, `max_transaction_amount`
  - 전용면적: `exclusive_area_min`, `exclusive_area_max`
  - 대지권면적: `land_rights_area_min`, `land_rights_area_max`(해당 데이터 보유 시)
  - 평당가: `price_per_pyeong_min`, `price_per_pyeong_max`
  - 건축년도: `build_year_min`, `build_year_max`
  - 계약일: `date_from`, `date_to` (연 선택 → 1/1~12/31 자동 확장 허용)
- 편의/상태/검색:
  - 층확인: `floor_confirmation`(CSV)
  - 엘리베이터: `elevator_available`(Y/N/O/X/true/false/있음/없음 → 서버 표준화)
  - 검색: `address_search`(또는 `road_address_search`/`jibun_address_search`)
  - 선택만 보기: `ids`(CSV)
- 정렬/표시상한: `ordering`(또는 `sort_by/sort_order`), `limit`

## 기본값 가드(권장 동작)

- 아래 조합은 가격/면적/평당가 필터 미적용으로 간주(전송하지 않아도 됨):
  - 거래금액: `min_transaction_amount=0` AND `max_transaction_amount=기본최대`
  - 전용면적/대지권면적/평당가: 각 0~기본최대
- 상한 비교 규칙: 상한 미만(<) 권고(이하와의 차이는 echo에 반영 예정).

## FE 구현 가이드(핵심)

- 페이로드 빌더: 목록 필터 → 서버 키로 매핑. 기본값 상태면 파라미터 자체 미전송.
- 재조회 트리거: 어떤 필터가 바뀌어도 목록과 지도 모두 재조회(`/map`) 발생.
- 정렬/limit: `/map` 기본 정렬 `distance_asc`, `limit=K`만 items에 반영.
- QA: `/map`의 `echo.totals.pre_spatial_total`과 목록 total 일치 확인.

## 호출 예시

```http
GET /api/v1/real-transactions/map?
  center_lat=37.5&center_lng=127.0&limit=500&
  sido=경기도&sigungu=경기도+고양시&
  min_transaction_amount=1000&max_transaction_amount=80000&
  exclusive_area_min=40&exclusive_area_max=85&
  build_year_min=1995&build_year_max=2024&
  date_from=2021-01-01&date_to=2021-12-31&
  floor_confirmation=반지하,1층,일반층,옥탑&
  elevator_available=Y
```

- 기대: `echo.totals.pre_spatial_total`이 목록 total과 동일, `items`는 거리순 상위 500개만 반환.

## 상호 정보 공유(요청)

- FE → BE: UI 실제 키/라벨, 기본값/빠른선택 규칙, 지도 기준점/표시상한 정책.
- BE → FE: 파라미터↔내부컬럼 매핑 표, 경계 처리 규칙(미만/이하), 응답 스키마 예시.

감사합니다.
