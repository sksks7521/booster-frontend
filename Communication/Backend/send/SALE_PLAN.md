## SALE_PLAN: 실거래가(매매) 필터·지도 정합성 및 KNN 정리

### 1) 범위

- 목록(`/api/v1/real-transactions/`)과 지도(`/api/v1/real-transactions/map`) 간 필터 정합성
- 공통 필터 빌더 적용 및 별칭(aliases) 병행 지원
- 기본값 가드(stripDefaults): 0~max 등 무의미 범위 미전송
- 서버 KNN 사용 모드 정리(`nearestLimitSaleIsServer=true`)
- 주소 검색, 전용/대지권 면적, 엘리베이터 등 상세필터 동작 확인

### 2) 목표

- 동일한 필터 세트로 목록·지도 결과가 일치하는 합계/경고/표본 한정
- 지도는 서버 KNN(`sort=distance_asc, ref_lat/ref_lng, limit=K`) 기반으로 최신 뷰포트 중심에 맞춘 결과 제공

### 3) 구현 개요

- `Application/lib/filters/buildSaleFilterParams.ts` 공통화
- `Application/datasets/registry.ts` 목록 필터 빌더 교체
- `Application/components/features/sale/mapPayload.ts` 지도 필터 빌더 교체
- `Application/store/filterStore.ts` 표준키 도입 및 브릿지(구키→신키)
- `Application/components/features/sale/SaleSearchResults.tsx` 디바운스+trailing 재호출, 주소검색 의존성 추가, 총건수/경고 UI 동기화, KNN 로그 추가

### 4) 체크리스트

- [ ] 전용면적(exclusive) 범위: 목록·지도 동시 반영
- [ ] 대지권면적(land_rights) 범위: 목록·지도 동시 반영
- [ ] 엘리베이터(elevator_available): 목록·지도 동시 반영(백엔드 구현 확인 필요)
- [ ] 주소검색(searchQuery/Field): 목록·지도 동시 반영
- [ ] KNN: 요청에 `sort=distance_asc`와 `ref_lat/ref_lng`, 응답 `warning`/`total` 검증

### 5) 환경/플래그

- `NEXT_PUBLIC_MAP_NEAREST_LIMIT_SALE=server`(기본 server)
- URL 쿼리로 `?vt=1` 등 임시 토글 가능

### 6) 검증 기준

- 동일 필터일 때 목록 total과 지도 pre_spatial_total 동기화(지도 total은 K 상한 적용 가능)
- 지도 echo.sort=distance_asc, echo.ref_lat/ref_lng가 현재 중심과 일치
- 빠른 입력에도 디바운스·trailing로 최신 상태 반영

### 7) 후속 백엔드 요청

- `min/max_land_rights_area`, `elevator_available`의 목록 API 완전 적용
- 파라미터 별칭의 양방향 수용
