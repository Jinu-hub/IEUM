# 추가한 환경변수

값은 적지 않는다. 두 파일 모두 git 제외.

## 루트 `.env` (앱)

| 이름 | 설정 | 용도 |
|---|---|---|
| `FLUE_API_TOKEN` | 설정함 | 앱이 Flue Worker(`/core/*`, `/report/*`, `/agents/*`)를 호출할 때 보내는 Bearer 토큰. `flue/.dev.vars`와 같은 값 |
| `FLUE_BASE_URL` | 안 함 | Flue Worker 기본 주소(경로 없이). 메일 경로가 `/core/generate` → `/report/generate`를 부름. 없으면 `http://localhost:8787`. 배포(Daily Report Phase 4)에서 `https://ieum-flue.jinu30dev.workers.dev` |
| `FLUE_AGENT_URL` | 설정함 | 예전 메일 경로(`createContents` → `TestAgent`)용. Daily Report Phase 3부터 호출처 없음, Phase 4에서 `TestAgent`와 함께 지움 |
| `SLACK_NOTIFY` | 안 함 | `0`이면 발송 후 팀 Slack 채널 알림("Newsletter sent")을 올리지 않음. 테스트용. 없으면 올림 |
| `CRON_RECORD` | 안 함 | `0`이면 런·로그·에디션·사용량을 DB에 쓰지 않음. 없으면 기록함 |

## `flue/.dev.vars` (로컬 Flue Worker)

| 이름 | 용도 |
|---|---|
| `OPENAI_API_KEY` | 에이전트 모델 호출. 루트 `.env`에서 복사 |
| `FLUE_API_TOKEN` | `/agents/*` 접근 토큰. 없으면 500으로 막힘 |
| `CLOUDFLARE_API_TOKEN` | 배포용 보관. Worker도 wrangler도 자동으로 읽지 않음. 배포할 때 셸 환경변수로 넣음 |
| `CLOUDFLARE_ACCOUNT_ID` | 위와 같음 |

## 배포 Worker 시크릿 (`wrangler secret put`)

- `OPENAI_API_KEY`, `FLUE_API_TOKEN`: 등록함(배포 Phase 2)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: 등록함(배포 Phase 4). 루트 `.env` 값에서 따옴표를 빼고 올림

시크릿은 올린 뒤 수십 초 지나야 Worker에 반영된다. 바로 호출하면 "not set"이나 이전 값으로 실패할 수 있음.

`.dev.vars` 값이 따옴표로 감싸져 있으면 시크릿에는 따옴표를 빼고 넣는다. 로컬 wrangler는 따옴표를 벗기지만 `wrangler secret put`은 그대로 올려서, 따옴표째 올린 `OPENAI_API_KEY`가 OpenAI 401을 냈음.

배포 명령은 `flue/`에서 `npm run build` 후, `.dev.vars`의 `CLOUDFLARE_API_TOKEN`·`CLOUDFLARE_ACCOUNT_ID`를 셸에 export하고 `npx wrangler deploy`. 토큰은 "Edit Cloudflare Workers" 템플릿.


# 배포 방법

모든 명령은 `flue/`에서 실행한다. 이미 `flue/`에 있으면 생략.

```bash
cd flue
```

### 1. Cloudflare 인증 정보를 셸에 넣기 — 터미널을 새로 열었을 때만
값은 화면에 출력되지 않는다. 같은 터미널에서는 다시 할 필요 없음. `.dev.vars`의 토큰을 바꿨을 때도 다시 실행.

```bash
export CLOUDFLARE_API_TOKEN=$(sed -nE 's/^CLOUDFLARE_API_TOKEN="?([^"]*)"?$/\1/p' .dev.vars)
export CLOUDFLARE_ACCOUNT_ID=$(sed -nE 's/^CLOUDFLARE_ACCOUNT_ID="?([^"]*)"?$/\1/p' .dev.vars)
```

### 2. 빌드 + 배포 — 매번

```bash
npm run deploy
```

`vite build && wrangler deploy`를 실행한다. `wrangler deploy`는 빌드 결과물을 올리므로 빌드 없이 배포하면 이전 코드가 올라간다.

### 로그 확인 (선택)

```bash
npx wrangler tail ieum-flue --format pretty
```