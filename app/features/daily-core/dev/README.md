# Daily Core Dev Docs

이 디렉토리의 번호 문서는 Daily Core를 짜기 전의 설계다. 구현된 파이프라인은 `flue/README.md`가 맞다. SignalExtractor는 target 옵션일 때만 돌고, CoreTagger는 Structurer와 동시에 돌며, 태그는 `daily_core_items`에만 들어간다.

설계를 읽을 때는 다음 순서를 쓴다.

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

## 설계 당시의 방향

아래는 구현 전에 적어 둔 방향이다. 호출 수와 태그의 위치는 그 뒤 바뀌었다.

- `1 Target x 1 Local Date = 1 Daily Core`
- DB schema는 이미 초안 완료
- LLM은 3단계 Agent 구조로 실행
- quality / meta / computed metrics / validation은 Pipeline이 담당
- 최종 저장물은 `core_json`과 projection data다
- Agent 중간 결과는 canonical data와 분리해서 다룬다

## 설계 당시의 흐름

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
