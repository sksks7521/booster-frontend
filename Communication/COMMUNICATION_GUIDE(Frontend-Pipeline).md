# Booster 팀 커뮤니케이션 가이드: Frontend ↔ Pipeline (v1.0)

## 1. 이 문서의 목적

이 문서는 **프론트엔드 담당자**가 신규 기능 개발이나 기능 개선에 필요한 데이터가 현재 DB에 없을 때, **데이터 파이프라인 담당자**에게 해당 데이터의 수집 및 가공을 요청하는 절차와 양식을 정의합니다.

- **핵심 원칙:** 모든 소통은 '요청서(MD 파일)' 작성을 통해 이루어집니다. 프론트엔드는 필요한 데이터의 명세와 이유를 명확히 전달하고, 파이프라인 담당자는 이 요청서를 기반으로 데이터 수집 및 처리 작업을 진행합니다.

---

## 2. 요청서(MD 파일) 관리 원칙

### 2.1. 저장 위치 및 파일명

- **프론트엔드 → 파이프라인 요청 시:**

  - 발신함: `booster-Frontend\Communication\Pipeline\send\Request`
  - 수신함: `booster-Pipeline\Communication\Frontend\receive\Request`
  - 파일명: `YYMMDD_Frontend_to_Pipeline_요청제목.md`

  - 발신 요청 완료함: `booster-Frontend\Communication\Pipeline\send\Completed\`
  - 수신 요청 완료함: `booster-Pipeline\Communication\Frontend\receive\Completed\`
  - 요청사항 완료 후 파일명 : `YYMMDD_Frontend_to_Pipeline_요청제목_완료.md`

- **파이프라인 → 프론트엔드 요청/알림 시:**

  - 발신함: `booster-Pipeline\Communication\Frontend\send\Request`
  - 수신함: `booster-Frontend\Communication\Pipeline\receive\Request`
  - 파일명: `YYMMDD_Pipeline_to_Frontend_요청제목.md`

  - 발신 요청 완료함 : `booster-Pipeline\Communication\Frontend\send\Completed\`
  - 수신 요청 완료함 : `booster-Frontend\Communication\Pipeline\receive\Completed\`
  - 요청사항 완료 후 파일명 : `YYMMDD_Pipeline_to_Frontend_요청제목_완료.md`

### 2.2. 요청서 진행 상태(Status) 관리

**1. 요청 생성 (Requester):**

- 요청자는 `Request` 폴더에 새로운 요청서(.md)를 생성합니다.
- 요청서의 `Status`는 `Requested`로 설정합니다.

**2. 작업 진행 및 완료 (Assignee):**

- 요청받은 작업을 수행합니다.
- 작업 완료 후, **요청서 파일 자체를 수정**합니다.
  - `Status`를 `Done`으로 변경하고 `Completed At` 날짜를 기입합니다.
  - `History`에 완료 기록을 추가합니다.

**3. 완료 처리 (Assignee):**

- 내용 수정이 완료된 요청서 파일의 이름에 `_완료` 접미사를 붙입니다.
- **수정된 파일을 자신의 `receive\Completed\` 폴더로 이동시킵니다.**
- **동시에, 수정된 파일을 상대방의 `send\Completed\` 폴더에도 복사/이동시킵니다.**
- 이제 이 작업은 양쪽 모두에게 '완료'된 것으로 기록되며, `Request` 폴더에는 처리해야 할 작업만 남게 됩니다.

---

## 3. 요청서 표준 템플릿

**모든 요청은 반드시 아래 템플릿을 사용하여 작성합니다.**

```markdown
# [FROM→TO] 요청서 제목 (YYYY-MM-DD)

## 1. 요청 개요 (Why?)

- (요청의 목적과 비즈니스적인 배경을 구체적으로 작성합니다. "왜" 이 작업이 필요한지 상대방이 이해하는 것이 가장 중요합니다.)

## 2. 작업 요청 사항 (What & How?)

- (상대방이 수행해야 할 작업을 최대한 구체적이고 명확하게, 기술적인 용어로 작성합니다. 체크리스트 형식을 권장합니다.)

- **[ ] 작업 1:**
- **[ ] 작업 2:**

## 3. 관련 정보 (Reference)

- (작업에 필요한 모든 추가 정보를 제공합니다.)
- **관련 프론트엔드 PR 링크:**
- **참고 UI 목업/디자인 링크:**
- **데이터 소스 URL:** (데이터를 가져올 수 있는 웹 페이지 등)
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

## 4. 상세 시나리오별 요청서 작성 예시 (프론트엔드 → 파이프라인)

### 시나리오 1: 신규 필터 기능 구현을 위한 데이터 수집 요청

```markdown
# [프론트엔드→파이프라인] '주차 가능 여부' 필터링을 위한 데이터 수집 요청 (2025-08-10)

## 1. 요청 개요 (Why?)

- 사용자들이 '주차 가능한' 빌라만 필터링해서 볼 수 있는 기능을 프론트엔드에 추가하려고 합니다.
- 현재 DB의 `items` 테이블에는 주차 관련 정보가 없어, 필터링 기능 구현이 불가능합니다.
- 따라서 데이터 파이프라인에서 '주차 가능 여부' 데이터를 추가로 수집하여 DB에 저장해주셔야 합니다.

## 2. 작업 요청 사항 (What & How?)

- [ ] 데이터 소스(예: 네이버 부동산)에서 '주차 가능 여부' 정보를 추가로 크롤링하는 로직을 파이프라인에 추가해주세요.
- [ ] 수집된 데이터를 저장할 컬럼(`is_parking_available`, Boolean)을 `items` 테이블에 추가하는 작업은 백엔드팀에 별도 요청했습니다.
- [ ] 수집한 주차 가능 여부(`True` 또는 `False`) 값을 해당 컬럼에 저장하도록 파이프라인 스크립트를 수정해주세요.

## 3. 관련 정보 (Reference)

- **관련 프론트엔드 PR 링크:** `https://github.com/sksks7521/booster-frontend/pull/10`
- **참고 UI 목업 링크:** `https://www.figma.com/file/booster-prototype/filters...`
- **데이터 소스 URL:** (주차 정보가 명시된 네이버 부동산 상세 페이지 등)
- **기타 제약 조건 및 주의사항:** 주차 정보 확인이 불가능할 경우, 해당 컬럼 값은 `NULL` 또는 `False`로 처리하는 정책 정의가 필요합니다.

## 4. 진행 상태

- **Status:** Requested
- **Requester:** 프론트엔드 담당자
- **Assignee:** 파이프라인 담당자
- **Requested At:** 2025-08-10
- **Completed At:**
- **History:**
  - 2025-08-10: 프론트엔드 담당자가 요청서 작성
```

### 시나리오 2: 분석 정확도 향상을 위한 데이터 정제(Cleansing) 요청

```markdown
# [프론트엔드→파이프라인] 주소 데이터 정제를 통한 검색 정확도 개선 요청 (2025-08-15)

## 1. 요청 개요 (Why?)

- 프론트엔드에서 지역(시/군/구) 필터 사용 시, 동일한 지역임에도 불구하고 '서울특별시', '서울시', '서울' 등이 다른 지역으로 인식되어 검색 결과가 누락되는 문제가 발생하고 있습니다.
- 이는 `items.address` 컬럼에 비표준화된 주소 데이터가 혼재되어 있기 때문입니다.
- 데이터의 일관성을 확보하여 분석 및 검색 정확도를 높이기 위해, 주소 데이터를 표준화된 형태로 정제하는 작업이 필요합니다.

## 2. 작업 요청 사항 (What & How?)

- [ ] 파이프라인에서 데이터를 DB에 저장하기 전, 주소 데이터의 앞부분(시/도)을 표준화된 약칭으로 변환하는 로직을 추가해주세요.
  - **변환 규칙 예시:**
    - "서울특별시", "서울시" → "서울"
    - "경기도", "경기" → "경기"
    - "부산광역시", "부산시" → "부산"
- [ ] 위 규칙을 적용하여 `items.address` 컬럼의 데이터를 일관된 형태로 업데이트 해주세요.

## 3. 관련 정보 (Reference)

- **문제가 발생하는 화면:** 통합 분석 페이지 (`/analysis`)
- **기타 제약 조건 및 주의사항:** 이 작업은 기존에 저장된 모든 주소 데이터에 대해서도 일괄 적용(Backfill)이 필요합니다.

## 4. 진행 상태

- **Status:** Requested
- **Requester:** 프론트엔드 담당자
- **Assignee:** 파이프라인 담당자
- **Requested At:** 2025-08-15
- **Completed At:**
- **History:**
  - 2025-08-15: 프론트엔드 담당자가 요청서 작성
```

### 시나리오 3: 신규 데이터 소스 추가 및 가공 요청

```markdown
# [프론트엔드→파이프라인] '학군 정보' 비교 기능을 위한 데이터 소스 추가 요청 (2025-09-01)

## 1. 요청 개요 (Why?)

- 서비스의 핵심 경쟁력 강화를 위해, 상세 분석 페이지에서 매물 주변의 '학군 정보(초/중/고등학교 배정 정보)'를 비교 분석하는 기능을 추가하고자 합니다.
- 현재 DB에는 학군 관련 데이터가 전혀 없으므로, 신규 데이터 소스에서 관련 정보를 수집하고 가공하여 DB에 저장하는 작업이 필요합니다.

## 2. 작업 요청 사항 (What & How?)

- [ ] '호갱노노' 또는 유사 서비스에서 특정 아파트/빌라 주소 기준의 학군 정보를 수집하는 신규 파이프라인 스크립트를 개발해주세요.
- [ ] 수집할 데이터 필드(제안):
  - `school_name` (학교명)
  - `school_type` (초/중/고)
  - `distance_in_meters` (매물과의 직선 거리)
  - `student_count_per_class` (학급당 학생 수)
- [ ] 수집된 데이터를 저장할 신규 테이블(`school_info`) 생성은 백엔드팀에 별도 요청하겠습니다. 파이프라인은 해당 테이블에 데이터를 저장하면 됩니다.

## 3. 관련 정보 (Reference)

- **참고 UI 목업 링크:** `https://www.figma.com/file/booster-prototype/school-info...`
- **데이터 소스 URL 예시:** `https://www.hogangnono.com/apt/ ...`
- **기타 제약 조건 및 주의사항:** 학군 정보는 민감할 수 있으므로, 데이터 수집 시 법적/약관 이슈가 없는지 사전 검토가 필요합니다.

## 4. 진행 상태

- **Status:** Requested
- **Requester:** 프론트엔드 담당자
- **Assignee:** 파이프라인 담당자
- **Requested At:** 2025-09-01
- **Completed At:**
- **History:**
  - 2025-09-01: 프론트엔드 담당자가 요청서 작성
```
