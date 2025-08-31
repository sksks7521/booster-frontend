# [완료 회신] 매각일자(sale_date) 정확한 데이터 제공 (Backend → Frontend) (2025-08-21)

## 결론

- `sale_date`가 정확한 ISO 날짜로 제공 중입니다(예: `2025-08-22`).
- 프론트는 즉시 연동 가능하며, 월 단위 표기에서 일 단위 표기로 확장 가능합니다.

## 적용 방법

- `GET /api/v1/auction-completed/simple|full|custom` 응답에 `sale_date` 포함
- 표시 예: "YYYY년 M월 D일" 또는 D-Day 계산

## 참고

- 상세 답변/가이드: 수신 문서 내 하단(백엔드 답변 섹션) 참조
- 관련 문서: `Doc/FRONTEND_INTEGRATION_GUIDE_v2.0.md`

— Backend Team, 2025-08-21
