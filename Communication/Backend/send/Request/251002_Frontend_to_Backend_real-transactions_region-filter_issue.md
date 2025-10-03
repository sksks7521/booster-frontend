# [긴급] 실거래가(매매) 지역 필터(sido/sigungu) 미적용 의심 및 응답 데이터 불일치

작성일: 2025-10-02  
요청자: 프론트엔드(Analysis v2 - sale)  
영향 범위: 실거래가(매매) 목록/지도 전부 (지역별 탐색 불가)

---

## 1) 요약

- 프론트에서 `sido=경기도&sigungu=경기도 고양시`로 요청해도 응답 항목의 `sigungu`가 고양시가 아닌 다른 시군구(예: 안산시 상록구)로 반환됩니다.
- 프론트는 화이트리스트 방식으로 최소한의 파라미터만 전송하도록 정리 완료(검증됨).
- 정렬 파라미터 `ordering=-contract_date`는 정상적으로 전달/적용되는 것으로 보입니다.
- 문제는 백엔드의 지역 필터(sido/sigungu) 적용 로직 또는 DB 저장 값 불일치 가능성이 높습니다.

---

## 2) 재현 절차

1. 브라우저 접속:
   - `http://localhost:3000/analysis/10071/v2?ds=sale&province=경기도&cityDistrict=경기도%20고양시`
2. 개발자 도구 Network 탭에서 요청 확인:
   - GET `/api/v1/real-transactions/?sido=경기도&sigungu=경기도%20고양시&ordering=-contract_date&page=1&size=20`
3. 백엔드 로그에서도 동일 요청 확인됨(200 OK).
4. 응답 내용 확인 시, `items[i].sigungu`가 “경기도 고양시”가 아닌 값이 다수 반환됨(예: “경기도 안산시 상록구”).

---

## 3) 실제 로그/증거

### 3-1. 백엔드 서버 로그 발췌

```
GET /api/v1/real-transactions/?sido=경기도&sigungu=경기도 고양시&ordering=-contract_date&page=1&size=20 200
```

### 3-2. 콘솔에서 직접 호출 결과 (요약)

```
fetch('http://127.0.0.1:8000/api/v1/real-transactions/?sido=경기도&sigungu=경기도 고양시&page=1&size=5')
  .then(r => r.json())
  .then(d => console.log(d))

// 응답 예: { items: Array(5), total: 216720, page: 1, size: 5, total_pages: 43344 }
// items[0].sigungu === "경기도 안산시 상록구"  (← 고양시 아님)
```

---

## 4) 프론트엔드 측 요청 파라미터(정상 동작 확인)

프론트는 화이트리스트 방식으로 허용된 필터만 서버로 전달하도록 적용 완료했습니다.

- 전송 파라미터(예):
  - `sido=경기도`
  - `sigungu=경기도 고양시`
  - `admin_dong_name` (선택, 읍면동 선택 시만 포함)
  - `ordering=-contract_date` (기본 정렬: 계약일 최신순)
  - `page=1`, `size=20`
  - (옵션) `searchField=all` 또는 검색 시 `searchField`, `searchQuery`

프론트엔드 코드 근거:

- `Application/datasets/registry.ts` 내 `SALE_FILTERS` 화이트리스트 및 `buildListKey`/`fetchList`에서의 매핑 적용
- 지역 매핑: `province → sido`, `cityDistrict → sigungu`, `town → admin_dong_name`

---

## 5) 추정 원인

1. 백엔드 필터 적용 로직 문제
   - `sigungu` 조건이 WHERE 절에 반영되지 않거나, 부분 일치/정규화 불일치로 인해 다른 시군구까지 포함되는 가능성.
2. DB 저장 값 포맷 불일치
   - DB의 `sigungu` 값이 `"고양시"`, `"경기도 고양시"`, `"고양시 덕양구"` 등 혼재되어 있을 경우, 정확 일치 비교가 실패 가능.

---

## 6) 백엔드 확인/조치 요청

아래 항목을 확인 부탁드립니다.

1. 파라미터 수신/적용 여부

```
print(f"sido={sido}, sigungu={sigungu}, admin_dong_name={admin_dong_name}")
```

2. ORM/SQL WHERE 절에 지역 조건이 포함되는지

```
# 예상 예시 (정확 일치)
qs = qs.filter(sido=sido)
qs = qs.filter(sigungu=sigungu)

# 또는(표준화 후) 부분 일치 허용
qs = qs.filter(sigungu__icontains='고양시')
```

3. DB 데이터 표준화 상태 확인

```
SELECT DISTINCT sigungu
FROM real_transactions
WHERE sido = '경기도'
LIMIT 20;
```

4. 응답 포맷 확인

- 현재 응답은 `{ items, total, page, size, total_pages }` 형태로 수신되고 있습니다(OK).
- 단, 지역 필터 결과 집합이 올바른지 재확인 필요.

---

## 7) 재현용 cURL

```bash
curl -i "http://127.0.0.1:8000/api/v1/real-transactions/?sido=%EA%B2%BD%EA%B8%B0%EB%8F%84&sigungu=%EA%B2%BD%EA%B8%B0%EB%8F%84%20%EA%B3%A0%EC%96%91%EC%8B%9C&page=1&size=5&ordering=-contract_date"
```

---

## 8) 기대 결과(수정 후)

- 요청 `sido=경기도&sigungu=경기도 고양시`에 대해, 응답 `items[*].sigungu`가 모두 “경기도 고양시 …” 계열이어야 함.
- `total`/`total_pages` 역시 동일 조건을 만족하는 집계 수치여야 함.

---

## 9) 영향도/우선순위

- 영향: 실거래가(매매) 페이지의 핵심 기능(지역별 탐색) 전체
- 우선순위: P1 (높음)

---

## 10) 참고 사항

- 프론트엔드에서 MSW(mock) 우회 설정 완료: `/api/v1/real-transactions/`는 실제 백엔드로 전달됩니다.
- 프론트엔드 정렬 파라미터는 `ordering=-snake_case`로 통일(예: `-contract_date`).
- 지도/마커/범례는 거래금액 기준으로 설정되어 있으며, 지역 필터 정상화 후 지도도 정상 동작 예정입니다.

감사합니다. 확인 후 회신 부탁드립니다.
