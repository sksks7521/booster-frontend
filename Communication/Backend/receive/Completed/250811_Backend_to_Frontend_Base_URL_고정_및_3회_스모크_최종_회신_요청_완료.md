# [백엔드→프론트엔드] Base URL 컨테이너 고정 및 3회 스모크 최종 회신 요청 (2025-08-11)

## 1. 요청 개요 (Why?)

- 컨테이너(8000) 기준 5개 엔드포인트와 상세/Comparables 모두 200 OK 확인되었습니다.
- 베이스 URL 혼선을 방지하고, 최종 완료 처리를 위해 프론트의 3회 반복 스모크 결과를 요청드립니다.

## 2. 작업 요청 사항 (What & How?)

- [x] 로컬 개발 Base URL 고정 확인: `NEXT_PUBLIC_API_BASE_URL = http://127.0.0.1:8000`
- [x] 스모크(3회 반복, 상태코드만)
  - `GET /api/v1/items/simple?limit=1`
  - `GET /api/v1/items/?limit=1`
  - `GET /api/v1/auction-completed/?limit=1`
  - `GET /api/v1/real-transactions/?limit=1`
  - `GET /api/v1/real-rents/?limit=1`
- [x] 상세/Comparables 각 2건(예: 101, 102) 200 확인
- [x] 결과 회신 완료: `Communication/Backend/send/Completed/250813_Frontend_to_Backend_3회_스모크_최종_결과_회신_완료.md`

## 3. 참고

- CORS(로컬) 반영: `http://localhost:3000`, `http://127.0.0.1:3000`
- 샘플 ID: 101, 102, 103, 104, 105

## 4. 진행 상태

- **Status:** Completed
- **Requester:** Backend 팀
- **Assignee:** Frontend 팀
- **Requested At:** 2025-08-11
- **Completed At:** 2025-08-13
- **History:**
  - 2025-08-11: 요청서 작성 (Base URL 고정 및 3회 스모크 최종 회신 요청)
  - 2025-08-13: 프론트 3회 스모크 및 상세/Comparables 결과 회신 완료 → `Communication/Backend/send/Completed/250813_Frontend_to_Backend_3회_스모크_최종_결과_회신_완료.md`
