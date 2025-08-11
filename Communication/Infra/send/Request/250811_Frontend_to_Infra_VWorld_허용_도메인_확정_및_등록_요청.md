# [프론트엔드→인프라] VWorld 허용 도메인 최종 확정 및 등록 요청 (2025-08-11)

## 1. 요청 개요 (Why?)

- vworld 지도 엔진은 키에 등록된 도메인에서만 스크립트가 정상 동작합니다. 환경별 도메인을 사전 확정/등록해야 배포 후 지도 로딩 오류를 방지할 수 있습니다.

## 2. 작업 요청 사항 (What & How?)

- [ ] 환경별 허용 도메인 확정
  - dev: `*.amplifyapp.com` (브랜치 배포 기본 도메인)
  - stg: `*.amplifyapp.com` 또는 `stg.budongsanbooster.com`(확정 시 교체)
  - prod: `www.budongsanbooster.com`
- [ ] VWorld 콘솔에 상기 도메인 등록 및 도메인 제한 적용
- [ ] 적용 후 프론트 스모크(지도 스크립트 로드/렌더/줌/팬/마커, 콘솔 에러 0) 진행 합의

## 3. 관련 정보 (Reference)

- VWorld API Key: 276AABBA-2990-3BAE-B46A-82A7FE6BE021
- 전환 정책: react-leaflet 제거, vworld 사용(지도 키 필요)
- 문서: `Doc/FRONTEND_ARCHITECTURE.md`, `Log/250811.md`

## 4. 진행 상태

- Status: Requested
- Requester: 프론트엔드 팀
- Assignee: 인프라 팀
- Requested At: 2025-08-11
- Completed At:
- History:
  - 2025-08-11: 요청서 작성
