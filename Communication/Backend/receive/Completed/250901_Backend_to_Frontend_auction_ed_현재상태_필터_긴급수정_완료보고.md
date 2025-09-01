## 🛠️ Backend→Frontend | auction_ed 현재상태 필터 긴급 수정 완료 보고 (2025-09-01)

### 1) 요약

- 대상 API: `GET /api/v1/auction-completed/`
- 조치: `current_status` 필터가 DB 실제 값에 대해 부분일치로 동작하도록 보강(예: `매각` → `매각(2회)` 포함). 한글/영문/별칭 입력은 DB 실값(한글)으로 매핑 후 필터 적용.

### 2) 원인

- DB `current_status` 컬럼이 `매각(2회)`처럼 괄호/회차 표기를 포함하고 있어 정확히 `= 매각` 비교 시 매칭 실패.

### 3) 수정 사항

- 필터 로직: `ILIKE '%값%'` 부분일치 적용(다중값 CSV는 OR 결합)
- 상태 매핑: 프론트 입력을 DB 실값으로 확장 매핑 후 필터
  - 유찰→`유찰`, 변경→`변경`, 낙찰/`sold`→`매각`, 재매각/`resale`→`재매각`, 재진행→`재매각`,`미진행`, new→`신건` 등

### 4) 요청 예시

```bash
# 매각(부분일치) → 매각(2회), 매각(3회) 등 포함
curl -G "http://127.0.0.1:8000/api/v1/auction-completed/" \
  --data-urlencode "current_status=매각" \
  --data-urlencode "page=1" --data-urlencode "size=20"

# 유찰/변경 복수(OR 부분일치)
curl -G "http://127.0.0.1:8000/api/v1/auction-completed/" \
  --data-urlencode "current_status=유찰,변경" \
  --data-urlencode "page=1" --data-urlencode "size=20"
```

### 5) 프론트 적용 가이드

- 기존 옵션 그대로 사용 가능(한글/영문/별칭/CSV).
- 공란/미전달 시 필터 미적용.

### 6) 체크리스트

- [ ] `current_status=매각` → `매각(0/1/2…회)` 포함 데이터 반환
- [ ] `current_status=유찰` → `유찰(…회)` 포함 데이터 반환
- [ ] `current_status=유찰,변경` → 두 값 중 하나인 데이터만 반환(OR)

—
Backend Team 드림


