# W41 TODO (2026-10-05 ~ 10-11)

Daily Core E2E(Phase 0~4) 완료 이후 할 일. 한 일은 `W41.md`, E2E 경과는 `works/daily-core-e2e.md`.

## 1. 지금 우선

### 1-1. Agent 분리

- [x] Agent 분리: 지금의 단일 Agent(`DailyCore`)를 `app/features/daily-core/dev/02-pipeline-architecture.md`의 3개 역할(Signal Extractor → Core Interpreter → Core Structurer)로 나눈다. 계약은 `app/features/daily-core/contracts/agent-io.ts`. 품질 개선(항목 간 중복 등)과도 이어진다.
  - v1은 호출 2회: Call 1 Extraction+Interpretation, Call 2 Structuring(문서 권장). 3회 분리는 단계별 추적이 필요해지면.
  - Call 2 출력 스키마를 정할 때 각 배열이 `daily_core_items`의 어떤 `item_type`이 될지 메모해 둔다(projection에서 씀).
  - Phase별 계획과 확인 기록: `works/daily-core-agent-split.md`.

### 1-2. items projection

- [ ] items projection: `core_json`을 `daily_core_items` 테이블로 풀어서 저장한다. Agent 분리 뒤, 출력 형태가 정해지고 나서. 분리에서 배열 구성과 `item_key` 규칙이 바뀔 수 있음. Daily Report가 items 테이블을 읽게 되면 그때 해도 됨.
  - `daily_core_items.item_type` enum을 Worker 출력 형태에 맞출지 같이 정한다.
  - 저장할 테이블이 늘어나므로 generation 저장을 Postgres 함수(RPC) 하나로 묶는 것도 이때 검토한다. 지금은 Worker가 Supabase REST로 순서대로 씀.

### 1-3. metrics projection

- [ ] metrics projection: `core_json`의 metrics를 `daily_core_metrics`에 저장한다. metrics는 merge에서 코드로 계산하므로 Agent 분리와 상관없이 언제든 할 수 있음.

## 2. 그다음

### 2-1. Daily Report

- [ ] Daily Report: Daily Core를 받아 리포트를 만든다.

## 3. 나중에 천천히

### 3-1. v3.2 결과 확인

- [ ] v3.2 결과 확인: 다음 날짜 데이터로 돌려서 `overview`에 `summary`만 나오는지 본다.

### 3-2. 테스트 날짜 고정 제거

- [ ] `target-processing.ts`의 `DAILY_CORE_TEST_DATE` 임시 고정 제거.

### 3-3. 품질 개선

- [ ] 평가 세트: 품질 개선 전에 먼저. 같은 설정에서도 실행마다 인용 수가 10개 넘게 흔들려서(run 16: 63, run 17: 54) 1회 실행으로는 좋아졌는지 판단 못 함.
  - 날짜: 2026-10-09 + 성격이 다른 평일 3일(바쁜 날, 조용한 날, Slack 위주, GitHub 위주). 에이전트가 최근 평일 활동량을 보고 고름. `collect.run.ts`로 날짜별 1번만 수집하고 `flue/eval/set.json`에 날짜, `dailyCoreId`, 특징 메모. 이 행들은 지우지 않는다(지우면 세트가 깨짐).
  - `/core/generate`에 `evaluate: true`: generation과 stats는 저장하되 `current_generation_no`는 안 바꿈.
  - 러너 `flue/src/eval.run.ts --label <설정> --runs 3 [--deployed]`: 날짜 × 횟수를 순차 호출, 결과는 `works/out/eval/<label>-<시각>.json`과 날짜·지표별 최소 / 중앙값 / 최대 표(`.md`).
  - 지표 추가(코드 계산, 정답 라벨 없음): 티켓 재현율(사람 줄에 나온 티켓 번호 중 core item entities·제목에 들어간 비율), 티켓 분할(같은 티켓이 2개 이상 core item), progress 수, core item 수. 기존 지표(사람 줄 인용, 여러 배열 인용, 멤버 / 사람, 반려, 시간, 비용)와 함께 `validation_json.stats`에도 남김.
  - 판단 기준: 새 설정의 중앙값이 기존 설정의 최소~최대 범위 밖으로 나아졌을 때만 개선으로 봄.
  - 비용: `low` 기준 4일 × 3회 = 12번, 약 $0.6, 순차 8~10분(`medium`이면 $2~4).
  - 하지 않음: 별도 평가 DB, 입력 스냅샷 파일, LLM 채점. 자동 지표가 놓치는 게 보이면 그때 날짜별 "꼭 나와야 할 것" 목록을 `set.json`에 추가.
  - Agent 3개 분리(Signal Extractor 추가)는 이 평가로 품질을 본 뒤 장기적으로 판단(사용자, 2026-10-10).
- [ ] 모델 교체 비교: 평가 세트가 생긴 뒤 같은 세트로 비교. 지금은 `openai/gpt-5.4-mini`(1회 약 $0.057).
  - Workers AI 경유: `wrangler.jsonc`에 `"ai": { "binding": "AI" }`, 모델 `cloudflare/@cf/...`. Workers Paid 플랜에서 하루 10,000 Neurons 무료, 넘으면 $0.011 / 1,000 Neurons. 먼저 Call 2(배치)에 `@cf/zai-org/glm-5.3-flash`(1회 약 650 Neurons) 또는 `@cf/openai/gpt-oss-120b`(약 1,100). Call마다 다른 모델을 쓰려면 `app.ts` 수정 필요. Tool 호출·긴 JSON·일본어가 되는지, `thinkingLevel`이 먹는지 확인. 로컬 `vite dev`도 실제 과금.
  - `OPENAI_API_KEY` 그대로: `gpt-5.4-nano`(약 $0.016), `gpt-6-luna`(약 $0.007), 품질 쪽 `gpt-6-sol`(약 $0.13). 금액은 run 21 토큰에 레지스트리 단가를 대입한 추정. 작은 모델은 반려가 늘면 단가 이점이 사라짐(반려 상한 2회).
  - 하지 않음: OpenAI를 AI Gateway Unified Billing으로 옮기기(크레딧 충전 + 5% 수수료). Gateway 로그나 지출 한도가 필요해지면 검토.
- [ ] 품질 개선
  - 같은 사실이 highlights, progress_roadmap, member_activity에 겹침.
  - member_activity에서 빠지는 사람(Mitsuru 등).
  - 사람이 쓴 줄 71개 중 48개만 인용(run 10 기준).
  - 사람 대응표(workspace 단위, Slack user id ↔ GitHub 로그인). 이름 비교로 못 합치는 사람(`takamune-dsl`)용.
  - 2호출 분리 후 시간·비용: 추론 강도 `medium`에서는 실행마다 2배 이상 흔들림(run 18 345초 / $0.297). `low` + `core-interpreter-v5`로 바꿔 배포본 42초 / $0.057. 덮는 범위가 다시 줄면 `medium`과 비교.
  - 같은 일이 두 core item으로 나뉨(run 20: #23087 topics / progress, 모듈 작성 2개).
  - progress 배치 기준: run 21에서 progress 2개뿐, 진행 보고가 topics / highlights로 감.
  - member_activity 누락(run 20: Naoya Tsujimoto). 지시만으로는 실행마다 흔들림.
  - Agent 분리 Phase 1에서 남긴 것(`works/daily-core-agent-split.md`): 실행마다 item이 생겼다 빠졌다 함(#23054), 긴 출력 JSON에서 item 하나가 깨져 재제출될 수 있음, 사람별 예정·보고를 묶은 낮은 중요도 item, 인용 안 된 사람 줄(run 16 기준 8개).

### 3-4. 구조와 스키마 정리

- [ ] 구조와 스키마 정리
  - `app/features/daily-core/contracts`(`DailyCoreAnalysisFields`)를 Worker 출력 형태에 맞추기. v4 뼈대(entities / events / states)는 `works/out/daily-core-v4-v6.patch`에 보류 중.
  - 스키마 정리: `rule_*`, `job_queue`, `run_logs`, `audit_logs`, `external_events`. 새 파이프라인이 정해진 뒤에.
  - `newsletter_run_steps.step` enum 변경.
- [ ] Skill / Subagent 필요 여부: 평가 세트로 반복되는 약점이 보이면 판단. 지금 만들지 않음.
  - 매번 필요한 절차(대화 분석, decision, progress, blocker): 지시문에 둠. Skill로 빼면 로딩 턴이 늘고 안 불릴 위험만 생김.
  - Target 종류·소스 종류에 따라 달라지는 절차: 코드가 아는 조건이므로 코드가 조건부로 지시문을 넣음.
  - Skill: 내용을 읽어 봐야 필요 여부를 아는 절차, 또는 Daily Report 등 여러 Agent가 공유하는 절차.
  - 순서가 정해진 단계, 별도 context·모델: 코드가 호출하는 별도 Agent(지금 방식). 개수가 입력으로 정해지는 병렬 처리도 코드에서.
  - Subagent: 무엇을 몇 개 맡길지 모델이 내용을 보고 정해야 할 때만(예: 긴 스레드만 골라 분석). 결과가 텍스트로만 돌아와 스키마·코드 검사를 따로 붙여야 함.
  - entity(티켓·PR 번호)는 모델 전에 코드로 뽑을 수 있음(v4 실험 38개).

## 4. 순서 미정

### 4-1. Cron 연결

- [ ] Cron 연결(매일 자동 수집·생성). 붙일 때 Vercel 배포 환경의 Slack 시크릿 조회도 확인(로컬은 `.env`의 `SLACK_BOT_TOKEN`으로 대신 돌았음).

### 4-2. fetch 실패 구분

- [ ] fetch 실패 구분(`partial`).

### 4-3. `TestAgent` 제거

- [ ] `TestAgent` 제거: 앱 `FLUE_AGENT_URL`(`/agents/test`)이 기존 메일 발송에 쓰고 있어서, 메일 경로를 바꾼 뒤에.
