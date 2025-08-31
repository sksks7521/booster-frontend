# [긴급] Analysis 필터 연동 - 백엔드 서버/API 상태 확인 요청 (Frontend → Backend)

- **상태**: Done
- **우선순위**: High (긴급)
- **날짜**: 2025-01-17
- **요청팀**: Frontend
- **대상팀**: Backend
- **관련 문서**: `Communication/Backend/receive/Request/250817_Backend_to_Frontend_Analysis_Filters_데이터사양_및_연동가이드_완료.md`
- **완료일**: 2025-08-19

---

## ✅ 해결 결과 요약 (Backend → Frontend)

- Docker/DB 복구 및 `.env`(UTF-8 without BOM) 정리 완료, `auction_items` 1000건 적재
- API 정상 동작 확인
  - `GET /api/v1/locations/sido` → 200 OK, 다수 지역 반환
  - `GET /api/v1/locations/tree-simple` → 200 OK, { provinces/cities/districts } 구조 반환
  - `GET /api/v1/items/simple` → 200 OK (필터 정상 동작)
- 프론트 적용 포인트
  - `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`
  - 초기 로드시 `GET /api/v1/locations/tree-simple`로 상태 채우기(SWR/React Query 캐시)

---

## 📋 **요청 배경**

### **현재 상황**

- ✅ **백엔드 가이드**: 수신 완료 (250817)
- ✅ **프론트엔드 연동 코드**: 구현 완료 (`useLocations.ts`, `useItems.ts`, `FilterControl.tsx`)
- ❌ **실제 API 연동**: **실패** - 시도명 드롭다운이 비어있음

### **증상**

- 프론트엔드에서 `GET /api/v1/locations/tree-simple` 호출 시 응답 없음
- `useLocationsSimple()` 훅에서 `locations` 데이터가 `undefined` 상태
- 지역 선택 Select 드롭다운에 데이터가 표시되지 않음

---

## 🆘 **확인 요청사항** (체크리스트)

### **1️⃣ 백엔드 서버 실행 상태**

```bash
[ ] FastAPI 서버가 현재 실행 중인가요?
[ ] 실행 포트 번호: 8000? 8001? 기타 포트?
[ ] 다음 URL에 접속 가능한가요?
    - http://localhost:{포트}/docs (Swagger 문서)
    - http://localhost:{포트}/api/v1/ (기본 라우트)
```

**확인 방법**:

```bash
# 서버 실행 상태 확인
netstat -an | findstr ":8000 :8001"

# 또는 직접 브라우저에서 접속
http://localhost:8000/docs
http://localhost:8001/docs
```

### **2️⃣ API 엔드포인트 동작 확인**

```bash
[ ] GET /api/v1/locations/tree-simple
[ ] GET /api/v1/locations/sido
[ ] GET /api/v1/items/simple
```

**테스트 요청**:

```bash
# PowerShell에서 테스트
curl http://localhost:8000/api/v1/locations/tree-simple
curl http://localhost:8001/api/v1/locations/tree-simple

# 또는 브라우저에서 직접 접속하여 JSON 응답 확인
```

**기대 응답 (tree-simple)**:

```json
{
  "provinces": ["서울특별시", "경기도", ...],
  "cities": { "서울특별시": ["강남구", "서초구", ...], ... },
  "districts": { "강남구": ["역삼동", "삼성동", ...], ... }
}
```

### **3️⃣ CORS 설정 확인**

```python
[ ] CORS가 localhost:3000 허용되어 있나요?
[ ] 프론트엔드에서 API 호출 시 CORS 에러 발생하지 않나요?
```

**CORS 설정 예시**:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",     # 프론트엔드 개발 서버
        "http://127.0.0.1:3000"     # 대체 주소
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

### **4️⃣ 데이터베이스 상태 확인**

```sql
[ ] auction_items 테이블에 데이터가 존재하나요?
[ ] 주소 데이터(sido, address_city, eup_myeon_dong)가 채워져 있나요?
```

**데이터 확인 쿼리**:

```sql
-- 전체 레코드 수 확인
SELECT COUNT(*) FROM auction_items;

-- 시도 데이터 확인
SELECT DISTINCT sido FROM auction_items ORDER BY sido;

-- 시군구 데이터 확인 (서울 예시)
SELECT DISTINCT address_city FROM auction_items
WHERE sido = '서울특별시' ORDER BY address_city;

-- 샘플 레코드 확인
SELECT sido, address_city, eup_myeon_dong, usage, minimum_bid_price
FROM auction_items LIMIT 10;
```

---

## 📌 추가: 프론트엔드 요청사항(Action Items)

- **ENV 정합화(필수)**

  - `NEXT_PUBLIC_API_BASE_URL`을 실제 백엔드 실행 포트로 설정 후 프론트 개발 서버 재시작
    - 예시: `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000` 또는 `http://127.0.0.1:8001`
  - 적용 확인: 브라우저 Network 탭에서 요청 URL이 위 Base URL로 시작하는지 확인

- **주소 트리 초기 로드**

  - `GET /api/v1/locations/tree-simple`로 초기 상태 로드(SWR/React Query 캐시)
  - 응답 키는 `provinces/cities/districts`이므로 기존 `SAMPLE_ADDRESSES`를 그대로 대체 가능

- **코드 기반 필터 사용**

  - 지역 선택 후 `/api/v1/items/simple` 호출 시 `sido_code/city_code/town_code`를 우선 사용(이름보다 우선)
  - 가격/면적/연도/엘리베이터/상태 필터는 기존 매핑 유지
  - `hasParking` 필터 제거 유지(백엔드 데이터 없음), `floor` 필터는 UI 경고만

- **검증 자료 첨부(요청)**
  - 브라우저 Network 캡처 3종: `GET /locations/tree-simple`, `GET /items/simple`, 실패 시 콘솔 CORS 메시지
  - 호출 URL/Status/Response Headers(Origin, CORS 관련) 포함
  - 사용한 `.env.local`의 `NEXT_PUBLIC_API_BASE_URL` 값(민감정보 제외)

회신 템플릿(프론트):

```
✅ NEXT_PUBLIC_API_BASE_URL: http://127.0.0.1:____
✅ /locations/tree-simple 응답: [ 정상(200) / 오류(코드:___, 메시지:___) ]
✅ /items/simple 응답: [ 정상 / 오류 ] (totalItems=___)
📎 네트워크 캡처 첨부: [첨부 완료]
```

---

## 🔧 **프론트엔드 현재 설정**

### **API Base URL 설정**

```typescript
// lib/fetcher.ts
const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
```

### **호출 중인 API**

```typescript
// hooks/useLocations.ts
useSWR<LocationSimpleTree>("/api/v1/locations/tree-simple", fetcher);
```

### **실제 호출 URL**

- 환경변수 미설정 시: `http://127.0.0.1:8000/api/v1/locations/tree-simple`
- 환경변수 설정 시: `http://127.0.0.1:8001/api/v1/locations/tree-simple`

---

## ⚡ **긴급 요청사항**

### **즉시 확인 필요**

1. **서버 실행**: FastAPI 서버가 실행 중이며 접근 가능한지
2. **포트 확인**: 정확한 포트 번호 (8000/8001/기타)
3. **API 응답**: `/api/v1/locations/tree-simple` 엔드포인트 정상 동작 여부
4. **CORS 설정**: 프론트엔드 요청 허용 여부

### **회신 요청사항**

```markdown
✅ 서버 실행 상태: [ 실행중 / 중단됨 ]
✅ 실행 포트: [ 8000 / 8001 / 기타: ____ ]
✅ /docs 접속 가능: [ 가능 / 불가능 ]
✅ tree-simple API 응답: [ 정상 / 오류 / 오류내용: _____ ]
✅ CORS 설정 확인: [ 설정완료 / 미설정 / 확인필요 ]
✅ 데이터베이스 상태: [ 정상 / 비어있음 / 확인필요 ]
```

---

## 🔍 **추가 정보**

### **현재 프론트엔드 로그**

- 브라우저 Console에서 "SWR fetch:" 로그 확인 가능
- Network 탭에서 API 호출 상태 확인 가능

### **테스트 환경**

- 프론트엔드: `http://localhost:3000/analysis`
- 백엔드 (예상): `http://localhost:8000` 또는 `http://localhost:8001`

### **관련 파일**

- **프론트엔드**: `Application/hooks/useLocations.ts`, `Application/components/features/filter-control.tsx`
- **백엔드**: `app/api/v1/endpoints/locations.py`

---

## 📞 **연락처 및 대응**

**우선순위**: 🚨 **High (긴급)** - Analysis 페이지 기능 정상화 필요
**예상 해결 시간**: 백엔드 서버 실행 및 CORS 설정으로 즉시 해결 가능
**후속 작업**: API 정상 연동 확인 후 필터 기능 최종 테스트

**회신 요청**: 최대한 빠른 시일 내 상태 확인 결과 회신 부탁드립니다.

---

**감사합니다!** 🙏

---

## 🛠️ 백엔드 자체 점검 및 조치 결과(Backend Notes)

- **엔드포인트 준비**: `GET /api/v1/locations/tree-simple` 구현 완료(코드 구조는 `SAMPLE_ADDRESSES`와 동일)
  - 파일: `app/api/v1/endpoints/locations.py` (`get_location_tree_simple`)
- **CORS 기본값**: `http://localhost:3000`, `http://127.0.0.1:3000` 허용 (`.env`에서 덮어쓸 경우 다시 포함 필요)
- **서버 실행 가이드**: 동적 포트(8000 우선, 점유 시 8001 등)
  - `python run_server.py` 실행 후 콘솔에 노출되는 실제 포트로 접속
- **데이터 의존성**: 주소 트리는 `auction_items` 데이터로 집계됨 → 데이터 없을 시 빈 리스트 반환
  - 점검 명령: `python scripts/verify_data.py --table auction_items`
  - 로딩(필요 시): `python scripts/load_data.py --table auction_items`

백엔드 회신(예시 양식):

```
✅ 서버 실행 상태: 실행중
✅ 실행 포트: 8001
✅ /docs 접속 가능: 가능
✅ tree-simple API 응답: 정상(200)
✅ CORS 설정 확인: 설정완료
✅ 데이터베이스 상태: 정상(총 ___ 건)
```
