# [프론트엔드→백엔드] Dataset API 표준계약 회신 (2025-08-28)

## 1) 회신 개요

- 문서: `250827_Backend_to_Frontend_Dataset_API_표준계약_회신_초안.md`에 대한 프론트 회신입니다.
- 범위: 4개 데이터셋(경매완료/실거래 매매/실거래 전월세/경매진행) 공통 UI 계약.

## 2) 합의 사항(프론트 제안 수락/요청)

1. 페이지네이션/응답

   - `page`/`size` 표준 수락. `limit` alias 동작(=size)도 하위호환으로 유지 요청.
   - 응답 키: `{ items, total, page, size, pages }` 표준 수락. `total_pages` 동시 제공 OK.
   - 전역 에러 포맷 `{ message, status, detail }` 수락.

2. simple 공통 키

   - `address`: `road_address` | `road_address_real`
   - `lat`/`lng`: `latitude`/`longitude`
   - `area`(㎡): `exclusive_area_sqm` | (평 보유 시 ㎡ 환산 제공 허용)
   - `build_year`: `construction_year` | `construction_year_real`
   - `price`: 데이터셋별 의미로 사용(낙찰가/거래가/전월세 기준). 응답에 `price_basis` 포함 요청.

3. 전월세 `price` 기준(합의 필요)

   - 옵션 B 제안: `deposit_amount + monthly_rent * k` (만원), 기본 k=100 제안.
   - 근거: 시장 비교/정렬의 일관성. `price_basis`에 "deposit_plus_monthly" 명시.

4. `price_per_area`

   - 단위: "만원/㎡" 고정 수락.
   - 평만 보유 시 1평=3.305785㎡ 환산 허용 요청(서버/클라 어느 쪽이든 일관 출력).

5. 정렬 화이트리스트(수락)

   - auction_completed: `sale_date`, `final_sale_price`, `exclusive_area_sqm`
   - real_transactions: `transaction_amount`, `contract_date`, `exclusive_area_sqm`
   - real_rents: `deposit_amount`, `monthly_rent`, `contract_date`, `exclusive_area_sqm`
   - auction_items: `sale_date`, `minimum_bid_price`, `exclusive_area_sqm`
   - 인터페이스: `sort_by`, `sort_order`(`asc|desc`)

6. 지도 필터(수락/요청)

   - 우선순위: `bbox(south,west,north,east)` > `center(lat,lng,radius_km)` 동시 지원 수락.
   - 제안: 반경 상한 10km, bbox는 서버 안전 한도 내 검증/클램프 처리.

7. 네이버 매물(초안 수락)
   - 경로: `GET /api/v1/naver-products/`
   - 필수: `id,address,lat,lng,area,build_year,price,property_type,posted_at,source_url,thumbnail?`
   - 정렬/필터 항목은 2차 합의.

## 3) 프런트 적용/호환 메모

- 호출: 이미 `page/size`로 통일(내부적으로 `limit` 입력 시 `size`로 승격 처리).
- 응답: `total`/`pages`를 우선 사용, `total_pages` 동시 제공도 호환.
- 정렬: 테이블 헤더→`sort_by` 매핑 표준화 진행.
- 지도: v2에서 bbox 우선 사용, radius 모드 옵션화 예정.

## 4) 요청/질의(백엔드 확인 필요)

1. 전월세 k 값(기본 100) 수용 여부와 `price_basis` 키 포함 가능 여부.
2. 평→㎡ 환산 위치(서버/프론트)와 반올림 규칙(소수 0~1자리?) 확정.
3. 정렬 컬럼 키 네이밍 최종본(예: `final_sale_price` vs `finalPrice`).
4. bbox 최대 면적/좌표 검증 한도 값 공유.

## 5) 일정 제안

- T0: alias/에러포맷/공통 키 PR(백엔드) → 프론트 스모크
- T1: 정렬/지도/전월세 가격/㎡단위/네이버 1차 스펙 적용 → 공동 QA

---

Assignee: Frontend
Date: 2025-08-28
