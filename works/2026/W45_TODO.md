# W45 TODO (2026-11-03 ~ 11-09)

W44_TODO.md의 남은 것을 옮겨 시작. 한 일은 `W45.md`.

# 남은 것

## 1. 지금 우선

순서: 요점화(1-6) 끝(2026-11-07) → **주간 리포트(1-5)**. 분류 B안·items/metrics는 W43에서 끝. 실측(entities) 확인됨(2026-10-31).

### 1-1. 생성 실패 막기

- [ ] Writer: highlights 밖 `quote_ids`를 반려 말고 `withoutStrayQuotes`처럼 비우고 검사.
- [ ] Structurer: 같은 사람 member_activity entry 2개를 반려 말고 코드가 합침(`core_item_ids` 합집합).
- [ ] Interpreter: 제출 전 수정 도구 호출로 반려가 쌓이면 대비책이 없어 그날 Core가 실패함. 받은 출력은 살리는 쪽으로.

### 1-4. 프롬프트 DB 연결 확인

- [ ] **테스트 끝나면 반드시 원복**: `flue/.dev.vars`의 `PROMPTS_SUPABASE_URL` / `KEY` 주석 해제 + 로컬 Worker 재시작. 원복 전에 최종 지시문을 DB에 새 버전으로 넣을지 정함.
- [ ] 프롬프트 DB 데이터 넣기(`services` ieum, `agents`에 core-tagger 포함, 코드 기본값 지시문을 v1로, `prompt_releases` default). DB의 `core-interpreter` 지시문은 입력 설명 문단(`RAW_INPUT`)이 코드와 글자 그대로여야 함.
- [ ] 로컬에서 `/core/generate`, `/report/generate`로 `prompt_version` 확인 후 배포(`wrangler secret put`).

### 1-5. 주간 리포트 (요점화 뒤)

구성·Phase는 `works/weekly-report.md`. 한 Phase 확인 후 다음.

- [x] Phase 1. `weeklyInput` — highlight + metrics. 렌더 없음. 실측 주: 11/02~11/08.
- [ ] Phase 2. 코드 렌더 — 헤더, 지표 합, 날짜별 주목. LLM 0.
- [ ] Phase 3. 병합 에이전트 1단 + `(날짜, item_key)` 검사.
- [ ] Phase 4. 이번 주의 움직임(상한 7) + 아직 열린 것. 날짜별은 접기.

## 2. Daily Report 후속

경과는 `works/daily-report.md`.

- [ ] 앱 Vercel 첫 배포(`works/vercel-deploy.md`).
- [ ] 시크릿 노출 정리: GitHub 토큰 로그 평문(`github/run.ts`), 루트 `.env` 형식 깨진 줄. 이미 찍힌 토큰 교체 여부 결정.
- [ ] 메일 HTML 실제 클라이언트 확인(Gmail/Outlook, 다크 모드, 모바일 폭).
- [ ] IEUM 도메인 확정 후: 발송 도메인을 IEUM으로 이전 + 리포트 아이콘을 `assets.<IEUM 도메인>`에서 서빙(`daily-report.ts`의 `ICONS` 한 줄). 그때까지는 jsDelivr(@main)라 Resend 이미지 도메인 경고가 남음.
- [ ] Finalizer v3 실행 확인(합치기·나누기를 하는지, 대비책 경고가 보이는지).
- [ ] 리포트 내용: Writer의 "Minor may be left out", `#77`처럼 바뀌는 티켓 표기, highlight/topics 겹침(#22540).
- [ ] 실패 기록 개선: Worker 연결 실패 문구에 경로·주소 포함, failed 행 `error_message`에 원인 남기기, run step이 `collect_data`에 머무는 문제.

## 3. 나중에 천천히

### 3-2. 테스트 날짜 고정 제거

- [ ] `target-processing.ts`의 `DAILY_CORE_TEST_DATE` 제거.

### 3-3. 품질 개선

- [ ] 평가 세트: 2026-10-09 + 성격 다른 평일 3일. `evaluate: true` + 러너.
- [ ] 모델 교체 비교: 평가 세트 뒤에.
- [ ] Interpreter 남은 문제: overview에서 중요 항목 빠짐, 첫 제출의 묶기 부족, 제목·key 품질.
- [ ] 입력 개선: GitHub Slack 앱 빈 본문, Redmine 봇 티켓 목록 보강용.
- [ ] SignalExtractor: `pipeline_options` 마이그레이션, 비교, 간접 호칭.
- [ ] 남은 품질 문제: 범위 흔들림, member_activity, 겹침·나뉨, 사람 대응표, `medium` 재비교.

### 3-4. 구조와 스키마 정리

- [ ] contracts 맞추기, 안 쓰는 테이블·step enum 정리.
- [ ] Skill / Subagent 필요 여부: 평가 세트 뒤에.

#### 분류 전용 Agent (tags / entities) — B안

- [x] B0~B3 (W43). item_type other 없음.
- [x] 실측: contextual ticket name + person entities 확인(2026-10-31).

## 4. 순서 미정

- [ ] 4-1. Cron 연결. Vercel 배포 뒤에.
- [ ] 4-2. fetch 실패 구분(`partial`).

# 끝난 것

### 1-6. 요점화 (highlight 엄밀 + 리포트 others)

item_type에 other 추가 안 함. importance 세분화(1~10) 안 함. 장부는 유지, 읽는 면만 줄임.

- [x] P1: `refineHighlights` — Structurer 뒤 코드로 highlight 최대 5·importance≥4 우선, 초과는 roles 따라 topic/progress 강등. `validation_json.stats`에 demoted 기록.
- [x] P2: 리포트 main/others — topic·progress는 importance≥0.8 중 섹션별 상한, 나머지 others. Writer/Finalizer 입력은 main만. HTML `<details>` 기본 접기(+ markdown 그 외 절).
- [x] P3: Interpreter importance 4 루브릭 좁히기(일상 완료·진행은 3). `core-interpreter-v13`.
- [x] P4: `/core/generate`·`/report/generate` 실측(highlight ≤5·others 접힘·0.8 과밀 완화). 사용자 확인(2026-11-07).

(W44에서 끝난 항목은 W44_TODO에 남김)
