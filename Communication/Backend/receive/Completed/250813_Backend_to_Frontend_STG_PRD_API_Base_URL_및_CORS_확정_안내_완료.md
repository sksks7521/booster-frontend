# [Backend → Frontend] STG/PRD API Base URL 및 CORS 확정 안내 (완료)

- 발신: Backend
- 수신: Frontend
- 일자: 2025-08-13
- 참고: `README.md` → "환경별 Base URL / CORS 정책", `/health` 정책, 프론트 로컬 Base URL 고정 가이드

---

## 1) 환경별 API Base URL

- STAGING: `https://stg-api.budongsanbooster.com`
- PRODUCTION: `https://api.budongsanbooster.com`

> 인프라/DNS 적용 전이라도 프론트 ENV 정의 및 라우팅 정책 합의가 목적입니다. 실제 활성화는 DNS/인프라 준비 완료 시점에 즉시 전환 가능합니다.

## 2) /health 정책

- 엔드포인트: `GET /health`
- 노출 여부: 노출
- 정상 응답: 200 OK
- 예시 페이로드: `{ "status": "healthy", "service": "booster-backend" }`

## 3) CORS 허용 Origin (프로토콜 포함)

- dev: `http://localhost:3000`, `http://127.0.0.1:3000`
- stg: `https://stg.budongsanbooster.com`, `https://main.<amplify-app-id>.amplifyapp.com`
- prd: `https://www.budongsanbooster.com`

> 백엔드 환경변수 `BACKEND_CORS_ORIGINS`는 콤마 문자열 혹은 JSON 배열 문자열을 모두 지원합니다. 예시는 `README.md`와 `env.example` 참고 바랍니다.

## 4) 스모크용 샘플 아이템 ID 제공

- 권장 확보 방법(안정): 간단 목록 API로 현재 시드된 데이터에서 상위 5건 id를 조회하여 사용
  - `GET /api/v1/items/simple`
  - 예시: `curl -s "http://127.0.0.1:8001/api/v1/items/simple?limit=5" | jq '.[].id'`
- 상세/Comparables 확인 예시:
  - `GET /api/v1/items/{id}`
  - `GET /api/v1/items/{id}/comparables?radius=1.0&limit=5`

> 참고: README 스모크 예시에서는 `101`을 사용합니다. 실제 샘플 ID 3~5건은 데이터 시드 후 위 조회 명령으로 확인하여 사용해 주세요. (요청 시 백엔드가 고정 샘플 세트를 추가로 공유하겠습니다.)

---

## 5) 프론트 설정 가이드(요약)

- 로컬 개발 시 권장: `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001`
- 백엔드는 8000/8001 모두 노출(둘 중 하나 사용 가능)
- STG/PRD 전환 시 ENV만 교체하면 동일 라우팅 규칙으로 동작

## 6) 부록

- 변경 이력: `README.md` 보강, `env.example` 추가, 데이터 검증 리포트 기능(`scripts/verify_data.py --output`) 제공
- 문의: Backend 채널

---

본 문서는 STG/PRD 전환 정책 및 프론트 ENV 세팅 합의를 위한 최종 안내본입니다. 추가 샘플 ID가 필요하시면 백엔드에 요청해 주세요.
