# Daily Core Pipeline Architecture

## Goal

Daily Core 생성은 단일 Prompt가 아니라, 3개의 LLM Agent와 deterministic Pipeline merge로 구성한다.

핵심 원칙:

- AI는 의미 해석과 구조화만 담당
- Pipeline은 meta / metrics / quality / evidence / validation을 담당
- Agent 결과와 Canonical 저장 결과를 분리

---

## High-level Flow

```text
Normalized Sources
        │
        ▼
┌──────────────────────┐
│ Agent 1              │
│ Signal Extractor     │
└──────────┬───────────┘
           │
           │ candidate_signals
           ▼
┌──────────────────────┐
│ Agent 2              │
│ Core Interpreter     │
└──────────┬───────────┘
           │
           │ interpreted_core
           ▼
┌──────────────────────┐
│ Agent 3              │
│ Core Structurer      │
└──────────┬───────────┘
           │
           │ daily_core_analysis
           ▼
┌──────────────────────┐
│ Pipeline Merge       │
│ + computed data      │
│ + metadata           │
└──────────┬───────────┘
           ▼
      Final Result
           │
           ▼
     DB Registration
```

---

## Why Not Single Prompt

Raw Source 전체를 한 번에 넣고:

- highlights
- topics
- progress_roadmap
- member_activity

를 한 번에 만들라고 하면, 같은 사건을 여러 번 다른 배열에 중복해서 담을 위험이 높다.

예:

```text
Highlight
- Daily Core DB 구조 확정

Topic
- Daily Core DB 설계

Progress
- Daily Core DB 설계 완료
```

실제로는 하나의 사건인데 3개 이상의 item으로 부풀어질 수 있다.

따라서:

1. 사실 단위 추출
2. cross-source 의미 해석
3. 최종 canonical 구조 배치

를 분리해야 한다.

---

## Agent Responsibilities

### Agent 1 - Signal Extractor

역할:

- source에서 의미 있는 사실 단위 signal 추출
- 결정 / 진행 / 문제 / 계획 / 기여 발견
- evidence_refs 연결

하지 않는 일:

- 최종 highlight/topic/progress 판정
- quality 판정
- meta/metrics 생성

### Agent 2 - Core Interpreter

역할:

- signal merge
- cross-source dedup
- 같은 사건인지 판단
- 중요도 판단
- 의미 단위 해석

하지 않는 일:

- 최종 canonical 배열 배치
- source metadata 생성
- quality/meta/metrics 생성

### Agent 3 - Core Structurer

역할:

- overview 작성
- highlights / topics / progress_roadmap / member_activity 배치
- 배열 간 의미 중복 억제
- 최종 item_key 정리
- payload 구조화

하지 않는 일:

- raw source 재해석
- deterministic metadata 생성
- quality/meta/metrics 생성

---

## Pipeline Responsibilities

Pipeline은 LLM이 아니라 deterministic code로 처리한다.

### Pipeline이 반드시 담당하는 값

- `schema_version`
- `meta`
- `quality`
- computed metrics
- generation info
- prompt/model/pipeline version
- token usage
- validation
- hashes
- evidence object
- semantic_text
- projection payload

### Reason

이 값들은:

- 이미 코드가 알고 있거나
- source fetch 결과로 결정 가능하거나
- validation/운영 데이터이기 때문이다.

AI가 판단할 이유가 없다.

---

## Evidence Strategy

Agent는 evidence를 직접 생성하지 않는다.

입력:

```json
{
  "source_ref": "S001",
  "source_type": "slack_channel",
  "source_ident": "C123456",
  "source_item_id": "1755398492.123456",
  "occurred_at": "2026-08-17T03:15:22Z",
  "content": "Daily Core DB 구조를 확정했습니다."
}
```

Agent 출력:

```json
{
  "evidence_refs": ["S001"]
}
```

Pipeline merge:

```text
S001
  ↓
normalized source lookup
  ↓
final evidence object
```

이렇게 하면 LLM이 `source_item_id`나 URL을 잘못 복사하는 문제를 줄일 수 있다.

---

## Metrics Strategy

기본 원칙:

```text
AI -> 의미 데이터
Pipeline -> 숫자 데이터
```

### Computed Metrics

예:

- `slack_message_count`
- `github_commit_count`
- `github_pr_count`
- `source_item_count`
- `member_message_count`

### AI Metrics

가능하면 v1에서는 최소화한다.

예를 들어:

- `highlights.length`
- `topics.length`
- `progress_roadmap.length`

는 Agent가 숫자로 반환할 필요 없이 Pipeline이 최종 결과에서 계산하면 된다.

---

## Quality Strategy

quality도 AI가 아니라 Pipeline이 결정한다.

예:

```text
Slack success
GitHub failed
Notion success
→ partial
```

즉 quality는 source coverage와 usable input의 함수다.

권장 형태:

```json
{
  "quality": {
    "status": "partial",
    "warnings": [
      "github source collection failed"
    ]
  }
}
```

---

## Intermediate vs Canonical

### Intermediate

- Agent 1 result
- Agent 2 result
- Agent 3 result

이 값들은 분석 과정의 산출물이다.

### Canonical

- 최종 `core_json`
- `daily_core_items`
- `daily_core_metrics`

이 값들은 제품과 후속 파이프라인에서 읽는 최종 데이터다.

### Rule

Intermediate analysis result를 canonical JSON 내부에 반드시 넣을 필요는 없다.

다만 runtime return 또는 debug artifact로는 유지할 수 있다.

---

## Recommended Return Shape

Pipeline 최종 반환은 다음 정도가 적절하다.

```ts
type DailyCorePipelineResult = {
  core_json: unknown;

  projection_payloads: {
    items: unknown[];
    metrics: unknown[];
    source_snapshots: unknown[];
  };

  agent_results: {
    signal_extraction: unknown;
    core_interpretation: unknown;
    core_structuring: unknown;
  };

  diagnostics: {
    computed_metrics: Record<string, unknown>;
    quality: {
      status: "ready" | "partial" | "empty";
      warnings?: string[];
    };
  };
};
```

---

## Implementation Notes

### Call Count

초기 v1 권장:

- Call 1: Signal Extraction + Core Interpretation
- Call 2: Core Structuring

즉 logical role은 3개지만 실제 API 호출은 2회로 시작할 수 있다.

이후 필요하면 완전한 3-call 구조로 분리한다.

### Important Principle

Daily Core의 핵심은:

```text
많이 담는 것보다
무엇을 버리고
무엇을 보존할지
일관되게 결정하는 것
```

이다.
