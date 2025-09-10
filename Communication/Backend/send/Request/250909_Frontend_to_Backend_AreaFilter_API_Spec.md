# [요청] 영역 안만 보기 서버 필터링 API 규격 (auction_ed 전용)

## 0) 사전 점검 요청(백엔드)

- DB에 PostGIS 확장 설치/사용 가능 여부 회신 (postgis, postgis_topology)
- 버전 정보 회신 (PostgreSQL / PostGIS)
- 확장/인덱스 생성 권한 유무
- 대상 테이블(auction_ed) 현황
  - 원시 좌표 필드(lat/lng) 존재 여부
  - geometry(Point, 4326) 컬럼 존재 여부(없다면 생성 예정)
  - 기존 데이터의 좌표 정합(0,0/범위초과 값 처리 방침)

### 요청 전문(복붙용)

안녕하세요. 프런트엔드입니다.

auction_ed 데이터셋에 "영역 안만 보기(원/반경)" 서버 필터 도입을 위해 아래 항목 확인 부탁드립니다.

1. 환경/권한

- PostGIS 확장 설치 및 사용 가능 여부(postgis, postgis_topology)
- PostgreSQL/PostGIS 버전
- 확장/DDL(컬럼/인덱스) 생성 권한 보유 여부

2. 테이블 현황(auction_ed)

- 원시 좌표 컬럼(lat/lng) 존재 여부와 NULL/이상치(0,0/범위초과) 비율
- geometry(Point, SRID 4326) 컬럼 존재 여부(없으면 생성 가능 여부/권장 컬럼명 제시: geom)

3. 인덱스/쿼리 합의

- GIST 인덱스(geom) 생성 가능 여부(권장 명: idx_auction_ed_geom_gist)
- 반경 쿼리 방식 승인: ST_DWithin(geom::geography, ST_MakePoint(:lng,:lat)::geography, :radius_m)
- page/size 정책: size 최대치(max_size=1000) 합의, 임의 50 cap 미적용 보장
- 정렬 허용 컬럼 목록(snake_case) 확정: sale_date, final_sale_price, bidder_count, construction_year 등

4. 성능 벤치 계획

- 반경 2km/5km 케이스에 대해 EXPLAIN ANALYZE 수행, 인덱스 스캔 확인, p95 지연 목표 < 200ms (조정 가능)

5. 일정/담당/리스크

- 예상 일정/담당자/롤백 계획 공유(DDL/마이그레이션 포함)

회신 주시면 좌표 컬럼 생성→백필→GIST 인덱스 생성→벤치 순으로 진행하겠습니다. 감사합니다.

### 응답 템플릿(예시)

- PostGIS: 설치/사용 가능(버전: PostgreSQL 14.x / PostGIS 3.x)
- 권한: 확장/DDL/인덱스 생성 권한 보유(예/아니오)
- 테이블(auction_ed): lat/lng 존재(유효 xxxxx건, 0,0 yyyy건, 범위초과 zzzz건), geom(Point,4326) 없음 → 생성 예정(컬럼명 geom)
- 인덱스/쿼리: GIST 인덱스 생성 가능, ST_DWithin 방식 승인, max_size=1000 합의, ordering 허용 키 [sale_date, final_sale_price, bidder_count, construction_year]
- 벤치: 2km/5km 케이스 EXPLAIN ANALYZE 예정, 목표 p95 < 200ms
- 일정/담당/리스크: (예) DDL 9/10, 백필 9/10, 인덱스 9/10, 벤치 9/11, 담당 홍길동, 리스크(잠금/백필 시간)

## 1) 목적

- 영역(원/반경) 포함 전체 필터를 서버에서 처리(필터 → 정렬 → 페이지네이션)하여 일관된 `results/total/page/size/ordering`을 반환합니다.
- 프런트는 결과 표시만 담당합니다(영역 필터 클라이언트 처리 제거, 폴백은 플래그로 유지).

## 2) 범위

- 본 문서는 과거 경매 결과 `auction_ed` 전용 규격입니다.
- 실거래(sale), 전월세(rent), 매물(listings)는 추후 별도 문서로 정의합니다(본 문서에 포함하지 않음).

## 3) 엔드포인트

- GET `/api/v1/auction-completed/`

## 4) 요청 파라미터 (auction_ed)

- 영역(원형) — 필수
  - **center_lat**: number (위도, WGS84)
  - **center_lng**: number (경도, WGS84)
  - **radius_m**: number (미터)
- 지역 — 선택(선택 시 모두 AND)
  - **province**: string → 서버 `address_area`
  - **cityDistrict**: string → 서버 `address_city` (예: `경기도 고양시` 전체 문자열)
  - **town**: string → 서버 `eup_myeon_dong`
- 가격(만원) — 선택(둘 중 존재 값만 적용)
  - **price_min**: number → `min_final_sale_price`
  - **price_max**: number → `max_final_sale_price` (상한 예시: < 500000)
- 면적(평) — 선택
  - **area_min**: number → `min_building_area_pyeong`
  - **area_max**: number → `max_building_area_pyeong`
  - (옵션) **land_area_min/max**: number → `min_land_area_pyeong`/`max_land_area_pyeong`
- 건축년도 — 선택
  - **build_year_min**: number(예: ≥ 1900) → `min_construction_year`
  - **build_year_max**: number(예: ≥ 1900) → `max_construction_year`
- 매각기일(날짜) — 선택(ISO YYYY-MM-DD)
  - **date_from**: string → `sale_date_from`
  - **date_to**: string → `sale_date_to`
  - (또는) **saleYear**: number → `sale_date_from=YYYY-01-01`, `sale_date_to=YYYY-12-31`
- 전용 필터 — 선택(모두 AND)
  - **elevator_available**: string(코드) — `Y` 또는 `N`
  - **floor_confirmation**: string(콤마 조인) — 예: `지하,저층` (서버 저장값과 "완전일치" 기준)
  - **current_status**: string(콤마 조인) — 예: `말소기준권리미상,미상`
  - **special_rights**: string(콤마 조인) — 예: `유치권,법정지상권`
- 검색 — 선택
  - **search_field**: `address` | `road_address` | `case_number`
  - **search_query**: string
    - `address` → `address_search`
    - `road_address` → `road_address_search`
    - `case_number` → `case_number_search`
- 정렬/페이징 — 선택
  - **ordering**: string — `[-]snake_case_key` (예: `-sale_date`)
    - 허용 키 예: `sale_date`, `final_sale_price`, `bidder_count`, `construction_year`
  - **page**: number (기본 1)
  - **size**: number (기본 20, 최대 `max_size`=1000)

## 5) 처리 순서(서버)

1. 입력 검증 및 변환
   - 라벨/불리언 입력은 코드/정규 값으로 변환(본 규격에서는 `elevator_available`를 `Y/N`로 받음)
2. 공간 필터(원형)
   - PostGIS 예: `ST_DWithin(geom::geography, ST_MakePoint(lng,lat)::geography, radius_m)`
3. 상세 필터(지역/가격/면적/연식/전용/검색) AND 결합
4. 정렬: `ordering`
5. 페이지네이션: `page/size` 적용, `total` 계산(공간+상세필터 전체에 대해)
   - 어떤 조합에서도 `page/size` 존중(임의 50 cap 금지, 단 서버 `max_size`는 명시)

## 6) 응답 스펙(공통)

```json
{
  "results": [
    /* 아이템 배열 */
  ],
  "total": 290,
  "page": 1,
  "size": 1000,
  "ordering": "-sale_date"
}
```

## 7) 예시 요청

```
GET /api/v1/auction-completed/?
  address_area=경기도&address_city=경기도 고양시&
  center_lat=37.65&center_lng=126.84&radius_m=5000&
  sale_date_from=2022-01-01&sale_date_to=2024-12-31&
  min_final_sale_price=20000&max_final_sale_price=50000&
  min_building_area_pyeong=10&max_building_area_pyeong=40&
  floor_confirmation=지하,저층&
  elevator_available=Y&
  current_status=말소기준권리미상&
  special_rights=유치권,법정지상권&
  ordering=-sale_date&page=1&size=1000
```

## 8) 유효성/오류 처리

- 누락/무효 중심/반경: 400 (필수: center_lat/lng/radius_m)
- `size`가 `max_size` 초과: 400 (메시지에 상한 명시)
- 허용되지 않은 `ordering` 키: 400 (허용 목록 반환)
- 전용 필터 값 불일치: 해당 값은 무시 또는 400 (정책 합의 필요)

## 9) 성능/운영

- 좌표 컬럼(Point, SRID 4326) + GIST 인덱스 필수
- 슬로우 쿼리/에러율/지연 p95 모니터링 및 알림 구성
- `max_size`=1000 권장(합의 가능)

## 10) 수락 기준(완료 정의)

- 동일 조건에서 합계 일관: `있음+없음=영역 전체`, `0~20평 + 20~100평=영역 전체`
- 정렬 asc↔desc/반경 2000↔5000 토글 시 `total` 불변(동일 조건)
- 모든 필터 조합에서 `page/size/total` 일관(임의 50 cap 없음)
- 대용량에서도 타임아웃/성능 기준 충족

## 11) 비고

- 본 문서는 `auction_ed` 전용입니다. `sale/rent/listings`는 추후 별도 스펙으로 제출합니다.
