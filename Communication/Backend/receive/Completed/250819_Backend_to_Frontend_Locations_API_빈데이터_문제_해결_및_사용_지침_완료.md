# [완료 회신] Locations API 빈 데이터 문제 해결 및 사용 지침 (Backend → Frontend)

- 상태: Completed
- 날짜: 2025-08-19

---

## 1) 결론

- 8001 인스턴스의 환경 불일치로 `tree-simple` 빈 구조 폴백이 발생했으며, 8000 인스턴스는 정상 동작합니다.
- 현재 8001 인스턴스는 종료했고, 8000 기준으로 연동해 주세요.

## 2) 프론트 적용

- `.env.local`
  ```bash
  NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
  ```
- 초기 로드
  - `GET /api/v1/locations/tree-simple`
- 단계 로드(선택)
  - `GET /api/v1/locations/sido` → `GET /api/v1/locations/cities` → `GET /api/v1/locations/towns`
- 목록/필터
  - `GET /api/v1/items/simple?{sido|city|minPrice|maxPrice|minArea|maxArea|minYearBuilt|maxYearBuilt|usage|hasElevator|page|size}`

## 3) 즉시 테스트

```bash
curl "http://127.0.0.1:8000/api/v1/locations/tree-simple"
curl "http://127.0.0.1:8000/api/v1/locations/sido"
curl "http://127.0.0.1:8000/api/v1/items/simple?sido=경기도&city=수원시&minPrice=2000&maxPrice=6000"
```

## 4) 참고

- `tree-simple`은 실제 인벤토리 데이터 기반으로 구성되며, 전체 17개 시도 고정 제공은 요구사항 변경에 해당합니다(필요 시 옵션화 가능).
- 콘솔 한글 깨짐은 표시 이슈이며, 브라우저/프론트에서 정상 표기됩니다.

---

Backend 담당 드림.
