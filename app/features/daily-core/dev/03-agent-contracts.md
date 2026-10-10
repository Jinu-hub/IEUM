# Daily Core Agent Contracts

## Goal

이 문서는 Agent 1 / 2 / 3과 Pipeline merge 사이의 입출력 계약을 정의한다.

중요한 점:

- 상세 프롬프트는 아직 포함하지 않는다
- 먼저 구조 계약을 고정한다
- 프롬프트는 이 계약을 따르는 구현 디테일이다

---

## Contract 1. NormalizedSourceItem

Pipeline이 Agent 1에 넘기는 기본 입력 단위다.

```ts
export type NormalizedSourceItem = {
  source_ref: string;

  source_type: "slack_channel" | "github_repo" | "notion_page" | "jira_issue";
  source_ident: string;
  source_item_id: string;

  occurred_at: string;

  author?: {
    id?: string;
    name?: string;
  };

  title?: string | null;
  content: string;
  url?: string | null;

  thread_ref?: string | null;
  parent_ref?: string | null;

  entities?: Array<{
    type: string;
    name: string;
    ident?: string;
  }>;

  tags?: string[];

  meta?: Record<string, unknown>;
};
```

### Rules

- `source_ref`는 Agent가 evidence를 선택하는 유일한 키다
- Agent는 `source_item_id`, `url`을 다시 작성하지 않는다
- `occurred_at`는 provider 공통 시간 기준이다

---

## Contract 2. CandidateSignal

Agent 1의 출력이자 Agent 2의 입력이다.

```ts
export type CandidateSignal = {
  signal_id: string;

  signal_type:
    | "decision"
    | "progress"
    | "issue"
    | "risk"
    | "plan"
    | "discussion"
    | "achievement"
    | "activity"
    | "other";

  title: string;
  summary: string;

  actors: Array<{
    type: "member" | "team" | "system" | "other";
    name: string;
    ident?: string;
  }>;

  entities: Array<{
    type: string;
    name: string;
    ident?: string;
  }>;

  tags: string[];

  evidence_refs: string[];
};
```

### Meaning

이 단계는 아직:

- highlight인지
- topic인지
- progress인지

최종 판정하지 않는다.

그저 하루 동안 발생한 의미 있는 사실 단위를 뽑아낸다.

---

## Contract 3. Agent 1 Input

```ts
export type SignalExtractorInput = {
  target: {
    target_id: string;
    target_display_name: string;
    target_category: string;
    language: "ko" | "en" | "ja";
  };

  window: {
    core_date: string;
    window_start_at: string;
    window_end_at: string;
    timezone: string;
  };

  sources: NormalizedSourceItem[];
};
```

## Contract 4. Agent 1 Output

```ts
export type SignalExtractorOutput = {
  signals: CandidateSignal[];
};
```

---

## Contract 5. InterpretedCoreItem

Agent 2의 출력이자 Agent 3의 입력이다.

```ts
export type InterpretedCoreItem = {
  core_item_id: string;

  concept_key: string;

  title: string;
  summary: string;

  importance: 1 | 2 | 3 | 4 | 5;
  confidence: number;

  roles: Array<"highlight" | "topic" | "progress" | "member_activity">;

  status?: "planned" | "in_progress" | "blocked" | "completed" | "unknown";

  tags: string[];

  classifications: {
    primary: string;
    secondary: string[];
    attributes: Record<string, unknown>;
  };

  entities: Array<{
    type: string;
    name: string;
    ident?: string;
  }>;

  actors: Array<{
    type: "member" | "team" | "system" | "other";
    name: string;
    ident?: string;
  }>;

  evidence_refs: string[];

  progress?: {
    from?: string;
    to?: string;
    next_step?: string;
  };

  notes?: string[];
};
```

### Meaning

이 단계에서 핵심은:

- 같은 사건인지
- 중요한지
- 어떤 역할을 가질 수 있는지

를 의미적으로 해석하는 것이다.

`roles`는 후보 역할이다.
최종 canonical 배열 배치는 Agent 3가 수행한다.

---

## Contract 6. Agent 2 Input

```ts
export type CoreInterpreterInput = {
  target: {
    target_id: string;
    target_display_name: string;
    target_category: string;
  };

  signals: CandidateSignal[];

  known_items?: Array<{
    concept_key: string;
    title: string;
  }>;
};
```

## Contract 7. Agent 2 Output

```ts
export type CoreInterpreterOutput = {
  overview_candidate: {
    summary: string;
  };

  core_items: InterpretedCoreItem[];
};
```

---

## Contract 8. Agent 3 Output Item Shape

Agent 3는 최종 canonical JSON 중 AI 담당 부분만 반환한다.

```ts
export type DailyCoreAnalysisItem = {
  item_key: string;

  title: string;
  summary: string;

  status?: string | null;
  importance?: number | null;
  confidence?: number | null;

  tags: string[];

  classifications: {
    primary: string;
    secondary: string[];
    attributes: Record<string, unknown>;
  };

  entities: Array<{
    type: string;
    name: string;
    ident?: string;
  }>;

  evidence_refs: string[];

  payload: Record<string, unknown>;
};
```

---

## Contract 9. Agent 3 Input

```ts
export type CoreStructurerInput = {
  overview_candidate: {
    summary: string;
  };

  core_items: InterpretedCoreItem[];
};
```

## Contract 10. Agent 3 Output

```ts
export type DailyCoreAnalysisFields = {
  overview: {
    summary: string;
  };

  highlights: DailyCoreAnalysisItem[];
  topics: DailyCoreAnalysisItem[];
  progress_roadmap: DailyCoreAnalysisItem[];
  member_activity: DailyCoreAnalysisItem[];
};
```

---

## Contract 11. Pipeline Merge Output

Pipeline은 Agent 결과와 deterministic 데이터를 합쳐 최종 결과를 만든다.

```ts
export type FinalDailyCoreResult = {
  core_json: {
    schema_version: string;

    meta: {
      target_id: string;
      core_date: string;
      timezone: string;
      language: "ko" | "en" | "ja";
      target_display_name: string;
      target_category: string;
      window_start_at: string;
      window_end_at: string;
    };

    overview: {
      summary: string;
    };

    highlights: Array<{
      item_key: string;
      title: string;
      summary: string;
      status?: string | null;
      importance?: number | null;
      confidence?: number | null;
      tags: string[];
      classifications: Record<string, unknown>;
      entities: Array<Record<string, unknown>>;
      evidence: Array<{
        source_type: string;
        source_ident: string;
        source_item_id: string;
        occurred_at: string;
        url?: string | null;
        excerpt?: string | null;
      }>;
      payload: Record<string, unknown>;
    }>;

    topics: unknown[];
    progress_roadmap: unknown[];
    member_activity: unknown[];

    metrics: Array<{
      key: string;
      value: number;
      unit: string;
      origin: "computed" | "ai";
      rollup_hint: "sum" | "avg" | "max" | "min" | "last" | "none";
      dimensions?: Record<string, unknown>;
      evidence?: Record<string, unknown>;
    }>;

    quality: {
      status: "ready" | "partial" | "empty";
      warnings?: string[];
    };
  };

  projection_payloads: {
    items: unknown[];
    metrics: unknown[];
    source_snapshots: unknown[];
  };

  agent_results: {
    signal_extraction: SignalExtractorOutput;
    core_interpretation: CoreInterpreterOutput;
    core_structuring: DailyCoreAnalysisFields;
  };
};
```

---

## Contract Rules Summary

### Agent 1
- source에서 signal 발견
- evidence는 `evidence_refs`만 반환

### Agent 2
- signal merge / dedup / interpretation
- `concept_key` 중심의 semantic item 생성

### Agent 3
- canonical AI fields로 정리
- 배열 간 중복 억제

### Pipeline
- meta / metrics / quality / evidence / validation 담당
- 최종 `core_json` 생성
- projection payload 생성

---

## Open Questions

다음 항목은 구현 전에 추가 확정이 필요하다.

1. `signal_id`, `core_item_id`를 Agent가 만들지 Pipeline이 만들지
2. `concept_key`와 `item_key`를 v1에서 동일하게 둘지
3. 배열별 최대 개수 제한
4. `member_activity`에 들어갈 최소 중요도 기준
5. Agent 1/2/3을 실제 3-call로 갈지, 초기에는 2-call로 병합할지
