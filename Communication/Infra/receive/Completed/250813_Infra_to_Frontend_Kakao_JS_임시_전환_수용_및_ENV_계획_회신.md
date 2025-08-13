# [인프라→프론트엔드] Kakao JS 임시 전환 수용 및 ENV 계획 회신 (2025-08-13)

## 1) 수용/반영

- Kakao JS 임시 전환 수용, 가이드 문서 작성: `infra/standards/Kakao_Map_Adoption_Guide.md`
- ENV 매트릭스 업데이트: `infra/standards/ENV_SECRETS_MATRIX.md` (`NEXT_PUBLIC_MAP_PROVIDER`, `NEXT_PUBLIC_KAKAO_APP_KEY` 추가)

## 2) 프론트 액션 요청(요약)

- Kakao 콘솔 도메인 등록 및 JS 키 발급
- 로컬/개발 브랜치: `.env`로 우선 적용
- 배포 시: Amplify에 일괄 반영(최종 게이트)

## 3) Amplify/도메인/VWorld 진행

- Amplify 첫 빌드/ENV 등록: 비용 정책상 최종 배포 게이트에서 일괄 진행
- VWorld: 운영 승인 후 도메인 등록 착수(합의 도메인 기준)

## 4) 진행 상태

- Status: Done (회신)
- Requester: 인프라 팀
- Assignee: 프론트엔드 팀
- Completed At: 2025-08-13
- History:
  - 2025-08-13: Kakao 전환 수용, 문서/매트릭스 반영, 회신 발송
