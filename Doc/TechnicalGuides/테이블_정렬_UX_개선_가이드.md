# 테이블 정렬 UX 개선 가이드

## 개요

정렬 클릭 시 즉시 피드백(아이콘/색상) 제공, 진행 중 재클릭 억제, 수평 스크롤 보존, 전역 정렬(전체 집합)과 서버/클라 파이프라인 혼용 시 중복 key/데이터 유실 방지를 목표로 개선했다.

## 핵심 변경

- ItemTable
  - isSorting prop 도입: 정렬 중 헤더에 ⏳ 표시, 중복 클릭 방지
  - rowKeyProp 도입: 데이터셋별 안전한 고유 키 지정 가능
  - 스크롤 보존 강화: 정렬/열변경/데이터 갱신 후 여러 프레임에 걸쳐 복원
- AuctionEdSearchResults
  - 정렬 로딩 기반 isSorting 상태 연동 → ItemTable 전달
  - rowKeyProp에 `case_number → id → doc_id → uuid` 폴백 적용
- useGlobalDataset
  - 페이지 병합 후 표준화 → Set으로 중복 제거

## 사용 방법

- 진행중 표시/재클릭 억제:
  - 상위에서 isSorting 상태를 관리해 `<ItemTable isSorting={isSorting} ... />`로 전달
- 안전 키 지정:
  - `<ItemTable rowKeyProp={(row)=> String(row.case_number ?? row.id ?? row.doc_id ?? row.uuid)}/>`

## 주의 사항

- 정렬 중에는 헤더 클릭이 무시된다. 완료 후 다시 가능
- 외부 오버레이 로딩은 기존 데이터가 있을 때 가리지 않도록 조건 처리 권장

## 관련 파일

- Application/components/features/item-table.tsx
- Application/components/features/auction-ed/AuctionEdSearchResults.tsx
- Application/hooks/useGlobalDataset.ts
