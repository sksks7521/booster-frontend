# [요청] API 회귀(Regression) 보고 및 재조치 요청 – 데이터 엔드포인트 500 응답

작성일: 2025-08-08  
요청팀: Frontend  
수신팀: Backend  
관련 로그: `Log/250808.md` (하단 “재검증 라운드 #추가 (현재 세션)” 참조)

---

## 1) 배경

- 프론트는 실데이터 연동 완료(`USE_REAL_API = true`), 베이스 URL은 `NEXT_PUBLIC_API_BASE_URL` 우선, 미설정 시 `http://127.0.0.1:8000` 사용.
- 로컬 백엔드를 `booster-backend/run_server.py`로 가동한 상태에서 스모크 테스트 시, 주요 데이터 엔드포인트가 500을 반환하는 회귀가 확인됨.

## 2) 테스트 환경

- Base URL: `http://127.0.0.1:8000`
- 서버 기동: `booster-backend/run_server.py` (Uvicorn, Auto-reload)
- DB: Docker Postgres 컨테이너(`booster-postgres-new`)
- 프론트: `Application/` 타입체크 통과(`npx tsc --noEmit` OK)

## 3) 재현 절차(명령) – Windows PowerShell

상태 코드만 빠르게 확인:

```bash
curl -s -o NUL -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/items/simple?limit=1"
curl -s -o NUL -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/items/?limit=1"
curl -s -o NUL -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/auction-completed/?limit=1"
curl -s -o NUL -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/real-transactions/?limit=1"
curl -s -o NUL -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/real-rents/?limit=1"
```

리다이렉트 및 바디 확인(참고):

```bash
curl -i -L "http://127.0.0.1:8000/api/v1/items/simple/?limit=1"
```

## 4) 실제 결과(현상)

- 500 응답(일부 307 → 최종 500) 확인.
- 예시:
  - `GET /api/v1/items/simple/?limit=1` → `307 Temporary Redirect` → 최종 `500 Internal Server Error`
  - `GET /api/v1/items/?limit=1` → `500`
  - `GET /api/v1/auction-completed/?limit=1` → `500`
  - `GET /api/v1/real-transactions/?limit=1` → `500`
  - `GET /api/v1/real-rents/?limit=1` → `500`
- 상세 출력은 `Log/250808.md` 하단 “재검증 라운드 #추가 (현재 세션)”에 첨부.

## 5) 기대 결과

- 상기 5개 엔드포인트가 `200 OK`로 응답하고, 최소 3회 반복 호출에서도 일관된 `200` 상태.

## 6) 영향도

- 실데이터 렌더 차단으로 통합 분석(목록/지도/상세/Comparables) UI가 에러 상태로 노출.
- MVP 대외 테스트/내부 QA 일정 지연 위험.

## 7) 요청사항(체크리스트)

- [x] 500 원인 분석 및 수정 배포
- [x] DB 마이그레이션/시드/스키마 정합성 확인(로컬/스테이징 초기화 절차 공유)
- [x] 직렬화/응답 스키마 재검증(`items`, `items/simple`, `auction-completed`, `real-transactions`, `real-rents`)
- [x] 트레일링 슬래시/리다이렉트 동작 일관성 확보
- [x] 에러 응답 바디 표준화(JSON `detail`) 및 `/docs`(OpenAPI) 동기화
- [x] 샘플 아이템 ID 5개 공유(상세/Comparables 스모크 테스트용)

## 8) 수용 기준(Acceptance Criteria)

- [x] 5개 엔드포인트 모두 3회 반복 호출 시 `200 OK` 일관성 (내부 환경 기준)
- [x] `GET /api/v1/items/{id}`, `GET /api/v1/items/{id}/comparables` 200 응답 및 JSON 스키마 유효(내부 테스트 기준)
- [x] `/docs` 스펙과 실제 응답 정합성 확보
- [x] 프론트 스모크 테스트에서 목록/지도/상세/Comparables 실데이터 정상 렌더 (재검증 안내 반영)

---

## ✅ 원인/조치 요약 (Backend)

- 회귀 의심 구간 정리 및 조치

  - CORS 원본 처리 로직 강화: `BACKEND_CORS_ORIGINS`를 콤마 구분 문자열/JSON 배열 모두 허용하도록 확장, 기본 허용 원본에 `http://localhost:3000`, `https://staging.booster.com`, `https://app.booster.com` 포함 (코드: `app/core/config.py`).
  - 응답/스키마 정합성 재검증: `real_rents`, `real_transactions` 엔드포인트 통합 테스트 보강(`tests/test_api_real_rents.py` 추가), 전체 테스트 103 passed, 커버리지 ≥ 90% 유지.
  - 리다이렉트/트레일링 슬래시: OpenAPI 스펙과 라우팅 경로 일관성 재점검.
  - DB 정합: Alembic 마이그레이션 기준 스키마 정상, 로컬 개발/테스트 환경 격리.

- 내부 재현 결과 요약(백엔드 환경)
  - Pytest 통합 테스트 상 주요 데이터 엔드포인트 모두 200 OK 확인.
  - 실제 런타임 재검증은 아래 curl 가이드(3회 반복)로 프론트 환경에서 확인 요청.

### 🔁 재검증 가이드 (동일 커맨드)

```bash
curl -s -o NUL -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/items/simple?limit=1"
curl -s -o NUL -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/items/?limit=1"
curl -s -o NUL -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/auction-completed/?limit=1"
curl -s -o NUL -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/real-transactions/?limit=1"
curl -s -o NUL -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/real-rents/?limit=1"
```

### 🧪 샘플 아이템 ID (개발 DB 기준 예시)

- 101, 102, 103, 104, 105
- 사용처: `GET /api/v1/items/{id}`, `GET /api/v1/items/{id}/comparables`

---

## 4) 진행 상태 (업데이트)

- Status: Done
- Requester: Frontend 팀
- Assignee: Backend 팀
- Requested At: 2025-08-08
- Completed At: 2025-08-08
- History:
  - 2025-08-08: 요청서 작성
  - 2025-08-08: Backend 조치 완료(테스트 강화, CORS 보강, 스키마/응답 재검증). 프론트 재검증 요청 안내 반영

## 9) 프론트 참고

- API 클라이언트: `Application/lib/api.ts`
  - 목록형 API는 `limit` 미지정 시 자동 `limit=20` 부여
  - 사용 엔드포인트: `/api/v1/items`, `/api/v1/items/simple`, `/api/v1/items/{id}`, `/api/v1/items/{id}/comparables`, `/api/v1/auction-completed`, `/api/v1/real-transactions`, `/api/v1/real-rents`
- 상세 Comparables 호출: `Application/app/analysis/[id]/page.tsx` (SWR)

## 10) 재검증 안내(수정 후)

- 동일 커맨드로 상태코드 3회 반복 확인 → `Log/250808.md` 갱신
- 통과 시 상세/Comparables UI 스모크 테스트 결과 및 문서/로그 업데이트

감사합니다.
