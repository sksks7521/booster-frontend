# [Frontend → Backend] Items 단건 상세 단일 엔드포인트 신설 요청 (2025-08-26)

## 1. 목적

- 상세 화면 데이터 로딩을 단 1회 호출로 단순화하여 누락/레이스 리스크 제거.
- 현재는 `GET /api/v1/items/{id}` + `GET /api/v1/items/custom?fields=...&filter=id:{id}` 2회 호출 구조.

## 2. 요청 사항(제안 인터페이스)

- 신규: `GET /api/v1/items/{id}/custom?fields=...`
  - 동작: `fields`로 전달된 “공식 표준 키”만을 선택하여 단건 아이템을 반환
  - 응답 예시(권장):
    ```json
    {
      "requested_fields": ["case_number", "building_name", "..."],
      "item": {}
    }
    ```
  - 대안: 기존 `GET /api/v1/items/{id}`에 표준 세트 전체 포함도 OK(이 경우 fields 불필요)

## 3. 포함 필드(표준 사양 기준)

- 경매 기본정보: `case_number, location_detail, sale_date, current_status, building_area_pyeong, land_area_pyeong, appraised_value, minimum_bid_price, bid_to_appraised_ratio, special_rights`
- 물건분석: `public_price, under_100million, bid_to_public_ratio, floor_info, floor_confirmation, elevator_available`
- 건물정보: `building_name, dong_name, construction_year, main_usage, other_usage, main_structure, height, elevator_count, ground_floors, basement_floors, household_count, family_count, postal_code, use_approval_date, land_area_m2, building_area_m2, total_floor_area, building_coverage_ratio, floor_area_ratio, pnu, administrative_dong_name`
- 위치정보: `road_address, longitude, latitude`

## 4. 샘플 요청

```bash
# 단건 전용(custom) 방식
curl -X GET "$BASE/api/v1/items/4579/custom?fields=case_number,location_detail,sale_date,current_status,building_area_pyeong,land_area_pyeong,appraised_value,minimum_bid_price,bid_to_appraised_ratio,special_rights,public_price,under_100million,bid_to_public_ratio,floor_info,floor_confirmation,elevator_available,building_name,dong_name,construction_year,main_usage,other_usage,main_structure,height,elevator_count,ground_floors,basement_floors,household_count,family_count,postal_code,use_approval_date,land_area_m2,building_area_m2,total_floor_area,building_coverage_ratio,floor_area_ratio,pnu,administrative_dong_name,road_address,longitude,latitude"
```

## 5. 오류 규약

- 잘못된 필드 포함 시 400 + `detail.invalid_fields` 배열 제공(이미 `custom`과 동일 정책 유지).

## 6. 수용 기준(AC)

- 단건 호출 1회로 상기 모든 필드를 값과 함께 수신 가능
- 응답 포맷(단건 객체 + `requested_fields`) 또는 기존 /{id}에 전체 포함 중 한 가지로 확정
- 기존 `custom`의 필드 검증/타입/단위 규약 유지

## 7. 프론트 반영

- 승인 즉시 `usePropertyDetail`에서 보강 호출 제거 → 단일 엔드포인트만 사용
- `mapItemToDetail`/UI는 현행 유지(공식 키 매핑 완료)

감사합니다.

---

### 백엔드 조치 사항 회신 (2025-08-26)

- 신규 엔드포인트 신설 완료: `GET /api/v1/items/{item_id}/custom?fields=...`

  - 동작: `fields`에 전달된 공식 키만 검증 후 단일 객체를 반환합니다.
  - 응답 포맷:
    ```json
    {
      "requested_fields": ["case_number", "building_name", "..."],
      "item": {
        /* 단건 객체 (요청 필드만 포함) */
      }
    }
    ```
  - 유효성: 잘못된 필드 포함 시 400 응답으로 `detail.invalid_fields`/`detail.valid_fields` 제공.

- 포함 필드(표준) 안내: 본 요청서 3항의 모든 필드를 그대로 `fields`에 지정하여 사용 가능하며, 단위/표시 규칙은 다음을 따릅니다.

  - `height`: 단위 m
  - 층수(`ground_floors`, `basement_floors`, `floor_info`): 값이 없거나 0이면 FE에서 '-' 표시
  - `elevator_available`: O → "있음", 그 외 → "없음"
  - `elevator_count`: FE에서 "0대/1대/..." 포맷으로 표시

- 샘플 요청(단건 전용, 본 문서의 표준 필드 세트 기준):

  ```bash
  curl -X GET "$BASE/api/v1/items/4579/custom?fields=case_number,location_detail,sale_date,current_status,building_area_pyeong,land_area_pyeong,appraised_value,minimum_bid_price,bid_to_appraised_ratio,special_rights,public_price,under_100million,bid_to_public_ratio,floor_info,floor_confirmation,elevator_available,building_name,dong_name,construction_year,main_usage,other_usage,main_structure,height,elevator_count,ground_floors,basement_floors,household_count,family_count,postal_code,use_approval_date,land_area_m2,building_area_m2,total_floor_area,building_coverage_ratio,floor_area_ratio,pnu,administrative_dong_name,road_address,longitude,latitude"
  ```

- 수용 기준(AC) 충족 여부

  - 단건 1회 호출로 요청 필드 수신: 충족
  - 응답 포맷(단건 객체 + `requested_fields`): 충족
  - 기존 `custom`의 필드 검증/타입/단위 규약 유지: 충족

- 문서화

  - `Communication/Frontend/send/API_Documentation/Items_API_Complete_Guide.md`에 단건 전용 엔드포인트 사용법을 추가했습니다.
  - 상세 표준 필드 사양: `Communication/Frontend/send/Request/250826_Items_상세_표준_필드_사양.md` 참고.

- 프론트 반영 가이드
  - 상세 훅에서 기존 보강 호출 제거 후, 본 단일 엔드포인트만 사용
  - 요청 필드는 본 문서 표준 세트를 그대로 사용(오타/별칭 불가)

문의 사항이나 추가 필드가 필요하시면 알려주세요. 즉시 반영하겠습니다.
