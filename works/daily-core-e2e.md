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

- [x] 저장된 항목 수가 그날 Slack/GitHub 화면에서 본 양과 대략 맞다(빠진 채널이나 repo가 없다).
- [x] 항목 2~3개를 골라 내용·작성자·시간이 원본과 같다.

확인 기록

- 2026-10-09 사용자: Phase 1 확인 완료(보완 포함). Phase 1 통과.
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

- [x] 맥락으로 붙은 부모 메시지가 실제로 그 답글들의 질문(스레드 시작 메시지)이다.

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

- `meta.context_only` 항목은 `(context, 날짜)`로 표시해서 넣음.
- 본문이 빈 앱 메시지는 뺌(답글이 달린 부모는 남김). 같은 내용이 `LEAD` repo 수집에 있음.
- Agent `DailyCore` 하나. 출력은 Valibot 스키마로 검증.
  - v1~v3: `DailyCoreAnalysisFields`(overview, highlights, topics, progress_roadmap, member_activity).
  - v4부터: 공통 뼈대(entities, events, states)와 카테고리 템플릿. 아래 "Core 뼈대 재설계" 참고.
- 구조화 출력은 제출용 Tool로 받음. Tool의 입력 스키마가 Core 스키마이고, 통과하면 `useDataWriter`로 내보낸 뒤 `terminate: true`로 끝냄. Worker는 `AgentReply.data`에서 꺼냄.
  - 근거 규칙도 Tool 안에서 검사함. 없는 ref를 쓰거나 맥락 ref만 인용하면 에러를 돌려주고, 모델이 고쳐서 다시 제출함.
  - 제출 없이 끝내려 하면 `useAgentFinish`가 다시 일을 시킴.
  - Flue `result`(harness.prompt)는 Tool이나 hook 안에서 별도 대화를 열어야 해서 쓰지 않음.

에이전트 확인

- [x] 로컬 Worker(8787)에서 호출하면 스키마 검증을 통과한 JSON이 나온다.
- [x] 모든 `evidence_refs`가 입력에 있는 `source_ref`다(없는 참조 0개).
- [x] 모든 항목이 맥락이 아닌 ref를 1개 이상 인용한다(맥락 부모는 참조용).
- [x] 같은 입력으로 2번 돌려 소요 시간과 토큰 사용량을 기록한다.
- [x] Agent 입력 항목 수(넣은 것 + 뺀 빈 메시지)가 그 Daily Core의 `item_count` 합과 같고 `source_ref` 중복이 없다.
- [x] 실행마다 새 Flue 대화 ID를 쓴다(이전 기록이 섞여 입력 토큰이 쌓이지 않게).

사용자 확인

- [ ] overview와 각 항목이 그날 실제로 있었던 일과 맞다(지어낸 내용이 없다).
- [ ] 같은 사건이 highlights / topics / progress_roadmap에 중복으로 들어가 있지 않다.
- [ ] 맥락용 부모 메시지(예전 날짜)의 내용을 그날 일어난 일로 쓰지 않았다.
- [ ] Target의 `language`로 쓰였다.
- [ ] 이 정도 품질이면 Phase 3으로 가도 된다고 판단한다. 아니면 프롬프트를 고치고 이 Phase를 반복한다.

확인 기록

- 2026-10-09 에이전트: 구현과 확인.
  - 코드(`flue/`)
    - `src/daily-core.ts`: 출력 스키마, 입력 만들기(스레드 묶기, 맥락 표시, 빈 메시지 빼기), 근거 검사.
    - `src/agents/daily-core.ts`: Agent `DailyCore`(모델 `openai/gpt-5.4-mini`, `daily-core-v1`). 제출 Tool, 제출 강제, 토큰 사용량과 Tool 호출을 response metadata에 남김.
    - `src/app.ts`: `POST /core/generate`(토큰 필요, uuid 검사). Supabase REST로 읽고 `init(DailyCore)`로 매번 새 인스턴스를 만들어 실행. DB에는 쓰지 않음.
    - `wrangler.jsonc`: migration `v2`(`FlueDailyCoreAgent`).
    - `src/daily-core.check.ts`(assert) 통과: 스레드 묶기, 맥락 표시, 빈 메시지 빼기, 근거 검사. `tsc` 오류 없음.
  - 발견: Worker의 Vite가 7.3.7이었는데 `@flue/vite`는 Vite 8 이상을 요구함. Vite 7의 파서는 Agent 파일의 TypeScript 문법(`type`, 제네릭)을 읽지 못해 dev 서버가 뜨지 않음. Vite 8.3.4로 올림. 새 의존성(`valibot`, `hono/bearer-auth`)은 `optimizeDeps.include`에 추가.
  - 로컬 `.dev.vars`에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`가 없어서 루트 `.env`에서 옮김(값은 출력하지 않음). 배포본은 이미 secret이 있음(`/db/ping`).
  - 입력: 항목 128개 중 99개를 넣고 빈 메시지 29개를 뺌(99 + 29 = 128). 맥락 6개. 본문 15,212자.
  - 실행 결과(같은 입력)

    | | 1회 | 2회 |
    |---|---|---|
    | 대화 ID | `instance_01M4GE2MXC…` | `instance_01M4GE4N21…` |
    | 소요 시간 | 42.3초 | 40.3초 |
    | 토큰 입력 / 출력 | 9,899 / 10,460 | 9,899 / 8,407 |
    | 비용 | $0.054 | $0.045 |
    | 제출 Tool 호출 | (기록 전) | 1회, 에러 없음 |
    | highlights / topics / progress / member | 4 / 7 / 6 / 16 | 5 / 6 / 5 / 11 |
    | 근거 위반 | 0 | 0 |
    | 맥락 ref 인용 | 0 | 0 |

  - 발견: 두 번 모두 같은 사건이 여러 배열에 들어감. #23163, #22506은 highlights, topics, progress_roadmap 세 곳에 모두 있음. 프롬프트의 "한 곳에만" 규칙을 모델이 따르지 않음.
  - 발견: `member_activity`가 실행마다 다름. 1회는 16명이고 title이 이름이었고, 2회는 11명이고 title이 문장이었음(티켓 업데이트만 한 5명이 빠짐).
  - 사용자 확인용 출력: `works/out/daily-core-run1.md`, `works/out/daily-core-run2.md`(gitignore 대상. 팀 대화 내용이 들어 있음).
- 2026-10-09 사용자: `member_activity`에 모르는 사람이 있음(Chisho Yamada, Nobunao Nagai, Miyuu Yano).
  - 원인: `#dev_lead`의 Redmine 봇 알림(`[LEAD] X updated #N`) 본문 속 이름. 작성자는 `redmine` 봇이고 user id가 없음. 이 Daily Core에서 20건. Agent가 본문 속 이름을 활동한 멤버로 봄.
  - 결정(사용자): 봇 알림을 입력에서 표시하고, 멤버 항목은 직접 쓴 메시지·커밋·PR로만 만듦. 봇 알림은 같은 티켓 항목의 보조 근거로만 씀.
- 2026-10-09 에이전트: `daily-core-v2`로 반영하고 확인.
  - Slack 항목 중 user id가 없는 것을 봇으로 보고 `(bot notification)`으로 표시. 데이터를 다시 수집하지 않고 Worker에서 판단함.
  - 프롬프트에 봇 알림 설명과 규칙 추가. 제출 Tool에서 `member_activity` 항목이 봇 알림이나 맥락 ref만 인용하면 에러를 돌려줌.
  - `daily-core.check.ts`에 봇 표시와 검사 assert 추가, 통과. `tsc` 오류 없음.
  - 실행 결과(같은 입력, 입력 15,592자, 봇 알림 20개)

    | | 3회 | 4회 |
    |---|---|---|
    | 소요 시간 | 80.4초 | 78.4초 |
    | 토큰 입력 / 출력 | 10,054 / 15,648 | 10,054 / 13,555 |
    | 비용 | $0.078 | $0.069 |
    | 제출 Tool 호출 | 1회, 에러 없음 | 1회, 에러 없음 |
    | highlights / topics / progress / member | 4 / 4 / 6 / 13 | 5 / 5 / 5 / 14 |
    | 근거 위반 | 0 | 0 |

  - Redmine 알림에만 나온 4명(Chisho Yamada, Nobunao Nagai, Miyuu Yano, Yasuhiro Oba)은 두 번 모두 `member_activity`에서 빠짐. 봇 알림은 #23145, #23126 항목의 보조 근거로 인용됨.
  - 발견: 같은 사람이 GitHub 로그인과 Slack 이름으로 따로 잡힘. 4회에서 `takamune-dsl`과 Keiichi Takamune, GitHub `Jinwoo Song`(`jinuSon`)과 Slack Jinu Son이 각각 다른 멤버로 나옴. 3회에서는 모델이 합쳤음. GitHub 작성자는 이름이 없으면 로그인을 씀(`takamune-dsl`, `Katsuya-Matsuzaki`, `SuchonKou`, `Yuuki-Imai`).
  - 발견: v1보다 소요 시간이 약 2배(40초 → 80초), 출력 토큰이 약 1.5배 늘어남. 입력은 거의 같음(+155 토큰). 규칙이 늘어서 모델의 추론 토큰이 늘어난 것으로 보임.
  - 발견: `member_activity` title 형식이 여전히 실행마다 다름(3회는 문장, 4회는 이름).
  - 사용자 확인용 출력: `works/out/daily-core-run3.md`, `works/out/daily-core-run4.md`.
- 2026-10-09 사용자 결정: 배열 간 중복 규칙은 지금대로 둠. 사람 합치기는 이름 비교(방법 1)로 하고, `member_activity` title은 이름만.
  - 검토한 다른 방법: 이메일 비교(GitHub 커밋 이메일을 수집해야 함), workspace 단위 대응표(Slack user id ↔ GitHub 로그인). 대응표는 나중에, 이름 비교는 그때 기본값으로 남김.
- 2026-10-09 에이전트: `daily-core-v3`로 반영하고 확인.
  - GitHub 작성자의 로그인이나 이름을 대소문자·기호를 빼고 비교해서, 같은 Daily Core의 Slack 작성자 이름과 같으면 입력에 Slack 이름으로 씀. 원본 데이터는 바꾸지 않음.
    - 실제 데이터: `jinuSon` → Jinu Son, `Katsuya-Matsuzaki`, `SuchonKou`, `Yuuki-Imai`가 합쳐짐. `takamune-dsl`은 Slack 이름(Keiichi Takamune)과 달라서 안 합쳐짐(대응표가 필요).
  - Slackbot 리마인더(`USLACKBOT`, 2건)도 봇으로 처리. 처음 확인에서 사람 목록에 Slackbot이 들어가 있어서 고침.
  - 입력에 나온 사람 목록(봇·맥락 제외, 13명)을 Agent에 넘기고, 제출 Tool에서 `member_activity` title이 그 목록의 이름과 정확히 같은지 검사.
  - `daily-core.check.ts`에 이름 합치기, Slackbot, title 검사 assert 추가, 통과. `tsc` 오류 없음.
  - 실행 결과(같은 입력)

    | | 5회 | 6회 |
    |---|---|---|
    | 소요 시간 | 137.8초 | 112.6초 |
    | 토큰 입력 / 출력 | 10,074 / 23,392 | 10,074 / 19,778 |
    | 비용 | $0.113 | $0.097 |
    | 제출 Tool 호출 | 1회, 에러 없음 | 1회, 에러 없음 |
    | highlights / topics / progress / member | 5 / 5 / 6 / 13 | 5 / 4 / 3 / 12 |
    | 근거 위반 / 맥락 ref 인용 | 0 / 0 | 0 / 0 |

  - title은 두 번 모두 이름만. Jinu Son 등은 한 사람으로 나옴. 6회는 Keiichi Takamune를 뺌("활동한 사람 전원" 규칙은 없음).
  - 발견: 출력 토큰이 계속 늘어남(v1 약 1만 → v2 약 1.4만 → v3 약 2.1만). 출력 JSON은 1만~1.2만 자라서 대부분은 추론 토큰으로 보임. Flue 기본 추론 강도는 `medium`이고, `useModel(model, { thinkingLevel })`로 낮출 수 있음. 품질과 맞바꾸는 문제라 바꾸지 않음.
  - 사용자 확인용 출력: `works/out/daily-core-run5.md`, `works/out/daily-core-run6.md`.
- 2026-10-09 사용자: v3 결과는 생각한 Core 데이터와 많이 다름. 구조화된 데이터라기엔 어정쩡함. 다른 업종(영업, 상사, 금융)에서도 쓸 수 있게 일반화의 뼈대를 잡고, 카테고리별 템플릿으로 가자.
  - 원인 분석(에이전트)
    - 스키마가 리포트 목차 모양이라(highlights / topics / progress / member) 각 항목이 요약 카드가 됨. 배열 간 중복도 여기서 생김.
    - `tags`, `classifications`, `entities`가 자유 텍스트. run6의 `classifications.primary`는 항목 20개에 16종. 날짜를 넘어 묶거나 셀 수 없음.
    - overview와 highlights는 Report의 일(무엇을 강조할지)임(`docs/ieum-architecture.md` 8, 15장).

### Core 뼈대 재설계 (v4)

결정

- 세 층으로 나눔.
  - 공통 뼈대(코드에 고정): 출력 형태, 사건 종류, 상태 어휘, 근거 검사. 모든 카테고리가 같음.
  - 카테고리 템플릿(우리가 제공): 엔티티 종류와 추출 규칙, 모델이 추가할 수 있는 엔티티 종류, 프롬프트 안내 문단. Target의 `category`로 고름. 없으면 `generic`.
  - workspace 설정(고객마다): 티켓 번호 형식, 봇 정책, 사람 대응표. 아직 저장할 곳을 만들지 않고 development 템플릿의 기본값으로 둠.
- 출력
  - `entities`: 입력 목록에 없는데 필요한 대상만 모델이 추가. 종류는 템플릿이 허용한 것만. 키는 `<type>:<slug>`.
  - `events`: 그날 일어난 사실 하나씩. `type`은 decision / progress / completion / issue / risk / request / plan / discussion / announcement / other. `subject`(엔티티 키), `actors`(사람 키), `fact`(한 문장), `stage`(도메인 단계), `measures`(금액·수량·기한, 원문 그대로), `importance`(1~5), `evidence_refs`.
  - `states`: 그날 움직인 대상별 하루 끝 상태. `status`는 planned / in_progress / blocked / completed / unknown, 그리고 `stage`, `next_step`.
- 출력에서 뺀 것: overview, highlights(Report가 `importance`로 고름), `member_activity`(사건을 사람별로 묶어 코드로 만듦), 자유 텍스트 `tags` / `classifications`.
- 엔티티는 코드로 뽑음(development 템플릿): `#123`(Redmine), `ABC-123`(Backlog, Jira), Redmine 알림 링크의 티켓 제목, GitHub PR과 repo. 사람은 작성자에서 `person:<이름 정규화>`로 만듦.
- 제출 Tool 검사(코드)
  - 근거 ref가 입력에 있고 그날 줄을 하나 이상 포함.
  - `subject`와 `actors`가 입력 목록이나 모델이 추가한 엔티티에 있음.
  - 봇 알림이나 맥락만 인용한 사건에는 `actors`를 넣을 수 없음.
  - `measures`의 값이 인용한 줄의 원문에 있음(숫자를 지어내지 못하게. 영업·금융용).
  - 모델이 추가한 엔티티 종류가 템플릿 허용 목록에 있고, 입력 엔티티와 겹치지 않음. 같은 대상의 state는 하나.

확인 기록

- 2026-10-09 에이전트: `daily-core-v4/development@1`로 구현하고 1회 실행(사용자 요청: 테스트 실행은 1번만).
  - 코드: `flue/src/daily-core-templates.ts`(development, generic), `flue/src/daily-core.ts`(뼈대 스키마, 입력, 검사, `memberActivity`), Agent 지시문 교체, `/core/generate` 응답에 `memberActivity`와 입력 엔티티·사람 추가.
  - `daily-core.check.ts`(assert) 통과: 엔티티 추출(티켓 3형식, Redmine 제목, PR, repo), generic은 추출 없음, 검사 규칙 전부, `memberActivity` 집계. `tsc` 오류 없음.
  - 실데이터 엔티티 추출(모델 없이): 38개(티켓, PR, repo). 그중 16개는 Redmine 알림에서 제목도 얻음. 오탐은 보이지 않음.
  - 실행 결과

    | 항목 | 값 |
    |---|---|
    | 소요 시간 | 36.1초 |
    | 토큰 입력 / 출력 | 10,850 / 7,361 |
    | 비용 | $0.041 |
    | 제출 Tool 호출 | 1회, 에러 없음 |
    | 검사 위반 | 0 |
    | events / states / 추가 엔티티 | 11 / 11 / 0 |
    | 사건 종류 | progress 5, completion 3, discussion 2, plan 1 |

  - 좋아진 점
    - 모든 사건과 상태가 엔티티 키(`ticket:23163` 등)에 붙음. 같은 티켓이 여러 배열에 흩어지던 중복이 없어짐.
    - 상태에 `stage`(実装中, 検証中, レビュー依頼中)와 `next_step`이 남음.
    - v3보다 시간 1/3, 비용 1/2 이하.
  - 발견: 빠진 사실이 많음. 같은 날 사람이 쓴 줄 71개 중 25개만 인용됨(46개 미인용).
    - 빠진 것 예: MillviV3 자막 대응 요청과 우선순위 조정(S012~S021), Naoya의 11월 수정의뢰표 No.8 수정(S032), 10월 버전 모듈 작성(S099, S045), Codex 장애 공유(S096), PERF_TUNING-164 성능 개선 문의(S052), #23054 출력 이력 수 제한(S027), 5-5 No342 대응 설명(S122, S123), 개인 업무 보고(S004, S005, S039, S120, S126).
    - 원인: 티켓 키가 있는 일만 사건으로 잡고, 티켓 번호가 없는 일(고객사 안건, 개인 보고)은 건너뜀. 추가 엔티티가 0개였던 것도 같은 이유.
    - 봇 알림(Redmine)만 있는 티켓 변경은 사건으로 잡히지 않음. 사람 행위가 없으니 actors 없이 기록해도 되는데 하지 않음.
  - 발견: Slack 멘션이 `<@U0ASSK21ND7>` 같은 ID로 들어가서 누구에게 한 말인지 모델이 모름. 작성자 목록에서 ID → 이름으로 바꿔 넣을 수 있음.
  - 사용자 확인용 출력: `works/out/daily-core-run7.md`(사건, 상태, 코드로 만든 멤버 활동, 입력 엔티티).
- 2026-10-09 에이전트: `daily-core-v5/development@1`로 고치고 1회 실행(run 8).
  - 바꾼 것
    - 출력에 `skipped_refs`(사실이 없는 줄: 인사, 감사, 맞장구) 추가. 제출 Tool이 그날 사람이 쓴 줄이 모두 사건 근거나 `skipped_refs`에 들어갔는지 검사하고, 빠진 ref를 에러로 돌려줌.
    - 지시문: 티켓 없는 일도 사건으로(엔티티 추가 또는 `subject: null`), 개인 업무 보고는 작성자의 plan / progress, 봇 알림만 있는 변경은 actors 없는 사건으로 둘 수 있음.
    - Slack 멘션 `<@U…>`를 그날 작성자 목록으로 `@이름`으로 바꿈. `<!channel>` 등은 `@channel`.
  - `daily-core.check.ts` 통과(멘션 치환, 미처리 줄 검출, `skipped_refs`의 모르는 ref). `tsc` 오류 없음.
  - 실행 결과

    | 항목 | run 7 (v4) | run 8 (v5) |
    |---|---|---|
    | 소요 시간 | 36.1초 | 362.8초 |
    | 토큰 입력 / 출력 | 10,850 / 7,361 | 70,470 / 64,240 |
    | 비용 | $0.041 | $0.343 |
    | 제출 Tool 호출 | 1회 | 2회(1회차 검사 에러, 2회차 통과) |
    | 사람 줄 71개 처리 | 25개 인용 | 64개 인용 + 7개 건너뜀 |
    | events / states / 추가 엔티티 | 11 / 11 / 0 | 25 / 31 / 0 |
    | `subject: null` 사건 | 0 | 10 |

  - 좋아진 점
    - run 7에서 빠졌던 일이 대부분 들어옴: MillviV3 자막 대응, Naoya No.8 수정, 10월 모듈 작성, Codex 장애, PERF_TUNING-164 문의, No342 설명, 개인 업무 보고.
    - 멘션이 이름으로 들어가서 사실 문장에 누가 누구에게 한 말인지 나옴.
  - 발견
    - 시간 10배, 비용 8배. 출력 토큰 대부분이 추론으로 보임(줄 99개를 대조하고, 1회 반려 후 전체를 다시 냄).
    - 사건이 "대화 요약"이 됨. 사건당 근거 평균 3.2개, 최대 7개. 여러 사람의 행동을 한 문장에 묶어서, 코드로 만든 멤버 활동에 남의 사실이 섞임(Yoko에게 사실 9개, 대부분 다른 사람의 일).
    - 엔티티를 추가하지 않고 `subject: null`로 처리(MillviV3 등). 같은 대상을 다른 날과 잇기 어려움.
    - 봇 알림 티켓 변경을 티켓 여러 개를 묶은 `other` 사건 하나로 만들고, 그 티켓마다 `unknown` 상태를 만듦(31개 중 13개가 `unknown`).
    - 사실이 있는 줄도 건너뜀으로 빠져나감: S027(#23054 처리 제안), S031(개요서 작성 완료).
  - 사용자 확인용 출력: `works/out/daily-core-run8.md`, 입력 원문 `works/out/daily-core-run8-input.txt`.
  - 사용자 판단: 이러면 안 됨. 강제는 빼기로.
- 2026-10-09 에이전트: `daily-core-v6/development@1`. v5에서 `skipped_refs`, 줄 처리 검사, "모든 줄 처리" 지시만 뺌. 멘션 치환과 티켓 없는 일·개인 보고·봇 알림 안내 문장은 남김. 1회 실행(run 9).
  - 결과: 131.1초, 토큰 입력 11,382 / 출력 21,002, $0.105. 제출 2회(1회차 검사 에러). 위반 0. events 15 / states 29(그중 `unknown` 12) / 추가 엔티티 0.
  - 사람 줄 71개 중 23개 인용. run 7(25개)과 비슷하게 돌아감. MillviV3, 개인 업무 보고, No.8, No342 다시 빠짐.
  - 사건 문장은 run 8보다 한 사람 한 사실에 가까움(여러 actors 2건). 다만 #23163 사건의 문장은 Yuki Kato인데 actors가 Yuuki Imai로 들어감. 이름이 비슷한 사람을 잘못 고름(코드 검사로는 못 잡음).
  - 봇 알림 티켓 12개를 사건 하나로 묶고, 티켓마다 `unknown` 상태를 만드는 문제는 그대로.
  - 사용자 확인용 출력: `works/out/daily-core-run9.md`.
  - 사용자 판단: 내용 자체가 말이 안 됨(예: Momoko의 활동에 Yoko의 발언이 들어감). 못 씀.
- 2026-10-09 에이전트: 코드를 run 6 상태(`daily-core-v3`, 커밋 `68d0391`)로 되돌림. `tsc`와 `daily-core.check.ts` 통과. v4~v6 코드는 `works/out/daily-core-v4-v6.patch`와 `works/out/daily-core-templates.v6.ts`에 보관.
- 2026-10-09 에이전트: v3에 Slack 멘션 치환만 추가(`daily-core-v3.1`). `<@U…>`를 그날 작성자 목록으로 `@이름`, 모르는 ID는 `@U…`, `<!channel>` 등은 `@channel`. `tsc`, `daily-core.check.ts` 통과. 1회 실행(run 10).
  - 결과: 70.4초, 토큰 입력 9,746 / 출력 12,139, $0.062. 제출 1회, 근거 위반 0. highlights 5 / topics 3 / progress_roadmap 7 / member_activity 11.
  - run 6(113초, $0.097)보다 빠르고 쌈. 사람 줄 71개 중 48개 인용. MillviV3가 topic 문장과 Momoko의 활동에 이름으로 나옴. Codex 문제(Yuki Kato), 10월 모듈 작성(Yuuki Imai), PERF_TUNING-164 문의(Katsuya)도 들어감.
  - 남은 점: 같은 사실이 highlights, progress_roadmap, member_activity에 겹침(v3 그대로). 멤버 활동 11명(Mitsuru 등 빠짐). 1회 실행이라 run 6과의 차이에 모델 변동이 섞였을 수 있음.
  - 사용자 확인용 출력: `works/out/daily-core-run10.md`.

---

## Phase 3. Generation 저장

만들 것

- generation 행 생성(`generation_no = last + 1`, `processing`, `trigger = manual`, `input_source_data_ids`, `schema_version`, `prompt_version`, `pipeline_version`, 모델명).
- Agent 실행 후 merge:
  - meta는 `daily_core_data`에서 가져옴.
  - `evidence_refs`를 원본 항목으로 바꿔 evidence 객체로 만듦.
  - 개수 metrics는 코드로 계산. `context_only` 항목은 세지 않음(활동 수는 `stats_json.in_window` 기준).
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
