## 🛠️ Backend→Frontend | auction_ed 특수조건(special_conditions) 필터 구현 완료 보고 (2025-09-01)

### 1) 요약

- 대상 API: `GET /api/v1/auction-completed/`
- 조치: 프론트가 전달하는 특수조건 키(영문/한글/별칭)를 서버에서 정규화하여 불리언 컬럼과 텍스트 컬럼 모두에 적용되도록 구현 완료
- 결과: 다양한 표기 입력 시에도 일관되게 정확한 필터링 수행

### 2) 처리 방식

- 파라미터: `special_conditions` (CSV)
- 정규화 로직:
  - 불리언 컬럼 기반 키는 해당 컬럼 `IS TRUE`로 필터
  - 그 외 한글 키워드는 `special_rights ILIKE '%키워드%'` 부분일치로 필터
  - 복수 키는 AND로 결합(모든 조건을 만족하는 결과)

### 3) 지원 키(예시)

- 불리언 매핑(컬럼 True):
  - `tenant_with_opposing_power`(대항력있는임차인), `hug_acquisition_condition_change`, `senior_lease_right`, `resale`, `partial_sale`, `joint_collateral`, `lien`(유치권), `illegal_building`, `lease_right_sale`, `land_right_unregistered`
- 한글/별칭(텍스트 포함 검색):
  - `관련사건`, `우선매수권`, `임차보증금`, `압류`, `가압류`, `가처분`, `소액임차권`, `담보신탁`, `용도제한`, `별도등기` 등
- 호환 키:
  - `tenant_rights` → `tenant_with_opposing_power`
  - `HUG인수보증`/`HUG인수조건변경` → `hug_acquisition_condition_change`
  - 한글 표기는 위 불리언/텍스트 규칙에 따라 자동 처리

### 4) 요청 예시

```bash
# 불리언 + 한글 혼용 예시 (AND 결합)
curl -G "http://127.0.0.1:8000/api/v1/auction-completed/" \
  --data-urlencode "special_conditions=tenant_rights,관련사건,유치권" \
  --data-urlencode "page=1" --data-urlencode "size=20"

# 불리언 키만(복수)
curl -G "http://127.0.0.1:8000/api/v1/auction-completed/" \
  --data-urlencode "special_conditions=joint_collateral,lien" \
  --data-urlencode "page=1" --data-urlencode "size=20"
```

### 5) 사용 가이드

- CSV로 여러 조건 전달 시 모든 조건을 만족하는 결과 반환(AND)
- 키는 영문/한글/별칭 모두 수용
- 공란/미전달 시 특수조건 필터 미적용

### 6) 체크리스트

- [ ] 불리언 키 단독/복수 시 컬럼 True 매칭 정상
- [ ] 한글 키워드가 `special_rights` 텍스트에 포함된 경우만 반환
- [ ] 혼용 시(불리언+텍스트) AND 결합 결과 정상
- [ ] 페이지네이션/다른 필터와 조합 시 정상 동작

—
Backend Team 드림
