# [백엔드→프론트엔드] Dataset API 표준계약 회신/합의 요청 (2025-08-27)

## 1. 요청 개요 (Why?)

- 프론트 요청서(`250827_Frontend_to_Backend_Dataset_API_Request.md`)의 표준 계약(페이징/정렬/지도/공통 필드) 수용을 전제로, 즉시 적용 가능한 항목과 추가 합의가 필요한 사항을 정리해 회신드립니다.
- 목표: 4개 데이터셋(경매완료/실거래(매매)/실거래(전월세)/경매진행)에 대해 공통 UI가 기대하는 계약을 충실히 지원합니다.

## 2. 작업 요청 사항 (What & How?)

### 2.1 확인/합의 필요 사항(선결)

- [ ] 전월세 `price` 기준 확정 필요

  - 옵션 A: `deposit_amount`만 `price`로 사용
  - 옵션 B: `deposit_amount + monthly_rent * k` 환산(만원). `k`(월환산 배수) 값 지정 필요
  - 응답에 `price_basis`(예: "deposit_only" | "deposit_plus_monthly") 명시 가능

- [ ] 실거래 `price_per_area` 단위 및 환산 허용

  - 제안: "만원/㎡" 고정. 현재 보유 `price_per_pyeong` → ㎡ 환산 허용 여부 확인

- [ ] 정렬 허용 컬럼 화이트리스트(데이터셋별)

  - auction_completed: `sale_date`, `final_sale_price`, `building_area`(㎡ 기준 제공 가능)
  - real_transactions: `transaction_amount`, `contract_date`(year+month+day), `exclusive_area_sqm`
  - real_rents: `deposit_amount`, `monthly_rent`, `contract_date`, `exclusive_area_sqm`
  - auction_items(진행): `sale_date`, `minimum_bid_price`, `building_area`(㎡ 기준 제공 가능)
  - 확인: 상기 키로 `sort_by`, `sort_order` 지원해도 되는지

- [ ] 지도 필터 모드 결정

  - 제안: 두 모드 동시 지원. 우선순위: `bbox(south,west,north,east)` > `center(lat,lng,radius_km)`
  - 기본값/검증 규칙(범위/반경 한도) 합의 필요

- [ ] 네이버 매물 엔드포인트 스펙 범위
  - 제안 경로: `GET /api/v1/naver-products/`
  - 최소 필드: `id,address,lat,lng,area,build_year,price,property_type,posted_at,source_url,thumbnail?`
  - 데이터 소스/동기화 주기/정렬·필터 항목 합의 필요

### 2.2 즉시 반영(합의 불필요, 하위호환 유지)

- [ ] 페이지 파라미터 alias: 모든 목록 API에 `limit` 추가(`size/limit` 동작 동일)
- [ ] 응답 키 alias: `pages`를 `total_pages`와 함께 제공
- [ ] 전역 에러 응답 표준화: `{ "message": string, "status": number, "detail": object }`
  - 기존 예외도 동일 포맷으로 매핑(예: 422 ValidationError)
- [ ] 공통 simple 키 추가(기존 필드 유지)
  - `address`: `road_address` | `road_address_real`
  - `lat`/`lng`: `latitude`/`longitude`
  - `area`(㎡): `exclusive_area_sqm` | (평 보유 시 환산 제공 가능)
  - `build_year`: `construction_year` | `construction_year_real`
  - `price`: 데이터셋 기준(낙찰가/거래가/전세·월세 기준) — 상기 합의 반영

## 3. 참고: 공통 응답 예시(프론트 계약)

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

## 4. 일정/범위 제안

- T0(합의 전): 1단계 호환 PR 제출 — `limit`/`pages` alias, 전역 에러 포맷, simple 공통 키(초안) 적용
- T1(합의 후): 정렬(`sort_by`,`sort_order`)·지도(bbox/radius)·`price_per_area`·전월세 `price` 정책·네이버 매물 1차 스펙 반영

## 5. 진행 상태

- **Status:** Requested
- **Requester:** 백엔드 담당자
- **Assignee:** 프론트엔드 담당자
- **Requested At:** 2025-08-27
- **Completed At:** 2025-08-28
- **History:**
  - 2025-08-27: 회신 초안 송부(합의 필요 포인트/선적용 항목 제시)
  - 2025-08-28: 후속 문서(표준계약 회신 답변)로 대체 완료 → 본 초안 문서 마감

---

## 완료 로그

- 상태: Completed (Superseded by 250828 회신 답변)
- 이동: Communication/Frontend/send/Completed/250827_Backend_to_Frontend_Dataset_API_표준계약_회신_초안.md
- 완료일: 2025-08-30
- 메모: 후속 정식 답변 문서로 대체되어 완료 처리합니다.
