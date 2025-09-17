# Supabase Edge Secrets 설정 가이드

이 가이드는 API 키와 토큰을 Supabase Edge Secrets를 사용하여 안전하게 관리하는 방법을 설명합니다.

## 🔐 개요

기존의 환경변수 기반 토큰 관리를 Supabase Edge Secrets로 마이그레이션하여 다음과 같은 이점을 얻을 수 있습니다:

- **보안 강화**: 토큰이 암호화되어 저장됨
- **중앙화된 관리**: 모든 credential을 한 곳에서 관리
- **동적 회전**: 서버 재시작 없이 토큰 업데이트 가능
- **감사 로그**: 토큰 사용 추적 및 모니터링
- **세밀한 권한 제어**: 각 통합별 개별 credential 관리

## 🏗️ 아키텍처

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Integration   │    │  Supabase Edge   │    │   Vault        │
│   API Calls     │───▶│    Function      │───▶│  (Encrypted)    │
│                 │    │  manage-secrets  │    │   Storage       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  integrations   │    │   Secrets API    │    │   Secret Data   │
│     Table       │    │   (CRUD Ops)     │    │   + Metadata    │
│ credential_ref  │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 설정 단계

### 1. Supabase Edge Function 배포

먼저 secrets 관리를 위한 Edge Function을 배포해야 합니다:

```bash
# Supabase CLI 설치 (아직 설치하지 않은 경우)
# Homebrew로 설치
brew install supabase/tap/supabase
brew upgrade supabase

# 설치 확인
supabase --version


# Supabase 프로젝트에 로그인
supabase login
# 로그인 확인
supabase projects list

# 필수 환경변수 설정 (불필요)
#supabase secrets set SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
#supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 확인 
supabase secrets list --project-ref xxxxxxxxxx

# Edge Function 배포
supabase functions deploy manage-secrets --project-ref xxxxxxxxx


🚀 배포 시 일어나는 일
코드 업로드: index.ts 파일이 Supabase 클라우드로 업로드
Deno 런타임 실행: TypeScript가 Deno 환경에서 컴파일 및 실행
엔드포인트 생성: https://[your-project].supabase.co/functions/v1/manage-secrets
환경변수 주입: supabase secrets set으로 설정한 값들이 Deno.env.get()으로 접근 가능


# 배포 후 확인
supabase functions list --project-ref xxxxxxxxxxx



### 2. 환경변수 설정

Edge Function이 올바르게 작동하도록 다음 환경변수가 설정되어 있는지 확인하세요:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
# 프로젝트 연결
supabase init
supabase link --project-ref jvdgefmtyduycwjdmfui

# Supabase CLI로 환경변수 설정
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# 설정확인
supabase secrets list

### 3. 기존 토큰 마이그레이션

기존 환경변수로 저장된 토큰들을 Supabase Secrets로 마이그레이션합니다:

```bash
# Dry run으로 먼저 테스트
DRY_RUN=true npm run migrate-secrets

# 실제 마이그레이션 실행
DRY_RUN=false npm run migrate-secrets
```

### 4. 마이그레이션 스크립트를 package.json에 추가

```json
{
  "scripts": {
    "migrate-secrets": "tsx scripts/migrate-to-secrets.ts"
  }
}
```

## 📊 사용법

### 새로운 통합 추가

새로운 통합을 추가할 때는 자동으로 Secrets Manager가 사용됩니다:

1. **GitHub 통합**:
   ```typescript
   // /api/settings/github-integration에 POST 요청
   {
     "action": "connect",
     "token": "ghp_xxxxxxxxxxxx",
     "repos": "owner/repo1,owner/repo2"
   }
   ```

2. **Slack 통합**:
   ```typescript
   // /api/settings/slack-integration에 POST 요청
   {
     "action": "connect", 
     "token": "xoxb-xxxxxxxxxxxx",
     "channels": "C1234567890,C0987654321"
   }
   ```

### 기존 통합 관리

```typescript
import { secretsManager } from '~/core/lib/secrets-manager.server';

// Secret 조회
const secret = await secretsManager.getSecret('github_abc123_def456');

// Secret 업데이트
await secretsManager.updateSecret('github_abc123_def456', 'new-token-value');

// Secret 삭제
await secretsManager.deleteSecret('github_abc123_def456');

// 모든 Secret 목록
const secrets = await secretsManager.listSecrets();
```

### 토큰 회전 (Rotation)

토큰을 주기적으로 교체하는 것이 보안상 좋습니다:

```typescript
// 토큰 회전
await secretsManager.rotateSecret('github_abc123_def456', 'new-rotated-token');
```

## 🔍 모니터링 및 디버깅

### 로그 확인

```bash
# Supabase Edge Function 로그 확인
supabase functions logs manage-secrets --project-ref YOUR_PROJECT_REF
```

### 연결 상태 확인

```typescript
// GitHub 연결 상태 확인
const status = await checkGitHubConnection(undefined, 'github_abc123_def456');

// Slack 연결 상태 확인  
const status = await checkSlackConnection(undefined, 'slack_xyz789_uvw012');
```

### 데이터베이스 쿼리

```sql
-- 모든 통합 조회
SELECT integration_id, type, name, credential_ref, is_active 
FROM integrations 
WHERE is_active = true;

-- 특정 사용자의 통합 조회
SELECT * FROM integrations 
WHERE workspace_id = 'user-uuid' 
AND is_active = true;
```

## 🛡️ 보안 고려사항

### 1. 권한 관리

- Edge Function은 Service Role Key로 실행됩니다
- 사용자 인증을 통해 자신의 Secret만 접근 가능
- RLS (Row Level Security) 정책으로 데이터 보호

### 2. 암호화

- 모든 Secret은 Deno KV에 암호화되어 저장
- 전송 중 HTTPS로 보호
- 메타데이터와 실제 값 분리 저장

### 3. 감사 로그

```typescript
// 모든 Secret 작업은 로깅됩니다
logger.info('Secret stored successfully', { 
  credentialRef, 
  type: metadata.type,
  userId: user.id 
});
```

## 🚨 문제 해결

### 일반적인 문제들

1. **Edge Function 배포 실패**
   ```bash
   # 함수 재배포
   supabase functions deploy manage-secrets --no-verify-jwt
   ```

2. **Secret 조회 실패**
   ```typescript
   // Fallback 메커니즘 확인
   const token = await getGitHubToken(credentialRef) || process.env.GITHUB_TOKEN;
   ```

3. **마이그레이션 실패**
   ```bash
   # 로그 확인
   tail -f logs/migration.log
   
   # 수동으로 특정 Secret 생성
   await secretsManager.storeSecret('manual_ref', 'token_value', metadata);
   ```

### 롤백 방법

만약 문제가 발생하면 기존 환경변수 방식으로 롤백할 수 있습니다:

1. `credential_ref` 필드를 NULL로 설정
2. 환경변수 토큰 복원
3. 애플리케이션 재시작

```sql
-- 모든 통합의 credential_ref 제거 (롤백)
UPDATE integrations SET credential_ref = NULL WHERE credential_ref IS NOT NULL;
```

## 📈 성능 최적화

### 1. 캐싱

```typescript
// Secret 캐싱 (메모리)
const secretCache = new Map<string, { value: string; expires: number }>();

async function getCachedSecret(credentialRef: string): Promise<string | null> {
  const cached = secretCache.get(credentialRef);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }
  
  const secret = await secretsManager.getSecret(credentialRef);
  if (secret) {
    secretCache.set(credentialRef, {
      value: secret.value,
      expires: Date.now() + 5 * 60 * 1000 // 5분 캐시
    });
    return secret.value;
  }
  
  return null;
}
```

### 2. 배치 처리

```typescript
// 여러 Secret 동시 조회
const secrets = await Promise.all([
  secretsManager.getSecret('github_ref'),
  secretsManager.getSecret('slack_ref')
]);
```

## 🔄 업그레이드 경로

기존 시스템에서 단계적으로 업그레이드:

1. **Phase 1**: Edge Function 배포 및 테스트
2. **Phase 2**: 새로운 통합에만 Secrets 사용
3. **Phase 3**: 기존 통합 마이그레이션
4. **Phase 4**: 환경변수 제거 및 정리

## 📞 지원

문제가 발생하거나 추가 기능이 필요한 경우:

1. GitHub Issues에 문의
2. 로그 파일과 에러 메시지 첨부
3. 마이그레이션 상태 및 설정 정보 제공

---

이 가이드를 통해 Supabase Edge Secrets를 활용한 안전한 credential 관리 시스템을 구축할 수 있습니다.
