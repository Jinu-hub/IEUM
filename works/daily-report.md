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

- Weekly Report, 사람별 리포트, 웹 화면, Slack 통지 내용 변경(지금처럼 본문 앞 200자 미리보기), Cron 연결(TODO 4-1), 테스트 날짜 고정 제거(TODO 3-2), Core 품질 개선(TODO 3-3), 메일 HTML 디자인 고도화(TODO 2, 사용자 2026-10-11).

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
  - 입력: `core_json`의 highlights / progress_roadmap / topics(title, summary, status, importance, 배열 이름) + overview. evidence·entities·tags·멤버는 뺌. 항목은 짧은 id(`H1`, `P1`, `T1`, 배열 안 중요도 순)로 줌: `item_key`는 배열 안에서만 유일해서 배열끼리 겹칠 수 있음.
  - 출력(v3, 지금): `{ opening, points: [{ text, item_ids }] (1~3개), entries: [{ section, headline, text, item_ids }], closing }`. 섹션 틀(하이라이트 → 진행·예정 → 논의·조정 → 다음 초점)은 코드가 고정하고, 모델은 섹션마다 "결과를 말하는 한 줄 제목 + 1~2문장"을 씀. `points`는 개요 아래 "今日のポイント" 상자.
    - 경과: v1은 섹션 안에 문단을 넣는 중첩 구조 → run p1-1에서 반려 2회로 실패. v2는 `paragraphs: [{ heading, text, item_ids }]`(모델이 주제 제목을 짓고 같은 heading을 코드가 묶음) → 성공했지만 주제 제목만으로는 무엇이 핵심인지 안 보이고 묶기 실수가 있었음. 사용자가 Finalizer 전에 섹션 강조를 먼저 하자고 해서 v3(`sample/merged.md`를 참고, 그대로 따르지는 않음).
  - Tool 검사: `item_ids`가 입력에 있음(points 포함), 근거 1개 이상과 points 1~3개(스키마), entry마다 자기 `section`의 항목을 하나 이상 인용(다른 섹션 항목을 같이 묶는 건 허용), highlights는 전부 entries에서 인용(points만으로는 안 됨), 본문의 `#숫자`가 Core 문장에 있는 번호. 나머지 항목은 빠져도 됨(`stats.unused`).
  - 렌더: 섹션 제목·이모지, 상태 아이콘(✅ 완료 / 🚧 진행 중 / ⛔ 막힘 / 📅 예정: 인용한 항목의 `status`가 모두 같을 때만), 근거 링크(entry의 `item_ids` evidence를 합쳐 앞 3개 + 나머지 개수)는 코드. 하이라이트는 왼쪽 테두리 블록 + 굵은 제목, 진행·논의는 "아이콘 **제목** 문장" 한 줄, 진행 섹션은 막힘을 맨 위로. 멤버·숫자 섹션은 그대로. 초안 없는 코드 렌더도 같은 틀(`daily-report-code-v2`).
  - 하지 않은 것: 진척률·로드맵 기간·예정 날짜(`core_json`에 없음. Interpreter의 `progress.next_step`은 `resolveStructuring`에서 떨어짐, 쓰게 하면 지어냄), 원문 인용(evidence에 본문이 없음, 휴대폰 길이), Fun Corner. 숫자 한 줄 요약은 사용자가 상단에 안 넣기로 함.
- Worker `POST /report/generate` `{ dailyCoreId, dryRun: true }`: 현재 generation의 `core_json`을 읽어 Agent 실행, 저장 없이 응답(`subject`, `markdown`, `html`, usage, 반려 이유). 현재 generation이 없으면 409.

나중에 검토: `DailyReportFinalizer`(사용자, 2026-10-11)

- Writer 결과를 보고, 흐름과 문장을 더 자연스럽게 다듬는 Agent를 뒤에 하나 더 붙일 수 있음.
- 붙인다면 같은 `ReportDraft` 구조를 받아 `opening` / `points[].text` / `headline` / `text` / `closing`만 고치고 `section`과 `item_ids`는 그대로 둔다. 검사(`draftProblems`)와 렌더를 그대로 다시 쓰고, Tool에서 entry 수와 entry별 `section` / `item_ids`가 Writer와 같은지만 더 본다. 문장이 바뀌어도 근거 링크가 entry와 어긋나지 않음.
- 판단은 Phase 1 사용자 확인에서. Writer 지시문만 고쳐서 될 문제인지(예: 문단 묶기, 연결 문장)와 호출 1회 추가 비용(Writer 기준 약 $0.005)을 같이 본다.
- 사용자(2026-10-11, v3를 보고): Phase 2 전에 Finalizer를 먼저 붙여 본다. 구현: `flue/src/agents/daily-report-finalizer.ts`, `/report/generate`의 `finalize: true`(Writer 뒤에 실행)와 `draft`(저장된 Writer 초안을 주면 Writer를 건너뜀). Tool 검사는 `structureProblems`(points·entries 수, entry별 `section` / `item_ids`, points별 `item_ids`가 초안과 같음) + `labelProblems`(제목·포인트 앞의 【進行中】 같은 라벨) + 기존 `draftProblems`. migration `v7`(`FlueDailyReportFinalizerAgent`).

에이전트 확인

- [x] 반려 없이 1회 제출(반려 상한은 Core와 같은 `MAX_REJECTIONS`).
- [x] 시간·토큰·비용 기록. 목표: Core 1회($0.057) 이하.
- [x] 리포트 문장에 `core_json`에 없는 티켓 번호·사람 이름이 없다(코드로 대조: `#\d+`, people).

사용자 확인

- [x] Phase 0 코드 렌더와 나란히 보고 나아졌다. 아니면 LLM 없이 간다.
  - 사용자(2026-10-11, v2를 보고): Core 문장을 부드럽게 바꾼 것은 의미가 있다. Finalizer로 넘기기 전에 섹션을 더 강조해서 잘 읽히고 주요 부분이 잘 보이게. → v3. 섹션 틀은 코드 고정, 상단은 "今日のポイント" 최대 3줄만(숫자 한 줄 요약은 안 넣음).
- [x] Writer 지시문을 고칠지, Finalizer를 붙일지, 이대로 Phase 2로 갈지.
  - 사용자(2026-10-11, Writer v4 + Core generation 8을 보고): "일단은" Phase 2로. Writer v4 채택. Finalizer는 처음엔 옵션으로만 남겼다가, 사용자 결정으로 **기본으로 켬**(`finalize: false`면 Writer만). 이유: 리포트 토큰은 Core보다 훨씬 적어서(리포트 $0.02 vs Core $0.04) 2배가 돼도 부담이 작고, 나중에 톤 바꾸기 같은 고도화된 편집을 Finalizer에 맡길 계획.

확인 기록

- 2026-10-11 에이전트: 구현과 확인.
  - 코드: Agent `DailyReportWriter`(`flue/src/agents/daily-report-writer.ts`, `daily-report-writer-v2`, `thinkingLevel: "low"`), `daily-report.ts`에 `ReportDraft` / `writerInput` / `draftEvidence` / `draftProblems` / `draftStats` / `draftSections`와 초안 렌더, Worker `POST /report/generate`(`dryRun: true`만, 활동 없는 날은 모델 없이 코드 렌더), migration `v6`(`FlueDailyReportWriterAgent`). Supabase REST 헬퍼를 `/core/generate` 안에서 꺼내 두 엔드포인트가 같이 씀. `daily-report.run.ts`에 저장된 응답의 초안으로 렌더하는 인자 추가.
  - 검사: `daily-report.check.ts`(id 부여, 입력 모양, 검사 5종, 통계, 문단 링크 합치기, 초안 렌더, 활동 없는 날은 초안 무시), `daily-core.check.ts` 통과, `tsc` 오류 없음. 초안 없는 렌더가 Phase 0 파일과 바이트 단위로 같음.
  - 에러 경로(모델 없음): 토큰 없음 401, uuid 아님 400, `dryRun` 없음 400, 없는 daily core 404.
  - run p1-1(v1, 중첩 구조): 실패. 9.8초 동안 2회 제출이 모두 스키마에서 반려되어 상한에서 멈춤. 마지막 제출은 `closing`을 마지막 섹션 안에 넣었고 앞 두 섹션의 `paragraphs`가 빈 배열. 첫 반려 이유는 Worker 로그에 안 남음. 실패 응답에 usage가 없어 비용은 모름(2회 제출, 수 센트 이하로 추정). 원인을 이중 중첩 구조로 보고 평평한 구조(v2)로 바꿈.
  - run p1-2(v2): 로컬 Worker, generation 5, 4.6초, 입력 2,211 / 출력 738 토큰, **$0.005**(Core 1회 $0.057의 약 9%). 반려 0.
    - 12개 항목 모두 인용(빠진 항목 0). 섹션 5개 × 문단 1개씩. 지시는 "2-4개 주제"였는데 5개(Tool 검사 아님).
    - 티켓 번호 12개 모두 Core 문장에 있음(Tool 검사), 사람 이름 0.
    - 길이: markdown 10,262 → 7,373자, HTML 22,174 → 15,400자. 휴대폰 폭 3,401 → 2,704px(−20%). 이벤트 부분(개요~멤버 앞)은 1,904 → 1,207px(−37%). 멤버 섹션은 그대로라 비중이 35% → 44%.
  - 보인 점(사용자 판단용)
    - 문장이 Core 요약을 거의 옮겨 적음(예: "完了反映" 문단은 H4 요약과 거의 같음). 압축은 됐지만 연결 문장("あわせて" 정도)이 약하고, 한 섹션에 문단 하나라 섹션 구분의 의미가 약함.
    - 묶기 실수: 진행 항목 #22935와 PR #555가 "運用面の共有"(모듈 작성·Codex)에 들어감.
    - 항목을 많이 묶은 문단은 링크가 많아짐("周辺課題の整理"는 5개 항목, `[1]~[5] +15`). 어느 링크가 어느 사실인지 알 수 없음.
  - 사용자 확인용 출력: `works/out/daily-report-p1.md`, `works/out/daily-report-p1.html`(Phase 0은 `daily-report-p0.*`), 응답 원문 `works/out/daily-report-p1.json`.
- 2026-10-11 에이전트: v3(섹션 강조) 구현과 확인.
  - 코드: `ReportDraft`를 `{ opening, points, entries, closing }`로, `draftProblems`에 "entry가 자기 섹션 항목을 인용" 검사 추가, heading 묶기(`draftSections`)와 그 검사는 삭제. 렌더는 고정 섹션 + 레이아웃 3종(block / list / members), 상태 아이콘, 링크 상한 5 → 3(멤버 포함), 진행 섹션 막힘 우선. `REPORT_FORMAT_VERSION = daily-report-code-v2`, `daily-report-writer-v3`. 지시문의 제목 예시는 이 데이터의 티켓이 아닌 일반 예시로(다른 날 그대로 베끼지 않게).
  - 검사: `daily-report.check.ts`(섹션 고정 순서와 레이아웃, 아이콘·상태, 막힘 우선, 섹션 인용 검사, points가 highlights 인용을 대신하지 않음, points 0개·4개는 스키마 실패, 초안 순서와 무관하게 섹션 배치, 섞인 상태는 아이콘 없음) 통과, `tsc` 오류 없음. v2 초안(`daily-report-p1.json`)은 새 구조로 렌더 안 됨(옛 파일은 그대로 둠).
  - run p1-3(v3): 로컬 Worker, generation 5, 7.6초, 입력 2,424 / 출력 1,299 토큰, **$0.0077**(v2의 약 1.5배, Core의 약 13%). 반려 0. 12개 항목 모두 인용, points 3, entries 하이라이트 4 / 진행 2 / 논의 6(항목 1개 = entry 1개). 사람 이름 0, 티켓 번호는 Tool 검사 통과.
    - 좋아진 점: 제목이 결과를 말함("#23163 実装完了、動作確認へ進行", "#22506 出力項目設定の保持を実装"). #22935와 PR #555가 진행 섹션으로 감(v2의 묶기 실수가 고정 섹션 + 검사로 사라짐). 링크가 entry마다 최대 3개라 어느 링크가 어느 일인지 보임.
    - 길이: 압축이 거의 없어짐. 본문(제목 + 문장) 1,232자 vs 인용한 Core summary 합 1,048자. 휴대폰 폭 3,630px(같은 방식으로 다시 잰 값: Phase 0 3,494, v2 2,728, 새 틀의 코드 렌더 3,505). 이벤트 부분(하이라이트~멤버 앞) 1,837px로 v2(1,069)보다 길고 Phase 0(1,763)과 비슷. 논의 섹션이 786px로 가장 김.
  - 보인 점(사용자 판단용)
    - 문장은 여전히 Core summary를 다듬은 수준(H1은 거의 같음). "1항목 1entry" 지시 때문에 v2의 압축(5문단)이 사라짐. 줄이려면 논의 섹션만 "중요한 것 2~3개만 entry, 나머지는 빼기" 같은 지시가 필요하고, 그러면 `stats.unused`가 늘어남.
    - points의 아이콘이 Core `status`를 따라서 "#23163が実装完了し確認へ"에 🚧(Core가 in_progress). 사실과 어긋나진 않지만 "完了"와 아이콘이 다르게 읽힐 수 있음.
    - 세 번째 point "完了反映とレビュー調整を進行"은 두 항목을 묶어 내용이 흐림(아이콘도 없음).
  - 사용자 확인용 출력: `works/out/daily-report-p1v3.md` / `.html`, 응답 원문 `daily-report-p1v3.json`, 같은 틀의 코드 렌더 `daily-report-p0v2.*`.
  - 사용자 요청으로 섹션 제목 변경(코드 상수만, 모델 재실행 없이 저장된 v3 초안으로 다시 렌더): メンバー → 👥 メンバーアクティビティ, 数字 → 📊 今日のKPI(ko: 멤버 활동 / 오늘의 KPI, en: Member activity / Today's KPIs). 처음엔 メンバー別の動き / 今日の数字로 바꿨으나 사용자가 이쪽을 고름.
  - KPI 섹션을 표로(사용자 요청, 모델 재실행 없음): 열은 指標 / 件数(언어별 상수). 출처가 2개 이상인 값(Slack 채널별)은 합계 행 아래에 작은 회색 내역 행(markdown은 `└ #dev_lead`). 내역에서 0인 출처는 뺌. 3열(내역 열)은 휴대폰 폭에서 채널 이름이 줄바꿈되어 안 씀.
- 2026-10-11 에이전트: Finalizer 시도(사용자 선택). 입력은 저장된 v3 초안(Writer 재실행 없음), 로컬 Worker, generation 5.
  - 검사: `daily-report.check.ts`(구조 비교 4가지, 라벨 검사, 변경 통계, Finalizer 입력 모양) 통과, `tsc` 오류 없음. 에러 경로(모델 없음): 스키마가 다른 `draft` 400, 이 generation에 없는 id를 쓴 `draft` 400.
  - run p1-4(finalizer-v1): 성공(8.0초, 입력 3,421 / 출력 1,442 토큰, $0.0091, 반려 0)이지만 쓸 수 없음. "상태 아이콘과 어긋나지 않게"라는 지시를 "상태를 써라"로 읽어 모든 제목 앞에 【進行中】【完了】【不明】을 붙임(코드 아이콘과 중복, `unknown`까지 씀). 본문·오프닝·마무리는 그대로. 원문 `works/out/daily-report-p1v3f-run1-labels.json`.
    - 고친 것(v2): 라벨 금지를 지시문에 명시하고 `labelProblems`로 Tool에서도 반려. "문장을 다시 쓸 것"과 오프닝·본문·마무리 각각의 방향, 걸러낼 상투구(〜が共有されました 등)를 구체적으로.
  - run p1-5(finalizer-v2): 6.5초, 입력 3,552 / 출력 1,302 토큰, **$0.0085**, 반려 0. 29개 문장 중 10개만 바뀜(1,446 → 1,452자).
    - 나아진 곳: 오프닝이 티켓 나열 대신 하루의 모양("実装の完了と反映が進む一方で…いくつかは次の確認待ち")을 말함. 세 번째 point가 "完了反映とレビュー調整を進行" → "#23145 の子チケット化と反映案件の整理"로 구체적. 마무리 끝을 "進める流れです" → "進めます".
    - 안 바뀐 곳: entry 12개 중 8개(진행 2, 논의 6)는 글자 그대로. 바뀐 4개도 단어 몇 개("共有されました" 일부는 남음). 걸러내라고 한 상투구가 그대로 있음.
  - 판단 재료(사용자용)
    - Finalizer가 가진 사실이 Writer와 같은 Core summary뿐이라, 새로 말할 내용이 없음. 결과적으로 "같은 문장의 미세 수정"에 머물고, 리포트 비용이 약 2배($0.0077 → 합계 $0.016)가 됨.
    - 효과가 있던 오프닝·points 규칙(하루의 모양, 구체적인 포인트, 상투구 금지)은 Writer 지시문에 옮기면 호출 1회로 같은 효과를 낼 수 있음.
    - 지시문을 더 고치거나 `thinkingLevel`을 올려 다시 돌리는 건 하지 않음(Phase마다 1회 원칙, 이미 2회).
  - 사용자 확인용 출력: `works/out/daily-report-p1v3f.md` / `.html`(Finalizer v2), 응답 원문 `daily-report-p1v3f.json`(`writerDraft`에 입력 초안).
- 2026-10-11 에이전트: 품질 개선(사용자가 `sample/final.html`과 비교 후 인용 / Core 필드 / Writer 톤 3가지 모두 고름).
  - 차이의 원인으로 본 것: Writer가 받는 사실이 40~130자 Core summary뿐. Core가 담당자(actors)와 다음 단계(`next_step`)를 `core_json`에서 버리고 있었고, 원문도 없음. 지시문도 "사실만, 1~2문장"으로 좁음.
  - Core 쪽(`core_json`에 추가, Report는 계속 `core_json`만 읽음): evidence마다 `author`(그날 사람이 쓴 줄만, 봇·컨텍스트는 null)와 `excerpt`(멘션 정리, 200자). item `payload`에 `owners`(member actor 합집합, 멤버 섹션은 빈 배열)와 `next_steps`. 계약 `DailyCoreEvidence.author` 추가. 새 필드는 모두 optional이라 `daily-core-v1` 유지(generation 5 이전 `core_json`도 그대로 렌더). Interpreter `core-interpreter-v6`: `progress.next_step`을 명시적으로 요구(v5까지 20개 item 모두 progress가 null).
  - Report 쪽: 인용 후보는 코드가 고름(item마다 작성자 있는 excerpt 중 긴 것 3개, 중복 제거, 시간순, id `H1.2`). 모델은 highlights entry에 `quote_ids`(최대 2)만 내고 원문은 코드가 그대로 붙임(인용을 모델이 쓰면 원문과 달라질 수 있음). Tool 검사: 인용은 그 entry가 인용한 item의 후보여야 함, highlights 밖에는 인용 금지. 인용 원문과 next_steps의 티켓 번호도 "입력에 있는 번호"로 인정. Finalizer 구조 비교에 `quote_ids` 추가. Writer `daily-report-writer-v4`: owners / next_steps / quotes를 입력에 넣고, 의미 문장은 항목·인용이 말할 때만, 팀원에게 쓰는 따뜻한 톤(과장·사람 비교·명언 금지), Finalizer에서 효과 있던 규칙(오프닝은 하루의 모양, 구체적 points, 상투구 금지)을 옮김.
  - 검사: `daily-core.check.ts`(owners / next_steps 병합, 멤버 섹션 owners 빈 배열, evidence author / excerpt와 200자 자르기, payload), `daily-report.check.ts`(인용 후보 선택·순서·봇 제외·중복 제거, 옛 `core_json`은 빈 배열, 인용 검사 2종, 인용 3개는 스키마 실패, 구조 비교, markdown / HTML 인용 렌더) 통과, `tsc` 오류 없음.
  - Core run 22(generation 6, 새 필드가 필요해서 Core 재생성 1회): 29초, $0.036, 반려 0, item 13 + 멤버 12. owners는 모든 이벤트 item에 채워짐, 인용 후보도 모든 item에 있음. 하지만 **`next_steps`는 13개 모두 빈 배열**: Interpreter 원출력에서 `progress`가 여전히 모두 null("仕様書到着後に着手予定" item조차). 지시문만으로는 optional 중첩 객체를 안 채움. 고치려면 스키마를 바꿔야 함(예: `next_step`을 최상위 필수 `string | null`로 해서 매 item 판단하게). Core를 또 돌려야 해서 하지 않음.
  - run p1-6(writer-v4, generation 6): 6.4초, 입력 6,122 / 출력 1,350 토큰, **$0.011**(v3 $0.0077, 입력이 인용 후보로 2.5배), 반려 0. 13개 중 10개 인용(빠진 것: P1 インポート修正 진행 중, T4, T5), points 3, entries 하이라이트 4 / 진행 3 / 논의 3, 인용 7개.
    - 좋아진 점: 담당자 이름이 들어감("Yuki Kato が…"). 이유 문장이 생김("本体とは切り分けて進めることで、設計確認を先に進める狙いです", 인용 원문 "DB設計部分は別で分離した方が良いと判断"에 근거). 다음 단계가 구체적("次は No.158 修正が予定", "詰まらなければ本日中にレビュー依頼"). 논의 섹션이 6 → 3으로 줄어 압축이 돌아옴.
    - 인용이 문제: 원문 그대로라 `@Yoko Nishimura @Mitsuru Ikeshita ( @UHH4TRCNR …` 같은 멘션 줄, `@channel 【本日の作業予定】… 【体調】 普通` 같은 하루 보고 양식, Redmine 링크 마크업(`<https://…|…>`), 200자에서 잘린 "…", 커밋 메시지 반복(" / ")이 그대로 보임. "긴 것 3개"로 고르니 양식 보고가 잘 뽑힘. 좋은 인용은 "詰まらなければ本日中にレビュー依頼出せるかと" 같은 짧은 한마디.
    - 약한 추론 몇 개: "実装の仕上げ段階に入っています", "リリース向けの作成作業はひと区切りです", "受入指摘を踏まえた修正が反映された形です"(상투구). 오프닝은 아직 티켓 나열에 가까움.
  - 다음 후보(사용자 판단): 인용 정리는 코드만으로 가능(앞쪽 멘션·`@channel` 제거, Slack 링크 마크업을 라벨로, 커밋은 후보에서 빼기, 양식 보고 줄 제외, 길이 대신 짧고 완결된 문장 우선). 인용 후보 선택이 바뀌면 id가 바뀌어 저장된 v4 초안은 못 씀(Writer 1회 다시). `next_step`은 Interpreter 스키마 변경 + Core 1회.
  - 사용자 확인용 출력: `works/out/daily-report-p1v4.md` / `.html`, 응답 원문 `daily-report-p1v4.json`, Core 응답 `daily-core-run22.json`.
- 2026-10-11 에이전트: 인용 정리 + `next_step` 고치기(사용자가 둘 다 고름). Core 1회 + Writer 1회.
  - 인용 정리(코드): Core가 인용용 텍스트를 따로 만듦. Slack 줄만(커밋 메시지는 이미 item 제목에 있음). 앞쪽 멘션·`@channel`·괄호 속 cc 멘션 제거, `<url|label>`은 label, 맨 URL은 제거, `<#C|ch>`는 `#ch`. 이모지 코드(`:pray::skin-tone-2:`), 취소선(`~…~`, 철회한 말), URL처럼 생긴 링크 라벨은 `plainSlackText`로 지움(두 번 적용해도 같음). 이 함수는 Report도 후보를 고를 때 적용해서 이미 저장된 excerpt에도 효과가 있음. Report 쪽 선택: 15~120자만(짧으면 맞장구, 길면 보고문이고 200자에서 잘렸을 수 있음), 하루 보고 양식 제외(`【…】`로 시작, `【…】` 2개 이상, `・` 2개 이상), 남은 것 중 긴 3개를 시간순으로.
  - `next_step`(Interpreter `core-interpreter-v7`): `progress` 안의 optional 필드를 item 최상위의 필수 `string | null`로 옮김. optional이면 모델이 아예 안 씀(v5, v6). 지시문 예시는 이 데이터가 아닌 일반 문장으로 바꿈. Structurer 입력에는 안 넣음(병합은 코드가 하므로 토큰만 늘어남).
  - 검사: `daily-core.check.ts`(인용 텍스트는 사람의 Slack 줄만, 멘션·링크 정리, `plainSlackText`, `next_step` 병합), `daily-report.check.ts`(길이 범위·양식 제외 포함 후보 선택) 통과, `tsc` 오류 없음.
  - Core run 23(generation 7): 28초, $0.035, 반려 0. **`next_steps`가 13개 → 11개 item 모두에 채워짐**("来週 13〜14日ごろに残りの対応をレビュー依頼", "#20878 の No.158 修正に着手" 등). 대신 필수라서 근거 없는 항목도 채움: "リリースや受入確認が必要なら続けて対応する（担当未記載）", "次の関連作業があれば別途着手する（記載なし）", 지금 하는 일을 다음 단계로 다시 씀(P4). 출력 토큰은 비슷(6,209 → 6,029).
    - 덮기 감소: item 13 → 11(MillviV3 字幕, Naoya Tsujimoto의 임포트 수정이 빠짐), 사람 줄 인용 43 → 36 / 71, 멤버 항목 12 → 10(Naoya Tsujimoto, Momoko Terada, Mitsuru Ikeshita). 출력 길이가 같아서 필수 필드 탓인지 실행마다 흔들리는 것(TODO 3-3, run 16 / 17도 9개 차이)인지 1회로는 구분 못 함.
  - run p1-7(writer-v4, generation 7): 6.6초, 입력 3,896 / 출력 1,474 토큰, **$0.0096**, 반려 0. 11개 항목 모두 인용, entries 하이라이트 5 / 진행 5 / 논의 1, 인용 8개.
    - 인용이 읽힘: 멘션·양식·링크 마크업·이모지 코드가 사라지고 "展示会の時間外の9:00～10:00、17:00～ で、実施できると思うので…", "詰まらなければ本日中にレビュー依頼出せるかと" 같은 말이 붙음. 약한 인용도 있음("はい。今朝すぐコミットします。", 제목을 반복하는 #23145 확인 요청).
    - 다음 단계가 본문과 마무리에 들어감(来週13〜14日ごろ, No.158, No.230 → #23145 / #23126). 근거 없는 next_step 하나가 그대로 옮겨짐(#23087 "受入やリリース確認が必要なら、この後続けて対応する流れです").
    - 문체가 섞임: "〜を作り、先に確認を進めた。"(だ체)와 "〜予定です。"(です체)가 한 문단에.
  - 남은 후보(사용자 판단): `next_step`이 비어야 할 때 null을 쓰게 하기(지시문에 "추측·조건부 문장은 null" 명시, 또는 "記載なし"류를 코드로 거르기는 언어 의존이라 비추천). Writer 지시문에 문체 통일(ja는 です・ます). 덮기 감소는 평가 세트(TODO 3-3)로 판단.
  - 사용자 확인용 출력: `works/out/daily-report-p1v4b.md` / `.html`, 응답 원문 `daily-report-p1v4b.json`, Core 응답 `daily-core-run23.json`.
- 2026-10-11 에이전트: 근거 없는 `next_step` 고치기(사용자). 문체 혼재는 고치지 않음(사용자: 사람이 써도 섞이니 어느 정도 자유도를 줌). Core 항목 감소는 요주의(사용자).
  - 원인 판단: 필수 필드라서가 아니라 v7 지시문의 "set on every item"과 "null only when nothing is stated". 필드는 이미 `string | null`이었고, 모델이 "（担当未記載）"를 붙인 걸 보면 근거가 없다는 걸 알면서 채움. 필수 필드는 유지(optional이던 v5, v6에서는 0개).
  - `core-interpreter-v8`: 스키마는 그대로, 지시문만. "null이 보통", 추측·조건부("if needed, continue")·지금 하는 일을 다시 쓰기·빠진 정보 표시("owner not stated")는 쓰지 말 것.
  - Core run 24(generation 8): 29초, $0.040, 반려 0. `next_steps`가 16개 중 8개(나머지 null). 조건부·"記載なし"류는 사라짐. 남은 애매한 것 1개: "LEAD 10月バージョンのモジュールを作成する"(본인이 "作成します"라고 쓴 계획이라 근거는 있음).
    - 덮기(요주의): item 16, 멤버 13 / 13, actor 13 / 13, 사람 줄 인용 40 / 71. generation 6 / 7 / 8은 item 13 / 11 / 16, 인용 43 / 36 / 40, 멤버 12 / 10 / 13. v8에서 회복했지만 기준(run 21: 인용 53, 멤버 13)보다는 낮고, 실행마다 흔들리는 폭(36~53)이 큼. MillviV3 字幕 item은 generation 7, 8 모두 없음(사람 줄은 있음). 같은 일이 둘로 나뉨: "モジュール作成（5.3.10_0011）"(진행)과 "LEAD 10月バージョンのモジュール作成を開始"(논의). 평가 세트(TODO 3-3)로 판단할 것.
  - run p1-8(writer-v4, generation 8): 7.8초, 입력 3,993 / 출력 1,736 토큰, **$0.011**, 반려 0. 16개 항목 모두 인용, entries 하이라이트 4 / 진행 8 / 논의 4, 인용 7개. #23087의 근거 없는 다음 단계가 사라지고, 다음 단계는 근거 있는 것만 본문에 들어감(No.158, 13〜14日ごろ, 仕様確認の返答を受けて). Writer가 덧붙인 의미 문장 하나는 근거가 약함("再発時の作業停滞を防ぐための共有が行われています").
  - 사용자 확인용 출력: `works/out/daily-report-p1v4c.md` / `.html`, 응답 원문 `daily-report-p1v4c.json`, Core 응답 `daily-core-run24.json`.

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

- [x] migration 적용, `database.types.ts` 갱신, `tsc` 오류 없음.
- [x] 생성 1회 → 행 `succeeded`, `core_generation_no`가 현재 generation(품질 개선으로 5 → 8). 잘못된 입력으로 400 / 404, 모델 실패로 failed 경로 확인. 409(현재 generation 없음)는 그런 daily core가 DB에 없어서 실행 못 함(행을 만들기 전에 돌려주는 코드만 확인).

사용자 확인

- [x] Supabase에서 행을 열어 본다. 컬럼 구성이 괜찮다.
  - 사용자(2026-10-11): 행 4개를 Supabase에서 확인하고 Phase 3로 진행.

확인 기록

- 2026-10-11 에이전트: 구현과 확인.
  - 테이블 `daily_reports`(`app/features/daily-core/schema.ts`, migration `0044_wakeful_stick.sql`): 계획한 컬럼 + `agent_conversation_id`(Core generation과 같게, Flue 대화 추적용). 상태는 새 enum을 만들지 않고 `daily_core_generation_status`를 씀(값이 같음). unique `(daily_core_id, report_no)`, RLS는 `daily_core_generations`와 같음(조회는 workspace 멤버, 쓰기는 service role). `daily_core_data`에 포인터 컬럼은 안 만듦(계획대로).
  - migration 적용 후 `postdb:migrate`가 `db:typegen`을 자동 실행. 이번엔 Supabase CLI 로그인이 맞아서 성공했고 `database.types.ts`에 `daily_reports`만 추가됨(10-08에는 실패하며 파일을 비웠음).
  - `/report/generate`: `dryRun` 제거. 순서는 Core와 같음: 검사(400 / 404 / 409, 행 안 만듦) → `report_no = 최대 + 1`로 processing 행 → 생성 → succeeded(subject / markdown / html, `agent_output_json.draft`, 토큰, 시간, stats) / failed(`error_code = report_failed`). 활동 없는 날도 행을 남김(모델 없음). 저장된 초안을 준 경우 모델 컬럼은 null. `report_no`는 잠금 없이 계산해서 동시 요청은 unique 인덱스에서 실패함(지금은 요청이 하나뿐이라 둠).
  - 검사: `flue` `tsc` 오류 없음. 앱 `tsc`는 `works/out/daily-core-templates.v6.ts`(이번과 무관한 작업 파일)의 import 오류 1개뿐.
  - 실행(로컬 Worker, generation 8): 없는 daily core 404, 스키마가 다른 `draft` 400(행 없음). report 1: 저장된 v4 초안(`daily-report-p1v4c.json`) → succeeded, 모델 null, $0. report 2: 없는 모델 → failed, 5.5초. report 3: Writer v4 → succeeded, 13.5초, $0.0093, 저장된 HTML / markdown이 응답과 바이트 단위로 같음.
  - 보인 점: failed 행의 `error_message`가 "[flue] Agent run failed (submission …)"뿐이라 원인(없는 모델)이 안 남음. Core 쪽도 같은 `runAgent`라 같을 것. 필요해지면 Flue 이벤트에서 원인을 꺼내는 걸 검토.
  - Finalizer를 기본으로 켠 뒤(사용자) 기본 경로 1회: report 4, Writer v4 + Finalizer v2, 19.5초, **$0.022**(Writer $0.011 + Finalizer $0.011), 반려 0. 37개 문장 중 18개 바뀜, 1,889 → 1,601자(v3 초안에 돌렸던 p1-5는 29개 중 10개, 글자 수 그대로였음). points 3개는 그대로, 오프닝은 だ체 나열 → "〜が進んだ日でした"로 짧아짐. `agent_output_json`에 `draft`와 `writer_draft` 둘 다 남음. Phase 3의 시간 계산은 리포트 약 20초로 잡을 것.
  - 사용자 확인용: Supabase `daily_reports`에서 `daily_core_id = d36d689e…`의 행 4개. 응답 원문 `works/out/daily-report-p2.json`(Writer만), `daily-report-p2f.json`(기본 경로).

---

## Phase 3. 메일 경로 연결 (`processTarget`)

만들 것

- `processTarget`: 수집 저장 → Worker `/core/generate` → `/report/generate`(Phase 2를 건너뛰었으면 렌더만 하는 `/report/render`) → `sendMails`. `createContents`(TestAgent) 호출을 뺀다.
  - 앱 환경변수: `FLUE_AGENT_URL`(`/agents/test`까지 포함된 주소) 대신 Worker 기본 주소 `FLUE_BASE_URL`. `works/env.md` 갱신.
  - Core 생성이 실패하면 메일을 보내지 않고 run을 에러로 닫는다(지금의 `closeRun`).
  - `sendMails`에 `{ finalContents: markdown, htmlContents: html }`, 제목은 리포트 `subject`, `period: daily`. Slack 통지는 그대로(markdown 앞 200자).
- 확인할 것: 즉시 발송은 클라이언트가 Vercel `POST /api/cron/send-now/run`을 동기로 부름(Railway worker 전환은 아직 주석). Core 42~150초 + 리포트가 Vercel 함수 시간 안에 들어가는지. 넘으면 Worker가 Core 뒤에 리포트까지 이어서 하고 Vercel은 결과만 받는 방식으로 바꾼다.
- 보낼 리포트는 그 실행에서 `/report/generate`가 돌려준 `reportId`의 HTML. "가장 큰 `report_no`의 succeeded"를 다시 찾지 않음.

이번 Phase에서 안 하는 것: 메일 1회 발송 보장(사용자, 2026-10-11) → Phase 3 뒤 별도로 구현함(아래 "메일 1회 발송 보장")

- 메일은 daily core(Target × 날짜)당 1번이어야 함. 리포트는 다시 만들면 행이 쌓이지만 메일은 하나. 지금은 `sendMails`가 보낸 뒤에 `newsletter_editions`에 쓰고, `getUniquePeriodKey`가 `_1`, `_2`를 붙여 중복을 허용함.
- Phase 3 뒤 별도 작업, Phase 4 배포 전 필수(TODO 2). Phase 3 동안은 수신자가 테스트 주소라 중복이 나가도 됨(테스트 날짜 고정이라 즉시 발송마다 같은 core로 나감).
- 안: `newsletter_editions`에 `daily_core_id` / `daily_report_id`, `sending` / `delivered` / `partial` 행에만 `daily_core_id` unique 부분 인덱스. Resend 전에 `sending` 행을 넣어 발송권을 잡고, 충돌하면 건너뜀(동시 요청도 DB가 막음). 이미 보낸 날짜면 Core·리포트 생성 전에 건너뜀.
- 정책: Cron·즉시 발송 모두 건너뜀, 다시 보내기는 명시적 `force`(테스트용)만.

에이전트 확인

- [x] 로컬 앱 + 로컬 Worker로 즉시 발송 1회: 메일 도착, `newsletter_editions` 행(`period = daily`, html / text 본문), Core generation 1 증가, (Phase 2를 했으면) `daily_reports` 행.
- [x] Core 실패 경로(잘못된 모델명 등)에서 메일이 안 나가고 run이 에러로 닫힌다.
- [x] 전체 소요 시간 기록.

사용자 확인

- [x] 받은 메일을 Gmail(웹·모바일)에서 열어 본다. 링크가 Slack / GitHub로 열린다.
  - 사용자(2026-10-11): 메일 도착, 링크 정상 작동.

확인 기록

- 2026-10-11 에이전트: 구현과 즉시 발송 1회.
  - 코드
    - `app/features/daily-core/flue.ts`(새 파일): `generateDailyReport(dailyCoreId)`가 Worker `/core/generate` → `/report/generate`를 차례로 부름. HTTP 오류나 `status: "failed"`면 throw. 주소는 `FLUE_BASE_URL`(없으면 `http://localhost:8787`), 토큰은 기존 `FLUE_API_TOKEN`.
    - `processTarget`: `createContents`(TestAgent) 대신 위 함수. 실패하면 throw라 기존 `catch`(run 에러로 닫기)로 가고 메일은 안 나감. 메일 본문은 리포트 `markdown` / `html`, `period: daily`, 기간 키는 Core 날짜의 UTC 자정으로(`20261009`. 창 시작 시각으로 만들면 도쿄에서는 전날이 됨). run `metrics_json`에 daily core id, generation 번호, report id / 번호, 단계별 시간, 비용, `accurated_tokens`에 Core + 리포트 토큰 합.
    - `sendMails`: 두 번째 인자가 표시 이름 대신 제목(리포트 `subject`).
    - `SLACK_NOTIFY=0`이면 팀 Slack 채널 알림을 안 올림(사용자 결정: 테스트 때 실제 팀 채널에 "Newsletter sent"가 올라가지 않게). 루트 `.env`에 넣음.
    - `create-contents.tsx`는 호출처가 없어졌지만 Phase 4에서 `TestAgent`와 같이 지움(계획대로). 앱 `FLUE_AGENT_URL`도 그때.
  - 검사: 앱 `tsc`는 `works/out/daily-core-templates.v6.ts`의 기존 오류 1개뿐.
  - 실행(사용자가 로컬 앱에서 즉시 발송, 로컬 Worker): run `1ae9421b…` success, 메일 도착(사용자).
    - DB: `daily_core_data d36d689e…` 재수집 → generation 9 succeeded → report 5 succeeded(`core_generation_no = 9`, Writer v4 + Finalizer v2, 반려 0) → `newsletter_editions` `70c6e09f…`(`delivered`, `period = daily`, `period_key = 20261009`, 제목 "D_G_S開発チーム Daily Report 2026-10-09", HTML 20,935자 / text 8,014자).
    - 시간: 전체 52.4초(run 시작 → 끝). 수집 약 10초, Core 30.1초, 리포트 10.5초(Writer 5.9 + Finalizer 4.6, report 4의 19.5초보다 짧음), 메일 약 1.4초.
    - 비용: $0.059(Core 약 $0.041 + 리포트 $0.018), 토큰 30,621.
  - Vercel 함수 시간: 로컬은 제한이 없어 확인 못 함. 배포(Phase 4)에서 즉시 발송 경로가 50~60초 걸린다는 전제로 Vercel 플랜의 함수 최대 시간을 확인. 넘으면 계획대로 Worker가 Core 뒤에 리포트까지 이어서 하는 방식으로.
- 2026-10-11 에이전트: Core 실패 경로. 앱에서 모델명을 바꿀 수 없어서 로컬 Worker를 끈 채로 즉시 발송(사용자). 모델 호출 0.
  - run `a05c47e5…` `failed`, run step `failed`(`error_summary = "fetch failed"`). 로그는 수집 성공(128개, source 4) → `target_processing_error: fetch failed`.
  - generation 9 / report 5 그대로, `newsletter_editions` 새 행 없음, 메일 안 옴.
  - 보인 점(동작은 맞음, 기록만)
    - 오류 문구가 "fetch failed"뿐이라 어느 호출이 왜 실패했는지 모름. `callFlue`가 연결 실패를 감싸지 않음. 경로와 주소를 붙이면 됨.
    - 실패 run의 `finished_at`이 null, step이 `collect_data`에 머묾. 이번 변경 전부터의 동작(`updateNewsletterRunError`가 끝난 시각을 안 쓰고, step은 성공 때만 갱신). 지금은 Core·리포트 실패도 `collect_data` 실패로 보임. step enum 정리(TODO 3-4)와 같이 봄.
  - Phase 3 확인 모두 통과.

---

## 메일 1회 발송 보장 (Phase 3 뒤, Phase 4 전)

만든 것

- migration `0045`: `newsletter_editions`에 `daily_core_id`, `daily_report_id`, `forced`(기본 false). unique 부분 인덱스 `uq_editions_daily_core_sent (daily_core_id) where status in (sending, delivered, partial) and forced = false`.
  - FK는 안 걺: `daily-core/schema.ts`가 `features/schema.ts`를 import해서 반대로 참조하면 순환 import.
- `processTarget`: 수집 전에 `getDailyCoreData` → `getSentDailyEdition`으로 이미 보낸 날짜면 run을 닫고 끝(수집·모델 호출 없음). 다른 건너뛰기(구독 없음, 한도 초과)와 같은 `closeRun`이라 run은 `failed`로 보임.
- `sendMails`: 발송 전에 `claimDailyEdition`으로 `sending` 행을 넣음. 인덱스 충돌(23505)이면 보내지 않고 false. 보낸 뒤 `finishEdition`으로 `delivered` / `partial` / `failed`. Resend가 throw해도 `failed`로 남김(`sending`으로 남으면 그날이 영구히 막힘).
  - 사전 확인만으로는 Cron과 즉시 발송이 동시에 오면 둘 다 통과함. DB 인덱스가 최종 판정.
- Slack 알림과 사용량 카운터는 메일이 실제로 나갔을 때만(전에는 메일보다 먼저 Slack에 "Newsletter sent").
- `DAILY_MAIL_FORCE=1`(테스트용): 사전 확인을 건너뛰고 `forced = true`로 기록, 인덱스 대상에서 빠짐. `CRON_RECORD=0`이면 edition을 안 쓰므로 제한도 꺼짐.
- `saveNewsletterEditions`는 호출처가 없어져 삭제.

알고 있는 한계

- 발송 중에 프로세스가 죽으면 edition이 `sending`으로 남아 그날이 막힘. 그때는 행을 `failed`로 바꾸면 다시 보낼 수 있음. 오래된 `sending`을 자동으로 풀지는 않음.
- 사전 확인을 통과하고 발송권에서 진 실행은 Core·리포트 비용을 이미 쓴 뒤임(메일은 안 나감).

확인 기록

- 2026-10-11 에이전트: 구현과 확인.
  - migration `0045` 적용, `database.types.ts` 갱신(9줄). 앱 `tsc`는 기존 무관 오류 1개뿐.
  - 오늘 보낸 edition `70c6e09f…`에 `daily_core_id` / `daily_report_id`(report 5)를 채움. 새 컬럼이 비어 있으면 가드가 이 발송을 못 봄.
  - DB 인덱스(Supabase REST로 직접 insert): 같은 daily core의 두 번째 `sending` 행 → 409 / 23505, `failed` 행 → 201, `forced` 행 → 201. 테스트 행 2개 삭제.
  - 즉시 발송(사용자): run `b79114d2…`가 "Daily mail for 2026-10-09 already delivered (edition 70c6e09f…)"로 바로 닫힘. `collected_at` 그대로(수집 안 함), generation 9 그대로, edition 1개 그대로, 메일 안 옴, 비용 0.
  - 확인 못 한 것: `DAILY_MAIL_FORCE=1`로 실제 재발송(약 $0.06). 인덱스가 `forced` 행을 받는 것은 위에서 확인.

---

## Phase 4. 배포·정리

만들 것

- 선행: 메일 1회 발송 보장(위). 끝남(2026-10-11).
- Worker 배포, Vercel에 `FLUE_BASE_URL`.
- `TestAgent` 제거(TODO 4-3): `flue/src/agents/test-agent.ts`, `/agents/test` 라우트, `createContents`의 `askTestAgent`. Durable Object 클래스 삭제는 migration `deleted_classes`(Core 분리 Phase 3과 같은 방법).

에이전트 확인

- [ ] 배포본으로 즉시 발송 1회 성공, Cloudflare 로그에 error 없음.
- [ ] `/agents/test`가 404.

사용자 확인

- [ ] 배포본 메일을 받아 본다.

확인 기록
