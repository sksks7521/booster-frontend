# [요청] VWorld API 키/도메인 등록 및 Amplify 환경변수 설정, 빌드 환경 가이드

## 배경

- 프론트 지도 엔진을 `react-leaflet`에서 **vworld**로 전면 전환했습니다.
- vworld 사용을 위해 API 키와 도메인 등록이 필요합니다.
- Windows + OneDrive(한글 경로) 환경에서 Next.js SWC 바이너리 로드 이슈가 간헐 발생하여, 빌드 환경에 대한 가이드가 필요합니다.

## 요청사항

1. Amplify 환경변수 등록

   - 키: `NEXT_PUBLIC_VWORLD_API_KEY`
   - 값: (인프라에서 안전 저장 후 배포 브랜치별 주입)
   - 환경: dev / stg / prod 각각 등록

2. vworld 도메인 등록

   - 프론트 배포 도메인(dev/stg/prod) 모두 vworld 콘솔에 등록
   - 등록 완료 후 API 키가 유효한지 확인(간단한 테스트 URL 안내 가능)

3. 빌드 환경 가이드(권장)
   - Windows 환경에서 프로젝트 경로를 영문 경로로 이동하여 npm 설치/빌드를 수행
   - 대안: node_modules 초기화 후 재설치 → `npm run build` (WASM 강제 설정 포함됨)

## 참고

- 관련 변경사항 브랜치: `feature/vworld-map-and-ux`
- 주요 파일: `Application/components/features/map-view.tsx`, `Application/components/ui/data-state.tsx`, `Application/.eslintrc.json`
- 로그 업데이트: `Log/250808.md` (지도 엔진 전환/빌드 이슈 섹션 추가)
