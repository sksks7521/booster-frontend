# [인프라→프론트엔드] VWorld 허용 도메인 최종 확정 합의 요청 (보류/대체 안내 포함) (2025-08-13)

## 1) 요청 개요 (Why?)

- VWorld 키는 등록된 도메인에서만 동작하므로 환경별 허용 도메인을 최종 확정해야 배포 후 지도 로딩 오류를 방지할 수 있습니다.

## 2) 합의 요청 사항 (What & How?)

- [x] 환경별 허용 도메인 최종 확정
  - dev: `*.amplifyapp.com`
  - stg: `*.amplifyapp.com`, `stg.budongsanbooster.com`
  - prod: `www.budongsanbooster.com`
- [ ] 확정 후 VWorld 콘솔 등록 및 간단 스모크(로드/줌/팬/마커, 콘솔 에러 0) 진행 동의

### 보류/대체 안내

- VWorld 운영 전환 승인 대기(약 10일)로 콘솔 등록은 보류.
- 임시 대체: Kakao JS 지도 전환 진행(도메인 등록·JS 키 발급·ENV 반영 가이드 별도 전달).

## 3) 참고

- 절차 문서: `infra/standards/VWorld_Domain_Registration_Plan.md`
- 키 보관/주입: `infra/standards/ENV_SECRETS_MATRIX.md`

## 4) 진행 상태

- Status: Completed
- Requester: 인프라 팀
- Assignee: 프론트엔드 팀
- Requested At: 2025-08-13
- Completed At: 2025-08-13
- History:
  - 2025-08-13: 요청서 발신
  - 2025-08-13: 도메인 최종 확정 합의 완료 (VWorld 콘솔 등록은 운영 승인 후 착수, Kakao 전환 병행)
