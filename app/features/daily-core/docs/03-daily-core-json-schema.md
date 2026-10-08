# 3. Daily Core JSON Schema 상세 설계

Daily Core는 최종 사용자에게 보여주기 위한 Report가 아니라, 이후 Weekly / Monthly Report 및 기간 분석에서 재사용할 수 있는 중간 표현 데이터다.

따라서 Daily Core JSON은 다음 원칙을 따른다.

- Report 문체보다 구조화된 정보 보존을 우선한다.
- Summary / Ending은 포함하지 않는다.
- Raw Data의 사실과 AI의 해석을 가능한 한 구분한다.
- 검색 / 재사용 / Embedding을 고려한다.
- 각 핵심 Item은 Source Evidence를 추적할 수 있어야 한다.
- Schema는 향후 확장 가능해야 하지만, 초기 버전에서는 불필요한 필드를 과도하게 넣지 않는다.

Daily Core의 주요 구성은 다음과 같다.

KPI INFO
HIGHLIGHTS
TOPIC
PROGRESS AND ROADMAP
MEMBERS ACTIVITY

추가 공통 정보:

Tag
Classification
Entity
Evidence

---

## 3-1. 전체 JSON 구조

초기 Schema Version은 다음과 같이 정의한다.

schemaVersion = daily-core-v1

기본 구조:

{
  "schemaVersion": "daily-core-v1",
  "coreDate": "2026-08-17",

  "kpiInfo": {
    "metrics": []
  },

  "highlights": [],

  "topics": [],

  "progressAndRoadmap": [],

  "memberActivities": [],

  "tags": [],

  "classifications": []
}

각 영역의 역할은 다음과 같다.

kpiInfo
→ 하루 동안 발생한 정량적 Activity 정보

highlights
→ 해당 날짜에서 특히 중요하거나 눈에 띄는 사건

topics
→ 주요 논의 / 문제 / 의사결정 / 이슈

progressAndRoadmap
→ 프로젝트 진행 상황과 향후 작업

memberActivities
→ 멤버별 주요 활동

tags
→ Daily Core 전체를 대표하는 자유형 검색 Tag

classifications
→ 통제된 Taxonomy 기반 분류

---

## 3-2. Daily Core JSON에 포함하지 않는 Metadata

다음 정보는 Core Content 자체가 아니라 Pipeline Metadata이므로 JSON 본문에 넣지 않는다.

- model_name
- model_provider
- prompt_version
- pipeline_version
- token_usage
- input_hash
- processing_time
- validation_result
- source collection status

이 정보들은 `daily_core_generations` 또는 관련 Metadata Table에서 관리한다.

즉:

Core JSON
→ "무슨 일이 있었는가"

Generation Metadata
→ "어떻게 이 결과가 만들어졌는가"

로 역할을 분리한다.

---

## 3-3. Evidence 공통 구조

Daily Core의 주요 분석 결과에는 가능한 한 Evidence를 연결한다.

AI가 특정 Topic이나 Highlight를 생성했다면, 어떤 Slack Message 또는 GitHub Activity를 근거로 판단했는지 추적할 수 있어야 한다.

공통 구조 예:

{
  "targetSourceId": "uuid",
  "sourceType": "slack_channel",
  "externalRef": "C123:1723851000.000100",
  "occurredAt": "2026-08-17T03:21:00Z",
  "url": "https://...",
  "note": "Notification failure discussion"
}

GitHub 예:

{
  "targetSourceId": "uuid",
  "sourceType": "github_repo",
  "externalRef": "pull_request:428",
  "occurredAt": "2026-08-17T07:40:00Z",
  "url": "https://...",
  "note": "Retry logic changed"
}

필드 의미:

targetSourceId
→ 어떤 target_source에서 나온 데이터인지

sourceType
→ slack_channel / github_repo 등

externalRef
→ Provider 내부에서 해당 데이터의 위치를 식별할 수 있는 값

occurredAt
→ 실제 Activity 발생 시간

url
→ 원본으로 이동할 수 있는 URL이 존재하는 경우

note
→ 해당 Evidence가 왜 연결되었는지에 대한 짧은 설명

Evidence는 Raw Data 전체를 복제하기 위한 구조가 아니다.

목적은 다음과 같다.

- AI 판단 근거 추적
- Debug
- Weekly Report 생성 시 원문 확인
- 과거 Issue 재검증
- Hallucination 확인

---

## 3-4. KPI INFO

KPI는 가능한 한 AI가 추측하지 않고 Raw Data에서 코드로 계산한다.

기본 구조:

{
  "kpiInfo": {
    "metrics": [
      {
        "key": "slack_message_count",
        "value": 184,
        "unit": "count",
        "rollupHint": "sum",
        "origin": "computed",
        "dimensions": {
          "channelId": "C123"
        },
        "evidence": []
      }
    ]
  }
}

주요 필드:

key
→ Metric 식별자

value
→ 값

unit
→ count / percent / duration 등

rollupHint
→ Weekly / Monthly 집계 시 참고할 방식

origin
→ computed / ai

dimensions
→ Channel / Repo / Member 등 추가 Dimension

evidence
→ 필요할 경우 해당 Metric의 근거

rollupHint는 다음 값 정도로 시작한다.

sum
avg
max
min
last
none

예:

slack_message_count
→ sum

github_commit_count
→ sum

average_response_time
→ avg

active_member_count
→ none 또는 별도 집계 정책

가능한 KPI는 코드에서 계산하는 것을 원칙으로 한다.

예:

Slack Message Count
GitHub Commit Count
Pull Request Count
Issue Count
Comment Count

→ origin = computed

반대로 의미 해석이 필요한 값이 존재한다면:

Critical Issue Count
Major Topic Count

→ origin = ai

로 구분할 수 있다.

---

## 3-5. HIGHLIGHTS

Highlight는 하루 동안 발생한 사건 중 특히 중요하거나 눈에 띄는 내용을 표현한다.

예:

{
  "key": "highlight-001",
  "title": "Slack notification retry logic changed",
  "summary": "Notification delivery failures led to changes in retry handling.",
  "importance": 4,
  "confidence": 0.94,

  "tags": [
    "slack",
    "notification",
    "retry"
  ],

  "classifications": [
    {
      "taxonomy": "issue_type",
      "value": "delivery_failure",
      "confidence": 0.92
    }
  ],

  "entities": [
    {
      "type": "component",
      "name": "Slack Notification"
    }
  ],

  "evidence": []
}

주요 필드:

key
→ Core 내부 식별자

title
→ 짧은 제목

summary
→ 무엇이 있었는지 설명

importance
→ 중요도

confidence
→ AI 판단 신뢰도

tags
→ 검색 및 Similarity용 자유 Tag

classifications
→ Taxonomy 기반 분류

entities
→ 관련 프로젝트 / 서비스 / 컴포넌트 등

evidence
→ 판단 근거

importance는 초기에는 1~5 범위를 권장한다.

1
→ 참고 수준

2
→ 작은 변화

3
→ 의미 있는 Activity

4
→ 중요한 변화 / Issue

5
→ 해당 날짜의 핵심 사건

---

## 3-6. TOPIC

Topic은 Daily Core에서 가장 중요한 분석 단위 중 하나다.

단순한 Message나 Commit 하나가 아니라, 여러 Activity를 종합했을 때 확인되는 하나의 논의 / 문제 / 의사결정 흐름을 표현한다.

예:

{
  "key": "topic-001",

  "title": "Slack notification delivery failure",

  "summary": "Several failed notifications triggered discussion about retry behavior and provider responses.",

  "status": "in_progress",

  "importance": 5,
  "confidence": 0.96,

  "decisions": [
    "Retry handling will be reviewed."
  ],

  "risks": [
    "Repeated provider errors may cause notifications to be lost."
  ],

  "nextActions": [
    "Verify retry behavior under provider errors."
  ],

  "tags": [
    "slack",
    "notification",
    "retry"
  ],

  "classifications": [
    {
      "taxonomy": "issue_type",
      "value": "integration_failure",
      "confidence": 0.95
    }
  ],

  "entities": [
    {
      "type": "component",
      "name": "Slack Integration"
    }
  ],

  "evidence": []
}

주요 필드:

title
→ Topic 이름

summary
→ 해당 Topic의 핵심 흐름

status
→ 현재 상태

importance
→ 해당 날짜에서의 중요도

confidence
→ AI 판단 신뢰도

decisions
→ 확인 가능한 의사결정

risks
→ 확인된 Risk

nextActions
→ 후속 작업

tags
→ 검색 / Similarity 용도

classifications
→ 구조화된 분류

entities
→ 관련 프로젝트 / 컴포넌트 / 서비스

evidence
→ 근거 Activity

초기 status 값은 다음 정도로 제한한다.

planned
in_progress
completed
blocked
deferred
unknown

Daily Core 단계에서는 과거 데이터와 비교해야만 알 수 있는 다음과 같은 판단은 하지 않는다.

new
repeated
recurring
similar_to_previous

Daily Pipeline은 기본적으로 해당 날짜의 데이터만 분석하기 때문이다.

이러한 판단은 향후 Historical Search / Embedding 단계에서 처리한다.

---

## 3-7. PROGRESS AND ROADMAP

Progress And Roadmap은 단순 Issue가 아니라 프로젝트나 Task가 어떤 방향으로 진행되고 있는지를 표현한다.

예:

{
  "key": "progress-001",

  "title": "Slack Marketplace resubmission preparation",

  "summary": "Review feedback is being addressed before resubmission.",

  "status": "in_progress",

  "importance": 3,

  "progressSignals": [
    "Reviewer feedback was analyzed."
  ],

  "nextActions": [
    "Fix notification behavior.",
    "Prepare resubmission."
  ],

  "blockers": [],

  "tags": [
    "slack",
    "marketplace"
  ],

  "classifications": [],

  "entities": [],

  "evidence": []
}

주요 필드:

progressSignals
→ 실제 진행되었다고 볼 수 있는 근거

nextActions
→ 앞으로 진행할 작업

blockers
→ 진행을 막고 있는 요소

status
→ 현재 진행 상태

status 값은 Topic과 동일한 범위를 사용할 수 있다.

planned
in_progress
completed
blocked
deferred
unknown

---

## 3-8. MEMBERS ACTIVITY

Member Activity는 해당 날짜에 각 멤버가 어떤 영역에서 활동했는지를 요약한다.

단순 Message Count나 Commit Count만 기록하는 것이 아니라, 주요 기여 영역을 표현하는 것이 목적이다.

예:

{
  "key": "member-001",

  "displayName": "Jinwoo",

  "actorRefs": [
    {
      "sourceType": "slack",
      "externalId": "U123"
    },
    {
      "sourceType": "github",
      "externalId": "Jinu-hub"
    }
  ],

  "summary": "Worked mainly on Slack notification handling and retry behavior.",

  "contributions": [
    "Investigated notification failures.",
    "Updated retry logic."
  ],

  "relatedTopicKeys": [
    "topic-001"
  ],

  "tags": [
    "notification",
    "backend"
  ],

  "evidence": []
}

주요 필드:

displayName
→ 표시 이름

actorRefs
→ Slack / GitHub 등 Provider별 사용자 식별자

summary
→ 해당 날짜의 주요 활동 요약

contributions
→ 구체적인 기여 내용

relatedTopicKeys
→ 관련 Topic

tags
→ 활동 영역

evidence
→ 관련 Activity

현재 DB에 Slack User와 GitHub User를 하나의 사람으로 매핑하는 명시적인 Identity Mapping 구조가 없다면 AI가 임의로 동일 인물로 판단하지 않는다.

동일 인물이라는 것이 확실할 때만 여러 actorRefs를 하나의 Member Activity에 묶는다.

확실하지 않으면 별도 Activity로 유지한다.

---

## 3-9. Tag

Tag는 비교적 자유롭게 생성할 수 있는 검색용 Keyword다.

예:

slack
notification
retry
payment
authentication
release
frontend
backend
database
performance

Tag의 목적은 다음과 같다.

- 기간별 검색
- 관련 Topic 탐색
- Similarity Candidate Filtering
- Embedding Search 보조
- Report 생성 시 관련 데이터 그룹화

Tag는 지나치게 세분화하지 않는다.

예:

slack-notification-retry-provider-error

처럼 지나치게 구체적인 Tag보다:

slack
notification
retry

처럼 재사용 가능한 단위를 우선한다.

---

## 3-10. Classification

Classification은 자유형 Tag와 다르게 통제된 Taxonomy 기반 분류다.

예:

{
  "taxonomy": "issue_type",
  "value": "integration_failure",
  "confidence": 0.91
}

향후 사용할 수 있는 Taxonomy 예:

issue_type
activity_type
work_area
risk_type
change_type

예:

issue_type

integration_failure
performance_issue
authentication_issue
delivery_failure
data_issue

activity_type

implementation
investigation
review
planning
release
incident_response

work_area

frontend
backend
database
infrastructure
integration
product

초기에는 Taxonomy 종류를 너무 많이 만들지 않는다.

실제 Daily Core가 쌓인 뒤 필요한 Classification을 관찰하면서 확장한다.

Classification Schema가 변경될 가능성이 있으므로 `daily_core_generations`에 `taxonomy_version`을 함께 기록한다.

---

## 3-11. Entity

Entity는 Topic이나 Highlight가 어떤 대상과 관련되어 있는지를 구조적으로 표현한다.

예:

{
  "type": "component",
  "name": "Slack Integration"
}

사용 가능한 예:

project
service
component
repository
channel
feature
provider

예:

{
  "type": "repository",
  "name": "NexLetter"
}

{
  "type": "provider",
  "name": "Slack"
}

{
  "type": "feature",
  "name": "Notification Delivery"
}

Entity는 향후 Embedding Search뿐 아니라 특정 Project / Service별 활동 분석에도 사용할 수 있다.

---

## 3-12. Embedding 고려

현재 단계에서는 Embedding 자체를 생성하지 않아도 된다.

다만 Daily Core Item을 향후 Semantic Search에 사용할 수 있도록 구조를 준비한다.

Embedding 대상은 Daily Core 전체 하나가 아니라 개별 의미 단위로 한다.

예:

Topic A
Topic B
Highlight A
Progress A

각 Item은 다음 정보를 기반으로 Semantic Text를 구성할 수 있다.

title
+
summary
+
tags
+
classification
+
entities

예:

Slack notification delivery failure.
Several failed notifications triggered discussion about retry behavior and provider responses.
Tags: slack, notification, retry.
Classification: integration_failure.
Entities: Slack Integration.

향후 Pipeline:

Daily Core Item
      ↓
Semantic Text
      ↓
Embedding
      ↓
Vector Search
      ↓
과거 유사 Topic 탐색

Embedding은 현재 Daily Core 생성 Pipeline의 필수 단계로 두지 않는다.

Daily Core 데이터가 충분히 쌓인 이후 별도 작업으로 추가할 수 있다.

---

## 3-13. JSON → DB Projection

AI가 Daily Core JSON을 생성하면 전체 결과는 `daily_core_generations.core_json`에 Canonical Data로 저장한다.

그리고 검색 / 분석에 필요한 일부 구조만 별도 Table로 Projection한다.

Daily Core JSON
      │
      ├── 전체 JSON
      │      ↓
      │ daily_core_generations.core_json
      │
      ├── kpiInfo.metrics[]
      │      ↓
      │ daily_core_metrics
      │
      ├── highlights[]
      │
      ├── topics[]
      │
      ├── progressAndRoadmap[]
      │
      └── memberActivities[]
             ↓
         daily_core_items

즉:

daily_core_generations.core_json
→ Canonical Data

daily_core_items
daily_core_metrics
→ 검색 / 집계용 Projection

Projection 데이터에 문제가 발생하더라도 Canonical JSON을 기반으로 다시 생성할 수 있다.

---

## 3-14. 저장 Transaction

하나의 Daily Core Generation 저장은 가능한 한 하나의 Transaction으로 처리한다.

Schema Validation 성공
        ↓
BEGIN
        ↓
daily_core_generations 저장 (input_source_data_ids 포함, Source 데이터 자체는 수집 단계에서 저장됨)
daily_core_metrics 저장
daily_core_items 저장
daily_core_data.current_generation_no 갱신
        ↓
COMMIT

중간 과정에서 실패하면:

ROLLBACK

처리한다.

이를 통해 다음과 같은 불완전한 상태를 방지한다.

- core_json은 있는데 Item이 없음
- Metric 일부만 존재
- Generation은 성공인데 Projection 저장 실패
- current_generation이 실패한 Generation을 가리킴

---

## 3-15. Daily Core JSON 설계 원칙 요약

Daily Core JSON은 다음 역할에 집중한다.

"해당 날짜에 무엇이 있었고, 그것을 이후 다시 어떻게 활용할 수 있는가"

포함:

KPI INFO
HIGHLIGHTS
TOPIC
PROGRESS AND ROADMAP
MEMBERS ACTIVITY
TAG
CLASSIFICATION
ENTITY
EVIDENCE

포함하지 않음:

Summary
Ending
Weekly Synthesis
Historical Similarity Result
Embedding Vector
Pipeline 실행 Metadata

전체 구조:

Daily Raw Data
      ↓
Normalization
      ↓
Daily Core AI
      ↓
Daily Core JSON
      │
      ├── KPI
      ├── Highlights
      ├── Topics
      ├── Progress / Roadmap
      └── Member Activities
              │
              ├── Tags
              ├── Classifications
              ├── Entities
              └── Evidence
      ↓
Canonical JSON 저장
      ↓
Item / Metric Projection
      ↓
향후 Weekly Report / Historical Search / Embedding 활용