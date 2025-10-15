# [Frontend→Backend] 실거래가(매매) 목록↔지도(/map) 정합성 및 필터 연동 요청 (251013)

## 배경

- 동일 화면에서 목록과 지도 결과가 일부 필터에서 불일치합니다.
- 경매 결과(v2)에서 해결했던 패턴을 실거래가(매매)에도 동일 적용하려 합니다.

## 목표

- 목록과 지도가 동일한 필터 집합 S를 기준으로 동작.
- `/map total`은 항상 집합 S의 총 개수, `items`는 거리 오름차순 상위 `limit=K`.
- 필요 시 영역 모드(`/area`)도 동일 규칙.

## 대상 엔드포인트

- GET `/api/v1/real-transactions/` (목록)
- GET `/api/v1/real-transactions/map` (지도, 거리정렬+limit)
- GET `/api/v1/real-transactions/area` (선택, 중심/반경 기반 대용량)

## 파라미터 정합(목록과 동일 처리)

아래 키를 목록/지도/영역 모두 동일 규칙으로 적용해 주세요.

### 지역

- `sido`, `sigungu`, `admin_dong_name` (또는 목록과 동일한 서버 표준 키)

### 금액/면적/년도

- 거래금액(만원): `min_transaction_amount`, `max_transaction_amount`
- 전용면적(㎡ 또는 평): `exclusive_area_min`, `exclusive_area_max`
- 대지권면적(㎡ 또는 평): `land_rights_area_min`, `land_rights_area_max`
- 평당가(선택): `price_per_pyeong_min`, `price_per_pyeong_max`
- 건축년도: `build_year_min`, `build_year_max`
- 계약일: `date_from`, `date_to` (빠른선택 연도 YYYY → `date_from=YYYY-01-01`, `date_to=YYYY-12-31`)

### 편의/상태/검색

- 층확인: `floor_confirmation` (CSV: 반지하, 1층, 일반층, 옥탑, 확인불가)
- 엘리베이터: `elevator_available` (Y/N/O/X/true/false/있음/없음 → 서버 내부 표준으로 정규화)
- 검색: `road_address`/`address`/`apt_name`/`pnu` 등 합의된 필드에 대해 `*_search`
- 선택만 보기: `ids` (CSV, 선택 시에만)

### 정렬/표시상한

- `/map` 기본 정렬: `distance_asc`
- `limit=K`만 `items`에 반영, `total`은 집합 S 전체.

## 기본값 가드(중요)

- 다음은 미설정으로 간주하여, 서버가 무시하거나 FE가 미전송해도 동일 동작이 되도록 부탁드립니다.
  - 거래금액 기본 범위(예: 0~상한)
  - 전용면적/대지권면적 기본 범위
  - 평당가 기본 범위
- 경계값 처리: 상한 미만(<) 규칙 등 내부 규칙이 있으면 공유 요청드립니다.

## 응답 echo(검증 편의)

- `echo.filters`: 서버가 최종 사용한 정규화된 필터 맵
- `echo.ordering`: 적용 정렬 (기본 `distance_asc`)
- `echo.limit`: 사용된 limit 값
- (가능 시) `echo.totals.pre_spatial_total`: 공간(거리) 제한 전 집합 S 총량

## 프론트에서 진행할 작업(사전 공유)

- `/map` 페이로드 빌더 구현: 목록 필터→서버 키 매핑 + 기본값 가드 적용
- `/area` 쿼리 빌더(옵션) 동일 적용
- UI 정리: 경매와 동일 레이아웃(경고 배너 상단, 표시상한+표시K/총T, 영역안만 보기)
- 네트워크 디버그: 개발 모드에서 요청/응답 echo 요약 로그 노출

## 백엔드에 요청드리는 사항

1. 위 파라미터를 `/map`(및 `/area`)에서 목록과 동일 규칙으로 처리
2. 기본값 가드 수용 또는 FE 미전송 시 동등 동작 보장
3. 응답에 `total`=집합 S 총량, `items`=거리정렬 상위 K
4. `echo.*` 필드 제공(위 목록)
5. 서버가 사용하는 파라미터명/내부 컬럼/정규화 규칙을 표로 회신

## 상호 정보 공유(필수)

- 프론트 → 백엔드 제공
  - 필터 UI의 실제 키/라벨, 기본값, 빠른선택 변환 규칙
  - 지도 기준점/반경/표시상한 정책(K 값)
  - 네임스페이스/정렬 사용 여부
- 백엔드 → 프론트 제공
  - 파라미터명 ↔ 내부 컬럼 매핑 표
  - 기본값/경계 처리(미만/이하) 규칙
  - 반환 스키마(`items`, `total`, `echo`)와 예시 응답

## 재현용 예시 요청(URL 스켈레톤)

```
GET /api/v1/real-transactions/map?
  center_lat={lat}&center_lng={lng}&limit=500&
  sido=경기도&sigungu=경기도+고양시&
  min_transaction_amount=1000&max_transaction_amount=80000&
  exclusive_area_min=40&exclusive_area_max=85&
  build_year_min=1995&build_year_max=2024&
  date_from=2021-01-01&date_to=2021-12-31&
  floor_confirmation=반지하,1층,일반층,옥탑&
  elevator_available=Y
```

## QA 체크리스트(요약)

- [ ] 무필터: 목록 total == `/map total`
- [ ] 범위 필터(금액/면적/년도/평당가): 목록 total 변화 == `/map pre_spatial_total`
- [ ] 층확인/엘리베이터 토글: 일치
- [ ] 선택만 보기(ids): 일치
- [ ] 영역 모드: 일치

감사합니다.

