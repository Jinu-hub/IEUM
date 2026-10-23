# W43 TODO (2026-10-19 ~ 10-25)

W42_TODO.md의 남은 것을 옮겨 시작. 한 일은 `W43.md`.

남은 것과 끝난 것을 나눠 적는다. 섹션 번호(1-1, 3-2 등)는 다른 문서가 가리키므로 두 부분에서 같게 쓴다.

# 남은 것

## 1. 지금 우선

순서: metrics 채우기(1-3, 코드 완료·실측 남음) → 분류 에이전트 B안(3-4) → 주간 리포트(1-5). items(1-2)는 끝남(2026-10-23).

### 1-1. 생성 실패 막기

반려 2회면 그날 Core·리포트·메일이 없어짐. 코드가 고칠 수 있는 것은 고치고 반려는 치명적인 것만.

- [ ] Writer: highlights 밖 `quote_ids`를 반려 말고 `withoutStrayQuotes`처럼 비우고 검사.
- [ ] Structurer: 같은 사람 member_activity entry 2개를 반려 말고 코드가 합침(`core_item_ids` 합집합).
- [ ] Interpreter: 제출 전 수정 도구 호출로 반려가 쌓이면 대비책이 없어 그날 Core가 실패함. 받은 출력은 살리는 쪽으로.

### 1-3. daily_core_metrics 채우기 (projection) ← 다음(실측)

- [ ] `/core/generate` 1회 후 `daily_core_metrics` 행 수 = `validation_json.projection.metrics` 확인.
- [x] `coreMetricRows` + `dimensionHash`(정렬 JSON). `/core/generate`에서 items와 같은 블록에 DELETE+INSERT. `origin: computed`, `evidence_json: {}`. 실패해도 Core 성공.

### 1-4. 프롬프트 DB 연결 확인

- [ ] **테스트 끝나면 반드시 원복**: `flue/.dev.vars`의 `PROMPTS_SUPABASE_URL` / `KEY` 주석 해제 + 로컬 Worker 재시작. 원복 전에 최종 지시문을 DB에 새 버전으로 넣을지 정함.
- [ ] 프롬프트 DB 데이터 넣기(`services` ieum, `agents` 5종, 코드 기본값 지시문을 v1로, `prompt_releases` default). DB의 `core-interpreter` 지시문은 입력 설명 문단(`RAW_INPUT`)이 코드와 글자 그대로여야 함.
- [ ] 로컬에서 `/core/generate`, `/report/generate`로 `prompt_version` 확인 후 배포(`wrangler secret put`).

### 1-5. 주간 리포트 (projection 뒤)

- [ ] 주간 입력은 core_json 전체가 아니라 items/metrics 테이블에서 조회(`weeklyInput` 상당). 날짜별 highlights 중심 + metrics는 코드가 rollup.
- [ ] 날짜 간 같은 작업을 묶는 병합 에이전트 1단 + 코드 검증(없는 `(날짜, item_key)` 인용, 중복 병합, highlights 반영 여부). 렌더는 처음엔 코드만으로.

## 2. Daily Report 후속

경과는 `works/daily-report.md`.

- [ ] 앱 Vercel 첫 배포(`works/vercel-deploy.md`).
- [ ] 시크릿 노출 정리: GitHub 토큰 로그 평문(`github/run.ts`), 루트 `.env` 형식 깨진 줄. 이미 찍힌 토큰 교체 여부 결정.
- [ ] 메일 HTML 실제 클라이언트 확인(Gmail/Outlook, 다크 모드, 모바일 폭).
- [ ] Finalizer v3 실행 확인(합치기·나누기를 하는지, 대비책 경고가 보이는지).
- [ ] 리포트 내용: Writer의 "Minor may be left out", `#77`처럼 바뀌는 티켓 표기, highlight/topics 겹침(#22540).
- [ ] 실패 기록 개선: Worker 연결 실패 문구에 경로·주소 포함, failed 행 `error_message`에 원인 남기기, run step이 `collect_data`에 머무는 문제.

## 3. 나중에 천천히

### 3-2. 테스트 날짜 고정 제거

- [ ] `target-processing.ts`의 `DAILY_CORE_TEST_DATE`(지금 2026-10-19) 제거.

### 3-3. 품질 개선

순서: 평가 세트 → 모델 비교 → 개별 문제. 평가 세트 없이 고치면 판단 못 함.

- [ ] 평가 세트: 2026-10-09 + 성격 다른 평일 3일. `evaluate: true`(current 안 바꿈) + 러너(날짜×3회, 지표 최소/중앙/최대). 상세는 이전 TODO·`daily-core-agent-split.md` 참고.
- [ ] 모델 교체 비교: 평가 세트 뒤에. Workers AI(Structurer부터) / `gpt-5.4-nano` / `gpt-6-sol`.
- [ ] Interpreter 남은 문제: overview에서 중요 항목 빠짐, 첫 제출의 묶기 부족, 제목·key 품질(티켓 번호, 「完了」 오용).
- [ ] 입력 개선: GitHub Slack 앱 게시물 빈 본문(attachments/blocks 펼치기), Redmine 봇 알림의 티켓 목록을 보강용으로만 붙이기.
- [ ] SignalExtractor: `pipeline_options` 마이그레이션 적용, 다른 날짜로 유무 비교, v6 확인, 간접 호칭 이름 연결.
- [ ] 남은 품질 문제: 실행마다 덮는 범위 흔들림, member_activity 빠지는 사람, 겹침·나뉨·배치, 사람 대응표(Slack↔GitHub), `medium` 재비교.

### 3-4. 구조와 스키마 정리

- [ ] contracts 맞추기(`DailyCoreAnalysisFields` ↔ Worker 출력), 안 쓰는 테이블·step enum 정리.
- [ ] Skill / Subagent 필요 여부: 평가 세트로 반복 약점이 보이면 판단. 지금은 만들지 않음.

#### 분류 전용 Agent (tags / entities) — B안 (Structurer 병렬 → projection에서 합쳐 INSERT)

방향(사용자, 2026-10-21·23): core_json에는 안 넣고, Structurer와 병렬로 tagger 돌린 뒤 `coreItemRows`가 tags/classifications/entities/`semantic_text`를 처음부터 채워 INSERT. UPDATE 방식(A안)은 안 씀.

- [ ] B0: 분류 체계(고정 목록) 정하고 `TAXONOMY_VERSION` 이름. tags 상한·금지 규칙.
- [ ] B1: `core-tagger` 에이전트. 입력은 Interpreter core item(`concept_key`, title, summary). 출력은 `concept_key → {tags, classifications, entities}`. 실패해도 빈 값. DO migration 1줄.
- [ ] B2: projection 합치기 — Structurer가 묶은 entry는 tags/entities 합집합. GIN 인덱스는 값이 쌓일 때.
- [ ] B3(선택): entities 티켓·PR은 코드 정규식으로 선추출해 tagger 힌트로.

## 4. 순서 미정

- [ ] 4-1. Cron 연결(매일 자동 수집·생성). Vercel 배포 뒤에.
- [ ] 4-2. fetch 실패 구분(`partial`).

# 끝난 것

## 1. 지금 우선

### 1-2. daily_core_items 채우기 (projection)

- [x] projection 코드: `coreItemRows` + `/core/generate` 저장 직후 기록. 실패해도 Core 성공, `validation_json.projection`.
- [x] `importance` → `numeric` 마이그레이션(`0047`) 적용 + typegen.
- [x] 실측(2026-10-23): `/core/generate` 후 `daily_core_items`에 highlight/topic/member_activity 등 적재 확인(예: core_date 2026-10-22, generation `c8298ccb-…`).

## 3. 나중에 천천히

### 3-4. 구조와 스키마 정리

- [x] core_json v2(`daily-core-v2`): evidence를 최상위 맵으로 정규화하고 URL은 `sources` 링크 베이스로 조립, 빈 보조 필드는 생략. 실데이터 84.6K → 41.4K, 리포트 출력 동일. `W43.md` 2026-10-20.
- [x] URL 생략 판정을 항목 단위로 보강: 재조립 결과와 원본이 다르면 URL 유지. `W43.md` 2026-10-20.
