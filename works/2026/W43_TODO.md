# W43 TODO (2026-10-19 ~ 10-25)

W42_TODO.md의 남은 것을 옮겨 시작. 한 일은 `W43.md`.

남은 것과 끝난 것을 나눠 적는다. 섹션 번호(1-1, 3-2 등)는 다른 문서가 가리키므로 두 부분에서 같게 쓴다.

# 남은 것

## 1. 지금 우선

### 1-1. 생성 실패 막기

반려 2회면 그날 Core·리포트·메일이 없어짐. 반려하면 모델이 출력 전체를 다시 보내므로, 코드가 고칠 수 있는 것은 고치고 반려는 치명적인 것만(지금까지의 방향).

- [ ] Writer: highlights 밖 `quote_ids`를 반려 → 10-09 리포트 실패(진행 entry "#23163 …"에 quote, 2분 40초 뒤). Finalizer처럼 `withoutStrayQuotes`로 비우고 검사. 한 번 고쳤다가 10-13 변경 취소 때 같이 되돌아감.
- [ ] Structurer: 같은 사람의 member_activity entry 2개를 반려 → 10-13 Core 실패(Momoko Terada, Keiichi Takamune). 같은 이름 entry를 코드가 합침(`core_item_ids` 합집합, summary 이어 붙임).
- [ ] 원문 경로 Interpreter 실패: 첫 `submit_interpretation` 전에 수정 도구를 불러 반려 2번(10-13 raw 4회 중 1회). Finalizer처럼 실패 시 대비책이 없어 그날 Core가 실패함.

### 1-2. items projection

- [ ] items projection: `core_json`을 `daily_core_items` 테이블로 풀어서 저장한다. Agent 분리는 끝났지만 보류: 이 테이블을 읽는 코드가 없음(`listDailyCoreItems` 등 호출처 0). Daily Report는 `core_json`을 직접 읽고, Report·검색이 테이블을 필요로 할 때 한다(사용자, 2026-10-10).
  - `item_type` enum(highlight / topic / progress_roadmap / member_activity)은 지금 4개 배열과 1:1로 맞음.
  - `importance` 타입이 다름: 출력은 0~1 실수, 컬럼은 `integer`. 컬럼을 `numeric`으로 바꿀지 정한다.
  - `semantic_text`(NOT NULL)를 무엇으로 채울지(title + summary 등) 정한다.
  - 저장할 테이블이 늘어나므로 generation 저장을 Postgres 함수(RPC) 하나로 묶는 것도 이때 검토한다. 지금은 Worker가 Supabase REST로 순서대로 씀.

### 1-3. metrics projection

- [ ] metrics projection: `core_json`의 metrics를 `daily_core_metrics`에 저장한다. metrics는 merge에서 코드로 계산하므로 Agent 분리와 상관없이 언제든 할 수 있음. items와 같은 이유로 보류(읽는 코드 없음), 할 때 items와 함께.

### 1-4. 프롬프트 DB 연결 확인

소스는 2026-10-12에 고침(`W42.md`). 조회는 아직 한 번도 안 돌려 봄.

- [ ] **테스트 끝나면 반드시 원복**(사용자): `flue/.dev.vars`의 `PROMPTS_SUPABASE_URL` / `PROMPTS_SUPABASE_KEY` 주석을 풀고 로컬 Worker 재시작. 지금은 일부러 빼서 모든 Agent가 코드 기본값(지시문·모델)으로 돎(10-15에도 주석 상태). 원복 전에 최종 지시문을 프롬프트 DB에 새 버전으로 넣을지 정함(DB `core-interpreter` v1은 코드 v8 + `gpt-6-luna`).
- [ ] 프롬프트 DB에 데이터 넣기: `services`에 `ieum`, `agents`에 `signal-extractor` / `core-interpreter` / `core-structurer` / `daily-report-writer` / `daily-report-finalizer`(`owner_service = 'ieum'`, 기본값이 `market_memory`), `prompt_templates`에 지금 코드 기본값 지시문을 v1로(언어·제출 두 줄은 빼고), `prompt_releases`에 `default` 행.
  - 지금 코드 기본값: `signal-extractor-v6`, `core-interpreter-v12`, `core-structurer-v2`, `daily-report-writer-v4`, `daily-report-finalizer-v3`. DB에 이미 있는 Agent는 이 버전으로 갱신.
  - `signal-extractor`는 넣지 않으면 코드 기본값으로 돎.
  - DB의 `core-interpreter` 지시문은 입력 설명 문단(`RAW_INPUT`)이 코드와 글자 그대로여야 signals target이 돎.
- [ ] 로컬에서 `/core/generate`, `/report/generate`를 돌려 `prompt_version`이 `@v1(default)` 꼴로 남는지, 결과가 코드 기본값일 때와 같은 꼴인지 확인. `dev` 행을 추가해 그쪽이 먼저 잡히는지도.
- [ ] 배포: `PROMPTS_SUPABASE_URL`, `PROMPTS_SUPABASE_KEY`를 `wrangler secret put`(따옴표 없이) 후 배포.

## 2. Daily Report 후속

Daily Report 계획(Phase 0~4)은 W41에 끝남(`W41_TODO.md`의 "끝난 것"). 경과는 `works/daily-report.md`.

- [ ] 앱 Vercel 첫 배포: 전용 문서 `works/vercel-deploy.md`(도메인, 환경변수, Slack 토큰 조회, 함수 시간 실측).
- [ ] 시크릿 노출
  - GitHub 토큰이 앱 로그에 평문으로 찍힘: `app/core/integrations/github/run.ts`의 `console.log('createOctokit with token', cfg.token)`(이전부터). 토큰을 빼고, 이미 찍힌 토큰은 교체할지 정함(2026-10-11 발견).
  - 루트 `.env`의 22·105·106번째 줄이 `KEY=value` 꼴이 아니라 셸에서 읽으면 값(GitHub 토큰, Toss 시크릿 키)이 그대로 출력됨. 10-15에 에이전트 대화 기록에 찍힘. 줄 형식을 고치고 GitHub 토큰 교체(2026-10-15 발견).
- [ ] 메일 HTML 디자인 고도화(사용자, 2026-10-11).
  - 1차 완료(10-15): 상태 배지, KPI 타일·위치, 카드 레이아웃, 톤 변경(크림·틸). 남음: 실제 메일 클라이언트(Gmail/Outlook) 확인, 다크 모드, 섹션 제목 이모지 대체 여부.
  - 참고: `sample/final.html`, React Email은 `transactional-emails/`에 별도 패키지로만 있음(Worker에서 쓸지 정함).
  - 확인 범위: Gmail 웹·모바일, 다크 모드, 휴대폰 폭(지금 약 4화면), 머리·꼬리(브랜드, 수신 설정 링크).
  - 렌더만 바꾸는 작업이라 모델 재실행 없이 저장된 `daily_reports.agent_output_json.draft`로 다시 렌더해서 비교. 바꾸면 `REPORT_FORMAT_VERSION` 올림.
- [ ] Finalizer v3(자유도 허용, 실패 시 Writer 초안 발송) 실행 확인: 합치기·나누기를 실제로 하는지, 빠진 item 반려가 잦은지, 대비책 경고(`report_finalizer_failed`)가 실행 로그에 보이는지.
- [ ] 리포트 내용(10-09, 10-13 변경 때 본 것. 그 변경은 시간 때문에 취소):
  - Writer가 "Minor ... may be left out"으로 Core item 절반가량을 리포트에서 뺌. 다 쓰게 하면 메일이 2배.
  - 「10月修正依頼表No77」이 리포트에서 `#77`로 바뀜(Redmine 티켓처럼 보임).
  - 같은 내용이 highlight와 topics에 겹침(#22540, MillviV3 字幕).
- [ ] 실패 문구: Worker 연결 실패가 "fetch failed"로만 남음. `flue.ts`의 `callFlue`에서 경로·주소를 붙여 감쌈(Phase 3에서 발견).
- [ ] 실패 run 기록: step이 `collect_data`에 머묾(이전부터의 동작). step enum 정리(3-4)와 같이. `finished_at`은 10-15에 채움(`closeNewsletterRun`).
- [ ] run 기록 시점 변경(10-15) 확인: 크론에서 구독 없는 워크스페이스의 행이 안 생기는지, 소스 없음이 `canceled`로 닫히는지, 수동 즉시 발송의 건너뛰기가 화면에 이유와 함께 보이는지.
- [ ] failed 리포트 행의 `error_message`에 원인이 안 남음("[flue] Agent run failed"뿐). Core도 같은 `runAgent`. 필요해지면 Flue 이벤트에서 원인을 꺼냄(Phase 2에서 발견). Core 실패 때는 interpretation도 저장되지 않아 원인을 로컬 wrangler 상태에서 찾아야 했음(10-14).

## 3. 나중에 천천히

### 3-2. 테스트 날짜 고정 제거

- [ ] `target-processing.ts`의 `DAILY_CORE_TEST_DATE` 임시 고정 제거(지금 2026-10-14).

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
  - 끝나면 시험용 `/core/agent`와 `core-agent.run.ts`를 이 러너(`eval.run.ts`, `evaluate: true`)와 합칠지 정함.

#### 모델 교체 비교

- [ ] 모델 교체 비교: 평가 세트가 생긴 뒤 같은 세트로 비교. 지금은 Extractor·Interpreter `openai/gpt-6-luna`, Structurer·Writer·Finalizer `openai/gpt-5.4-mini`.
  - Workers AI 경유: `wrangler.jsonc`에 `"ai": { "binding": "AI" }`, 모델 `cloudflare/@cf/...`. Workers Paid 플랜에서 하루 10,000 Neurons 무료, 넘으면 $0.011 / 1,000 Neurons. 먼저 Structurer(배치)에 `@cf/zai-org/glm-5.3-flash`(1회 약 650 Neurons) 또는 `@cf/openai/gpt-oss-120b`(약 1,100). Tool 호출·긴 JSON·일본어가 되는지, `thinkingLevel`이 먹는지 확인. 로컬 `vite dev`도 실제 과금.
  - `OPENAI_API_KEY` 그대로: `gpt-5.4-nano`(약 $0.016), 품질 쪽 `gpt-6-sol`(약 $0.13). 금액은 run 21 토큰에 레지스트리 단가를 대입한 추정. 작은 모델은 반려가 늘면 단가 이점이 사라짐(반려 상한 2회).
  - Structurer `gpt-5.4-mini`의 버릇: 짧은 key에 설명을 붙여 `core_item_ids`로 씀(10-14, 코드가 되돌림 `restoreCoreIds`), 같은 사람 entry 2개(1-1). 모델을 바꾸면 이 둘이 줄어드는지도 봄.
  - 하지 않음: OpenAI를 AI Gateway Unified Billing으로 옮기기(크레딧 충전 + 5% 수수료). Gateway 로그나 지출 한도가 필요해지면 검토.

#### Interpreter

정확성보다 내용의 쓸모·충실함·읽기 좋은 구성을 먼저(사용자). 근거는 `W42.md` 2026-10-12.

- [ ] overview: 수정에서 다시 써도 릴리스 요청(5점)이 빠지고 이름을 줄임(v6-r1, v9-r1). 지시문의 overview 규칙에 "importance 5 item은 모두", "이름은 입력에 적힌 그대로" 추가 후보.
- [ ] 첫 제출이 보정 단계에 기대어 덜 묶는지(v9-r1 쌍 18개). 계속되면 수정 부담·비용이 커짐.
- [ ] 제목·key 품질(10-09에서 봄, 고친 것은 10-13 변경 취소로 되돌아감): 제목에 티켓 번호가 없음(#22506·#22777·#23033·#23126), 일부만 끝난 일을 「完了」로 씀(#22777), 관계없는 번호가 key에 들어감.
- [ ] 남은 후보: 대기·요청·결정 필드(스키마·Report까지 바뀜). highlight 과다(8~9개)는 Structurer가 3~5개로 고르므로 보류.
- [ ] 입력 개선(지시문이 안정된 뒤, 따로 비교. 입력이 바뀌면 지시문 비교와 원인이 섞임):
  - GitHub Slack 앱 게시물이 빈 본문으로 저장됨: 수집기가 `text` / `files`만 가져오고 앱 게시물 내용은 `attachments` / `blocks`에 있음. 10-09 `#dev_lead` 60건 중 29건이 빈 GitHub 게시물(PR·리뷰 알림으로 보임). `app/core/integrations/slack/fetchers.ts`, `app/features/daily-core/normalize.ts`에서 attachments(title, text, fallback)·blocks 텍스트를 `content`로 펼침. 이미 수집한 날은 재수집해야 반영. 빈 GitHub 부모 + 빈 답글이 `[S046] (context) GitHub:` 빈 줄로 남는 것도 같이 사라짐.
  - Redmine 봇 알림(10-09 `#dev_lead` 20건)은 입력에서 빠져 티켓 제목(#23116 = PERF_TUNING-151 등)과 말로 언급 안 된 티켓 갱신을 잃음. `buildAgentInput`에서 "오늘 봇이 갱신을 알린 티켓" 목록(번호·제목)을 입력 끝에 붙이고, 지시문에 "이 목록만으로 item을 만들지 말고 제목 보강에만" 추가. 봇 줄 하나가 item 하나가 되던 문제(빼게 된 이유)를 되살리지 않는지 확인.

#### SignalExtractor (선택 Call 0)

- [ ] `targets.pipeline_options` 마이그레이션(`sql/migrations/0046_open_starbolt.sql`) 적용: `npm run db:migrate`(typegen 포함). 적용 전에는 모든 target이 Extractor 없이 돎(Worker는 컬럼이 없어도 실패하지 않음).
- [ ] 다른 날짜로 Extractor 유무 비교: `core-agent.run.ts --agent interpreter --id <id>`와, `--agent extractor --id <id>` 결과를 `--agent interpreter --from <extractor .json>`으로. 결과를 보고 target별 기본값을 정함(사용자). 10-09(71줄)는 차이가 결과까지 안 감(W42 10-13). 양이 많은 날로(10-14, 143건 후보).
  - 시간도 같이 봄: Extractor를 켜면 Extractor 35~43초 + Interpreter 26~36초로, 원문 Interpreter(53초)보다 Core가 길어짐. 10-09 signals 경로 Core 153초(10-13). 단계별 시간은 `daily_core_generations.processing_metrics_json.calls.*.elapsed_ms`.
- [ ] v6·Structurer v2 확인(10-09, 10-14): `unplaced_core_items`(코드가 넣은 수), signals 경로 Interpreter의 중요도 4~5가 원문 수준(4~6)으로 내려왔는지, `signal-extractor-v6`에 #23000 signal이 생기는지. 10-09 E2E에서는 26 item에 No.342·No.77·No.8이 모두 있었음.
- [ ] 간접 호칭(「全さん」「宋さん」 등)을 입력의 사람 이름과 잇는 별도 도구(사용자). 지금 Extractor는 이름을 입력 그대로 씀.

#### 남은 품질 문제

- [ ] 빠짐: 실행마다 덮는 범위가 흔들림. 지시만으로는 안정되지 않음. 보정 단계 뒤 10-09 인용 67~70/71(W42)이라 평가 세트로 다른 날도 봐야 함.
  - member_activity에서 빠지는 사람: Mitsuru 등, run 20의 Naoya Tsujimoto.
  - 실행마다 item이 생겼다 빠졌다 함(#23054, Phase 1).
  - 요주의(사용자, 2026-10-11): Core 항목 감소. 지시문을 바꿀 때마다 평가 세트로 덮기가 줄지 않았는지 확인.
- [ ] 겹침·나뉨·배치: core item을 어떻게 묶고 어느 배열에 둘지.
  - 같은 사실이 highlights, progress_roadmap, member_activity에 겹침.
  - 같은 일이 두 core item으로 나뉨(run 20: #23087 topics / progress, 모듈 작성 2개; run 24에서도 모듈 작성이 진행 / 논의로 나뉨).
  - progress 배치 기준: run 21에서 progress 2개뿐, 진행 보고가 topics / highlights로 감.
  - 사람별 예정·보고를 묶은 낮은 중요도 item(Phase 1). signals 경로에서는 「<이름>の日次業務」 entry로 나와 멤버 활동과 겹침(10-09).
  - member_activity next_steps에 남의 할 일이 섞임(10-09, Mitsuru 항목에 Yoko·Jinu의 일).
- [ ] 사람 대응표(workspace 단위, Slack user id ↔ GitHub 로그인). 이름 비교로 못 합치는 사람(`takamune-dsl`)용.
- [ ] 시간·비용·재제출
  - 추론 강도 `medium`에서는 실행마다 2배 이상 흔들림(run 18 345초 / $0.297). `low`로 운영. 덮는 범위가 다시 줄면 `medium`과 비교.
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

#### 분류 전용 Agent (tags / classifications / entities)

`core-interpreter-v11`부터 Interpreter가 이 값들을 안 만들고 `core_json`에는 빈 값(2026-10-12). 읽는 곳이 생기면 별도로 채운다(사용자).

- [ ] 할 때: items projection(1-2)이나 검색·집계 기능처럼 이 값을 읽는 곳이 생길 때. 그 전에는 만들지 않음.
  - entities(티켓·PR·PERF_TUNING 번호)는 Agent 말고 코드(정규식)로 원문에서 뽑음.
  - tags / classifications는 전용 Agent(가칭 `core-tagger`): 입력은 Interpreter의 core item(title, summary, 필요하면 인용 원문)만이라 작고 싸다. Structurer와 병렬로 돌려 전체 시간이 안 늘게. 작은 모델로 충분한지 비교. 실패해도 빈 값으로 저장하고 리포트는 진행.
  - 먼저 분류 체계(고정 목록)를 정하고 picklist로 강제(지금까지의 자유 문자열은 `primary`가 전부 development류라 쓸모 없었음). 정하면 `TAXONOMY_VERSION`을 그 이름으로.
  - Agent 추가 시 `wrangler.jsonc` Durable Object migration 한 줄.

## 4. 순서 미정

### 4-1. Cron 연결

- [ ] Cron 연결(매일 자동 수집·생성). Vercel 배포(`works/vercel-deploy.md`) 뒤에. 배포 환경의 Slack 시크릿 조회는 그 문서에서 확인(로컬은 `.env`의 `SLACK_BOT_TOKEN`으로 대신 돌았음).

### 4-2. fetch 실패 구분

- [ ] fetch 실패 구분(`partial`).

# 끝난 것

## 3. 나중에 천천히

### 3-4. 구조와 스키마 정리

- [x] core_json v2(`daily-core-v2`): evidence를 최상위 맵으로 정규화하고 URL은 `sources` 링크 베이스로 조립, 빈 보조 필드는 생략. 실데이터 84.6K → 41.4K, 리포트 출력 동일. `W43.md` 2026-10-20.
