## 실거래가(매매) v3 구현 계획 - OUTLINE

### 0. 목적/범위

- 목적: 경매결과 v2 패턴을 최대 재사용하여 실거래가(매매) 페이지(v3) 구현
- 범위: 목록/지도/정렬/필터 구조 동일 유지, 데이터 소스·컬럼·팝업 정책만 차등

### 1. 재사용(동일) 구성 요소/패턴

- 컨테이너 패턴: 결과 컨테이너에서 테이블/지도 토글, 로딩·빈상태 처리
  - `Application/components/features/sale/SaleSearchResults.tsx`
- 테이블(스키마 기반): 컬럼 DnD·리사이즈, 외부 페이지네이션, 헤더 정렬 위임
  - `Application/components/features/item-table.tsx`
- 지도 공통: 초기 fitBounds 1회, 필터 변경 시 중심·레벨 유지, 마커 상한/빈상태 안내
  - `Application/components/features/map-view.tsx`
- 필터 UI 구조/상태 관리: 전역 스토어, 지역 선택 체계, 페이지·사이즈, 정렬 상태
  - `Application/components/features/sale/SaleFilter.tsx`
  - `store/filterStore.ts` (루트)
- 데이터 훅/어댑터: SWR 캐시, 응답 정규화 `{ items,total_items } → { results,count }`
  - `Application/hooks/useDataset.ts`
  - `Application/datasets/registry.ts`(`datasetConfigs.sale`)
- 정렬 허용 컬럼 메타 로딩: `/api/v1/real-transactions/columns`
  - `Application/hooks/useSortableColumns.ts`
- 지역 데이터 소스(시/도→시군구→읍면동):
  - `Application/hooks/useLocations.ts`, `regions.json`
- API 클라이언트:

  - `Application/lib/api.ts`(`realTransactionApi`)

- 선택 필터 바 요약/초기화:
  - `Application/components/features/selected-filter-bar.tsx`
- 컬럼 순서/저장 훅(로컬 스토리지 연동):
  - `Application/hooks/useColumnOrder.ts`
- 전역 데이터셋 공유(필요 시):
  - `Application/hooks/useGlobalDataset.ts`
- 테이블 정렬/가공 유틸:
  - `Application/components/features/table/sort-utils.ts`
- 입력 디바운스(검색 UX):
  - `Application/hooks/useDebounce.ts`
- 지도 부가 UI(선택): 범례/원형 선택
  - `Application/components/features/MapLegend.tsx`, `Application/components/features/MapCircleControls.tsx`
- 단위/표기 공통 유틸(금액·면적):
  - `Application/lib/units.ts`, `Application/components/features/property-detail/utils/formatters.ts`
- 로깅/분석/모니터링(선택):
  - `Application/lib/analytics.ts`, `Application/lib/monitoring.ts`
- SWR 페처/공통 유틸:
  - `Application/lib/fetcher.ts`, `Application/lib/utils.ts`
- 에러/예외 공통 처리(선택):
  - `Application/lib/errors.ts`
- 피처 플래그/토글(선택):
  - `Application/lib/featureFlags.ts`, `Application/lib/featureFlags.tsx`
- 지도 설정/로더(선택):
  - `Application/lib/map/config.ts`, `Application/lib/map/kakaoLoader.ts`
- 지오 유틸(거리/좌표 변환):
  - `Application/lib/geo/coords.ts`, `Application/lib/geo/distance.ts`
- 공통 UI 컴포넌트(Shadcn 기반):
  - `Application/components/ui/*` (table, pagination, select, dialog, sheet, tabs 등)
- 가상 테이블/대안 테이블(대량 데이터 시 선택):
  - `Application/components/features/item-table-virtual.tsx`, `Application/components/features/item-table.tanstack.tsx`
- 기타 공통 데이터 훅(선택):

  - `Application/hooks/useItems.ts`, `Application/hooks/useItemDetail.ts`

- 필터 바 대체 프레임(선택):
  - `Application/components/features/filter-control.tsx`, `filter-control-new.tsx`, `filter-control-fixed.tsx` (레이아웃/고정형/신규 시안)
- 공유 카운터/파이프라인(선택):
  - `Application/components/features/shared/CircleFilterHeaderCount.tsx`, `Application/components/features/shared/useCircleFilterPipeline.ts`
- 즐겨찾기 시스템(선택):
  - `Application/components/features/favorites-system.tsx` (행 즐겨찾기/북마크 토글 패턴)
- 데이터셋 스키마/정규화(타이핑/호환):
  - `Application/datasets/schemas.ts`, `Application/datasets/normalize.ts`, `Application/types/datasets.ts`
- 테마/프로바이더(전역 UI 상태):
  - `Application/app/providers.tsx`, `Application/components/theme-provider.tsx`
- 개발 목업/MSW(선택):
  - `mocks/browser.ts`, `mocks/handlers.ts`, `public/mockServiceWorker.js` (개발 환경 데이터 스텁)
- 스모크/도구 스크립트(선택):
  - `scripts/smoke.ps1`, `scripts/smoke-detail.ps1`, `scripts/smoke-comparables.ps1`
- 디버그 플래그/환경변수(선택):
  - `NEXT_PUBLIC_DETAIL_DEBUG=1`(디테일 디버그 UI), `NEXT_PUBLIC_LISTINGS_MOCK`(목업 활성화)

### 2. 차이(매매 전용) 포인트

- 엔드포인트/계약

  - 목록/메타: `/api/v1/real-transactions`, `/api/v1/real-transactions/columns` (선택: `/{id}`)
  - 데이터셋 키: `sale` 사용(`datasetConfigs.sale`)
  - 응답 정규화: `{items,total_items}` → `{results,count}` (공통)

- 컬럼/지표(표시 규칙)

  - 기본 10컬럼 유지: `Application/datasets/contracts.ts`(`columnsSale`) 기준
  - 지표 우선순위 [결정필요]: 리스트/지도 기본 지표를 “거래금액” vs “평단가” 중 무엇으로 노출
  - 포맷 [결정필요]: 1) 만원 고정, 2) 억/만원 혼합, 3) 반올림 자리수(금액/평단가)

- 기간/정렬

  - 기간 입력 [결정필요]: 연/월(간편) vs 일단위 범위(정밀)
  - 기본 정렬 [확정]: `contractDate desc` (연-월-일 최신순)
  - 보조 키 [결정필요]: 동순위 시 `contractDay desc` 또는 `id desc` 내재화 여부

- 중복/이상치 처리

  - 동일 주소·면적·월 다건 계약 [결정필요]: “최신 1건만 보기” 토글 제공/기본값
  - 취소/무효 계약 [결정필요]: 제외/표시/배지 구분 정책
  - 이상치 [결정필요]: 극단값 하이라이트/제외/무시 중 선택

- 검색 UX

  - 대상/우선순위 [결정필요]: 1순위 도로명주소, 2순위 건물명, 3순위 지번(변경 가능)
  - 자동완성 [결정필요]: 지역 연동 주소 자동완성/제안 사용 여부(성능 비용 수용 여부)

- 필터 범위/서버 이전

  - 1차: 서버(지역/정렬/페이지), 나머지 클라(가격/면적/기간)
  - 서버 이전 1순위 [결정필요]: 가격 vs 면적 vs 기간 중 우선 도입 항목과 파라미터 명세
  - 클라 기본 범위 [결정필요]: 가격/면적 초기값(권장 상한 포함) 확정

- 지도/범례/마커

  - 색상 기준 [결정필요]: 거래금액 구간 vs 평단가 구간
  - 구간 임계값 t1~t4 [결정필요]: 매매용 기본값(만원) 확정
  - 라벨 [결정필요]: 정수 금액 vs 억 단위 축약 vs 평단가 숫자

- 팝업/상세

  - 단기: 주소 클릭 팝업 비활성(A안) 유지
  - 장기 [결정필요]: `/real-transactions/{id}` 상세(B안) 필수 필드(계약일, 금액, 평단가, 층, 연식, 전용, 주소, 좌표)

- 페이지네이션/레이아웃

  - 기본 size [결정필요]: 20 vs 50 vs 100
  - 모바일 축약 [결정필요]: 1열 핵심 지표를 금액 vs 평단가 중 무엇으로

- 캐시/성능

  - SWR 옵션 [결정필요]: `dedupingInterval`, `revalidateOnFocus` 기본값(분석 체감 고려)
  - 프리페치 [결정필요]: 지도 탭 대용량 프리페치 허용/상한

- 품질/가드

  - 좌표 결측 시 정책: 리스트 표시는 유지, 지도 안내 강화(공통). 문구 [결정필요]
  - 데이터 없음/오류 안내 톤&링크 [결정필요]

- 권한/공유
  - 즐겨찾기/공유 [결정필요]: 매매에도 노출(경매와 동등) 여부
  - 딥링크 [결정필요]: 필터 상태 URL 영속 기본 ON/OFF

> 세부 규칙/구현 방법은 섹션 6(컬럼), 7(정렬), 8(필터), 9(지도)에서 구체화합니다. 본 섹션은 ‘결정 항목’만 유지합니다.

### 3. 사용자 결정·백엔드 요청·산출물/테스트

- A) 사용자 결정(최종 확정 필요) — 기본값 제안 포함

  - 기본 정렬: `contractDate desc` (연-월-일 최신순)
  - 기본 지표: 기본값=거래금액(목록/지도), 보조=평단가
  - 금액/평단가 표기: 기본값=금액 억/만원 혼합(정수), 평단가 만원/평(소수 1자리)
  - 기간 입력 단위: 기본값=연·월(간편), 선택=일 단위 범위(고급)
  - 검색 우선순위: 기본값=도로명 > 건물명 > 지번, 자동완성=초기 OFF(성능 안정) — 필요 시 ON
  - 중복/취소/이상치: 기본값=“최신 1건만 보기” ON(주소+전용+연월 기준), 취소계약 기본 제외(옵션 표시), 이상치 기본 표시+행 하이라이트
  - 지도 범례: 기본값=색상 기준 ‘거래금액’, 임계값 t1~t4=6000/8000/10000/13000(만원), 마커 라벨=억 단위 축약(예: 2.4억)
  - 테이블/모바일: 기본 10컬럼 라벨·순서 유지, 모바일 1열 핵심 지표=거래금액
  - 페이지 사이즈 기본값: 20
  - 성능/운영: SWR dedupingInterval=1000~2000ms, revalidateOnFocus=false, 지도 대용량 프리페치 상한=500(추후 /area 도입 시 조정)
  - 권한/공유: 즐겨찾기/공유 버튼 노출=ON(경매와 동등), 딥링크(필터 URL) 기본 ON
  - 텍스트/접근성: 에러/빈데이터 안내=“조정 제안+다음 행동” 톤, 금액/일자/주소/층/면적 aria-label 부여

- B) 백엔드 협업 요청/확인 — 요청 표(예시 키 포함)

  - 엔드포인트: `/api/v1/real-transactions`, `/columns` 스키마(허용 정렬 키 목록) 재확인
  - 상세(B안 대비): `/real-transactions/{id}` 제공 시 필드 스키마(계약일, 금액, 평단가, 층, 연식, 전용, 주소, 좌표)
  - 파라미터 매핑: 지역 키 `sido/sigungu/admin_dong_name` 확정, 정렬 `ordering` 지원 키 확인
  - 서버 필터(확장): 가격/면적/기간 파라미터 명세·허용 범위, 적용 시점 합의
  - 좌표/품질: `latitude/longitude` 보장 여부와 폴백 키(lon/x/y/lat_y) 가능성, 취소계약 구분 필드 유무, 이상치 기준(선택)
  - AREA(선택): `/real-transactions/area` 도입 가능성, 동일 파라미터·대용량 size 상한, 반경 가드(500m~10km)

  예시 요청 표(요약):

  - 정렬 허용 키: `transactionAmount`, `pricePerPyeong`, `contractYear`, `contractMonth`, `exclusiveAreaSqm` …(백엔드 확정)
  - 상세 필드 스키마(필수): `id, contract_date, transaction_amount, price_per_pyeong, floor_info_real, construction_year_real, exclusive_area_sqm, road_address_real, latitude, longitude`
  - 서버 필터 후보: `min_price/max_price`, `min_area/max_area`, `contract_date_from/to` (형식: ISO8601, 단위: 만원/㎡)

- C) 구현·운영 산출물(준비 아티팩트) — 템플릿

  - 데이터 계약/매핑 표(템플릿)
    - 작성 가이드: 각 필드의 최종 표기 라벨·단위·반올림 자리·예시값을 채웁니다(표는 실제 키명 사용). 누락 시 구현이 지연됩니다.
    - 프론트 키 | 백엔드 필드 | 라벨 | 단위 | 반올림 | 예시값
    - `transactionAmount` | `transaction_amount` | 거래금액 | 만원 | 정수 | 34500
    - `pricePerPyeong` | `price_per_pyeong` | 평단가 | 만원/평 | 소수1 | 256.3
    - `exclusiveAreaSqm` | `exclusive_area_sqm` | 전용면적 | ㎡ | 소수1 | 84.9
    - `contractYear` | `contract_year` | 계약연도 | 년 | 정수 | 2025
    - `contractMonth` | `contract_month` | 계약월 | 월 | 정수 | 9
    - `roadAddressReal` | `road_address_real` | 도로명주소 | - | - | 서울시 강남구 …
    - (필요 시 추가)
  - 정렬 허용 맵(템플릿)
    - 작성 가이드: `/columns.sortable_columns`와 매칭하여 허용=true만 활성화합니다. 헤더명은 사용자 표기 라벨입니다.
    - 헤더 | 서버 key | 허용 | 비고
    - 거래금액 | transaction_amount | true | 기본
    - 평단가 | price_per_pyeong | true |
    - 계약연도 | contract_year | true | 보조
    - 계약월 | contract_month | true | 보조
    - 전용면적 | exclusive_area_sqm | true | 선택
  - 범례/마커 사양(템플릿)
    - 작성 가이드: 기준(금액/평단가), 임계값(t1~t4, 만원), 팔레트, 라벨 포맷(억 축약 등)을 명시합니다.
    - 기준=거래금액, t1=6000, t2=8000, t3=10000, t4=13000(만원), 라벨=억 축약
    - 팔레트: blue/green/pink/orange/red, 0 또는 결측=grey
    - 예시: 9500만원 → pink, 라벨 "0.95억"
  - 안내 문구(템플릿)
    - 작성 가이드: 사용자에 ‘다음 행동’을 제시하는 톤으로 1~2문장을 유지합니다.
    - 데이터 없음: "조건에 맞는 결과가 없습니다. 지역/기간/가격을 조정해 보세요."
    - 네트워크 오류: "일시적인 오류가 발생했습니다. 다시 시도하거나 조건을 변경해 보세요."
    - 좌표 결측 다수: "일부 항목은 지도에 표시되지 않을 수 있습니다. 목록에서 상세 정보를 확인해 주세요."
  - 접근성(ARIA) 체크리스트(템플릿)

    - 작성 가이드: 스크린리더 핵심 정보(금액/일자/주소/층/면적)에 라벨을 제공합니다.
    - 테이블 셀: 금액/평단가/면적/연월 aria-label(예: "거래금액 3억 4천 5백만원")
    - 정렬 버튼: aria-pressed 적용(활성 상태 반영)
    - 지도 마커: title에 금액·주소 요약(예: "2.4억, 강남구 대치동 …")

  - 환경 변수 매트릭스(템플릿)

    - 키 | 목적 | 예시값 | 검증
    - NEXT_PUBLIC_API_BASE_URL | API 베이스 URL | http://127.0.0.1:8000 | 200 OK /health
    - NEXT_PUBLIC_KAKAO_APP_KEY | 카카오 지도 | xxxxxxxxxxxxxxxxxxxxx | 도메인 등록 확인
    - NEXT_PUBLIC_LISTINGS_MOCK | 매물 목업 토글 | 1/0 | 개발만 1
    - NEXT_PUBLIC_DETAIL_DEBUG | 상세 디버그 | 1/0 | 개발만 1

  - 사용자 선호 저장 키(템플릿)

    - 키 | 설명 | 저장소
    - table:order:sale | 컬럼 순서 | localStorage
    - table:width:sale | 컬럼 너비 | localStorage
    - table:sort:sale | 정렬 상태 | localStorage
    - pageSize:sale | 페이지 사이즈 | localStorage
    - (선택) user-preferences API 키 | 서버 선호 저장 | server

  - 분석/모니터링 이벤트(템플릿)
    - 이벤트 | 트리거 | 속성 | 샘플링 | 채널
    - sort_changed | 헤더 클릭 | key, order | 100% | analytics.ts
    - filter_applied | 필터 submit | filters | 50% | analytics.ts
    - map_marker_click | 마커 클릭 | id, price | 100% | analytics.ts
    - error_shown | 에러표시 | code, path | 100% | sentry

- D) 테스트/DoD 체크리스트 — "검증 절차 / 기대값" 형식

  - 네트워크
    - 지역 파라미터 매핑 요청 확인 / 응답 아이템 주소 시·군·동 일치
    - `/columns` 허용 목록 반영 / 비허용 헤더 클릭 시 정렬 비활성
    - (서버 필터 적용 시) 가격·면적·기간 파라미터 전달 / total 감소 합리적
  - 목록/지도
    - “최신 1건만 보기” ON/OFF / 결과 개수 및 중복 해소 차이 확인
    - 임계값(t1~t4) 변경 / 마커 색상 구간 및 범례 즉시 반영
    - 좌표 결측/0건 / 지도 중심·레벨 유지 및 안내 문구 노출
  - UI/UX
    - 모바일 1열·페이지 size=20 / 레이아웃·페이지네이션 정상
    - 딥링크 ON / 새로고침·공유에서 필터 상태 복원
    - 검색 자동완성 OFF / 입력 지연 없이 반응(ON 시 제안 표시)
  - 접근성/성능
    - aria-label 적용 / 스크린리더 읽기 정상
    - 로딩/스켈레톤 / 깜빡임 최소(keepPreviousData, dedupe 1~2s)

  스크립트 예시(선택)

  - cURL: 지역 필터 + 정렬 전달 확인
    - 읍면동 선택 시
      ```bash
      curl -G "http://127.0.0.1:8000/api/v1/real-transactions/" \
        --data-urlencode "sido=서울특별시" \
        --data-urlencode "sigungu=강남구" \
        --data-urlencode "admin_dong_name=대치동" \
        --data-urlencode "ordering=-transaction_amount" \
        --data-urlencode "page=1" \
        --data-urlencode "size=20"
      ```
    - 읍면동 미선택(전체) 시
      ```bash
      curl -G "http://127.0.0.1:8000/api/v1/real-transactions/" \
        --data-urlencode "sido=서울특별시" \
        --data-urlencode "sigungu=강남구" \
        --data-urlencode "ordering=-transaction_amount" \
        --data-urlencode "page=1" \
        --data-urlencode "size=20"
      ```
  - PowerShell: `/columns` 정렬 허용 키 확인
    ```powershell
    $r = Invoke-RestMethod "http://127.0.0.1:8000/api/v1/real-transactions/columns"
    "sortable_columns=`t{0}" -f (($r.sortable_columns -join ", "))
    ```

> 본 문서는 아웃라인입니다. 위 사용자 결정 사항 확정 후 본문(세부 설계/예시/체크리스트)을 채웁니다.

---

### 4. 아키텍처 개요(페이지 · 데이터 흐름)

- 페이지 구성: 필터 바 → 결과 컨테이너(테이블/지도 토글) → 페이지네이션/사이즈
- 데이터 흐름: `filterStore` 상태 → `datasetConfigs.sale.api` → `realTransactionApi` → 응답 정규화(`useDataset`/어댑터) → `ItemTable`와 `MapView` 렌더
- 정렬 흐름: 테이블 헤더 클릭 → `setSortConfig(sortBy, sortOrder)` → `/columns` 허용 목록 필터 → 서버로 `ordering` 전달
- 지도 연동: 리스트 아이템 → `toItemLike` 좌표 매핑 → `MapView` 마커/하이라이트 렌더, 중심·레벨 보존

### 5. API 계약 상세(매매)

- 목록: `GET /api/v1/real-transactions/`
  - 쿼리: `page`, `size`, `sido`, `sigungu`, `admin_dong_name?`, `ordering?`
  - 주의: 지역 키는 프론트 `province/cityDistrict/town` → 서버 `sido/sigungu/admin_dong_name`로 매핑됨
  - 응답: `{ items: Item[], total_items: number }`
  - `admin_dong_name`는 선택사항: 미전달 시 해당 시군구 전체 응답
- 컬럼 메타: `GET /api/v1/real-transactions/columns`
  - 응답: `{ sortable_columns: string[] }` (예: `["transaction_amount","price_per_pyeong","contract_year","contract_month","exclusive_area_sqm"]`)
- 상세(선택): `GET /api/v1/real-transactions/{id}`(도입 시)
- 에러/레이트리밋(예시):
  - 400/422: 파라미터 형식 오류 → 입력값 검증 및 가이드 문구 표시
  - 429: 요청 과다 → 재시도 지연 및 사용자 안내
  - 500: 서버 오류 → 재시도 버튼/토스트, 로그 전송

예시 요청 파라미터 매핑(개념 예):

```json
{
  "province": "서울특별시",
  "cityDistrict": "강남구",
  "town": "대치동",
  "sortBy": "transactionAmount",
  "sortOrder": "desc",
  "page": 1,
  "size": 20
}
```

서버 전달 후:

```json
{
  "sido": "서울특별시",
  "sigungu": "강남구",
  "admin_dong_name": "대치동",
  "page": 1,
  "size": 20,
  "sort_by": "transactionAmount",
  "sort_order": "desc"
}
```

### 6. 컬럼 정의 상세(기본 10 + 확장)

- 기본 10 컬럼(표시/정렬 후보):
  - `id`, `sido`, `sigungu`, `roadAddressReal`, `buildingNameReal`, `exclusiveAreaSqm`, `contractYear`, `contractMonth`, `transactionAmount`, `pricePerPyeong`
- 표시 규칙:
  - 금액: 천단위 구분, 단위 기본 "만원"
  - 면적: ㎡ 기본, 전역 플래그로 평 변환 표시(참고 값만)
  - 평단가: 만원/평, 소수 1자리 (3-A 기본값 반영)
  - 빈값: `-`로 표시, 정렬 시 빈값은 최하위
- 확장 컬럼: 서버 추가 시 자동 노출(라벨은 `contracts.ts` 정의 사용)
- 열 폭/모바일(권장): 기본 폭 160px, min 120px, max 360px, 모바일에서는 주소 2줄 클램프, 숫자 우측 정레
- 열 고정: 좌측 ID/주소 고정(선택), 우측 합계/액션 고정(현재 없음)

### 7. 정렬 정책 상세

- 허용 컬럼: `/columns`의 `sortable_columns`에 포함된 키만 활성
- 기본 정렬: `contractDate desc` (연-월-일 최신순)
- 폴백: 허용 목록이 비어 있으면 모든 헤더 정렬 비활성
- 토글 사이클: asc → desc → none, isSorting 동안 재클릭 억제(아이콘 ⏳)
- 아이콘/색상: 활성 헤더 강조(굵기/색), 비활성 회색, none 상태는 아이콘 숨김

### 8. 필터 정의 상세(클라이언트 우선) ✅ 구현 완료

#### 구현된 필터 목록 (총 10개)

**1. 지역 필터** ✅

- 필터 키: `province`(시도) / `cityDistrict`(시군구) / `town`(읍면동, 선택사항)
- 서버 매핑: `sido` / `sigungu` / `admin_dong_name`
- 구현 완료: 계단식 선택, "전체" 옵션, URL 딥링크
- **백엔드 API 통합 완료** (2025-10-02):
  - `useRealTransactionsSido()`: `/api/v1/real-transactions/regions/sido`
  - `useRealTransactionsSigungu(sido)`: `/api/v1/real-transactions/regions/sigungu?sido={sido}`
  - `useRealTransactionsAdminDong(sido, sigungu)`: `/api/v1/real-transactions/regions/admin-dong?sido={sido}&sigungu={sigungu}`
  - '구' 단위 데이터 정확 표시 (예: "경기도 고양시 덕양구")
  - 각 지역 아이템 수 표시 (`{name} ({count.toLocaleString()}건)`)

**2. 거래금액 필터** ✅

- 필터 키: `transactionAmountRange`
- 범위: 0 ~ 100,000만원 (10억원)
- 모드: Slider (1,000만원 스텝) + Input (직접 입력)
- 프리셋: "고액 매매 (10억 이상)" [100,000~500,000]

**3. 평단가 필터** ✅ ⭐ 신규

- 필터 키: `pricePerPyeongRange`
- 범위: 0 ~ 5,000만원/평
- 모드: Slider (100만원 스텝) + Input (직접 입력)

**4. 전용면적 필터** ✅

- 필터 키: `exclusiveAreaRange`
- 범위: 0 ~ 300㎡
- 모드: Slider (5㎡ 스텝) + Input (직접 입력)
- 프리셋: "소형 아파트 (33평 이하)" [0~110]

**5. 대지권면적 필터** ✅ ⭐ 신규

- 필터 키: `landRightsAreaRange`
- 범위: 0 ~ 600㎡
- 모드: Slider (10㎡ 스텝) + Input (직접 입력)

**6. 건축연도 필터** ✅

- 필터 키: `buildYearRange`
- 범위: 1980년 ~ 2024년
- 모드: Slider (1년 스텝) + Input (직접 입력)
- 프리셋: "신축 매매 (5년 이내)" [2019~2024]

**7. 층확인 필터** ✅ ⭐ 신규

- 필터 키: `floorConfirmation`
- 옵션: 전체 / 반지하 / 1층 / 일반층 / 탑층
- 모드: 다중 선택 (배열)

**8. 엘리베이터 필터** ✅ ⭐ 신규

- 필터 키: `elevatorAvailable`
- 옵션: 전체 / 있음 / 없음
- 모드: 단일 선택 (Boolean)

**9. 거래 날짜 필터** ✅

- 필터 키: `dateRange`
- 빠른 선택: 최근 1/3/6개월, 올해
- 직접 입력: 시작일/종료일 (type="date", ISO 8601 형식)

**10. 주소 검색** ✅

- 필터 키: `searchQuery`
- 검색 필드: `address`, `building_name_real`

#### 공통 기능

- 검색: `searchField=address|building_name_real` + `searchQuery`
- 페이지/사이즈: 기본 20 (후보 20/50/100)
- 영속화: 컬럼 순서/너비/정렬/페이지 사이즈는 로컬 스토리지 키 스킴 유지
- 활성화 상태 표시: 필터 적용 시 라벨 파란색 강조

#### 읍면동 선택 정책 ✅ 구현됨

- `town`은 선택사항: 시/도+시군구만 선택해도 조회 가능
- 읍면동 드롭다운에 "전체" 옵션 제공 → 선택 시 `admin_dong_name` 미전달(시군구 전체 조회)
- 계단식 동작: 시/도 변경 시 시군구·읍면동 초기화, 시군구 변경 시 읍면동 초기화

#### 초기화 버튼(설정 초기화) 정책 ✅ 구현됨

- 지역 필터(province/cityDistrict/town)는 그대로 유지
- 가격/면적/건축연도/날짜/검색/정렬은 기본값으로 복원, 페이지는 1로 복원
- 정렬 기본값: `contractDate desc`

### 9. 지도/마커 동작 상세

- 좌표 매핑: 다양한 키(lat/lng/lon/x/y/lat_y 등)에서 우선순위 추출 후 범위 기반 스왑 가드
- 초기: 첫 로드 1회 `fitBounds` 실행, 이후 필터 변경 시 현재 중심/레벨 유지
- 마커 상한: 공통 상한치 적용(상한 도달 시 안내 배지 표시), 지도 대용량 프리페치 상한=500 (3-A 기본값)
- 빈 상태: 아이템 0건이어도 중심/레벨 리셋 금지, 좌표 오버레이 유지
- 팝업 락: 전역 토글로 자동 닫힘 방지 지원(지도 상호작용 시)
- 클러스터러: minLevel=9, gridSize=60(권장), fitBounds padding=40px, 이벤트 디바운스=200ms
- 범례/마커 기준(확정): 거래금액 기준, 임계값 t1~t4=6000/8000/10000/13000(만원)

### 10. 팝업/상세 정책

- 단기 A안: 매매에서 행/주소 클릭 시 공통 상세 팝업 비활성(현상 유지)
- 장기 B안: `/real-transactions/{id}` 도입 시 매매 전용 상세로 분기(설계 별도 문서)
- 값 미존재 시 플레이스홀더: `-` 또는 "정보 없음"(접근성 라벨 포함)

### 11. 상태관리/스토어 키

- 필터/정렬: `province`, `cityDistrict`, `town`, `sortBy`, `sortOrder`, `page`, `size`
- 액션: `setFilter`, `setRangeFilter`, `setSortConfig`, `setPage`, `setSize`
- 테이블 퍼시스턴스 키: `table:order:sale` 등 네임스페이스 구분 적용
- 네임스페이스/URL 동기화: `sale` 네임스페이스로 필터 상태 저장, URL 쿼리와 양방향 동기화(딥링크 ON)
- 키 충돌 방지: 페이지별 prefix 적용, 기존 페이지와 키 중복 금지

### 12. 구현 단계(개발 체크) + 단계별 확인 질문 가이드

#### Phase 1: 백엔드 확인 ✅ 완료

- [x] API 엔드포인트 확인 (`/api/v1/real-transactions/`)
- [x] 컬럼 메타데이터 확인 (`/api/v1/real-transactions/columns`)
- [x] 정렬 가능한 컬럼 확인 (sortable_columns)

#### Phase 2: 데이터셋 설정 ✅ 완료

- [x] `contracts.ts`에 `columnsSale` 정의 (57개 컬럼)
- [x] `registry.ts`에 `sale` 데이터셋 추가
- [x] API 엔드포인트 연결
- [x] 어댑터 함수(`toItemLike`) 구현
- [x] 기본 정렬 설정 (`contractDate desc`)
- [x] 지도 범례/마커 설정 (거래금액 기준)
- [x] 정렬 파라미터 통일 (`ordering=-snake_case`)

#### Phase 3: 필터 컴포넌트 구현 ✅ 완료 (2025-10-02)

- [x] `SaleFilter.tsx` 생성 (1,083줄 최종)
- [x] **지역 필터**: 시/도, 시군구, 읍면동(선택사항, "전체" 옵션)
  - **백엔드 API 통합** (2025-10-02):
    - 새로운 훅: `useRealTransactionsSido()`, `useRealTransactionsSigungu(sido)`, `useRealTransactionsAdminDong(sido, sigungu)`
    - API 엔드포인트: `/api/v1/real-transactions/regions/sido`, `/sigungu`, `/admin-dong`
    - '구' 단위 정확 표시 (예: "경기도 고양시 덕양구")
    - 지역별 아이템 수 표시
    - **우측 필터 패널에서 지역 선택 제거** → 상단 공통 지역 카드로 통합
- [x] **주소 검색**: 주소 기반 필터링
- [x] **거래 날짜 필터**: 빠른 선택(1/3/6개월, 올해) + 직접 입력
- [x] **거래금액 필터**: 0~100,000만원 (Slider/Input)
- [x] **평단가 필터**: 0~5,000만원/평 (Slider/Input) ⭐ 신규
- [x] **전용면적 필터**: 0~300㎡ (Slider/Input)
- [x] **대지권면적 필터**: 0~600㎡ (Slider/Input) ⭐ 신규
- [x] **건축연도 필터**: 1980~2024년 (Slider/Input)
- [x] **층확인 필터**: 전체/반지하/1층/일반층/탑층 (다중선택) ⭐ 신규
- [x] **엘리베이터 필터**: 전체/있음/없음 (단일선택) ⭐ 신규
- [x] Slider/Input 듀얼 모드 (모든 범위 필터)
- [x] 활성화 상태 표시 (파란색 강조)
- [x] 초기화 로직 (지역 유지, "설정 초기화" 버튼)
- [x] **UI 일관성**: 경매결과 패턴 완전 통일
  - 헤더: `<Filter />` + "필터"
  - "선택 항목만 보기" & "설정 초기화" 맨 위 배치
  - 프리셋 기능 제거 (경매결과 미보유)
  - 아이콘 제거 (거래날짜, 층확인, 엘리베이터)
- [x] **필터 순서**: 거래날짜 → 거래금액 → 평단가 → 전용면적 → 대지권면적 → 건축연도 → 층확인 → 엘리베이터
- [x] **쿼리 파라미터 오염 해결**: 화이트리스트 패턴 적용 (`SALE_FILTERS`)
- [x] **무한 루프 문제 해결**:
  - `page.tsx`: filters 전체 구독 → 개별 필드 구독 (`province`, `cityDistrict`, `town`)
  - URL 동기화 가드 추가 (값 변경시에만 `router.replace`)
  - 드롭다운 `onValueChange`에 동일값 setState 방지 가드
  - sale 데이터셋 시 page.tsx 지역 관리 `useEffect` 비활성화
  - `SaleSearchResults.tsx`: selectedRowKeys 로컬 상태 관리로 변경

#### Phase 4: 검색 결과 컴포넌트 🔄 진행 중 (60% 완료, 2025-10-03)

**완료된 작업:**

- [x] **기본 컴포넌트 구조** (2025-10-03)
  - SaleSearchResults.tsx 생성 및 기본 뷰(table/map) 구현
  - useDataset 훅 연동
  - 정렬, 페이지네이션 기본 기능
  - 컬럼 순서 저장/복원 (DnD, localStorage)
  - 컬럼 클릭 정렬 (오름차순/내림차순)
  - 빈 상태 & 에러 메시지 개선
  - SWR 캐싱 최적화
  - 테이블 컬럼 최적화 (57개 → 36개)
  - Mock API 제거 및 백엔드 API 연동 ✅
  - 팝업 너비 확대 (270px → 540px) ✅
  - 팝업 경고 메시지 처리 ✅

**남은 작업 (경매결과 패리티):**

### 📋 그룹 A: 테이블-지도 연동 ⭐⭐⭐ (필수, 2시간) ✅ 완료 (2025-10-03)

- [x] **A-1. 체크박스 선택 → 지도 강조**
  - selectedRowKeys를 Zustand selectedIds로 변경
  - highlightIds props를 MapView에 전달
  - 참고: `AuctionEdSearchResults.tsx` Line 568-569, 1063-1065, 1122-1180
  - ✅ 구현 완료:
    - `SaleSearchResults.tsx` Line 99-106: Zustand 스토어 연동
    - `SaleSearchResults.tsx` Line 470-516: table 뷰 체크박스 연동
    - `SaleSearchResults.tsx` Line 688: map 뷰에 highlightIds 전달
    - `SaleSearchResults.tsx` Line 707: both 뷰에 highlightIds 전달
- [x] **A-2. 통합 뷰 (both) 지도 이동 기능**
  - 체크박스 선택 시 지도 중심 자동 이동
  - 참고: `AuctionEdSearchResults.tsx` Line 1051-1070, 1132-1180
  - ✅ 구현 완료:
    - `SaleSearchResults.tsx` Line 724-762: ItemTableVirtual onSelectionChange
    - `SaleSearchResults.tsx` Line 803-841: ItemTable onSelectionChange
    - 좌표 추출 로직: lat/latitude/lat_y/y, lng/longitude/lon/x 지원
    - setPendingMapTarget으로 지도 중심 이동

**구현 세부 사항:**

```typescript
// 1. Zustand 스토어 연동
const selectedIds = useFilterStore((s: any) => s.selectedIds ?? EMPTY_ARRAY);
const setSelectedIds = useFilterStore((s: any) => s.setSelectedIds ?? NOOP);
const setPendingMapTarget = useFilterStore((s: any) => s.setPendingMapTarget ?? NOOP);

// 2. 체크박스 선택 핸들러 (both 뷰)
onSelectionChange={(keys) => {
  const prev = new Set((selectedIds || []).map((k: any) => String(k)));
  const now = new Set(Array.from(keys).map((k) => String(k)));
  let added: string | undefined;
  now.forEach((k) => { if (!prev.has(String(k))) added = String(k); });
  setSelectedIds(Array.from(now));

  // 새로 선택된 항목으로 지도 이동
  if (added) {
    const found = items.find((r: any) => String(r?.id ?? "") === added);
    // 좌표 추출 및 지도 이동
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setPendingMapTarget({ lat, lng });
    }
  }
}}

// 3. MapView에 highlightIds 전달 (모든 뷰)
<MapView
  highlightIds={(selectedIds || []).map((k: any) => String(k))}
/>
```

**테스트 결과:**

- ✅ Table 뷰: 체크박스 선택 상태 유지
- ✅ Map 뷰: 선택된 항목에 화살표 강조 표시
- ✅ Both 뷰: 체크박스 선택 시 지도 중심 이동 + 화살표 표시
- ✅ 여러 항목 선택: 모든 항목에 화살표 표시
- ✅ 겹치는 좌표: MapView 클러스터링으로 자동 처리

### 📋 그룹 B: 원 그리기 + 영역 필터 ⭐⭐⭐ (필수, 3시간) ✅ 완료 (2025-10-03)

- [x] **B-1. MapCircleControls 통합**

  - 원 상태 관리: circleEnabled, circleCenter, circleRadiusM, applyCircleFilter
  - MapView에 원 관련 props 전달
  - 원 이벤트 핸들러 구현
  - 참고: `AuctionEdSearchResults.tsx` Line 101-114, 178-208
  - ✅ 구현 완료:
    - `SaleSearchResults.tsx` Line 109-154: 원 상태 읽기 및 핸들러 구현
    - `SaleSearchResults.tsx` Line 740-748, 770-781: MapView에 원 props 전달
    - useRefMarkerFallback={false} 추가 (실거래가 전용)

- [x] **B-2. useCircleFilterPipeline 훅**
  - 원 안의 항목만 필터링
  - 필터링된 데이터를 테이블/지도에 적용
  - 참고: `AuctionEdSearchResults.tsx` Line 15, 210-244, 417-527
  - ✅ 구현 완료:
    - `SaleSearchResults.tsx` Line 24: 훅 임포트
    - `SaleSearchResults.tsx` Line 91-114: 훅 호출 및 데이터 분기
    - `SaleSearchResults.tsx` Line 536, 552, 589, 753, 784, 815, 869, 944: 데이터 소스 교체 (finalPagedItems, finalMapItems, finalTotalCount)
    - `SaleSearchResults.tsx` Line 217-237: 원 안 필터 개수 표시
    - `SaleSearchResults.tsx` Line 289-317: "영역 안만 보기" 체크박스 추가

**구현 세부 사항:**

```typescript
// 1. 훅 호출
const { processedItemsSorted, pagedItems, mapItems: filteredMapItems, circleCount, applyCircle } =
  useCircleFilterPipeline({
    ns: "sale",
    activeView,
    page,
    size,
    items,
    maxMarkersCap: 500,
    getRowSortTs: (r: any) => r?.contract_date ? Date.parse(r.contract_date) : 0,
  });

// 2. 조건부 데이터
const finalPagedItems = applyCircle ? pagedItems : items;
const finalMapItems = applyCircle ? filteredMapItems : items;
const finalTotalCount = applyCircle ? processedItemsSorted.length : totalCount;

// 3. UI 표시
전체 1,234건 → 원 안 필터 125건 (조건부)
[ ] 영역 안만 보기 (map, both 뷰에서만)
```

**테스트 결과:**

- ✅ 원 그리기 버튼 작동
- ✅ "원 중앙으로 이동" 버튼 (실거래가 전용)
- ✅ "영역 안만 보기" 체크박스 표시 (map, both 뷰)
- ✅ 체크박스 ON → 원 안 데이터만 필터링
- ✅ 테이블 페이지네이션 업데이트
- ⚠️ "전체 0건" 이슈 (데이터 로딩 문제, 추후 수정 예정)

### 📋 그룹 C: 서버 영역 모드 ⭐⭐ (선택, 2시간)

- [ ] **C-1. useGlobalDataset 통합**
  - 1000건 이상 대용량 데이터 처리
  - `/area` 엔드포인트 호출 (백엔드 확인 필요)
  - 참고: `AuctionEdSearchResults.tsx` Line 246-318, 415-470

### 📋 그룹 D: 기타 개선 ⭐ (선택, 1시간)

- [ ] **D-1. onProcessedDataChange 콜백**

  - 처리된 데이터를 상위로 전달
  - 참고: `AuctionEdSearchResults.tsx` Line 79-83, 541-553

- [ ] **D-2. serverAreaEnabled props**
  - 부모에서 서버 영역 모드 제어
  - 참고: `AuctionEdSearchResults.tsx` Line 85-86, 98

### 📊 Phase 4 진행 상황

```
[█████████░] 90% 완료

✅ 완료: 15개 작업
  - 기본 컴포넌트: 11개
  - 그룹 A: 2개 ✅ (2025-10-03)
  - 그룹 B: 2개 ✅ (2025-10-03)

🔄 남은 작업: 3개 작업
  - 그룹 C: 1개 (선택, 대용량 데이터)
  - 그룹 D: 2개 (선택, 콜백/props)

⚠️ Known Issues:
  - "전체 0건" 데이터 로딩 문제 (추후 수정 예정)

예상 소요 시간:
  - 필수: 완료! 🎉
  - 선택: 3시간 (그룹 C+D)
  - 전체: 3시간
```

**다음 단계:**

1. 데이터 로딩 수정 ("전체 0건" 이슈 해결)
2. 그룹 C/D (선택 사항) 또는 Phase 5로 진행

---

## 부록 A. UX/성능(요약)

- 데이터: SWR 캐시/디듀플, `keepPreviousData`로 깜빡임 최소화
- 테이블: 가상 스크롤(행 많을 때), 컬럼 DnD/리사이즈 스로틀링
- 지도: 클러스터링/지연 렌더, 마커 상한 안내
- 반응형: 모바일 1열 축약+상단 고정 필터 바

## 부록 B. 에러/빈상태(요약)

- 네트워크 에러: 재시도 버튼/토스트, 검색 조건 유지
- 데이터 없음: 조건 요약과 가이드 텍스트 노출(지역/기간/가격 조정 제안)
- 좌표 결측: 리스트는 표시, 지도는 건수/가이드 안내

## 부록 C. 리스크/완화(요약)

- `/columns` 빈 응답 시: 테이블 헤더 정렬 비활성 정책 적용
- 좌표 결측·키 상이 비율 높을 때 지도 체감도 저하 → 상한/가이드 강화
- 상세 팝업(B안) 도입 시 스키마 영향 → 별도 스프린트로 분리

---

## 🗺️ Phase 5: 지도 통합 ✅ (2025-10-03 완료)

**목표:** 실거래가(매매) 페이지에 지도 탭을 활성화하고, 거래금액 기준으로 색상화된 마커를 표시

**세부 작업:**

### 1단계: MapView 데이터 연결 확인 및 수정 ✅ (2025-10-03)

- [x] `MapView` 컴포넌트가 실거래가 데이터의 좌표 필드(`latitude`, `longitude`)를 올바르게 인식하도록 수정
  - `Application/components/features/map-view.tsx` 수정 (좌표 필드 우선순위 확장)
- [x] 지도 탭 활성화 및 마커 정상 표시 확인

### 2단계: 거래금액 기준 색상 및 라벨 설정 ✅ (2025-10-03)

- [x] `MapView`에서 `namespace="sale"`일 때 거래금액(`transactionAmount`) 기준으로 마커 색상 지정
  - `Application/components/features/map-view.tsx` 수정 (`formatSaleAmount` 함수 추가, 임계값/팔레트 분기, 가격 필드 매핑, 마커 라벨/title 분기)
- [x] `MapLegend` 컴포넌트가 실거래가 기준 임계값(`[5000, 10000, 30000, 50000]`)을 표시하도록 수정
  - `Application/components/features/MapLegend.tsx` 수정 (`effective` 변수 우선순위 변경)
- [x] 마커 라벨을 엘리베이터 여부 (Y/N)로 표시
- [x] 마커 title(툴팁)에 실거래가 정보 표시
- [x] 범례(Legend) 색상 및 라벨 업데이트
- [x] 범례 힌트 텍스트: "네모박스 내용 Y=엘베 있음, N=엘베 없음"

### 3단계: 팝업 스키마 구현 ✅ (2025-10-03, 백엔드 API 대기)

**목표:** 마커 클릭 시 건물 공통 정보와 개별 거래 내역을 테이블로 표시하는 팝업 구현

**백엔드 API 요청:**

- **문서**: `Communication/Backend/send/Request/251003_Frontend_to_Backend_real-transactions_by-address_API_요청.md`
- **엔드포인트**: `GET /api/v1/real-transactions/by-address`
- **파라미터**: `address` (필수), `size` (기본 1000), `ordering` (기본 `-contract_date`)
- **핵심 요구사항**: 결측값 필드 제외 없이 `null`로 반환

**프론트엔드 구현 완료:**

- [x] **Task 1: 팝업 스키마 생성**

  - `Application/components/map/popup/schemas/sale.ts` 생성
  - `saleSchema(buildingInfo, transactions)` 함수 구현
  - 건물 공통 정보 섹션 (6개 필드)
  - 개별 거래 테이블 (9개 컬럼)
  - 결측값 안전 처리 (`safeValue`, `toNumberOrU`, `formatMoney`, `formatArea`, `elevatorText`)

- [x] **Task 2: 팝업 렌더러 확장**

  - `Application/components/map/popup/BasePopup.ts` 수정
  - `table` 및 `tableCollapsible` 속성 추가
  - 개별 거래 테이블 렌더링 (📊 섹션 헤더 + 토글 버튼)
  - 고정 헤더, 가로/세로 스크롤 지원, 최대 높이 300px

- [x] **Task 3: Mock API 구현**

  - `Application/lib/api.ts` 수정
  - `realTransactionApi.getTransactionsByAddress(address)` 함수 추가
  - 0.5초 지연 시뮬레이션, 3건 Mock 데이터 반환
  - 백엔드 완성 후 1분 내 교체 가능

- [x] **Task 4: 지도 팝업 통합**
  - `Application/components/features/map-view.tsx` 수정
  - `import { saleSchema, realTransactionApi }` 추가
  - `attachPopupEventHandlers()` 헬퍼 함수 구현
  - `buildPopupHTML()`에 `namespace === "sale"` 분기 추가
  - 비동기 데이터 로딩 (로딩 → 성공 → 에러 처리)

**검증 상태:**

- ✅ 코드 린트 오류 없음
- ✅ TypeScript 타입 체크 통과
- ✅ 페이지 로드 및 지역 드롭다운 정상 작동
- ⏳ 최종 검증 (백엔드 API 완성 후)

**백엔드 API 연동 시 변경 사항:**

- `Application/lib/api.ts` 1곳 수정 (주석 해제 + Mock 코드 삭제)
- 소요 시간: 1분

---

## 📝 Phase 6: 상세 필터 백엔드 통합 🔄 진행 중 (2025-10-07)

**목표:** 실거래가 상세 필터의 백엔드 파라미터 매핑을 완료하여 필터가 실제로 데이터를 필터링하도록 구현

### 1단계: 필터 파라미터 매핑 분석 ✅ (2025-10-07)

**문제 발견:**

- 상세 필터 UI는 구현되었으나 백엔드로 파라미터가 전달되지 않음
- 거래금액 필터 적용 시 "2~3만원" 범위에서 43,000만원 데이터가 표시됨

**원인 분석:**

- `Application/datasets/registry.ts`의 `sale` 데이터셋에서 필터 매핑 로직 부재
- 프론트엔드 필터 키(`transactionAmountRange`)와 백엔드 API 파라미터(`min_transaction_amount`, `max_transaction_amount`) 매핑 필요

### 2단계: 필터 파라미터 매핑 구현 ✅ (2025-10-07)

**구현된 매핑 (총 9개 필터):**

1. **거래금액 범위** ✅

   - Frontend: `transactionAmountRange: [min, max]`
   - Backend: `min_transaction_amount`, `max_transaction_amount`

2. **평단가 범위** ✅

   - Frontend: `pricePerPyeongRange: [min, max]`
   - Backend: `min_price_per_pyeong`, `max_price_per_pyeong`

3. **전용면적 범위** ✅

   - Frontend: `exclusiveAreaRange: [min, max]`
   - Backend: `min_exclusive_area`, `max_exclusive_area`

4. **대지권면적 범위** ✅

   - Frontend: `landRightsAreaRange: [min, max]`
   - Backend: `min_land_rights_area`, `max_land_rights_area`

5. **건축연도 범위** ✅

   - Frontend: `buildYearRange: [min, max]`
   - Backend: `min_construction_year`, `max_construction_year`

6. **날짜 범위** ✅

   - Frontend: `dateRange: [startDate, endDate]`
   - Backend: `contract_date_from`, `contract_date_to`

7. **층확인** ⚠️ 문제 발견

   - Frontend: `floorConfirmation: ["first_floor", "general"]`
   - Backend: `floor_confirmation: "first_floor,general"`
   - 현재 상태: "a,l,l,first_floor" 형식으로 잘못 전달됨
   - 원인: 배열 → 문자열 변환 로직 누락

8. **엘리베이터** ⚠️ 검증 필요

   - Frontend: `elevatorAvailable: true/false`
   - Backend: `elevator_available: true/false`

9. **주소 검색** ✅
   - Frontend: `searchQuery` + `searchField`
   - Backend: `address_search` or `road_address_search`

### 3단계: 층확인 필터 수정 🔄 (2025-10-07)

**문제:**

- UI에 "층확인: a,l,l,first_floor" 표시
- 필터 적용되지 않음 (3,092건 → 3,092건)

**수정 작업:**

```typescript
// Application/datasets/registry.ts (Line 810-816)
// Before:
cleanFilters.floor_confirmation = allowedFilters.floorConfirmation;

// After:
if (Array.isArray(allowedFilters.floorConfirmation)) {
  cleanFilters.floor_confirmation = allowedFilters.floorConfirmation.join(",");
} else {
  cleanFilters.floor_confirmation = allowedFilters.floorConfirmation;
}
```

### 4단계: 검증 계획 🔄 (2025-10-07)

**검증 대상 (총 8개 필터):**

1. ✅ 거래금액 필터
2. ⏳ 평단가 필터
3. ⏳ 전용면적 필터
4. ⏳ 대지권면적 필터
5. ⏳ 건축연도 필터
6. ⏳ 거래 날짜 필터
7. ⚠️ 층확인 필터 (수정 후 재검증 필요)
8. ⚠️ 엘리베이터 필터 (검증 필요)

**현재 진행률:**

```
[██░░░░░░░░] 20% 완료

✅ 완료: 2개 작업
  - 필터 파라미터 매핑 분석
  - 필터 파라미터 매핑 구현 (9개)

🔄 진행 중: 2개 작업
  - 층확인 필터 문제 해결
  - 8개 필터 개별 검증

⚠️ 발견된 문제:
  - 층확인 필터: "all" → 배열 변환 로직 문제
  - 프론트엔드 SaleFilter 컴포넌트 초기화 로직 확인 필요

예상 소요 시간:
  - 층확인/엘리베이터 수정: 1시간
  - 전체 필터 검증: 2시간
  - 전체: 3시간
```

### 다음 단계:

1. **즉시 수정 필요:**

   - `SaleFilter.tsx` 컴포넌트의 `floorConfirmation` 초기화 로직 확인
   - "all" → `[]` 변환 제대로 되는지 확인
   - 배열 토글 로직 확인

2. **검증 순서:**

   - 층확인 필터 수정 후 테스트
   - 엘리베이터 필터 테스트
   - 나머지 6개 필터 순차 테스트

3. **문서화:**
   - 각 필터별 테스트 결과 기록
   - 발견된 이슈 문서화
