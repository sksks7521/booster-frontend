# [백엔드→프론트엔드] SWR Error 재현 환경 및 Base URL 확인 요청 (2025-08-13)

## 1) 목적

- `/analysis` 페이지 진입 시 SWR 에러가 발생한다는 리포트를 접수했습니다. 백엔드 기준 모든 핵심 엔드포인트(목록 5종 + 상세/Comparables)가 200 OK로 확인된 상태이므로, 프론트 런타임 환경/설정 차이를 수집하여 원인 정합성을 확보하고자 합니다.

## 2) 백엔드 현재 상태(참고)

- 포트 노출: `8000`(호환) + `8001`(권장) → 컨테이너 8000 매핑
- 데이터: 4개 테이블 시드(auction_items 500, auction_completed 200, real_transactions 2000, real_rents 3000)
- 마이그레이션: `alembic upgrade head` 적용 완료
- 스모크: items/simple, items, auction-completed, real-transactions, real-rents, items/1, items/1/comparables 모두 200 OK

## 3) 요청 사항 (필수)

1. 환경 변수/베이스 URL

   - [ ] `.env.local` 공유: `NEXT_PUBLIC_API_BASE_URL`, 기타 API 관련 변수
   - [ ] 실제 호출 URL 캡처: 네트워크 탭에서 `/api/v1/items...` 요청의 풀 URL(도메인/포트 포함)

2. 네트워크/콘솔 로그

   - [ ] `/analysis` 로드 시 네트워크 HAR(필터: `/api/v1/*`) 내보내기
   - [ ] 브라우저 콘솔 로그(에러 포함) 캡처

3. SWR 사용 방식

   - [ ] SWR 키/Fetcher 코드 스니펫(파일 경로 포함) 공유
     - 키가 문자열 조합인지, 배열(tuple) 키인지 구분 필요
     - fetcher가 Base URL과 쿼리스트링을 어떻게 조립하는지 확인 필요

4. 재현 커맨드(동일 환경 확인용)

   - [ ] 아래 결과(상태라인 포함)를 캡처하여 공유 부탁드립니다.
     - `curl -i "${NEXT_PUBLIC_API_BASE_URL}/api/v1/items/simple?limit=1"`
     - `curl -i "${NEXT_PUBLIC_API_BASE_URL}/api/v1/items/?limit=1"`
     - `curl -i "${NEXT_PUBLIC_API_BASE_URL}/api/v1/auction-completed/?limit=1"`
     - `curl -i "${NEXT_PUBLIC_API_BASE_URL}/api/v1/real-transactions/?limit=1"`
     - `curl -i "${NEXT_PUBLIC_API_BASE_URL}/api/v1/real-rents/?limit=1"`

5. 런타임/버전 정보
   - [ ] Next.js/SWR 버전(`package.json`) 및 실행 커맨드(`npm run dev` 등)
   - [ ] 프록시(nginx/dev server) 등 중간 레이어 존재 시 설정 공유

## 4) 백엔드 제안(선조치 옵션)

- Base URL 고정: `.env.local`에 `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001`(또는 8000) 지정 후 프론트 dev 재시작
- SWR 키 표준화: 배열 키 사용 권장 → `useSWR(['/api/v1/items/', params], fetcher)`
- Fetcher 안정화: `URLSearchParams`로 쿼리 조립, `!res.ok` 시 `throw new Error('HTTP '+res.status)`

## 5) 진행 상태

- Status: Requested
- Requester: 백엔드 팀
- Assignee: 프론트엔드 팀
- Requested At: 2025-08-13
- Completed At:
- History:
  - 2025-08-13: 요청서 작성/송부

# [프론트엔드→백엔드] SWR Error 원인 및 조치 결과 회신 (완료) (2025-08-13)

## 1) 요약

- 현상: `/analysis` 진입 시 SWR 에러 발생 보고
- 원인: 프론트 베이스 URL 포트 불일치(8000 사용)
- 조치: `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001`로 고정 후 dev 재기동
- 결과: 헬스/목록/집계형 5개 엔드포인트 모두 200 OK → SWR 에러 해소

## 2) 환경

- 프론트 베이스 URL: `http://127.0.0.1:8001` (.env.local)
- Dev 실행: `npm run dev` (Next 15.2.4, SWC WASM 강제)

## 3) 재검증 결과(상태코드)

```
GET /health → 200
GET /api/v1/items/simple?limit=1 → 200
GET /api/v1/items/?limit=1 → 200
GET /api/v1/auction-completed/?limit=1 → 200
GET /api/v1/real-transactions/?limit=1 → 200
GET /api/v1/real-rents/?limit=1 → 200
```

## 4) 비고

- 상세/Comparables는 백엔드 시드 기준 200 OK 확인됨(완료 문서 참조)
- 프론트는 베이스 URL 8001 유지하겠습니다

## 5) 진행 상태

- Status: Completed
- Requester: 프론트엔드 팀
- Assignee: 백엔드 팀
- Completed At: 2025-08-13
- History:
  - 2025-08-13: SWR 에러 보고
  - 2025-08-13: 베이스 URL(8001) 전환 및 200 OK 재검증 → 완료 회신
