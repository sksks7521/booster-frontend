# [Frontend→Backend] /map 상세 필터(가격/년도/층/엘리베이터/특수권리) 일관 처리 요청 (251013)

## 배경

- 주소/사건번호 검색은 `/map`에 반영되어 목록/영역과 동일하게 필터 → 거리정렬 → limit=K가 동작합니다.
- 그러나 다음 상세 필터는 `/map`에서 미적용/부분 적용으로 관측되어 지도 결과와 목록 총량이 불일치합니다.
  - 매각가(만원) 범위, 매각년도(빠른 선택), 층확인, 엘리베이터, 특수권리

## 목표

- 아래 파라미터들을 목록/영역과 동일 규칙으로 `/map`에서도 처리하여, 집합 S(필터 후 전체) 기준으로 거리정렬 후 `limit=K` 반환.
- 응답 `total`은 항상 집합 S의 총 개수.

## 요청 사항(파라미터/규칙)

### 1) 매각가(만원) 범위

- 파라미터: `min_final_sale_price`, `max_final_sale_price`
- 타입: number(만원)
- 규칙: 하한/상한 개별 지정 가능(미지정 시 해당 경계 미적용)

### 2) 매각년도(빠른 선택)

- 파라미터: `date_from`, `date_to` 및 호환 `sale_date_from`, `sale_date_to`
- 빠른 선택(`saleYear`)의 경우 프론트는 다음과 같이 전송합니다:
  - `date_from=YYYY-01-01`, `date_to=YYYY-12-31` (+ `sale_date_from/to` 동시 전송)
- 규칙: 두 쌍 중 하나만 와도 동일하게 범위 필터 적용

### 3) 층확인

- 파라미터: `floor_confirmation`
- 타입: CSV 문자열(예: `반지하,1층,일반층,옥탑`)
- 규칙: CSV OR 매칭, 공백/빈 토큰 무시

### 4) 엘리베이터

- 파라미터: `elevator_available`
- 타입 허용: `"Y"|"N"|"O"|"X"|true|false|"있음"|"없음"`
- 규칙: 내부 표준은 `O|X` 또는 `Y|N`로 정규화하여 필터 적용

### 5) 특수권리

- 파라미터: `special_rights`
- 타입: CSV, 키(영문) + 라벨(한글) 혼합 허용
- 공식 키(백엔드 회신 기준):
  - `tenant_with_opposing_power`, `hug_acquisition_condition_change`, `senior_lease_right`,
    `resale`, `partial_sale`, `joint_collateral`, `separate_registration`,
    `lien`, `illegal_building`, `lease_right_sale`, `land_right_unregistered`
- 규칙:
  - 키는 불리언 컬럼과 1:1 매칭으로 필터 적용
  - 라벨은 텍스트 OR 매칭으로 보조 적용(선택) → 최소한 키만으로 동작 보장

## 요청/응답 예시

```
GET /api/v1/auction-completed/map?
  center_lat=37.5665&center_lng=126.9780&limit=500&
  min_final_sale_price=1000&max_final_sale_price=50000&
  date_from=2022-01-01&date_to=2022-12-31&
  floor_confirmation=반지하,1층,일반층,옥탑&
  elevator_available=N&
  special_rights=tenant_with_opposing_power,선순위임차인,lien,압류
```

- 응답: `items`(확장 스키마), `total`(필터 후 전체), `ordering`(기본 distance_asc), `warning`(cap 초과 시)

## QA 체크리스트

- [ ] 가격 범위 필터 적용 시 목록 총량과 `/map total`이 일치
- [ ] 매각년도(연간 범위) 적용 시 일치
- [ ] 층확인 CSV 적용(복수 값 OR 매칭)으로 일치
- [ ] 엘리베이터 값(Y/N/O/X/true/false/있음/없음) 정규화 후 일치
- [ ] 특수권리 키(영문) 기준으로 일치(라벨은 보조)
- [ ] 최종 결과는 거리 오름차순 정렬 후 limit=K 반환

## 비고/영향

- 비파괴 변경(기존 파라미터 이름 그대로 사용). 목록/영역과 파라미터/스키마 정합성 유지.
- 프론트는 이미 상기 파라미터를 전송하도록 반영되어 있어, 서버 적용 즉시 지도/목록 일관 동작합니다.

감사합니다.
