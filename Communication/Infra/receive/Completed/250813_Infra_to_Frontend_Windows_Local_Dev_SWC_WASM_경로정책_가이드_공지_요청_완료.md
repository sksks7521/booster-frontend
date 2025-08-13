# [인프라→프론트엔드] Windows 로컬 개발 SWC WASM/경로정책 가이드 공지 요청 (완료) (2025-08-13)

- 수신 측(프론트엔드) 완료 회신 접수에 따라 발신 측(인프라) Completed 동기화 문서입니다.

## 1) 완료 요약

- 프론트엔드 README/온보딩 반영 및 공지 채널 공지 완료
- 가이드 링크: `booster-infra/infra/standards/Windows_Local_Dev_SWC_WASM_Policy.md`

## 2) 진행 상태

- Status: Done
- Requester: 인프라 팀
- Assignee: 프론트엔드 팀
- Completed At: 2025-08-13

# [인프라→프론트엔드] Windows 로컬 개발 SWC WASM/경로정책 가이드 공지 요청 (2025-08-13)

## 1. 요청 개요 (Why?)

- Windows + OneDrive + 한글 경로 환경에서 Next.js SWC 네이티브 바이너리 로딩 실패 이슈가 반복되어, 팀 공통 표준 가이드의 공지가 필요합니다.
- 백엔드 승인서 기준으로 가이드를 확정했으며, 프론트 저장소 README/온보딩에 링크 반영 및 공지 채널 공지를 요청드립니다.

## 2. 작업 요청 사항 (What & How?)

- [ ] 프론트 저장소 `README.md`에 가이드 링크 섹션 추가
  - 섹션명: "Windows 로컬 개발 환경 가이드(SWC WASM/경로 정책)"
  - 핵심 항목: 영문 경로 운영(예: `C:\\work\\booster-frontend`), OneDrive 제외 권고, `NEXT_SWC_WASM=1`, `NEXT_DISABLE_SWC_BINARY=1`
  - 링크: `booster-infra/infra/standards/Windows_Local_Dev_SWC_WASM_Policy.md`
- [ ] 온보딩 체크리스트에 동일 항목 추가
- [ ] 인프라 공지 채널 공지(가이드 링크 및 핵심 요약 포함)

## 3. 참고 자료 (Reference)

- 승인 문서: `infra/standards/Windows_Local_Dev_SWC_WASM_Policy.md`
- 백엔드 승인 완료 문서: `Communication/Backend/receive/Completed/250811_Infra_to_Backend_Windows_Local_Dev_SWC_WASM_경로정책_가이드_배포_승인_요청_완료.md`
- FE 임시 조치: `Application/package.json`의 `dev:msw`(WASM 강제)

## 4. 진행 상태

- Status: Completed
- Requester: 인프라 팀
- Assignee: 프론트엔드 팀
- Requested At: 2025-08-13
- Completed At: 2025-08-13
- History:
  - 2025-08-13: 공지 요청서 발신
  - 2025-08-13: 프론트 README 가이드 섹션 추가 반영 완료 → `README.md`(Windows 로컬 개발 환경 가이드)
