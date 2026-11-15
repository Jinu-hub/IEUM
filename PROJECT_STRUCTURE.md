# IEUM 디렉터리

파일 단위 목록은 두지 않는다. 현재 파이프라인은 `flue/README.md`가 맞다.

```text
app/          React Router 앱. 수집, 즉시 발송, 메일. Daily Core 수집은 app/features/daily-core/
flue/         Cloudflare Worker. Core, 데일리 리포트, 주간 리포트
docs/         초기 설계(ieum-architecture.md)와 참고. 구현 설명은 flue/README.md
works/        주 단위 작업 기록과 Phase 기록. 읽는 법은 works/README.md
sample/       예전 뉴스레터 산출물. docs/legacy-newsletter-generation.md
sql/          Supabase 마이그레이션
supabase/     Supabase 설정과 Edge Function
transactional-emails/  가입·비밀번호 메일. 데일리 리포트 HTML은 flue가 만든다
```

앱은 아직 로컬이다. Worker 배포와 환경변수는 `works/env.md`, `works/vercel-deploy.md`.
