# [프론트엔드→백엔드] 데이터 엔드포인트 500 Internal Server Error 조치 요청 (2025-08-08)

## 1. 요청 개요 (Why?)

- 프론트엔드가 실제 API 전환을 위해 연동 테스트를 진행한 결과, 헬스 체크는 정상(OK)이나 주요 데이터 조회 엔드포인트에서 `500 Internal Server Error`가 발생하고 있습니다.
- Alpha 일정(2025-08-20)을 고려하면, 프론트엔드의 실제 데이터 연동 및 QA가 즉시 필요합니다. 해당 500 오류 조치가 선행되어야 하므로 긴급 요청드립니다.

## 2. 작업 요청 사항 (What & How?)

### A. 재현 방법 및 현재 증상

다음 요청은 모두 로컬 서버(백엔드 측 안내 URL) 대상이며, 호출 시 500 오류가 재현됩니다.

```bash
# 헬스 체크 (정상)
curl -s http://127.0.0.1:8000/health
# => {"status":"healthy","service":"booster-backend", ... }

# 데이터 엔드포인트 (500 발생)
curl -s "http://127.0.0.1:8000/api/v1/items/simple?limit=1"     # 500
curl -s "http://127.0.0.1:8000/api/v1/items/?limit=1"           # 500
curl -s "http://127.0.0.1:8000/api/v1/auction-completed/?limit=1" # 500
curl -s "http://127.0.0.1:8000/api/v1/real-transactions/?limit=1" # 500
curl -s "http://127.0.0.1:8000/api/v1/real-rents/?limit=1"        # 500
```

- 백엔드 실행 상태: Uvicorn 정상 기동, PostgreSQL 컨테이너 `booster-postgres-new` 실행, `/docs` 접근 가능.
- 프론트엔드 연동 상태: `USE_REAL_API = true` 전환 완료, `NEXT_PUBLIC_API_BASE_URL` 사용 준비 완료.

### B. 요청드리는 조치 (원인 분석 체크리스트)

- [ ] 서버 로그에서 위 5개 GET 요청의 스택 트레이스 확인 및 예외 원인 분석
  - 의심 포인트: DB 연결/스키마, Alembic 마이그레이션 상태, 쿼리 파라미터 기본값/검증, 데이터 변환(Integer/Date/Float), 응답 직렬화 스키마
- [ ] `/api/v1/items/simple` 및 `/api/v1/items/`의 `limit` 등 기본 파라미터 유효성/기본값 점검
- [ ] 4개 데이터 소스 엔드포인트(경매완료, 실거래매매, 실거래전월세)의 쿼리/조인/뷰 존재 여부 및 샘플 데이터 조회 확인
- [ ] (필요 시) 개발 환경용 시드/샘플 데이터 주입 후 재검증
- [ ] (선택) 500을 4xx로 다운그레이드 가능한 경우 스키마/유효성 메시지로 반환(디버깅 용이)

### C. 수정/배포 요청

- [ ] 위 엔드포인트들이 최소 파라미터로 호출 시 `200 OK`와 유효한 JSON을 반환하도록 수정
- [ ] Swagger 스키마와 실제 응답 필드 불일치 시 동기화
- [ ] 오류 원인 및 수정 내역을 본 요청서 `History`에 간단 기록

### D. 수용 기준 (Acceptance Criteria)

- [ ] 다음 호출이 모두 `200 OK`로 응답하며 JSON 파싱 가능
  - `GET /api/v1/items/simple?limit=1`
  - `GET /api/v1/items/?limit=1`
  - `GET /api/v1/auction-completed/?limit=1`
  - `GET /api/v1/real-transactions/?limit=1`
  - `GET /api/v1/real-rents/?limit=1`
- [ ] `/docs`의 각 엔드포인트 Try-it-out 실행 시 200 응답 확인
- [ ] (선택) 테스트용 아이템 ID 1개 공유(상세/Comparables 연동 스모크 테스트용)

## 3. 관련 정보 (Reference)

- 백엔드 안내 URL: `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`
- 프론트엔드 변경 사항:
  - `Application/hooks/useItemDetail.ts` → `USE_REAL_API = true`
  - `Application/lib/api.ts` → `NEXT_PUBLIC_API_BASE_URL` 환경변수 우선 사용
- 프론트엔드 헬스 체크 결과: 정상
- 프론트엔드 호출 환경: Windows PowerShell, curl로 재현됨

## 4. 진행 상태

- **Status:** Completed
- **Requester:** Frontend 팀
- **Assignee:** Backend 팀
- **Requested At:** 2025-08-08
- **Completed At:** 2025-08-08
- **History:**
  - 2025-08-08: 프론트엔드, 실제 API 연동 테스트 중 데이터 엔드포인트 500 오류 감지 및 조치 요청
  - 2025-08-08: Backend 원인 분석 및 수정 완료
    - 원인 1: `/api/v1/auction-completed/`에서 CRUD 반환값 `(items, total_count)` 언패킹 누락으로 Pydantic 검증 실패 → 엔드포인트에서 언패킹 적용 후 정상화 (`200 OK`).
    - 원인 2: `/api/v1/real-rents/`가 실거래 매매 CRUD/스키마를 잘못 참조 → 전월세 전용 CRUD/스키마로 교체하고 파라미터/응답 정합화.
    - 검증: 5개 엔드포인트 최소 파라미터 호출 시 모두 `200 OK` 확인.
      - GET `/api/v1/items/simple?limit=1` → 200
      - GET `/api/v1/items/?limit=1` → 200
      - GET `/api/v1/auction-completed/?limit=1` → 200
      - GET `/api/v1/real-transactions/?limit=1` → 200
      - GET `/api/v1/real-rents/?limit=1` → 200
    - Swagger 동기화: OpenAPI 스키마(`AuctionCompletedsResponse`, `RealRentsResponse`)와 실제 응답 구조 일치 확인.

---

## 부록: 재현 로그 스냅샷

- 헬스 체크 응답(요약): `{ "status": "healthy", "service": "booster-backend", ... }`
- 데이터 엔드포인트 공통 응답: `Internal Server Error`

필요 시 추가 로그/스크린샷 제공 가능합니다. 빠른 조치 부탁드립니다. 🙏
