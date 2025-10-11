# [답신] 실거래가(전월세) by-address 엔드포인트 라우팅 오류 수정 완료

- 날짜: 2025-10-11
- 발신: Backend Team
- 수신: Frontend Team
- 대상 API: `GET /api/v1/real-rents/by-address`

## 1) 결론

- 라우팅 충돌(동적 `/{rent_id}` 우선 매칭) 원인을 제거했습니다. 정적 경로 `/by-address`를 동적 경로보다 먼저 선언해 422가 재발하지 않습니다.
- 주소 검색은 도로명/지번을 OR로 동시에 검색합니다.

## 2) 엔드포인트/스펙

- 메서드: `GET /api/v1/real-rents/by-address`
- Query Params
  - `address`: string, 필수 (도로명/지번 모두 허용)
  - `size`: int, 기본 1000, 최대 2000
  - `ordering`: string, 기본 `-contract_date` (허용키: `contract_date`, `deposit_amount`, `monthly_rent`, `exclusive_area_sqm`)
- Response Body
  - `{ items: Item[], total: number }`
  - `items[]`의 컬럼 키는 `/api/v1/real-rents/columns`의 `key`와 1:1 매칭(스네이크 케이스). 계산 필드(`exclusive_area_pyeong`, `deposit_per_pyeong`, `monthly_rent_per_pyeong`, `rental_yield_monthly`, `rental_yield_annual`) 포함.

## 3) 구현 메모

- 라우팅: 정적 `/by-address`를 동적 `/{rent_id}` 위에 선언하여 우선 매칭 보장.
- 주소검색: `address_search_type=both`로 도로명(`road_address_real`) 또는 지번(`jibun_address`) OR 검색.
- 권한: 공개 데이터로 인증 불요(기존 정책 유지). 동일 도메인 호출 정상 동작.

## 4) 빠른 검증

```bash
curl -i "http://127.0.0.1:8000/api/v1/real-rents/by-address?address=%EC%A0%84%EB%B6%81%ED%8A%B9%EB%B3%84%EC%9E%90%EC%B9%98%EB%8F%84%20%EC%9D%B5%EC%82%B0%EC%8B%9C%20%EC%84%A0%ED%99%94%EB%A1%9C6%EA%B8%B8%2040-5&size=10&ordering=-contract_date"

curl -i "http://127.0.0.1:8000/api/v1/real-rents/by-address?address=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EC%9A%A9%EB%A7%88%EC%82%B0%EB%A1%9C28%EA%B8%B8%2051&size=10&ordering=-contract_date"
```

## 5) 수락 기준 체크

- [x] 200 OK 응답
- [x] 주소에 따라 `items[]`와 `total` 일관성
- [x] `ordering=-contract_date` 적용
- [x] 컬럼 키 `/columns`와 1:1 매칭
- [x] 동적 상세 라우트와 충돌 없음(422 미발생)

## 6) 확인 요청(선택)

- `ordering` 허용 키에 추가 희망 항목(예: `jeonse_conversion_amount`)이 있으면 알려주세요.
- `size` 기본/최대값 조정 필요 여부(현: 1000/2000).

감사합니다. 수정 반영 후 지도 팝업에서 재검증하시고, 이슈 있으면 알려주세요.
