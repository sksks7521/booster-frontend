# [Request] Auction_ing 지도 마커/레전드/팝업 사양 공유 요청 (Kakao 전환 대응)

- 요청자: Frontend Team
- 수신: Pipeline Team
- 날짜: 2025-08-23
- 우선순위: High

## 배경

- 프론트는 분석 페이지 `/analysis`에서 지도 렌더링을 Kakao JS SDK로 완료했습니다.
- 파이프라인은 Leaflet 기반으로 Auction_ing 지도 마커/레전드/팝업(툴팁)을 구성해오셨습니다.
- Provider 차이로 구현 방식이 달라, 기존 사양을 공유받아 Kakao 가이드에 맞춰 재구현 예정입니다.

## 요청 사항

1. 마커 사양
   - 상태 분류(진행중/유찰/낙찰/재진행/특수조건 등) 및 색상/아이콘 규칙
   - 클러스터링 기준(줌 레벨별 병합 규칙, 수량 라벨 스타일)
   - 클릭/호버 인터랙션(선택, 강조, 목록 연동)
2. 레전드(범례)
   - 항목 구성(상태/가격대/특수조건 등)과 색상/아이콘 매핑
   - 토글(on/off) 가능 여부 및 초기 표시 정책
3. 팝업/툴팁
   - 표시 필드(필수/옵션), 포맷(통화/면적/날짜)
   - 트리거(클릭/호버), 닫힘 정책, 최대 크기/스크롤 처리
4. 성능/UX 정책
   - 최대 마커 수 처리(1k/5k/10k) 전략(클러스터링/샘플링/가상화)
   - 이동/줌 이벤트 디바운스 기준, 초기 중심/레벨, 상호작용 제한(휠/드래그)
5. 데이터 인터페이스
   - 좌표 체계(WGS84 등), 좌표 필드명(lat/lng), 추가 필드(상태/가격/층/특수조건 등)
   - 서버 JSON 스키마 예시(Leaflet 시절 샘플 가능)
6. 샘플 자료
   - 스크린샷/동영상/GIF 또는 Figma/문서 링크(시연물/사양 표준)

## 프론트 재구현 가이드(참고)

- Kakao JS SDK 기준 마커/커스텀오버레이/클러스터러(`libraries=clusterer`) 활용 예정
- 팝업: `CustomOverlay` + React 렌더 패턴 검토
- 목록-지도 양방향 연동(아이템 선택→지도 센터 이동, 지도 이동→목록 쿼리 갱신 옵션)

## 일정 제안

- D+1: 파이프라인 사양 수신 → 프론트 설계안 공유
- D+3: 마커/레전드 1차 구현(더미 데이터)
- D+5: 실제 데이터 연동 및 상호작용(목록 연계)

## 전달 방법

- 본 요청서에 첨부 또는 `Communication/Pipeline/receive/Request` 경로로 회신 부탁드립니다.

감사합니다.

Frontend Team 드림

### 결과 : C:\Users\USER\OneDrive\사업\부동산부스터\Web*Application\booster-frontend\Communication\Pipeline\receive\Request\250823_Frontend_to_Pipeline_Auction_ing_Map_Spec_Request*답변.md 참고
