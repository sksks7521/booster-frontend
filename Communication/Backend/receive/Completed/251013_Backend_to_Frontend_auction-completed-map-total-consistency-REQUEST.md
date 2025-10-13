# [Backend→Frontend] 지도(/map) 총량 일치 요청: 기본 가격 파라미터 전송 중단 (251013)

## 배경 / 현상

- 동일 조건에서 목록 총량은 946건, 지도 `/map`의 total은 664건으로 불일치가 재현되었습니다.
- 원인: 지도 요청에 기본값 형태의 가격 파라미터가 항상 포함됩니다(`min_final_sale_price=0&max_final_sale_price=500000`).
- 공용 쿼리 규칙상 가격 범위가 전달되면 `final_sale_price IS NOT NULL AND final_sale_price > 0`가 강제되어, 가격이 비어있거나 0인 항목이 제외됩니다.

## 요청 사항(필수)

1. 유저가 가격 필터를 실제로 설정하지 않았다면, 다음 파라미터를 **아예 전송하지 말아주세요.**
   - `min_final_sale_price`, `max_final_sale_price`
2. 초기 진입/탭 전환/지도 이동 등 모든 `/map` 호출 경로에 동일 규칙을 적용해 주세요.
3. 검증 시 `/map` 응답의 `echo.totals.pre_spatial_total`이 목록 total과 일치해야 합니다.

## 재현 / 기대 결과

- 목록(예시)

```
GET /api/v1/auction-completed/?
  address_area=경기도&address_city=경기도+고양시&
  max_building_area_pyeong=100&max_land_area_pyeong=200&
  min_construction_year=1980&max_construction_year=2024&page=1&size=20
→ total = 946
```

- 지도(가격 파라미터 제거)

```
GET /api/v1/auction-completed/map?
  center_lat=37.69737848&center_lng=126.8443866&limit=500&
  sido=경기도&sigungu=경기도+고양시&
  area_min=0&area_max=100&min_land_area=0&max_land_area=200&
  build_year_min=1980&build_year_max=2024
→ total 및 echo.totals.pre_spatial_total = 946 (목록과 일치)
```

## 프론트 구현 가이드(예시)

```ts
const params: Record<string, string | number> = {
  /* 공통 필수 */
};

if (priceFilter.enabled) {
  if (priceFilter.min != null) params.min_final_sale_price = priceFilter.min;
  if (priceFilter.max != null) params.max_final_sale_price = priceFilter.max;
}
// enabled=false 또는 pristine 상태라면 가격 파라미터 자체를 추가하지 않음
```

- 주의: `0`/기본상한 값이라도 "설정 안 함" 의미라면 전송하지 않기.

## 선택 백엔드 완화안(옵션)

- 원하시면 서버에서 "min=0 & max=기본상한" 조합을 **미적용**으로 간주하는 특례를 넣을 수 있습니다.
- 단, FE가 파라미터 미전송 원칙을 지키면 불필요합니다(권장).

## QA 체크리스트

- [ ] 가격 파라미터 미전송 시 `/map total`과 목록 total이 일치
- [ ] 가격 필터 실제 설정 시에도 목록/지도 총량이 동일 규칙으로 동작
- [ ] 초기/탭 전환/지도 이동 등 모든 경로에서 기본 가격 파라미터가 전송되지 않음
- [ ] `/map` 응답 `echo.totals.pre_spatial_total`이 목록 total과 동일
