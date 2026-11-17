# W47 TODO (2026-11-16 ~ 11-22)

W46_TODO.md의 남은 것을 옮겨 시작. 한 일은 `W47.md`.

# 남은 것

## 1. 지금 우선

주간 리포트(1-5)·생성 실패 막기(코드)는 끝. 지금 손대는 것은 **1-1 재생성, 1-4**.

### 1-1. 생성 실패 막기

- [ ] 11/11 코어 재생성. 멤버 문장 수정(2026-11-13)은 저장본에 안 들어 있음.

### 1-4. 프롬프트 DB 연결 확인

- [ ] **테스트 끝나면 반드시 원복**: `flue/.dev.vars`의 `PROMPTS_SUPABASE_URL` / `KEY` 주석 해제 + 로컬 Worker 재시작. 원복 전에 최종 지시문을 DB에 새 버전으로 넣을지 정함.
- [ ] 프롬프트 DB 데이터 넣기(`services` ieum, `agents`에 core-tagger 포함, 코드 기본값 지시문을 v1로, `prompt_releases` default). DB의 `core-interpreter` 지시문은 입력 설명 문단(`RAW_INPUT`)이 코드와 글자 그대로여야 함.
- [ ] 로컬에서 `/core/generate`, `/report/generate`로 `prompt_version` 확인 후 배포(`wrangler secret put`).

## 2. Daily Report 후속

경과는 `works/daily-report.md`.

- [ ] 앱 Vercel 첫 배포(`works/vercel-deploy.md`).
- [ ] 시크릿 노출 정리: GitHub 토큰 로그 평문(`github/run.ts`), 루트 `.env` 형식 깨진 줄. 이미 찍힌 토큰 교체 여부 결정.
- [ ] 메일 HTML 실제 클라이언트 확인(Gmail/Outlook, 다크 모드, 모바일 폭).
- [ ] IEUM 도메인 확정 후: 발송 도메인을 임시 `mail.linkverse.app`에서 IEUM으로 이전 + 리포트 아이콘을 `assets.<IEUM 도메인>`에서 서빙(`daily-report.ts`의 `ICONS` 한 줄). 그때까지는 jsDelivr(@main)라 Resend 이미지 도메인 경고가 남음.
- [ ] Finalizer v3 실행 확인(합치기·나누기를 하는지, 대비책 경고가 보이는지).
- [ ] 리포트 내용: Writer의 "Minor may be left out", `#77`처럼 바뀌는 티켓 표기, highlight/topics 겹침(#22540).
- [ ] 실패 기록 개선: Worker 연결 실패 문구에 경로·주소 포함, failed 행 `error_message`에 원인 남기기, run step이 `collect_data`에 머무는 문제.

## 3. 나중에 천천히

### 3-2. 테스트 날짜 고정 제거

- [ ] `target-processing.ts`의 `DAILY_CORE_TEST_DATE` 제거.

### 3-3. 품질 개선

- [ ] 주간 리포트 문장 품질(분류별 토픽·Writer). 형태는 2026-11-11에 확인함.
- [ ] 평가 세트: 2026-10-09 + 성격 다른 평일 3일. `evaluate: true` + 러너.
- [ ] 모델 교체 비교: 평가 세트 뒤에.
- [ ] Interpreter 남은 문제: overview에서 중요 항목 빠짐, 첫 제출의 묶기 부족, 제목·key 품질.
- [ ] 입력 개선: GitHub Slack 앱 빈 본문, Redmine 봇 티켓 목록 보강용.
- [ ] SignalExtractor: `pipeline_options` 마이그레이션, 비교, 간접 호칭.
- [ ] 남은 품질 문제: 범위 흔들림, 겹침·나뉨, 사람 대응표, `medium` 재비교. member_activity 문장이 남의 일을 넣는 건 2026-11-13에 고침(코드가 제목만 이어 붙임).

### 3-4. 구조와 스키마 정리

- [ ] contracts 맞추기, 안 쓰는 테이블·step enum 정리.
- [ ] Skill / Subagent 필요 여부: 평가 세트 뒤에.

## 4. 순서 미정

- [ ] 4-1. Cron 연결. Vercel 배포 뒤에.
- [ ] 4-2. fetch 실패 구분(`partial`).

# 끝난 것

### 1-1. 생성 실패 막기

- [x] Writer: highlights 밖 `quote_ids`를 `withoutStrayQuotes`로 비우고 검사(2026-11-17).
- [x] Structurer: 같은 사람 `member_activity`는 `mergeMemberActivity`로 합쳐 통과. 제출 경로는 빈 배열 + `scopeMemberActivity`(2026-11-17).
- [x] Interpreter: 제출 전 `revise_interpretation`은 upsert를 첫 제출로 살림. 빈 upsert는 안내만(반려 아님)(2026-11-17).

### 1-5. 주간 리포트

- [x] 분류별 토픽 남은 확인: coordination→Decision 라벨, Other 묶음, 「今週の注目の動き」와 겹침. 형태는 괜찮음(2026-11-11). 문장 품질은 3-3으로 남김(2026-11-17).
