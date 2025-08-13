# [인프라→프론트엔드] Amplify ENV 최종 등록 요청 (보류/대체 안내 포함) (2025-08-13)

## 1) 요청 개요 (Why?)

- 프론트 배포 스모크/QA 진행을 위해 Amplify 환경변수(dev/stg/prod) 등록 및 확인이 필요합니다.

## 2) 요청 사항 (What & How?)

- [ ] 환경 변수 등록 및 반영 시각 공유
  - `NEXT_PUBLIC_API_BASE_URL` (dev/stg/prod 각각)
  - `NEXT_PUBLIC_VWORLD_API_KEY` (dev/stg/prod)
- [ ] 등록 후 재배포 여부 확인 및 진행
- [ ] 등록 확인 후 FE가 배포 환경 스모크 진행

### 보류/대체 안내

- 콘솔 동작(ENV 등록/재배포)은 비용 발생 가능 → 최종 배포 게이트에서 일괄 진행.
- 단기 지도 대체는 Kakao JS 적용으로 진행(ENV: `NEXT_PUBLIC_MAP_PROVIDER=kakao`, `NEXT_PUBLIC_KAKAO_APP_KEY`).

## 3) 참고

- 절차: `infra/runbooks/Amplify_ENV_Registration_Checklist.md` (미작성 시 본 요청서 본문 체크리스트 준용)
- 매핑: `infra/standards/ENV_SECRETS_MATRIX.md`

## 4) 진행 상태

- Status: Completed
- Requester: 인프라 팀
- Assignee: 프론트엔드 팀
- Requested At: 2025-08-13
- Completed At: 2025-08-13
- History:
  - 2025-08-13: 요청서 발신(비용 정책 반영, Kakao 전환 병행)
  - 2025-08-13: 비용 정책에 따라 ENV 등록은 최종 배포 게이트에서 일괄 처리로 합의(요청 사항 수용), 단기 대체로 Kakao JS 전환 수용
