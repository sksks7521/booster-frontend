# [Frontend 구현 완료] Analysis 페이지 필터 데이터 사양 및 연동 가이드 (Backend → Frontend)

- 상태: **Frontend Implementation Completed**
- 백엔드 가이드 수신일: 2025-08-17
- 프론트엔드 구현 완료일: 2025-01-17
- 현재 상태: 백엔드 서버 연동 대기 중

---

## ✅ **프론트엔드 구현 완료 요약**

### **구현 완료 사항**

- ✅ `Application/hooks/useLocations.ts` - 주소 데이터 API 연동 훅
- ✅ `Application/hooks/useItems.ts` - 백엔드 명세 기반 필터 매핑 업데이트
- ✅ `Application/store/filterStore.ts` - 지역 코드 및 새 필터 필드 추가
- ✅ `Application/components/features/filter-control.tsx` - Select 드롭다운 지역 선택 UI
- ✅ 층수 필터 "미적용" 경고 메시지 표시
- ✅ `hasParking` 필터 제거 (데이터 없음)

### **백엔드 서버 연동 대기**

- 현재 백엔드 서버 상태 확인 요청 발송: `Communication/Backend/send/Request/250117_Frontend_to_Backend_Analysis_필터_연동_백엔드_상태_확인_요청.md`

---

## 1) 결론(요약) - 백엔드 가이드 원문

- 주소 기반 필터(시도 → 시군구 → 읍면동)는 이미 백엔드에서 **동적으로 제공/필터링 가능**합니다. 별도의 정적 데이터 파일을 프론트가 보관할 필요가 없습니다.
- 프론트는 다음 중 하나를 선택해 사용하세요.
  - 일괄 로드: `GET /api/v1/locations/tree` 또는 `GET /api/v1/locations/tree-simple`
  - 단계 로드: `GET /api/v1/locations/sido` → `GET /api/v1/locations/cities` → `GET /api/v1/locations/towns`
- 아이템 조회는 코드 기반으로 `GET /api/v1/items/simple`에 `sido_code/city_code/town_code`를 전달하면 됩니다(이름 별칭도 호환).

---

## 2) 데이터 소스/테이블 및 파일 경로(참고)

- **DB 테이블명**: `auction_items`
- **SQLAlchemy 모델**: `app/models/auction_item.py` (`class AuctionItem`)
- **Pydantic 스키마**: `app/schemas/auction_item.py` (`AuctionItemSimple`, `AuctionItemsSimpleResponse`)
- **CRUD 로직**: `app/crud/crud_auction_item.py` (`get_auction_items_with_filters`)
- **아이템 엔드포인트**: `app/api/v1/endpoints/auction_items.py`
- **주소 엔드포인트**: `app/api/v1/endpoints/locations.py`

---

## 3) 주소 API

- 일괄 트리(카운트+ETag)

  - `GET /api/v1/locations/tree?includeCounts=true`
  - `HEAD /api/v1/locations/tree` → `ETag`/`Last-Modified`
  - `GET ...` + `If-None-Match: <etag>` → `304 Not Modified`

- 프론트 샘플 상수와 동일 구조(SAMPLE_ADDRESSES 형태)

  - `GET /api/v1/locations/tree-simple`
  - 응답 예:
    ```json
    {
      "provinces": ["서울특별시", "경기도"],
      "cities": { "서울특별시": ["강남구", "서초구"] },
      "districts": { "강남구": ["역삼동", "삼성동"] }
    }
    ```

- 단계별(지연 로딩)
  - 시도: `GET /api/v1/locations/sido` → `[ { code, name, count } ]`
  - 시군구: `GET /api/v1/locations/cities?sido=<이름>` 또는 `?sido_code=<코드>`
  - 읍면동: `GET /api/v1/locations/towns?sido=<이름>&city=<이름>` 또는 `?city_code=<코드>`

---

## 4) 아이템 목록 API 및 필터 매핑

- 권장 엔드포인트(간소 응답): `GET /api/v1/items/simple`
- 지역(코드 우선): `sido_code`, `city_code`, `town_code` (이름 별칭 `province|cityDistrict|town`도 지원, 마지막 `region`)
- 기타 필터: `buildingType`(→`usage`), `minPrice|maxPrice`(만원), `minArea|maxArea`(평), `minBuildYear|maxBuildYear`, `hasElevator`, `auctionStatus`
- 유의사항: `hasParking` 데이터 없음(null), `floor` 필터는 현재 미적용(표시만)

응답 예시(간소):

```json
{
  "totalItems": 4321,
  "items": [
    {
      "id": 101,
      "title": "한빛빌라 101동",
      "address": "서울특별시 강남구 테헤란로 100",
      "price": 65000,
      "area": 24.8,
      "buildYear": 2005,
      "lat": 37.498,
      "lng": 127.028,
      "auctionDate": "2025-09-10",
      "status": "진행중",
      "floor": "지상 3층",
      "hasElevator": true,
      "hasParking": null,
      "estimatedValue": 82000
    }
  ]
}
```

---

## 5) 권장 연동 흐름

- 초기: `GET /api/v1/locations/tree-simple` 로 상태 초기화(SWR/React Query 캐시) → 시도/시군구/읍면동 버튼 생성
- 선택 코드로 아이템 조회: `GET /api/v1/items/simple?sido_code=<s>&city_code=<c>&town_code=<t>&minPrice=...`

샘플 호출:

```
GET /api/v1/items/simple
  ?sido_code=<s>&city_code=<c>&town_code=<t>
  &buildingType=다세대(빌라)
  &minPrice=30000&maxPrice=90000
  &minArea=15&maxArea=40
  &minBuildYear=1995
  &hasElevator=true
  &auctionStatus=진행중
  &page=1&limit=20
```

---

## 6) ✅ 프론트엔드 구현 완료 체크리스트

- [x] **API 연동 훅**: `useLocationsSimple()` - `/api/v1/locations/tree-simple` 연동 준비 완료
- [x] **필터 매핑**: `useItems.ts` - 백엔드 명세에 따른 모든 필터 매핑 완료
- [x] **지역 선택 UI**: Select 드롭다운으로 시도/시군구/읍면동 선택 구현
- [x] **필터 스토어**: `sido_code`, `city_code`, `town_code` 필드 추가
- [x] **UI 경고**: `hasParking` 제거, `floor` 필터 "미적용" 경고 표시

### **백엔드 서버 연동 대기 중**

- [ ] 백엔드 서버 실행 및 CORS 설정 확인 필요
- [ ] 실제 API 응답 수신 및 데이터 표시 확인 필요

---

## 7) ✅ 구현 완료 요약

### **프론트엔드 구현 완료 파일**

- `Application/hooks/useLocations.ts` - 주소 API 연동 훅
- `Application/hooks/useItems.ts` - 매물 API 연동 및 필터 매핑
- `Application/store/filterStore.ts` - 필터 상태 관리
- `Application/components/features/filter-control.tsx` - 필터 UI 컴포넌트

### **백엔드 연동 대기 사항**

- **서버 실행**: FastAPI 서버 실행 확인 필요
- **CORS 설정**: `localhost:3000` 허용 확인 필요
- **데이터베이스**: `auction_items` 테이블 데이터 확인 필요

### **백엔드 참고 파일**

- OpenAPI: 로컬 `/docs` (서버 실행 후 확인 가능)
- 테스트: `tests/test_api_auction_items.py`
- 백엔드 API: `app/api/v1/endpoints/locations.py`, `app/api/v1/endpoints/auction_items.py`

**✅ 프론트엔드 작업 완료 - 백엔드 서버 연동 대기 중**

# [완료 회신] Analysis 페이지 필터 데이터 사양 및 연동 가이드 (Backend → Frontend)

- 상태: Completed
- 날짜: 2025-08-17
- 문서 경로(제안): `Communication/Frontend/send/Completed/250817_Backend_to_Frontend_Analysis_Filters_데이터사양_및_연동가이드_완료.md`

---

## 1) 목적

Analysis 페이지의 필터(지역/가격/면적/건축연도/유형/엘리베이터/상태 등)를 백엔드 실데이터와 정확히 연동하기 위한 API·스키마·파라미터 매핑을 제공합니다. “시도 → 시군구 → 읍면동” 단계 선택 시, 백엔드가 제공하는 코드 기반 필터를 사용해 안전하게 조회할 수 있습니다.

---

## 1-1) 데이터 소스/테이블 및 파일 경로(참고)

- **DB 테이블명**: `auction_items` (진행 중 경매 데이터)
- **SQLAlchemy 모델**: `app/models/auction_item.py` (`class AuctionItem`)
- **Pydantic 스키마**: `app/schemas/auction_item.py` (`AuctionItemSimple`, `AuctionItemsSimpleResponse` 등)
- **CRUD 로직**: `app/crud/crud_auction_item.py` (`get_auction_items_with_filters`)
- **아이템 엔드포인트**: `app/api/v1/endpoints/auction_items.py`
- **주소 트리/목록 엔드포인트**: `app/api/v1/endpoints/locations.py`
- **인덱스 권고(쿼리 기준)**: `(sido)`, `(sido,address_city)`, `(sido,address_city,eup_myeon_dong)`

위 경로는 OpenAPI(`/docs`) 명세와 동기화되어 있으며, 프론트는 API만 사용하면 됩니다.

## 2) 주소 트리 및 단계별 목록 API

- 일괄 트리(권장 초기 로드, 6h 캐시 + ETag)

  - GET `/api/v1/locations/tree?includeCounts=true`
  - 응답(요약):
    ```json
    {
      "version": "a1b2c3d4e5f6",
      "generated_at": "2025-08-17T09:00:00Z",
      "code_type": "internal",
      "sidos": [
        {
          "code": "0b1f3a2c9d10",
          "name": "서울특별시",
          "count": 1234,
          "cities": [
            {
              "code": "1c2d3e4f5678",
              "name": "강남구",
              "count": 345,
              "towns": [
                { "code": "abcd1234ef56", "name": "역삼동", "count": 120 }
              ]
            }
          ]
        }
      ]
    }
    ```
  - 조건부 요청:
    - `HEAD /api/v1/locations/tree` → `ETag`, `Last-Modified` 확인
    - `GET /api/v1/locations/tree` + `If-None-Match: <etag>` → 304

- 단계별(지연 로딩)

  - 시도: `GET /api/v1/locations/sido` → `[ { code, name, count } ]`
  - 시군구: `GET /api/v1/locations/cities?sido=<이름>` 또는 `?sido_code=<코드>`
  - 읍면동: `GET /api/v1/locations/towns?sido=<이름>&city=<이름>` 또는 `?city_code=<코드>`

- 프론트 샘플 상수와 동일 구조(즉시 사용)

  - `GET /api/v1/locations/tree-simple`
  - 응답:
    ```json
    {
      "provinces": ["서울특별시", "경기도", ...],
      "cities": { "서울특별시": ["강남구", ...], ... },
      "districts": { "강남구": ["역삼동", ...], ... }
    }
    ```

- 코드→표준이름 해석(백엔드 내부 사용, 참고)
  - `/api/v1/locations` 내 `resolve_code_to_names` 로직으로 `sido_code|city_code|town_code`를 표준 이름으로 일관 변환합니다. 프론트는 코드만 전송하면 됩니다.

---

## 3) 아이템 목록 API 및 필터 매핑

- 권장 엔드포인트(간소 응답): `GET /api/v1/items/simple`
- 페이징: `page`, `limit`
- 지역(코드 우선):
  - `sido_code`, `city_code`, `town_code` (최우선)
  - 이름별칭도 지원: `province`(=시도), `cityDistrict`(=시군구), `town`(=읍면동), 마지막 fallback `region`(=시도)
- 품목/가격/면적/연도/편의/상태:

  - `buildingType` → `usage`
  - `minPrice` / `maxPrice` → 최소/최대 가격(만원)
  - `minArea` / `maxArea` → 최소/최대 면적(평)
  - `minBuildYear` / `maxBuildYear` → 최소/최대 건축연도
  - `hasElevator` → 엘리베이터 유무
  - `auctionStatus` → 경매 상태

- 유의사항

  - `hasParking`: 데이터 부재로 현재 무시됨(응답은 `null`).
  - `floor`(층수): 현재 서버에서 필터로 적용하지 않습니다(파라미터 수용만, 효과 없음). 필요 시 백엔드에 필터 구현 요청 주세요.
  - 모든 파라미터는 snake_case 동시 지원(`min_price` 등). 코드 파라미터가 가장 높은 우선순위로 적용됩니다.

### 3-1) 필터 소스 컬럼 사전(백엔드 기준)

- **지역(시도/시군구/읍면동)**: `sido` / `address_city` / `eup_myeon_dong`
- **건물유형(buildingType)**: `usage` (예: `다세대(빌라)`, `아파트`)
- **가격(만원)**: `minimum_bid_price` (`minPrice`/`maxPrice`로 전달)
- **면적(평)**: `building_area_pyeong` (`minArea`/`maxArea`)
- **건축연도**: `construction_year` (`minBuildYear`/`maxBuildYear`)
- **층수(floor)**: `floor_info` (현재 서버 필터 미적용)
- **엘리베이터**: `elevator_available` 값이 `'O'` 일 때 보유로 간주 (`hasElevator`)
- **경매상태**: `current_status` (`auctionStatus`)

- 응답 예시(간소 스키마)
  ```json
  {
    "totalItems": 4321,
    "items": [
      {
        "id": 101,
        "title": "한빛빌라 101동",
        "address": "서울특별시 강남구 테헤란로 100",
        "price": 65000,
        "area": 24.8,
        "buildYear": 2005,
        "lat": 37.498,
        "lng": 127.028,
        "auctionDate": "2025-09-10",
        "status": "진행중",
        "floor": "지상 3층",
        "hasElevator": true,
        "hasParking": null,
        "estimatedValue": 82000
      }
    ]
  }
  ```

---

## 4) 프론트 연동 권장 흐름

- 초기 진입(권장: 트리 한번에)

  1. `GET /api/v1/locations/tree?includeCounts=true` 로드
  2. 시도 버튼 렌더 → 클릭 시 해당 노드의 `cities` 렌더
  3. 시군구 클릭 → 해당 `towns` 렌더
  4. 선택된 `sido_code / city_code / town_code`를 `/api/v1/items/simple`에 그대로 전달

- 지연 로딩 대안

  - 시도 클릭 → `GET /api/v1/locations/cities?sido_code=<s>`
  - 시군구 클릭 → `GET /api/v1/locations/towns?city_code=<c>`

- 목록 조회 예시
  ```
  GET /api/v1/items/simple
    ?sido_code=<s>&city_code=<c>&town_code=<t>
    &buildingType=다세대(빌라)
    &minPrice=30000&maxPrice=90000
    &minArea=15&maxArea=40
    &minBuildYear=1995
    &hasElevator=true
    &auctionStatus=진행중
    &page=1&limit=20
  ```

---

## 5) FE 표시 컬럼 추천(목록 행)

- **표시**: `title`, `address`, `price`, `estimatedValue`, `area`, `buildYear`, `auctionDate`, `status`, `floor`, `hasElevator`
- **정렬/보조**: 면적/가격/연도는 클라이언트 정렬 가능
- **지도/상세**: `lat/lng`로 핀 표시, 상세에서 권리/리스크 정보 노출(풀 스키마 필요 시 `/api/v1/items/{id}` 사용)

---

## 6) ✅ 백엔드 가이드 기반 구현 완료 상태

### **프론트엔드 구현 완료**

- [x] **주소 API 연동**: `Application/hooks/useLocations.ts`
  - `useLocationsSimple()` - `/api/v1/locations/tree-simple`
  - `useLocationsSido()`, `useLocationsCities()`, `useLocationsTowns()`
- [x] **필터 연동**: `Application/hooks/useItems.ts`
  - `sido_code`, `city_code`, `town_code` 코드 기반 필터
  - `buildingType`, `minPrice/maxPrice`, `hasElevator` 등 모든 필터 매핑
- [x] **UI 구현**: `Application/components/features/filter-control.tsx`
  - Select 드롭다운 지역 선택
  - `floor` 필터 "미적용" 경고 표시
  - `hasParking` 필터 제거
- [x] **상태 관리**: `Application/store/filterStore.ts`

### **백엔드 서버 연동 대기**

- [ ] 백엔드 서버 실행 및 CORS 설정 확인
- [ ] 실제 데이터베이스 연결 및 API 응답 확인

**현재 상태**: 프론트엔드 100% 구현 완료, 백엔드 서버 연동 대기

### 추가: 로컬 빠른 샘플 쿼리

```http
GET /api/v1/locations/sido
GET /api/v1/locations/cities?sido_code=<sidoCode>
GET /api/v1/locations/towns?city_code=<cityCode>

GET /api/v1/items/simple?sido_code=<s>&city_code=<c>&town_code=<t>
  &buildingType=다세대(빌라)&minPrice=30000&maxPrice=90000
  &minArea=15&maxArea=40&minBuildYear=1995
  &hasElevator=true&auctionStatus=진행중&page=1&limit=20
```

### 참고 파일(검증/문서)

- 테스트: `tests/test_api_auction_items.py` (simple/list/comparables 시나리오)
- 문서: `Doc/BACKEND_ARCHITECTURE.md`, `Doc/PROJECT_BACKEND_ROADMAP.md`

---

## 7) 참고/문의

- OpenAPI 문서: 로컬 서버 `/docs` 에 자동 노출
- 추가 필터(예: 층수) 백엔드 구현 요청 시, 요청서로 전달해 주세요(완료 후 동일 경로에 회신).
- 성능: 위치 트리는 6시간 캐시 + 조건부(304) 지원, 목록은 필요한 페이지만 호출 권장.
