## 실거래가(전월세) v2 구현 계획 - OUTLINE

### 0. 목적/범위

- 목적: 실거래가(매매) 페이지 패턴을 최대 재사용하여 전월세 페이지(v2) 구현
- 범위: 목록/지도/정렬/필터 구조 동일 유지, 데이터 소스·컬럼·범례·지표만 전월세에 맞게 차등

### 1. 재사용(동일) 구성 요소/패턴

- 컨테이너 패턴: 결과 컨테이너에서 테이블/지도/통합(both) 전환, 로딩·빈상태 처리
  - `Application/components/features/rent/RentSearchResults.tsx`
- 테이블(스키마 기반): 컬럼 DnD·리사이즈, 외부 페이지네이션, 헤더 정렬 위임
  - `Application/components/features/item-table.tsx`
- 지도 공통: 초기 fitBounds 1회, 필터 변경 시 중심·레벨 유지, 마커 상한/빈상태 안내
  - `Application/components/features/map-view.tsx`
- 필터 UI 구조/상태 관리: 전역 스토어, 지역 선택 체계, 페이지·사이즈, 정렬 상태
  - `Application/components/features/rent/RentFilter.tsx`
  - `store/filterStore.ts`
- 데이터 훅/어댑터: SWR 캐시, 응답 정규화 `{ items,total } → { results,count }`
  - `Application/hooks/useDataset.ts`
  - `Application/datasets/registry.ts`(`datasetConfigs.rent`)
- 정렬 허용 컬럼 메타 로딩: `/api/v1/real-rents/columns`
  - `Application/hooks/useSortableColumns.ts`
- 지역 데이터: v2 상단 공통 카드(시/도→시군구, 선택 읍면동)
  - `Application/app/analysis/[id]/v2/page.tsx`, `hooks/useLocations.ts`(sale용 API 활용 여부 검토)
- API 클라이언트
  - `Application/lib/api.ts`(`realRentApi`)
- 선택 필터 바/초기화/퍼시스턴스
  - `Application/components/features/selected-filter-bar.tsx`, `hooks/useColumnOrder.ts`
- 지도 원필터/연동(매매 패턴 이식)
  - `Application/components/features/MapCircleControls.tsx`, `components/features/shared/useCircleFilterPipeline.ts`

### 진행 현황(요약) — 2025-10-11

- 데이터셋/정렬
  - `datasetConfigs.rent.table.defaultSort = { key: "contractDate", order: "desc" }` 적용
  - `fetchList`에서 `sigungu` 자동 정규화(예: `경기도` + `고양시 덕양구` → `경기도 고양시 덕양구`)
  - 테이블 정렬 토글 사이클 구현: 오름(asc) → 내림(desc) → 해제(none)
    - `ItemTable` 3번째 클릭 시 `onSort(undefined, undefined)` 전송
    - `RentSearchResults.tsx`/`SaleSearchResults.tsx`의 `handleSort`가 빈 컬럼 입력 시 `setSortConfig(undefined, undefined)` 호출하도록 수정
- 컬럼/스키마
  - `columnsRent` 확정: "대지권면적(㎡)" 제외, "보증금갱신차이(만원) → 보증금갱신차이(%)" 순서 반영
  - 팝업 스키마 `components/map/popup/schemas/rent.ts` 추가, `pickFirst`로 snake/camel 혼합 키 안정화
- API/메타
  - `realRentApi.getColumns()/getRentsByAddress()` 추가·연동, `useSortableColumns("rent")`가 `/real-rents/columns` 사용
- 지역 선택/게이트
  - `RentFilter.tsx`에서 `useRealTransactionsSido/Sigungu/AdminDong` 사용으로 교체
  - 상단 공통 지역 카드(`app/analysis/[id]/v2/page.tsx`)도 렌트 탭에서 실거래가 정규 API 사용으로 전환(읍면동 활성화)
  - 시군구 미선택 시 목록/지도 요청 차단 게이트 적용, dropdown `disabled`/로딩 상태 보강
- 지도/마커/범례
  - 렌트 마커 라벨: 엘리베이터 여부 Y/N, 범례 힌트도 Y/N 표기
  - 색상 기준: 전월세 전환금(5%) 분기 사용
- 백엔드 커뮤니케이션
  - `/real-rents/by-address` 라우팅 충돌(422) 및 지역 AND 필터 정규화 요청 문서화·발송
  - 실거래가(전월세) 목록 API 정렬(ordering) 미적용 확인 → 적용 요청서 발송
    - 문서: `Communication/Backend/send/Request/251011_Frontend_to_Backend_real-rents_ordering_지원요청.md`
  - 확장 필터/UI/서버 매핑
    - 전환금/연수익률/평당보증금/평당월세 4종 컨트롤 추가 및 서버 `min/max_*` 매핑 활성화
    - 계약일자 빠른 선택(최근 1/3/6개월/올해) 버튼 추가
    - 층확인 칩 보정 및 서버 토큰 정규화(영→한), 빈/"all"/공백 미전송
    - 상단 버튼(선택 항목만 보기/설정 초기화) 도입, 하단 중복 초기화 버튼 제거
  - 선택 항목만 보기(ids)
    - 프론트: `ids` CSV(≤500) 전송 로직 추가(폴백: 클라이언트 필터)
    - 백엔드: 지원 완료(AND 결합, 정렬/페이징 호환) 답신 수신
    - 문서: `Communication/Backend/send/Request/251011_Frontend_to_Backend_real-rents_ids_지원요청.md`, `Communication/Backend/send/Completed/251011_Backend_to_Frontend_real-rents_ids_지원_답신.md`

### 2. 차이(전월세 전용) 포인트

- 엔드포인트/계약
  - 목록/메타: `/api/v1/real-rents/`, `/api/v1/real-rents/columns` (선택: `/rental-yield`)
  - 데이터셋 키: `rent` 사용(`datasetConfigs.rent`)
  - 응답 정규화: `{items,total}` → `{results,count}` (공통)
- 컬럼/지표(표시 규칙)
  - 기본 지표 후보: 보증금(만원), 월세(만원), 전용면적(㎡), 계약일자, 전월세구분, 계약구분
  - price 계산 기준: `deposit + (monthly * k)`의 파생값 표시 여부(k 기본 100) [결정필요]
  - 배지/표기: `price_basis`, `k` 배지/툴팁 노출 [결정필요]
- 기간/정렬
  - 기본 정렬 후보: `contractDate desc` 또는 `depositAmount desc` [결정필요]
  - 허용 정렬 키: 백엔드 `/columns` 응답 기반(예: deposit_amount, monthly_rent, contract_date, exclusive_area_sqm…)
- 검색 UX
  - 주소 검색: 도로명/지번/전용키 지원(Option A: `address_search+type`, Option B: `road_address_search`) → 매매와 동일 정책
- 필터 범위/서버 이전
  - 1차: 서버(지역/정렬/페이지), 나머지 클라(보증금/월세/면적/기간)
  - 서버 이전 우선순위: 보증금/월세/기간 [결정필요], 파라미터 명세 확정
- 지도/범례/마커
  - 색상 기준 [결정필요]: 보증금, 월세, 또는 `deposit+monthly*k`
  - 임계값 t1~t4 [결정필요]: 전월세용 기본값(만원) 확정
  - 라벨 [결정필요]: 억 단위 축약 or "보증금/월세" 혼합 표기
- 팝업/상세(선택)
  - `/real-rents/by-address` 제공 시: 건물 공통 정보 + 전월세 이력 테이블 스키마

### 3. 사용자 결정·백엔드 요청·산출물/테스트

- A) 사용자 결정(기본값 제안)
  - 기본 정렬: `contractDate desc` 제안(대안: `depositAmount desc`)
  - 지도 범례 기준: 기본=보증금, t1~t4 임계값(예: 2000/5000/10000/20000 만원) [결정필요]
  - 라벨: 억 단위 축약(예: 2.4억), 월세 별도 표기 여부 [결정필요]
  - 페이지 사이즈: 20
  - 딥링크: 필터 URL 기본 ON
- B) 백엔드 협업 요청/확인
  - 엔드포인트: `/api/v1/real-rents/`, `/columns`, (선택) `/by-address`, `/rental-yield`
  - 파라미터 매핑 확정: `sido/sigungu/admin_dong_name`, 정렬 `ordering`
  - 서버 필터: `min_deposit_amount/max_deposit_amount`, `min_monthly_rent/max_monthly_rent`, `min_exclusive_area/max_exclusive_area`, `min_construction_year/max_construction_year`, `contract_date_from/to`
  - 선택 ID 서버 필터: `ids`(최대 500) 지원 여부 확인
- C) 구현·운영 산출물(템플릿)
  - 데이터 계약/매핑 표(프론트키 | 백엔드 | 라벨 | 단위 | 반올림 | 예시)
    - `depositAmount` | `deposit_amount` | 보증금 | 만원 | 정수 | 45000
    - `monthlyRent` | `monthly_rent` | 월세 | 만원 | 정수 | 50
    - `exclusiveAreaSqm` | `exclusive_area_sqm` | 전용면적 | ㎡ | 소수1 | 59.8
    - `contractDate` | `contract_date` | 계약일자 | - | - | 2025-09-30
    - `rentType` | `rent_type` | 전월세구분 | - | - | 전세
    - `contractType` | `contract_type` | 계약구분 | - | - | 갱신
  - 정렬 허용 맵(헤더 | 서버 key | 허용 | 비고)
    - 보증금 | deposit_amount | true | 기본
    - 월세 | monthly_rent | true | 보조
    - 계약일자 | contract_date | true | 기본
    - 전용면적 | exclusive_area_sqm | true | 선택
  - 범례/마커 사양(기준/임계값/팔레트/라벨)
  - 안내 문구/접근성 체크리스트(빈데이터/오류/좌표 결측)

### 4. 아키텍처 개요(페이지 · 데이터 흐름)

- 페이지: 필터 바 → 결과 컨테이너(테이블/지도/통합) → 페이지네이션/사이즈
- 데이터 흐름: `filterStore` → `datasetConfigs.rent.api` → `realRentApi` → `useDataset` 정규화 → `ItemTable`/`MapView`
- 정렬 흐름: 헤더 클릭 → `/columns` 허용 목록 필터 → 서버로 `ordering` 전달
- 지도 연동: `toItemLike` 좌표 매핑 → `MapView` 마커/하이라이트, 중심/레벨 보존

### 5. API 계약 상세(전월세)

- 목록: `GET /api/v1/real-rents/`
  - 쿼리: `page`, `size`, `sido`, `sigungu`, `admin_dong_name?`, `ordering?` + (서버 필터 확장 시) 각 범위 파라미터
  - 응답: `{ items: Item[], total: number }`
- 컬럼 메타: `GET /api/v1/real-rents/columns`
  - 응답: `{ sortable_columns: string[] }` 또는 `{ columns: [{key,label,sortable}] }` 중 택1 [확인필요]
  - 정렬 파라미터: `sortBy/sortOrder` → `ordering=-snake_case` 변환(예: depositAmount desc → `ordering=-deposit_amount`)
- 수익률: `GET /api/v1/real-rents/rental-yield` (선택)
- 상세/주소별(선택): `GET /api/v1/real-rents/by-address`

### 6. 컬럼 정의 상세

- 기본 컬럼: `Application/datasets/contracts.ts`(`columnsRent`) 기준
- 표시 규칙
  - 금액: 만원 단위(정수), 억 축약 옵션(마커/툴팁)
  - 면적: ㎡ 기본, 전역 플래그로 평 변환 표시 지원
  - 빈값: `-` 표기, 정렬 시 빈값 최하위
- 열 폭/모바일: 폭 가이드/모바일 축약(보증금/월세 우선)

### 7. 정렬 정책 상세

- 허용 컬럼: `/columns`의 허용 목록만 활성
- 기본 정렬: `contractDate desc`(제안)
- 토글 사이클: asc → desc → none, isSorting 동안 재클릭 억제
  - 구현 상태: 렌트/매매 모두 `handleSort` 정렬 해제 분기 반영(2025-10-11)
- 구현 메모:
  - 훅: `useSortableColumns("rent")` 사용
  - 응답 포맷이 legacy(`sortable_columns`)일 경우 그대로 사용, new(`columns[].sortable`)면 true만 추출
  - 프론트 키(camelCase) → 서버 키(snake_case) 변환 후 `ordering`로 전달

### 8. 필터 정의 상세(클라이언트 우선)

1. 지역 필터: `province/cityDistrict/town` → `sido/sigungu/admin_dong_name`
2. 보증금 범위: `depositRange` → `min_deposit_amount/max_deposit_amount`
3. 월세 범위: `monthlyRentRange` → `min_monthly_rent/max_monthly_rent`
4. 전용면적: `areaRange` → `min_exclusive_area/max_exclusive_area`
5. 건축연도: `buildYearRange` → `min_construction_year/max_construction_year`
6. 계약 날짜: `dateRange` → `contract_date_from/to`
7. 전월세 구분: `rentType` → `rent_type`(전세/월세/연세)
8. 계약 구분: `contractType` → `contract_type`(신규/갱신)
9. 주소 검색: `searchQuery+searchField(address|jibun_address|road_address)` → address_search(+type) 또는 전용키
10. 선택 항목만 보기: `ids`(≤500) [백엔드 확인]
11. 편의시설/층확인: `elevatorAvailable` → `elevator_available`(Boolean), `floorConfirmation` → `floor_confirmation`(CSV) [백엔드 지원 여부 확인]

### 9. 지도/마커 동작 상세

- 좌표 매핑: 다양한 키(lat/lng/lon/x/y/lat_y 등) 우선순위 + 범위 기반 스왑 가드
- 초기: 첫 로드 1회 `fitBounds`, 이후 중심·레벨 유지, 0건이어도 리셋 금지
- 마커 상한: 공통 상한치, 안내 배지
- 클러스터 토글: 공통 `MapView` 옵션 사용(`useClustering`, `clusterToggleEnabled`)
- 범례/라벨: 전월세 기준 임계값(t1~t4)과 라벨 정책 확정 [결정필요]
  - 제안 A(보증금 기준): t1=2000, t2=5000, t3=10000, t4=20000(만원)
  - 제안 B(월세 기준): t1=30, t2=50, t3=80, t4=120(만원)
  - 제안 C(복합가격): `deposit + monthly*k` 기준, k=100(환경변수로 조절) — 마커 title에 "보증금/월세" 병기

### 10. 팝업/상세 정책(선택)

- A안: 전월세 탭 초기에는 팝업 최소화(주소 클릭 비활성)
- B안: `/real-rents/by-address` 도입 시 전월세 전용 팝업 스키마 추가(건물 정보+계약 이력)

### 18. 팝업 스키마 템플릿(선택)

- 엔드포인트(제안): `GET /api/v1/real-rents/by-address?address=...&size=1000&ordering=-contract_date`
- 응답(예시): `{ building: {...}, items: [...], total }`

빌딩 공통 정보(행 형태)

- 건물명(실제) | `building_name_real`
- 도로명주소 | `road_address_real`
- 지번주소 | `jibun_address`
- 건축연도 | `construction_year_real`
- 엘리베이터 | `elevator_available`
- 총 거래 건수 | `total`

개별 전월세 내역(표 형태)

- 헤더: 동명 | 년 | 월 | 면적(㎡) | 전용(평) | 보증금(만원) | 월세(만원) | 계약구분 | 계약일
- 키: `dong_name` | `contract_year` | `contract_month` | `exclusive_area_sqm` | `exclusive_area_pyeong` | `deposit_amount` | `monthly_rent` | `contract_type` | `contract_date`

렌더링 규칙

- 결측값은 `-`로 표시, 숫자 천단위 구분
- 최대 높이 300px, 고정 헤더, 가로/세로 스크롤
- 접기/펼치기 토글 제공

### 11. 상태관리/스토어 키

- 필터/정렬: `province`, `cityDistrict`, `town`, `sortBy`, `sortOrder`, `page`, `size` + 전월세 전용 키들(`depositRange`, `monthlyRentRange`, `rentType`, `contractType` 등)
- 액션: `setFilter`, `setRangeFilter`, `setSortConfig`, `setPage`, `setSize`
- 테이블 퍼시스턴스 키: `table:order:rent`, `table:width:rent`, `table:sort:rent`, `pageSize:rent`
- 네임스페이스/URL 동기화: `rent` 네임스페이스로 필터 상태 저장, URL 쿼리와 양방향 동기화(딥링크)

### 12. 구현 단계(개발 체크) + 단계별 확인 질문 가이드

#### Phase 1: 백엔드 확인

- [ ] `/real-rents`, `/columns` 스모크(200 OK)
- [ ] 정렬 가능 컬럼 응답 형식 확정(legacy vs new)
  - [ ] 서버 필터 지원 범위 확인(보증금/월세/면적/기간/층확인/엘리베이터/ids)

#### Phase 2: 데이터셋 설정

- [ ] `registry.ts`에 `RENT_FILTERS` 화이트리스트 정의/매핑 구현
- [ ] 어댑터 `toItemLike` 최종 점검(보증금/월세/면적/계약일)
- [ ] 정렬 파라미터 통일(`ordering=-snake_case`)
  - [ ] 선택 ID 서버 필터 연동(`showSelectedOnly+selectedIds` → `ids` ≤500)

#### Phase 3: 필터 컴포넌트

- [ ] `RentFilter` 키/UX 정합(매매 패턴 반영, 페이지=1 리셋, 활성 강조)
- [ ] 주소 검색(도로명/지번) 옵션

#### Phase 4: 검색 결과 컴포넌트

- [ ] 선택→지도강조 연동(Zustand `selectedIds` → `MapView.highlightIds`)
- [ ] 통합(both) 뷰 체크박스 선택 시 지도 중심 이동
- [ ] 원필터 통합(`MapCircleControls` + `useCircleFilterPipeline`, ns="rent")
- [ ] “영역 안만 보기” 토글/카운트 표시, ids 서버 필터 연동(선택)
  - [ ] 지도 탭 마커 라벨 정책(보증금/월세/복합가격) 및 title 포맷 적용

#### Phase 5: 지도/범례

- [ ] 전월세 기준 색상 임계값/라벨 정책 적용
  - [ ] 범례 힌트/툴팁 문구: "네모박스 내용 보증금/월세 요약" 등 안내 추가

#### Phase 6: 팝업(선택)

- [ ] `/by-address` 지원 시 팝업 스키마/렌더러 통합

#### Phase 7: 테스트/DoD

- [ ] 네트워크: 지역/정렬/페이지, 범위 필터 파라미터 전달/응답 합리성
- [ ] 목록/지도: 선택→강조/중심 이동, 0건 시 안내·중심 유지
- [ ] UI/UX: 페이지네이션, 모바일 1열, 딥링크 복원
- [ ] 접근성/성능: aria-label, SWR 딜레이/디듀플, 에러/빈상태 안내
  - [ ] 정렬: `/columns` 허용 키 반영, 비허용 헤더 클릭 시 무시
  - [ ] 서버 필터: 보증금/월세/면적/기간/구분/계약구분/주소검색/ids 전달 검증

---

### 19. 성능/SLA 목표(초안)

- 네트워크
  - 목록 API 평균 응답: < 500ms (p75), 타임아웃 8s
  - 재시도: 1회, 간격 1.5s (개발/스테이징), 프로덕션은 상황별 조정
- SWR/캐싱
  - dedupingInterval: 1500ms, revalidateOnFocus: false, reconnect: false
  - keepPreviousData: true로 깜빡임 최소화
- 렌더링
  - 초기 TTFB < 200ms(로컬), 클라이언트 렌더 과도한 리렌더 없도록 메모이제이션
- 지도
  - 마커 상한: 500(기본), 클러스터 ON 기본값, 레벨/그리드 동적 조정
  - 원필터 적용 시 테이블 페이지네이션/총계 즉시 반영
- 테이블
  - 100행 기준 스크롤/정렬 상호작용 16ms 프레임 목표
  - 가상 스크롤 옵션: 대용량 시 활성화
- 로깅/에러
  - 콘솔 에러 0, Sentry 경고 기준선 정의(경로/에러코드)

### 16. 에러/빈데이터 안내 문구(초안)

- 데이터 없음: "조건에 맞는 결과가 없습니다. 지역/기간/보증금/월세를 조정해 보세요."
- 네트워크 오류: "일시적인 오류가 발생했습니다. 다시 시도하거나 조건을 변경해 보세요."
- 좌표 결측 다수: "일부 항목은 지도에 표시되지 않을 수 있습니다. 목록에서 상세 정보를 확인해 주세요."
- 요청 과다(429): "요청이 많습니다. 잠시 후 다시 시도해 주세요."

톤/가이드

- 다음 행동을 제시하는 1~2문장 유지, 지나친 기술 용어 지양
- 재시도 버튼/연락처(선택) 병행 표기

### 15. 사용자 선호 저장 키(초안)

- 키 | 설명 | 저장소 | 비고
- `table:order:rent` | 테이블 컬럼 순서 | localStorage | DnD 결과 저장
- `table:width:rent` | 테이블 컬럼 너비 | localStorage | 리사이즈 폭 저장
- `table:sort:rent` | 정렬 상태 | localStorage | { key, order }
- `pageSize:rent` | 페이지 사이즈 | localStorage | 20/50/100
- `rent:maxMarkersCap` | 지도 마커 표시 상한 | localStorage | 기본 500(권장)
- `rent:useClustering` | 클러스터 토글 | localStorage | true/false
- `rent:legend:mode` | 범례 기준 | localStorage | deposit|monthly|composite
- `rent:view:last` | 마지막 뷰 | localStorage | table|map|both
- (선택) `user-preferences API` | 서버 저장 | server | 조직 단위 동기화 시

메모

- 네임스페이스 충돌 방지: 키에 `:rent` 접미어 유지
- 서버 저장 전환 시 기존 localStorage와 마이그레이션 전략 필요

### 13. SALE → RENT 매핑 요약(차이점 정리)

- 엔드포인트: `/api/v1/real-transactions/`(매매) ↔ `/api/v1/real-rents/`(전월세)
- 정렬 기본값: 매매=`contractDate desc` → 전월세=동일 제안(대안: `depositAmount desc`)
- 핵심 지표: 매매=거래금액/평단가 ↔ 전월세=보증금/월세/복합가격(k)
- 범례 임계값: 매매=6천/8천/1억/1.3억 ↔ 전월세(보증금 제안)=2천/5천/1억/2억
- 주소 검색: 정책 동일(Option A: `address_search+type`, Option B: `road_address_search`)
- 선택 ids 서버 필터: 정책 동일(최대 500)
- 층확인/엘리베이터: 매매와 동일 매핑, 백엔드 지원 여부 확인 필요

---

### 17. 접근성(ARIA) 체크리스트(초안)

- 테이블 셀 라벨
  - 보증금: aria-label="보증금 {값}만원"
  - 월세: aria-label="월세 {값}만원"
  - 계약일: aria-label="계약일 {YYYY년 MM월 DD일}"
  - 주소: aria-label="주소 {도로명주소 또는 지번}"
- 정렬 버튼
  - aria-pressed로 활성 상태 반영, 헤더 포커스 이동 가능
- 지도 마커
  - title에 "보증금/월세 요약, 주소" 포함(예: "보증금 3억, 월세 50, 강남구 …")
- 키보드 탐색
  - 필터/탭/페이지네이션 포커스 순서 검증, Tab/Shift+Tab 순환
- 색 대비/상태 전달
  - 빈 상태/에러 배지 색 대비 4.5:1 이상

### 14. 분석/모니터링 이벤트(초안)

- 이벤트 | 트리거 | 속성 | 샘플링 | 채널
- sort_changed | 테이블 헤더 클릭 | key, order, dataset=rent | 100% | analytics.ts
- filter_applied | 필터 적용/초기화 | filters(축약), changed_keys | 50% | analytics.ts
- map_marker_click | 지도 마커 클릭 | id, deposit, monthly, address | 100% | analytics.ts
- view_switched | 뷰 전환 | from, to, dataset=rent | 100% | analytics.ts
- page_changed | 페이지네이션 | page, size, dataset=rent | 100% | analytics.ts
- error_shown | 에러 상태 표시 | code, path, message | 100% | sentry
- empty_state | 0건 상태 노출 | filters(축약), reason | 100% | analytics.ts

메모

- filters(축약): 주요 키만 포함(province, cityDistrict, town, depositRange, monthlyRentRange, dateRange 등)
- address는 프라이버시 고려 필요 → 마스킹/비저장 원칙 준수

## 부록 A. 환경 변수 매트릭스(초안)

- 키 | 목적 | 예시값 | 검증
- NEXT_PUBLIC_API_BASE_URL | API 베이스 URL | http://127.0.0.1:8000 | /health 200 OK
- NEXT_PUBLIC_KAKAO_APP_KEY | 카카오 지도 | xxxxxxxxxxxxxxxxxxxxx | 콘솔 에러 무
- NEXT_PUBLIC_DETAIL_DEBUG | 상세 디버그 토글 | 1 | 디버그 패널 노출
- NEXT_PUBLIC_LISTINGS_MOCK | 매물 목업 토글 | 1/0 | 개발만 1
- NEXT_PUBLIC_RENT_PRICE_K | 복합가격 k(보증금+월세\*k) | 100 | 마커 라벨/툴팁 반영
- NEXT_PUBLIC_RENT_LEGEND | 범례 임계값(만원, CSV) | 2000,5000,10000,20000 | 범례/색상 반영
- NEXT_PUBLIC_SWR_DEDUP_MS | SWR dedupe(ms) | 1500 | 요청 수 감소
- NEXT_PUBLIC_SWR_REFOCUS | 포커스 재검증 | false | 포커스 시 재요청 여부

## 부록 B. 스모크 명령(예시)

```bash
curl -G "http://127.0.0.1:8000/api/v1/real-rents/" \
  --data-urlencode "sido=서울특별시" \
  --data-urlencode "sigungu=강남구" \
  --data-urlencode "page=1" \
  --data-urlencode "size=20"
```

추가 예시

- 정렬(계약일 내림차순) + 페이지/사이즈

```bash
curl -G "http://127.0.0.1:8000/api/v1/real-rents/" \
  --data-urlencode "sido=서울특별시" \
  --data-urlencode "sigungu=강남구" \
  --data-urlencode "ordering=-contract_date" \
  --data-urlencode "page=1" \
  --data-urlencode "size=50"
```

- 범위 필터(보증금/월세/면적/연식/기간)

```bash
curl -G "http://127.0.0.1:8000/api/v1/real-rents/" \
  --data-urlencode "sido=경기도" \
  --data-urlencode "sigungu=고양시 덕양구" \
  --data-urlencode "min_deposit_amount=20000" \
  --data-urlencode "max_deposit_amount=100000" \
  --data-urlencode "min_monthly_rent=30" \
  --data-urlencode "max_monthly_rent=80" \
  --data-urlencode "min_exclusive_area=59" \
  --data-urlencode "max_exclusive_area=85" \
  --data-urlencode "min_construction_year=2000" \
  --data-urlencode "max_construction_year=2024" \
  --data-urlencode "contract_date_from=2025-01-01" \
  --data-urlencode "contract_date_to=2025-09-30" \
  --data-urlencode "page=1" \
  --data-urlencode "size=20"
```

- 주소 검색(도로명/지번)

```bash
# 도로명 주소 검색(Option A)
curl -G "http://127.0.0.1:8000/api/v1/real-rents/" \
  --data-urlencode "sido=서울특별시" \
  --data-urlencode "sigungu=서초구" \
  --data-urlencode "address_search=서초대로 45" \
  --data-urlencode "address_search_type=road" \
  --data-urlencode "page=1" \
  --data-urlencode "size=20"

# 지번 주소 검색(Option A)
curl -G "http://127.0.0.1:8000/api/v1/real-rents/" \
  --data-urlencode "sido=서울특별시" \
  --data-urlencode "sigungu=서초구" \
  --data-urlencode "address_search=서초동 123-45" \
  --data-urlencode "address_search_type=jibun" \
  --data-urlencode "page=1" \
  --data-urlencode "size=20"
```

- 선택 항목만 보기(ids 서버 필터)

```bash
curl -G "http://127.0.0.1:8000/api/v1/real-rents/" \
  --data-urlencode "sido=서울특별시" \
  --data-urlencode "sigungu=강남구" \
  --data-urlencode "ids=R-1024,R-2048,R-4096" \
  --data-urlencode "page=1" \
  --data-urlencode "size=20"
```

- 컬럼 메타 확인(정렬 허용 키)

```bash
curl -G "http://127.0.0.1:8000/api/v1/real-rents/columns"
```

- PowerShell: `/columns` 정렬 허용 키 확인

```powershell
$r = Invoke-RestMethod "http://127.0.0.1:8000/api/v1/real-rents/columns"
if ($r.columns) {
  "sortable=`t{0}" -f (($r.columns | Where-Object { $_.sortable } | ForEach-Object { $_.key }) -join ", ")
} elseif ($r.sortable_columns) {
  "sortable=`t{0}" -f (($r.sortable_columns -join ", "))
} else {
  "no columns payload"
}
```

## 부록 C. 리스크/완화(요약)

- `/columns` 형식 상이 → 훅에서 분기 처리 또는 통일 API 요청 필요
- 좌표 결측/키 상이 비율 → 지도 상한/안내 강화, 좌표 스왑 가드
- 서버 필터 미지원 구간 → 임시 클라이언트 필터 고려(백엔드 대응 전까지만)
