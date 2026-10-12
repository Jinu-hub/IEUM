# Vercel 앱 배포 TODO

IEUM 앱(React Router)을 Vercel에 처음 배포한다. 지금까지 앱은 로컬(`npm run dev`)에서만 돌았고, Cloudflare Worker(`ieum-flue`)만 배포되어 있다.

Daily Report 계획(`works/daily-report.md`)의 Phase 4에서 분리함(사용자, 2026-10-11): IEUM으로서 첫 배포라 도메인 확보 등 별도 작업이 많음. Daily Report Phase 4는 Worker 배포와 앱 쪽 예전 경로 정리만 하고, 확인은 로컬 앱을 배포된 Worker에 붙여서 함.

규칙

- `works/README.md`와 같다: 끝난 항목은 `[x]`, 필요 없어진 항목은 지움. 결정과 이유를 남김.
- 환경변수 값은 여기에 적지 않는다(이름과 용도만, 자세한 건 `works/env.md`).

선행

- [x] Daily Report Phase 4 끝남(2026-10-11): Worker 배포본(`9ffc1d15…`)에 `/core/generate`·`/report/generate`가 있고, 로컬 앱 + 배포본으로 즉시 발송·하루 1통 확인. `TestAgent`는 배포 확인·실험용으로 남김.

---

## 1. 프로젝트와 도메인

- [ ] Vercel 프로젝트 만들기, GitHub `Jinu-hub/IEUM`(`main`) 연결. `main` push가 자동 배포가 되는지(되게 할지) 정함. 지금은 `main`에 push해도 아무 데도 배포되지 않음.
- [ ] 도메인 확보와 DNS 연결.
- [ ] 도메인이 들어가는 설정을 모두 새 주소로:
  - 앱 `SITE_URL`(사이트맵 등에서 사용).
  - Supabase Auth의 Site URL / Redirect URLs.
  - Slack 앱의 OAuth redirect(`SLACK_REDIRECT_URI`)와 이벤트 URL(있으면).
  - GitHub App의 callback / webhook URL(`GITHUB_WEBHOOK_SECRET`을 쓰는 경로).
  - 결제 webhook(Stripe `STRIPE_WEBHOOK_SECRET`, Toss)이 있으면 그 URL.
- [ ] 메일 발신 도메인: 지금 `info@mail.nexone.ink`(Resend). 새 도메인으로 바꿀지 정함(바꾸면 Resend 도메인 인증·DNS).

## 2. 빌드 설정

- [ ] `react-router.config.ts`는 `VERCEL_ENV === "production"`일 때만 `vercelPreset()`을 씀. Preview 배포에서도 같은 빌드가 되는지 확인.
- [ ] Sentry 소스맵 업로드는 `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN`이 있을 때만. 넣을지 정함.
- [ ] 첫 배포 성공, 정적 페이지(`/pricing` 등 prerender)와 로그인 화면이 열림.

## 3. 환경변수

루트 `.env`에 있는 이름 기준. 테스트용(`*_TEST_USER_EMAIL` 등)과 로컬 스크립트용(`OUT_DIR`, `FETCH_DAYS`, `GITHUB_REPOS`, `SLACK_CHANNEL_IDS` 등)은 빼고, 앱이 런타임에 쓰는 것만 옮김.

- [ ] 앱 기본: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `COOKIE_SECRET`, `SITE_URL`, `VITE_*`(빌드 시점에 들어감).
- [ ] 연동: `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` / `SLACK_REDIRECT_URI`, `GITHUB_APP_*` / `GITHUB_CLIENT_SECRET` / `GITHUB_WEBHOOK_SECRET`, `RESEND_API_KEY`, 결제(`STRIPE_*`, `TOSS_PAYMENTS_SECRET_KEY`), 캡차(`HCAPTCHA_SECRET_KEY`, `TURNSTILE_SECRET_KEY`), `CRON_SECRET`, `OPENAI_API_KEY`, Sentry.
- [ ] Daily Report 경로:
  - `FLUE_BASE_URL=https://ieum-flue.jinu30dev.workers.dev`(끝 `/` 없이).
  - `FLUE_API_TOKEN`: Worker 시크릿과 같은 값.
  - `SLACK_NOTIFY=0`: 당분간 팀 Slack 채널 알림을 끔(Daily Report Phase 4 결정과 같음). 켤 때 지움.
  - 넣지 않음: `DAILY_MAIL_FORCE`(테스트용, 넣으면 모든 Target이 하루 1통 제한 없이 보냄), `CRON_RECORD`(넣으면 기록과 하루 1통 제한이 꺼짐), `FLUE_AGENT_URL`(Daily Report Phase 4에서 없앰, 앱에서 읽는 곳 없음).
- [ ] `SLACK_BOT_TOKEN`: 아래 4의 결과에 따라. 로컬은 integration 시크릿 조회가 실패해서 이 값으로 대신 돌았음.
- [ ] 환경변수를 바꾼 뒤에는 재배포해야 반영됨.

## 4. 배포 환경에서만 확인할 수 있는 것

- [ ] Slack 토큰 조회: 수집은 `getSlackBotToken`(Supabase Edge Function `manage-secrets`로 integration 시크릿 조회)을 먼저 씀. 로컬에서는 이게 실패(`Failed to get secret`, `FunctionsHttpError`)해서 `.env`의 `SLACK_BOT_TOKEN`으로 대신 받아 왔음(`works/daily-core-e2e.md` Phase 1). 배포본에서 시크릿 조회가 되는지, 안 되면 원인(Edge Function 배포·권한)을 고칠지 `SLACK_BOT_TOKEN`을 넣을지 정함.
- [ ] 함수 시간: 즉시 발송은 클라이언트가 `POST /api/cron/send-now/run`을 부르고 그 안에서 수집 → Core → 리포트 → 메일을 순차로 함. 로컬 52초(수집 10, Core 30, 리포트 10.5, 메일 1.4). Vercel은 Fluid compute(300초 이상, 사용자 2026-10-11)라 들어갈 것으로 봄. 배포본에서 실측. 넘거나 아슬아슬하면 Worker가 Core 뒤에 리포트까지 이어서 하고 앱은 결과만 받는 방식으로 바꿈.
- [ ] 즉시 발송 1회(배포본): 메일 도착, `newsletter_editions`(`daily_core_id` / `daily_report_id` 채워짐), `newsletter_runs.metrics_json`, Cloudflare 로그에 error 없음.
  - 테스트 날짜가 아직 `2026-10-09`로 고정이면 그날은 이미 보냈으므로 건너뜀. 이 시점까지 날짜 고정 제거(W41 TODO 3-2)를 할지, 확인할 날짜를 어떻게 할지 정함. 배포 환경에 `DAILY_MAIL_FORCE`는 넣지 않음.
- [ ] 같은 날짜로 다시 누르면 건너뜀(하루 1통).

## 5. 이 문서에 넣지 않은 것 (관련)

- Cron 연결(매일 자동 수집·생성): W41 TODO 4-1. Vercel 배포 뒤에 할 일이지만 별도. 붙일 때 `CRON_SECRET`과 스케줄 방식(Vercel Cron / 외부)을 정함.
- 실제 수신자로 바꾸기: 지금 `sendMails`는 수신자가 테스트 주소(`takefree.withu@gmail.com`, bcc `son@digitalsheep.co.jp`)로 고정. 하루 1통 보장은 이미 있음.
- 메일 HTML 디자인 고도화: W41 TODO 2.

---

## 확인 기록
