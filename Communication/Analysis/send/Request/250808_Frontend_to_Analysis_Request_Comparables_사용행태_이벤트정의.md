# [Frontend→Analysis] Comparables 사용행태 이벤트 정의 및 대시보드 요청 (2025-08-08)

## 1. 요청 개요 (Why?)

- 상세페이지에 Comparables 기반 투자분석을 연동 완료했습니다. 사용자 행동 데이터를 수집/분석하여 기능 개선과 전환률 향상을 목표로 합니다.

## 2. 작업 요청 사항 (What & How?)

- [ ] 이벤트 정의 및 수집 스키마 제안
  - 페이지 진입: `view:analysis_detail`
  - 탭 전환: `tab:investment_analysis` (payload: { tab: 'comparable'|'market'|'analysis' })
  - 유사 매물 클릭: `click:comparable_item` (payload: { comparable_id, similarity, distance_km })
  - 리포트 영역 가시성: `view:investment_report` (payload: { section })
- [ ] 대시보드 구성
  - 탭별 이용률, 평균 체류시간, 유사 매물 클릭률, 보고서 가시성 지표

## 3. 관련 정보 (Reference)

- UI 코드: `Application/components/features/investment-analysis.tsx`
- 상세페이지: `Application/app/analysis/[id]/page.tsx`

## 4. 진행 상태

- Status: Requested
- Requester: Frontend 팀
- Assignee: Analysis 팀
- Requested At: 2025-08-08
- Completed At:
- History:
  - 2025-08-08: 요청서 작성
