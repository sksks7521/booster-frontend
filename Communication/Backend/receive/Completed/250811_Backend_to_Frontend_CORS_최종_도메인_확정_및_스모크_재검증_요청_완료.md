# [백엔드→프론트엔드] CORS 최종 도메인 확정 및 스모크 재검증 요청 (2025-08-11)

## 1. 요청 개요 (Why?)

- 백엔드 CORS 파서를 콤마 구분 문자열/JSON 배열 모두 지원하도록 보강했습니다(`app/core/config.py`).
- 프론트 실데이터 연동 안정화를 위해 개발/스테이징/운영 도메인의 최종 확정이 필요합니다.
- 동시에 5개 핵심 데이터 엔드포인트에 대한 3회 반복 스모크 재검증을 요청드립니다.

## 2. 작업 요청 사항 (What & How?)

- [ ] 최종 CORS 도메인 목록 확정 및 회신
  - 개발: `http://localhost:3000` (확정 여부)
  - 스테이징: `https://staging.booster.com` (정확 도메인/서브도메인 확정치 제공)
  - 운영: `https://app.booster.com` (정확 도메인 확정치 제공)
  - 기타 필요한 원본(브랜치 프리뷰 등) 있으면 함께 회신 바랍니다.
- [ ] 스모크 재검증(3회 반복, 상태코드만)
  ```bash
  curl -s -o NUL -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/items/simple?limit=1"
  curl -s -o NUL -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/items/?limit=1"
  curl -s -o NUL -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/auction-completed/?limit=1"
  curl -s -o NUL -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/real-transactions/?limit=1"
  curl -s -o NUL -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/real-rents/?limit=1"
  ```
- [ ] 상세/Comparables 스모크 확인
  - `GET /api/v1/items/{id}`
  - `GET /api/v1/items/{id}/comparables`

## 3. 관련 정보 (Reference)

- 백엔드 CORS 파서: `app/core/config.py` (JSON 배열/콤마 문자열 모두 허용)
- `.env` 설정 예시: `README.md`의 환경변수 섹션 참조
- 샘플 아이템 ID(개발 DB 기준 예시): `101, 102, 103, 104, 105`

## 4. 진행 상태

- **Status:** Done
- **Requester:** Backend 팀
- **Assignee:** Frontend 팀
- **Requested At:** 2025-08-11
- **Completed At:** 2025-08-11
- **History:**
  - 2025-08-11: 요청서 작성 (CORS 파서 보강, README 가이드 업데이트 후 재검증 요청)
  - 2025-08-11: 프론트 회신 수신, 로컬 개발 도메인(`http://127.0.0.1:3000`) 반영 완료, 재검증 안내 유지
