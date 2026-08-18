# Daily Core Dev Docs

이 디렉토리는 Daily Core 기능 구현을 위한 개발 문서를 모아둔 공간이다.

현재 문서는 다음 순서로 읽는 것을 권장한다.

1. `01-scope-and-window.md`
   - 처리 대상 Target 판정
   - `core_date` 의미
   - local date 기준 data window
   - source/time normalization 원칙

2. `02-pipeline-architecture.md`
   - 전체 Daily Core 생성 흐름
   - Agent 1 / 2 / 3 역할
   - Pipeline merge 책임 경계

3. `03-agent-contracts.md`
   - Agent 입출력 스키마 초안
   - normalized source item
   - candidate signal
   - interpreted core item
   - final AI analysis fields

4. `04-phase-plan.md`
   - 실제 구현 phase
   - 단계별 목표 / 산출물 / 완료 조건

## Current Direction

Daily Core는 다음 원칙으로 구현한다.

- `1 Target x 1 Local Date = 1 Daily Core`
- DB schema는 이미 초안 완료
- LLM은 3단계 Agent 구조로 실행
- quality / meta / computed metrics / validation은 Pipeline이 담당
- 최종 저장물은 `core_json`과 projection data다
- Agent 중간 결과는 canonical data와 분리해서 다룬다

## High-level Flow

```text
Target + core_date
        ↓
Source Collection
        ↓
Normalization
        ↓
Agent 1: Signal Extraction
        ↓
Agent 2: Core Interpretation
        ↓
Agent 3: Core Structuring
        ↓
Pipeline Merge
        ↓
Validation
        ↓
DB Registration
```

## Notes

- Daily Core의 목적은 "예쁜 요약"보다 "재사용 가능한 하루 단위 사건 보존"이다.
- Weekly / Monthly / Historical Memory의 입력으로 쓰이는 것을 전제로 한다.
- 따라서 AI가 모든 것을 만들게 하지 않고, deterministic하게 결정 가능한 값은 최대한 Pipeline에서 처리한다.
