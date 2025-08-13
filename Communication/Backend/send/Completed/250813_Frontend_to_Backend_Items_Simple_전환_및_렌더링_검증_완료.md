# [Frontend→Backend] Items Simple 전환 및 렌더링 검증 완료 (2025-08-13)

## 개요

- 수신 요청: `[Backend → Frontend] /analysis 목록 렌더링 안정화를 위한 Items API 전환 및 검증 요청`
- 목적: `/analysis` 목록 데이터 소스를 `GET /api/v1/items/simple`로 전환하고, 렌더링 안정성 검증

## 적용 내용

- 훅/페치어 표준화: `Application/app/providers.tsx`에 글로벌 `SWRConfig.fetcher` 등록, `Application/lib/fetcher.ts`에서 배열 키 대응 및 Error throw 표준화
- 목록 API 전환: `Application/hooks/useItems.ts`에서 `['/api/v1/items/simple', params]` 패턴으로 전환 및 파라미터 매핑 정리
- 테이블 렌더링: `property_type|buildingType`, `built_year|buildYear` 키 호환 처리(`Application/components/features/item-table.tsx`)

## 검증 결과(로컬)

- Network Request URL(예):
  - `http://127.0.0.1:8001/api/v1/items/simple?limit=20&page=1&province=경기도&max_price=500000&max_area=200&min_built_year=1980&max_built_year=2024`
- Status: `200 OK`
- 화면: `/analysis` 목록 정상 렌더링(표 채워짐), 총 건수 표시

## 향후 계획

- 필터 전 범위(주소 3단/일자/월/1억 이하 포함) 동작 점검 마무리 후 추가 스크린샷 공유
- 지도 탭(Kakao 임시) 도메인 허용 재검증 후 캡처 공유

감사합니다.
