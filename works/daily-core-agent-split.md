# Daily Core Agent 분리 계획

목표: 단일 Agent(`DailyCore`, `daily-core-v3.2`)를 `02-pipeline-architecture.md`의 3개 역할로 나눈다. v1은 호출 2회.

```text
Agent 입력(지금과 같은 텍스트: 스레드 묶기, 맥락·봇 표시, 멘션 치환)
  → Call 1 CoreInterpreter (Extraction + Interpretation): 원문 → core_items
  → Call 2 CoreStructurer (Structuring): core_items → overview + 4개 배열
  → merge (지금 buildCoreJson 그대로: meta, evidence, metrics, quality)
  → daily_core_generations 저장
```

규칙

- 각 Phase의 확인 항목을 모두 통과해야 다음 Phase로 간다.
- 확인 항목은 **에이전트 확인**과 **사용자 확인**으로 나누고, 확인한 방법을 "확인 기록"에 적는다.
- 테스트 데이터: Target `D_G_S開発チーム`, 날짜 `2026-10-09`(사용자가 기존 Core 데이터를 지움). 모델 실행은 Phase마다 1회(비용). 1회라 모델 변동이 섞일 수 있음을 결과에 적는다.

정해 둔 것 (기본값. 사용자 확인에서 바꿀 수 있음)

- Call 1은 `core_items`만 낸다. `CandidateSignal` 배열은 출력하지 않음. 출력 토큰(대부분 추론)이 시간·비용을 좌우했음(v5: 출력 6.4만 토큰, 363초). signals는 3회 분리 때.
- `core_item_id` = `concept_key`(`03-agent-contracts.md` 미결 1, 2). Agent가 만들고 Tool이 유일성을 검사.
- Call 2는 원문을 보지 않고 `core_items`만 본다(문서의 "raw source 재해석 안 함").
- Call 2의 각 항목은 `evidence_refs` 대신 `core_item_ids`(근거가 된 core item)를 낸다. `evidence_refs`는 코드가 그 core item들의 ref를 합쳐서 만든다. 모델이 ref를 옮겨 적다 틀릴 일이 없고, 중복을 코드로 검사할 수 있음.
  - `member_activity`는 합친 ref 중 **그 사람이 쓴 줄만** 남긴다(코드가 ref별 작성자를 앎). 다른 사람 발언이 멤버 근거에 섞이던 문제(v6) 방지. 남는 게 없으면 Tool 에러.
- 하나의 core item은 highlights / topics / progress_roadmap 중 **한 곳에만** 들어간다(Tool이 검사). `member_activity`는 다른 배열과 같은 core item을 써도 됨.
- 저장 형태는 그대로: `core_json`은 지금과 같은 키, `agent_output_json`은 `{ interpretation, structuring }`. `pipeline_version = flue-two-call-v1`.
- 기존 `DailyCore` Agent는 Phase 2 판단까지 남기고, 분리를 채택하면 지움(코드는 git에 있음).

이번에 안 하는 것

- items / metrics projection(TODO 1-2, 1-3), 3회 분리, 전날 Core 참조(`known_items`), 프롬프트 품질 튜닝 반복(구조가 중복을 줄이는지만 본다).

---

## Phase 0. 기준선

분리 전 결과를 같은 데이터로 한 번 더 만들고, 비교할 숫자를 코드로 뽑는다. 지금까지 중복은 눈으로만 봤음.

만들 것

- `coreStats(output, input)`(`flue/src/daily-core.ts`): 모델 출력과 Agent 입력으로 계산.
  - 배열별 항목 수.
  - 배열 간 중복: 그날 사람이 쓴 ref 중 highlights / topics / progress_roadmap의 2곳 이상에서 인용된 수.
  - 사람 줄 인용: 그날 사람이 쓴 ref(봇·맥락 제외) 중 어디서든 인용된 수 / 전체.
  - `member_activity` 인원 / 입력의 사람 수.
- `validation_json.stats`와 `/core/generate` 응답에 넣음. 이후 Phase도 같은 숫자로 비교.
- 2026-10-09 다시 수집(`collect.run.ts`) → 로컬 Worker로 v3.2 1회 생성.

에이전트 확인

- [x] `daily-core.check.ts`에 `coreStats` assert 추가, 통과. `tsc` 오류 없음.
- [x] 다시 수집한 항목 수가 이전과 같다(128개, Slack 36 / 59 / 21, GitHub 6).
- [x] generation 1 `succeeded`, `validation_json.stats`가 남는다. 시간·토큰·비용과 함께 기록.

사용자 확인

- [ ] 기준선 숫자(특히 중복 수, 사람 줄 인용 수)가 눈으로 본 문제를 잘 나타낸다. 아니면 지표를 고친다.
- [ ] 위 "정해 둔 것"으로 Phase 1에 들어가도 된다.

확인 기록

- 2026-10-10 에이전트: 구현과 확인.
  - 코드: `coreStats`(`flue/src/daily-core.ts`), `/core/generate`가 `validation_json.stats`와 응답 `stats`에 넣음. `daily-core.check.ts` 통과(봇·맥락 ref는 사람 줄에서 빼고, member_activity 인용은 "인용됨"에는 세고 "여러 배열"에는 안 셈). `tsc` 오류 없음.
  - 수집: `collect.run.ts`로 새 `daily_core_data` `1f0c19f6-a9aa-4eab-bbd9-c62f2fe05b0d`, 항목 128개. source 행 `#dev_cs_d1` 39 / `#dev_lead` 60 / `#dev_cs_d3` 23 / `LEAD` 6(Slack은 맥락 부모 3 / 1 / 2 포함, 창 안은 36 / 59 / 21로 이전과 같음). Slack 토큰은 여전히 `.env` 대체 경로.
  - 생성(run 11): 로컬 Worker(어제부터 떠 있던 vite dev, 코드 변경 자동 반영), generation 1 `succeeded` / `ready`, `daily-core-v3.2`, 대화 `instance_01M4J9D6GQAC8T1ZE4Z4JBXX8S`, 근거 위반 0.

    | 항목 | run 11 (기준선) |
    |---|---|
    | 소요 시간 | 67.5초 |
    | 토큰 입력 / 출력 | 9,732 / 18,993 |
    | 비용 | $0.093 |
    | highlights / topics / progress / member | 5 / 4 / 4 / 12 |
    | 사람 줄 인용 | 71개 중 44개 |
    | 2개 이상 배열(member 제외)에 인용된 사람 줄 | 6개 |
    | 근거 ref가 겹치는 항목 쌍(member 제외, 따로 계산) | 5쌍 |
    | 멤버 / 입력의 사람 | 12 / 13 |

  - 겹친 쌍은 대부분 #23189 / #23145 한 덩어리: highlights "#23189 を分離してDB設計レビューへ", topics "レビュー受付時間と子チケット運用の確認", progress "#23145 の関連テーブル削除タイミング見直し"가 서로 ref를 나눠 가짐.
  - 발견: run 10(v3.1)에서 highlights와 progress에 함께 있던 #23163이 이번엔 highlights에만 있음. 제목 기준으로는 배열 간 같은 티켓이 거의 없음. 1회라 모델 변동인지 v3.2(key_points 제거) 영향인지 구분 못 함.
  - 한계: 이 지표는 근거 ref가 같을 때만 중복으로 잡음. 같은 티켓을 다른 줄로 인용하면 안 잡힘. Phase 2에서는 core item 단위로 코드가 직접 막으므로 그쪽이 주 지표가 됨.
  - 사용자 확인용 출력: `works/out/daily-core-run11.md`.

---

## Phase 1. Call 1 — CoreInterpreter (DB에 쓰지 않음)

만들 것

- Agent `CoreInterpreter`(`flue/src/agents/core-interpreter.ts`). 입력은 지금 Agent와 같은 텍스트.
- 출력 스키마(Valibot, 제출 Tool): `overview_candidate.summary`, `core_items[]`
  - `concept_key`(kebab-case, 유일), `title`, `summary`, `importance`(1~5), `confidence`(0~1), `roles`(highlight / topic / progress / member_activity 후보), `status`, `tags`, `classifications`, `entities`, `actors`(type, name), `evidence_refs`, `progress`(선택).
- Tool 검사: 지금 규칙(모르는 ref, 맥락만 인용) + `concept_key` 유일 + member actor 이름이 입력 사람 목록에 있음 + member actor가 있는 항목은 봇·맥락이 아닌 ref를 인용.
- 지시문 핵심: 같은 사건(같은 티켓·안건)은 하나의 core item으로 합친다. 사람이 한 일은 그 사람을 actor로.
- `/core/generate`에 `dryRun: true`: DB에 쓰지 않고 Agent 출력과 stats를 돌려줌. 이 Phase에서는 Call 1까지만 돈다.

에이전트 확인

- [ ] `check.ts`에 Call 1 검사 assert 추가, 통과. `tsc` 오류 없음.
- [ ] 로컬 Worker dry run 1회: 스키마 통과, 근거 위반 0, `concept_key` 중복 0.
- [ ] 시간·토큰·비용, core item 수, 사람 줄 인용 수를 기록(기준선과 비교).

사용자 확인

- [ ] core item 하나가 사건 하나다. 같은 사건이 두 item으로 나뉘거나, 다른 사건이 한 item에 섞이지 않았다.
- [ ] actor가 맞다(남의 발언을 다른 사람의 일로 쓰지 않음).
- [ ] 빠진 일이 기준선보다 많지 않다.

확인 기록

---

## Phase 2. Call 2 — CoreStructurer + 저장 연결

만들 것

- Agent `CoreStructurer`(`flue/src/agents/core-structurer.ts`). 입력은 Call 1 출력 JSON + 사람 목록 + language.
- 출력: 지금 `DailyCoreOutput`에서 항목의 `evidence_refs`를 `core_item_ids`로 바꾼 것.
- Tool 검사: 모르는 `core_item_id`, 한 core item이 highlights / topics / progress_roadmap 중 2곳 이상, `member_activity` title이 사람 목록에 없음, 작성자 필터 후 근거가 빈 멤버 항목.
- 코드: `core_item_ids` → `evidence_refs` 변환(멤버는 본인 줄만) → 기존 `buildCoreJson`.
- `/core/generate`가 Call 1 → Call 2 → merge → 저장. 버전 기록, `agent_output_json = { interpretation, structuring }`, 토큰은 두 호출 합계와 각각.
- `daily_core_items.item_type` 대응 메모(projection용): highlights → `highlight`, topics → `topic`, progress_roadmap → `progress_roadmap`, member_activity → `member_activity`. overview는 item이 아님(`core_json`에만).

에이전트 확인

- [ ] `check.ts`에 Call 2 검사·변환 assert 추가, 통과. `tsc` 오류 없음.
- [ ] 로컬 1회: generation `succeeded`, `core_json`이 기존과 같은 키, evidence 전부 원본 항목과 일치.
- [ ] stats: 배열 간 중복이 기준선보다 줄었다. 시간·비용을 기준선과 나란히 기록.

사용자 확인

- [ ] 결과가 기준선보다 낫다(중복, 정확성, 빠진 일). 분리를 채택할지 판단. 채택하지 않으면 원인을 적고 Phase 1 또는 2를 고친다.
- [ ] 시간·비용이 받아들일 만하다.

확인 기록

---

## Phase 3. 정리 + 배포본

만들 것

- 채택했으면 기존 `DailyCore` Agent와 그 지시문 제거, `wrangler.jsonc` Durable Object migration 정리.
- 배포 → 배포본으로 같은 날짜 1회.

에이전트 확인

- [ ] 배포본 결과가 Phase 2와 같은 형태로 DB에 남는다.
- [ ] Cloudflare 로그에 두 Agent 실행이 error 없이 남는다.

사용자 확인

- [ ] 마무리. `W41_TODO.md` 1-1 체크.

확인 기록
