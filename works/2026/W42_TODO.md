# W42 TODO (2026-10-12 ~ 10-18)

W41_TODO.md의 남은 것을 옮겨 시작. 한 일은 `W42.md`.

남은 것과 끝난 것을 나눠 적는다. 섹션 번호(1-1, 3-2 등)는 다른 문서가 가리키므로 두 부분에서 같게 쓴다.

# 남은 것

## 1. 지금 우선

### 1-2. items projection

- [ ] items projection: `core_json`을 `daily_core_items` 테이블로 풀어서 저장한다. Agent 분리는 끝났지만 보류: 이 테이블을 읽는 코드가 없음(`listDailyCoreItems` 등 호출처 0). Daily Report는 `core_json`을 직접 읽고, Report·검색이 테이블을 필요로 할 때 한다(사용자, 2026-10-10).
  - `item_type` enum(highlight / topic / progress_roadmap / member_activity)은 지금 4개 배열과 1:1로 맞음.
  - `importance` 타입이 다름: 출력은 0~1 실수, 컬럼은 `integer`. 컬럼을 `numeric`으로 바꿀지 정한다.
  - `semantic_text`(NOT NULL)를 무엇으로 채울지(title + summary 등) 정한다.
  - 저장할 테이블이 늘어나므로 generation 저장을 Postgres 함수(RPC) 하나로 묶는 것도 이때 검토한다. 지금은 Worker가 Supabase REST로 순서대로 씀.

### 1-3. metrics projection

- [ ] metrics projection: `core_json`의 metrics를 `daily_core_metrics`에 저장한다. metrics는 merge에서 코드로 계산하므로 Agent 분리와 상관없이 언제든 할 수 있음. items와 같은 이유로 보류(읽는 코드 없음), 할 때 items와 함께.

## 2. Daily Report 후속

Daily Report 계획(Phase 0~4)은 W41에 끝남(`W41_TODO.md`의 "끝난 것"). 경과는 `works/daily-report.md`.

- [ ] 앱 Vercel 첫 배포: 전용 문서 `works/vercel-deploy.md`(도메인, 환경변수, Slack 토큰 조회, 함수 시간 실측).
- [ ] GitHub 토큰이 앱 로그에 평문으로 찍힘: `app/core/integrations/github/run.ts`의 `console.log('createOctokit with token', cfg.token)`(이전부터). 토큰을 빼고, 이미 찍힌 토큰은 교체할지 정함(2026-10-11 발견).
- [ ] 메일 HTML 디자인 고도화(사용자, 2026-10-11). 지금은 `daily-report.ts`의 인라인 스타일 문자열(Phase 0부터 "꾸밈은 나중").
  - 참고: `sample/final.html`, React Email은 `transactional-emails/`에 별도 패키지로만 있음(Worker에서 쓸지 정함).
  - 확인 범위: Gmail 웹·모바일, 다크 모드, 휴대폰 폭(지금 약 4화면), 머리·꼬리(브랜드, 수신 설정 링크).
  - 렌더만 바꾸는 작업이라 모델 재실행 없이 저장된 `daily_reports.agent_output_json.draft`로 다시 렌더해서 비교. 바꾸면 `REPORT_FORMAT_VERSION` 올림.
- [ ] 실패 문구: Worker 연결 실패가 "fetch failed"로만 남음. `flue.ts`의 `callFlue`에서 경로·주소를 붙여 감쌈(Phase 3에서 발견).
- [ ] 실패 run 기록: `finished_at`이 null, step이 `collect_data`에 머묾(이전부터의 동작). step enum 정리(3-4)와 같이.
- [ ] failed 리포트 행의 `error_message`에 원인이 안 남음("[flue] Agent run failed"뿐). Core도 같은 `runAgent`. 필요해지면 Flue 이벤트에서 원인을 꺼냄(Phase 2에서 발견).

## 3. 나중에 천천히

### 3-1. v3.2 결과 확인

- [ ] v3.2 결과 확인: 다음 날짜 데이터로 돌려서 `overview`에 `summary`만 나오는지 본다.

### 3-2. 테스트 날짜 고정 제거

- [ ] `target-processing.ts`의 `DAILY_CORE_TEST_DATE` 임시 고정 제거.

### 3-3. 품질 개선

순서: 평가 세트 → (모델 교체 비교, 품질 문제 고치기). 평가 세트 없이 고치면 좋아졌는지 판단 못 함.

#### 평가 세트

- [ ] 평가 세트: 품질 개선 전에 먼저. 같은 설정에서도 실행마다 인용 수가 10개 넘게 흔들려서(run 16: 63, run 17: 54) 1회 실행으로는 좋아졌는지 판단 못 함.
  - 날짜: 2026-10-09 + 성격이 다른 평일 3일(바쁜 날, 조용한 날, Slack 위주, GitHub 위주). 에이전트가 최근 평일 활동량을 보고 고름. `collect.run.ts`로 날짜별 1번만 수집하고 `flue/eval/set.json`에 날짜, `dailyCoreId`, 특징 메모. 이 행들은 지우지 않는다(지우면 세트가 깨짐).
  - `/core/generate`에 `evaluate: true`: generation과 stats는 저장하되 `current_generation_no`는 안 바꿈.
  - 러너 `flue/src/eval.run.ts --label <설정> --runs 3 [--deployed]`: 날짜 × 횟수를 순차 호출, 결과는 `works/out/eval/<label>-<시각>.json`과 날짜·지표별 최소 / 중앙값 / 최대 표(`.md`).
  - 지표 추가(코드 계산, 정답 라벨 없음): 티켓 재현율(사람 줄에 나온 티켓 번호 중 core item entities·제목에 들어간 비율), 티켓 분할(같은 티켓이 2개 이상 core item), progress 수, core item 수. 기존 지표(사람 줄 인용, 여러 배열 인용, 멤버 / 사람, 반려, 시간, 비용)와 함께 `validation_json.stats`에도 남김.
  - 판단 기준: 새 설정의 중앙값이 기존 설정의 최소~최대 범위 밖으로 나아졌을 때만 개선으로 봄.
  - 비용: `low` 기준 4일 × 3회 = 12번, 약 $0.6, 순차 8~10분(`medium`이면 $2~4).
  - 하지 않음: 별도 평가 DB, 입력 스냅샷 파일, LLM 채점. 자동 지표가 놓치는 게 보이면 그때 날짜별 "꼭 나와야 할 것" 목록을 `set.json`에 추가.
  - Agent 3개 분리(Signal Extractor 추가)는 이 평가로 품질을 본 뒤 장기적으로 판단(사용자, 2026-10-10).

#### 모델 교체 비교

- [ ] 모델 교체 비교: 평가 세트가 생긴 뒤 같은 세트로 비교. 지금은 `openai/gpt-5.4-mini`(1회 약 $0.057).
  - Workers AI 경유: `wrangler.jsonc`에 `"ai": { "binding": "AI" }`, 모델 `cloudflare/@cf/...`. Workers Paid 플랜에서 하루 10,000 Neurons 무료, 넘으면 $0.011 / 1,000 Neurons. 먼저 Call 2(배치)에 `@cf/zai-org/glm-5.3-flash`(1회 약 650 Neurons) 또는 `@cf/openai/gpt-oss-120b`(약 1,100). Call마다 다른 모델을 쓰려면 `app.ts` 수정 필요. Tool 호출·긴 JSON·일본어가 되는지, `thinkingLevel`이 먹는지 확인. 로컬 `vite dev`도 실제 과금.
  - `OPENAI_API_KEY` 그대로: `gpt-5.4-nano`(약 $0.016), `gpt-6-luna`(약 $0.007), 품질 쪽 `gpt-6-sol`(약 $0.13). 금액은 run 21 토큰에 레지스트리 단가를 대입한 추정. 작은 모델은 반려가 늘면 단가 이점이 사라짐(반려 상한 2회).
  - 하지 않음: OpenAI를 AI Gateway Unified Billing으로 옮기기(크레딧 충전 + 5% 수수료). Gateway 로그나 지출 한도가 필요해지면 검토.

#### 남은 품질 문제

- [ ] 빠짐: 실행마다 덮는 범위가 흔들림. 지시만으로는 안정되지 않음.
  - 인용 안 된 사람 줄: 71개 중 48개만 인용(run 10), run 16 기준 8개 남음.
  - member_activity에서 빠지는 사람: Mitsuru 등, run 20의 Naoya Tsujimoto.
  - 실행마다 item이 생겼다 빠졌다 함(#23054, Phase 1).
  - 요주의(사용자, 2026-10-11): Core 항목 감소. generation 6 / 7 / 8(`core-interpreter-v6` / `v7` / `v8`)에서 item 13 / 11 / 16, 인용 43 / 36 / 40(기준 run 21: 53), 멤버 12 / 10 / 13. MillviV3 字幕 item은 generation 7, 8 모두 없음. 지시문을 바꿀 때마다 평가 세트로 덮기가 줄지 않았는지 확인.
- [ ] 겹침·나뉨·배치: core item을 어떻게 묶고 어느 배열에 둘지.
  - 같은 사실이 highlights, progress_roadmap, member_activity에 겹침.
  - 같은 일이 두 core item으로 나뉨(run 20: #23087 topics / progress, 모듈 작성 2개; run 24에서도 모듈 작성이 진행 / 논의로 나뉨).
  - progress 배치 기준: run 21에서 progress 2개뿐, 진행 보고가 topics / highlights로 감.
  - 사람별 예정·보고를 묶은 낮은 중요도 item(Phase 1).
- [ ] 사람 대응표(workspace 단위, Slack user id ↔ GitHub 로그인). 이름 비교로 못 합치는 사람(`takamune-dsl`)용.
- [ ] 시간·비용·재제출
  - 추론 강도 `medium`에서는 실행마다 2배 이상 흔들림(run 18 345초 / $0.297). `low` + `core-interpreter-v5`로 바꿔 배포본 42초 / $0.057. 덮는 범위가 다시 줄면 `medium`과 비교.
  - 긴 출력 JSON에서 item 하나가 깨져 재제출될 수 있음(Phase 1).

Phase 1에서 남긴 것의 원문은 `works/daily-core-agent-split.md`.

### 3-4. 구조와 스키마 정리

#### 계약과 DB 스키마

- [ ] contracts 맞추기: `app/features/daily-core/contracts`(`DailyCoreAnalysisFields`)를 Worker 출력 형태에 맞추기. v4 뼈대(entities / events / states)는 `works/out/daily-core-v4-v6.patch`에 보류 중.
- [ ] DB 스키마 정리: 새 파이프라인이 정해진 뒤에.
  - 안 쓰는 테이블 정리: `rule_*`, `job_queue`, `run_logs`, `audit_logs`, `external_events`.
  - `newsletter_run_steps.step` enum 변경.

#### Skill / Subagent 필요 여부

- [ ] Skill / Subagent 필요 여부: 평가 세트로 반복되는 약점이 보이면 판단. 지금 만들지 않음.
  - 절차를 어디에 둘지 기준:
    - 매번 필요한 절차(대화 분석, decision, progress, blocker) → 지시문. Skill로 빼면 로딩 턴이 늘고 안 불릴 위험만 생김.
    - Target 종류·소스 종류에 따라 달라지는 절차 → 코드가 아는 조건이므로 코드가 조건부로 지시문을 넣음.
    - 내용을 읽어 봐야 필요 여부를 아는 절차, 또는 Daily Report 등 여러 Agent가 공유하는 절차 → Skill.
    - 순서가 정해진 단계, 별도 context·모델 → 코드가 호출하는 별도 Agent(지금 방식). 개수가 입력으로 정해지는 병렬 처리도 코드에서.
    - 무엇을 몇 개 맡길지 모델이 내용을 보고 정해야 할 때만 → Subagent(예: 긴 스레드만 골라 분석). 결과가 텍스트로만 돌아와 스키마·코드 검사를 따로 붙여야 함.
  - 참고: entity(티켓·PR 번호)는 모델 전에 코드로 뽑을 수 있음(v4 실험 38개).

## 4. 순서 미정

### 4-1. Cron 연결

- [ ] Cron 연결(매일 자동 수집·생성). Vercel 배포(`works/vercel-deploy.md`) 뒤에. 배포 환경의 Slack 시크릿 조회는 그 문서에서 확인(로컬은 `.env`의 `SLACK_BOT_TOKEN`으로 대신 돌았음).

### 4-2. fetch 실패 구분

- [ ] fetch 실패 구분(`partial`).

# 끝난 것
