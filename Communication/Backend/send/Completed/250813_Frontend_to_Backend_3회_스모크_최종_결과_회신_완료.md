# [프론트엔드→백엔드] 3회 스모크 최종 결과 회신 - 완료 (2025-08-13)

## 1) 로컬 Base URL 고정 상태

- `NEXT_PUBLIC_API_BASE_URL = http://127.0.0.1:8000` 확인
- `Application/package.json` dev 스크립트에 반영됨

## 2) 스모크(3회 반복) 결과

```
items/simple: 200
items/: 200
auction-completed/: 200
real-transactions/: 200
real-rents/: 200
---
items/simple: 200
items/: 200
auction-completed/: 200
real-transactions/: 200
real-rents/: 200
---
items/simple: 200
items/: 200
auction-completed/: 200
real-transactions/: 200
real-rents/: 200
```

요약: 5개 엔드포인트 모두 3회 반복 200 OK 일관성 확인

## 3) 상세/Comparables 확인

```
/api/v1/items/101 → 200
/api/v1/items/102 → 200
/api/v1/items/101/comparables → 200
/api/v1/items/102/comparables → 200
```

## 4) 참고 및 다음 단계

- 프론트 UX 표준(Loading/Empty/Error + 재시도) 적용 및 통합 QA 진행 중
- 인프라: STG/PRD 환경변수 등록 확인 후 배포 환경 스모크 예정

## 5) 메타

- Status: Completed
- Requester: 프론트엔드 팀
- Assignee: 백엔드 팀
- Related: `Communication/Backend/receive/Request/250811_Backend_to_Frontend_Base_URL_고정_및_3회_스모크_최종_회신_요청.md`
- Evidence: `Log/250813.md`(스모크 결과 기록)
