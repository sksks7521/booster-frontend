# [인프라→프론트엔드] VWorld 도메인 목록 및 검증 절차 합의 요청 (완료) (2025-08-11)

## 1. 확정/제안 값

- VWorld API Key: 276AABBA-2990-3BAE-B46A-82A7FE6BE021
- 허용 도메인(제안, 확인 요청)
  - dev: `*.amplifyapp.com`
  - stg: `*.amplifyapp.com` (또는 `stg.budongsanbooster.com` 확정 시 교체)
  - prod: `www.budongsanbooster.com`

## 2. 검증 절차(합의안)

1. 키에 상기 도메인 등록 및 도메인 제한 적용
2. FE 스모크(지도 스크립트 로드 → 지도 렌더/줌/팬/마커 표시, 콘솔 에러 0)
3. 통합 분석 페이지 필터 → 지도/목록 동기화 확인

## 3. 진행 상태

- Status: Done
- Requester: 인프라 팀
- Assignee: 프론트엔드 팀
- Requested At: 2025-08-11
- Completed At: 2025-08-11
- History:
  - 2025-08-11: 프론트엔드 회신(VWorld 키 및 도메인 제안, 검증 절차 합의안) 완료
