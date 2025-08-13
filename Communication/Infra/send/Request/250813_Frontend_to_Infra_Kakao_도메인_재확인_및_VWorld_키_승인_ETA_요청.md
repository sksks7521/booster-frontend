# [Frontend→Infra] Kakao 도메인 재확인 및 VWorld 키 승인 ETA 요청 (2025-08-13)

## 배경

- 프론트는 `.env.local`에 `NEXT_PUBLIC_MAP_PROVIDER=kakao`, `NEXT_PUBLIC_KAKAO_APP_KEY=<issued>` 적용하여 임시 Kakao 지도 사용 중입니다.
- `127.0.0.1:3000` 접근 시 지도 초기화 대기 메시지가 간헐 노출되어, 도메인 허용 재확인이 필요합니다.
- VWorld 운영 키 승인 완료 전까지 Kakao 사용, 승인 시 `NEXT_PUBLIC_VWORLD_API_KEY`로 전환 예정입니다.

## 요청 사항

1. Kakao JavaScript 키 도메인 허용 목록 재확인
   - 로컬: `http://localhost:3000`, `http://127.0.0.1:3000`
   - 배포(예정): Amplify 생성 후 제공되는 Preview/Prod 도메인 전부 등록
2. 키 값/권한 확인
   - `NEXT_PUBLIC_KAKAO_APP_KEY`가 Web JS용이며, Referer 검증 활성화 상태 확인
3. VWorld 운영 키 승인 ETA 회신 요청
   - 승인 예상일자 및 제한사항(쿼터) 고지 요청
4. Amplify 환경변수 등록 메모
   - `NEXT_PUBLIC_MAP_PROVIDER`, `NEXT_PUBLIC_KAKAO_APP_KEY`, `NEXT_PUBLIC_VWORLD_API_KEY`, `NEXT_PUBLIC_API_BASE_URL`

## 참고

- 프론트 확인 로그: `/analysis` 목록 렌더링 정상(Items Simple 200 OK)
- 지도 탭: ENV 주입 후 dev 재기동 및 도메인 허용 확인 필요

감사합니다.
