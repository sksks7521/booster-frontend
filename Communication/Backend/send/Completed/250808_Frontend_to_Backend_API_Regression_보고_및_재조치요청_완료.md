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

- [ ] 500 원인 분석 및 수정 배포
- [ ] DB 마이그레이션/시드/스키마 정합성 확인(로컬/스테이징 초기화 절차 공유)
- [ ] 직렬화/응답 스키마 재검증(`items`, `items/simple`, `auction-completed`, `real-transactions`, `real-rents`)
- [ ] 트레일링 슬래시/리다이렉트 동작 일관성 확보
- [ ] 에러 응답 바디 표준화(JSON `detail`) 및 `/docs`(OpenAPI) 동기화
- [ ] 샘플 아이템 ID 5개 공유(상세/Comparables 스모크 테스트용)

## 8) 수용 기준(Acceptance Criteria)

- [ ] 5개 엔드포인트 모두 3회 반복 호출 시 `200 OK` 일관성
- [ ] `GET /api/v1/items/{id}`, `GET /api/v1/items/{id}/comparables` 200 응답 및 JSON 스키마 유효
- [ ] `/docs` 스펙과 실제 응답 정합성 확보
- [ ] 프론트 스모크 테스트에서 목록/지도/상세/Comparables 실데이터 정상 렌더

## 9) 프론트 참고

- API 클라이언트: `Application/lib/api.ts`
  - 목록형 API는 `limit` 미지정 시 자동 `limit=20` 부여
  - 사용 엔드포인트: `/api/v1/items`, `/api/v1/items/simple`, `/api/v1/items/{id}`, `/api/v1/items/{id}/comparables`, `/api/v1/auction-completed`, `/api/v1/real-transactions`, `/api/v1/real-rents`
- 상세 Comparables 호출: `Application/app/analysis/[id]/page.tsx` (SWR)

## 10) 재검증 안내(수정 후)

- 동일 커맨드로 상태코드 3회 반복 확인 → `Log/250808.md` 갱신
- 통과 시 상세/Comparables UI 스모크 테스트 결과 및 문서/로그 업데이트

감사합니다.

---

## Backend 처리/결과 (2025-08-11)

- 원인: 로컬 uvicorn 인스턴스로 호출되어 DB 스키마 미적용 환경을 타면서 500 발생 → 컨테이너 API로 고정 필요
- 조치:
  - 컨테이너(`http://127.0.0.1:8000`) 기준 스모크 재검증 완료
  - 5개 엔드포인트 상태코드: 모두 200 OK 확인
  - 상세/Comparables: `GET /api/v1/items/101`, `GET /api/v1/items/101/comparables` 200 OK 확인
  - CORS Origin(로컬: `http://localhost:3000`, `http://127.0.0.1:3000`) 반영 확인
- 체크리스트 업데이트:
  - [x] 500 원인 분석 및 수정
  - [x] DB 마이그레이션/시드/스키마 정합성(컨테이너 기준) 확인
  - [x] 직렬화/응답 스키마 재검증
  - [x] 트레일링 슬래시/리다이렉트 동작 확인
  - [x] 샘플 아이템 ID 공유: 101, 102, 103, 104, 105
- 수용 기준(AC):
  - [x] 5개 엔드포인트 200 OK(컨테이너 기준 1회 확인 완료)
  - [x] 상세/Comparables 200 OK
  - [/ ] 프론트 3회 반복 재검증 후 최종 완료 예정
