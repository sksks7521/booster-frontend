# [프론트엔드→백엔드] auction-completed 404 원인 확인 요청 (완료) (2025-08-28)

## 개요

- `/api/v1/auction-completed/?page=1&size=1` 호출 시 404가 발생하던 이슈를 확인·수정했습니다.

## 원인

- `auction-completed` 라우터에 루트 경로(`/`) 핸들러가 없고, `/simple`, `/full` 등 하위 경로만 존재하여 루트 호출이 404 처리됨.

## 조치

- `app/api/v1/endpoints/auction_completed.py`에 `GET /` 핸들러 추가(표준 페이징 응답 반환).
- 표준 에러 포맷 유지 확인.

## 검증

- 스모크: `GET /api/v1/auction-completed/?page=1&limit=5` → 200 OK, `{items,total,page,size,pages}` 응답 확인.
- 정렬/지오필터 동작 검증: 반경 정렬(desc by auction_date) 통과.

## 현재 상태

- 이슈 재현 불가(정상 동작).

— Backend Team, 2025-08-28
