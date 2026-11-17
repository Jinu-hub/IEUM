# IEUM 작업 컨텍스트

IEUM은 팀의 Slack·GitHub 활동을 Daily Core로 보존하고 일간·주간 리포트로 만드는 프로젝트다. 현재 작업 방향은 **Flue 에이전트별 결과 품질 개선**이다.

## 먼저 읽을 것

- 품질 작업: [docs/agent-quality-context.md](docs/agent-quality-context.md). 단계별 책임, 평가 기준, 실험 방법, 코드 위치를 정리했다.
- 현재 파이프라인: [flue/README.md](flue/README.md).
- 최신 결정·미해결 과제: `works/<ISO 연도>/W<주차>.md`, `W<주차>_TODO.md`. 작성 규칙은 [works/README.md](works/README.md).
- 전체 위치: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).

## 작업 원칙

- 구현 사실은 코드를 우선한다. 초기 설계 문서, 과거 실험 결과, TODO의 계획을 현재 동작으로 단정하지 않는다.
- 품질 문제는 원문 → 정규화 입력 → Agent 출력 → 코드 보정 → 리포트 순으로 추적하고, 정보가 처음 잘못된 단계에서 고친다.
- Agent 프롬프트는 `flue/src/agents/`에 있으나 프롬프트 DB가 덮어쓸 수 있다. 비교할 때 실제 `promptVersion`, 모델, 추론 강도, 입력을 확인한다.
- 출력 스키마와 검증·보정은 주로 `flue/src/daily-core.ts`, `daily-report.ts`, `weekly-*.ts`에 있다. 문장 문제를 고치면서 출력 계약을 무심코 바꾸지 않는다.
- 링크·HTML·상태 아이콘·인용 원문·활동 수치는 코드가 붙인다. 모델은 근거에 기반한 해석·배치·문장을 담당한다.
- 생성 성공, 참조 유효성, 의미 품질을 구분한다. 동일 입력의 변경 전후 결과와 실패 사례를 함께 남긴다.
- 실험 원문·산출물은 기존 `works/out/`을 사용한다(Git 제외). 시크릿과 팀 원문을 공유 컨텍스트에 복사하지 않는다.
- 의사결정과 이유는 현재 주차 작업 기록에 한국어로 남긴다. 기록 전 `date +%G/W%V`로 주차를 확인한다.

## 실행 경계

- 루트 앱과 `flue/` Worker는 별도 패키지다. 둘 다 `npm run dev`이므로 실행 디렉터리를 확인한다.
- 규칙 검사는 `*.check.ts`, 타입 검사는 루트 `npm run typecheck`, Worker는 `npx tsc --noEmit -p flue/tsconfig.json`.
- `/core/agent`는 저장된 입력을 읽어 단일 Core Agent를 시험하며 애플리케이션 DB에 결과를 쓰지 않는다. 모델 호출은 발생한다.
- `/core/generate`는 generation과 current를 바꾸고, `/report/generate`는 report를 저장한다. 앱의 즉시 발송은 메일·Slack 알림까지 이어진다. 평가 실행과 실제 발송을 구분한다.
