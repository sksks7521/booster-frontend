# 실거래가(전월세) 지역 필터(sido/sigungu/admin_dong_name) 정규화/적용 보장 요청

## 배경

- 전월세 페이지에서 시도/시군구/읍면동 필터 조합이 매매와 동일 UX로 동작해야 합니다.
- 일부 케이스에서 `sigungu`, `admin_dong_name` 필터가 기대대로 적용되지 않는 정황이 있어, 백엔드 스펙 확정과 정규화 처리를 요청드립니다.

## 요청 사항

1. 파라미터 스펙 확정(AND 필터)

- `sido`: string, 예) "경기도", "서울특별시" (정확/접두 일치 중 기준 명시)
- `sigungu`: string, 예) "경기도 고양시 덕양구" 또는 "고양시 덕양구" (요구 형식 명시)
- `admin_dong_name`: string, 예) "화정동", "중곡동" (공백/특수문자 허용)
- 결합 규칙: 세 값은 AND로 동시 필터. 일부 값 누락 시 존재하는 값만 적용.

2. 정규화 처리 보장

- `sigungu` 입력이 시도 접두어 없이 들어와도 내부에서 `sido + ' ' + sigungu`로 정규화(또는 반대로 시도 접두어 제거 후 비교)하여 일치 판단.
- 대소문자, 연속 공백, 괄호/하이픈 등의 특수기호를 normalize하여 비교.

3. 예시/수락 기준

- 예시 쿼리(200 OK, 일관된 결과):
  - `?sido=경기도&sigungu=고양시 덕양구&admin_dong_name=화정동`
  - `?sido=서울특별시&sigungu=광진구&admin_dong_name=중곡동`
- 응답 `items[]`의 `sido/sigungu/admin_dong_name`가 요청과 논리적으로 일치.

4. 선택(코드 기반 필터 지원)

- `sigungu_code`, `admin_code`(행정코드) 파라미터 지원 시, 프런트가 코드 기반으로 정확 매칭 가능.

## 프런트 조치(참고)

- 임시 보정: 프런트는 `sigungu`에 시도 접두어가 없으면 `${sido} ${sigungu}`로 보정하여 전송하도록 수정했습니다.
- 매핑: `province→sido`, `cityDistrict→sigungu`, `town→admin_dong_name` (매매와 동일).

## 검증 계획

- 위 2개 주소 시나리오와 추가 표본으로 스모크 수행.
- 불일치 발생 시 요청/응답 샘플 첨부하여 회신 드립니다.

감사합니다.
