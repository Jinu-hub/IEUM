# Flue 에이전트 품질 개선 컨텍스트

확인일: 2026-11-17. 기준 커밋: `defd053`(문서 작성 전 HEAD).

이 문서는 다음 품질 작업을 빠르게 시작하기 위한 코드 지도와 평가 지침이다. 현재 구현과 앞으로의 평가 제안을 구분한다. 배포본, 실제 프롬프트 DB, 최근 모델 출력의 품질은 이번 조사에서 검증하지 않았다. 환경변수의 값은 읽거나 복사하지 않았다.

## 1. 제품과 저장소

팀원과 관리자가 하루의 진행·결정·요청·막힌 일·다음 행동을 파악하도록 돕는다. Daily Core는 재사용할 하루의 기억이고, Report는 이를 읽기 좋은 메일로 표현한 결과다. Core의 정보 보존과 Report의 읽기 쉬움은 별도로 평가한다.

| 영역 | 주요 위치 | 품질 작업과의 관계 |
|---|---|---|
| 웹 앱 | `app/routes.ts`, `app/features/` | React Router 7·React 19. 인증, 설정, 대상/소스, 결제, 발송 내역, 관리자 로그 |
| 수집 | `app/core/integrations/{slack,github}/`, `app/features/cron/api/collect-sources.ts` | 원문이 처음부터 없으면 프롬프트로 복구할 수 없음 |
| 하루 정규화·저장 | `app/features/daily-core/{collect,normalize,schema}.ts`, `db/` | 대상의 날짜·시간대, 소스별 원문과 정규화 데이터 |
| AI Worker | `flue/src/app.ts`, `agents/` | Cloudflare Worker + Hono + Flue. 호출 순서는 코드가 결정 |
| 출력 계약·보정 | `flue/src/daily-core.ts`, `daily-report.ts`, `weekly-*.ts`, `tagging.ts`, `taxonomy.ts` | Valibot 스키마, 제출 검사, 보정, 렌더, 주간 집계 |
| DB | `app/features/*/schema.ts`, `sql/migrations/`, `database.types.ts` | Supabase/Postgres + Drizzle. Worker는 Supabase REST 사용 |
| 발송 | `app/features/cron/api/target-processing.ts`, `send-mails.tsx`, `send_notifications.tsx` | Core/Report 생성 이후 Resend 메일·Slack 알림 |
| 다국어 | `app/locales/{ko,en,ja}.ts`, Core의 `language` | UI 언어와 보고서 대상 언어를 구분. Agent에는 Core 언어가 전달됨 |
| 과거 설계·결과 | `docs/ieum-architecture.md`, `app/features/daily-core/{dev,docs,contracts}/`, `sample/`, `output/` | 설계·과거 뉴스레터 자료. 현재 Agent 계약은 실제 Worker 스키마에서 확인 |
| 기록·실험 | `works/`, 로컬 `works/out/` | 결정 이유, 실패 사례, 비교 산출물 |

`transactional-emails/`는 가입·인증 메일이다. Daily Report HTML은 `flue/src/daily-report.ts`가 만든다. 루트의 `app/core/config/agents*.yaml`, `tasks*.yaml`을 현재 Flue 프롬프트로 취급하지 않는다. 루트 `worker:*` 스크립트가 가리키는 `workers/`는 이번 트리에서 확인되지 않았으므로 현재 Worker 실행에 사용하지 않는다.

## 2. 실제 데이터 흐름

```text
app/features/cron/api/target-processing.ts: processTarget
  → collectTargetSources → saveDailyCoreCollection
  → daily_core_data + daily_core_source_data.normalized_json
  → app/features/daily-core/flue.ts: generateDailyReport
      → POST /core/generate
          buildAgentInput
          [SignalExtractor: targets.pipeline_options.signals === true일 때]
          CoreInterpreter
          CoreStructurer + CoreTagger (동시 실행)
          assembleCore → core_json + items/metrics projection
      → POST /report/generate
          현재 generation의 core_json → DailyReportWriter
          → DailyReportFinalizer → 코드 렌더 → daily_reports
  → send-mails.tsx: sendMails → newsletter_editions / Resend
  → send_notifications.tsx: sendSlackNotification

현재 성공 generation의 daily_core_items / daily_core_metrics
  → weekly-input.ts → WeeklyMerge → WeeklyWriter + WeeklyTopics의 결과
  → weekly-report.ts 렌더 (기존 러너는 merge → write → topics 순서)
```

- 하루는 Target × 현지 날짜. `normalize.ts: resolveDailyWindow`는 UTC `[start, end)` 창을 만든다. 그날 답글을 이해하는 데 필요한 이전 스레드 부모는 context로 보존한다.
- `daily-core.ts: buildAgentInput`은 스레드, 작성자 표, 사람 목록, 근거 ref를 만든다. 독립 봇 알림은 제외하되 답글이 달린 부모는 유지한다. ref는 해당 입력 안의 식별자이므로 다른 수집본과 섞지 않는다.
- Core 성공 시 `daily_core_data.current_generation_no` 갱신. 실패하면 이전 current 유지. 주간은 current이면서 성공한 generation의 projection을 읽는다.
- Report는 `daily_reports.core_generation_no`로 원본 Core를 연결한다. `quality.status === "empty"`인 Report는 모델 호출 없이 렌더한다. 이 특례를 Core 전체가 모델을 생략한다는 뜻으로 확대하지 않는다.
- 주간 생성은 DB의 입력을 읽지만 주간 결과 저장 테이블·메일 발송은 아직 없다.
- 코드상 즉시 발송 날짜가 `DAILY_CORE_TEST_DATE = "2026-11-16"`으로 고정되어 있다. 실제 오늘 날짜라고 가정하지 않는다. 자동 Cron 연결, 앱 배포 완료 여부는 최신 작업 기록과 배포 상태를 재확인한다.

## 3. 에이전트별 책임과 평가할 것

Agent 파일 경로는 `flue/src/agents/` 기준이다. 아래 평가 항목은 개선 작업용 기준이며, 모두 자동으로 검증되고 있다는 뜻은 아니다.

| Agent / 파일 | 입력 → 출력 | 의미 품질의 핵심 |
|---|---|---|
| SignalExtractor / `core/signal-extractor.ts` | 원문 + shared identifiers → refs/kind/subject/fact/quote | 한 줄의 여러 업무를 분리했는가, 같은 업무의 여러 소스를 연결했는가, 시간·조건·요청 대상을 보존했는가, 간접 호칭을 근거대로 해석했는가 |
| CoreInterpreter / `core/core-interpreter.ts` | 원문 또는 signals → `Interpretation` | 업무 단위의 경계, 누락·중복, 최신 상태, 중요도, 실제 기여자, 명시된 next_step, 하루 overview |
| CoreStructurer / `core/core-structurer.ts` | core items + people → `Structuring` | highlights/topics/progress 배치, 중요 내용 보존, 요약의 왜곡·반복, overview 우선순위 |
| CoreTagger / `core/core-tagger.ts` | taxonomy + item 제목·요약 → `Tagging` | primary의 적합성, 유용한 tags/entities, 미분류 비율, 주간 토픽으로 전달되는 분류 품질 |
| DailyReportWriter / `report/daily-report-writer.ts` | Core의 H/P/T item + owners/next_steps/quotes → `ReportDraft` | 핵심 요점, headline과 본문의 역할, 중요한 요청·다음 단계 보존, 중복, 근거 없는 의미 확장, 검색 가능한 식별자 |
| DailyReportFinalizer / `report/daily-report-finalizer.ts` | 같은 item + Writer 초안 → `ReportDraft` | 합치기·나누기의 타당성, 원래 사실·조건 보존, 자연스러움, 반복 감소, 길이, Writer 대비 실제 개선 |
| WeeklyMerge / `report/weekly-merge.ts` | 일별 highlights → id 그룹 | 여러 날 이어진 같은 업무를 묶되 같은 티켓의 다른 일을 잘못 합치지 않는가 |
| WeeklyWriter / `report/weekly-writer.ts` | 선택된 weeklyMovements → opening/items/closing | 주간의 변화와 최종 상태를 설명하는가, 일별 문장 나열에 그치지 않는가 |
| WeeklyTopics / `report/weekly-topics.ts` | topic/progress를 분류한 입력 → 분류별 문장+ids | bugfix/feature/coordination/investigation/other별 구체적인 요약, 억지 연결·빈말·과도한 누락 여부 |

`TestAgent`는 시험용이며 제품 품질 평가 대상에서 제외한다.

### 모델 출력 뒤에 코드가 바꾸는 부분

- Interpreter: `normalizeConceptKeys`, `dropUnwrittenActors`. 멤버 actor가 인용한 줄의 작성자가 아니면 제거한다. `interpretationReview`는 미인용 사람 줄·중복 후보를 되묻고 `Revision`을 적용한다. 수정이 오지 않아도 수락한 첫 결과는 남는다.
- Structurer: 제출의 `member_activity`는 비운다. `assembleCore`가 `placeLeftovers` → `refineHighlights` → `scopeMemberActivity` → `resolveStructuring` → `buildCoreJson` 순서로 처리한다.
- highlights는 중요도 4 이상, 최대 5개. 나머지는 다른 섹션으로 이동한다. 멤버 활동은 실제 근거 작성자인 멤버의 업무 제목으로 재구성한다. 멤버 문장이 어색하면 Structurer의 멤버 프롬프트보다 이 코드와 Interpreter 제목을 확인한다.
- Interpreter 중요도는 1~5, Core/Report에서는 0~1로 전달된다. 서로 다른 단계 점수를 그대로 비교하지 않는다.
- Tagger의 잘못된 taxonomy 값·모르는 key는 `indexTagging`에서 정리된다. 사람 entity는 코드가 actor에서 만든다. 태그는 `core_json`이 아니라 `daily_core_items`에 저장된다.
- Writer/Finalizer: `withoutStrayQuotes`가 highlights 이외 quote_ids를 비운다. 코드가 인용 원문·근거 링크·아이콘·멤버·활동 지표를 렌더한다.

## 4. 프롬프트와 모델 실험의 재현 조건

실제 설정은 `flue/src/prompts.ts: resolvePrompts`, `promptData`에서 결정된다.

1. 프롬프트 DB의 `service_key=ieum`, Agent key, `PROMPT_ENVIRONMENT` 행을 찾는다.
2. 해당 환경의 유효 template이 없으면 `default`, 그것도 없으면 코드 기본값을 사용한다. 조회 실패도 코드 기본값으로 돌아간다.
3. DB의 template/provider/model/thinking_level/version이 반영된다. 요청 body의 `model`은 해당 요청의 Agent 모델들을 덮어쓴다. 추론 강도까지 덮어쓰는 옵션은 아니다.

2026-11-17 코드 기본값: Interpreter와 주간 3종은 `openai/gpt-6-sol`, Extractor/Structurer/Tagger/Daily Writer/Finalizer는 `openai/gpt-6-luna`. 모두 `low`. 이는 코드에 적힌 값이며 실제 배포 실행 모델의 확인 결과는 아니다.

- Agent 지시문과 pipeline/report format 버전은 11월 17일 `*-v1.0`으로 정리됐다. 예전 산출물의 v1/v3/v12와 지금 버전명이 같거나 다르다는 이유만으로 내용을 추정하지 않는다. 커밋·실제 지시문도 기록한다.
- signals 모드에서는 `splitInterpreterInstructions`가 Interpreter 본문의 `RAW_INPUT` 문단을 정확한 문자열로 치환한다. 코드나 DB 지시문의 해당 문단을 바꾸면 이 함수도 함께 검토한다.
- `works/2026/W47_TODO.md`에는 실험 후 프롬프트 DB 연결 원복 과제가 있다. 현재 연결 여부는 미확인이다. 코드 지시문을 수정한 것만으로 적용되었다고 결론내리지 않는다.
- `model`, `thinkingLevel`, 프롬프트 내용/버전, raw/signals 모드, 고정 입력, 코드 커밋, 생성 식별자를 실험 메타데이터로 남긴다. 저장된 버전 문자열만으로 모든 실행 설정을 재현할 수 있다고 가정하지 않는다.

## 5. 관찰 지점과 성공 판정의 한계

| 위치 | 확인할 데이터 |
|---|---|
| `daily_core_generations.agent_output_json` | signals(선택), interpretation, 원래 structuring, tagging, dropped_actors |
| `daily_core_generations.core_json` | 코드 보정 후 최종 Core |
| `daily_core_generations.validation_json` | `stats`, `evidence_problems`, **`projection.error`** |
| `processing_metrics_json.calls` | 호출별 model, elapsed_ms, tool_calls, rejections; tagging 실패의 error |
| `token_usage_json` | 전체·호출별 사용량 |
| `daily_reports.agent_output_json` | 최종 draft, Finalizer 성공 시 writer_draft |
| `daily_reports.validation_json.stats` | unused, items_used, revision, finalizer_error |
| `/core/agent` 응답 | 실제 입력, promptVersion/model/thinkingLevel, 출력, review, droppedActors, usage/metrics |

기존 `flue/README.md`는 projection 오류를 `validation_json.stats.projection.error`라고 설명하지만 현재 `app.ts`의 저장 경로는 **`validation_json.projection.error`**다. 코드 경로를 따른다.

- Tagger 실패와 projection 실패는 Core 전체를 실패시키지 않는다. 일간 Core는 정상처럼 보여도 주간 분류·입력이 부족할 수 있다.
- Finalizer 실패 시 Report는 Writer 초안으로 성공할 수 있다. `finalizer_error`/응답 `finalizerError`를 따로 확인한다.
- `MAX_REJECTIONS=2`: 스키마 실패를 포함한 반려가 상한에 닿으면 호출을 중단한다. 모델 평가에는 성공률·반려율·수정 비용도 포함한다.
- ref/item_id가 존재해도 문장이 그 근거로부터 도출되는지는 보장하지 않는다. Finalizer의 coverage 검사도 **ID 유지**를 검사하며, 조건·기한·의미 유지까지 검사하지 않는다.
- `human_refs_cited / human_refs`는 줄의 참조율이다. 한 줄에 여러 업무가 있거나 인사말이 섞이면 업무 보존율과 다르다. 근거를 붙이기만 하고 내용을 누락한 경우도 따로 읽어야 한다.
- `human_refs_in_multiple_sections`는 중복 검토 후보이지 확정 오류가 아니다. 여러 업무를 담은 한 메시지가 여러 섹션을 뒷받침할 수 있다.
- `unplaced_core_items`는 코드가 보충 배치한 항목, `demoted_highlights`는 코드가 강등한 항목이다. 최종 산출물만 보면 모델의 배치 실패가 가려질 수 있다.
- 일간 티켓 검사는 `/#\d{3,}/g`에 의존한다. `#77`, `No.12` 등 모든 식별자 변형을 잡는 일반 검증이 아니다.
- 일간 Writer는 작은 progress/topic을 생략할 수 있다. 따라서 Interpreter의 완전성 기준과 Report의 선정 기준을 분리한다.
- 주간 `active_member_count`는 일별 인원을 단순 합산하지 않는다. `weekly-input.ts`의 `unsummed`와 rollup 규칙을 따른다.

## 6. 결과 파일과 실행 방법

기존 로컬 자료 위치(내용 전체를 이번에 평가한 것은 아님):

- `works/out/core-agents/`: 현재 단일 Agent 러너 결과.
- `works/out/flue-runs/<YYYYMMDD>/<n>/`: 앱 개발 모드의 전체 실행 저장본. `run.json`, `0.input.txt`, 선택 `1.extractor.json`, `2.interpreter.json`, `3.structurer.json`, `4.core.json`, 선택 `5.writer.json`, `6.report.json`, `7.report.md`.
- 위 앱 저장본에는 tagging 원출력·전체 validation/metrics·메일 HTML이 모두 들어 있지 않다. 필요하면 API 응답/DB 행도 확보한다.
- `works/out/interpreter-test-2610/`, `division-test-2610/`, `261011/`: 과거 비교 결과.
- `works/out/weekly-*`, `w-report.*`: 과거 주간 출력.

`works/out/`은 `.gitignore`의 `out` 규칙에 의해 제외된다. 새 체크아웃에는 없을 수 있다. 공유할 회귀 fixture는 필요한 데이터만 익명화해서 별도로 명시적으로 관리한다.

```sh
# 저장소 루트: 모델/네트워크 호출 없는 규칙 검사 예시
node --import tsx app/features/daily-core/normalize.check.ts
node --import tsx flue/src/daily-core.check.ts
node --import tsx flue/src/daily-report.check.ts
node --import tsx flue/src/weekly-input.check.ts
node --import tsx flue/src/weekly-merge.check.ts
node --import tsx flue/src/weekly-writer.check.ts
node --import tsx flue/src/weekly-topics.check.ts
node --import tsx flue/src/weekly-report.check.ts

# 타입 검사 (변경 영역에 따라 선택)
npm run typecheck
npx tsc --noEmit -p flue/tsconfig.json

# 아래는 flue/ 디렉터리에서 실행. Worker, DB 읽기, 모델 호출 필요
npm run dev
npx tsx src/core-agent.run.ts --agent interpreter --label baseline --id <dailyCoreId> --runs 3
npx tsx src/core-agent.run.ts --agent extractor --label signals --id <dailyCoreId> --runs 3
npx tsx src/core-agent.run.ts --agent interpreter --label from-signals --from <extractor-result.json> --runs 3
npx tsx src/core-agent.run.ts --agent structurer --label baseline --from <interpreter-result.json> --runs 3

# 저장된 입력의 코드 렌더만 실행 (모델 호출 없음)
npx tsx src/daily-report.run.ts <core.json> <output-prefix> [report.json]
```

- 단일 러너는 `.dev.vars`를 로드하고 `FLUE_BASE_URL` 또는 localhost:8787을 사용한다. `--id` 생략 시 특정 2026-10-09 샘플로 고정되므로 평가에서는 명시한다.
- `--from`은 Interpreter에 signals, Structurer에 interpretation을 넘긴다. 입력 원문은 서버가 해당 날짜 DB에서 다시 읽는다. DB 재수집으로 원문이 바뀌지 않았는지 비교한다.
- `/core/agent`에는 Tagger 모드가 없다. target의 signals 설정도 자동 적용하지 않으며, 전달한 signals 유무로 Interpreter 입력이 결정된다.
- 러너는 성공 결과 JSON/MD를 저장한다. 실패는 콘솔에 남기고 다음 실행으로 진행하므로 파일 개수만으로 시도 횟수·성공률을 세지 않는다.
- Writer/Finalizer 비교에 `/report/generate`의 `finalize:false`나 `draft`를 쓸 수 있지만 **DB에 새 report가 저장된다**. 또한 호출 시점 current Core를 읽으므로 generation을 고정·확인해야 한다.
- 루트 `npm run build`는 prebuild에서 DB typegen을 실행할 수 있다. 단순 품질 검증을 위해 전체 빌드를 첫 명령으로 쓰지 않는다.

## 7. 다음 개선 작업의 평가 절차 (제안)

1. 실패 한 건을 입력 근거와 함께 특정한다. 예: “질문의 답변이 별도 업무로 분리됨”, “완료된 요청을 다음 단계로 씀”, “Writer가 기한을 누락함”.
2. 처음 정보가 달라진 단계를 찾는다. 수집 누락 → 정규화/입력, 사건 경계·사람·상태 → Extractor/Interpreter, 섹션/중요도 보정 → Structurer/assembleCore, 주간 분류 → Tagger, 문장 → Writer/Finalizer.
3. 입력과 실제 프롬프트/모델 설정을 고정하고 baseline을 저장한다. 상위 Agent 출력을 재사용해 하위 Agent만 비교한다.
4. 한 번에 한 가설을 바꾼다. 프롬프트·모델·추론 강도·입력 구조를 동시에 바꾸지 않는다. 동일 조건 3회 정도로 출력 변동도 본다.
5. 과거에 쓰던 2026-10-09 + 성격이 다른 평일 3일로 평가 세트를 구성한다(기존 TODO 방향). 다중 소스·멀티업무 메시지·맥락 부모·완료/보류 혼재 사례를 포함한다. 빈 날은 별도 코드 회귀 사례로 둔다.
6. 원문에 없는 사실/사람/기한/상태는 중대 오류로 기록한다. 중요한 업무·요청·조건 누락, 잘못된 합치기/나누기, 문장 중복·가독성을 구분해 판정한다. 참조율 상승만으로 개선 판정하지 않는다.
7. 최종 Report까지 영향과 회귀를 확인하고 성공률·반려·시간·토큰/비용을 함께 비교한다. 채택 이유와 남은 문제를 현재 주차 기록에 남긴다.

실험 기록 최소 형식:

```text
실험명 / 날짜 / 코드 커밋:
대상 Agent / 수정 가설:
입력 파일·해시 / dailyCoreId / generation / 언어·시간대:
실제 지시문·버전·출처(code 또는 DB 환경) / model / thinkingLevel / raw 또는 signals:
상위 단계 고정 출력 / 변경 전후 결과 경로:
시도·성공·반려·fallback 횟수 / 시간 / 토큰·비용:
문제별 근거 ref 또는 item id / 기대 사실 / 실제 문장 / 중대도:
개선·회귀 / 채택 여부·이유 / 남은 문제:
```

이 평가 러너·정답 세트·점수 체계가 이미 구현되어 있다는 뜻은 아니다. 현재 있는 것은 규칙 assert 검사와 실행 산출물, 일부 통계다. TODO의 `evaluate: true`를 현재 지원 API로 가정하지 않는다.

문서 작성 시 위의 규칙 검사 8개를 실행해 모두 통과했다. 타입 검사, 실제 모델 호출, DB/배포본 검증, 메일 발송은 실행하지 않았다.

## 8. 현재 기록된 후속 과제

`works/2026/W47_TODO.md` 기준: 프롬프트 DB 연결/버전 확인, Interpreter의 overview 누락·묶기·제목/key, Extractor 비교·간접 호칭, 입력의 빈 GitHub Slack 앱 본문, 일간 Writer의 생략·티켓 표기·섹션 겹침, Finalizer 편집 효과, 주간 문장 품질, 평가 세트 후 모델 비교가 남아 있다.

기존 개선을 되돌리지 않도록 기억할 것: 멤버 활동은 코드가 소유 업무 제목으로 생성하며, highlights 밖 quote는 제거 후 수락하고, 첫 제출 전 `revise_interpretation`의 유효 upsert는 첫 제출로 살린다. 반려로 전체 생성을 잃는 문제를 줄이려는 변경이었다.

컨텍스트 갱신 시 코드 경로·출력 계약·설정 우선순위·새 평가 방법을 이 문서에 반영하고, 개별 실험의 긴 원문과 과거 경과는 `works/`에 남긴다.
