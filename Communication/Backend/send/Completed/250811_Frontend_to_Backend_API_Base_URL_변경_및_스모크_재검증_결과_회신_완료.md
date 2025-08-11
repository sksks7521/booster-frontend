# [프론트엔드→백엔드] API Base URL 컨테이너 고정 및 스모크 재검증 결과 회신 · 재요청 (2025-08-11)

## 1) 적용 사항

- 로컬 실행 스크립트에 Base URL 고정 반영
  - `Application/package.json`
  - `dev`: `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`
  - `dev:msw`: 동일 값 포함

## 2) 스모크 재검증(1회차) 상태코드

아래 5개 엔드포인트 상태코드 1회차 결과입니다. (3회 반복은 백엔드 Fix 공지 이후 연속 수행 예정)

```
items/simple: 200
items/: 200
auction-completed/: 200
real-transactions/: 200
real-rents/: 200
```

※ 현재 로컬 Next dev 서버 기동은 SWC 바이너리 이슈로 보류 중이며, 컨테이너 직접 호출 기준으로 스크립트 검증 후 결과를 갱신하겠습니다.

## 3) 다음 단계(프론트)

- 상세/Comparables 스모크 진행(샘플 ID: 101~105) 및 통합 QA 병행
- 간헐 실패 발생 시 실패 전문(`curl -i`) 첨부하여 회귀 보고

## 4) 재요청(백엔드 확인 필요)

- A. 최종 확인(완료 처리 기준)
  - 5개 엔드포인트 3회 반복 결과(컨테이너 기준) → 아래에 원문 추가 기입
  - 상세/Comparables 각 2건 이상(예: 101, 102) 200 확인 → 아래에 결과 기입
- B. 스키마/문서 동기화
  - Swagger 스키마와 런타임 응답의 필드/타입 일치 여부 확인(특히 목록 `limit/page`, 상세/Comparables 응답 구조)
- C. 운영 체크리스트
  - CORS Origin(로컬/스테이징/운영) 최종 확정 재확인
  - 샘플 ID(101~105) 유효성 유지 공지
- D. 완료 처리 안내
  - 상기 항목 충족 시 본 이슈를 완료 처리하고, 차기 단계로 프론트 통합 QA/리포팅 진행

---

- Status: Requested
- Requester: Frontend 팀
- Assignee: Backend 팀
- Sent At: 2025-08-11

---

## Backend 회신 요약 (2025-08-11)

- 컨테이너 기준 동일 결과(200) 확인
- 상세/Comparables: `/api/v1/items/101`, `/api/v1/items/101/comparables` 200 확인
- 본 문서의 4) 재요청 항목 확인 후 완료 처리 예정

---

## Backend 3회 반복 스모크 결과 (컨테이너 기준)

### A) 1회차 상태코드

```
items/simple: 200
items/: 200
auction-completed/: 200
real-transactions/: 200
real-rents/: 200
```

### B) 2회차 상태코드

```
items/simple: 200
items/: 200
auction-completed/: 200
real-transactions/: 200
real-rents/: 200
```

### C) 3회차 상태코드

```
items/simple: 200
items/: 200
auction-completed/: 200
real-transactions/: 200
real-rents/: 200
```

### D) 상세/Comparables 추가 확인

```
/api/v1/items/101           → 200
/api/v1/items/102           → 200
/api/v1/items/101/comparables → 200
/api/v1/items/102/comparables → 200
```
