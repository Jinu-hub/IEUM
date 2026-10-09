# 2. Daily Core DB 상세 설계

Daily Core를 단순 JSONB 하나로 저장하는 방식보다는 향후 확장을 고려한 구조로 설계한다.

예상되는 향후 요구는 다음과 같다.

- Daily Core 재생성
- Prompt 변경 비교
- Model 변경 비교
- Source 누락 확인
- 기간별 Topic 검색
- Tag / Classification 검색
- KPI 집계
- 유사 Issue 분석
- Weekly Pipeline Input 전환
- Historical Memory 기능

이를 고려하여 다음과 같은 구조를 사용한다.

```text
targets
   │
   └── daily_core_data
             │
             ├── daily_core_source_data      (수집 결과, 생성 전에 저장)
             │
             └── daily_core_generations      (input_source_data_ids로 사용한 수집 행 참조)
                        │
                        ├── daily_core_items
                        └── daily_core_metrics
```

> Flue 도입(2026-10) 이후 개정 (migration `0043`): 수집 데이터(정규화본) 저장 테이블 신설, `job_queue` 의존 제거, Flue 실행 추적 컬럼 추가.
> 실행 흐름: Vercel 수집 → `daily_core_source_data` 저장 + `collection_stage = collected` → Cron → Cloudflare Worker(Flue)가 Generation 생성.

---

## 2-1. daily_core_data

`daily_core_data`는 하나의 논리적인 Daily Core를 표현한다.

```text
1 Target × 1 Local Date
```

당 하나의 Record만 존재한다.

### 주요 컬럼

| Column | Type | 설명 |
|---|---|---|
| daily_core_id | uuid PK | Daily Core 식별자 |
| workspace_id | uuid FK | Workspace |
| target_id | uuid FK | Target |
| core_date | date | Target Local Date |
| timezone | text | 생성 당시 Target timezone Snapshot |
| language | enum | 생성 당시 Target language |
| target_display_name | text | Target 이름 Snapshot |
| target_category | enum | Target category Snapshot |
| window_start_at | timestamptz | Raw Data 범위 시작 |
| window_end_at | timestamptz | Raw Data 범위 종료 |
| quality_status | enum | missing / ready / partial / empty |
| collection_stage | enum | pending / collected / failed. Cron이 `collected`를 골라 Core 생성으로 넘김 |
| collected_at | timestamptz nullable | 마지막 수집 완료 시각 |
| last_generation_no | integer | 마지막으로 실행된 Generation 번호 |
| current_generation_no | integer nullable | 현재 유효한 Generation 번호 |
| last_attempt_at | timestamptz nullable | 마지막 생성 시도 |
| last_generated_at | timestamptz nullable | 마지막 정상 생성 시각 |
| last_error_code | text nullable | 최근 오류 코드 |
| last_error_message | text nullable | 최근 오류 메시지 |
| created_at | timestamptz | 생성 시각 |
| updated_at | timestamptz | 수정 시각 |

### Unique Constraint

```text
UNIQUE(target_id, core_date)
```

즉:

```text
Target A + 2026-08-17
```

이라는 논리적인 Daily Core는 하나만 존재한다.

Generation 결과는 별도 테이블에서 관리한다.

### last_generation_no / current_generation_no 분리

두 값을 분리하는 것이 중요하다.

예:

```text
Generation 1 → 성공
Generation 2 → 실패
```

이 경우:

```text
last_generation_no    = 2
current_generation_no = 1
quality_status         = ready
```

가 된다.

재생성 실패 때문에 이미 정상적으로 존재하던 Daily Core가 사용 불가능해지는 것을 방지한다.

---

## 2-2. daily_core_generations

`daily_core_generations`는 Daily Core를 실제로 생성한 개별 실행 결과를 저장한다.

```text
daily_core_data
    ↓
Generation 1
Generation 2
Generation 3
...
```

### 주요 컬럼

| Column | Type | 설명 |
|---|---|---|
| generation_id | uuid PK | Generation ID |
| daily_core_id | uuid FK | 부모 Daily Core |
| workspace_id | uuid FK | Workspace |
| target_id | uuid FK | Target |
| generation_no | integer | Generation 순번 |
| trigger | text | scheduled / manual / backfill / regenerate |
| generation_status | enum | queued / processing / succeeded / failed |
| quality_status | enum nullable | ready / partial / empty |
| input_source_data_ids | uuid[] | 사용한 `daily_core_source_data` 행 (같은 daily_core 아래라 함께 cascade) |
| input_hash | text nullable | Input Data Fingerprint |
| content_hash | text nullable | 생성 결과 Fingerprint |
| agent_conversation_id | text nullable | Flue 대화 ID (Durable Object). 실행마다 새 ID |
| agent_output_json | jsonb nullable | Pipeline merge 전 Agent 출력 (중간 산출물) |
| core_json | jsonb nullable | Canonical Daily Core 결과 |
| schema_version | text | 예: daily-core-v1 |
| taxonomy_version | text | Classification Version |
| prompt_version | text nullable | 사용 Prompt Version |
| pipeline_version | text | Pipeline Code Version |
| model_provider | text nullable | openai 등. Worker가 완료 시 기록 |
| model_name | text nullable | 실제 사용 모델 |
| model_config_json | jsonb | temperature 등 모델 설정 |
| input_stats_json | jsonb | Raw Input 규모 |
| token_usage_json | jsonb | Input / Output Token |
| processing_metrics_json | jsonb | 처리 시간 등의 Metric |
| validation_json | jsonb | Schema Validation 결과 |
| error_code | text nullable | 실패 코드 |
| error_message | text nullable | 실패 상세 |
| started_at | timestamptz nullable | 처리 시작 (queued 동안 null) |
| finished_at | timestamptz nullable | 처리 종료 |
| created_at | timestamptz | 생성 시각 |

### Unique Constraint

```text
UNIQUE(daily_core_id, generation_no)
```

### Canonical Data

`core_json`을 해당 Generation의 Canonical Data로 사용한다.

```text
core_json
    ↓
Canonical Daily Core
```

이후 생성되는:

```text
daily_core_items
daily_core_metrics
```

는 검색 및 집계를 위한 Projection Data로 간주한다.

```text
core_json
    ↓
Canonical

daily_core_items
daily_core_metrics
    ↓
Projection / Index
```

따라서 필요하면 향후:

```text
core_json
→ daily_core_items 재생성

core_json
→ daily_core_metrics 재생성
```

이 가능하다.

---

## 2-3. daily_core_source_data

Vercel이 수집·정규화한 하루치 Source 데이터를 저장한다. Generation보다 먼저 만들어지며, Worker(Flue)는 이 행을 읽어 Core를 생성한다. 원본 데이터를 Agent 대화에 직접 싣지 않는다.

```text
1 Daily Core × 1 Source (최신 수집 1회분)
```

예:

```text
2026-08-17 수집 1회차

Slack C123     → 184 messages
Slack C456     → 21 messages
GitHub repo A  → 15 events
GitHub repo B  → ERROR
```

재수집(늦게 유입된 데이터 등)은 그 Daily Core의 행을 모두 지우고 새로 넣는다. 같은 내용이 여러 벌 쌓이면 Worker가 중복으로 읽어 입력 토큰이 늘어나기 때문이다. 그 대신 재수집 후에는 과거 Generation의 `input_source_data_ids`가 지워진 행을 가리킬 수 있다(과거 입력은 보존되지 않음).

Provider 원본 payload는 저장하지 않는다. 필터·압축을 거친 `NormalizedSourceItem[]`만 저장한다. 정규화 로직이 바뀌면 다시 수집한다.

### 주요 컬럼

| Column | Type | 설명 |
|---|---|---|
| source_data_id | uuid PK | Source Data ID |
| daily_core_id | uuid FK | 부모 Daily Core (cascade) |
| workspace_id | uuid FK | Workspace |
| target_id | uuid FK | Target |
| target_source_id | uuid nullable | 당시 Target Source |
| integration_id | uuid nullable | 당시 Integration |
| source_type | text | slack_channel / github_repo 등 |
| source_ident | text | Channel ID / Repository 등 |
| config_snapshot_json | jsonb | filter / priority 등의 설정 Snapshot |
| collection_status | enum | success / empty / failed |
| normalized_json | jsonb | `NormalizedSourceItem[]` (Agent 입력) |
| item_count | integer | Item 수 |
| content_hash | text nullable | normalized_json Fingerprint |
| stats_json | jsonb | Provider별 추가 통계 (원본 크기 등) |
| error_code | text nullable | 수집 실패 코드 |
| error_message | text nullable | 수집 실패 상세 |
| collected_at | timestamptz | 수집 시각 |

수집 범위는 부모 `daily_core_data.window_start_at / window_end_at`을 따른다.

`target_source_id`와 `integration_id`는 삭제 시 과거 이력이 사라지지 않도록 다음 정책을 권장한다.

```text
onDelete: set null
```

대신 당시 설정값을 다음 필드로 함께 보존한다.

```text
source_type
source_ident
config_snapshot_json
```

현재 Source 설정이 삭제되거나 변경되어도 과거 Generation을 복원할 수 있다.

---

## 2-4. daily_core_items

Daily Core 안에 포함된 의미 있는 분석 결과를 검색 가능한 단위로 Projection한다.

대상은 다음과 같다.

```text
HIGHLIGHT
TOPIC
PROGRESS / ROADMAP
MEMBER ACTIVITY
```

### 주요 컬럼

| Column | Type | 설명 |
|---|---|---|
| item_id | uuid PK | Item ID |
| generation_id | uuid FK | Generation |
| workspace_id | uuid FK | Workspace |
| target_id | uuid FK | Target |
| core_date | date | Core Date |
| item_type | enum | highlight / topic / progress_roadmap / member_activity |
| item_key | text | Core JSON 내부 안정적인 Key |
| title | text nullable | 제목 |
| summary | text | 핵심 내용 |
| status | text nullable | 진행 상태 |
| importance | integer nullable | 중요도, 예: 1~5 |
| confidence | numeric nullable | AI 판단 신뢰도 0~1 |
| tags | text[] | 검색용 Tag |
| classifications_json | jsonb | 구조화 Classification |
| entities_json | jsonb | Project / Component / Service 등의 Entity |
| evidence_json | jsonb | 근거 Source |
| semantic_text | text | 향후 Embedding 입력용 텍스트 |
| payload_json | jsonb | Item Type별 추가 정보 |
| created_at | timestamptz | 생성 시각 |

### Unique Constraint

```text
UNIQUE(
  generation_id,
  item_type,
  item_key
)
```

### semantic_text

현재 단계에서 Embedding 자체를 생성할 필요는 없지만, 향후 Semantic Search를 위해 `semantic_text`는 미리 준비해둔다.

```text
title
+
summary
+
tags
+
classification
+
관련 Entity
```

등을 검색에 적합한 문장으로 구성한다.

향후:

```text
semantic_text
      ↓
Embedding
      ↓
유사 Topic / Issue 검색
```

으로 확장할 수 있다.

---

## 2-5. daily_core_metrics

KPI는 JSONB 내부에만 저장하지 않고 별도 Projection Table에도 저장한다.

Daily → Weekly → Monthly 집계 가능성이 높기 때문이다.

### 주요 컬럼

| Column | Type | 설명 |
|---|---|---|
| metric_id | uuid PK | Metric ID |
| generation_id | uuid FK | Generation |
| workspace_id | uuid FK | Workspace |
| target_id | uuid FK | Target |
| core_date | date | 날짜 |
| metric_key | text | slack_message_count 등 |
| metric_value | numeric | 값 |
| unit | text | count / percent / duration 등 |
| rollup_hint | text | sum / avg / max / min / last / none |
| origin | text | computed / ai |
| dimensions_json | jsonb | Channel / Repo / Member 등 Dimension |
| dimension_hash | text | Dimension 중복 방지 |
| evidence_json | jsonb | 데이터 근거 |
| created_at | timestamptz | 생성 시각 |

### Unique Constraint

```text
UNIQUE(
  generation_id,
  metric_key,
  dimension_hash
)
```

### Metric Origin

Metric이 코드로 계산된 값인지 AI가 분석한 값인지 반드시 구분한다.

```text
origin = computed
origin = ai
```

예:

```text
Slack 메시지 수
GitHub Commit 수
Pull Request 수

→ computed
```

반면:

```text
주요 Issue 수
중요 Topic 수
Risk Signal 수

→ ai
```

가 될 수 있다.

가능한 KPI는 AI가 추측하지 않고 코드에서 계산하는 것을 원칙으로 한다.

---

## 2-6. RLS 정책

Daily Core 관련 테이블은 사용자 설정 데이터가 아니라 Pipeline이 생성하는 결과 데이터다.

따라서 기존 `newsletter_runs`, `newsletter_editions`, `highlights` 등과 유사한 정책을 사용한다.

대상:

```text
daily_core_data
daily_core_generations
daily_core_source_data
daily_core_items
daily_core_metrics
```

기본 정책:

```text
SELECT
→ 해당 Workspace Member

INSERT
UPDATE
DELETE
→ service_role
```

즉 사용자는 자신이 속한 Workspace의 Daily Core를 조회할 수 있지만 생성 및 수정은 Backend Pipeline에서만 수행한다.

---

## 2-7. 주요 Index

초기부터 다음 Index를 구성하는 것을 권장한다.

### daily_core_data

```text
UNIQUE(target_id, core_date)

INDEX(workspace_id, core_date)

INDEX(target_id, core_date)

INDEX(quality_status, core_date)

INDEX(collection_stage, core_date)
```

### daily_core_generations

```text
UNIQUE(daily_core_id, generation_no)

INDEX(daily_core_id, created_at)

INDEX(input_hash)
```

### daily_core_source_data

```text
INDEX(daily_core_id, collected_at)

INDEX(target_source_id)
```

### daily_core_items

```text
INDEX(target_id, core_date, item_type)

INDEX(workspace_id, core_date)

GIN(tags)

GIN(classifications_json)
```

향후 Full-text Search가 필요하면 `semantic_text` 기반 `tsvector`를 추가할 수 있다.

### daily_core_metrics

```text
INDEX(target_id, core_date, metric_key)

INDEX(workspace_id, core_date)
```

---

## 2-8. 실행 관리 (job_queue 미사용)

초기 설계는 `job_queue`를 재사용하는 것이었지만, Flue 도입 후 사용하지 않는다.

- 처리 대상 선택: `daily_core_data.collection_stage` + `daily_core_generations.generation_status`
- 실행 추적: `daily_core_generations.agent_conversation_id` (Flue Durable Object 대화 ID)
- Worker 재시작 복구: Flue가 Durable Object 안에서 처리하므로 앱 측 재시도 큐가 필요 없음

Worker는 Supabase REST(service role)로 저장하므로 여러 테이블을 하나의 Transaction으로 묶을 수 없다. 03 문서 3-14의 저장 Transaction은 Generation 저장 단계에서 Postgres 함수(RPC) 하나로 구현한다.

---

# DB 구조 요약

```text
targets
   │
   │  1 Target × 1 Local Date
   ▼
daily_core_data
   │
   ├──────────────────────────────┐
   │  수집 (재수집 시 교체)        │  Generation History
   ▼                              ▼
daily_core_source_data  ◀──  daily_core_generations
                    input_source_data_ids
                                  │
                         ┌────────┴────────┐
                         ▼                 ▼
                 daily_core_items   daily_core_metrics
```

각 테이블의 역할은 다음과 같이 구분한다.

```text
daily_core_data
→ 논리적인 하루의 Daily Core 상태 (수집 단계 포함)

daily_core_source_data
→ 수집·정규화된 Source 데이터 (Agent 입력, Provenance)

daily_core_generations
→ 실제 AI 생성 실행, Agent 중간 출력, Canonical Core JSON

daily_core_items
→ Topic / Highlight / Progress / Member Activity 검색용 Projection

daily_core_metrics
→ KPI 집계 및 기간별 분석용 Projection
```

이 구조에서는 Daily Core 생성 방식이나 Prompt가 향후 변경되더라도 기존 데이터를 덮어쓰지 않고 Generation 단위로 관리할 수 있다.

또한 Weekly Pipeline이 향후 Raw Data 대신 Daily Core를 사용하게 되더라도, DB 구조 자체를 다시 변경하지 않고 현재 유효한 Generation의 Canonical Core 또는 Projection Data를 입력으로 사용할 수 있다.