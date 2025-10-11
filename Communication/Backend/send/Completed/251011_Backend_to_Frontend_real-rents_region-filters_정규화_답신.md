# [답신] 실거래가(전월세) 지역 필터(sido/sigungu/admin_dong_name) 정규화 및 적용 보장 완료

- 날짜: 2025-10-11
- 발신: Backend Team
- 수신: Frontend Team
- 대상 API: `GET /api/v1/real-rents/` (및 동일 로직 적용 엔드포인트 `/simple`, `/full`, `/custom`)

## 1) 결론

- 지역 필터는 `sido` + `sigungu` + `admin_dong_name`의 AND 조합으로 적용됩니다. 일부 값이 누락되면 들어온 값만 적용합니다.
- `sigungu`는 시도 접두어 유무 차이를 흡수하도록 OR 정규화 매칭을 적용했습니다. (예: `서울특별시 광진구` vs `광진구`)
- 대소문자/공백 차이를 흡수하기 위해 주요 문자열 비교에 `ILIKE`를 사용합니다. `admin_dong_name` 또한 케이스-인시티브 비교를 적용합니다.
- 코드 기반 필터를 추가로 지원합니다: `sigungu_code`(법정/행정코드), `admin_code`(행정동 코드).
- 프런트 표준 별칭도 지원합니다: `province→sido`, `cityDistrict→sigungu`, `town→admin_dong_name`.

## 2) 파라미터 스펙(정규화 규칙 포함)

- `sido`: string (정확 일치 권장. 예: `경기도`, `서울특별시`)
- `sigungu`: string (시도 접두어 유무 모두 허용. 내부에서 `sido + ' ' + sigungu` OR `sigungu`로 매칭)
- `admin_dong_name`: string (공백/특수문자 허용, 케이스-인시티브 비교)
- 코드 기반(선택):
  - `sigungu_code`: string (법정/행정코드, `legal_code`/`admin_code` 중 하나와 일치 시 필터)
  - `admin_code`: string (행정동 코드 `admin_code` 정확 매칭)
- 결합 규칙: 위 값들은 AND로 동시 필터됩니다.

## 3) 예시(수락 기준에 대응하는 시나리오)

- `?sido=경기도&sigungu=고양시 덕양구&admin_dong_name=화정동`
- `?sido=서울특별시&sigungu=광진구&admin_dong_name=중곡동`
- 응답 `items[]`의 `sido/sigungu/admin_dong_name`가 요청과 논리적으로 일치합니다.

## 4) 샘플

```bash
# 시도+시군구+행정동 AND 조합, 시군구 접두어 없는 케이스
curl -G "http://127.0.0.1:8000/api/v1/real-rents/" \
  --data-urlencode "sido=경기도" \
  --data-urlencode "sigungu=고양시 덕양구" \
  --data-urlencode "admin_dong_name=화정동" \
  --data-urlencode "page=1" \
  --data-urlencode "size=20"

# 시군구 접두어 있는 케이스(동일 결과 기대)
curl -G "http://127.0.0.1:8000/api/v1/real-rents/" \
  --data-urlencode "sido=서울특별시" \
  --data-urlencode "sigungu=서울특별시 광진구" \
  --data-urlencode "admin_dong_name=중곡동" \
  --data-urlencode "page=1" \
  --data-urlencode "size=20"

# 코드 기반 필터(정밀 매칭)
curl -G "http://127.0.0.1:8000/api/v1/real-rents/" \
  --data-urlencode "sigungu_code=11215" \
  --data-urlencode "admin_code=11215680" \
  --data-urlencode "page=1" \
  --data-urlencode "size=20"
```

## 5) 수락 기준 체크

- [x] `sido/sigungu/admin_dong_name` AND 조합으로 필터링
- [x] `sigungu` 접두어 유무 모두 정상 매칭
- [x] 대소문자/공백 차이 흡수
- [x] 코드 기반 필터(`sigungu_code`, `admin_code`) 지원

## 6) 참고/한계

- `sido`는 공식 명칭 기준의 정확 일치를 권장합니다. (필요 시 별칭/오타 보정 사전을 추가 지원 가능)
- `sigungu`의 정규화는 접두어 유무 차이를 흡수하는 수준으로 동작합니다. 추가적인 별칭(예: `부산광역시 해운대구` ↔ `해운대구`) 매핑이 필요하면 알려주세요.

필요 시 추가 표본으로 스모크를 함께 진행하겠습니다. 감사합니다.
