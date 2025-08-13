# [프론트엔드백엔드] 로컬 Base URL 8001 고정 정책 공유 및 CORS 재확인 요청 (2025-08-13)

## 1) 배경 (Why?)
- 프론트 로컬 개발 표준을 .env.local 기반으로 8001로 고정했습니다.
- /analysis SWR 에러는 Base URL 일관화 + 배열 키/표준 fetcher 도입으로 해소되었습니다.

## 2) 요청 사항 (What?)
- [ ] 개발 API 기본 포트가 8001로 유지되는지 최종 확인
- [ ] CORS 허용 원본 재확인: http://localhost:3000, http://127.0.0.1:3000
- [ ] 변경(포트/엔드포인트) 발생 시 사전 고지 요청

## 3) 참고 (헬스/스모크)
- /health (8000): 200
- /health (8001): 200
- Dev 라우트: /, /analysis, /features, /pricing, /analysis/101  모두 200

## 4) DoD
- 백엔드로부터 8001 고정 및 CORS 허용 원본 확인 회신 수신
- 변경 발생 시 공지 경로/타임라인 합의

## 5) 진행 상태
- Status: Requested
- Requester: Frontend Team
- Assignee: Backend Team
- Requested At: 2025-08-13
- Completed At:
- History:
  - 2025-08-13: 본 요청서 발신
