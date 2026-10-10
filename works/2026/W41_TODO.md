# W41 TODO (2026-10-05 ~ 10-11)

Daily Core E2E(Phase 0~4) 완료 이후 할 일. 한 일은 `W41.md`, E2E 경과는 `works/daily-core-e2e.md`.

## 1. 지금 우선

- [ ] Agent 분리: 지금의 단일 Agent(`DailyCore`)를 해석(Interpreter)과 구조화(Structurer)로 나눈다. `app/features/daily-core/contracts`의 설계 방향(`CoreInterpreterOutput` → `CoreStructurerInput`). 품질 개선(항목 간 중복 등)과도 이어진다.
- [ ] items/metrics projection: `core_json`을 `daily_core_items`, `daily_core_metrics` 테이블로 풀어서 저장한다.
  - `daily_core_items.item_type` enum을 Worker 출력 형태에 맞출지 같이 정한다.
  - 저장할 테이블이 늘어나므로 generation 저장을 Postgres 함수(RPC) 하나로 묶는 것도 이때 검토한다. 지금은 Worker가 Supabase REST로 순서대로 씀.

## 2. 그다음

- [ ] Daily Report: Daily Core를 받아 리포트를 만든다.

## 3. 나중에 천천히

- [ ] v3.2 결과 확인: 다음 날짜 데이터로 돌려서 `overview`에 `summary`만 나오는지 본다.
- [ ] `target-processing.ts`의 `DAILY_CORE_TEST_DATE` 임시 고정 제거.
- [ ] 품질 개선
  - 같은 사실이 highlights, progress_roadmap, member_activity에 겹침.
  - member_activity에서 빠지는 사람(Mitsuru 등).
  - 사람이 쓴 줄 71개 중 48개만 인용(run 10 기준).
  - 사람 대응표(workspace 단위, Slack user id ↔ GitHub 로그인). 이름 비교로 못 합치는 사람(`takamune-dsl`)용.
- [ ] 구조와 스키마 정리
  - `app/features/daily-core/contracts`(`DailyCoreAnalysisFields`)를 Worker 출력 형태에 맞추기. v4 뼈대(entities / events / states)는 `works/out/daily-core-v4-v6.patch`에 보류 중.
  - 스키마 정리: `rule_*`, `job_queue`, `run_logs`, `audit_logs`, `external_events`. 새 파이프라인이 정해진 뒤에.
  - `newsletter_run_steps.step` enum 변경.

## 순서 미정

- [ ] Cron 연결(매일 자동 수집·생성). 붙일 때 Vercel 배포 환경의 Slack 시크릿 조회도 확인(로컬은 `.env`의 `SLACK_BOT_TOKEN`으로 대신 돌았음).
- [ ] fetch 실패 구분(`partial`).
- [ ] `TestAgent` 제거: 앱 `FLUE_AGENT_URL`(`/agents/test`)이 기존 메일 발송에 쓰고 있어서, 메일 경로를 바꾼 뒤에.
