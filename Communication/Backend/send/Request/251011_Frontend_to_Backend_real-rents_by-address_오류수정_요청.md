# 실거래가(전월세) 주소별 조회(by-address) 엔드포인트 오류 수정 요청

## 배경/목적

- 전월세 지도 팝업에서 같은 주소의 거래 내역을 테이블로 표시하기 위해 `GET /api/v1/real-rents/by-address`를 호출합니다.
- 현재 라우팅 충돌로 `by-address` 경로가 동적 `/{rent_id}`로 매칭되어 422가 발생합니다. 프런트 지도 팝업이 빈 상태가 되어 UX에 영향이 큽니다.

## 현재 증상(재현 로그)

- 요청 예시 1

```bash
curl -i "http://127.0.0.1:8000/api/v1/real-rents/by-address?address=%EC%A0%84%EB%B6%81%ED%8A%B9%EB%B3%84%EC%9E%90%EC%B9%98%EB%8F%84%20%EC%9D%B5%EC%82%B0%EC%8B%9C%20%EC%84%A0%ED%99%94%EB%A1%9C6%EA%B8%B8%2040-5&size=10&ordering=-contract_date"
```

- 응답

```http
HTTP/1.1 422 Unprocessable Entity
content-type: application/json

{"message":"Validation Error","status":422,"detail":[{"type":"int_parsing","loc":["path","rent_id"],"msg":"Input should be a valid integer, unable to parse string as an integer","input":"by-address"}]}
```

- 요청 예시 2

```bash
curl -i "http://127.0.0.1:8000/api/v1/real-rents/by-address?address=%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EC%9A%A9%EB%A7%88%EC%82%B0%EB%A1%9C28%EA%B8%B8%2051&size=10&ordering=-contract_date"
```

- 응답 동일(422, path rent_id int parsing)

## 원인 추정

- FastAPI 라우팅 우선순위 문제로 `GET /api/v1/real-rents/{rent_id}`가 `GET /api/v1/real-rents/by-address`보다 먼저 매칭되고 있습니다.
- 결과적으로 `by-address` 문자열이 `rent_id`로 파싱 시도되어 422 발생.

## 요청 사항

1. 라우팅 우선순위/정의 수정

- 정적 경로를 동적 경로 위에 선언하거나, 별도 prefix로 분리해 주세요.
- 제안 A: 아래 순서로 선언
  - `GET /api/v1/real-rents/by-address`
  - `GET /api/v1/real-rents/` (리스트)
  - `GET /api/v1/real-rents/{rent_id}` (상세)
- 제안 B: 경로 분리
  - `GET /api/v1/real-rents/search/by-address`

2. 파라미터/응답 스펙 확정

- Query Params
  - `address`: string (도로명/지번 모두 허용)
  - `size`: int, 기본 1000
  - `ordering`: string, 기본 `-contract_date` (허용키: `contract_date`, `deposit_amount`, `monthly_rent`, `exclusive_area_sqm`)
- Response Body

```json
{
  "items": [
    {
      "id": 5605906,
      "sido": "전북특별자치도",
      "sigungu": "익산시",
      "road_address_real": "...",
      "building_name_real": "...",
      "rent_type": "월세|전세",
      "contract_type": "신규|갱신",
      "deposit_amount": 5000,
      "monthly_rent": 22,
      "jeonse_conversion_amount": 10280,
      "exclusive_area_sqm": 31.02,
      "contract_year": 2025,
      "contract_month": 7,
      "contract_day": null,
      "contract_date": null,
      "floor_info_real": "5",
      "latitude": 35.94708,
      "longitude": 126.93362,
      "elevator_available": true,
      "...": "기타 컬럼들 (/columns와 동일 네이밍)"
    }
  ],
  "total": 123
}
```

- 컬럼 키 네이밍은 `/api/v1/real-rents/columns`의 `key`와 일치(스네이크 케이스).

3. CORS/권한

- 동일 도메인 프런트 호출 허용, 인증 불요(공개 데이터)라면 200 응답 일관 보장.

## 프런트 연동 포인트(참고)

- 지도 팝업 로더
  - rent: `realRentApi.getRentsByAddress(address)`
  - sale: `realTransactionApi.getTransactionsByAddress(address)`
- 팝업 스키마
  - rent: `components/map/popup/schemas/rent.ts` (현재는 매매 스키마 복사본, 추후 전월세 전용으로 조정 예정)

## 수락 기준(검증 체크리스트)

- [ ] `GET /api/v1/real-rents/by-address?...` 200 OK
- [ ] 주소에 따라 `items[]`가 반환되고 `total`이 일관
- [ ] 정렬 파라미터 `ordering=-contract_date` 적용됨
- [ ] 컬럼 키가 `/columns`와 1:1 매칭
- [ ] 404/422 라우팅 오류 재발 없음(동적 상세 라우트와 충돌 해결)

## 타임라인 제안

- 라우팅 수정 및 배포: 0.5d
- 스펙 확인/QA: 0.5d
- 프런트 폴백 제거 및 최종 연동: 0.5d

감사합니다. 수정 배포 되면 알려주시면 즉시 프런트 팝업(전월세)에서 재검증하겠습니다.
