# 추가한 환경변수

값은 적지 않는다. 두 파일 모두 git 제외.

## 루트 `.env` (앱)

| 이름 | 설정 | 용도 |
|---|---|---|
| `FLUE_API_TOKEN` | 설정함 | 앱이 Flue `/agents/*`를 호출할 때 보내는 Bearer 토큰. `flue/.dev.vars`와 같은 값 |
| `FLUE_AGENT_URL` | 설정함 | Flue 에이전트 주소. 지금은 배포본 `https://ieum-flue.jinu30dev.workers.dev/agents/test`. 지우면 `http://localhost:8787/agents/test` |
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
