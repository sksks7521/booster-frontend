# [완료 회신] 실거래가(매매) 지역 필터 긴급 수정 완료 (Backend → Frontend)

작성일: 2025-10-02  
상태: Completed  
우선순위: P1 (긴급)  
원본 요청: `251002_Frontend_to_Backend_real-transactions_region-filter_issue.md`

---

## 1) 요약

실거래가(매매) 지역 필터가 작동하지 않던 문제를 확인하여 **4가지 문제를 모두 해결**했습니다.

**✅ 해결 완료:**

1. `sigungu` 파라미터 미인식 문제 수정
2. 실거래가 전용 지역 목록 API 3개 추가 (DB 데이터 기반 동적 목록)
3. `admin_dong_name` (읍면동) 필터 추가
4. `ordering` 파라미터 추가 - Django 스타일 정렬 지원 (auction_ed와 동일)

**⚠️ 프론트엔드 수정 필요:**

- 기존 하드코딩된 지역 목록 대신 **새 API로 동적 목록 사용**
- 시군구 값이 **"경기도 고양시 일산동구"** 형태로 구 단위까지 포함되어야 함

---

## 2) 원인 분석

### 문제 1: 파라미터 이름 불일치

```python
# 문제: 프론트가 보낸 sigungu 파라미터를 백엔드가 인식 못함
프론트 요청: ?sido=경기도&sigungu=경기도 고양시
백엔드 파라미터: address_city (sigungu 파라미터 없음)
결과: sigungu 필터가 완전히 무시됨
```

### 문제 2: DB 데이터 형식 불일치

```
DB 실제 값: "경기도 고양시 일산동구", "경기도 고양시 덕양구" (구 단위까지)
프론트 요청: "경기도 고양시" (시 단위만)
필터 방식: 정확 일치 (==)
결과: 매칭 안됨 → Total: 0
```

**근본 원인:** 실거래가 데이터용 지역 목록 API가 없어서 프론트가 정확한 값을 알 수 없었음

---

## 3) 해결 내용

### 3-1. sigungu 파라미터 추가 (문제 1 해결)

**수정 파일:** `app/api/v1/endpoints/real_transactions.py`

```python
# 루트 엔드포인트 (GET /api/v1/real-transactions/)
@router.get("/")
def read_real_transactions_legacy(
    ...
    sido: Optional[str] = Query(None, description="시도"),
    sigungu: Optional[str] = Query(None, description="시군구"),  # ← 추가
    address_city: Optional[str] = Query(None, description="시군구(호환성용 별칭)"),  # 유지
    admin_dong_name: Optional[str] = Query(None, description="읍면동명 (선택사항)"),  # ← 추가
    ...
):
    # sigungu 우선, 없으면 address_city (하위 호환성)
    effective_sigungu = sigungu or address_city
```

**효과:**

- ✅ 프론트가 보낸 `sigungu` 파라미터 정상 인식
- ✅ 기존 `address_city` 파라미터도 계속 작동 (하위 호환성)

---

### 3-2. 실거래가 전용 지역 목록 API 추가 (문제 2 해결) ⭐ **중요**

**새 API 엔드포인트 3개:**

#### **① 시도 목록 API**

```
GET /api/v1/real-transactions/regions/sido

응답 예시:
[
  { "name": "경기도", "count": 216720 },
  { "name": "서울특별시", "count": 0 },
  { "name": "부산광역시", "count": 0 },
  ...
]
```

#### **② 시군구 목록 API**

```
GET /api/v1/real-transactions/regions/sigungu?sido=경기도

응답 예시:
[
  { "name": "경기도 고양시 덕양구", "count": 7729 },
  { "name": "경기도 고양시 일산동구", "count": 3092 },
  { "name": "경기도 고양시 일산서구", "count": 1529 },
  { "name": "경기도 부천시 원미구", "count": 8234 },
  ...
]
```

#### **③ 읍면동 목록 API (선택사항)**

```
GET /api/v1/real-transactions/regions/admin-dong?sido=경기도&sigungu=경기도 고양시 덕양구

응답 예시:
[
  { "name": "고양동", "count": 48 },
  { "name": "관산동", "count": 56 },
  { "name": "능곡동", "count": 7 },
  ...
]
```

**특징:**

- ✅ 실제 DB 데이터 기반으로 동적 생성
- ✅ 각 지역별 데이터 개수(`count`) 포함
- ✅ 존재하지 않는 지역은 목록에 없음

---

### 3-3. admin_dong_name (읍면동) 필터 추가 (문제 3 해결)

**추가 파라미터:**

```
GET /api/v1/real-transactions/?sido=경기도&sigungu=경기도 고양시 덕양구&admin_dong_name=고양동
```

**효과:**

- ✅ 시도 → 시군구 → 읍면동 단계적 필터링 가능
- ✅ 선택사항이므로 없으면 시군구 전체 데이터 반환

---

### 3-4. ordering 파라미터 추가 (문제 4 해결) ⭐

**수정 파일:** `app/api/v1/endpoints/real_transactions.py`

**추가 엔드포인트:**

- `/` (루트 엔드포인트)
- `/full` 엔드포인트

**Django 스타일 정렬 지원 (auction_ed와 동일):**

```python
# 루트 엔드포인트 (GET /api/v1/real-transactions/)
@router.get("/")
def read_real_transactions_legacy(
    ...
    ordering: Optional[str] = Query(None, description="정렬 (-field 형식, 예: -contract_date)"),
    ...
):
    # ordering 파싱: [-]key → (sort_by, sort_order)
    sort_by: Optional[str] = None
    sort_order: Optional[str] = None
    if ordering:
        key = ordering.strip()
        if key.startswith("-"):
            sort_order = "desc"
            sort_by = key[1:]
        else:
            sort_order = "asc"
            sort_by = key
```

**사용 예시:**

```bash
# 계약일 최신순 (내림차순)
GET /api/v1/real-transactions/?ordering=-contract_date

# 거래금액 낮은순 (오름차순)
GET /api/v1/real-transactions/?ordering=transaction_amount

# 전용면적 넓은순 (내림차순)
GET /api/v1/real-transactions/?ordering=-exclusive_area_sqm

# 건축연도 최신순
GET /api/v1/real-transactions/?ordering=-construction_year
```

**지원 필드:**

- `contract_date` (계약일) - **프론트 기본값: `-contract_date`**
- `transaction_amount` (거래금액)
- `exclusive_area_sqm` (전용면적)
- `construction_year` (건축연도)

**효과:**

- ✅ auction_ed와 동일한 정렬 방식 (일관성)
- ✅ `-` 접두사로 내림차순/오름차순 직관적 지정
- ✅ 한 파라미터로 간결한 URL

**참고:**

- `/simple` 엔드포인트는 기존 `sort_by`, `sort_order` 방식 유지 (하위 호환성)

---

## 4) 프론트엔드 수정 가이드 ⚠️ **필수 확인**

### 4-1. 기존 방식 (작동 안 함)

```typescript
// ❌ 문제: 하드코딩된 값 또는 임의의 값
const cityDistrict = "경기도 고양시"; // 구가 없음

// API 호출
fetch(`/api/v1/real-transactions/?sido=경기도&sigungu=${cityDistrict}`);
// → Total: 0 (DB에 "경기도 고양시"는 없음)
```

---

### 4-2. 새 방식 (권장) ⭐

#### **Step 1: 시도 목록 불러오기**

```typescript
// 페이지 로드 시 시도 목록 불러오기
const sidoListResponse = await fetch("/api/v1/real-transactions/regions/sido");
const sidoList = await sidoListResponse.json();
// [{ name: "경기도", count: 216720 }, ...]

// 드롭다운에 표시
<select onChange={(e) => setSido(e.target.value)}>
  {sidoList.map((item) => (
    <option value={item.name}>
      {item.name} ({item.count.toLocaleString()}건)
    </option>
  ))}
</select>;
```

#### **Step 2: 사용자가 시도 선택 → 시군구 목록 불러오기**

```typescript
// 사용자가 "경기도" 선택 시
const sigunguListResponse = await fetch(
  `/api/v1/real-transactions/regions/sigungu?sido=${encodeURIComponent(sido)}`
);
const sigunguList = await sigunguListResponse.json();
// [
//   { name: "경기도 고양시 덕양구", count: 7729 },
//   { name: "경기도 고양시 일산동구", count: 3092 },
//   ...
// ]

// 드롭다운에 표시
<select onChange={(e) => setSigungu(e.target.value)}>
  {sigunguList.map((item) => (
    <option value={item.name}>
      {item.name} ({item.count.toLocaleString()}건)
    </option>
  ))}
</select>;
```

#### **Step 3: 정확한 시군구 값으로 데이터 조회 (정렬 포함)**

```typescript
// 사용자가 "경기도 고양시 덕양구" 선택 시
const response = await fetch(
  `/api/v1/real-transactions/?` +
    `sido=${encodeURIComponent(sido)}&` +
    `sigungu=${encodeURIComponent(sigungu)}&` + // "경기도 고양시 덕양구" 전체
    `ordering=-contract_date&` + // 계약일 최신순 (기본값)
    `page=1&size=20`
);

const data = await response.json();
// ✅ Total: 7729 (정상!)

// 다른 정렬 옵션 예시:
// ordering=transaction_amount (거래금액 낮은순)
// ordering=-transaction_amount (거래금액 높은순)
// ordering=-exclusive_area_sqm (면적 넓은순)
```

#### **Step 4 (선택): 읍면동까지 선택**

```typescript
// 사용자가 더 세밀하게 필터링하고 싶을 때
const dongListResponse = await fetch(
  `/api/v1/real-transactions/regions/admin-dong?` +
    `sido=${encodeURIComponent(sido)}&` +
    `sigungu=${encodeURIComponent(sigungu)}`
);
const dongList = await dongListResponse.json();
// [{ name: "고양동", count: 48 }, ...]

// 읍면동까지 선택하면
const response = await fetch(
  `/api/v1/real-transactions/?` +
    `sido=${encodeURIComponent(sido)}&` +
    `sigungu=${encodeURIComponent(sigungu)}&` +
    `admin_dong_name=${encodeURIComponent(adminDongName)}&` +
    `page=1&size=20`
);
// ✅ Total: 48 (고양동만)
```

---

### 4-3. UX 개선 제안

#### **옵션 A: 단계적 드릴다운 (추천)**

```
시도 선택 → 시군구 목록 로드 → 시군구 선택 → 데이터 표시
              ↓ (선택사항)
            읍면동 목록 로드 → 읍면동 선택 → 더 세밀한 데이터 표시
```

**장점:** 사용자가 원하는 단계에서 멈출 수 있음 (유연성)

#### **옵션 B: 각 단계에서 바로 데이터 표시**

```
시도 선택 → 전체 시도 데이터 표시 (지도에 마커)
  ↓ 시군구 선택
시군구 데이터만 표시 (줌인)
  ↓ 읍면동 선택 (선택사항)
읍면동 데이터만 표시 (더 줌인)
```

**장점:** 탐색하면서 점점 좁혀가는 자연스러운 UX

---

## 5) 검증 결과

### 5-1. 시나리오 테스트

```bash
# 테스트 1: 지역 목록 API
GET /api/v1/real-transactions/regions/sido
→ ✅ 17개 시도 반환

GET /api/v1/real-transactions/regions/sigungu?sido=경기도
→ ✅ 44개 시군구 반환 (고양시 3개 구 포함)

GET /api/v1/real-transactions/regions/admin-dong?sido=경기도&sigungu=경기도 고양시 덕양구
→ ✅ 13개 읍면동 반환

# 테스트 2: 정확한 시군구 값으로 데이터 조회
GET /api/v1/real-transactions/?sido=경기도&sigungu=경기도 고양시 덕양구
→ ✅ Total: 7,729건 (성공!)

# 테스트 3: 읍면동 필터 적용
GET /api/v1/real-transactions/?sido=경기도&sigungu=경기도 고양시 덕양구&admin_dong_name=고양동
→ ✅ Total: 48건 (정확히 필터링됨!)

# 테스트 4: ordering 파라미터 (계약일 최신순)
GET /api/v1/real-transactions/?ordering=-contract_date&page=1&size=5
→ ✅ Total: 727,423건, 첫 번째 계약일이 가장 최신

# 테스트 5: ordering 파라미터 (거래금액 오름차순)
GET /api/v1/real-transactions/?ordering=transaction_amount&page=1&size=5
→ ✅ 첫 번째 금액 <= 두 번째 금액 (정렬 정상)

# 테스트 6: ordering 파라미터 (전용면적 내림차순)
GET /api/v1/real-transactions/?ordering=-exclusive_area_sqm&page=1&size=5
→ ✅ 첫 번째 면적 >= 두 번째 면적 (정렬 정상)
```

---

## 6) 주요 변경 사항 정리

| 구분            | 변경 전                       | 변경 후                                                         |
| --------------- | ----------------------------- | --------------------------------------------------------------- |
| **시도 선택**   | 하드코딩 또는 경매 API 재사용 | 실거래가 전용 API (`/regions/sido`)                             |
| **시군구 선택** | 하드코딩 또는 "경기도 고양시" | 실거래가 전용 API (`/regions/sigungu`) → "경기도 고양시 덕양구" |
| **읍면동 선택** | 지원 안 함                    | 새 API (`/regions/admin-dong`) + `admin_dong_name` 파라미터     |
| **정렬 방식**   | 지원 안 함 (루트, /full)      | `ordering` 파라미터 추가 (Django 스타일, auction_ed와 동일)     |
| **필터 결과**   | Total: 0 (매칭 안됨)          | Total: 7,729 (정상)                                             |

---

## 7) API 레퍼런스

### 7-1. 지역 목록 API

#### `GET /api/v1/real-transactions/regions/sido`

**설명:** 실거래가 데이터에서 시도 목록 반환  
**파라미터:** 없음  
**응답:**

```json
[
  { "name": "경기도", "count": 216720 },
  { "name": "서울특별시", "count": 0 }
]
```

#### `GET /api/v1/real-transactions/regions/sigungu`

**설명:** 실거래가 데이터에서 시군구 목록 반환  
**파라미터:**

- `sido` (optional): 시도로 필터링

**응답:**

```json
[
  { "name": "경기도 고양시 덕양구", "count": 7729 },
  { "name": "경기도 고양시 일산동구", "count": 3092 }
]
```

#### `GET /api/v1/real-transactions/regions/admin-dong`

**설명:** 실거래가 데이터에서 읍면동 목록 반환  
**파라미터:**

- `sido` (optional): 시도로 필터링
- `sigungu` (optional): 시군구로 필터링

**응답:**

```json
[
  { "name": "고양동", "count": 48 },
  { "name": "관산동", "count": 56 }
]
```

---

### 7-2. 실거래가 데이터 조회 API (수정됨)

#### `GET /api/v1/real-transactions/`

**변경/추가 파라미터:**

- `sigungu` (추가): 시군구 필터 - **"경기도 고양시 덕양구"** 형태
- `admin_dong_name` (추가): 읍면동 필터 (선택사항)
- `ordering` (추가): 정렬 필드 - **Django 스타일** (`-field` 형식)

**지원 정렬 필드:**

- `contract_date` (계약일)
- `transaction_amount` (거래금액)
- `exclusive_area_sqm` (전용면적)
- `construction_year` (건축연도)

**예시:**

```bash
# 시군구까지 + 계약일 최신순 (기본값)
/api/v1/real-transactions/?sido=경기도&sigungu=경기도 고양시 덕양구&ordering=-contract_date

# 읍면동까지 (선택) + 거래금액 낮은순
/api/v1/real-transactions/?sido=경기도&sigungu=경기도 고양시 덕양구&admin_dong_name=고양동&ordering=transaction_amount

# 전용면적 넓은순
/api/v1/real-transactions/?sido=경기도&ordering=-exclusive_area_sqm
```

#### `GET /api/v1/real-transactions/full`

동일한 파라미터 지원 (`sigungu`, `admin_dong_name`, `ordering`)

#### `GET /api/v1/real-transactions/simple`

기존 `sort_by`, `sort_order` 방식 유지 (하위 호환성)

---

## 8) 마이그레이션 체크리스트

프론트엔드에서 확인해주세요:

- [ ] 지역 목록을 `/regions/sido`, `/regions/sigungu` API로 동적으로 불러오도록 변경
- [ ] 시군구 값이 **구 단위까지 포함**된 정확한 값으로 요청되는지 확인
- [ ] 읍면동 필터 사용 여부 결정 (선택사항)
- [ ] URL 인코딩 적용 (`encodeURIComponent`)
- [ ] 기존 하드코딩된 지역 목록 제거
- [ ] 드롭다운 UI에 데이터 개수(`count`) 표시 여부 결정

---

## 9) 마이그레이션 체크리스트 (추가)

**정렬 기능 관련:**

- [ ] `ordering` 파라미터 사용 (Django 스타일)
  - 예: `ordering=-contract_date` (계약일 최신순)
- [ ] 기본 정렬: `-contract_date` 적용 여부 결정
- [ ] 사용자 정렬 옵션 UI 추가 여부 결정
  - 드롭다운: "계약일 최신순", "거래금액 낮은순", "면적 넓은순" 등

---

## 10) 질문/피드백

궁금한 점이나 추가 요청사항이 있으시면 알려주세요.

- 지역 목록 API 응답 형식 변경 필요 여부
- 읍면동 필터를 필수로 할지 선택사항으로 할지
- 데이터 개수(`count`) 표시 방식
- 정렬 기본값 설정 (`-contract_date` 권장)
- 사용자 정렬 UI 디자인 제안
- 기타 UX 개선 아이디어

---

## 11) 참고: auction_ed와의 일관성

이번 수정으로 실거래가 API가 경매 완료(auction_ed) API와 동일한 방식을 사용하게 되었습니다:

| 기능          | auction_ed            | real_transactions         | 상태    |
| ------------- | --------------------- | ------------------------- | ------- |
| **지역 API**  | `/regions/sido` 등    | `/regions/sido` 등        | ✅ 동일 |
| **정렬 방식** | `ordering=-sale_date` | `ordering=-contract_date` | ✅ 동일 |
| **필터 구조** | sido/address_city     | sido/sigungu              | ✅ 동일 |

**장점:**

- 프론트엔드 코드 재사용 가능
- 학습 곡선 감소
- 유지보수 용이

---

감사합니다!  
Backend 담당 드림.
