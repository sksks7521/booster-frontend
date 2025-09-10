## Backend → Frontend: auction_ed 영역(원형) 필터 API 구현 완료 보고 (v1)

### 요약

- 새 엔드포인트: `GET /api/v1/auction-completed/area`
- 목적: 프런트의 지도 영역(원형) 필터를 서버에서 정확 처리(필터 → 정렬 → 페이지네이션)하여 `{results,total,page,size,ordering}` 반환
- 상태: 구현 완료 및 스모크 검증 통과(정렬 토글/반경 단조성 포함)

### 요청 파라미터

- 필수
  - `center_lat`(float): 중심 위도(WGS84)
  - `center_lng`(float): 중심 경도(WGS84)
  - `radius_m`(float>0): 반경(미터)
- 지역(선택, 모두 AND)
  - `province` → 서버 `sido`
  - `cityDistrict` → 서버 `address_city`
  - `town` → 서버 `eup_myeon_dong`
- 가격(만원, 선택)
  - `price_min` → `min_final_sale_price`
  - `price_max` → `max_final_sale_price`
- 면적(평, 선택)
  - `area_min/max` → `min/max_building_area`
  - `land_area_min/max` → `min/max_land_area`
- 건축년도(선택)
  - `build_year_min/max` → `min/max_construction_year`
- 매각기일(선택)
  - `date_from` / `date_to` (YYYY-MM-DD)
  - 또는 `saleYear`(YYYY) 사용 시: `YYYY-01-01` ~ `YYYY-12-31`
- 전용 필터(선택, 모두 AND)
  - `elevator_available`: `Y` 또는 `N` (서버에서 내부 `O/X`로 매핑 처리)
  - `floor_confirmation`: CSV 예 `지하,저층` → 서버 저장값과 일치하도록 자동 매핑
    - 매핑: `지하→반지하`, `저층→일반층` (그 외 값은 그대로 사용)
  - `current_status`: CSV(부분 일치 OR)
  - `special_rights`: CSV(부분 일치 OR)
- 검색(선택)
  - `search_field`: `address | road_address | case_number`
  - `search_query`: 문자열(양끝 공백 제거 후 적용)
- 정렬/페이징(선택)
  - `ordering`: `[-]key`
    - 허용 키: `sale_date`, `final_sale_price`, `bidder_count`, `construction_year`
  - `page`: 기본 1
  - `size`: 기본 20, 최대 1000(초과 시 400)

### 처리 방식(서버)

1. 입력 검증 및 매핑(지역/값 표준화)
2. 정확 원형 필터: BBOX 1차 제한 + 거리식(Haversine 근사)으로 원형 영역 정확 필터
3. 상세 필터(지역/가격/면적/연식/전용/검색) AND 결합
4. 정렬(`ordering`) 적용 → 페이지네이션(`page/size`) 및 `total` 계산

### 응답 스펙

```json
{
  "results": [
    /* 아이템 배열(기존 auction_ed full 스키마 기반, 필드 정규화 포함) */
  ],
  "total": 290,
  "page": 1,
  "size": 100,
  "ordering": "-sale_date"
}
```

### 예시 요청

```bash
curl -G "http://localhost:8000/api/v1/auction-completed/area" \
  --data-urlencode "center_lat=37.65" \
  --data-urlencode "center_lng=126.84" \
  --data-urlencode "radius_m=5000" \
  --data-urlencode "province=경기도" \
  --data-urlencode "cityDistrict=경기도 고양시" \
  --data-urlencode "date_from=2022-01-01" \
  --data-urlencode "date_to=2024-12-31" \
  --data-urlencode "price_min=20000" \
  --data-urlencode "price_max=50000" \
  --data-urlencode "area_min=10" \
  --data-urlencode "area_max=40" \
  --data-urlencode "floor_confirmation=지하,저층" \
  --data-urlencode "elevator_available=Y" \
  --data-urlencode "current_status=매각,배당종결" \
  --data-urlencode "special_rights=유치권,법정지상권" \
  --data-urlencode "ordering=-sale_date" \
  --data-urlencode "page=1" \
  --data-urlencode "size=100"
```

### 오류/유효성 규칙

- 필수(center_lat/lng/radius_m) 누락: 422/400
- `size>1000`: 400(`size 최대값은 1000입니다.`)
- 허용되지 않은 `ordering` 키: 400(허용 목록 동봉)
- 전용 필터 값 불일치(예: `elevator_available` 비정상 값): 무시 또는 400(정책 유지 중 — 현재는 무시)

### 품질/일관성 보장 항목

- 정렬 asc↔desc 토글 시 `total` 불변
- 반경 2000m→5000m 확장 시 `total` 단조 증가
- 모든 필터 조합에서 `page/size/total` 일관성 유지(임의 cap 없음, 단 `size≤1000`)

### 호환/비파괴 정책

- 기존 경로 `GET /api/v1/auction-completed/` 및 `/simple`/`/full`/`/custom`은 그대로 유지
- 본 기능은 전용 엔드포인트(`/area`)로 추가되어 프런트 점진 전환 가능

### 비고

- 좌표 컬럼: `latitude/longitude` 기반
- 인덱스: 좌표/날짜/낙찰가 등 주요 컬럼 인덱스 운영
- 성능/지연: 대용량에서도 안정 동작하도록 BBOX + 거리식 결합 최적화

---

문의나 추가 조건(허용 정렬 키 확장, 전용 필터 엄격 검증 등)이 있으면 알려주세요. 필요 시 바로 반영하겠습니다.
