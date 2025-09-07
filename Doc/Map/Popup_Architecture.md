## 팝업 아키텍처 개요 (BasePopup + Schema + MapView)

### 목표
- 모든 데이터셋에 동일한 폰트/구성/크기의 팝업을 제공하되, 내용(필드/라벨/정렬)은 데이터셋별로 독립 유지

### 구성 요소
- BasePopup: 공통 HTML/스타일 렌더러
  - 파일: `Application/components/map/popup/BasePopup.ts`
  - 핵심 API: `renderBasePopup(options: BasePopupOptions): HTMLElement`
  - 옵션(`BasePopupOptions`):
    - `title?: string`
    - `subtitle?: string` (긴 텍스트 줄바꿈 지원)
    - `rows: PopupRow[]` (`{ label: string; value: string; ariaLabel?: string }`)
    - `actions?: { label: string; action: string; value?: string }[]`
    - `widthPx?: number` (기본 270)

- Dataset Schema: 데이터셋별 필드 매핑 함수
  - 예시 파일:
    - 경매결과: `Application/components/map/popup/schemas/auction.ts`
    - 분석: `Application/components/map/popup/schemas/analysis.ts`
  - 반환 형태: `{ title, subtitle, rows, actions }`
  - 공통 포맷터 활용 권장: 금액/퍼센트/불리언 등

- MapView 통합: 네임스페이스 기반 조건 분기
  - 파일: `Application/components/features/map-view.tsx`
  - 핵심: `namespace`가 `auction_ed`면 `auctionSchema`, 그 외 기본은 `analysisSchema`를 통해 `renderBasePopup` 호출

### 렌더 흐름
1) 마커 클릭 → `buildPopupHTML(item)`
2) `namespace`로 스키마 선택 → `{ title, subtitle, rows, actions }` 생성
3) `renderBasePopup`로 HTMLElement 생성 → `kakao.maps.CustomOverlay`에 주입

### 모바일 시트
- `AuctionMapView.tsx`는 모바일 시트에서도 동일 스키마를 사용하도록 정렬
- 현재 기본 지도는 `MapView.tsx` 사용, 팝업은 동일 구조 유지

### 텍스트 줄바꿈 정책
- `subtitle`, 테이블 값(`tdValue`)에 다음 스타일을 적용
  - `whiteSpace: normal`
  - `wordBreak: break-word`
  - `overflowWrap: anywhere`
  - `lineHeight: 1.4`
- 특수조건/소재지 등 긴 문구도 넘침 없이 표시

### 액션 버튼
- 스키마에서 `actions`에 정의 (예: 주소 복사, 사건번호 복사)
- `BasePopup`에서 버튼 생성 및 클릭 핸들러 연결 (복사/닫기/상세보기 등)

### 확장 포인트
- 새 데이터셋 추가 시 스키마만 작성하면 즉시 동일 스타일 적용
- 범례/마커색도 스키마화하여 `MapView`에 옵션 주입 구조로 확장 예정


