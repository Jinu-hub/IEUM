# Daily Core Phase Plan

## Goal

Daily Core를 한 번에 완성하려고 하지 않고, 구현 리스크가 낮은 순서대로 단계적으로 구축한다.

이 문서는:

- 어떤 phase를 어떤 순서로 진행할지
- 각 phase의 목표가 무엇인지
- 어떤 산출물이 있어야 완료인지

를 정리한다.

---

## Phase 0. DB Foundation

### Status

Done

### Scope

- `daily_core_data`
- `daily_core_generations`
- `daily_core_source_snapshots`
- `daily_core_items`
- `daily_core_metrics`
- enum / index / RLS / migration / generated types

### Exit

- schema와 migration이 존재
- 기본 query / mutation 초안 존재

---

## Phase 1. Daily Core Context Resolution

### Objective

어떤 Target의 어떤 날짜를 어떤 data window로 처리할지 deterministic하게 계산한다.

### Tasks

1. Target selection 규칙 확정
2. `core_date` 계산 규칙 확정
3. local date -> UTC window 변환 함수 정의
4. target snapshot 구성 필드 확정
5. source eligibility 규칙 확정

### Deliverables

- `resolveDailyCoreTargets()`
- `resolveDailyCoreContext()`
- `resolveDailyWindow()`

### Exit Criteria

- 같은 target/timezone/core_date 입력이면 항상 같은 context가 나온다
- `window_start_at`, `window_end_at`가 `[start, end)` 규칙을 만족한다

---

## Phase 2. Raw Collection and Normalization

### Objective

Source 데이터를 수집하고 provider 공통 이벤트 구조로 변환한다.

### Tasks

1. Source fetch abstraction 정의
2. Slack/GitHub fetch 결과의 공통 변환 규칙 정의
3. `NormalizedSourceItem` 생성
4. `source_ref` 부여 방식 확정
5. source snapshot 생성 규칙 정의
6. computed metrics의 최소 목록 선정

### Deliverables

- `collectDailyRawSources()`
- `normalizeDailySourceItems()`
- `buildSourceSnapshots()`
- `computeBaseMetrics()`

### Exit Criteria

- Source별 fetch 성공 / empty / failed가 구분된다
- 모든 normalized item에 `occurred_at`와 `source_ref`가 존재한다
- `source_snapshot` payload를 생성할 수 있다

---

## Phase 3. Agent Contract Lock

### Objective

프롬프트 작성 전에 Agent 1/2/3의 구조 계약을 먼저 고정한다.

### Tasks

1. Agent 1 input/output schema 확정
2. Agent 2 input/output schema 확정
3. Agent 3 input/output schema 확정
4. validator 기준 정의
5. open question 목록 정리

### Deliverables

- `NormalizedSourceItem`
- `CandidateSignal`
- `InterpretedCoreItem`
- `DailyCoreAnalysisFields`

### Exit Criteria

- schema 계약만 보고도 agent wrapper 구현이 가능하다
- 프롬프트를 바꿔도 계약은 유지된다

---

## Phase 4. Agent 1 Implementation

### Objective

Normalized sources에서 candidate signal을 추출한다.

### Tasks

1. Agent 1 wrapper 구현
2. input builder 작성
3. output validator 작성
4. extraction failure handling 정의
5. 기본 샘플 데이터로 결과 검토

### Deliverables

- `runSignalExtractor()`
- validator
- test fixture 또는 sample result

### Exit Criteria

- 의미 있는 사건이 `signals[]`로 추출된다
- evidence는 `evidence_refs`로만 연결된다
- 과도한 요약 대신 fact extraction 중심이 유지된다

---

## Phase 5. Agent 2 Implementation

### Objective

Candidate signal을 병합/중복 제거/해석하여 semantic core item으로 만든다.

### Tasks

1. Agent 2 wrapper 구현
2. cross-source merge 기준 정리
3. concept_key 정책 초안 정리
4. roles 부여 기준 확정
5. importance/confidence 기준 초안 정리

### Deliverables

- `runCoreInterpreter()`
- merge / dedup policy doc

### Exit Criteria

- 같은 사건이 여러 source에 있어도 하나의 의미 단위로 합쳐진다
- `overview_candidate`와 `core_items[]`가 생성된다

---

## Phase 6. Agent 3 Implementation

### Objective

Semantic core item을 최종 Daily Core AI 구조로 정리한다.

### Tasks

1. Agent 3 wrapper 구현
2. highlight/topic/progress/member_activity 경계 규칙 정리
3. item_key 정책 정리
4. payload structure 확정
5. 배열 간 중복 억제 기준 정리

### Deliverables

- `runCoreStructurer()`
- array boundary rule doc

### Exit Criteria

- Agent 3 output만 보면 final AI fields가 완결된다
- 같은 의미가 여러 배열에 중복 복사되지 않는다

---

## Phase 7. Pipeline Merge

### Objective

Agent 결과와 deterministic pipeline 데이터를 합쳐 최종 `core_json`을 만든다.

### Tasks

1. meta 주입
2. quality 판정
3. evidence_refs -> evidence object 변환
4. computed metrics 주입
5. final schema validation
6. projection payload 생성

### Deliverables

- `mergeDailyCoreResult()`
- `computeFinalQualityStatus()`
- `buildEvidenceObjects()`
- `buildProjectionItems()`
- `buildProjectionMetrics()`

### Exit Criteria

- `core_json`이 canonical schema를 만족한다
- projection insert payload를 바로 만들 수 있다

---

## Phase 8. DB Registration

### Objective

Generation 결과를 DB에 영속화한다.

### Tasks

1. `daily_core_data` create or load
2. next generation number 계산
3. generation record 생성
4. source snapshots 저장
5. items/metrics projection 저장
6. 성공 시 current generation pointer 갱신
7. 실패 시 generation failure 기록

### Deliverables

- `prepareDailyCoreGeneration()`
- `persistDailyCoreGenerationResult()`
- `finalizeDailyCoreGeneration()`

### Exit Criteria

- success / partial / empty / failed 흐름이 모두 DB에 반영된다
- regenerate 시 generation history가 보존된다

---

## Phase 9. Retry / Regenerate / Backfill

### Objective

운영 단계에서 필요한 재실행 정책을 안정화한다.

### Tasks

1. generation 단위 dedupe key 정책
2. manual regenerate flow
3. backfill flow
4. late-arriving data 대응 규칙
5. rollback 기준

### Deliverables

- job key policy
- regenerate/backfill flow doc

### Exit Criteria

- 동일 날짜를 여러 번 안전하게 생성할 수 있다
- current generation 전환 규칙이 명확하다

---

## Phase 10. Validation and Operational Review

### Objective

Daily Core 결과 품질과 운영 추적성을 점검한다.

### Tasks

1. empty / partial / failed 사례 검증
2. source coverage와 quality 일관성 점검
3. evidence traceability 점검
4. agent intermediate trace 점검
5. weekly pipeline input suitability 점검

### Deliverables

- QA checklist
- sample scenario review
- debugging guideline

### Exit Criteria

- 대표 시나리오에서 결과가 기대와 일치한다
- 문제가 생겼을 때 Raw -> Signal -> Core Item -> Final Item 추적이 가능하다

---

## Suggested Implementation Order

초기 구현 권장 순서:

1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 7의 quality/evidence merge 설계 선확정
5. Phase 4
6. Phase 5
7. Phase 6
8. Phase 8
9. Phase 9
10. Phase 10

이 순서가 좋은 이유:

- 앞단 계약을 먼저 고정하면 프롬프트를 늦게 다듬어도 된다
- merge와 DB registration 기준을 먼저 잡아두면 agent 결과를 어디까지 요구할지 명확해진다

---

## Definition of Done

Daily Core v1은 다음이 가능할 때 완료로 본다.

1. 특정 `target + core_date`에 대해 deterministic context 계산 가능
2. source fetch와 normalization 가능
3. Agent 1/2/3 실행 가능
4. final `core_json` validation 가능
5. `daily_core_generations`와 projection 저장 가능
6. partial / empty / failed case가 구분 저장됨
7. regenerate 시 generation history가 남음
