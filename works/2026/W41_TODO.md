# W41 TODO (2026-10-05 ~ 10-11)

Daily Core E2E(Phase 0~4) 완료 이후 할 일. 한 일은 `W41.md`, E2E 경과는 `works/daily-core-e2e.md`.

## 1. 지금 우선

### 1-1. Agent 분리

- [ ] Agent 분리: 지금의 단일 Agent(`DailyCore`)를 `app/features/daily-core/dev/02-pipeline-architecture.md`의 3개 역할(Signal Extractor → Core Interpreter → Core Structurer)로 나눈다. 계약은 `app/features/daily-core/contracts/agent-io.ts`. 품질 개선(항목 간 중복 등)과도 이어진다.
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

- [ ] 품질 개선
  - 같은 사실이 highlights, progress_roadmap, member_activity에 겹침.
  - member_activity에서 빠지는 사람(Mitsuru 등).
  - 사람이 쓴 줄 71개 중 48개만 인용(run 10 기준).
  - 사람 대응표(workspace 단위, Slack user id ↔ GitHub 로그인). 이름 비교로 못 합치는 사람(`takamune-dsl`)용.

### 3-4. 구조와 스키마 정리

- [ ] 구조와 스키마 정리
  - `app/features/daily-core/contracts`(`DailyCoreAnalysisFields`)를 Worker 출력 형태에 맞추기. v4 뼈대(entities / events / states)는 `works/out/daily-core-v4-v6.patch`에 보류 중.
  - 스키마 정리: `rule_*`, `job_queue`, `run_logs`, `audit_logs`, `external_events`. 새 파이프라인이 정해진 뒤에.
  - `newsletter_run_steps.step` enum 변경.

## 4. 순서 미정

### 4-1. Cron 연결

- [ ] Cron 연결(매일 자동 수집·생성). 붙일 때 Vercel 배포 환경의 Slack 시크릿 조회도 확인(로컬은 `.env`의 `SLACK_BOT_TOKEN`으로 대신 돌았음).

### 4-2. fetch 실패 구분

- [ ] fetch 실패 구분(`partial`).

### 4-3. `TestAgent` 제거

- [ ] `TestAgent` 제거: 앱 `FLUE_AGENT_URL`(`/agents/test`)이 기존 메일 발송에 쓰고 있어서, 메일 경로를 바꾼 뒤에.
