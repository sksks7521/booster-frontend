# [완료 회신] 위치 트리 일괄 조회 + 코드 기반 필터(`/items/simple`) 적용 완료

- From: Backend → To: Frontend (MainAgent)
- 상태: Completed
- 완료일: 2025-08-17

---

## 1) 변경사항 개요

- 위치 트리 일괄 조회 API 신설: `GET /api/v1/locations/tree?includeCounts=true`
  - 응답: `{ version, generated_at, code_type: "internal", sidos: [ { code, name, count, cities: [ { code, name, count, towns: [ { code, name, count } ] } ] } ] }`
  - 정렬/중복 처리: 공백 트림, 중복 제거, 가나다 오름차순
  - 캐시/조건부: `ETag`/`Last-Modified` 지원, `HEAD /locations/tree`, `If-None-Match`로 304 반환
- 코드 기반 필터 수용: `GET /api/v1/items/simple`
  - 신규 파라미터: `sido_code`, `city_code`, `town_code`
  - 우선순위: code(최우선) > 이름별칭(`town`/`cityDistrict`/`province`) > 기존 `region`
  - OpenAPI(/docs)에 자동 반영
- 분리형 목록 API 보강
  - `GET /api/v1/locations/sido` → `{code,name,count}`
  - `GET /api/v1/locations/cities?sido=...&q=...` 또는 `?sido_code=...`
  - `GET /api/v1/locations/towns?sido=...&city=...&q=...` 또는 `?city_code=...`

## 2) 빠른 검증 방법

- 트리 ETag
  - `HEAD /api/v1/locations/tree` → ETag 확인
  - `GET /api/v1/locations/tree` → 본문 + ETag
  - `GET /api/v1/locations/tree` with `If-None-Match: <etag>` → `304 Not Modified`
- 코드 필터
  - 예시: `GET /api/v1/locations/sido` → 첫 항목 `code` 추출 → `sido_code`로 전달
  - `GET /api/v1/items/simple?sido_code=<code>` → 이름 케이스/공백 차이 무관하게 필터링
  - 3단계: `sido_code` → `cities` 코드 → `towns` 코드 → `/items/simple?sido_code=...&city_code=...&town_code=...`

## 3) 성능/운영 권고

- 인덱스: `(sido)`, `(sido,address_city)`, `(sido,address_city,eup_myeon_dong)`
- 캐시: 트리 6h 캐시 + ETag 병행

## 4) 참고

- FE 임시 연동은 이름 기반 그대로 사용 가능하며, 코드 기반 전환 시 파라미터만 교체하면 됩니다.
- 회귀 테스트: 전체 103 tests 통과, `/docs`에 새 파라미터 노출 확인.
