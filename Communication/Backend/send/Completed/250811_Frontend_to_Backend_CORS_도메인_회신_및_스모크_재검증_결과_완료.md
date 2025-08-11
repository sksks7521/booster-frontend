# [프론트엔드→백엔드] CORS 도메인 회신 및 스모크 재검증 결과 (2025-08-11)

## 0) 환경 요약

- Origin(브라우저): http://localhost:3000 (개발)
- API Base URL: http://127.0.0.1:8000 (로컬)
- 실행 시각: 2025-08-11T00:00:00Z (로컬 기준)  
  ※ 실제 실행 시각은 아래 결과 원문에 그대로 포함합니다.

## 1) CORS 최종 도메인 회신(안)

- 개발(로컬)
  - http://localhost:3000
  - http://127.0.0.1:3000
- 스테이징: (확정 필요) https://staging.booster.com
- 운영: (확정 필요) https://app.booster.com
- 기타: 브랜치 프리뷰/Amplify 프리뷰가 있다면 도메인 패턴 공유 요청드립니다.

비고: 스테이징/운영 정확 도메인 확정치가 전달되면 본 문서 즉시 갱신하겠습니다.

## 2) 스모크 재검증(3회 반복) 결과

- 수행 일시: 2025-08-11 (로컬, PowerShell)
- 대상 엔드포인트(5종):
  - GET /api/v1/items/simple?limit=1
  - GET /api/v1/items/?limit=1
  - GET /api/v1/auction-completed/?limit=1
  - GET /api/v1/real-transactions/?limit=1
  - GET /api/v1/real-rents/?limit=1

### A) 결과 원문(raw) — 최소 포함 정책

- 본 문서에는 “1회차 상태코드 5줄”만 포함합니다. 실패(200이 아닌 값)가 있는 엔드포인트는 해당 1건의 응답 전문만 추가합니다.
- 2~3회차 결과는 필요 시 요청 주시면 즉시 공유하겠습니다.

예시(1회차 상태코드 5줄 → 컨테이너 기준 갱신):

```
items/simple: 200
items/: 200
auction-completed/: 200
real-transactions/: 200
real-rents/: 200
```

실패 엔드포인트 전문(예시):

```
GET /api/v1/real-transactions/?limit=1
HTTP/1.1 500 Internal Server Error
content-type: text/plain; charset=utf-8
...
```

### A-1) 재현 방법(명령어)

- Windows PowerShell

```
$urls = @(
  'http://127.0.0.1:8000/api/v1/items/simple?limit=1',
  'http://127.0.0.1:8000/api/v1/items/?limit=1',
  'http://127.0.0.1:8000/api/v1/auction-completed/?limit=1',
  'http://127.0.0.1:8000/api/v1/real-transactions/?limit=1',
  'http://127.0.0.1:8000/api/v1/real-rents/?limit=1'
)
for ($i=1; $i -le 3; $i++) {
  foreach ($u in $urls) {
    try {
      $resp = Invoke-WebRequest -UseBasicParsing -Method GET -Uri $u -ErrorAction Stop
      $code = $resp.StatusCode
    } catch {
      if ($_.Exception.Response) { $code = $_.Exception.Response.StatusCode.value__ } else { $code = 0 }
    }
    Write-Output $code
  }
  Write-Output '---'
}
```

- WSL/Linux/macOS (curl)

```
for i in 1 2 3; do
  curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/items/simple?limit=1"
  curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/items/?limit=1"
  curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/auction-completed/?limit=1"
  curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/real-transactions/?limit=1"
  curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8000/api/v1/real-rents/?limit=1"
  echo ---
done
```

### B) 요약(합격/불합격 기준)

- 요약: (추가 예정)
  - 합격 기준: 5개 엔드포인트 모두 200 OK가 3회 반복에서 일관
  - 불합격 시: 해당 엔드포인트 전문(curl -i) 포함하여 회귀 보고

### C) 상세/Comparables 스모크 절차

- 상세: `GET /api/v1/items/{id}`
- Comparables: `GET /api/v1/items/{id}/comparables`
- 샘플 ID: 101, 102, 103, 104, 105
- 재현 명령(WSL/Linux/macOS):

```
curl -i "http://127.0.0.1:8000/api/v1/items/101"
curl -i "http://127.0.0.1:8000/api/v1/items/101/comparables"
```

- 재현 명령(Windows PowerShell):

```
Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:8000/api/v1/items/101" -Method GET
Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:8000/api/v1/items/101/comparables" -Method GET
```

정상 기준: 200 OK + JSON Body. 오류 시 상태코드/헤더/본문 원문 포함하여 회귀 보고 드립니다.

실패 엔드포인트 전문(예시):

```
curl -i "http://127.0.0.1:8000/api/v1/items/?limit=1"

HTTP/1.1 500 Internal Server Error
content-type: text/plain; charset=utf-8
Internal Server Error
```

### D) 실패 전문 요약(raw)

- 컨테이너 기준 정상화(200). 기존 500 전문은 과거 기록으로 유지

## 3) 환경변수/설정

- NEXT_PUBLIC_API_BASE_URL: http://127.0.0.1:8000 (로컬)
- 프런트 기본 목록 조회 limit: 20 (코드 반영됨)

## 4) 질의/리스크

- 스테이징/운영 최종 도메인 확정치 요청 (서브도메인/프리뷰 정책 포함 여부)
- CORS 파서가 콤마/JSON 배열 모두 허용됨을 확인(요청서 참조). 환경 변수 표기 샘플 공유 가능 여부 문의

### (참고) 백엔드 CORS 환경변수 예시

- 콤마 구분 문자열 예: `http://localhost:3000,http://127.0.0.1:3000,https://staging.booster.com,https://app.booster.com`
- JSON 배열 예: `["http://localhost:3000","http://127.0.0.1:3000","https://staging.booster.com","https://app.booster.com"]`

### (부록) CORS 응답 검증 체크리스트

- Access-Control-Allow-Origin: 요청 Origin과 동일 또는 '\*'
- Access-Control-Allow-Methods: GET, POST, PUT, DELETE 등 사용 메서드 포함
- Access-Control-Allow-Headers: 'Content-Type' 등 프런트 사용 헤더 포함
- Preflight(OPTIONS) 응답: 200/204, 위 헤더 포함
- 환경별 오리진 매핑 확인: 개발/스테이징/운영/프리뷰 도메인

---

- Status: Sent
- Requester: Frontend 팀
- Assignee: Backend 팀
- Sent At: 2025-08-11

---

## Backend 확인/회신 (2025-08-11)

- 컨테이너 기준 5개 엔드포인트 200 OK 확인
- 상세/Comparables 200 확인
- CORS Origin(로컬) 반영 확인. 스테이징/운영 도메인 확정 대기
