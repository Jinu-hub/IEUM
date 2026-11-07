# Weekly Report 계획

목표: 한 주의 Daily Core를 사람이 읽는 주간 리포트로 만든다. 데일리 다섯 통의 합본이 아니라, 요점화된 하루 하이라이트를 한 주로 다시 묶는다.

```text
daily_core_items (item_type = highlight) + daily_core_metrics
  → weeklyInput (Phase 1)
  → 코드 렌더: 헤더, 지표 합계, 날짜별 주목 (Phase 2, LLM 0)
  → 병합 에이전트 1단: 같은 작업을 (날짜, item_key)로 묶음 (Phase 3)
  → 코드 렌더: 이번 주의 움직임, 아직 열린 것, 날짜별은 접기 (Phase 4)
```

규칙

- 각 Phase의 확인 항목을 모두 통과해야 다음 Phase로 간다. 확인은 **에이전트 확인**과 **사용자 확인**으로 나누고, 확인한 방법을 "확인 기록"에 적는다.
- LLM은 Phase 3에서 1회. 그 전에 코드만으로 한 주 재료를 본다.
- 렌더는 Worker(`flue/src/`). 조회는 데일리와 같이 `app.ts`의 `db`.

정해 둔 것 (2026-11-07. 결과를 보고 바꾼다)

- 독자: 그 주 데일리를 안 봤거나, 한 주의 결만 보는 사람. 언어는 Target 언어.
- 입력은 `daily_core_items`의 highlight와 `daily_core_metrics`만. `core_json` 전체는 읽지 않는다. 개요 문장, 다음 초점, 인용은 거기 없으므로 v1에 없다.
- 읽는 순서: 헤더(타깃, 코어가 있는 날짜 범위) → 이번 주 지표(데일리와 같은 6키 합산) → 이번 주의 움직임 → 아직 열린 것 → 날짜별 주목(기본 접힘).
- 이번 주의 움직임: 병합된 highlight. 제목, 주의 마지막 상태, 등장한 날짜. 문장은 그 주의 마지막 날 summary. 상한 7, 중요도는 그 주 최댓값.
- 아직 열린 것: 본문에 올라온 것 중 마지막 상태가 진행 중·막힘·예정. 문장 생성 없음.
- 진행·논의·멤버·그 밖의 움직임·주간 개요 문단은 v1에 넣지 않는다. highlight가 한 번도 안 된 진행 항목을 「아직 열린 것」에 넣을지는 Phase 4를 본 뒤에 정한다.

이번에 안 하는 것

- 메일 발송, Cron, 주간 리포트 저장 테이블, 웹 화면, Writer(문단 생성).

---

## Phase 1. 입력 (`weeklyInput`)

한 주에 뭐가 있는지 먼저 본다. 렌더 없음, DB 쓰기 없음.

만들 것

- target + 날짜 범위 → 날마다 현재 성공 generation의 highlight 행과 metrics 행.
- 범위 안에서 코어가 없는 날을 구분한다.

에이전트 확인

- [x] highlight만 오고, 날마다 개수가 Core 상한(5) 이하다.
- [x] metrics 키가 데일리 6개 안에서 합산된다.
- [x] 코어가 없는 날이 빠졌는지 표시된다.

사용자 확인

- [x] 어느 타깃의 어느 주로 Phase 2를 볼지. `D_G_S開発チーム`, 2026-11-02~11-08 (2026-11-07).

확인 기록

- 2026-11-07 에이전트: `weekly-input.check.ts` 통과. 실측은 `weekly-input.run.ts`로 `D_G_S開発チーム`, 2026-11-02~11-08.
  - highlight만. 11/02·04·05·06은 각 5개이고 `core_json.highlights` 길이와 같다. 같은 세대의 topic·progress·member 행은 빠졌다. 상한 5를 넘는 날 없음.
  - 합산은 rollup `sum`만: Slack 557, 커밋 43, PR 6. 이슈 생성·종료 행은 이 주에 없음. `active_member_count`는 rollup `none`이라 날짜별(10, 1, 14, 11, 12)로만 두고 더하지 않음. 사람 수가 날마다 겹친다. 6개 밖 키 없음. 날별 합이 `core_json.metrics`와 같다.
  - 코어 없음: 11/07, 11/08은 `core: null`. 11/03은 성공 세대가 있으나 highlight 0(core_json도 0, Slack 1, topic 1). 없는 날과 다르다.
  - 같은 타깃의 10/09~10/20은 현재 세대의 highlight 행이 0이다. items가 그 뒤에 생겼을 수 있어, 그 주로 Phase 2를 보면 재료가 비어 보인다.
  - 사용자: 11/03은 휴일, 11/07·11/08은 주말이라 데이터가 없다. 조회상 11/03은 코어가 있고 highlight 0(Slack 1은 주 합계에 포함), 주말은 코어 행이 없다.

---

## Phase 2. 코드 렌더 (병합 전, LLM 0)

재료가 읽히는지 본다. 「이번 주의 움직임」과 「아직 열린 것」은 아직 없다.

만들 것

- 헤더, 지표 합계, 날짜별 주목(확인용으로 펼침). 항목은 그날 title / summary / status.
- 사용자 확인용 출력: `works/out/weekly-report-p2.md`, `works/out/weekly-report-p2.html`.

에이전트 확인

- [x] Phase 1의 highlight가 날짜별로 빠짐없이 나온다.
- [x] 지표 합이 그날 metrics의 합과 같다.

사용자 확인

- [x] 이 재료로 주간을 만들 수 있는지. 상한 7, 날짜별 접기가 맞는지. 사용자(2026-11-07): 이 재료로 Phase 3 진행. 상한 7과 접기는 Phase 4에서 본다.

확인 기록

- 2026-11-07 에이전트: `weekly-report.check.ts` 통과. `weekly-report.run.ts`가 11/02~11/08을 `works/out/weekly-report-p2.md`·`.html`에 씀. `weeklyReportProblems` 없음.
  - highlight 20 = 11/02·04·05·06 각 5. 11/03은 「注目の動きはありません」, 11/07·11/08은 「この日のコアはありません」.
  - 지표는 Phase 1과 같음. Slack 557, 커밋 43, PR 6. 활동 멤버는 날짜별.

---

## Phase 3. 병합 에이전트 1단

날짜를 가로지르는 같은 작업을 묶는다. 렌더 문장은 쓰지 않는다.

만들 것

- 입력은 Phase 1의 highlight(날짜, item_key, title, summary, status).
- 출력은 묶음. 각 묶음은 `(날짜, item_key)` 인용만.
- 코드 검사: 없는 인용, 한 항목이 두 묶음에 들어감, highlight가 누락됨.

에이전트 확인

- [x] 검사가 통과한다. LLM은 이 Phase에서 1회.

사용자 확인

- [ ] 묶음이 같은 작업인지. 잘못 묶이거나 빠지면 지시를 고치고, 재실행은 사용자가 시킬 때만.

확인 기록

- 2026-11-07 에이전트: `weekly-merge.check.ts` 통과. `/weekly/merge` 1회, 반려 0, 3초, $0.0006. `weekly-merge-v1`. 출력 `works/out/weekly-merge-p3.md`.
  - highlight 20이 16묶음에 한 번씩. 없는 id, 중복, 누락 없음.
  - 2개 이상인 묶음 3개: Millvi 자막(11/02·11/05), 修正依頼(11/02·11/04·11/05), ローソン移行(11/04·11/06). 나머지는 하루짜리.

---

## Phase 4. 본문 자리

Phase 3의 묶음을 읽는 자리에 놓는다. 문장 생성 없음.

만들 것

- 이번 주의 움직임: 상한 7, 그 주 중요도 최댓값 순. 제목, 마지막 상태, 등장 날짜, 마지막 날 summary.
- 아직 열린 것: 그 7개 중 마지막 상태가 진행 중·막힘·예정인 것. 제목과 상태만.
- 날짜별 주목은 접기.
- 출력: `works/out/weekly-report-p4.md`, `works/out/weekly-report-p4.html`.

에이전트 확인

- [ ] 본문 항목이 Phase 3 묶음이고, 상한 7을 넘지 않는다.
- [ ] 날짜별 목록은 Phase 2와 같은 highlight다.

사용자 확인

- [ ] 다섯 자리(헤더, 지표, 이번 주, 아직 열린 것, 날짜별)로 한 주가 읽히는지.
- [ ] highlight가 안 된 진행 항목을 열림에 넣을지.

확인 기록
