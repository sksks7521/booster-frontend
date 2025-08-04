# Booster 팀 커뮤니케이션 가이드: Frontend ↔ Backend (v1.0)

## 1. 이 문서의 목적

이 문서는 **프론트엔드**와 **백엔드** 담당자가 API를 중심으로 작업을 요청하고, 변경사항을 공유하며, 완료된 작업을 추적하는 모든 절차와 양식을 정의합니다.

- **핵심 원칙:** 모든 소통은 '요청서(MD 파일)' 작성을 통해 이루어집니다. 각 담당자는 상대방에게 전달받은 요청서의 내용을 신뢰할 수 있는 유일한 작업 지시서(Single Source of Truth)로 간주합니다.

---

## 2. 요청서(MD 파일) 관리 원칙

### 2.1. 저장 위치 및 파일명

- **프론트엔드 → 백엔드 요청 시:**

  - 발신함: `booster-Frontend\Communication\Backend\send\Request`
  - 수신함: `booster-Backend\Communication\Frontend\receive\Request`
  - 파일명: `YYMMDD_Frontend_to_Backend_요청제목.md`

  - 발신 요청 완료함: `booster-Frontend\Communication\Backend\send\Completed\`
  - 수신 요청 완료함: `booster-Backend\Communication\Frontend\receive\Completed\`
  - 요청사항 완료 후 파일명 : `YYMMDD_Frontend_to_Backend_요청제목_완료.md`

- **백엔드 → 프론트엔드 요청 시:**

  - 발신함: `booster-Backend\Communication\Frontend\send\Request`
  - 수신함: `booster-Frontend\Communication\Backend\receive\Request`
  - 파일명: `YYMMDD_Backend_to_Frontend_요청제목.md`

  - 발신 요청 완료함 : `booster-Backend\Communication\Frontend\send\Completed\`
  - 수신 요청 완료함 : `booster-Frontend\Communication\Backend\receive\Completed\`
  - 요청사항 완료 후 파일명 : `YYMMDD_Backend_to_Frontend_요청제목_완료.md`

### 2.2. 요청서 진행 상태(Status) 관리

**1. 요청 생성 (Requester):**

- 요청자는 `Request` 폴더에 새로운 요청서(.md)를 생성합니다.
- 요청서의 `Status`는 `Requested`로 설정합니다.
  **1. 요청 생성 (Requester):**
- 요청자는 `Request` 폴더에 새로운 요청서(.md)를 생성합니다.
- 요청서의 `Status`는 `Requested`로 설정합니다.
  **3. 작업 진행 및 완료 (Assignee):**
- 요청받은 작업을 수행합니다.
- 작업 완료 후, **요청서 파일 자체를 수정**합니다. - `Status`를 `Done`으로 변경하고 `Completed At` 날짜를 기입합니다. - `History`에 완료 기록을 추가합니다.
  **4. 완료 처리 (Assignee):**
- 내용 수정이 완료된 요청서 파일의 이름에 `_완료` 접미사를 붙입니다.
- **수정된 파일을 자신의 `receive\Completed\` 폴더로 이동시킵니다.**
- **동시에, 수정된 파일을 상대방의 `send\Completed\` 폴더에도 복사/이동시킵니다.** (매니저 전달)
- 이제 이 작업은 양쪽 모두에게 '완료'된 것으로 기록되며, `Request` 폴더에는 처리해야 할 작업만 남게 됩니다.

## 3. 요청서 표준 템플릿

**모든 요청은 반드시 아래 템플릿을 사용하여 작성합니다.**

```markdown
# [프론트엔드→인프] 요청서 제목 (YYYY-MM-DD)

## 1. 요청 개요 (Why?)

- (요청의 목적과 비즈니스적인 배경을 구체적으로 작성합니다. "왜" 이 작업이 필요한지 상대방이 이해하는 것이 가장 중요합니다.)

## 2. 작업 요청 사항 (What & How?)

- (상대방이 수행해야 할 작업을 최대한 구체적이고 명확하게, 기술적인 용어로 작성합니다. 체크리스트 형식을 권장합니다.)

- **[ ] 작업 1:**
- **[ ] 작업 2:**

## 3. 관련 정보 (Reference)

- (작업에 필요한 모든 추가 정보를 제공합니다.)
- **관련 PR 링크:**
- **참고 API 문서 링크:**
- **참고 UI 목업/디자인 링크:**
- **기타 제약 조건 및 주의사항:**

## 4. 진행 상태

- **Status:** Requested
- **Requester:** (요청자)
- **Assignee:** (담당자)
- **Requested At:** (요청일)
- **Completed At:**
- **History:**
  - (요청일): 요청서 작성
```

---

## 4. 상세 시나리오별 요청서 작성 예시 (프론트엔드 → 백엔드)

이 항목은 프론트엔드 개발에 필요한 API를 백엔드 팀에 공식적으로 요청하기 위해 작성되었습니다. 각 시나리오는 Booster 프로젝트의 실제 사용자 행동 흐름에 따라 필요한 데이터와 기능을 명시합니다.

### **시나리오 1: 통합 분석 화면 - 필터링 및 초기 뷰 API 개발 요청**

```markdown
# [프론트엔드→백엔드] 통합 분석 화면을 위한 다중 조건 검색 API 개발 요청 (2025-08-05)

## 1. 요청 개요 (Why?)

- '통합 분석' 페이지는 사용자가 여러 필터(지역, 건축연도, 면적 등)를 조합하여 원하는 물건을 빠르게 찾는 핵심 기능입니다.
- 이를 위해, 프론트엔드에서 보낸 다중 필터 조건에 맞는 물건 목록을 반환하는 API가 필요합니다.
- API는 한 번의 호출로 지도에 표시할 정보와 테이블에 표시할 정보를 함께 내려주어 통신 효율을 높여야 합니다.

## 2. 작업 요청 사항 (What & How?)

- [ ] 아래 명세에 맞는 신규 API를 개발해주세요.
  - **HTTP Method:** `GET`
  - **Endpoint (제안):** `/api/v1/items`
- [ ] 아래 표의 `Query Parameters`를 모두 수용하여 필터링 로직을 구현해주세요.
      | 파라미터명 | 타입 | 설명 | 예시 |
      | ---------------- | ------- | -------------------- | ----------- |
      | `region_code` | string | 지역 코드 (e.g., 수원시 팔달구) | `41117` |
      | `min_built_year` | integer | 최소 건축연도 | `2015` |
      | `max_area` | float | 최대 전용면적(m²) | `85.5` |
      | `has_elevator` | boolean | 엘리베이터 유무 | `true` |
      | `page` | integer | 페이지 번호 (페이지네이션) | `1` |
      | `limit` | integer | 페이지당 아이템 수 | `50` |
- [ ] API 응답 데이터는 아래 `Response (Success)` JSON 형식을 정확히 따라야 합니다.

## 3. 관련 정보 (Reference)

- **요청 데이터 형식 (Query Parameters):**
```

?region_code=41117&min_built_year=2015&max_area=85.5&has_elevator=true&page=1&limit=50

````
- **응답 데이터 형식 (Response):**
```json
{
  "total_count": 127,
  "items": [
    {
      "item_id": "auction-12345",
      "type": "auction",
      "coordinates": { "lat": 37.5665, "lng": 126.9780 },
      "price": 550000000,
      "address": "서울시 중구 세종대로 110",
      "built_year": 2018,
      "area": 84.9,
      "floor": 12
    }
  ]
}
````

- **참고 UI 목업 링크:** `https://www.figma.com/file/booster-prototype/...`
- **기타 제약 조건:** 필터 조건에 맞는 데이터가 없을 경우, `total_count: 0`과 빈 배열 `items: []`을 반환해주세요.

## 4. 진행 상태

- **Status:** Requested
- **Requester:** 프론트엔드 담당자
- **Assignee:** 백엔드 담당자
- **Requested At:** 2025-08-05
- **Completed At:**
- **History:**
  - 2025-08-05: 요청서 작성

````

### **시나리오 2: 상세 분석 화면 - 특정 물건 및 비교 데이터 조회 API 개발 요청**

```markdown
# [프론트엔드→백엔드] 상세 분석 페이지를 위한 개별 API 2종 개발 요청 (2025-08-06)

## 1. 요청 개요 (Why?)
- 사용자가 특정 물건을 클릭하면, 해당 물건의 모든 정보와 함께 주변의 유사 물건(경매, 실거래) 데이터를 비교 분석하는 '상세 분석' 페이지로 이동합니다.
- 이를 위해 '특정 물건의 모든 정보를 가져오는 API'와 '유사 조건의 비교 데이터를 타입별로 가져오는 API'가 각각 필요합니다.

## 2. 작업 요청 사항 (What & How?)
- **[ ] 작업 1: 특정 물건 기본 정보 조회 API 개발**
  - **HTTP Method:** `GET`, **Endpoint:** `/api/v1/items/{item_id}`
  - **Response:** 해당 `item_id`에 대한 모든 상세 정보(건축물대장, 권리분석 등)를 포함한 JSON 객체
- **[ ] 작업 2: 유사 조건 비교 데이터 조회 API 개발**
  - **HTTP Method:** `GET`, **Endpoint:** `/api/v1/items/{item_id}/comparables`
  - **Request (Query Param):** `data_type` (Enum: `auction`, `trade_sale`, `trade_rent`)
  - **Response:** 시나리오 1의 `items` 배열과 동일한 형식으로, 요청된 `data_type`에 맞는 유사 물건 목록 반환
  - '유사 조건'의 기준(e.g., 반경 500m, 면적 ±10%)은 백엔드에서 정의합니다.

## 3. 관련 정보 (Reference)
- **참고 UI 목업 링크:** `https://www.figma.com/file/booster-prototype-detail/...`
- **기타 제약 조건:** 데이터 로딩 속도를 위해 두 API는 분리되어야 합니다. 사용자가 탭을 클릭할 때마다 비교 데이터 API가 호출될 것입니다.

## 4. 진행 상태
- **Status:** Requested
- **Requester:** 프론트엔드 담당자
- **Assignee:** 백엔드 담당자
- **Requested At:** 2025-08-06
- **Completed At:**
- **History:**
  - 2025-08-06: 요청서 작성
````

### **시나리오 3: 사용자 기능 - 관심 물건 API 3종 개발 요청**

```markdown
# [프론트엔드→백엔드] '관심 물건' 기능 관련 API 3종 개발 요청 (2025-08-07)

## 1. 요청 개요 (Why?)

- 사용자가 중요한 물건을 저장하고 다시 볼 수 있는 '관심 물건' 기능을 구현합니다.
- 이를 위해 관심 물건을 '추가', '삭제', '목록 조회'하는 3가지 API가 필요합니다.
- 모든 API는 사용자가 로그인한 상태에서만 접근 가능해야 합니다. (인증 필요)

## 2. 작업 요청 사항 (What & How?)

- [ ] **작업 1: 관심 물건 목록 조회 API 개발**
  - **HTTP Method:** `GET`, **Endpoint:** `/api/v1/me/favorites`
- [ ] **작업 2: 관심 물건 추가 API 개발**
  - **HTTP Method:** `POST`, **Endpoint:** `/api/v1/me/favorites`
  - **Request Body:** `{ "item_id": "auction-12345" }`
- [ ] **작업 3: 관심 물건 삭제 API 개발**
  - **HTTP Method:** `DELETE`, **Endpoint:** `/api/v1/me/favorites/{item_id}`

## 3. 관련 정보 (Reference)

- **참고 UI 목업 링크:** `https://www.figma.com/file/booster-prototype-mypage/...`
- **기타 제약 조건:** 모든 API는 `access_token`을 통한 인증이 필요합니다.

## 4. 진행 상태

- **Status:** Requested
- **Requester:** 프론트엔드 담당자
- **Assignee:** 백엔드 담당자
- **Requested At:** 2025-08-07
- **Completed At:**
- **History:**
  - 2025-08-07: 요청서 작성
```
