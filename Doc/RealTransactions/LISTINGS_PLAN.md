## 네이버 매물 v2 계획 (개요)

- 데이터셋: `listings` (registry.ts 구성; 개발시 mock 가능)
- 재사용: ItemTable/MapView/SearchResults 패턴, useDataset("listings")
- 신규/보완: 지역/반경 필터 중심(지도 연동), 서버 전환 시 화이트리스트 유지
- 컬럼: `columnsListings` (주소/가격) + 확장 예정
- QA: mock/실서버 전환 토글, 마커 상한 및 빈 상태 가드
