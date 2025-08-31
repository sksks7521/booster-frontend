# [백엔드→프론트엔드] Dataset API 표준계약 회신 답변 (2025-08-28)

## 1) 답변 개요

- 문서: `250828_Frontend_to_Backend_Dataset_API_표준계약_회신.md` 질의 4건에 대한 백엔드 답변입니다.
- 범위: 4개 데이터셋 공통 UI 계약 및 구현 순서(T0/T1).

## 2) 질의별 답변

1. 전월세 `price` 기준(k)

   - 수용: 옵션 B `deposit_amount + monthly_rent * k` (만원), 기본 k=100.
   - 응답에 다음 키 포함: `price_basis: "deposit_plus_monthly"`, `price_k: 100`.

2. 평→㎡ 환산 위치/반올림 규칙

   - 서버에서 환산 수행, 일관 응답 보장.
   - 상수: `1평 = 3.305785㎡`.
   - 반올림: `area`, `price_per_area`는 소수 1자리 반올림(예: 25.3).

3. 정렬 컬럼 키 네이밍

   - API 파라미터/응답 키는 `snake_case` 유지(`sort_by`, `sort_order`, `final_sale_price` 등).
   - 프론트에서는 어댑터에서 camelCase 변환.

4. bbox 검증 한도
   - 위경도 유효성 검증 수행.
   - bbox 면적 상한: 약 1,500㎢ 제안(서울시 ~605㎢의 2.5배). 초과 시 400과 표준 에러 포맷.
   - radius 상한: 10km 수용.

## 3) 구현 순서(일정)

- T0(즉시): alias/에러포맷/공통 simple 키 PR
- T1(합의 반영): 정렬/지도 필터/k기반 전월세 price/㎡단위/네이버 1차 스펙 PR

## 4) 후속 액션

- 합의대로 T0 작업 브랜치 생성 후 PR 예정. 프론트 스모크 요청.

## 5) 진행 상태

- **Status:** Requested
- **Requester:** 백엔드 담당자
- **Assignee:** 프론트엔드 담당자
- **Requested At:** 2025-08-28
- **Completed At:** 2025-08-30
- **History:**
  - 2025-08-28: 질의 4건 답변 송부, T0/T1 범위 재확인
  - 2025-08-30: 프론트 확인 완료 회신(이견 없음), 문서 상태 Completed로 마감

---

## 완료 로그

- 상태: Completed
- 이동: Communication/Frontend/send/Completed/250828_Backend_to_Frontend_Dataset_API_표준계약_회신_답변.md
- 완료일: 2025-08-30
- 메모: 표준계약 답변 전달 완료, 이슈/재요청 없음.
