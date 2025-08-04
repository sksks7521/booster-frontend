# Booster 팀 커뮤니케이션 가이드: Frontend ↔ Infrastructure (v1.0)

## 1. 이 문서의 목적

이 문서는 **프론트엔드 담당자**가 인프라 환경의 변경(예: 신규 도메인 연결, 환경변수 추가)이 필요할 때, **인프라 담당자**에게 명확하고 체계적으로 작업을 요청하는 절차와 양식을 정의합니다.

- **핵심 원칙:** 모든 요청은 '요청서(MD 파일)' 작성을 통해 이루어집니다. 인프라 담당자는 이 요청서에 기술된 내용만을 신뢰할 수 있는 유일한 작업 지시서(Single Source of Truth)로 간주합니다.

---

## 2. 요청서(MD 파일) 관리 원칙

### 2.1. 저장 위치 및 파일명

- **프론트엔드 → 인프라 요청 시:**

  - 발신함: `booster-Frontend\Communication\Infra\send\Request`
  - 수신함: `booster-Infra\Communication\Frontend\receive\Request`
  - 파일명: `YYMMDD_Frontend_to_Infra_요청제목.md`

  - 발신 요청 완료함: `booster-Frontend\Communication\Infra\send\Completed\`
  - 수신 요청 완료함: `booster-Infra\Communication\Frontend\receive\Completed\`
  - 요청사항 완료 후 파일명 : `YYMMDD_Frontend_to_Infra_요청제목_완료.md`

- **인프라 → 프론트엔드 요청 시:**

  - 발신함: `booster-Infra\Communication\Frontend\send\Request`
  - 수신함: `booster-Frontend\Communication\Infra\receive\Request`
  - 파일명: `YYMMDD_Infra_to_Frontend_요청제목.md`

  - 발신 요청 완료함 : `booster-Infra\Communication\Frontend\send\Completed\`
  - 수신 요청 완료함 : `booster-Frontend\Communication\Infra\receive\Completed\`
  - 요청사항 완료 후 파일명 : `YYMMDD_Infra_to_Frontend_요청제목_완료.md`

### 2.2. 요청서 진행 상태(Status) 관리

**1. 요청 생성 (Requester):**

- 요청자는 `Request` 폴더에 새로운 요청서(.md)를 생성합니다.
- 요청서의 `Status`는 `Requested`로 설정합니다.

**2. 작업 진행 및 완료 (Assignee):**

- 요청받은 작업을 수행합니다.
- 작업 완료 후, **요청서 파일 자체를 수정**합니다.
  - `Status`를 `Done`으로 변경하고 `Completed At` 날짜를 기입합니다.
  - `History`에 완료 기록을 추가합니다.

**3. 완료 처리 (Assignee):**

- 내용 수정이 완료된 요청서 파일의 이름에 `_완료` 접미사를 붙입니다.
- **수정된 파일을 자신의 `receive\Completed\` 폴더로 이동시킵니다.**
- **동시에, 수정된 파일을 상대방의 `send\Completed\` 폴더에도 복사/이동시킵니다.**
- 이제 이 작업은 양쪽 모두에게 '완료'된 것으로 기록되며, `Request` 폴더에는 처리해야 할 작업만 남게 됩니다.

---

## 3. 요청서 표준 템플릿

**모든 요청은 반드시 아래 템플릿을 사용하여 작성합니다.**

```markdown
# [프론트엔드→인프라] 요청서 제목 (YYYY-MM-DD)

## 1. 요청 개요 (Why?)

- (요청의 목적과 비즈니스적인 배경을 구체적으로 작성합니다. "왜" 이 작업이 필요한지 인프라 담당자가 이해하는 것이 가장 중요합니다.)

## 2. 작업 요청 사항 (What & How?)

- (인프라 담당자가 수행해야 할 작업을 최대한 구체적이고 명확하게, 기술적인 용어로 작성합니다. 체크리스트 형식을 권장합니다.)

- **[ ] 작업 1:**
- **[ ] 작업 2:**

## 3. 관련 정보 (Reference)

- (작업에 필요한 모든 추가 정보를 제공합니다.)
- **관련 프론트엔드 PR 링크:**
- **참고 문서/URL:**
- **기타 제약 조건 및 주의사항:**

## 4. 진행 상태

- **Status:** Requested
- **Requester:** 프론트엔드 담당자
- **Assignee:** 인프라 담당자
- **Requested At:** (요청일)
- **Completed At:**
- **History:**
  - (요청일): 프론트엔드 담당자가 요청서 작성
```

---

## 4. 상세 시나리오별 요청서 작성 예시 (프론트엔드 → 인프라)

Booster 프로젝트의 프론트엔드(Next.js)는 **AWS Amplify Hosting**을 통해 배포 및 운영됩니다. 아래는 이 환경에 특화된 요청 예시입니다.

### 시나리오 1: 신규 환경변수 추가 요청

```markdown
# [프론트엔드→인프라] VWorld 지도 연동을 위한 환경변수 추가 요청 (2025-08-05)

## 1. 요청 개요 (Why?)

- 프론트엔드에 VWorld 지도 API 연동 기능이 추가되었습니다. 이 기능은 인증을 위해 API 키가 필요합니다.
- 이 API 키를 Git 소스코드에 직접 노출하지 않고 안전하게 관리하기 위해, AWS Amplify Hosting 배포 환경에 환경변수로 주입해야 합니다.

## 2. 작업 요청 사항 (What & How?)

- [ ] **AWS Amplify 콘솔**의 `booster-frontend` 앱 설정으로 이동해주세요.
- [ ] '환경 변수(Environment variables)' 메뉴에서 아래 이름으로 **환경변수를 추가**해주세요.
  - **변수 이름:** `NEXT_PUBLIC_VWORLD_API_KEY`
- [ ] 환경변수의 값은 VWorld 서비스에서 발급받은 실제 API 키로 설정해주세요. (값은 별도로 전달)

## 3. 관련 정보 (Reference)

- **관련 프론트엔드 PR 링크:** `https://github.com/sksks7521/booster-frontend/pull/1`
- **참고 Next.js 문서:** (환경변수 사용법) `https://nextjs.org/docs/app/building-your-application/configuring/environment-variables`
- **기타 제약 조건 및 주의사항:**
  - 변수 이름 앞의 `NEXT_PUBLIC_` 접두사는 브라우저 환경에 변수를 노출시키기 위해 반드시 필요합니다.
  - 이 환경변수가 없으면 프론트엔드에서 지도가 로드되지 않습니다.

## 4. 진행 상태

- **Status:** Requested
- **Requester:** 프론트엔드 담당자
- **Assignee:** 인프라 담당자
- **Requested At:** 2025-08-05
- **Completed At:**
- **History:**
  - 2025-08-05: 프론트엔드 담당자가 요청서 작성
```

### 시나리오 2: 신규 서브도메인 연결 요청

```markdown
# [프론트엔드→인프라] 기능 테스트를 위한 개발용 서브도메인 연결 요청 (2025-08-10)

## 1. 요청 개요 (Why?)

- 신규 기능(예: 결제 모듈)을 운영 환경에 배포하기 전, 실제 도메인과 HTTPS가 적용된 환경에서 충분한 테스트를 진행해야 합니다.
- 이를 위해 현재 `main` 브랜치에만 연결된 운영 도메인(`booster.com`)과 별개로, `develop` 브랜치를 위한 테스트용 서브도메인(`dev.booster.com`)이 필요합니다.

## 2. 작업 요청 사항 (What & How?)

- [ ] **AWS Amplify 콘솔**의 `booster-frontend` 앱 설정으로 이동해주세요.
- [ ] '도메인 관리(Domain management)' 메뉴에서 **'하위 도메인 추가(Add a subdomain)'**를 진행해주세요.
- [ ] 아래와 같이 `develop` 브랜치와 신규 서브도메인을 연결해주세요.
  - **브랜치:** `develop`
  - **연결할 도메인:** `dev.booster.com`
- [ ] Route 53에 필요한 레코드 설정 및 SSL 인증서 발급까지 완료되어야 합니다.

## 3. 관련 정보 (Reference)

- **참고 AWS Amplify 문서:** `https://docs.aws.amazon.com/amplify/latest/userguide/domain-management.html`
- **기타 제약 조건 및 주의사항:**
  - `develop` 브랜치에 코드가 푸시되면, `dev.booster.com`으로 자동 배포가 이루어져야 합니다.

## 4. 진행 상태

- **Status:** Requested
- **Requester:** 프론트엔드 담당자
- **Assignee:** 인프라 담당자
- **Requested At:** 2025-08-10
- **Completed At:**
- **History:**
  - 2025-08-10: 프론트엔드 담당자가 요청서 작성
```

### 시나리오 3: 특정 경로에 대한 리다이렉트 규칙 추가 요청

```markdown
# [프론트엔드→인프라] 구버전 URL 리다이렉트 규칙 추가 요청 (2025-08-20)

## 1. 요청 개요 (Why?)

- 서비스 리뉴얼로 인해, 기존에 사용하던 `/analysis/old-version` URL 경로가 `/analysis/new-version`으로 변경되었습니다.
- 기존 URL로 접속하는 사용자나 검색엔진 봇이 404 에러를 만나지 않고, 자연스럽게 새 URL로 이동할 수 있도록 서버 레벨에서 리다이렉트(Redirect) 처리가 필요합니다.

## 2. 작업 요청 사항 (What & How?)

- [ ] **AWS Amplify 콘솔**의 `booster-frontend` 앱 설정으로 이동해주세요.
- [ ] '다시 쓰기 및 리디렉션(Rewrites and redirects)' 메뉴에서 **리디렉션 규칙을 추가**해주세요.
- [ ] 아래 내용으로 규칙을 설정해주세요.
  - **원본 주소(Original address):** `/analysis/old-version`
  - **대상 주소(Target address):** `/analysis/new-version`
  - **유형(Type):** `301 (Permanent)`

## 3. 관련 정보 (Reference)

- **참고 AWS Amplify 문서:** `https://docs.aws.amazon.com/amplify/latest/userguide/redirects.html`
- **기타 제약 조건 및 주의사항:**
  - 301 영구 리디렉션으로 설정해야 검색엔진 최적화(SEO)에 유리합니다.

## 4. 진행 상태

- **Status:** Requested
- **Requester:** 프론트엔드 담당자
- **Assignee:** 인프라 담당자
- **Requested At:** 2025-08-20
- **Completed At:**
- **History:**
  - 2025-08-20: 프론트엔드 담당자가 요청서 작성
```
