# [프론트엔드→인프라] Amplify 환경변수 최종 등록 확인 요청 (2025-08-11)

## 1) 요청 배경

- 백엔드 Fix 이후 프론트 스모크/통합 QA가 200 OK로 안정화되었습니다. 배포 환경에서도 동일한 동작을 보장하기 위해 Amplify 환경변수 최종 등록 상태 확인이 필요합니다.

## 2) 요청 사항

- 아래 환경변수의 등록 및 값(환경별)을 최종 확인 부탁드립니다.

  - `NEXT_PUBLIC_API_BASE_URL`
    - dev: `http://127.0.0.1:8000` 또는 개발용 API 게이트웨이 URL
    - staging: 스테이징 API 게이트웨이 URL
    - prod: 프로덕션 API 게이트웨이 URL
  - `NEXT_PUBLIC_VWORLD_API_KEY`
    - dev/staging/prod 공히 유효한 키 값

- 등록 위치: AWS Amplify → 앱(`booster-frontend` / `Application` 기준) → 환경변수
- 반영 후 재배포 트리거 여부도 함께 확인 부탁드립니다.

## 3) 참고 정보

- 프론트 개발 기준 경로: `Application/`
- 지도 엔진: vworld (Leaflet 제거)
- 관련 문서
  - `Doc/FRONTEND_ARCHITECTURE.md` (환경변수, UX 표준, API 타임아웃/에러 표준화 반영)
  - `Log/250811.md` (스모크/QA 진행 결과 기록)

## 4) 완료 정의 (DoD)

- Amplify 환경변수 dev/staging/prod 각각 등록 상태 확인 회신
- 필요 시 값 보정 후 재배포 완료 회신

---

## Infra 진행 상태 업데이트 (2025-08-11)

- 준비 완료: ENV/키/브랜치 매핑 정리 (`infra/standards/ENV_SECRETS_MATRIX.md`, `infra/standards/Amplify_Deployment_Plan.md`)
- 대기 사항: App ID, STG/PRD API Base URL, VWorld Key 수령 시 즉시 등록/재배포 예정
- 커뮤니케이션: `Communication/Frontend/send/Request/250811_Infra_to_Frontend_Amplify_ENV_값_확정_필수_정보_요청.md` 발신

---

- Status: Pending
- Requester: Frontend 팀
- Assignee: Infra 팀
- Sent At: 2025-08-11
