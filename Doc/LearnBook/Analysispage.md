본 문서는 새로운 도메인(DB/리소스)에서도 `analysis` 페이지와 유사한 UX를 빠르게 확장하기 위한 표준 운영서(런북)입니다. 아래 체크리스트를 순서대로 진행하세요.

## 1) 초기 세팅

목표: 새로운 도메인(예: 거래내역, 임대료, 경매완료 등)에 `analysis` 유사 페이지를 빠르게 생성하고 일관된 UX/아키텍처를 유지한다.

- [ ] 라우트/페이지 생성: `Application/app/<domain>/page.tsx`
  - 파일 스켈레톤 예시(요지):

```tsx
"use client";
import { useState } from "react";
import FilterControl from "@/components/features/filter-control";
import ItemTable from "@/components/features/item-table"; // 도메인 전용 테이블 생성 권장
import { use<Domain>Items } from "@/hooks/use<Domain>Items";

export default function <Domain>Page() {
  const { items, isLoading, error, totalCount } = use<Domain>Items();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  return (
    <div className="container mx-auto px-4 py-8">
      <FilterControl /* 도메인 전용 옵션 필요 시 확장 */ />
      <ItemTable
        items={items}
        isLoading={isLoading}
        error={error}
        selectedRowKeys={selectedRowKeys}
        onSelectionChange={setSelectedRowKeys}
      />
      {/* 외부 페이지네이션·정렬 바는 analysis 패턴 재사용 */}
    </div>
  );
}
```

- [ ] 글로벌 스토어 키 확정: `Application/store/filterStore.ts` 확장/분기 또는 신규 스토어 생성

  - 공통 유지: 지역(시도/시군구/읍면동), 페이지(page/size), 정렬(sortBy/sortOrder), 검색(searchField/searchQuery)
  - 도메인별 확장: 도메인 전용 필터 키(예: 전용 범위, 전용 상태, 전용 불리언 플래그)
  - 초기값·리셋 정책: 지역 보존, 상세조건 초기화(`resetDetailFilters`) 일관 유지

- [ ] API 스펙 문서 수집: 필드 목록, 페이징/정렬/필터 파라미터, 응답 포맷

  - 페이징: page/size(필요 시 limit 동시 전송) 지원 여부 확인
  - 정렬: 서버 정렬 가능 컬럼·방식(asc/desc) 확인, 불가 시 클라 정렬 대체
  - 필터: 다중값(IN), any-match, 불리언 플래그 지원 여부 및 파라미터 명 확정
  - 응답: total/totalItems/total_items 등 총계 필드 명 확인, 데이터 컬럼 스키마 명세 확보

- [ ] 타입 정의 확장: `Application/lib/api.ts`에 Item 타입(또는 도메인 타입) 추가
  - 예시(요지):

```ts
export interface <Domain>Item {
  id: string | number;
  road_address?: string;
  // 도메인 핵심 필드들
  // ...
}
```

- 기존 `Item`와 겹치면 공용 필드만 공통 타입으로 추출하고 도메인 전용 필드만 증분(Partial 확장) 권장

- [ ] 폴더·파일 구조 초기 구성

  - 훅: `Application/hooks/use<Domain>Items.ts` (SWR, 서버/클라 필터 분리, requiredFields)
  - 테이블: `Application/components/features/<domain>-table.tsx` (컬럼·리사이즈·정렬·선택)
  - 라우트: `Application/app/<domain>/page.tsx` (탭/헤더/페이지네이션 레이아웃 재사용)

- [ ] 환경 변수/설정 확인

  - API Base URL: `Application/lib/api.ts` 또는 `.env` 기반 설정 확인
  - 한글 파라미터 인코딩/정규화 정책(트림/대소문자) 백엔드 가이드와 일치 검증

- [ ] 초기 구동 검증
  - 지역 미선택 시 데이터 로드 중지(성능 정책) 동작 확인
  - 페이지 전환·페이지 사이즈 변경 시 동작 및 총계 표시 확인
  - 기본 필터/검색 동작 확인(contains, 해제 버튼, 초기화 정책)

## 2) 데이터 연동 (useItems)

목표: SWR + 필터 스토어를 활용하여 안정적인 데이터 로드/정렬/페이징/검색을 구현하고, 미지원 필터는 클라이언트에서 보정한다.

- [ ] 훅 생성: `Application/hooks/use<Domain>Items.ts`

  - 책임: 파라미터 구성, SWR 키, 서버/클라 필터, 정렬, 페이지네이션, 합계 카운트
  - 리턴: `{ items, isLoading, error, totalCount, baseTotalCount, refetch, isRefreshing }`

- [ ] 파라미터 빌더: `buildQueryParamsFromFilters(filters)`

  - 지역코드/이름, page/size(+limit 호환), 가격·면적·연도 범위, 날짜(from/to), 검색(searchField/searchQuery)
  - 서버 호환성: 백엔드 가이드와 불일치 시 양쪽 키 동시 전송(minYearBuilt/maxYearBuilt & minBuildYear/maxBuildYear 등)

- [ ] 필수 필드(requiredFields)

  - 표/필터/검색에 필요한 모든 컬럼을 `fields` 파라미터로 명시(네트워크 비용 축소)
  - 예: `"id,road_address,<도메인전용필드...>"`

- [ ] 클라이언트 처리 조건(needsClientProcessing)

  - 다중/복합 필터(예: 다중 상태, 특수조건, 불리언 플래그), 서버 미지원 범위(예: land_area), 로컬 정렬 필요 등
  - 활성화 시: `page=1, size=1000, limit=1000`로 충분 수량 선로딩 후 클라에서 필터/정렬/슬라이싱

- [ ] SWR 키 구성

  - 지역 미선택 시 `null` 반환으로 요청 중단
  - `fields`와 모든 파라미터 포함. 클라 처리 모드에서는 강제 `{ page:1, size:1000, limit:1000 }`

- [ ] 서버/클라 정렬

  - 서버 정렬이 신뢰되지 않거나 제한적이면 `clientSideSort`로 보정
  - 정렬값 추출 `getSortValue`는 날짜/숫자/문자 각각 안전 변환

- [ ] 클라 필터(예시 패턴)

  - 범위: `land_area`·`auctionDate` 등 서버 미지원/불일치 항목
  - 상태: `currentStatus` "all"은 우회, 일부 라벨은 부분일치 허용(예: "유찰"→"유찰(2회)")
  - 특수조건 불리언: 명시적 true OR `special_rights` 문자열 any-match 보정
  - 멀티 옵션: `buildingType`, `floorConfirmation`, `hasElevator`(O/Y=있음, X/N=없음, 그 외=확인불가 포함)
  - 검색: `case_number`/`road_address` contains + 해제 버튼

- [ ] 누락/NaN 처리 정책

  - 표시: ‘확인불가’ 태그 일관 표기
  - 필터: 정책에 따라 포함(기본) 또는 제외(명시 필요) — 도메인별 결정

- [ ] 페이지네이션

  - 서버 모드: `page/size` 그대로 사용
  - 클라 모드: 필터/정렬 이후 `slice(startIndex,endIndex)` 적용, `totalCount`는 필터 후 개수로 재계산

- [ ] 테스트 체크리스트
  - 지역 미선택 시 요청 중단
  - page/size 바꿔도 예상 범위만 노출(세로 스크롤 미사용)
  - 다중 필터 조합/정렬/검색 동시 작동
  - 누락/확인불가 값이 표기/포함 정책대로 동작

예시 스켈레톤:

```ts
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useFilterStore } from "@/store/filterStore";

export function use<Domain>Items() {
  const filters = useFilterStore();
  const hasLocation = Boolean(filters.province && filters.cityDistrict);

  const params = buildQueryParamsFromFilters(filters);
  const needsClientProcessing = shouldClientProcess(filters);

  const fields = "id,road_address,/* 도메인 필수 필드 */";
  const swrKey = hasLocation
    ? needsClientProcessing
      ? ["/api/v1/<domain>/custom", { ...params, page: 1, size: 1000, limit: 1000, fields }]
      : ["/api/v1/<domain>/custom", { ...params, fields }]
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR(swrKey, fetcher);

  // 응답 정규화
  let items = (data as any)?.items ?? (data as any) ?? [];
  let originalTotal = (data as any)?.total_items ?? (data as any)?.total ?? items.length;

  // 클라 필터(도메인 별 필요 항목 적용)
  items = applyClientFilters(items, filters);

  // 정렬 보정
  items = applyClientSortIfNeeded(items, filters);

  // 페이지네이션/카운트
  let totalCount = originalTotal;
  if (needsClientProcessing) {
    totalCount = items.length;
    const page = filters.page ?? 1;
    const size = filters.size ?? 20;
    const start = (page - 1) * size;
    items = items.slice(start, start + size);
  }

  return {
    items,
    isLoading,
    error,
    totalCount,
    baseTotalCount: originalTotal,
    refetch: () => void mutate(),
    isRefreshing: isValidating,
  };
}
```

## 3) 필터 UI (FilterControl)

목표: 일관된 UX로 지역 선택 → 상세 조건 → 검색의 흐름을 제공하며, 다중 선택과 “전체” 초기화, 확인불가 값 처리, 접기/펼치기 UX를 포함한다.

- [ ] 지역 선택(시도/시군구/읍면동)

  - 시도/시군구 미선택 시에도 UI는 항상 노출, 단 데이터 로드는 중단(성능 정책)
  - 선택 래퍼/트리거의 시각 강조(미선택 시 파란 강조표시 등)로 가이드 제공

- [ ] 상세 필터 영역 설계

  - 입력 유형: 버튼(Multi-select), 슬라이더/Range, 인풋, 토글
  - Multi-select + “전체” 규칙
    - “전체” 클릭 시 다른 선택 모두 해제하고 ‘all’ 상태로 복귀
    - “전체”가 아닌 버튼 선택 시 ‘all’ 해제, 다중 값 누적
  - 확인불가/누락 값 포함 정책
    - 기본: 필터 적용 시에도 확인불가 데이터는 배제하지 않음(특히 엘리베이터, 층확인 등)
    - 테이블 표기: ‘확인불가’ 태그로 명시

- [ ] 검색(케이스/주소)

  - `searchField`(case_number|road_address|all) + `searchQuery`
  - contains 검색, “검색 해제” 버튼 제공, 검색 시 페이지 1로 이동

- [ ] 초기화 정책

  - “설정 초기화”: 지역은 보존, 상세 조건만 초기화(`resetDetailFilters`)
  - 선택된 필터 바(SelectedFilterBar)에 현재 조건 뱃지 표기 및 X 클릭 시 개별 해제

- [ ] 도메인 특화 섹션

  - 현재상태(currentStatus): ‘전체’ 기본 선택, 일부 라벨 부분일치 허용(예: “유찰” → “유찰(횟수)”)
  - 특수조건(specialConditions / specialBooleanFlags):
    - 불리언 플래그는 true AND 매칭(+ 보완: `special_rights` 문자열 any-match)
    - 문자열 any-match(콤마 구분) 지원 시 서버 전환 고려

- [ ] 접기/펼치기 UX

  - 상세 조건 패널을 접으면 결과 패널 폭 확장, 펼치면 원복
  - 버튼은 상단 선택된 필터 바 우측 정렬, 색상 대비/이모지로 가시성 확보

- [ ] 접근성/반응형
  - 키보드 포커스 링/aria 속성 제공, 모바일 폭에서 1열 · 데스크톱 2~3열 카드 그리드

예시 스니펫(핵심 로직 요지):

```tsx
const filters = useFilterStore();

// Multi-select with “전체”
const toggleMulti = (key: keyof typeof filters, value: string) => {
  const current = filters[key] as string | string[] | undefined;
  if (value === "all") {
    filters.setFilter(key as any, "all");
    return;
  }
  const list = Array.isArray(current)
    ? [...current]
    : current && current !== "all"
    ? [current]
    : [];
  const idx = list.indexOf(value);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(value);
  filters.setFilter(key as any, list);
};

// 검색 실행
const handleAddressSearch = (q: string) => {
  filters.setFilter("searchField", "road_address");
  filters.setFilter("searchQuery", q.trim());
  filters.setPage(1);
};

// 상세 초기화(지역 보존)
const resetDetailFilters = () => {
  const keep = {
    province: filters.province,
    cityDistrict: filters.cityDistrict,
  };
  filters.resetFilters();
  filters.setFilter("province", keep.province);
  filters.setFilter("cityDistrict", keep.cityDistrict);
};

// 확인불가 표기(예: 엘리베이터)
const renderElevator = (raw?: string | boolean) => {
  const v = typeof raw === "string" ? raw : raw ? "Y" : undefined;
  if (v === "O" || v === "Y") return "있음";
  if (v === "X" || v === "N") return "없음";
  return "확인불가";
};
```

## 4) 표 컴포넌트 (ItemTable)

목표: 가독성과 조작성을 높인 표를 제공. 컬럼 리사이즈/정렬/드래그 순서/다중 선택/확인불가 표기를 일관 지원한다.

- [ ] 컬럼 정의

  - 라벨/키/정렬 가능 여부/렌더러/초기·최소 너비 지정
  - 라벨 표준화(예: ‘건축년도’, ‘엘리베이터’, ‘공시지가 기준(1억)’)
  - 최소 너비는 드래그 핸들/라벨 길이를 고려(예: 110~160px)

- [ ] 컬럼 리사이즈/순서변경

  - `@dnd-kit`의 `useSortable` 기반 커스텀 헤더(`DraggableHeader`)
  - 리사이즈는 `deltaX` 기반(절대값 X)으로 부드럽게, 드래그 직후 클릭 억제

- [ ] 정렬 UX

  - 헤더 클릭 3단계: 오름→내림→해제
  - 정렬 활성 컬럼은 파란색/굵게 강조, 방향 아이콘 표시(▲/▼)

- [ ] 선택 기능

  - 체크박스 컬럼 좌측 고정
  - 마우스 드래그로 범위 선택/해제(시작 행 상태를 기준으로 add/remove 토글)

- [ ] 스크롤/표시 정책

  - 세로 스크롤 제거, 페이지 사이즈 만큼만 렌더링(가로 스크롤만 유지)
  - 통합/지도 탭 UX에 따라 하단 컨트롤 표시 여부 분기

- [ ] 누락 값 렌더링
  - 엘리베이터: O/Y=있음, X/N=없음, 그 외=‘확인불가’
  - 숫자/날짜 계산 불가 시 ‘-’ 또는 ‘확인불가’ 명시

예시(핵심 요지):

```tsx
const columns = [
  {
    id: "road_address",
    title: <DraggableHeader id="road_address">도로명주소{getSortIcon("road_address")}</DraggableHeader>,
    dataIndex: "road_address",
    key: "road_address",
    width: getWidth?("road_address") ?? 320,
    onHeaderCell: () => ({ onClick: () => safeHeaderClick("road_address") }),
  },
  // ...
];

// 드래그 다중 선택
const [isSelecting, setIsSelecting] = useState(false);
const [selectionIntent, setSelectionIntent] = useState<"add"|"remove"|null>(null);
const [anchorIndex, setAnchorIndex] = useState<number|null>(null);
// onRow: onMouseDown에서 시작, onMouseEnter에서 구간 갱신, mouseup에서 종료
```

## 5) 레이아웃/탭/지도

목표: 좌측 결과 패널, 우측 필터 패널 구조를 유지하면서, 탭(목록/지도/통합)에 따라 표시 영역을 유연하게 전환한다.

- [ ] 좌우 레이아웃

  - 컨테이너: `flex flex-col lg:flex-row items-start gap-8`
  - 좌측 결과: `flex-1 min-w-0 w-full`
  - 우측 필터: `w-full lg:w-[384px] max-w-[384px]`(접힘 시 `w-0 max-w-0 overflow-hidden`)

- [ ] 필터 접기/펼치기

  - 상태: `detailsCollapsed: boolean`
  - 접을 때 결과 패널 가로폭 확장, 펼치면 원복
  - 토글 버튼: 선택된 필터 바 우측에 배치, 색 대비 확보(예: 파랑/호박색 + 이모지)

- [ ] 탭 구성(목록/지도/통합)

  - 상태: `activeView: "table" | "map" | "both"`
  - 지도 전용 뷰에서는 하단 컨트롤(페이지/사이즈 등) 숨김 처리

- [ ] 헤더 정보 규칙
  - `시군구 | 전체 N건 · 필터 M건 · 선택 K건` 형식
  - 지역 미선택 시: `검색 결과 X건` 형식으로 대체

예시 스니펫(핵심 요지):

```tsx
const [activeView, setActiveView] = useState<"table" | "map" | "both">("table");
const [detailsCollapsed, setDetailsCollapsed] = useState(false);

<CardHeader className="pb-3">
  <div className="flex items-center justify-between">
    <div className="font-semibold text-lg">
      {filters.cityDistrict ? (
        <>
          {filters.cityDistrict}
          <span className="text-gray-400 mx-2">|</span>
          <span>전체 {baseTotalCount?.toLocaleString()}건</span>
          <span className="text-gray-400 mx-2">·</span>
          <span>필터 {totalCount?.toLocaleString()}건</span>
          <span className="text-gray-400 mx-2">·</span>
          <span>선택 {selectedRowKeys.length}건</span>
        </>
      ) : (
        <span>검색 결과 {totalCount?.toString()}건</span>
      )}
    </div>
    <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
      <TabsList>
        <TabsTrigger value="table">목록</TabsTrigger>
        <TabsTrigger value="map">지도</TabsTrigger>
        <TabsTrigger value="both">통합</TabsTrigger>
      </TabsList>
    </Tabs>
  </div>
</CardHeader>

<CardContent>
  {activeView === "table" && <ItemTable /* ... */ />}
  {activeView === "map" && <MapView /* ... */ />}
  {activeView === "both" && (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">지도</h3>
        <MapView /* ... */ />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">목록</h3>
        <ItemTable /* ... */ />
      </div>
    </div>
  )}

  {/* 하단 컨트롤: 지도 단독 뷰에서는 숨김 */}
  {activeView !== "map" && (
    <div className="mt-6 space-y-4">{/* 페이지 사이즈/페이지네이션 */}</div>
  )}
</CardContent>
```

## 6) 페이징/정렬/검색 정책

목표: 서버(page/size) 우선 정책을 유지하되, 서버 미지원 조건에서는 클라이언트 처리 모드로 전환한다.

- [ ] 페이징(page/size)

  - 서버 일관 규칙: `page(1-based)`, `size`
  - 백엔드 호환 필요 시 `limit` 동시 전송(레거시 대응)
  - 사이즈 변경 시 `page=1`로 초기화
  - 테이블 내부 페이지네이션 비활성(`pagination={false}`) + 상단/하단 외부 컨트롤 사용

- [ ] 정렬

  - 서버 정렬 파라미터(`sortBy`, `sortOrder`) 제공
  - 신뢰 불가/제한적이면 클라 보정(`clientSideSort`) 적용
  - 헤더 클릭 3단계(asc/desc/none) 구현 및 시각 강조

- [ ] 검색

  - `searchField`(case_number|road_address|all) + `searchQuery`
  - contains 검색, 실행 시 `setPage(1)`
  - 검색 해제 버튼 제공(쿼리/필드 초기화)

- [ ] 클라이언트 처리 모드 전환 조건

  - 서버 미지원 필터 활성: 예) 다중 상태(IN 미지원), 특수조건 any-match 미지원, 토지면적 범위 미지원
  - 로컬 정렬 필요, 또는 복합 필터 동시 활성
  - 전환 시: `page=1, size=1000, limit=1000`으로 선로딩 후 클라 필터/정렬/슬라이싱

- [ ] 표시 규칙
  - `전체 N건 중 A-B건 표시` 문구(페이지·사이즈 기준)
  - `전체/필터/선택` 카운트 헤더 병행 노출

예시(하단 컨트롤 핵심):

```tsx
// 페이지당 개수
<Select value={size.toString()} onValueChange={(v) => { setSize(+v); setPage(1); }}>
  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="20">20</SelectItem>
    <SelectItem value="50">50</SelectItem>
    <SelectItem value="100">100</SelectItem>
  </SelectContent>
</Select>

// 페이지 정보
<div className="text-sm text-gray-600">
  전체 {totalCount?.toLocaleString()}건 중 {Math.min(size*(page-1)+1, totalCount||0)}-
  {Math.min(size*page, totalCount||0)}건 표시
</div>
```

## 7) 명명/라벨 표준

목표: 도메인/페이지(표/필터/헤더) 전반에서 일관된 명명과 라벨, 색상, 수치 표기 규칙을 준수한다.

- [ ] 라벨 한국어 표준화

  - 연도: ‘건축년도’(‘건축연도’ 금지) / 상태: ‘현재상태’ / 엘리베이터: ‘엘리베이터’
  - 공시지가 기준: ‘공시지가 기준(1억)’(괄호 포함) / 층수: ‘층수 확인’
  - 비율: ‘최저가/감정가(%)’, ‘최저가/공시지가’

- [ ] 데이터 표기 규칙

  - 날짜: YYYY년 M월 D일, 7일 이내 D-N Tag(연한 빨강)
  - 금액/수치: 천단위 구분(1,234), 단위는 컬럼 라벨에 명시(pyeong, 만원 등)
  - 비율: 소수점 2자리 고정(0.85 → 0.85)
  - 불리언/3값: 있음/없음/확인불가 (엘리베이터 등)

- [ ] 색상/강조

  - 정렬 활성 컬럼: 파랑(#2563eb) + 볼드
  - 상태 Tag 색: 유찰=orange, 신건=blue, 낙찰=green, 재진행=geekblue, 변경=gold, 재매각=purple, 취하=red

- [ ] 버튼/뱃지 용어

  - 초기화: ‘설정 초기화’(지역 보존)
  - 접기/펼치기: ‘필터 접어두기/필터 펼치기’(이모지/색상 대비로 가시성↑)

- [ ] 키/파라미터 네이밍
  - 프론트 상태: camelCase(`saleDateFrom`) / 서버: 가이드에 맞춤, 불일치 시 양쪽 동시 전송
  - 필드 키: 응답 스키마 준수. 필요 시 `requiredFields`로 명시

## 8) 품질 점검

목표: 배포 전 일관된 검증 루틴으로 기능/성능/접근성/회귀를 방지한다.

- [ ] 정적 점검

  - 린터/타입 오류 0 (수정 파일 기준)
  - 불필요 콘솔 제거(필요 Debug는 조건부)

- [ ] 기능 점검

  - 지역 미선택 → 요청 중단, 선택 후 로드
  - 다중 필터/정렬/검색 동시 동작, 페이지 사이즈/페이지 전환
  - 지도 탭에서 하단 컨트롤 숨김, 통합 탭에서 지도+목록 동시 표시

- [ ] 성능/UX

  - 클라이언트 처리 모드(1000건)에서 스크롤/정렬 지연 없는지 확인
  - 컬럼 리사이즈 드래그 안정성, 정렬 오작동 억제

- [ ] 접근성/반응형

  - 키보드 포커스, aria-label/role, 해상도별 레이아웃 붕괴 여부 확인

- [ ] 네트워크/오류
  - 4xx/5xx 응답 시 사용자 메시지, 재시도 버튼 동작
  - SWR 캐시 키 파라미터 누락 여부 점검

## 9) 배포/로그/운영

목표: 변경 이력을 명확히 남기고, 릴리즈 과정/운영 지표 관리를 표준화한다.

- [ ] 일일 로그: `Log/YYMMDD.md` 작성(핵심 변경/테스트/추가 과제)
- [ ] 커밋: `feat|fix|chore|docs(scope): summary` 규칙
- [ ] PR 체크리스트: 본 런북 섹션 1~8 핵심 항목 요약 체크
- [ ] 릴리즈 노트: 변경점/UX 영향/마이그레이션/플래그/롤백 가이드
- [ ] 모니터링: 에러 콘솔, 네트워크 실패율, 로드 시간(초기/필터/정렬) 추적
- [ ] 롤백: 문제 발생 시 이전 태그로 즉시 복귀 절차 명시

## 10) 서버 연동 확장 전환 가이드

목표: 백엔드가 다중값/any-match/불리언 필터를 지원하면 클라이언트 처리 모드를 단계적으로 축소한다.

- [ ] 준비

  - 서버 기능: `auctionStatus=신건,유찰`(CSV IN), `special_rights=별도등기,유치권`(any-match), 불리언 파라미터 노출
  - 메타: `GET /items/statuses`(distinct) 제공 시 프론트 옵션과 동기화

- [ ] 전환 단계

  1. useItems에서 해당 필터를 서버 파라미터로 활성화(클라 필터 비활성)
  2. `needsClientProcessing` 조건 축소 → page/size 서버 모드 복귀
  3. 결과 검증(샘플 쿼리 동치성, 총계/페이지/정렬 일치)

- [ ] 검증/릴리즈
  - 테스트 매트릭스: 단일/다중 상태, 불리언 조합, any-match 다중 토큰, 정렬/검색 동시
  - 점진 배포/롤백 포인트 설정(플래그로 토글 가능하게)

예시(서버 전환 파라미터):

```ts
// before (client)
// filters.currentStatus = ["신건","유찰"] → 클라 필터

// after (server)
params.auctionStatus = ["신건", "유찰"].join(",");
// special_rights any-match
params.special_rights = ["별도등기", "유치권"].join(",");
// boolean flags
params.separate_registration = true;
params.lien = true;
```
