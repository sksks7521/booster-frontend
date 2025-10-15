## [답신] 실거래가(전월세) 선택 항목만 보기(ids) 서버 필터 지원 완료 (251011)

### 요약

- GET `/api/v1/real-rents/`에서 `ids` CSV 파라미터를 지원합니다.
- 다른 모든 필터(지역/금액/면적/날짜/층확인/엘리베이터 등)와 AND 교집합으로 결합됩니다.
- 정렬/페이징과 함께 사용 시에도 결정적 정렬이 유지됩니다.

### 파라미터 사양

- `ids`: CSV 문자열, 예) `"1,2,3"`
  - 최대 개수: 500개(초과 시 400 에러)
  - 구분자: 콤마(,)만 허용 (`;`/`|` 포함 시 400 에러)
  - 중복: 서버에서 제거(dedup)
  - 무효 id(비숫자/변환 실패): 무시
  - 전체가 무효이면 빈 결과 반환(200 OK, total=0)

### 결합 동작

- 다른 조건들과 AND로 결합되어 IN 쿼리 최적화로 조회합니다.
- `count/total`는 `ids` 및 모든 조건 적용 후의 개수를 반환합니다.

### 정렬/페이징 정책(기존 준수)

- `ordering`과 함께 사용 가능. 예) `ordering=-contract_date`
- 결정적 정렬 보장: 동률 시 `id`로 tie-breaker 적용(재호출 시에도 순서 안정적)

### 에러 정책

- 형식 오류(콤마 이외 구분자 포함): 400 `invalid_ids_format`
- 개수 초과(>500): 400 `ids_limit_exceeded`
- 그 외 서버 오류: 기존 정책 준수

### 예시(curl)

```bash
curl -G "http://127.0.0.1:8000/api/v1/real-rents/" \
  --data-urlencode "sido=서울특별시" \
  --data-urlencode "sigungu=서울특별시 강남구" \
  --data-urlencode "ids=101,205,333,444" \
  --data-urlencode "ordering=-contract_date" \
  --data-urlencode "page=1" \
  --data-urlencode "size=20"
```

### 롤아웃/검증

- 브랜치: `feat/real-rents-v2-251011`
- 체크리스트:
  - 선택 항목만 보기 ON/OFF 시 `ids` 전송/해제 확인
  - 지역/날짜/금액 등과 결합 시 결과 일관성
  - 정렬/페이징과 결합 시 결정적 정렬 보장

### 참고

- 서버 미지원/일시 오류 대비 클라이언트 보조 필터는 현행 유지 가능하나, 서버 필터 사용이 권장됩니다.
