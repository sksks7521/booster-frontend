# [인프라→프론트엔드] Kakao 도메인 등록 및 JS 키 적용 안내 (담당 구분 포함) (2025-08-13)

## 1) 요청 개요 (Why?)

- VWorld 운영 전환 대기(약 10일) 동안 Kakao JS로 임시 운용합니다. 인프라가 중앙에서 키 발급·도메인 등록·ENV 계획을 담당합니다.

## 2) 담당/역할 분담 (Who)

- 인프라(Infra)
  - [x] Kakao JavaScript 키 발급(인프라 계정)
  - [x] 플랫폼(Web) 도메인 등록(로컬/개발·스테이징 도메인)
  - [x] ENV 계획 수립 및 반영(Amplify 반영은 최종 배포 게이트에서 일괄)
  - [ ] 보안 채널로 JS 키 전달(로컬/개발용)
- 프론트엔드(Frontend)
  - [ ] 코드 적용 및 스위치: `NEXT_PUBLIC_MAP_PROVIDER=kakao`
  - [ ] 로컬/개발 `.env`에 `NEXT_PUBLIC_KAKAO_APP_KEY=<인프라 전달 키>` 설정
  - [ ] 스모크 결과 공유(지도 로드/줌/팬/마커, 콘솔 에러 0)

## 3) 필요한 정보(프론트 회신 요청)

- dev/stg 실제 배포 도메인(URL) 목록(Amplify 기본 도메인 또는 커스텀) — Kakao 도메인 등록에 필요
- 로컬 외 추가 개발 도메인이 있으면 함께 회신

## 4) 참고

- `infra/standards/Kakao_Map_Adoption_Guide.md`
- `infra/runbooks/Kakao_Domain_Key_Checklist.md`

## 5) 진행 상태

- Status: Requested
- Requester: 인프라 팀
- Assignee: 프론트엔드 팀
- Requested At: 2025-08-13
- Completed At:
- History:
  - 2025-08-13: 요청서 발신
