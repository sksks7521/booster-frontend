## 실거래가(전월세) v2 계획 (개요)

- 데이터셋: `rent` (registry.ts 구성 완료)
- 재사용: ItemTable/MapView/SearchResults 패턴, useDataset("rent"), useSortableColumns("rent")
- 신규/보완: 전월세 전용 필터(보증금/월세/전환금, 기간) 클라이언트 우선, 지역 키 통일, 좌표 결측 가드
- 컬럼: `columnsRent` 기반 기본표시(보증금/월세/면적/계약일 등) + 확장 컬럼 자동 표출
- QA: price_basis/k 배지 표시, 정렬/페이지/지도 마커 검증
