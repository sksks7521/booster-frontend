## 🛠️ Backend→Frontend | auction_ed 현재상태(current_status) 필터 매핑/구현 완료 보고 (2025-09-01)

### 1) 요약

- 대상 API: `GET /api/v1/auction-completed/`
- 조치: 프론트가 보내는 현재상태 값(한글/영문/별칭)을 DB 실제 값(한글)으로 매핑하여 필터가 정확히 동작하도록 보강
- 결과: 한글/영문/별칭/다중값(CSV) 모두 서버에서 수용하여 정확한 IN 필터로 처리

### 2) DB 실제 상태값 목록(현행)

`잔금납부`, `매각`, `변경`, `취하`, `기각`, `각하`, `배당종결`, `기타`, `대금미납`, `미진행`, `불허`, `항고`, `정지`, `재매각`, `유찰`, `신건`

### 3) 매핑 규칙(프론트 입력 → DB 필터 값)

- 동일값은 그대로 사용(예: `유찰` → `유찰`)
- 별칭/영문 → DB 값
  - `낙찰`, `sold` → `매각`
  - `failed` → `유찰`
  - `changed` → `변경`
  - `resale` → `재매각`
  - `new` → `신건`
  - `재진행` → `재매각`, `미진행` (둘 다 허용)

주의: 다중값 CSV(`,`)를 지원하며, 각 항목을 위 규칙으로 확장/중복 제거 후 `IN (...)` 조건으로 필터합니다.

### 4) 요청 예시

```bash
# 한글 실값
curl -G "http://127.0.0.1:8000/api/v1/auction-completed/" \
  --data-urlencode "current_status=유찰,매각" \
  --data-urlencode "page=1" --data-urlencode "size=20"

# 영문/별칭 혼용(동일 결과)
curl -G "http://127.0.0.1:8000/api/v1/auction-completed/" \
  --data-urlencode "current_status=failed,sold,재진행" \
  --data-urlencode "page=1" --data-urlencode "size=20"
```

### 5) 프론트 적용 가이드

- 기존 analysis 옵션을 그대로 사용해도 됩니다. 서버가 한글/영문/별칭을 DB 실값으로 변환합니다.
- 다중 선택은 CSV(`,`)로 전달
  - 예: `current_status=유찰,재매각`
- 공란/미전달 시 해당 필터 미적용

### 6) 회귀 테스트 체크리스트

- [ ] `current_status=유찰` → 유찰만 반환
- [ ] `current_status=sold` → 매각만 반환
- [ ] `current_status=재진행` → 재매각 또는 미진행만 반환
- [ ] `current_status=유찰,매각` → 두 상태 중 하나인 데이터만 반환

—
Backend Team 드림
