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

에이전트 확인

- [x] 반려 없이 1회 제출(반려 상한은 Core와 같은 `MAX_REJECTIONS`).
- [x] 시간·토큰·비용 기록. 목표: Core 1회($0.057) 이하.
- [x] 리포트 문장에 `core_json`에 없는 티켓 번호·사람 이름이 없다(코드로 대조: `#\d+`, people).

사용자 확인

- [ ] Phase 0 코드 렌더와 나란히 보고 나아졌다. 아니면 LLM 없이 간다.
  - 사용자(2026-10-11, v2를 보고): Core 문장을 부드럽게 바꾼 것은 의미가 있다. Finalizer로 넘기기 전에 섹션을 더 강조해서 잘 읽히고 주요 부분이 잘 보이게. → v3. 섹션 틀은 코드 고정, 상단은 "今日のポイント" 최대 3줄만(숫자 한 줄 요약은 안 넣음).
- [ ] Writer 지시문을 고칠지, Finalizer를 붙일지, 이대로 Phase 2로 갈지.

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
