# [프론트엔드→백엔드] auction-completed 404 원인 확인 요청 (완료) (2025-08-28)

## 1) 개요

- 재현: `GET /api/v1/auction-completed/?page=1&size=1` 가 404 응답.
- 동일 시점 `real-transactions`/`real-rents` 정상(200).

## 2) 원인 분석

- `/api/v1/auction-completed/` 루트 경로에 대한 핸들러가 부재하여 404 발생.
- 기존에는 `/simple`, `/full`, `/custom`, `/columns`, `/{id}` 경로만 존재.
- 라우터 매핑(`app/api/v1/api.py`)은 정상(`prefix="/auction-completed"`).

## 3) 조치 사항

- 레거시 호환 루트 핸들러 추가(200 응답 보장).
  - 파일: `app/api/v1/endpoints/auction_completed.py`
  - 엔드포인트: `GET /api/v1/auction-completed/`
  - 파라미터: `page`, `size`, `limit(alias)`
  - 응답: `{ items, total, page, size, total_pages, pages }`
- 표준 에러 포맷 전역 적용 확인: `{ message, status, detail }` (이미 적용됨)

## 4) 검증 내역(로컬)

- 헬스체크: `GET /health` → 200 OK
- 루트 호출: `GET /api/v1/auction-completed/?page=1&size=1` → 200 OK, `items` 배열 및 `pages` 키 존재
- 기존 엔드포인트 회귀:
  - `GET /api/v1/auction-completed/simple` → 200 OK
  - `GET /api/v1/auction-completed/full` → 200 OK
  - `GET /api/v1/auction-completed/columns` → 200 OK
  - `GET /api/v1/auction-completed/{id}` → 개별 조회 정상/404 시 표준 에러 포맷

### PowerShell 재현 스니펫

```powershell
$base = "http://127.0.0.1:8000"
$resp = Invoke-RestMethod -Uri "$base/api/v1/auction-completed/?page=1&size=1"
$resp | ConvertTo-Json -Depth 4
```

## 5) 영향 범위/리스크

- 추가된 핸들러는 읽기 전용이며 기존 경로와 충돌 없음.
- 응답 스키마는 기존 패턴과 동일(프론트 표준 계약 반영: `pages` 동시 제공).
- 인증/권한: 로컬 개발 환경, 인증 요구 없음(변경 없음).

## 6) Next Steps

- 프론트 스모크: 루트 경로 호출을 표준 파라미터(`page/size`)로 확인.
- 문제가 재현되면 호출 URL/헤더/타임스탬프 공유 요청.

## 7) 진행 상태

- Status: Done
- Requester: Frontend
- Assignee: Backend
- Requested At: 2025-08-28
- Completed At: 2025-08-28
- History:
  - 2025-08-28: 원인 분석(루트 핸들러 부재) 및 수정(루트 핸들러 추가), 스모크 검증 완료
