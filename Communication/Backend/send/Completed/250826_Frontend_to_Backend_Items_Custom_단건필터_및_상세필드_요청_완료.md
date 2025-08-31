# [Frontend → Backend] Items Custom 단건 필터 및 상세 필드 노출 요청 (2025-08-26)

## 1. 목적

- 상세 팝업(UI)에서 누락되는 건물/시설 관련 컬럼들을 안정적으로 제공받기 위해 공식 키명과 제공 방식 확정
- 선택 컬럼 API(`/api/v1/items/custom`)의 단건 조회(특정 id) 필터 방법과 응답 표준화 합의

## 2. 배경

- 백엔드 문서: `Communication/Backend/receive/Completed/250820_Backend_to_Frontend_Items_API_전체_컬럼_구현_완료_및_사용가이드.md`에 따르면 다음 API가 제공됨
  - GET `/api/v1/items/columns` (컬럼 메타)
  - GET `/api/v1/items/custom?fields=...` (선택 컬럼)
  - GET `/api/v1/items/full` (전체 컬럼)
- 프론트 상세 화면에서 다음 컬럼들이 0 또는 '-'로 표시되는 사례가 지속 발생:
  - 건물/동/호: `building_name`, `dong_name`, `room_number`
  - 층/시설: `ground_floors`, `underground_floors`, `households`, `units`, `elevators`
  - 용도/구조/기타: `main_structure`, `other_purpose`
  - 높이: `height`
- 현상: 단일 상세(`GET /api/v1/items/{id}`)에서는 상기 컬럼들이 충분히 내려오지 않음. `custom`로 보강을 시도했으나 단건 필터 방식/응답 포맷 차이로 일관된 처리가 어려움.

## 3. 요청 사항

### 3.1 공식 키명(컬럼명) 확인

- 아래 키들이 `/api/v1/items/columns` 응답에 존재하는지 확인 및 정확한 표기 공유 부탁드립니다.
  - `building_name`, `dong_name`, `room_number`
  - `ground_floors`, `underground_floors`, `households`, `units`, `elevators`
  - `main_structure`, `other_purpose`
  - `height`
- 각 컬럼의 데이터 타입/단위 확인 요청
  - `elevators`: 정수인지(개수)
  - `height`: 단위(m) 여부
  - `ground_floors`, `underground_floors`, `households`, `units`: 숫자 타입 보장 여부

### 3.2 Custom 단건 필터 방식 확정

- 다음 두 방식 중 어떤 것이 공식적으로 지원되는지 명확한 가이드 요청드립니다.
  1. `GET /api/v1/items/custom?fields=...&id={itemId}&limit=1`
  2. `GET /api/v1/items/custom?fields=...&filter=id:{itemId}&limit=1`
- 권장 방식 1가 불가하다면, 2의 `filter` 구문에서 동등 비교(`id:{id}`)의 공식 표기(예: `id:eq:{id}` 등)를 문서로 확정 부탁드립니다.

### 3.3 Custom 응답 표준화(단건 시)

- 단건 요청 시 응답 형태 표준화 제안 및 확인 요청
  - 선호안: 항상 객체 래핑
    ```json
    {
      "requested_fields": ["..."],
      "items": [
        {
          /* 단건 */
        }
      ],
      "total_items": 1
    }
    ```
  - 혹은 단건 객체 반환 시에도 최소한 `requested_fields`와 함께 다음 중 하나를 보장:
    - `{ item: { ... }, requested_fields: [...] }`
- 잘못된 필드명 요청 시(400) 에러 페이로드에 `invalid_fields` 배열 포함 요청

### 3.4 대안(선택)

- 만약 `custom`에서 단건 필터 표준화를 단기간에 적용하기 어렵다면, 아래 대안을 부탁드립니다.
  - 대안 A: `GET /api/v1/items/{id}/custom?fields=...` 단건 전용 엔드포인트 추가
  - 대안 B: `GET /api/v1/items/{id}` 응답에 상기 누락 컬럼들을 직접 포함(상세용 필드 보강)

## 4. 프론트 기대 동작(합의 후 구현 계획)

- 상세 훅은 다음 순서로 호출합니다.
  1. `GET /api/v1/items/{id}` (기본 안정 데이터)
  2. `GET /api/v1/items/custom?fields=...&<단건필터>&limit=1` (부족 필드 보강)
  3. 2가 실패/누락 시 1의 데이터로 폴백
- 공식 키명만 사용하고, 단위/타입은 백엔드 제공 스펙에 맞춰 파싱 최소화합니다.

## 5. 샘플 요청

- 컬럼 메타
  ```bash
  curl -X GET "$BASE/api/v1/items/columns"
  ```
- 단건 보강(방식 1 예시)
  ```bash
  curl -X GET "$BASE/api/v1/items/custom?fields=id,usage,case_number,road_address,building_area_pyeong,land_area_pyeong,minimum_bid_price,appraised_value,bid_to_appraised_ratio,construction_year,elevator_available,floor_confirmation,special_rights,current_status,latitude,longitude,public_price,under_100million,sale_month,building_name,dong_name,room_number,ground_floors,underground_floors,households,units,elevators,main_structure,other_purpose,height&id=4579&limit=1"
  ```
- 단건 보강(방식 2 예시)
  ```bash
  curl -X GET "$BASE/api/v1/items/custom?fields=id,usage,case_number,road_address,building_area_pyeong,land_area_pyeong,minimum_bid_price,appraised_value,bid_to_appraised_ratio,construction_year,elevator_available,floor_confirmation,special_rights,current_status,latitude,longitude,public_price,under_100million,sale_month,building_name,dong_name,room_number,ground_floors,underground_floors,households,units,elevators,main_structure,other_purpose,height&filter=id:4579&limit=1"
  ```

## 6. 수용 기준(Acceptance Criteria)

- `/api/v1/items/columns`에 요청 컬럼 키 존재 확인 및 타입/단위 명시
- `/api/v1/items/custom` 단건 필터 방법 공식화(방식/문법) 및 응답 포맷 표준화
- 잘못된 필드명 요청 시 400 응답에 `invalid_fields` 포함
- 위 기준 충족 시 프론트 상세 화면에서 상기 컬럼 모두 정상 노출 확인

## 7. 우선순위 및 일정

- 우선순위: 높음 (상세 UI 데이터 완성도에 직접 영향)
- 요청 완료 희망일: 2025-08-27 (수) 18:00 까지 1차 회신 부탁드립니다.

## 8. 연락처

- 프론트엔드: FE 팀(분석/지도/상세 담당)
- 커뮤니케이션 채널: Communication/Backend 스레드

감사합니다.
