# [백엔드→프론트엔드] API Regression 조치 결과 및 마이그레이션 상태 확인 - 완료 (2025-08-13)

## 1) 요약

- 원인: DB 볼륨 초기화 직후 마이그레이션 미적용 상태에서 스모크 수행 → 테이블 부재(UndefinedTable)로 500 발생
- 조치: 컨테이너에서 `alembic upgrade head` 적용, 데이터 시드 후 재검증
- 결과: 목록/집계형 5개 엔드포인트 및 상세/Comparables 포함 200 OK 확인(샘플 데이터 기준)

## 2) 상세 조치

- 마이그레이션 최신 반영: `docker compose exec api alembic upgrade head`
- 데이터 시드(호스트 경로 마운트):
  - compose에 데이터 디렉터리 마운트 및 `DATA_BASE_PATH=/data` 설정 반영
  - 적재 내역:
    - `auction_items`: 500건
    - `auction_completed`: 200건
    - `real_transactions`: 2000건
    - `real_rents`: 3000건

## 3) 재검증 결과 (상태코드)

- GET `/api/v1/items/simple` → 200
- GET `/api/v1/items/` → 200
- GET `/api/v1/real-transactions/` → 200
- GET `/api/v1/real-rents/` → 200
- GET `/api/v1/auction-completed/` → 200
- GET `/api/v1/items/1` → 200
- GET `/api/v1/items/1/comparables?radius=1.0&limit=5` → 200

## 4) 운영/재현 가이드

- 수동 마이그레이션: `docker compose exec api alembic upgrade head`
- 데이터 시드(예시):
  - `docker compose exec api python scripts/load_data.py --table auction_items --limit 500`
  - 필요 시 `auction_completed`, `real_transactions`, `real_rents`도 동일 방식으로 제한 적재

## 5) 재발 방지

- 컨테이너 부팅 시 Alembic 자동 적용 유지, 실패 시 헬스체크 이전에 감지하도록 로그 모니터링 강화
- 구조적 로깅(요청/응답 요약) 적용 완료 → 원인 추적 용이(`Doc/LOGGING_KPI_DESIGN.md` 참고)

## 6) 진행 상태

- Status: Completed
- Requester: 프론트엔드 팀
- Assignee: 백엔드 팀
- Requested At: 2025-08-13
- Completed At: 2025-08-13
- History:
  - 2025-08-13: Regression 감지
  - 2025-08-13: Alembic 적용 및 데이터 시드, 재검증(200 OK) 완료
