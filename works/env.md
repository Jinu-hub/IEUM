# 추가한 환경변수

값은 적지 않는다. 두 파일 모두 git 제외.

## 루트 `.env` (앱)

| 이름 | 설정 | 용도 |
|---|---|---|
| `FLUE_API_TOKEN` | 설정함 | 앱이 Flue `/agents/*`를 호출할 때 보내는 Bearer 토큰. `flue/.dev.vars`와 같은 값 |
| `FLUE_AGENT_URL` | 안 함 | Flue 에이전트 주소. 없으면 `http://localhost:8787/agents/test`. 배포 후 Worker 주소로 바꿈 |
| `CRON_RECORD` | 안 함 | `0`이면 런·로그·에디션·사용량을 DB에 쓰지 않음. 없으면 기록함 |

## `flue/.dev.vars` (로컬 Flue Worker)

| 이름 | 용도 |
|---|---|
| `OPENAI_API_KEY` | 에이전트 모델 호출. 루트 `.env`에서 복사 |
| `FLUE_API_TOKEN` | `/agents/*` 접근 토큰. 없으면 500으로 막힘 |
| `CLOUDFLARE_API_TOKEN` | 배포용 보관. Worker도 wrangler도 자동으로 읽지 않음. 배포할 때 셸 환경변수로 넣음 |
| `CLOUDFLARE_ACCOUNT_ID` | 위와 같음 |

## 배포 시 Worker 시크릿 (`wrangler secret put`, 아직 안 함)

- `OPENAI_API_KEY`, `FLUE_API_TOKEN`: 배포 Phase 2
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: 배포 Phase 4
