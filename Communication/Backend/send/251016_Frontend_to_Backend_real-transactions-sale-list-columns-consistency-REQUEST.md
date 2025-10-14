### 제목

실거래가(매매) 리스트 컬럼 일관성 및 표준 키 병행 제공 요청 (영역 안만 보기 시 목록 공백 이슈)

### 요약

- 현상: 영역 안만 보기(원형 필터) 사용 시 지도는 정상이나, 목록 테이블의 다수 컬럼이 `-`로 비어 보입니다.
- 원인: 리스트 응답의 실제 필드명이 화면이 기대하는 표준 키와 다르거나(`*_real` 등), 동일 의미 값을 서로 다른 키로 제공하여 프런트 어댑터가 매핑하기 어렵습니다.
- 요청: 리스트 응답에서 표준 키를 병행 제공(또는 미러링)하여 컬럼 렌더링이 안정적으로 이뤄지도록 해주세요. 기존 키는 유지하되, 표준 키도 동시에 내려주시면 됩니다.

---

### 재현 절차

1. 지역과 상세필터 설정 후, 지도를 켭니다.
2. 원 그리기 후 "영역 안만 보기"를 ON으로 전환합니다.
3. 지도 마커 팝업은 정상인데, 목록 테이블의 여러 열(도로명주소, 건물명, 거래금액, 평단가, 전용면적, 건축연도, 층 등)이 `-`로 표시됩니다.

---

### 분석 (프런트 기준)

- 지도는 좌표/주소 키를 넓게 수용하는 팝업 렌더링이어서 정상 노출됩니다.
- 목록은 스키마가 기대하는 "표준 키"를 기준으로 렌더링하며, 값이 없으면 `-`가 표기됩니다.
- 현재 리스트 응답에는 다음과 같은 변형 키가 내려오는 경우가 있습니다.
  - 주소/건물명: `road_address_real`, `building_name_real`
  - 층/연식: `floor_info_real`, `construction_year_real`
  - 지역/행정: `address_city`
  - 면적/금액: `exclusive_area_sqm`, `price_per_pyeong`
- 표준 키(`road_address`, `building_name`, `floor_info`, `construction_year` 등)가 비어 있고, 실값은 `*_real`에만 존재하는 경우 목록 공백이 발생합니다.

---

### 요청 사항 (표준 키 병행 제공)

아래 표준 키를 리스트 응답에서 항상 병행 제공해 주세요. 기존 키는 그대로 유지해도 됩니다.

1. 필수 공통

- `id` (string|number)
- `latitude`(float), `longitude`(float) — WGS84
- `road_address`(string), `jibun_address`(string)
- `sido`(string), `sigungu`(string), `admin_dong_name`(string)
- `building_name`(string)

2. 거래/면적/가격

- `transaction_amount`(number, 만원)
- `price_per_pyeong`(number, 만원/평)
- `exclusive_area_sqm`(number, ㎡)
- `land_rights_area_sqm`(number, ㎡)

3. 연/일/층

- `construction_year`(number)
- `floor_info`(string)
- `contract_date`(YYYY-MM-DD), `contract_year`(number), `contract_month`(number), `contract_day`(number)

4. 호환 키 자동 미러링 (서버 측 변환 권장)

- 만약 값이 `*_real` 또는 기타 변형 키에만 존재하면, 동일 값을 표준 키에도 복사해 주세요.
  - 예: `road_address_real` → (값이 있으면) `road_address`
  - 예: `building_name_real` → `building_name`
  - 예: `floor_info_real` → `floor_info`
  - 예: `construction_year_real` → `construction_year`

---

### 응답 예시 (제안)

```json
{
  "items": [
    {
      "id": 123,
      "latitude": 37.55,
      "longitude": 126.97,
      "road_address": "서울특별시 중구 세종대로 110",
      "jibun_address": "서울 중구 태평로1가 31",
      "sido": "서울특별시",
      "sigungu": "서울특별시 중구",
      "admin_dong_name": "태평로1가",
      "building_name": "서울시청사",
      "transaction_amount": 85000,
      "price_per_pyeong": 2500,
      "exclusive_area_sqm": 84.97,
      "land_rights_area_sqm": 38.12,
      "construction_year": 2012,
      "floor_info": "지상 10층",
      "contract_date": "2025-07-12",
      "contract_year": 2025,
      "contract_month": 7,
      "contract_day": 12,
      "road_address_real": "서울특별시 중구 세종대로 110"
    }
  ],
  "total": 3091
}
```

---

### 합의 이유

- 프런트는 표준 키만 안정적으로 바라보면 되므로 렌더링 공백이 사라집니다.
- 기존 `*_real` 키는 유지되므로 서버/데이터 파이프라인의 호환성이 깨지지 않습니다.
- 지도/목록/팝업 간 데이터 정합성을 보장할 수 있습니다.

---

### 추가 (선택)

- `columns` 메타 API가 있다면, 각 키의 의미/자료형/단위(㎡/만원/만원/평 등)를 함께 명시해 주시면 화면에 반영하기 쉽습니다.

---

### 일정 제안

- 1차: 표준 키 미러링 적용 (1~2일)
- 2차: 필요한 경우 추가 필드 협의 및 메타 API 확장 (선택)
