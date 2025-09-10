## 실거래가/매물 데이터셋 AREA(영역 안 보기) 연동 가이드

### 목적

- `auction_ed`에 적용한 AREA 설계를 재사용하여, `real-transactions`(매매 실거래)와 `listings`(매물)에도 일관된 방식으로 영역 필터를 제공한다.

### 핵심 원칙(요약)

- 표와 지도는 동일 파라미터 세트로 /area를 호출한다(지도는 page=1, size=상한).
- 응답은 데이터셋 어댑터로 “표준 스키마”로 정규화한 뒤 표/지도/팝업에 동일하게 사용한다.
- 반경/사이즈/금액 경계는 가드(반경 500m–10km, size≤1000, price_max 미만(<))로 일관 보장한다.

### 재사용 컴포넌트

- `Application/components/features/auction-ed/areaQuery.ts`
  - `buildAreaQueryParams(opts)`를 그대로 재사용하거나, 데이터셋별 차이가 있으면 래퍼를 두어 일부 키만 변환한다.
  - 공통 포함 항목: 지역/좌표/반경, 가격, 면적, 연식/매각일(또는 계약일), 현재상태, 특수권리, 층확인, 검색, 엘리베이터, 정렬, 페이지/사이즈.
- 지도/표 분리 운용 패턴
  - 지도: page=1, size=min(1000, BACKEND_MAX_PAGE_SIZE, MAP_GUARD.maxMarkers, UI 상한)
  - 표: page=사용자 선택(20/50/100), size=해당 값

### 데이터셋별 메모

1. real-transactions(매매 실거래)

- 엔드포인트: `/api/v1/real-transactions/area`(가정). 백엔드 확정 전이면 목록 엔드포인트와 동일 키를 쓰되, 지역 키가 상이할 수 있음.
  - 지역 키 예시(목록 대비): `sido`, `sigungu`, (선택) `admin_dong_name`
  - 날짜/정렬 키: 계약일 기반(`contract_year/month/day` 또는 `contract_date`). 정렬 허용 키는 백엔드 스펙에 맞춘다.
- 어댑터: `datasetConfigs.sale.adapter.toItemLike`를 재사용. 응답 좌표/주소/가격/면적/연식 필드를 표준 스키마로 정규화.
- 검색: `road_address_search`/`address_search` 등 목록과 동일한 검색 키를 /area에도 적용.

2. listings(매물)

- 엔드포인트: `/api/v1/naver-products/area`(가정).
- 필터 수가 상대적으로 적을 수 있으므로, 최소: 지역/좌표/반경/가격/면적/정렬/페이지/사이즈.
- 어댑터: `datasetConfigs.listings.adapter.toItemLike` 재사용(주소/가격/면적/좌표 필수).

### 구현 단계 체크리스트

1. API 파라미터 빌더 연결

- 재사용: `buildAreaQueryParams` 호출로 표/지도 두 이펙트 모두 동일 쿼리 구성.
- 데이터셋별 지역 키 차이가 있을 경우 빌더 전/후로 맵핑(예: `cityDistrict` → `sigungu`).

2. 표/지도 연결

- 표: `/area` 응답(page/size 적용) → 어댑터 정규화 → 테이블로 전달.
- 지도: `/area` 대용량(page=1, size=상한) → 어댑터 정규화 → 지도 마커 렌더.

3. 가드/경계

- 반경: 500–10,000m로 clamp, size≤1000, price_max 미만(<) 규칙 보장.

4. 팝업/상세

- 마커 클릭 시 `id:number`로 상세 API 호출 가능하도록 식별자 보장.
- 팝업 스키마가 정규화된 키를 읽도록 확인(주소/가격/면적/일자/상태 등).

5. 테스트/검증(권장 순서)

- 네트워크 탭: 표/지도 /area 요청 파라미터 동일성(지도는 size만 큼) 확인.
- PowerShell 빠른 비교(예시)

```powershell
$urls = @(
  @{label='base';url='http://127.0.0.1:8000/api/v1/real-transactions/area?...&page=1&size=20'},
  @{label='map'; url='http://127.0.0.1:8000/api/v1/real-transactions/area?...&page=1&size=500'}
)
$urls | % { $r = Invoke-RestMethod $_.url; "{0}`tresults={1} total={2}" -f $_.label, ($r.results.Count), ($r.total) }
```

- 필터별(total 변화) 검증: 가격/면적/연식/검색/상태/층확인/엘리베이터 순으로 하나씩 비교.

### 문제 발생 시 가이드

- 서버 필터 미적용/불일치가 의심되면: 동일 조건으로 목록 vs area 결과를 비교하여 백엔드에 파라미터 파리티 적용 요청.
- 임시 가드: 서버 반영 전엔 정규화된 필드 기반 클라이언트 필터를 우선 적용(표/지도/헤더 동기화), 반영 후 제거.

### 참고 파일

- 공통 빌더: `Application/components/features/auction-ed/areaQuery.ts`
- 적용 예시: `Application/components/features/auction-ed/AuctionEdSearchResults.tsx`
- 어댑터: `Application/datasets/registry.ts` (`datasetConfigs.*.adapter.toItemLike`)
