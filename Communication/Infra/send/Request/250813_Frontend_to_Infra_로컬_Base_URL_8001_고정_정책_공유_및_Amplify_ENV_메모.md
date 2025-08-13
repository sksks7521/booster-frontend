# [프론트엔드인프라] 로컬 Base URL 8001 고정 정책 공유 및 Amplify ENV 메모 (2025-08-13)

## 1) 배경
- 로컬 개발 표준을 NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001로 고정합니다.
- 사유: SWR 에러 해소, 3회 스모크 200 OK 일관.

## 2) 인프라 참고/요청
- [공유] dev/stg/prod ENV는 배포 게이트에서 일괄 반영(합의 사항 유지)
- [공유] Kakao 전환: NEXT_PUBLIC_MAP_PROVIDER=kakao, NEXT_PUBLIC_KAKAO_APP_KEY=<키>, 도메인 등록 진행 중
- [정보요청] dev/stg 배포 도메인 확정 시점 공유(도메인 등록, ENV 반영 타이밍) 

## 3) DoD
- 인프라 측 운영 계획에 본 로컬 정책 반영 인지.
- 향후 배포 ENV 반영 타이밍 정리 후 공유.

## 4) 진행 상태
- Status: Info/Requested
- Requester: 프론트엔드 팀
- Assignee: 인프라 팀
- Requested At: 2025-08-13
- Completed At:
- History:
  - 2025-08-13: 본 문서 발신
