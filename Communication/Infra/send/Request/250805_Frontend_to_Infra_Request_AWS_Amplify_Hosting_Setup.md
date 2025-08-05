### [요청] 프론트엔드: AWS Amplify Hosting 배포 환경 구축 요청

**1. 요청 일시:** 2025-08-05
**2. 요청자:** 프론트엔드 팀
**3. 관련 문서:**

- `Doc/PRD.md` (7. 인프라, A. AWS Amplify Hosting 설정)
- `PROJECT_FRONTEND_ROADMAP.md` (Phase 5: Task 6.3.1, 6.3.2)

---

### **4. 요청 배경 (Why)**

프론트엔드 개발 로드맵의 **Phase 5: 최종 검수 및 배포** 단계를 위해 AWS Amplify Hosting 기반의 배포 환경 구축이 필요합니다.

현재 프론트엔드 개발이 Phase 2~3 단계에서 진행 중이며, **Phase 4 완료 후 즉시 배포 환경 테스트**를 시작할 수 있도록 사전에 인프라 환경을 준비해야 합니다.

---

### **5. 상세 요구사항 (What)**

#### **5-1. AWS Amplify Hosting 설정**

- **GitHub Repository 연동**:

  - Repository: `https://github.com/sksks7521/booster-frontend`
  - Branch: `master` (운영), `develop` (개발/스테이징)

- **Build 설정**:

  - Build Directory: `Application/`
  - Build Command: `cd Application && pnpm install && pnpm build`
  - Output Directory: `Application/.next`

- **환경 분리**:
  - **Production**: `master` 브랜치 → `booster.com` (또는 임시 도메인)
  - **Staging**: `develop` 브랜치 → `dev.booster.com` (또는 임시 도메인)

#### **5-2. 환경변수 설정**

다음 환경변수들을 Amplify Console에서 설정해 주세요:

```bash
# API 연동
NEXT_PUBLIC_API_BASE_URL=https://api.booster.com  # 백엔드 API URL
NEXT_PUBLIC_VWORLD_API_KEY=your_vworld_api_key    # VWorld API 키

# 인증
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your_pool_id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your_client_id
NEXT_PUBLIC_COGNITO_REGION=ap-northeast-2

# 분석 도구 (추후 추가 예정)
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token
```

#### **5-3. 도메인 설정**

- **임시 도메인** (즉시 필요):

  - `booster-prod.amplifyapp.com` (운영)
  - `booster-dev.amplifyapp.com` (개발)

- **커스텀 도메인** (추후 설정):
  - `booster.com` (운영)
  - `dev.booster.com` (개발)

#### **5-4. SSL/HTTPS 설정**

- AWS Amplify의 기본 SSL 인증서 적용
- 커스텀 도메인 연결 시 ACM 인증서 자동 발급

#### **5-5. CI/CD 파이프라인 설정**

- **자동 배포 트리거**:

  - `master` 브랜치 push → Production 자동 배포
  - `develop` 브랜치 push → Staging 자동 배포

- **빌드 성능 최적화**:
  - Node.js 18+ 사용
  - pnpm 캐싱 활성화

---

### **6. 우선순위 및 희망 완료일**

- **우선순위:** Medium
- **희망 완료일:** 2025-08-12 (월)

현재 Phase 2~3 개발 중이므로, Phase 4 완료 전까지 배포 환경이 준비되면 됩니다.

---

### **7. 추가 요청사항**

#### **7-1. 모니터링 설정**

- AWS CloudWatch 로그 수집 활성화
- 빌드 실패 시 Slack/이메일 알림 설정

#### **7-2. 성능 최적화**

- CDN 캐싱 정책 설정 (이미지, CSS, JS 파일)
- Gzip 압축 활성화

#### **7-3. 보안 설정**

- HTTPS 강제 리다이렉트
- 적절한 CORS 정책 설정

---

### **8. 완료 확인 방법**

1. **배포 URL 접근 확인**: `https://booster-prod.amplifyapp.com`
2. **자동 배포 테스트**: 테스트 커밋을 통한 CI/CD 파이프라인 동작 확인
3. **환경변수 연동 확인**: API 호출 및 인증 기능 정상 동작 확인

---

### **9. 참고사항**

- Frontend Application은 `Application/` 폴더 내에 위치해 있습니다.
- Next.js App Router 기반으로 구현되어 있으며, SSG/SSR 기능을 사용합니다.
- pnpm을 패키지 매니저로 사용하고 있습니다.
