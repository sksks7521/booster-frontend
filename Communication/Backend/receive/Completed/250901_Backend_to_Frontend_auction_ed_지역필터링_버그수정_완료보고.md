## 🛠️ Backend→Frontend | auction_ed 지역 필터링 버그 수정 완료 보고 (2025-09-01)

### 1) 요약

- 요청 문서: `250901_Frontend_to_Backend_auction_ed_지역필터링_버그수정_요청.md`
- 문제: `/api/v1/auction-completed/` 호출 시 `address_area`/`address_city` 필터가 무시되어 전체 데이터가 반환됨
- 조치: 루트 엔드포인트에서 지역 필터 파라미터 수신 및 CRUD 전달 로직 추가(레거시 호환 유지)
- 결과: 지정 지역(예: 경기도 고양시) 데이터만 페이징되어 응답

### 2) 원인

- 루트 엔드포인트(`/api/v1/auction-completed/`)가 지역 필터 파라미터를 정의하지 않아, 내부 CRUD 호출 시 `sido/address_city` 인자가 전달되지 않았음 → 전체 데이터 기준 페이징 발생

### 3) 조치 내역 (코드 반영)

- 파일: `app/api/v1/endpoints/auction_completed.py`
  - 루트 엔드포인트에 다음 파라미터 추가 및 매핑
    - `address_area: Optional[str]` → CRUD의 `sido`로 전달
    - `address_city: Optional[str]` → CRUD의 `address_city`로 전달
- CRUD(`app/crud/crud_auction_completed.py`)는 이미 `sido/address_city` 조건을 지원하고 있어 추가 수정 불필요

### 4) 검증 방법

- cURL

```bash
curl -G "http://127.0.0.1:8000/api/v1/auction-completed/" \
  --data-urlencode "address_area=경기도" \
  --data-urlencode "address_city=경기도 고양시" \
  --data-urlencode "page=1" \
  --data-urlencode "size=20"
```

- 브라우저 콘솔

```javascript
fetch(
  "http://127.0.0.1:8000/api/v1/auction-completed/?address_area=" +
    encodeURIComponent("경기도") +
    "&address_city=" +
    encodeURIComponent("경기도 고양시") +
    "&page=1&size=20"
)
  .then((r) => r.json())
  .then((d) => {
    console.log("total:", d.total, "items:", d.items.length);
    console.log("sample:", d.items?.[0]);
  });
```

### 5) 기대 응답 (예시)

```json
{
  "items": [
    {
      "road_address": "경기도 고양시 …",
      "sido": "경기도",
      "address_city": "경기도 고양시",
      "final_sale_price": 12345.0,
      "sale_year": 2023
      // … 기타 필드
    }
  ],
  "total": "(경기도 고양시 레코드 수)",
  "page": 1,
  "size": 20,
  "total_pages": "…"
}
```

### 6) 회귀 테스트 체크리스트

- [ ] 필터 미지정 시: 전체 데이터 페이징 정상
- [ ] `address_area`만 지정: 해당 시도 전체 반환
- [ ] `address_area`+`address_city` 지정: 해당 시군구만 반환
- [ ] 기타 필터(가격/연도/정렬)와 동시 사용 시 조합 동작 정상

### 7) 안내 사항 (프론트엔드)

- 파라미터 매핑 유지: `province` → `address_area`, `cityDistrict` → `address_city`
- 공백/한글은 반드시 URL 인코딩하여 전달 (예: `encodeURIComponent`)

### 8) 참고

- 엔드포인트: `GET /api/v1/auction-completed/` (레거시 호환 루트)
- 내부 동작: `address_area` → CRUD의 `sido`, `address_city` → 동일 전달 → SQL WHERE 조건 적용

### 9) 추가 문의 대응

- 추가 필터 케이스/정렬 옵션이 더 필요하면 요청 부탁드립니다. 즉시 확장 가능합니다.

—
Backend Team 드림
