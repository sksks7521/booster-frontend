# [요청] 실거래가(전월세) 지역 필터 AND 적용 불일치 재현/수정 요청

## 1) 배경

- 전월세 리스트 API(`GET /api/v1/real-rents/`)에서 지역 필터(`sido`, `sigungu`, `admin_dong_name`)를 매매와 동일 UX로 사용합니다.
- 지역 파라미터 정규화/적용 보장 답신 이후에도, AND 적용이 일관되지 않은 사례가 확인되었습니다.

## 2) 프런트 전송 파라미터(정상)

- 드롭다운: 백엔드 정규 명칭 API로 구성(매매와 동일)
  - `GET /api/v1/real-transactions/regions/sido`
  - `GET /api/v1/real-transactions/regions/sigungu?sido=...`
  - `GET /api/v1/real-transactions/regions/admin-dong?sido=...&sigungu=...`
- 매핑: `province → sido`, `cityDistrict → sigungu`, `town → admin_dong_name`
- 보정: `sigungu`가 시도로 시작하지 않으면 `${sido} ${sigungu}`로 보정 후 전송

## 3) 재현 시나리오/증상

- 요청

```bash
curl -i "http://127.0.0.1:8000/api/v1/real-rents/?sido=경기도&sigungu=경기도%20고양시%20덕양구&admin_dong_name=고양동&page=1&size=20"
```

- 기대: 응답 `items[]`는 "경기도 고양시 덕양구 고양동" 범위로 한정(AND 필터)
- 실제(발췌)

```json
{
  "items": [
    {
      "sido": "경기도",
      "sigungu": "경기도 양평군",
      "admin_dong_name": "강상면"
    },
    { "sido": "경기도", "sigungu": "경기도 양평군" }
  ],
  "total": 366087
}
```

- 관찰: 다른 시군구(양평군)가 포함되어 AND 적용 불일치 또는 일부 파라미터 무시 추정

## 4) 원인 가설

- where 절 조합이 OR 또는 일부 파라미터 미적용
- 정규화 단계에서 `sigungu`/`admin_dong_name` 키 매핑 누락
- 기본 범위 폴백이 시도 단위로 동작

## 5) 요청 사항(필수)

1. 파라미터 처리 로직 점검/수정
   - `sido`, `sigungu`, `admin_dong_name` 모두 전달 시 AND로 필터
   - 이름 정규화: `sigungu`는 시도 접두 유무 무관하게 내부 정규화 비교
   - 트림/다중 공백/특수기호 정규화 포함
2. ORM/SQL where 검토
   - 예: `WHERE (:sido IS NULL OR sido = :sido) AND (:sigungu IS NULL OR sigungu = :sigungu) AND (:town IS NULL OR admin_dong_name = :town)`
3. 테스트 케이스 추가
   - `경기도 / 경기도 고양시 덕양구 / 고양동` → 타 시군구 포함되지 않음
   - `서울특별시 / 광진구 / 중곡동` 병행
4. 진단 로그(일시)
   - x-request-id와 함께 최종 where 절/바인딩 파라미터 debug 출력

## 6) 프런트 참고 상태

- 드롭다운: 정규 명칭 API 사용
- 호출 게이트: 시군구 선택 전에는 호출 차단(매매와 동일 UX)
- 파라미터 보정: `sigungu` 접두 보정 적용

## 7) 수락 기준

- [ ] 재현 요청 200 OK, 응답 `items[]`에 타 시군구 미포함
- [ ] `admin_dong_name` 지정 시 해당 읍면동으로 정확 축소
- [ ] 이름 정규화/공백/특수기호 입력도 일관 매칭
- [ ] 매매와 동일 파라미터에서도 동일 동작

감사합니다. 수정 후 알려주시면 즉시 프런트에서 재검증하겠습니다.
