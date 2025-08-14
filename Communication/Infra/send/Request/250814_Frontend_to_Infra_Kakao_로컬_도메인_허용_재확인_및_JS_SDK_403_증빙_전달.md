# [Frontend → Infra] Kakao 로컬 도메인 허용 재확인 및 JS SDK 403 증빙 전달 (2025-08-14)

## 1) 배경 / 목적

- VWorld 운영 전환 승인 대기 동안 Kakao JS로 임시 운용 중입니다.
- 프론트 로컬 환경에서 `/analysis`는 200 OK이나, Kakao JS SDK 로드는 403 응답이 확인됩니다.
- Kakao 콘솔(Web) 허용 도메인에 로컬 도메인이 누락된 것으로 추정되어 허용 등록/재확인을 요청드립니다.

## 2) 현행 설정(프론트)

```ini
Application/.env.local
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001
NEXT_PUBLIC_MAP_PROVIDER=kakao
NEXT_PUBLIC_KAKAO_APP_KEY=806e6ee2087ee8b4607dddde9cb52917
```

- dev 서버: `http://localhost:3000` (Next.js 15.2.4)
- 페이지: `/analysis` 200 OK

## 3) 증빙(Log)

- Kakao SDK HEAD (무참조)
  - `curl -I "https://dapi.kakao.com/v2/maps/sdk.js?appkey=****&autoload=false"` → 404 (apihub)
- Kakao SDK GET (Referer 포함)
  - `curl -s -o NUL -w "%{http_code}" -H "Referer: http://localhost:3000" "https://dapi.kakao.com/v2/maps/sdk.js?appkey=****&autoload=false"` → 403

## 4) 요청 사항(필수)

1. Kakao 콘솔(Web) 허용 도메인 등록/재확인
   - `http://localhost:3000`
   - `http://127.0.0.1:3000` (옵션, 필요 시 함께 허용)
2. 전달 주신 키가 JavaScript 키(웹)인지 확인 (REST/Admin 키가 아님)
3. Referer 검사 정책(정확 매칭/서브도메인 포함 등) 메모 및 반영 완료 회신

## 5) 완료 기준(DoD)

- 로컬 브라우저에서 `/analysis` 진입 시 Kakao 지도 로드, 줌/팬 정상 동작, 콘솔 에러 0
- Network 탭에서 `dapi.kakao.com/v2/maps/sdk.js?...` 200 OK 확인

---

- Status: Requested
- Requester: Frontend Team
- Assignee: Infra Team
- Requested At: 2025-08-14
- Completed At:
- History:
  - 2025-08-14: 프론트 로컬 SDK 403 증빙 수집 및 허용 도메인 등록 요청 발송
