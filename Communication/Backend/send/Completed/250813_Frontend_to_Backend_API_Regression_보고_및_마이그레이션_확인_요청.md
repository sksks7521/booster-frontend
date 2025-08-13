# [프론트엔드→백엔드] API Regression 보고 및 마이그레이션 상태 확인 요청 (2025-08-13)

## 1) 요약 (Summary)

- 헬스는 200 OK이나 5개 데이터 엔드포인트와 상세/Comparables가 500으로 회귀했습니다. 원문 요약에 DB 테이블 부재(UndefinedTable) 오류가 확인됩니다.

## 2) 환경 (Environment)

- Base URL: `http://127.0.0.1:8000`
- 스모크 스크립트: `scripts/smoke.ps1` (3회 반복), `scripts/smoke-comparables.ps1`
- 실행 시각: 2025-08-13 (로컬 컨테이너)

## 3) 기대 결과 (Expected)

- items/simple, items, auction-completed, real-transactions, real-rents, items/{id}, items/{id}/comparables → 200 OK

## 4) 실제 결과 (Actual)

```
health: 200
items/simple: 500
items/: 500
auction-completed/: 500
real-transactions/: 500
real-rents/: 500

/api/v1/items/101 → 500
/api/v1/items/101/comparables → 500
/api/v1/items/102 → 500
/api/v1/items/102/comparables → 500
...
```

원문(발췌):

- auction-completed: `psycopg2.errors.UndefinedTable: relation "auction_completed" does not exist`
- real-transactions: `psycopg2.errors.UndefinedTable: relation "real_transactions" does not exist`
- real-rents: `psycopg2.errors.UndefinedTable: relation "real_rents" does not exist`
- items/items-simple: 500 (text/plain; stacktrace)

## 5) 가설 (Hypothesis)

- DB 마이그레이션/시드 미적용 또는 컨테이너 볼륨 초기화로 인한 테이블 부재 가능성

## 6) 요청 사항 (Requests)

- [ ] 현재 컨테이너/DB 마이그레이션 적용 상태 확인 (alembic/DDL 적용 여부)
- [ ] 누락 시 마이그레이션 즉시 적용 요청 (필요 시 초기 시드 포함)
- [ ] 적용 후 5개 엔드포인트와 상세/Comparables에 대해 200 OK 재확인
- [ ] 회귀 원인/재발 방지 대책 공유 (마이그레이션 자동화/헬스체크 강화 등)

## 7) 재현/증빙 (Evidence)

- 요약 스모크(3회 반복): `scripts/smoke.ps1 -BaseURL http://127.0.0.1:8000 -Repeat 3`
- 상세 원문 수집: `scripts/smoke-detail.ps1`
- Comparables 스모크: `scripts/smoke-comparables.ps1 -BaseURL http://127.0.0.1:8000`

## 8) 진행 상태

- Status: Completed
- Requester: 프론트엔드 팀
- Assignee: 백엔드 팀
- Requested At: 2025-08-13
- Completed At: 2025-08-13
- History:
  - 2025-08-13: Regression 감지 및 요청서 발신
  - 2025-08-13: 백엔드 조치 완료(Alembic 적용, 목록/집계 200, 상세/Comparables 시드 안내) 및 완료처리

# [프론트엔드→백엔드] API Regression 보고 및 마이그레이션 상태 확인 요청 - 처리 완료 (2025-08-13)

## 1) 조치 결과 요약

- 원인: DB 볼륨 초기화 직후 Alembic 미적용 상태로 스모크 수행 → 테이블 부재(UndefinedTable)로 500 발생
- 조치: 컨테이너에서 `alembic upgrade head` 적용 완료(최신 스키마 반영)
- 검증: 목록/집계형 5개 엔드포인트 200 OK 확인
  - GET `/api/v1/items/simple` → 200
  - GET `/api/v1/items/` → 200
  - GET `/api/v1/real-transactions/` → 200
  - GET `/api/v1/real-rents/` → 200
  - GET `/api/v1/auction-completed/` → 200
- 상세/Comparables: 현재 DB에 데이터가 없어 404(정상 동작). 샘플 ID 생성/시드 후 200 확인 가능

## 2) 재발 방지/운영 가이드

- 컨테이너 부팅 시 Alembic 자동 적용 유지, 수동 재적용 명령: `docker compose exec api alembic upgrade head`
- 데이터 시드 방법(택1)
  1. API로 샘플 생성(빠름): POST `/api/v1/items/` 1건 생성 → 상세/Comparables 스모크 가능
  2. CSV 시드(정식): 호스트 데이터 디렉터리를 컨테이너에 마운트 후 실행
     - compose 예시: `- ./data:/data` 마운트, 환경변수 `DATA_BASE_PATH=/data`
     - 실행: `docker compose exec -e DATA_BASE_PATH=/data api python scripts/load_data.py --table auction_items --limit 500`

## 3) 증빙(Internal)

- Alembic: `alembic upgrade head` 적용 로그 확인
- 스모크(컨테이너 내부 상태코드 확인): 목록/집계형 5개 엔드포인트 200
- 상세/Comparables: 현재 404 (데이터 부재로 정상)
