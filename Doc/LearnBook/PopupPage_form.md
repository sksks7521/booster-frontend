## 목적

- `Doc/LearnBook/PopupPage_form.tsx`의 상세 팝업 설계를 참고하여, 현재 테이블의 도로명주소 클릭 시 같은 페이지 내 모달(Dialog)로 상세 정보를 보여주는 컴포넌트를 단계적으로 도입한다.
- 기존 API/DB 컬럼명과 UI 요구를 일치시키기 위한 매핑 규칙, 데이터 로딩 전략, UI/UX 정책을 정의한다.

## 데이터 소스와 타입 전략

- 1차(즉시 표시): 목록 API에서 받은 `Item`(경량)으로 모달 상단 핵심 요약을 즉시 렌더.

  - 사용 필드 예: `usage`, `case_number`, `road_address|address`, `minimum_bid_price`, `appraised_value`, `current_status`, `sale_date` 등.
  - 목적: 클릭-피드백 지연 최소화, 체감 성능 향상.

- 2차(지연 로딩): `itemApi.getItem(id)` 상세 API로 부족/정규화가 필요한 필드 로드 → 모달 섹션 단위로 점진적 하이드레이션.

  - Skeleton/placeholder를 섹션별로 독립 표시(가격/면적/건물/기타 정보 카드 단위).
  - 실패 시 해당 섹션에 에러 메시지+재시도 버튼 제공. 상단 요약은 유지.

- 뷰모델 계층(강력 권장): API 응답과 화면 모델을 분리.

  - API 모델: `Application/lib/api.ts`의 `Item`(snake_case 중심, 일부 문자열 숫자).
  - 뷰모델: `PropertyDetailData`(참조 TSX) 스펙을 최대한 준수. 누락은 `-`/0/false 등 안전 기본값.
  - 매핑 함수: 숫자/날짜/불리언 정규화, 파생값 계산(예: `priceRatio`, `publicPriceRatio`). 아래 유틸(본 문서 하단) 재사용.

- 훅 설계(제안): `usePropertyDetail(id)`

  - 입력: `id: number`
  - 출력: `{ vm: PropertyDetailData | null, isLoading: boolean, isError: boolean, reload: () => void }`
  - 특징:
    - SWR 키: `['/api/v1/items/', id, 'detail']`
    - 캐시 정책: `revalidateOnFocus: false`, `dedupingInterval: 15_000ms`, `keepPreviousData: true`
    - 사전 로드: 테이블 셀 `onMouseEnter`에 프리패치(Optional)
    - 경합 처리: 빠른 연속 클릭 시 마지막 id만 유지(AbortController/SWR 자동 중복 방지)

- 타입/파싱 규칙(핵심):

  - 숫자: 모든 금액/면적/비율 필드는 `Number()`/`parseFloat()`로 안전 변환. NaN → 0.
  - 불리언: `elevator_available` 등은 'O'/'Y' → true, 'X'/'N' → false, 그 외는 기존 불리언 필드 대체.
  - 날짜: `sale_date`는 `new Date()` 실패 시 원문 스트링 표시. D-Day 계산은 옵셔널.
  - 주소: `road_address ?? address` 우선.

- 성능/사용성 고려:

  - 상세 호출은 모달 오픈 때만(클릭 시), 사전 프리패치 옵션(호버)로 체감 속도 개선.
  - 동일 id 재오픈 시 SWR 캐시 활용, 15초 내 재요청 억제. 수동 `reload()`로 갱신 가능.
  - 비교/차트 등 부가 데이터는 후속 탭/아코디언 인터랙션 시 지연 로드(현재 범위 외).

- 오류/복구 정책:

  - 네트워크/파싱 실패 시 섹션 단위 에러 UI + 재시도. 전역 토스트는 과다 노출 회피.
  - 부분 실패 허용(표시 가능한 섹션은 지속 노출). API 에러 메시지는 표준화된 문구로 축약.

- 테스트/모킹:
  - MSW(`Application/mocks/`)로 상세 응답 샘플 구성, 필드 누락/이형 데이터 케이스 포함.
  - 단위: 매핑 유틸에 대한 숫자/불리언/날짜 파싱 스냅샷/경계값 테스트.
  - 통합: 훅+모달 렌더 흐름(즉시 표시 → Skeleton → 완성 → 에러 재시도) 시나리오.

### 훅 초안 예시

```ts
type UsePropertyDetailResult = {
  vm: PropertyDetailData | null;
  isLoading: boolean;
  isError: boolean;
  reload: () => void;
};

function usePropertyDetail(id?: number): UsePropertyDetailResult {
  const swrKey = id ? ["/api/v1/items/", id, "detail"] : null;
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    () => itemApi.getItem(id as number),
    {
      revalidateOnFocus: false,
      dedupingInterval: 15000,
      keepPreviousData: true,
    }
  );
  const vm = data ? mapItemToDetail(data as Item) : null;
  return {
    vm,
    isLoading,
    isError: Boolean(error),
    reload: () => {
      void mutate();
    },
  };
}
```

## 필드 매핑 규칙

| 참고 TSX(PropertyDetailData) | 서버/목록 스키마(Item)           | 매핑/계산 규칙                                               |
| ---------------------------- | -------------------------------- | ------------------------------------------------------------ |
| id                           | id                               | number 그대로 사용                                           |
| usage                        | usage                            | 그대로                                                       |
| caseNumber                   | case_number                      | snake_case → camelCase로 표기 변환                           |
| roadAddress                  | road_address / address           | `road_address ?? address` 우선                               |
| locationAddress              | N/A                              | 임시: `address` 또는 '-'                                     |
| buildingArea                 | building_area_pyeong             | 값 그대로(단위 표기는 UI에서 '평')                           |
| landArea                     | land_area_pyeong                 | 값 그대로                                                    |
| appraisalValue               | appraised_value                  | 값 그대로(만원)                                              |
| minimumPrice                 | minimum_bid_price                | 값 그대로(만원)                                              |
| priceRatio                   | bid_to_appraised_ratio           | 문자열이면 숫자로 파싱, 없으면 (minimum/appraised)\*100 계산 |
| publicPriceRatio             | calculated_ratio                 | 서버 제공 시 사용, 없으면 (minimum/public_price) 계산        |
| publicPrice                  | public_price                     | 값 그대로(만원)                                              |
| under100Million              | under_100million                 | 'O' 포함 여부 → boolean                                      |
| currentStatus                | current_status                   | 값 그대로                                                    |
| saleDate                     | sale_date                        | ISO/문자열 → YYYY-MM-DD 표기                                 |
| latitude                     | lat                              | 값 그대로                                                    |
| longitude                    | lng                              | 값 그대로                                                    |
| constructionYear             | construction_year / built_year   | 우선순위: construction_year → built_year                     |
| floorConfirm                 | floor_confirmation               | 값 그대로                                                    |
| hasElevator                  | elevator_available / hasElevator | 'O'/'Y' → true, 'X'/'N' → false                              |
| specialRights                | special_rights                   | 값 그대로                                                    |
| buildingName, dongName 등    | N/A                              | 추후 백엔드 확장/별도 API 응답 필요 시 반영                  |

### 매핑 유틸 초안

```ts
function mapItemToDetail(item: Item): PropertyDetailData {
  const minimum = Number(item.minimum_bid_price) || 0;
  const appraised = Number(item.appraised_value) || 0;
  const publicPrice = Number(item.public_price) || 0;
  const ratioFromText = parseFloat(String(item.bid_to_appraised_ratio ?? ""));

  const priceRatio = isFinite(ratioFromText)
    ? ratioFromText
    : appraised > 0
    ? (minimum / appraised) * 100
    : 0;

  const publicPriceRatio =
    item.calculated_ratio ?? (publicPrice > 0 ? minimum / publicPrice : 0);

  const hasElevator = (() => {
    const raw = item.elevator_available;
    if (raw === "O" || raw === "Y") return true;
    if (raw === "X" || raw === "N") return false;
    return Boolean(item.hasElevator);
  })();

  return {
    id: String(item.id),
    title: `${item.usage ?? ""} ${item.case_number ?? ""}`.trim(),
    usage: item.usage ?? "-",
    caseNumber: item.case_number ?? "-",
    roadAddress: item.road_address ?? item.address ?? "-",
    locationAddress: item.address ?? "-",
    buildingArea: item.building_area_pyeong ?? 0,
    landArea: item.land_area_pyeong ?? 0,
    appraisalValue: appraised,
    minimumPrice: minimum,
    priceRatio,
    publicPriceRatio,
    publicPrice,
    under100Million: String(item.under_100million ?? "").includes("O"),
    currentStatus: item.current_status ?? "-",
    saleDate: item.sale_date ?? "-",
    location: item.address ?? "-",
    postalCode: "-",
    pnu: "-",
    longitude: item.lng ?? 0,
    latitude: item.lat ?? 0,
    buildingName: "-",
    dongName: "-",
    landSize: 0,
    buildingSize: 0,
    totalFloorArea: 0,
    buildingCoverageRatio: 0,
    floorAreaRatio: 0,
    mainStructure: "-",
    mainPurpose: "-",
    otherPurpose: "-",
    height: 0,
    groundFloors: 0,
    undergroundFloors: 0,
    households: 0,
    units: 0,
    roomNumber: "-",
    approvalDate: "-",
    elevators: 0,
    constructionYear: item.construction_year ?? item.built_year ?? 0,
    floorConfirm: item.floor_confirmation ?? "-",
    hasElevator,
    specialRights: item.special_rights ?? "-",
    floors: item.floor_confirmation ?? "-",
  };
}
```

### 세부 필드별 파싱/검증 규칙(오류 방지용)

- 공통 파싱 헬퍼

  - 숫자 파싱: `toNum(v) = isFinite(parseFloat(v)) ? parseFloat(v) : 0`
  - 정수 파싱: `toInt(v) = isFinite(parseInt(v)) ? parseInt(v, 10) : 0`
  - 불리언 파싱(O/X/Y/N/true/false/1/0):
    ```ts
    function toBoolLoose(v: unknown): boolean | null {
      if (typeof v === "boolean") return v;
      if (v === null || v === undefined) return null;
      const s = String(v).trim().toUpperCase();
      if (["O", "Y", "TRUE", "1"].includes(s)) return true;
      if (["X", "N", "FALSE", "0"].includes(s)) return false;
      return null; // 알 수 없음(확인불가)
    }
    ```
  - 날짜 파싱: `toDateTs(v) = (d = new Date(v)).toString() !== 'Invalid Date' ? d.getTime() : undefined`
  - 안전 표시: UI에는 `-`를 기본값으로, 숫자는 0, 불리언은 null → "확인불가" 배지

- 금액/비율

  - `appraised_value`, `minimum_bid_price`, `public_price`: 문자열 가능. 천단위 콤마/공백 제거 후 숫자 파싱.
  - `bid_to_appraised_ratio`: `'80%'`, `'80.0'` 등 혼합. `%` 제거 후 부동소수점 파싱.
  - `calculated_ratio` 미제공 시 (최저가/공시가격). 분모 0/NaN이면 계산하지 않고 0.
  - 표시 규칙: 금액은 `Intl.NumberFormat('ko-KR')`, 비율은 소수 1~2자리 반올림.

- 면적/치수

  - `building_area_pyeong`, `land_area_pyeong`: 숫자 파싱 후 음수면 0으로 보정.
  - 추후 ㎡ 기반 필드 추가 시 평/㎡ 동시 표기(1평≈3.3058㎡)는 UI 레이어에서 변환.

- 날짜/캘린더

  - `sale_date` 우선 사용. 유효하지 않으면 `sale_month(YYYY-MM)`로 대체(말일 임시 1일 적용).
  - 표시는 `YYYY-MM-DD`, D-Day는 선택적(7일 이내만).

- 주소/문자열

  - `road_address ?? address` 우선. 둘 다 공백/빈문자열이면 `-`.
  - `case_number`는 공백 정리(`trim`, 연속 공백 1칸으로 축약) 후 표시.
  - `current_status`, `special_rights`는 원문 유지하되, 내부 필터/로직은 `toLowerCase()`로 비교.

- 엘리베이터/불리언류

  - `elevator_available` 우선. `toBoolLoose` 결과가 null이면 `hasElevator`로 대체.
  - 결과 null → UI에서 `확인불가` 배지로 표기.
  - `under_100million`: `'O'` 포함 여부로 true. `'X'`/누락은 false 처리. 원문이 수치일 경우 `public_price <= 10000`도 보조 판단 가능(옵션).

- 위경도

  - `lat`, `lng`는 숫자 파싱. 0이거나 NaN이면 지도 포커스/링크 비활성 처리.
  - 좌표 존재 시 모달 하단 좌표 표시, 지도 이동/버튼은 후속 단계에서 연결.

- 건축연도/층확인

  - `construction_year ?? built_year` 우선순위. 1800~올해 범위 벗어나면 0.
  - `floor_confirmation` 원문 유지. 빈값은 `-`.

- 특수권리

  - `special_rights` 원문 표시. 내부 필터(불리언/토큰 매칭)는 이미 `useItems`에서 처리 규칙 준수.

- 안전 기본값 정책(요약)
  - 문자열: `'-'`
  - 숫자: `0`
  - 불리언: `null(확인불가)` → UI 배지
  - 날짜: 원문 표시 실패 시 `'-'`
  - 좌표: 하나라도 NaN이면 지도 관련 기능 비활성

## 인터랙션 흐름

### 전체 시퀀스(상세)

1. 프리페치(선택):

   - 사용자가 도로명주소 셀에 마우스를 올리면(`onMouseEnter`) 최근 1.2초 내 프리페치 미실행 시 `itemApi.getItem(id)`를 SWR 키로 미리 요청(옵션).
   - 중복 호출 방지: SWR `dedupingInterval`로 자연 제어.

2. 클릭 → 모달 즉시 오픈:

   - 상태 업데이트: `addressDialogItem = rowItem`, `addressDialogOpen = true`.
   - 상단 요약(usage/case/주소/최저가/상태/매각기일)은 즉시 렌더.
   - 섹션(가격/면적/건물/기타)은 Skeleton 구역으로 초기 표시.

3. 상세 로딩 시작:

   - 훅 `usePropertyDetail(id)`가 활성화되고, SWR 키 `['/api/v1/items/', id, 'detail']`로 fetch.
   - 네트워크 중 모달은 열려 있고, Skeleton 유지.

4. 성공 수신 → 하이드레이션:

   - 응답을 `mapItemToDetail`로 정규화 및 파생 계산.
   - 섹션별로 Skeleton을 실데이터로 교체(가격 → 면적 → 건물 → 기타 순 또는 병렬 렌더).
   - 좌표 존재 시 하단 좌표 박스 활성화(지도 이동 버튼은 차기 단계).

5. 실패 처리(부분 허용):

   - 실패 섹션에 한정하여 에러 블록과 "재시도" 버튼 노출.
   - 상단 요약 및 이미 성공한 섹션은 유지. 재시도 클릭 시 훅 `reload()` 호출.

6. 닫기 및 상태 정리:
   - ESC 또는 닫기 버튼 → 모달 닫힘, 포커스 원위치.
   - 상태: `addressDialogOpen=false`(뷰모델 캐시는 SWR에 남김). 다음 클릭 시 캐시 활용.

### 이벤트/상태 다이어그램

```mermaid
flowchart TD
  A[Hover on address cell] -->|optional prefetch| B[Prefetch getItem(id)]
  C[Click address cell] --> D[Open Dialog]
  D --> E[Render summary from row Item]
  D --> F[usePropertyDetail(id) start]
  F -->|success| G[mapItemToDetail]
  G --> H[Hydrate sections]
  F -->|error| I[Show section error + Retry]
  I -->|retry| F
  H --> J[Dialog active]
  J -->|ESC/Close| K[Dialog closed + focus restore]
```

### 상태/접근성/성능 규칙

- 포커스/키보드: 주소 셀 `role="link"`, Enter/Space로 오픈. 모달 내 초점 이동은 Focus Trap, ESC로 닫기.
- 스크롤: 모달 `h-[80vh] overflow-auto`로 내부 스크롤. 본문 스크롤 잠금은 Dialog 컴포넌트에 위임.
- 중복 클릭: 마지막 클릭 id만 유지(선택적으로 setTimeout 0ms로 배치), SWR가 중복 요청 방지.
- 캐시: 동일 id 재오픈 시 캐시 데이터 즉시 표시, 15초 이후 백그라운드 재검증 가능.
- 지연 로딩: 비교/추가 섹션은 후속 인터랙션 시점에 on-demand 로드(현 범위 외).

### 오류/빈값 UX

- 숫자 NaN/음수 → 0, 문자열 빈값 → '-' 표시.
- 좌표 누락 시 위치 박스 비활성 및 안내.
- API 4xx/5xx → 섹션 에러 카드(간결 메시지 + 재시도).

## 컴포넌트 구조(권장)

### 1) 상위/조립 컴포넌트

- PropertyDetailDialog (신규)

  - 역할: 모달 컨테이너 + 섹션 조립(헤더/가격/면적/건물/시설/기타/푸터)
  - 입력 Props:
    - `open: boolean`
    - `onOpenChange: (v: boolean) => void`
    - `rowItem: Item | null` (즉시표시용 최소 정보)
    - `detailVm?: PropertyDetailData | null` (상세 뷰모델)
    - `isLoading?: boolean`
    - `error?: unknown`
    - `onRetry?: () => void`
  - 책임: 레이아웃/접근성/스크롤/섹션 렌더 순서만 관리(비즈니스 로직 없음)

- usePropertyDetail (신규 훅)
  - 역할: 상세 API 호출 + 매핑 + 상태관리
  - 시그니처: `usePropertyDetail(id?: number): { vm, isLoading, isError, reload }`
  - 내부: SWR + `mapItemToDetail` + 캐시/재검증 정책

### 2) 섹션 단위 프레젠테이션 컴포넌트

- PropertyDetailHeader

  - 표시: 타이틀(usage+사건), 위치/사건번호/매각기일의 요약 메타
  - 입력: `{ vm?: PropertyDetailData, rowItem?: Item }` (vm 우선, 없으면 rowItem)

- PriceHighlightSection

  - 표시: 감정가/최저가/할인율/상태 배지의 하이라이트 그리드
  - 입력: `{ vm?: PropertyDetailData }`
  - Skeleton: 4칸 카드형 스켈레톤

- BasicInfoCard (기본 정보)

  - 표시: 용도/사건번호/도로명주소/소재지/우편번호/PNU
  - 입력: `{ vm?: PropertyDetailData }`

- PriceDetailCard (가격 상세)

  - 표시: 감정가/최저가/최저가/감정가/공시가격/최저가/공시가격/1억 이하 여부 배지
  - 입력: `{ vm?: PropertyDetailData }`

- AreaInfoCard (면적 정보)

  - 표시: 건물평형/토지평형 + 대지면적/건축면적/연면적/건폐율/용적률
  - 입력: `{ vm?: PropertyDetailData }`

- BuildingInfoCard (건물 정보)

  - 표시: 건물명/동명/호수/건축연도/주구조/주용도/기타용도/높이
  - 입력: `{ vm?: PropertyDetailData }`

- FacilityInfoCard (층수 및 시설)

  - 표시: 지상/지하층수/세대수/가구수/승강기/엘리베이터 여부/층확인
  - 입력: `{ vm?: PropertyDetailData }`

- MiscInfoCard (기타 정보)

  - 표시: 사용승인일/특수권리/층수 문자열
  - 입력: `{ vm?: PropertyDetailData }`

- FooterActions
  - 표시: 좌표 박스(위도/경도) + 닫기/상세보기 버튼
  - 입력: `{ vm?: PropertyDetailData, onClose: () => void, onOpenAnalysis?: (id: string) => void }`

각 섹션 컴포넌트는 "데이터 없는 상태"에서도 렌더 가능해야 하며, 내부에서 `'-'`/배지/스켈레톤을 자체 처리한다.

### 3) 상태 소유권/데이터 흐름

- 상위(예: ItemTable or Page): `addressDialogOpen`, `addressDialogItem`
- 훅: `usePropertyDetail(rowItem?.id)` → `{ vm, isLoading, isError, reload }`
- 조립: `PropertyDetailDialog`에 `rowItem`, `vm`, `isLoading`, `isError`, `onRetry=reload` 전달
- 지도에서도 동일 패턴 재사용(선택한 마커 → rowItem 대입 → 동일 다이얼로그 사용)

### 4) 이벤트 계약

- 주소 클릭: `onAddressClick(item)` → 상위가 `rowItem`/`open` 설정
- 닫기: Dialog `onOpenChange(false)` → 상위에서 상태 변경, 포커스 복귀
- 재시도: 실패 섹션의 버튼 → 상위에서 `reload()` 호출 주입
- 상세 보기: `onOpenAnalysis?.(vm.id)` → `/analysis/[id]` 새 탭

### 5) 에러/로딩 패턴

- 로딩: 섹션별 Skeleton. 상단 요약은 즉시표시 영역이므로 항상 렌더
- 실패: 섹션 단위 경고 블록 + 재시도 버튼. 이미 성공한 섹션은 보존
- 부분 데이터: 각 필드는 안전 기본값으로 표시(문자열 `'-'`, 숫자 `0`, 불리언 `확인불가` 배지)

### 6) 파일 구조(제안)

```
Application/
  components/
    features/
      property-detail/
        PropertyDetailDialog.tsx
        sections/
          Header.tsx
          PriceHighlight.tsx
          BasicInfoCard.tsx
          PriceDetailCard.tsx
          AreaInfoCard.tsx
          BuildingInfoCard.tsx
          FacilityInfoCard.tsx
          MiscInfoCard.tsx
        hooks/
          usePropertyDetail.ts
        utils/
          mapItemToDetail.ts
```

### 7) 스타일/접근성 가이드

- 스타일: tailwind 유틸리티, 카드/배지 톤은 기존 페이지와 일관(blue/red/green)
- 모달 크기: `max-w-[90vw] sm:max-w-[1300px] h-[80vh] overflow-auto`
- 접근성: Dialog 컴포넌트의 focus trap/ESC 핸들러 활용, 버튼에는 `aria-label` 보강

### 8) 재사용/확장 전략

- 슬랏/옵션: `showPriceHighlight`, `showFacilityInfo` 등 섹션 가시성 토글
- 지연 로딩: 고비용 섹션은 내부 `useEffect`로 On-Demand 호출(현 범위 외)
- 코드 분할: 섹션 컴포넌트를 동적 import하여 초기 모달 오픈 시간을 단축

## API 연동 정책

### 1) 엔드포인트 및 역할

- 목록(이미 구현): `GET /api/v1/items/custom?fields=...` 또는 `GET /api/v1/items/simple`
  - 목적: 테이블/지도용 경량 필드 제공(페이지네이션/필터/정렬 정책은 현행 유지)
- 상세(신규 사용): `GET /api/v1/items/{id}`
  - 목적: 팝업 섹션을 완성할 추가/정규화 필드 취득(건물명/동명 등은 백엔드 협의 후 확장)
- 비교/분석(후속 단계): 필요 시 탭/아코디언 인터랙션에서 지연 호출(`comparables`, `market-price`, 등)

### 2) 요청 파라미터/헤더 정책

- 목록엔 `fields`로 필요한 컬럼만 요청(네트워크 최적화). 상세는 단건이므로 전체 또는 최소 스키마 합의 후 요청.
- 공통 헤더: `Content-Type: application/json` (토큰 없으면 생략)
- 타임아웃: 기본 10s(`ApiClient.defaultTimeoutMs`), 팝업 상세는 8–12s 내 응답 목표.

### 3) 캐싱/중복 억제(SWR)

- 키: `['/api/v1/items/', id, 'detail']`
- `dedupingInterval: 15_000ms`로 동일 id 중복 호출 억제(호버 프리패치/클릭 연달아 발생 시에도 단일 요청)
- `keepPreviousData: true`로 재오픈 시 즉시 표시, 백그라운드 재검증 옵션(필요 시 `revalidateOnFocus: false`)

### 4) 프리패치(옵션)

- 주소 셀 `onMouseEnter` 시, 최근 1.2초 내 프리패치 미실행이면 `getItem(id)` 트리거
- 서버 부하 방지: 마우스 이동 시 디바운스(예: 200ms), 열린 모달 없으면 1회만 시도

### 5) 오류 처리/재시도

- `ApiError` 표준 사용(message/status/url/method/details)
- 섹션 단위로 에러 표시 + `reload()` 버튼. 전역 토스트는 과다 노출 방지 위해 비활성(필요 시 요약 1회만)
- 타임아웃/네트워크 오류: 사용자 안내 문구(연결 상태 확인) + 재시도 제공

### 6) 데이터 정규화/매핑

- 상세 응답 → `mapItemToDetail`로 정규화(숫자/날짜/불리언/파생값 계산)
- 누락/이형 데이터시 안전 기본값 적용(문자열 `'-'`, 숫자 `0`, 불리언 `null→확인불가`)
- ratio 계산 시 분모 0/NaN 방지 처리 필수

### 7) 성능/부하 관리

- 상세 호출은 모달 오픈 시점에만. 동일 id 연속 재요청 억제(캐시/디듀프)
- 섹션은 독립 렌더 + Skeleton. 고비용 섹션은 후속 인터랙션에서 on-demand 로딩(현 범위 외)
- 네트워크 크기: 목록은 `fields`로 절감, 상세는 필요 컬럼 합의 후 불필요 필드 제거 협의

### 8) 보안/안전

- 프런트 퍼블릭 환경변수만 사용(민감 토큰 미사용). 요청/응답에 PII 포함 금지(주소는 공개 데이터 기준)
- 링크 이동 시 `rel="noopener noreferrer"` 유지(새 탭 동작 시)

### 9) 계약/버전

- 스키마 변경 시 백엔드와 `compat timeline` 합의: 신규 필드 추가 → 프론트 매핑 확장 → 구필드 EOL
- 변경 로그는 `Communication/Backend/` 경로로 PRD/스키마 노트 공유

### 10) 관측/로깅(QA)

- 디버그 로그: 개발 모드에서만 키 로그 유지(요청 키, 응답 샘플 1건)
- QA 체크리스트: 정상/누락/이형/경계값(0/NaN/Invalid Date) 케이스 스냅샷 확인
- 에러 재현 시 `ApiError.details` 첨부하여 이슈 기록

## 포맷/표시 규칙

### 1) 숫자/금액/비율

- 금액(만원): `Intl.NumberFormat('ko-KR').format(value)` 뒤에 `만원` 접미사 표시.
  - 값이 0 또는 NaN → `0만`이 아닌 `0만원` 명확 표기.
  - 정렬/계산용 원시 값은 내부 유지, 표시만 포맷팅.
- 비율(%)
  - `priceRatio` 등 퍼센트 값은 소수 1자리 기본(예: `80.0%`), 필요 시 2자리까지 반올림.
  - 텍스트 원문(`bid_to_appraised_ratio`가 문자열)일 경우 `%` 제거 후 숫자 파싱 → 포맷팅 재적용.
- 자릿수/정렬
  - 숫자열은 우측 정렬, 텍스트는 좌측 정렬.
  - 긴 숫자는 콤마 구분, 지수표기 금지.

### 2) 단위/면적/치수

- 평/㎡ 혼용 시 기본 표시 단위는 데이터의 원 단위(예: 평). ㎡ 동시 표시가 필요하면 `괄호 표기`로 보조 표기.
  - 예: `32.5평 (약 107.4㎡)`; 변환은 1평=3.3058㎡, 소수 1자리 반올림.
- 건폐율/용적률: `%` 접미사, 소수 1자리 반올림.

### 3) 날짜/시간

- `sale_date`가 유효한 날짜이면 `YYYY-MM-DD`로 표시.
- 잘못된 날짜/누락 시 `'-'`.
- 선택적 D-Day 배지: `오늘~+7일` 범위만 `D-00` 배지 표시(강조 색상: danger 계열).

### 4) 주소/문자열

- 도로명주소: `road_address ?? address` 우선 표시.
- 사건번호: 공백/줄바꿈 정리(`trim` + 중복 공백 1칸 축약), 모노스페이스 폰트 사용 권장.
- 긴 문자열은 최대 너비에서 `...` 말줄임(`title` 속성으로 전체값 툴팁 제공).

### 5) 배지/아이콘/색상

- 상태 배지(`currentStatus`): 기존 페이지 톤과 일치(유찰=orange, 신건=blue, 낙찰=green, 재진행=geekblue, 변경=gold 등).
- 1억 이하 여부: true=orange 배지, false=secondary(회색) 배지, 알 수 없음(null)은 `확인불가` 기본 배지.
- 아이콘은 `lucide-react` 일관 사용, 아이콘 크기 16~24px.

### 6) 접근성/키보드

- 링크 역할 셀: `role="link"`, `tabIndex=0`, Enter/Space로 트리거.
- 배지/아이콘 버튼: `aria-label` 제공(예: "상세 보기", "공유", "인쇄").
- 모달: focus trap, ESC로 닫기.

### 7) 스켈레톤/빈 상태/에러 표시

- 스켈레톤: 섹션별 카드 레이아웃 유지하는 가짜 바/블록.
- 빈 값: 문자열 `'-'`, 숫자 `0`, 불리언 `확인불가`.
- 에러 카드: 간결한 요약 문구 + `재시도` 버튼. 섹션 경계 내에만 표시.

### 8) 반응형/레이아웃

- 모달 크기: `max-w-[90vw] sm:max-w-[1300px] h-[80vh] overflow-auto`.
- 그리드:
  - 상단 하이라이트 1x4 (md 이상), 모바일 1x1 스택.
  - 본문 카드 1x3 또는 1x2 그리드(브레이크포인트에 따라).

### 9) 복사/공유/인쇄(옵션)

- 사건번호/주소 등 복사 가능 항목: `copy` 아이콘 제공 시 클립보드 성공 토스트 1회.
- 공유: `navigator.share` 가능 시 네이티브 공유, 불가 시 링크 복사 폴백.
- 인쇄: 인쇄용 CSS 최소화(배경 제거, 테두리 유지).

### 10) 오류/예외값 처리 규칙 요약

- NaN/Infinity/분모 0 → 계산 결과 표시하지 않고 안전 기본값.
- 좌표 누락 → 좌표 표시/지도 이동 버튼 비활성 및 안내.
- 원문 문자열이 의미 없을 정도로 짧거나 공백만인 경우 `'-'` 처리.

## 로딩/에러/접근성

### 1) 로딩 상태 설계(Progressive Hydration)

- 즉시 표시(above-the-fold): 모달 헤더 요약(usage, case, 주소, 최저가, 상태, 매각기일)
- 지연 표시(섹션별 Skeleton): 가격 상세, 면적, 건물, 시설, 기타
- Skeleton 원칙
  - 카드 레이아웃 유지(높이 흔들림 방지)
  - 텍스트 바(회색 2–3줄), 수치 박스(사각 스켈레톤) 혼용
  - 600ms 미만 로딩은 스켈레톤 생략(FOUC 방지) – 필요 시 `minDuration` 옵션

예시(섹션 스켈레톤):

```tsx
function CardSkeleton() {
  return (
    <div className="rounded-lg border p-6">
      <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-5/6 bg-gray-100 rounded" />
        <div className="h-4 w-4/6 bg-gray-100 rounded" />
      </div>
    </div>
  );
}
```

### 2) 에러 처리 정책(Section-level Resilience)

- 에러 분류
  - 네트워크/타임아웃: 재시도 안내 + 버튼
  - 파싱/스키마: 축약 메시지(“데이터 형식 오류”), 로그에 세부 첨부
  - 부분 데이터: 가능한 필드만 표시(나머지는 `-`/배지)
- 표시 위치: 실패한 섹션 카드 내부에만 에러를 표시(다른 섹션 영향 금지)
- 재시도: 섹션 내 버튼 → 상위 `reload()` 호출, 성공 시 에러 카드 자동 교체

예시(에러 카드):

```tsx
function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      데이터를 불러오지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.
      <button className="ml-3 underline" onClick={onRetry}>
        재시도
      </button>
    </div>
  );
}
```

### 3) 접근성(A11y) 가이드

- Dialog
  - role/ARIA: 라이브러리 기본 a11y 준수, 헤더는 `DialogTitle`로 제공
  - 포커스 트랩: 열릴 때 첫 포커스 요소로 이동, 닫힐 때 트리거로 복귀
  - 키보드: ESC 닫기, Tab 순환, Shift+Tab 역순
- 링크 셀(도로명주소)
  - `role="link"`, `tabIndex=0`, Enter/Space로 열기, 포커스 아웃라인 유지
- 색상 대비
  - 배지/문자 대비 비율 WCAG AA(4.5:1) 이상 유지(특히 빨강/주황)
- 동작 선호
  - `prefers-reduced-motion` 존중: 스켈레톤/모달 애니메이션 지속시간 단축 또는 제거

### 4) 스크린리더/알림(ARIA Live)

- 로딩 알림: 섹션 상단에 시각 숨김 텍스트로 상태 알림

```tsx
<span className="sr-only" aria-live="polite">
  가격 섹션 데이터를 불러오는 중…
</span>
```

- 완료/실패 알림은 시각적 카드로 충분. 전역 라이브 리전 남용 금지(중복 안내 방지)

### 5) 스크롤/레이아웃 안정성

- 모달 본문: `h-[80vh] overflow-auto`로 내부 스크롤 고정, 배경 스크롤 잠금(Dialog 기본)
- 이미지/지도(후속 기능): 고정 높이 컨테이너에 `object-cover`로 레이아웃 시프트 방지

### 6) 키보드 단축키(옵션)

- `Alt+D`: 상세 보기(새 탭)
- `Alt+C`: 닫기
- `Alt+R`: 재시도(현재 포커스 섹션 기준)

### 7) 로깅/QA

- 개발 모드에서만 디버그 로그 출력(키, 응답 샘플 1건, 에러 세부)
- QA 체크리스트: 스켈레톤 → 완성 전환, 실패 후 재시도 성공, 포커스 복귀/ESC 닫기 확인

## 단계별 적용 로드맵

### Phase 1 — 기본 모달/즉시표시(완료)

- 목표: 도로명주소 클릭 시 같은 페이지 내 모달 오픈, 상단 요약 즉시 표시, 기본 크기/스크롤 정책 확정
- 구현
  - `ItemTable` 내 Dialog 오픈(현행) + 링크 스타일/키보드 접근(Enter/Space)
  - 모달 크기: `max-w-[90vw] sm:max-w-[1300px] h-[80vh] overflow-auto`
- 산출물/파일
  - `Application/components/features/item-table.tsx`
- DoD
  - 클릭→모달 즉시, 상단 요약 노출, 스크롤/ESC/포커스 복귀 OK, 린트/빌드 통과

### Phase 2 — 상세 훅/스켈레톤/에러(1일)

- 목표: 상세 API(`getItem`) 연동, SWR 기반 훅, 섹션 스켈레톤/에러 카드/재시도 구현
- 구현 작업
  - `usePropertyDetail(id)` 훅 작성(SWR 키/캐시/재시도)
  - 섹션별 스켈레톤 컴포넌트/에러 카드 도입
  - 모달 내부에서 훅 바인딩, `reload` 주입
- 산출물/파일(신규)
  - `Application/components/features/property-detail/hooks/usePropertyDetail.ts`
  - `.../property-detail/sections/*Skeleton.tsx`, `SectionError.tsx`
- DoD
  - 로딩 시 스켈레톤, 성공 시 하이드레이션, 실패 섹션만 에러+재시도, 캐시로 재오픈 빠름

### Phase 3 — 뷰모델/매핑/표시 규칙(1일)

- 목표: `mapItemToDetail`로 숫자/날짜/불리언 정규화 및 파생값 계산, 포맷/표시 규칙 적용
- 구현 작업
  - `mapItemToDetail.ts` 유틸 구현(문서의 매핑/파싱 규칙 준수)
  - 섹션 표시 로직에서 안전 기본값(`'-'`, `0`, `확인불가`) 일관 적용
- 산출물/파일(신규)
  - `Application/components/features/property-detail/utils/mapItemToDetail.ts`
- DoD
  - 이형 데이터/누락/분모 0에도 UI 오류 없이 렌더, 콘솔 에러 0

### Phase 4 — 섹션 컴포넌트화/레이아웃(1일)

- 목표: 헤더/가격/면적/건물/시설/기타/푸터를 독립 컴포넌트로 분리해 가독성/테스트성 향상
- 구현 작업
  - `PropertyDetailDialog.tsx` 조립 + `sections/*` 프레젠테이션 분리
  - 반응형 그리드/스켈레톤 높이 안정화
- 산출물/파일(신규)
  - `Application/components/features/property-detail/PropertyDetailDialog.tsx`
  - `Application/components/features/property-detail/sections/*.tsx`
- DoD
  - 빌드/린트 통과, 교차 브레이크포인트 시 레이아웃 안정, 재사용 가능한 섹션화

### Phase 5 — 프리패치/성능 최적화(0.5일)

- 목표: 주소 셀 호버 프리패치(옵션), dedupe/디바운스로 서버 부하를 제한하며 체감 속도 향상
- 구현 작업
  - `onMouseEnter` 프리패치(200ms 디바운스, 1.2s 내 중복 금지)
  - SWR `dedupingInterval`/`keepPreviousData`/`revalidateOnFocus:false` 조정
- DoD
  - 프리패치 켠 상태에서 재오픈 속도 유의 개선, 호출 중복 없음

### Phase 6 — 지도/목록 재사용 통합(0.5일)

- 목표: 지도 마커 클릭 시 동일 모달 사용(단일 소스), 상위에서 `rowItem`만 교체
- 구현 작업
  - 지도 이벤트→`rowItem` 설정→Dialog 오픈
- DoD
  - 목록/지도 양쪽에서 동일 모달 동작, 상태/포맷/접근성 일관

### Phase 7 — QA/접근성/문서(0.5일)

- 목표: A11y/QA 마무리 및 문서 최신화
- 구현 작업
  - 키보드/스크린리더 점검(포커스 트랩, ESC, ARIA live)
  - MSW 케이스(정상/누락/이형/경계값) 점검, 스냅샷 캡처
  - 본 문서(매핑/정책/흐름/컴포넌트 구조) 업데이트
- DoD
  - 체크리스트 통과, 주요 시나리오 캡처 저장, 회귀 테스트 그린

### Dependencies / Risks

- 백엔드 상세 스키마 미정 필드(건물명/동명 등) → 추후 확장(현재는 `'-'` 표기)
- 좌표 누락 항목은 지도 연계 기능 제한
- 원문 데이터 품질 편차 → 매핑 유틸에서 안전 처리(로그로 수집)

### Rollout / Feature Flag

- `NEXT_PUBLIC_ENABLE_PROPERTY_POPUP=true`(옵션)로 점진 롤아웃 가능
- 초기엔 목록(Analysis)만 적용 → 지도/기타 페이지 순차 확장

## DoD(완료 기준)

- 도로명주소 클릭 시 같은 페이지 모달이 즉시 열리고, 최소 정보가 보인다.
- 상세 API 응답 수신 시 추가 섹션이 깔끔히 채워진다(로딩/에러 상태 노출).
- 매핑 규칙에 따라 필드 표기/계산이 일관적이고, 누락 값은 '-' 또는 안내 배지로 표시된다.
- 키보드/스크린리더 접근성(포커스, 닫기, 스크롤)이 보장된다.

---

### 팝업 UI 재구성 제안 v2 (실행 계획)

목표: 레퍼런스 TSX 수준의 “즉시 이해 가능한” 정보 위계. 스캔 시간 단축, 핵심 수치와 리스크 우선 노출, 일관된 카드 비주얼/아이콘/배지 톤 적용.

1. 레이아웃 우선순위(상→하)

- 헤더(아이콘 메타 + 액션): 주소 제목(대), 사건번호/매각기일/용도 메타, 우측에 공유·인쇄·즐겨찾기
- KPI 스트립(하이라이트 1x4): 최저가(가장 크게), 감정가, 할인율, 상태 배지 + D-Day 보조표시
- 리스크 요약(경고 카드): 특수권리 토큰 하이라이트(위험 키워드 색상/밑줄/아이콘), 핵심 배지(1억 이하/엘리베이터/층확인)
- 가격 영역: 가격 상세(라벨 좌·값 우 정렬) + 가격 비교 바(최저가/감정가 %)
- 면적 영역: 평↔㎡ 동시 표기(괄호), 중요 면적은 카드형 강조 블록
- 건물/시설: 건물명/동/호/건축연도/주구조/주용도 + 지상/지하/세대/가구/승강기 요약 카드
- 기본/기타: 도로명주소/소재지/PNU/우편번호/사용승인일 등 보조 정보
- 푸터: 좌표·지도에서 보기(비활성 안내 포함) + 닫기/상세분석 버튼

2. 시각/타이포 규칙

- 제목 28–32, KPI 28–36(최저가 1등급 강조), 라벨은 text-gray-500, 값은 우측 정렬·굵게
- 카드 배경: from-white to-[tone-50] 그라데이션, 타이틀 아이콘 배경칩(톤 100)
- 배지 컬러: 상태=blue/green/orange 등 문서 규칙 준수, 위험 카드는 red-50/700 대비
- 긴 문자열은 title 툴팁 + 말줄임, 복사 버튼 제공(사건/주소)

3. 인터랙션/접근성

- 모든 액션에 aria-label, 키보드 포커스 가시성 유지
- 공유/인쇄: 네이티브 우선, 폴백은 클립보드/print()
- 복사 성공 시 토스트(개발 모드 console로 대체 가능)

4. 구현 단계(이번 라운드)

- 섹션 재배치: Dialog 내부의 섹션 순서를 위 ‘우선순위’대로 정렬
- RiskSummary 토큰화: `specialRights` 문자열을 키워드 사전으로 분해하여 위험어(근저당, 선순위, 관련사건 등) 강조
- KPI 스트립에 D-Day 보조표시(7일 이내만), 상태 배지 크기 상향
- 카드 시각 일관화: 가격/면적/일정/건물/시설에 아이콘+그라데이션·라벨/값 정렬 적용
- 기본/기타 정보에 복사 버튼과 툴팁(title) 추가(사건·주소)

5. 코드 변경점(요약)

- `PropertyDetailDialog.tsx`: 섹션 순서 재정렬(KPI→Risk→Price/Area→Building/Facility→Basic→Footer)
- sections 추가/수정: `HeaderActions`, `RiskSummaryCard(토큰 강조)`, 기존 카드 시각톤 통일
- utils: 위험어 토큰 하이라이트 헬퍼(간단 사전 + span 랩핑)

6. 수용 기준(UX)

- 첫 스크린(스크롤 없이)에서 최저가/상태/할인율/리스크 요약이 모두 보인다
- 주요 값은 좌·우 정렬 표로 스캔 가능(라벨 ≤12자, 값 굵게/우측)
- 특수권리 문구 내 위험 키워드는 색상/밑줄로 강조된다
- 복사/공유/인쇄·지도 버튼은 1클릭 동작 및 키보드 접근 가능

7. 이후(선택)

- 인쇄용 레이아웃(@media print) 최적화
- 즐겨찾기 상태 저장(localStorage) 및 토스트
- 특수권리 레벨링(낮음/중간/높음) 배지화

실행 시간: 0.5~0.8일 (토큰 하이라이트 포함). 위 계획대로 반영 후 캡처 공유하겠습니다.
