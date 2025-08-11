# [백엔드→프론트엔드] API Base URL 변경 및 스모크 재검증 요청 (2025-08-11)

## 1. 요청 개요 (Why?)

- 로컬 개발 환경에서 500 회귀의 원인이 컨테이너가 아닌 로컬 서버로의 호출 혼선이었던 것으로 확인되었습니다.
- 현재 컨테이너 API는 `http://127.0.0.1:8000`에서 정상 응답(헬스 200, `GET /api/v1/items?limit=1` 200) 확인 완료.
- 프론트의 로컬 실행 시 API Base URL을 컨테이너로 고정해 동일 문제 재발을 방지하고, 5개 핵심 엔드포인트 스모크를 재확인하고자 합니다.

## 2. 작업 요청 사항 (What & How?)

- [ ] 로컬 개발 환경 Base URL을 아래로 변경(혹은 확인)해 주세요.
  - `NEXT_PUBLIC_API_BASE_URL = http://127.0.0.1:8000`
- [ ] 스모크 재검증(3회 반복, 상태코드 확인)
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/items/simple?limit=1"
  curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/items/?limit=1"
  curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/auction-completed/?limit=1"
  curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/real-transactions/?limit=1"
  curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/real-rents/?limit=1"
  ```
- [ ] 상세/Comparables 스모크 확인
  - `GET /api/v1/items/{id}`
  - `GET /api/v1/items/{id}/comparables`
  - 샘플 ID(개발 DB): `101, 102, 103, 104, 105`

## 3. 참고 정보 (Reference)

- CORS 허용 Origin(로컬): `http://localhost:3000`, `http://127.0.0.1:3000` (백엔드에 반영됨)
- 확인된 컨테이너 상태(백엔드):
  - `GET /health` → 200
  - `GET /api/v1/items?limit=1` → 200 (직렬화/응답 정상)

## 4. 진행 상태

- **Status:** Requested
- **Requester:** Backend 팀
- **Assignee:** Frontend 팀
- **Requested At:** 2025-08-11
- **Completed At:**
- **History:**
  - 2025-08-11: 요청서 작성 (Base URL 컨테이너 고정 및 스모크 재검증 요청)
