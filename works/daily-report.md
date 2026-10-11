# Daily Report 계획

목표: Daily Core(`core_json`)를 사람이 읽는 하루 리포트로 바꾸고, 지금의 메일 경로(`createContents` → `TestAgent` 한 문장)를 이것으로 바꾼다.

```text
daily_core_data.current_generation_no → daily_core_generations.core_json
  → (Phase 1에서 정함) Report Agent: 강조·순서·압축·문체만. 사실은 core item에서만
  → 코드 렌더: subject / markdown / html, 항목마다 근거 링크(evidence.url)
  → (Phase 2에서 정함) daily_reports 저장
  → sendMails → newsletter_editions(발송 기록)
```

규칙

- 각 Phase의 확인 항목을 모두 통과해야 다음 Phase로 간다. 확인 항목은 **에이전트 확인**과 **사용자 확인**으로 나누고, 확인한 방법을 "확인 기록"에 적는다.
- 테스트 데이터: Target `D_G_S開発チーム`, 날짜 `2026-10-09`, 배포본 run 21의 generation 5(`works/out/daily-core-run21.md`). Core는 다시 만들지 않는다(비용, 그리고 리포트 차이가 Core 변동과 섞임).
- 토큰을 아낀다. LLM을 붙이면 Phase마다 1회만 돌리고, 품질 튜닝 반복은 하지 않는다.

정해 둔 것 (기본값. 사용자 확인에서 바꿀 수 있음)

- 독자: 팀 전체가 받는 하루 리포트 1편. 언어는 Target 언어(`core_json.meta.language`). 사람별 리포트는 나중(W41.md: 나중에는 각자 자기 `member_activity`만 확인).
- 입력은 `core_json`만. 원문(`normalized_json`)은 다시 읽지 않는다(`docs/ieum-architecture.md` 8장). projection 테이블도 쓰지 않음(TODO 1-2, 1-3 보류 이유).
- 먼저 코드 렌더(LLM 0회)로 형식을 본다. Core Structurer가 이미 overview·highlights를 내고 항목마다 대상 언어의 title / summary가 있어서, 코드만으로도 읽을 만한 리포트가 될 수 있음. LLM이 필요한지는 그 결과를 보고 Phase 0 사용자 확인에서 정한다.
- LLM을 쓰게 되면: 출력은 자유 마크다운이 아니라 구조(문단마다 근거 `item_keys`). Tool이 키 존재를 검사하고, 근거 링크와 HTML은 코드가 붙인다. Core에서 "모델은 ref를 옮겨 적지 않는다"와 같은 방식. 모델은 "무엇을 강조할지, 순서, 압축, 문체"만(아키텍처 15장).
- 렌더와 Report Agent는 Worker(`flue/src/daily-report.ts`)에 둔다. 아키텍처상 Report 생성은 Cloudflare 쪽이고, Supabase를 읽는 경로(`app.ts`의 `db`)가 이미 있음. LLM을 나중에 붙여도 코드 위치가 안 바뀜.
- HTML은 인라인 스타일의 단순 문자열(의존성 없음). React Email은 `transactional-emails/`에 별도 패키지로만 있고 Worker·앱에 없음. 꾸밈은 나중.
- 메일: 제목 `{target_display_name} Daily Report {core_date}`, `period: daily`. 수신자는 지금처럼 코드에 고정된 테스트 주소 그대로.
- 활동이 없는 날(`quality.status = empty`): 짧은 "활동 없음" 리포트를 보낸다(Phase 0 사용자 결정).

이번에 안 하는 것

- Weekly Report, 사람별 리포트, 웹 화면, Slack 통지 내용 변경(지금처럼 본문 앞 200자 미리보기), Cron 연결(TODO 4-1), 테스트 날짜 고정 제거(TODO 3-2), Core 품질 개선(TODO 3-3).

---

## Phase 0. 형식 — 코드 렌더 (LLM 0회, DB 쓰기 없음)

리포트가 어떤 모양이어야 하는지 먼저 정한다. 렌더 함수는 이후 Phase에서도 그대로 씀.

만들 것

- `renderDailyReport(coreJson)` → `{ subject, markdown, html }` (`flue/src/daily-report.ts`).
  - 순서(초안): 머리(Target, 날짜) → overview → highlights → progress_roadmap → topics → member_activity → 숫자(metrics: Slack 메시지 수, GitHub 항목 수, 활동 인원).
  - 배열 안은 `importance` 높은 순. `status`는 짧은 표시(완료 / 진행 중 / 막힘 / 예정)로, 언어별 문구는 코드 상수.
  - 항목 끝에 근거 링크 `[1] [2]`(`evidence[].url`). 근거가 많은 항목(run 21에 12개)은 앞 몇 개만 보이고 나머지는 개수로.
  - HTML 이스케이프. 비어 있는 배열은 섹션째 생략.
- `daily-report.check.ts`: run 21의 `core_json`을 fixture로 섹션 순서, 정렬, 링크 수, 이스케이프, 빈 배열 생략을 assert.
- 사용자 확인용 출력: `works/out/daily-report-p0.md`, `works/out/daily-report-p0.html`(브라우저로 열어 보기).

에이전트 확인

- [x] `daily-report.check.ts` 통과, `tsc` 오류 없음.
- [x] run 21의 모든 항목(highlights 4 / topics 6 / progress 2 / member 13)이 리포트에 나오고, 링크가 `core_json`의 evidence URL과 같다.
- [x] 길이 기록(글자 수, 메일 한 화면 기준 대략 몇 스크롤).

사용자 확인

- [x] 섹션 순서·길이·표시가 괜찮다. 빼거나 줄일 섹션(예: member 13명 전체를 다 싣는지).
  - 사용자(2026-10-11): 멤버 섹션은 지금처럼 유지(13명 전체, 요약과 근거 링크).
- [x] LLM이 필요한가. 필요하면 무엇을 맡길지(예: 오프닝 문단, 섹션 압축, 흐름 연결, 마무리). 필요 없으면 Phase 1은 건너뛴다.
  - 사용자(2026-10-11): 필요. 섹션 압축과 흐름 연결까지 LLM에 맡긴다. 에이전트는 코드 렌더로 충분하다고 추천했지만 사용자가 LLM 쪽을 고름. Phase 1 진행, LLM 결과를 남겨야 하므로 Phase 2(저장 테이블)도 진행.
- [x] 활동 없는 날을 보낼지.
  - 사용자(2026-10-11): "활동 없음" 짧은 리포트를 보냄.

확인 기록

- 2026-10-11 에이전트: 구현과 확인.
  - 코드: `flue/src/daily-report.ts`(`reportView` → `renderDailyReport`: `{ subject, markdown, html }`, `REPORT_FORMAT_VERSION = daily-report-code-v1`), `daily-report.check.ts`(인라인 데이터로 순서·정렬·링크 상한·URL 거르기·이스케이프·빈 날·언어 대체), `daily-report.run.ts`(저장된 응답 파일 → `.md` / `.html`). `daily-core.check.ts`도 다시 통과, `tsc` 오류 없음. 모델 호출 0.
  - 입력 확인: Supabase REST로 `daily_core_data d36d689e…`의 `current_generation_no = 5`, 그 `core_json`이 `works/out/daily-core-run21.json`의 `coreJson`과 완전히 같음(evidence URL 111개, 빈 URL 0). Postgres MCP는 인증 실패라 REST로 확인.
  - 결과: 25개 항목 모두 나옴. 링크 85개(항목마다 최대 5개 + 나머지 개수)가 markdown과 HTML 양쪽에서 evidence URL과 일치.
  - 길이: markdown 10,262자 / 77줄, HTML 22,174자. 브라우저 폭 390px(휴대폰)에서 3,401px로 약 4화면. 섹션별 높이는 개요 약 230px, 하이라이트 약 650px, 진행 약 220px, 토픽 약 800px, 멤버 약 1,200px(35%), 숫자 약 200px.
  - 정한 것(구현 중)
    - 멤버는 Structurer 순서 그대로. 중요도 순으로 정렬하면 팀 메일에서 사람 순위처럼 읽힘. 이벤트 섹션은 중요도 높은 순.
    - 상태 `unknown`과 멤버(상태 없음)는 표시 안 함. http(s)가 아니거나 중복된 URL은 링크하지 않음.
    - markdown에서 `_`는 이스케이프하지 않음. `D\_G\_S`처럼 보여서 Slack 미리보기·`text_body`에서 지저분했고, 단어 안의 `_`는 강조가 아님.
    - 숫자는 같은 키를 합치고, 출처가 2개 이상이면 괄호로 나눔(Slack 116 = 36 + 21 + 59). 0인 항목은 뺌.
  - 보인 점(사용자 판단용)
    - 멤버 섹션이 길이의 35%이고, 내용이 위 섹션의 반복에 가까움(예: Yuki Kato = 하이라이트 #23163, Keiichi Takamune = 하이라이트 #22506). 근거 링크도 위와 같은 링크가 다시 나옴.
    - 링크 `[1]~[5]`만으로는 Slack인지 GitHub인지 모름.
    - Core 품질 문제가 그대로 보임: overview의 #22540은 어떤 항목에도 없음, 토픽 "インポート関連"과 "着手候補"가 같은 스레드 근거를 나눠 가짐. 리포트가 아니라 Core 쪽 문제(TODO 3-3).
  - 사용자 확인용 출력: `works/out/daily-report-p0.md`, `works/out/daily-report-p0.html`.

---

## Phase 1. Report Agent

Phase 0 사용자 결정: LLM에 섹션 압축과 흐름 연결까지 맡긴다. 멤버 섹션은 지금처럼 유지, 활동 없는 날도 보냄.

정해 둔 것 (기본값. Phase 1 사용자 확인에서 바꿀 수 있음)

- LLM이 쓰는 범위: 오프닝(overview 대신), highlights / progress_roadmap / topics의 압축·묶기·순서·연결 문장, 마무리 한두 문장. 멤버 섹션과 숫자 섹션은 Phase 0 코드 렌더 그대로("지금처럼 유지"). 멤버 문장까지 모델이 다시 쓰면 각자 자기 항목을 확인하는 용도(W41.md)에서 Core와 문장이 달라짐.
- 활동 없는 날(`quality.status = empty`)은 모델을 부르지 않고 Phase 0의 "활동 없음" 렌더로 보냄. 쓸 내용이 없는데 비용만 듦.

만들 것

- Agent `DailyReportWriter`(`flue/src/agents/daily-report-writer.ts`), `thinkingLevel: "low"`, 제출 Tool 1개.
  - 입력: `core_json`에서 evidence·entities·tags를 뺀 것(item_key, title, summary, status, importance, 배열 이름) + overview + metrics. 토큰 절약.
  - 출력(초안): `{ opening, sections: [{ heading, paragraphs: [{ text, item_keys }] }], closing }`. 섹션 구성(제목, 몇 개로 나눌지)도 모델이 정함.
  - Tool 검사: `item_keys`가 highlights / progress_roadmap / topics의 `item_key`에 있음, 문단마다 근거 1개 이상, highlights는 전부 한 번 이상 언급. 압축이 목적이라 나머지 항목은 빠져도 됨(빠진 항목 수는 `validation_json`에 남김).
  - 렌더: Phase 0 함수가 이 구조를 받아 문단마다 근거 링크(그 문단 `item_keys`의 evidence)를 붙이고, 뒤에 멤버·숫자 섹션을 그대로 붙임.
- Worker `POST /report/generate` `{ dailyCoreId, dryRun: true }`: 현재 generation의 `core_json`을 읽어 Agent 실행, 저장 없이 응답(`subject`, `markdown`, `html`, usage, 반려 이유). 현재 generation이 없으면 409.

에이전트 확인

- [ ] 반려 없이 1회 제출(반려 상한은 Core와 같은 `MAX_REJECTIONS`).
- [ ] 시간·토큰·비용 기록. 목표: Core 1회($0.057) 이하.
- [ ] 리포트 문장에 `core_json`에 없는 티켓 번호·사람 이름이 없다(코드로 대조: `#\d+`, people).

사용자 확인

- [ ] Phase 0 코드 렌더와 나란히 보고 나아졌다. 아니면 LLM 없이 간다.

확인 기록

---

## Phase 2. 저장 — `daily_reports` 테이블

LLM을 쓰면 필요(비용이 들고 실행마다 달라서 결과를 남겨야 함). 코드 렌더만이면 리포트는 `core_json`의 순수 함수이고 보낸 HTML은 `newsletter_editions`에 남으므로 건너뛸 수 있었음. Phase 0에서 LLM을 쓰기로 해서 **진행한다**(단, Phase 1 사용자 확인에서 LLM을 접으면 다시 건너뜀).

`newsletter_editions`를 재사용하지 않는 이유: 그건 발송 기록(1 발송 = 1 행)이다. 리포트를 다시 만들거나 형식을 바꿔도 이미 보낸 기록은 그대로여야 하고, 보내지 않은 리포트(미리보기, 재생성)도 남길 수 있어야 함.

만들 것

- 테이블 `daily_reports`(`app/features/daily-core/schema.ts`, drizzle migration, RLS는 `daily_core_generations`와 같게).
  - `report_id`, `daily_core_id`, `workspace_id`, `target_id`, `report_no`(daily core 안에서 증가, unique), `core_generation_no`(어떤 Core로 만들었는지), `report_status`(processing / succeeded / failed), `language`.
  - `subject`, `markdown`, `html`, `agent_output_json`(LLM 구조 출력).
  - `format_version`(렌더), `prompt_version`, `model_provider`, `model_name`, `token_usage_json`, `processing_metrics_json`, `validation_json`, `error_code`, `error_message`, 시각들.
  - 현재 리포트는 "가장 큰 `report_no`의 succeeded"로 읽는다. `daily_core_data`에 포인터 컬럼은 안 만듦(Core 테이블과 엮지 않음). 필요해지면 그때.
- `/report/generate`가 저장까지(`dryRun` 제거). 순서는 Core와 같음: 행 생성(processing) → 생성 → succeeded / failed.

에이전트 확인

- [ ] migration 적용, `database.types.ts` 갱신, `tsc` 오류 없음.
- [ ] 생성 1회 → 행 `succeeded`, `core_generation_no = 5`. 잘못된 입력(현재 generation 없음)으로 409 / failed 경로 확인.

사용자 확인

- [ ] Supabase에서 행을 열어 본다. 컬럼 구성이 괜찮다.

확인 기록

---

## Phase 3. 메일 경로 연결 (`processTarget`)

만들 것

- `processTarget`: 수집 저장 → Worker `/core/generate` → `/report/generate`(Phase 2를 건너뛰었으면 렌더만 하는 `/report/render`) → `sendMails`. `createContents`(TestAgent) 호출을 뺀다.
  - 앱 환경변수: `FLUE_AGENT_URL`(`/agents/test`까지 포함된 주소) 대신 Worker 기본 주소 `FLUE_BASE_URL`. `works/env.md` 갱신.
  - Core 생성이 실패하면 메일을 보내지 않고 run을 에러로 닫는다(지금의 `closeRun`).
  - `sendMails`에 `{ finalContents: markdown, htmlContents: html }`, 제목은 리포트 `subject`, `period: daily`. Slack 통지는 그대로(markdown 앞 200자).
- 확인할 것: 즉시 발송은 클라이언트가 Vercel `POST /api/cron/send-now/run`을 동기로 부름(Railway worker 전환은 아직 주석). Core 42~150초 + 리포트가 Vercel 함수 시간 안에 들어가는지. 넘으면 Worker가 Core 뒤에 리포트까지 이어서 하고 Vercel은 결과만 받는 방식으로 바꾼다.

에이전트 확인

- [ ] 로컬 앱 + 로컬 Worker로 즉시 발송 1회: 메일 도착, `newsletter_editions` 행(`period = daily`, html / text 본문), Core generation 1 증가, (Phase 2를 했으면) `daily_reports` 행.
- [ ] Core 실패 경로(잘못된 모델명 등)에서 메일이 안 나가고 run이 에러로 닫힌다.
- [ ] 전체 소요 시간 기록.

사용자 확인

- [ ] 받은 메일을 Gmail(웹·모바일)에서 열어 본다. 링크가 Slack / GitHub로 열린다.

확인 기록

---

## Phase 4. 배포·정리

만들 것

- Worker 배포, Vercel에 `FLUE_BASE_URL`.
- `TestAgent` 제거(TODO 4-3): `flue/src/agents/test-agent.ts`, `/agents/test` 라우트, `createContents`의 `askTestAgent`. Durable Object 클래스 삭제는 migration `deleted_classes`(Core 분리 Phase 3과 같은 방법).

에이전트 확인

- [ ] 배포본으로 즉시 발송 1회 성공, Cloudflare 로그에 error 없음.
- [ ] `/agents/test`가 404.

사용자 확인

- [ ] 배포본 메일을 받아 본다.

확인 기록
