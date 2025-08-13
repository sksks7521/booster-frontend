# [프론트엔드인프라] Kakao 도메인 목록 회신 및 JS 키 전달 요청 (2025-08-13)

## 1) 요청 목적 (Why?)
- VWorld 운영 전환 승인 대기(약 10일) 동안 Kakao JS로 임시 운용하기 위해, 환경별 허용 도메인 등록과 로컬/개발용 Kakao JavaScript 키 전달이 필요합니다.

## 2) 회신/등록 요청 사항 (What?)
- [ ] 아래 도메인 목록을 Kakao 플랫폼(Web) 도메인에 등록 진행 요청
- [ ] 로컬/개발용 Kakao JavaScript 키를 보안 채널로 전달 요청

### A. 환경별 허용 도메인(안)
- local
  - http://localhost:3000
  - http://127.0.0.1:3000
- dev
  - (배포 후) Amplify 기본 도메인: 예) https://main-<hash>.amplifyapp.com
  - 참고: 필요 시 임시로 *.amplifyapp.com 와일드카드 논의 가능(권장: 실제 발급 도메인 확정 후 등록)
- stg
  - *.amplifyapp.com
  - https://stg.budongsanbooster.com
- prod
  - https://www.budongsanbooster.com

## 3) ENV/설정 계획 (How?)
- 프론트엔드 로컬: .env.local에 아래 값 적용 완료
  - NEXT_PUBLIC_MAP_PROVIDER=kakao
  - NEXT_PUBLIC_KAKAO_APP_KEY=<인프라 전달 키>
- 배포: Amplify ENV는 최종 배포 게이트에서 일괄 반영(합의 사항)

## 4) 필요한 회신 정보 (From Infra)
- [ ] Kakao JavaScript 키(로컬/개발용) 전달 경로 및 키 값
- [ ] dev/stg 실제 배포 도메인(URL) 확정 시각 또는 1차 배포 타임라인(도메인 발급 이후 등록 진행)
- [ ] 도메인 등록 완료 시각, 간단 스모크(로드/줌/팬/마커, 콘솔 에러 0) 가능 시점

## 5) 참고
- infra/standards/Kakao_Map_Adoption_Guide.md
- infra/runbooks/Kakao_Domain_Key_Checklist.md
- VWorld 병행 계획: Communication/Infra/receive/Request/250813_Infra_to_Frontend_VWorld_허용_도메인_최종_확정_합의_요청.md

## 6) 진행 상태
- Status: Requested
- Requester: 프론트엔드 팀
- Assignee: 인프라 팀
- Requested At: 2025-08-13
- Completed At:
- History:
  - 2025-08-13: 본 요청서 발신
