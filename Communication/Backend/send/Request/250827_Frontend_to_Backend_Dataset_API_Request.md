# 상세 분석 v2 데이터셋 API 통합 계약 요청서

## 1. 목적

- 프론트에서 `과거경매결과 / 실거래가(매매) / 실거래가(전월세) / 네이버매물`을 하나의 공통 UI/로직으로 운영하기 위해,
- 4개 데이터셋이 공통된 API 계약(페이징/정렬/필터/지도 범위/공통 필드)을 따르도록 표준화 요청드립니다.

## 2. 공통 계약(필수)

- Base URL: 기존 `/api/v1/...`
- 응답(공통)

```json
{
  "items": [
    {
      /* 레코드 */
    }
  ],
  "total": 1234,
  "page": 1,
  "size": 20,
  "pages": 62
}
```

- 에러(공통)

```json
{ "message": "설명", "status": 400, "detail": {} }
```

- 공통 쿼리 파라미터
  - `page`: number, 1-base
  - `limit`: number (권장 기본 20, 최대 100)
  - `sort_by`: string
  - `sort_order`: "asc" | "desc"
  - 지도 범위: `south`, `west`, `north`, `east` (bbox) 또는 `lat`, `lng`, `radius_km`
  - 공통 필터:
    - `price_min`, `price_max` (만원)
    - `area_min`, `area_max` (㎡)
    - `build_year_min`, `build_year_max`
    - 날짜 범위: `start_date`, `end_date` (YYYY-MM-DD)
- 공통 필드(각 레코드에 필수)
  - `id`: string|number
  - `address`: string
  - `lat`: number, `lng`: number (WGS84, 필드명 고정)
  - `area`: number(㎡), `build_year`: number
  - `price`: number|null (데이터셋 기준 가격, 예: 낙찰가/거래가/호가)

## 3. 데이터셋별 스펙

### 3.1 과거경매결과 (auction_ed)

- Endpoint: `GET /api/v1/auction-completed/`
- 추가 필터:
  - `auction_date_start`, `auction_date_end`
  - `bid_count_min`, `bid_count_max` (선택)
- 정렬 허용: `auction_date`, `final_price`, `area`
- 응답 `items[*]` 확장 필드:
  - `final_price`: number (만원) → `price`에 매핑 가능하면 `price`도 함께
  - `auction_date`: "YYYY-MM-DD"
  - `bid_count`: number
- 예시 : GET /api/v1/auction-completed/?page=1&limit=20&sort_by=auction_date&sort_order=desc&south=37.0&west=126.7&north=37.8&east=127.3&price_min=0&price_max=500000

### 3.2 실거래가(매매) (sale)

- Endpoint: `GET /api/v1/real-transactions/`
- 추가 필터: `transaction_date_start`, `transaction_date_end`, `transaction_type`(일반/분양 등)
- 정렬 허용: `transaction_date`, `price`, `area`
- 응답 확장:
  - `transaction_date`, `transaction_type`
  - `price_per_area`: number(만원/㎡) (가능 시)

### 3.3 실거래가(전월세) (rent)

- Endpoint: `GET /api/v1/real-rents/`
- 추가 필터: `contract_date_start`, `contract_date_end`, `rent_type`(전세/월세)
- 정렬 허용: `deposit`, `monthly_rent`, `contract_date`, `area`
- 응답 확장:
  - `deposit`, `monthly_rent`, `rent_type`, `contract_date`
  - `price` 필드는 `deposit` 또는 `deposit+월환산` 중 어떤 기준인지 명시(프론트 표시에 필요)

### 3.4 네이버매물 (naver)

- Endpoint: `GET /api/v1/naver-products/` (제공 엔드포인트 명확화 필요)
- 추가 필터: `property_type`, `posted_from`, `posted_to`, `price_min/max`
- 정렬 허용: `posted_at`, `price`, `area`
- 응답 확장:
  - `property_type`, `posted_at`, `source_url`, `thumbnail?`

## 4. 컬럼 메타(선택)

- Endpoint: `GET /api/v1/{dataset}/columns`
- 응답:

```json
[
  {
    "key": "address",
    "label": "주소",
    "type": "string",
    "sortable": true,
    "filterable": true
  },
  {
    "key": "final_price",
    "label": "낙찰가(만원)",
    "type": "number",
    "unit": "만원",
    "sortable": true
  }
]
```

## 5. 좌표/지도

- 모든 응답은 `lat`, `lng`(float, WGS84) 고정 키로 제공
- BBOX 쿼리 또는 중심/반경 중 1가지 방식을 필수 지원
- 범례는 프론트에서 계산 가능하나, 필요 시 가격 구간 기준 제공 가능

## 6. 샘플 응답(auction_ed)

```json
{
  "items": [
    {
      "id": 101,
      "address": "서울시 강남구 역삼동 123-45",
      "lat": 37.5,
      "lng": 127.03,
      "area": 25,
      "build_year": 2010,
      "price": 45000,
      "final_price": 45000,
      "auction_date": "2025-02-15",
      "bid_count": 8
    }
  ],
  "total": 123,
  "page": 1,
  "size": 20,
  "pages": 7
}
```

## 7. 추가 요청

- 날짜 포맷 ISO-8601(YYYY-MM-DD)
- 빈 칸은 null로(빈 문자열 지양), 수치형은 number 타입
- 성능: 최대 limit, 응답 SLA, 타임아웃/에러 메시지 일관화
