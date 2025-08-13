# [프론트엔드→백엔드] 조치 완료 문서와 상이한 500 재현 – 환경/로그 재확인 요청 (2025-08-13)

## 1) 요약

- 귀측 완료 문서에 따르면 목록/집계 5개 및 상세/Comparables 200 OK 확인된 상태이나, 당사 환경에서 동일 시점에 5개 데이터 엔드포인트가 500으로 재현되고 있습니다.

## 2) 우리 재현 (로컬 컨테이너)

```
GET /health → 200
GET /api/v1/items/simple?limit=1 → 500
GET /api/v1/items/?limit=1 → 500
GET /api/v1/auction-completed/?limit=1 → 500
GET /api/v1/real-transactions/?limit=1 → 500
GET /api/v1/real-rents/?limit=1 → 500
```

- 스크립트: `scripts/smoke.ps1 -BaseURL http://127.0.0.1:8000 -Repeat 1`

## 3) 요청 사항 (필수)

- [ ] 동일 환경에서 5개 엔드포인트 200 OK 캡처 공유 (명령: `curl -i` 또는 Postman 캡처)
- [ ] 컨테이너에서 Alembic 재적용 로그 공유: `alembic upgrade head` 출력 일부
- [ ] 현재 컨테이너/DB 구성 차이 공유 (포트/베이스 URL/CORS/compose 프로필/볼륨 마운트 여부)
- [ ] 샘플 데이터 1건 생성으로 상세/Comparables 404→200 전환 캡처 공유
  - 예) `POST /api/v1/items/` 1건 생성 후
  - `GET /api/v1/items/1` → 200, `GET /api/v1/items/1/comparables?radius=1.0&limit=5` → 200

## 4) 참고

- 우리 측 상세 원문 수집은 `scripts/smoke-detail.ps1`로 제공 가능
- FE 베이스 URL: `http://127.0.0.1:8000`

## 5) 진행 상태

- Status: Completed
- Requester: 프론트엔드 팀
- Assignee: 백엔드 팀
- Requested At: 2025-08-13
- Completed At: 2025-08-13
- History:
  - 2025-08-13: 조치 완료 문서 수신 후에도 500 재현 → 환경/로그 재확인 요청 발신
  - 2025-08-13: 백엔드 재현/캡처/환경 차이 공유 및 시드 가이드 제공으로 완료

# [프론트엔드→백엔드] 조치 완료 문서와 상이한 500 재현 – 환경/로그 재확인 요청 - 처리 완료 (2025-08-13)

## 1) 요약

- 우리 환경(컨테이너 내부)에서 요청하신 5개 엔드포인트와 상세/Comparables 모두 200 OK 재현 확인했습니다.
- 원인: DB 볼륨 초기화 후 마이그레이션 미적용/데이터 미시드 상태에서 스모크 수행 시 500 발생 가능. 현재는 Alembic 적용 + 데이터 시드로 정상 동작.

## 2) 재현 캡처 (컨테이너 내부 curl -i)

- GET `/api/v1/items/simple?limit=1` → 200
- GET `/api/v1/items/?limit=1` → 200
- GET `/api/v1/auction-completed/?limit=1` → 200
- GET `/api/v1/real-transactions/?limit=1` → 200
- GET `/api/v1/real-rents/?limit=1` → 200
- GET `/api/v1/items/1` → 200
- GET `/api/v1/items/1/comparables?radius=1.0&limit=5` → 200

## 3) Alembic/환경 차이 및 데이터

- Alembic 적용: `docker compose exec api alembic upgrade head` (최신 스키마 반영)
- 데이터 마운트/환경: compose에 호스트 데이터 디렉터리 마운트, `DATA_BASE_PATH=/data`
- 시드 적재 내역:
  - `auction_items`: 500건
  - `auction_completed`: 200건
  - `real_transactions`: 2000건
  - `real_rents`: 3000건

## 4) 재현 가이드(프론트 로컬 컨테이너)

1. 마이그레이션 수동 적용(필요 시): `docker compose exec api alembic upgrade head`
2. 데이터 시드(택1)
   - API로 샘플 1건 생성 후 상세/Comparables 확인
   - CSV 시드: 데이터 디렉터리 마운트 후 `DATA_BASE_PATH=/data`로 제한 적재 실행

## 5) 진행 상태

- Status: Completed
- Requester: 프론트엔드 팀
- Assignee: 백엔드 팀
- Requested At: 2025-08-13
- Completed At: 2025-08-13
- History:
  - 2025-08-13: 500 재현 요청 수신
  - 2025-08-13: Alembic 재확인/데이터 시드/스모크 캡처 공유로 완료
