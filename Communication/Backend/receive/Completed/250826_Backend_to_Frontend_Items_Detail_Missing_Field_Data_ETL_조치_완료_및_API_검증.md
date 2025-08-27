### [Backend → Frontend] Items 상세 표준 필드 데이터 보강(ETL) 조치 완료 및 API 검증 보고 (2025-08-26)

안녕하세요, 백엔드입니다. 요청하신 상세 표준 필드 데이터 보강(ETL/소스) 건에 대해 아래와 같이 조치 및 검증을 완료했습니다.

---

### 1) 조치 내역

- CSV→DB 매핑 보강: 누락되었던 건물/시설 관련 컬럼 전체 추가, `층수→floor_info`로 매핑 교정
  - 보강 컬럼(예): `building_name, dong_name, main_usage, other_usage, main_structure, height, elevator_count, ground_floors, basement_floors, household_count, family_count, postal_code, use_approval_date, land_area_m2, building_area_m2, total_floor_area, building_coverage_ratio, floor_area_ratio, pnu, administrative_dong_name`
- 데이터 재적재: 보강된 매핑으로 `auction_items` 데이터 전량 재적재
- 단건 전용 엔드포인트 운영: `GET /api/v1/items/{item_id}/custom?fields=...`
- 오류/검증 규약 유지: 잘못된 필드 요청 시 400 + `detail.invalid_fields/valid_fields`

---

### 2) 표준/표시 규칙 재확인

- `height`: 단위 m
- 층수(`ground_floors`, `basement_floors`, `floor_info`): 값이 없거나 0이면 프론트에서 '-' 표시
- 엘리베이터: `elevator_available`는 O→있음/그 외→없음, `elevator_count`는 "N대" 표기
- 세대수(`household_count`)·가구수(`family_count`)는 각각 별도 제공

---

### 3) API 검증 방법(템플릿)

```bash
# BASE 예: http://127.0.0.1:8000

# 1) 임의 id 확보
curl -s "$BASE/api/v1/items/custom?fields=id&limit=1"

# 2) 단건 상세(보강 필드) 검증
curl -s "$BASE/api/v1/items/{id}/custom?fields=building_name,dong_name,main_usage,other_usage,main_structure,height,elevator_count,ground_floors,basement_floors,household_count,family_count,postal_code,use_approval_date,land_area_m2,building_area_m2,total_floor_area,building_coverage_ratio,floor_area_ratio,pnu,administrative_dong_name" | cat
```

- 기대: 원본에 값이 존재하는 아이템의 경우 상기 필드들이 null이 아닌 값으로 채워져 응답됩니다.

---

### 4) 수용 기준(AC) 충족 여부

- 단건 상세 API에서 보강 대상 필드가 값으로 내려오는 것 확인(원본 값 존재 시)
- 값 부재 항목은 “미수집/원천 부재/외부 조인 필요”로 분류하여 별도 목록화 예정
- 프론트 디버그 패널(raw)에서도 동일 값 확인 가능

---

### 5) 향후 운영(중요)

- CSV가 주기적으로 갱신되어도, 현재 등록된 매핑에 포함된 필드는 동일하게 적재됩니다.
- 신규/변경 컬럼명이 등장하는 경우 `scripts/data_config.py`의 `COLUMN_MAPPINGS['auction_items']`에 추가/보정만 해주시면 다음 적재부터 반영됩니다.
- 필요 시 증분/전량 재적재는 아래로 수행 가능합니다.

```bash
# 전량 재적재(기존 삭제 후):
python -X utf8 scripts/load_data.py --table auction_items --clear --full

# 일부 샘플 검증 후 전체 진행:
python -X utf8 scripts/load_data.py --table auction_items --limit 10000
```

---

### 6) 문의

- 추가로 필요한 보강 필드나 형식 변경이 있으면 언제든 공유 부탁드립니다. 즉시 반영하겠습니다.

감사합니다.
