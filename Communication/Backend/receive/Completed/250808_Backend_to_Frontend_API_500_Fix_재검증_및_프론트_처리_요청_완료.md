# [Backend→Frontend] API 500 오류 조치 완료에 따른 재검증 및 프론트 처리 요청 (2025-08-08)

## 1) 배경 및 요약

- 프론트 연동 중 발생한 주요 데이터 엔드포인트 500 오류를 조치 완료했습니다.
- 원인 및 조치
  - `/api/v1/auction-completed/`: CRUD 반환 `(items, total_count)` 언패킹 누락 → 엔드포인트에서 언패킹 적용, 200 정상화
  - `/api/v1/real-rents/`: 매매용 CRUD/스키마 잘못 참조 → 전월세용 CRUD/스키마로 교체, 파라미터/응답 정합화
- Swagger(OpenAPI)와 실제 응답 스키마 동기화 확인 완료

## 2) 프론트엔드 요청 사항 (Action Items)

- 재검증(스모크 테스트)
  - [x] `GET /api/v1/items/simple?limit=1` → 200
  - [x] `GET /api/v1/items/?limit=1` → 200
  - [x] `GET /api/v1/auction-completed/?limit=1` → 200
  - [x] `GET /api/v1/real-transactions/?limit=1` → 200
  - [x] `GET /api/v1/real-rents/?limit=1` → 200
- 에러/빈 상태 처리
  - [ ] 현재 운영 DB에는 데이터가 비어 있을 수 있음 → 빈 목록(`items: []`, `total_items: 0`) UI 처리 필요
  - [ ] 4xx/5xx 발생 시 사용자 친화적 메시지 노출 및 재시도 가이드 표준화
- 파라미터/응답 필드
  - [x] 기본 `limit`=20, `skip`=0. 최초 연동 뷰에서 `limit` 명시 권장(예: 20) → `Application/lib/api.ts`에 기본값 주입 완료
  - [ ] 응답 필드 네이밍: 목록 응답은 `total_items`, `items`(snake_case)
  - [ ] 간소 뷰(Simple) 스키마는 일부 camelCase 필드 사용(Auction/RealRent Simple)
- 환경변수/베이스 URL
  - [x] `NEXT_PUBLIC_API_BASE_URL`가 `http://127.0.0.1:8000` 또는 `http://localhost:8000`로 정확히 매칭되는지 확인 (로컬 적용 확인)
  - [ ] CORS는 `http://localhost:3000` 허용. 개발 서버 포트가 다르면 공유 요청 바랍니다.

## 3) 호출 예시 (로컬)

```bash
# 헬스 체크
curl -s http://127.0.0.1:8000/health

# 스모크 테스트(모두 200 기대)
curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/items/simple?limit=1"
curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/items/?limit=1"
curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/auction-completed/?limit=1"
curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/real-transactions/?limit=1"
curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/real-rents/?limit=1"
```

## 4) Swagger/OpenAPI 기준(발췌)

- `GET /api/v1/auction-completed/` → `AuctionCompletedsResponse { total_items: int, items: AuctionCompleted[] }`
- `GET /api/v1/real-rents/` → `RealRentsResponse { total_items: int, items: RealRent[] }`

## 5) 향후 일정/협업 포인트

- 데이터 로딩(샘플→부분→전체) 순차 진행 예정. 스모크 테스트용 실제 아이템 ID는 데이터 로딩 후 즉시 공유
- 추가 엔드포인트 스키마 불일치 발견 시 알려주시면 즉시 정합화하겠습니다.

## 6) 문의

- Backend 팀: booster-backend@local

---

- Status: Request
- Requested At: 2025-08-08
- Assignee: Frontend 팀

---

## 7) 프론트엔드 재검증 결과 (2025-08-08 16:20)

- 호출 환경: Windows PowerShell, curl
- 베이스 URL: `http://127.0.0.1:8000`

체크리스트 결과(3회 반복 호출):

- [x] `GET /api/v1/items/simple?limit=1` → 200 OK
- [x] `GET /api/v1/items/?limit=1` → 200 OK
- [x] `GET /api/v1/auction-completed/?limit=1` → 200 OK
- [x] `GET /api/v1/real-transactions/?limit=1` → 200 OK
- [x] `GET /api/v1/real-rents/?limit=1` → 200 OK

메모:

- 과거 간헐 500 이슈는 재현되지 않았으며, 현재 3회 반복 모두 200 OK로 안정화 확인.

프론트 처리 상황:

- 빈 목록/에러 상태 UI 처리 가이드 적용 준비됨(표준 메시지 + 재시도 버튼)
- 최초 뷰 `limit=20` 자동 적용(`lib/api.ts` 기본값)
- 상세페이지 Comparables 연동(SWR) 완료

요청 액션(추가):

- [ ] 위 3개 엔드포인트의 서버 로그 스택 트레이스 확인 및 조치
- [ ] 불안정한 응답(간헐적 200→500) 재현 경로 공유 부탁드립니다.

Status: In-Progress (프론트)
