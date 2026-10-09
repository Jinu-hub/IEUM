# Daily Core 첫 관통 (E2E) 계획

목표: Target 하나 × 날짜 하루에 대해 아래 경로를 끝까지 한 번 돌린다. 품질보다 "끝까지 이어지는가"가 먼저.

```text
Slack/GitHub 수집 (Vercel 코드)
  → NormalizedSourceItem[] 으로 변환
  → daily_core_data + daily_core_source_data 저장 (collection_stage = collected)
  → Worker가 읽음
  → Flue Agent 하나가 구조화 출력
  → 검증 + merge (meta, evidence, metrics, quality)
  → daily_core_generations 저장, current generation 갱신
```

규칙

- 각 Phase의 확인 항목을 모두 통과해야 다음 Phase로 간다.
- 확인 항목은 **에이전트 확인**(내가 실행·조회로 확인)과 **사용자 확인**(사람이 봐야 판단 가능)으로 나눈다.
- 에이전트가 확인한 것도 무엇을 어떻게 확인했는지 각 Phase의 "확인 기록"에 적는다.

이번에 정한 것

- DB 쓰기는 Worker가 Supabase REST로 한다(`/db/ping`으로 이미 동작 확인). 여러 테이블을 한 트랜잭션으로 묶는 RPC는 나중에 한다. 이번에는 순서대로 쓰고, 중간 실패는 generation `failed`로 남긴다.
- Agent는 하나. 1/2/3 분리는 품질 문제가 확인되면 한다.
- 수집 트리거는 기존 즉시 발송(`processTarget`), 생성 트리거는 수동(curl). Cron은 이번 범위가 아니다.

이번에 안 하는 것

- Cron, 재시도, backfill, `daily_core_items` / `daily_core_metrics` projection, Agent Tool, Daily Report, 메일 발송 내용 변경(`processTarget`에는 수집 저장 한 단계만 끼움).

알려진 한계 (이번엔 그대로 둠)

- 기존 fetch는 실패해도 빈 배열을 돌려준다(`runGithubFetch`, `runSlackFetch`). 그래서 수집 실패와 활동 없음을 구분할 수 없고, quality는 `ready` / `empty`만 나온다. `partial`은 fetch가 실패를 알려주게 고친 뒤에 나온다.
- 기존 fetch는 "지금부터 N일 전" 기준이다. 날짜 창보다 넓게 가져온 뒤 `occurred_at`으로 자른다.
- Slack 스레드 답글은 기존 fetch 설정(`includeThread: false`)대로 뺀다.

---

## Phase 0. 대상 고정

실제 활동이 있던 Target 하나와 날짜 하루를 정한다. 이후 Phase는 모두 이 조합으로 확인한다.

정한 것

- 날짜: `2026-10-09` 임시 고정. 확인이 끝나면 지운다.
- Target: `D_G_S開発チーム` (`ab201835-b5c8-445c-a71f-34dcc229d668`, workspace `a5d582ae-…`). 지금 `processTarget`에 들어오는 테스트 Target이 이것 하나라서 따로 고르지 않음.
  - timezone `Asia/Seoul`, language `ja`, category `development`.
  - 날짜 창: `2026-10-08T15:00:00Z` ~ `2026-10-09T15:00:00Z`.
  - source: Slack `#dev_cs_d3`, `#dev_lead`, `#dev_cs_d1`, GitHub `LEAD`.

에이전트 확인

- [x] Target이 `is_active = true`이고, 활성 source(Slack 채널 또는 GitHub repo)가 1개 이상 연결되어 있다.
- [x] Target의 `timezone`, `language`, `category`, `display_name`이 비어 있지 않다.

사용자 확인

- [x] 고른 날짜에 그 채널/repo에서 실제로 대화나 커밋이 있었다(Slack·GitHub 화면에서 직접 봄).

확인 기록

- 2026-10-09 사용자: 그날 GitHub 커밋과 Slack 채널 대화가 있었음. Phase 0 통과.
- 2026-10-09 에이전트: Supabase REST(service role)로 `targets`, `target_sources`, `integrations`, `daily_core_data`를 조회함. Postgres MCP는 비밀번호 인증 실패로 쓰지 못함.
  - 활성 Target은 3개(`Jinu-hub-git`, `nexletter개발slack`, `D_G_S開発チーム`).
  - `D_G_S開発チーム`의 활성 source 4개는 모두 활성 integration에 연결됨(slack `4ec3e349…`, github `bf7dac51…`, 둘 다 `is_active = true`).
  - 이 Target의 `daily_core_data`는 0행.
- 주의: 오늘 날짜라 창이 아직 닫히지 않음(한국 시간 24:00까지). 지금 수집하면 그때까지의 일부만 들어감. 이번 확인 목적에는 문제없음.

---

## Phase 1. 수집 → 정규화 → 저장 (Vercel 코드, 로컬 실행)

만들 것

- `resolveDailyWindow(coreDate, timezone)`: local date → UTC `[start, end)`.
- 기존 `collectTargetSources`로 가져온 결과를 `NormalizedSourceItem[]`으로 변환.
  - Slack 메시지: `occurred_at` = `ts`.
  - GitHub: commit = `date`, PR = `merged_at` 또는 `closed_at`, issue = `created_at` / `closed_at`.
  - 창 밖 항목은 버림. `source_ref`는 이 수집에서 유일하게 부여.
- `daily_core_data` 생성 또는 기존 행 사용(Target + 날짜 유일) → source별 `daily_core_source_data` 행 추가 → `collection_stage = collected`, `collected_at` 기록.
- 트리거는 별도 엔드포인트를 만들지 않음. 기존 즉시 발송 흐름의 `processTarget`에서 `collectTargetSources` 바로 뒤에 저장함. 메일 발송은 그대로 둠.
- 기존 fetch는 `days: 1`로 고정돼 있어서 "지금부터 24시간 전"까지만 가져옴. 날짜가 고정이므로 다음 날 이후 실행하면 창 앞부분이 빠짐. 창 시작 시각을 덮도록 `days`를 계산해서 넘김.

에이전트 확인

- [x] `resolveDailyWindow('2026-08-17', 'Asia/Tokyo')`가 `2026-08-16T15:00:00Z` ~ `2026-08-17T15:00:00Z`를 돌려준다(assert로 확인).
- [x] 호출 후 `daily_core_data` 행 1개, `collection_stage = collected`.
- [x] source별 `daily_core_source_data` 행이 있고 `item_count`가 `normalized_json` 길이와 같다.
- [x] 모든 항목의 `occurred_at`이 창 안에 있고, `source_ref`가 중복되지 않는다.
- [x] 같은 요청을 다시 보내도 `daily_core_data`는 1행 그대로이고, source_data는 그 Daily Core의 행이 교체된다(source 수만큼만 남음).

사용자 확인

- [ ] 저장된 항목 수가 그날 Slack/GitHub 화면에서 본 양과 대략 맞다(빠진 채널이나 repo가 없다).
- [ ] 항목 2~3개를 골라 내용·작성자·시간이 원본과 같다.

확인 기록

- 2026-10-09 에이전트: 구현과 확인.
  - 코드
    - `daily-core/normalize.ts`: 날짜 창, fetch 일수, Slack/GitHub 정규화, 창 필터.
    - `daily-core/collect.ts`: `daily_core_data` 생성 또는 기존 행 사용, source별 행 저장, `collection_stage` 갱신.
    - `processTarget`에서 `collectTargetSources` 바로 뒤에 저장(날짜는 `DAILY_CORE_TEST_DATE` 상수).
    - fetch 체인에 `days` 인자 추가(기본 1이라 뉴스레터 경로는 그대로).
    - 즉시 발송 경로(`send-now-run.tsx`)의 Target에 `category`가 빠져 있어 추가.
  - `normalize.check.ts`(assert) 통과: 도쿄·서울 창, 뉴욕 서머타임 날(23시간), fetch 일수, 창 경계(시작 포함, 끝 제외). `tsc` 오류 없음.
  - 실행은 `processTarget`이 아니라 `collect.run.ts`(수집 + 저장만)로 함. `processTarget`은 수집 뒤에 팀 Slack 채널에 "Newsletter sent" 알림을 올리고 메일을 보내기 때문. `processTarget`에 끼운 부분은 타입 체크만 됨.
  - 결과(Supabase REST로 조회): `daily_core_data` `fffed258-…` 1행, `collected`, 창 `2026-10-08T15:00Z` ~ `2026-10-09T15:00Z`.

    | source | 상태 | 항목 수 | 내용 |
    |---|---|---|---|
    | `#dev_cs_d1` | success | 36 | 메시지 |
    | `#dev_lead` | success | 59 | 메시지 |
    | `#dev_cs_d3` | success | 21 | 메시지 |
    | `LEAD` (`digitalsheep/LEAD`) | success | 6 | 커밋 5, PR 1 |

    - 모든 행에서 `item_count`와 `normalized_json` 길이가 같음.
    - 창 밖 항목, `source_ref`나 `occurred_at`이 빠진 항목은 0개.
    - `source_ref` 122개 모두 서로 다름.
  - 다시 실행: `daily_core_data` 1행 그대로, source 행 4 → 8.
  - 저장 방식 변경(사용자 결정): 재수집하면 그 Daily Core의 source 행을 모두 지우고 다시 넣음(`insertDailyCoreSourceData` → `replaceDailyCoreSourceData`). 같은 내용이 여러 벌 있으면 헷갈리고, Worker가 전부 읽으면 입력 토큰이 수집 횟수만큼 늘어남. 대신 재수집 후에는 예전 generation의 `input_source_data_ids`가 지워진 행을 가리킬 수 있음. 문서 `02-daily-core-db-schema.md`도 고침.
    - 다시 실행: source 행 8 → 4(모두 같은 `collected_at`), 항목 122개, `daily_core_data` 1행. `tsc` 오류 없음.
  - 발견: 로컬 실행에서 Slack 토큰을 integration 시크릿에서 못 가져옴(`Failed to get secret`, Edge Function `FunctionsHttpError`). `getSlackBotToken`이 null을 돌려주면 `runSlackFetch`가 `.env`의 `SLACK_BOT_TOKEN`으로 대신 받아 옴. 그래서 로컬 수집은 `.env` 토큰으로 됨. 앞의 두 실행도 같았을 것(그때는 로그 필터에 가려서 못 봄). 배포 환경에서 시크릿 조회가 되는지는 Phase 4에서 확인.
  - 발견: `#dev_lead` 59개 중 29개가 본문이 비어 있음(GitHub 앱 28, Slackbot 1). 앱 메시지는 본문이 첨부(attachments)에 있는데 기존 fetch가 `text`만 가져옴. 같은 내용은 `LEAD` repo 수집에 대부분 있음. 빈 항목을 버릴지, 첨부를 읽을지는 Phase 2에서 Agent 입력을 만들 때 정함.
  - 사용자 대조용 샘플(소스별 1개, 한국 시간):
    - `#dev_cs_d1` S019 10:06:33, Yoko Nishimura, "次のチケットは以下でお願いします。…"
    - `LEAD` S040 14:53:19, Katsuya-Matsuzaki, PR "Feature/23116" (`/pull/555`)
    - `#dev_lead` S072 14:53:20, GitHub(본문 빈 앱 메시지)
    - `#dev_cs_d3` S112 10:12:12, Jinu Son, "多分どのメール送信も共通処理「MailSender.java」…"

### Phase 1 보완: 빠진 스레드 부모 가져오기

날짜 창 안에 답글이 있는데 부모 메시지가 창 앞이라 빠진 경우, 부모만 따로 가져와 맥락으로 붙인다. 어제 질문하고 오늘 해결한 스레드가 Agent에게 "답만 있는 대화"로 보이지 않게 하려는 것.

만들 것

- 창 안 답글의 `thread_ref` 중 데이터에 없는 부모를 찾음(`missingThreadParents`).
- 이미 가져온 데이터(창 밖)에 있으면 그것을 쓰고, 없으면 `conversations.replies({ ts, limit: 1 })`로 부모 하나만 가져옴. 스레드 전체를 다시 가져오지 않음(1월에 끈 `includeThread`의 속도 문제를 피함).
- 가져온 부모는 `meta.context_only: true`. 같은 source 행에 함께 저장하고 `source_ref`도 부여. `item_count`에 포함하고, `stats_json.context_items`에 수를 따로 남김.
- 스레드로 묶어서 저장하지 않음. 저장은 항목 단위로 평평하게 두고(`thread_ref`로 연결), 묶는 것은 Phase 2에서 Agent 입력을 만들 때 함.

에이전트 확인

- [x] 부모가 데이터에 없는 답글이 0개다.
- [x] `context_only`가 아닌 항목은 모두 창 안에 있다. `context_only` 항목은 모두 창 앞에 있다.
- [x] `item_count` = `normalized_json` 길이, `source_ref` 중복 없음.

사용자 확인

- [ ] 맥락으로 붙은 부모 메시지가 실제로 그 답글들의 질문(스레드 시작 메시지)이다.

확인 기록

- 2026-10-09 에이전트: 구현과 확인.
  - 코드
    - `slack/fetchers.ts`에 `fetchThreadParent`(부모 하나만 조회, 실패하면 null).
    - `slack/run.ts`에 `runSlackThreadParents`.
    - `cron/api/integration-fetching.ts`에 `fetchSlackThreadParents`(토큰은 `fetchSlackData`와 같은 방식으로 찾음).
    - `daily-core/normalize.ts`에 `missingThreadParents`, `daily-core/collect.ts`에 `contextParents`.
  - `normalize.check.ts`에 부모 찾기 assert 추가, 통과. `tsc` 오류 없음.
  - 다시 수집 결과: source 4행, 항목 122 → 128(맥락 부모 6개 추가). 부모 없는 답글 13 → 0. 6개 모두 API로 가져옴(이미 가져온 데이터에는 없었음). 조회 실패 로그 없음.

    | source | 창 안 | 맥락 부모 | 맥락 부모 (작성 시각 UTC, 답글 수) |
    |---|---|---|---|
    | `#dev_cs_d1` | 36 | 3 | S001 09-30 Yoko Nishimura (18), S002 10-08 Manseon Jeon「本日の作業予定」(22), S003 10-08 Yoko Nishimura (5) |
    | `#dev_cs_d3` | 21 | 2 | S106 07-23 Jinu Son「その7（①）No.133…」(13), S107 10-07 Yoko Nishimura「その7に、10月対応分①」(10) |
    | `#dev_lead` | 59 | 1 | S046 10-08 GitHub 앱(본문 빈 메시지, 1) |
    | `LEAD` | 6 | 0 | |

  - 발견: 7월에 시작된 스레드가 지금도 이어지고 있음(S106). 부모 하나만 가져오므로 문제없음.
  - 발견: `#dev_lead`의 맥락 부모는 본문이 빈 GitHub 앱 메시지라 맥락으로 쓸모가 없음. Phase 2에서 빈 앱 메시지를 처리할 때 같이 다룸.

---

## Phase 2. Worker에서 입력 읽기 + Agent 구조화 출력 (DB에 쓰지 않음)

만들 것

- Worker `POST /core/generate` (토큰 필요, `dailyCoreId` 입력, 이 단계에서는 dry run 응답만).
- `daily_core_data`와 최신 수집 행을 REST로 읽어 Agent 입력(target, window, sources)을 만듦.
- Agent 입력을 만들 때 Slack 항목을 스레드로 묶음. 저장은 평평하게 두고(`thread_ref`로 연결), 읽기용으로만 부모 아래에 답글을 시간순으로 붙임. 각 줄에 `source_ref`를 그대로 달아 근거 연결은 유지.

  ```text
  [S007] 10:02 Yoko: … (replies: 9)
    ↳ [S008] 10:05 Jinu: …
  [S001] (맥락, 09-30) Yoko: …
    ↳ [S0xx] 오늘 답글 …
  ```

- `meta.context_only` 항목은 "맥락용, 그날 활동으로 세지 않음"으로 표시해서 넣음.
- 본문이 빈 앱 메시지(`#dev_lead`의 GitHub 앱 등)를 뺄지 정함.
- `DailyCoreAgent` 하나. 출력은 `DailyCoreAnalysisFields`(overview, highlights, topics, progress_roadmap, member_activity, 각 항목은 `evidence_refs`만 가짐)를 Valibot 스키마로 검증.
- 구조화 출력을 받는 방법은 이 Phase에서 작게 시험해 정함. 후보: Flue `result` 스키마, 또는 입력 스키마가 Core 스키마인 제출용 Tool(`terminate: true`).

에이전트 확인

- [ ] 로컬 Worker(8787)에서 호출하면 스키마 검증을 통과한 JSON이 나온다.
- [ ] 모든 `evidence_refs`가 입력에 있는 `source_ref`다(없는 참조 0개).
- [ ] 같은 입력으로 2번 돌려 소요 시간과 토큰 사용량을 기록한다.
- [ ] Agent 입력 항목 수가 그 Daily Core의 `item_count` 합과 같고 `source_ref` 중복이 없다.
- [ ] 실행마다 새 Flue 대화 ID를 쓴다(이전 기록이 섞여 입력 토큰이 쌓이지 않게).

사용자 확인

- [ ] overview와 각 항목이 그날 실제로 있었던 일과 맞다(지어낸 내용이 없다).
- [ ] 같은 사건이 highlights / topics / progress_roadmap에 중복으로 들어가 있지 않다.
- [ ] 맥락용 부모 메시지(예전 날짜)의 내용을 그날 일어난 일로 쓰지 않았다.
- [ ] Target의 `language`로 쓰였다.
- [ ] 이 정도 품질이면 Phase 3으로 가도 된다고 판단한다. 아니면 프롬프트를 고치고 이 Phase를 반복한다.

확인 기록

- (비어 있음)

---

## Phase 3. Generation 저장

만들 것

- generation 행 생성(`generation_no = last + 1`, `processing`, `trigger = manual`, `input_source_data_ids`, `schema_version`, `prompt_version`, `pipeline_version`, 모델명).
- Agent 실행 후 merge:
  - meta는 `daily_core_data`에서 가져옴.
  - `evidence_refs`를 원본 항목으로 바꿔 evidence 객체로 만듦.
  - 개수 metrics는 코드로 계산.
  - quality는 항목이 없으면 `empty`, 있으면 `ready`.
- `core_json`, `agent_output_json`, 토큰 사용량 저장 → `succeeded`. `daily_core_data`의 `current_generation_no`, `quality_status`, `last_generated_at` 갱신.
- 실패하면 generation `failed` + 에러 기록. current generation은 바꾸지 않음.

에이전트 확인

- [ ] `daily_core_generations`에 `succeeded` 행 1개, `core_json`의 meta가 `daily_core_data`와 같다.
- [ ] `core_json`의 모든 evidence에 `source_item_id`, `occurred_at`이 있고, 같은 정보가 `normalized_json`에 있다.
- [ ] 다시 생성하면 generation 2가 생기고, current가 2로 바뀌고, 1은 남아 있다.
- [ ] 일부러 실패시키면(예: 잘못된 모델명) `failed`와 에러가 남고 current는 그대로다.

사용자 확인

- [ ] evidence의 URL 2~3개를 열어 보면 해당 Slack 메시지나 커밋으로 간다.

확인 기록

- (비어 있음)

---

## Phase 4. 배포본으로 한 번

만들 것

- Worker 배포. 다른 날짜 하나로 수집(Phase 1 엔드포인트) → 생성(배포된 Worker) 순서로 수동 실행.
- 확인용 `/db/ping`, `TestAgent` 제거 여부는 이 Phase에서 정함(기존 메일 발송 경로가 `TestAgent`를 쓰고 있음).

에이전트 확인

- [ ] 배포본 호출 결과가 Phase 3과 같은 형태로 DB에 남는다.
- [ ] Cloudflare 로그에 같은 시각 요청이 error 없이 남는다.

사용자 확인

- [ ] 한 번 생성에 걸린 시간과 토큰 비용이 받아들일 만하다.

확인 기록

- (비어 있음)

---

## 다 끝나면

이 문서의 결과를 바탕으로 다음 중 무엇을 먼저 할지 정한다: Cron 연결, fetch 실패 구분(`partial`), Agent 분리, items/metrics projection, Daily Report.
