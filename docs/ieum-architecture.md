# IEUM 초기 아키텍처 및 AI 파이프라인 설계 방향

> 이 문서는 IEUM 개발 초기 시점의 설계 방향과 아이디어를 정리한 컨텍스트 문서이다.
>
> 아래 내용은 **확정된 최종 설계가 아니다.**
> 실제 구현 과정에서 기술적 제약, 비용, 성능, 유지보수성, AI 품질 등을 확인하며 구조는 언제든 변경할 수 있다.
>
> 기존 아이디어를 억지로 유지하기보다, 구현 과정에서 더 나은 방법이 발견되면 적극적으로 개선한다.

---

## 1. IEUM의 출발점

IEUM은 기존 **NexLetter의 소스코드를 하드포크**하여 시작한다.

NexLetter에서 이미 구현되어 있고 IEUM에서도 활용 가치가 높은 부분은 최대한 재사용한다.

주요 재사용 대상은 다음과 같다.

- Slack 연결
- Slack 데이터 수집
- 원본 데이터 정리
- 데이터 필터링
- 입력 데이터 압축
- 기존 인증 및 일부 UI
- 기존 DB 관련 코드 중 재사용 가능한 부분

반면 **기존 NexLetter의 LLM 처리 파이프라인은 IEUM에서는 대부분 교체한다.**

---

## 2. NexLetter와 IEUM의 핵심 차이

### NexLetter

NexLetter는 일정 기간, 예를 들어 일주일치 데이터를 가져온 뒤 여러 LLM 단계를 순차 실행하여 바로 리포트를 생성하는 구조에 가깝다.

```text
일주일치 Raw Data
        ↓
LLM Step A
        ↓
LLM Step B
        ↓
LLM Step C
        ↓
Weekly Report
```

즉 중간에 재사용 가능한 구조화된 Core Data를 별도로 자산화하지 않는다.

---

### IEUM

IEUM에서는 이를 변경한다.

먼저 **하루 단위의 데이터를 구조화된 Daily Core Data로 변환하여 저장**한다.

```text
하루치 Raw / Compressed Data
        ↓
Daily Core 생성
        ↓
Daily Core Data 저장
```

그리고 이 Core Data를 기반으로 이후 여러 결과물을 생성한다.

```text
Daily Core
   ├─ Daily Report
   ├─ Weekly Report
   ├─ Search
   ├─ Embedding
   └─ Chat / Agent 활용
```

IEUM에서 Core Data는 단순한 중간 결과물이 아니라 향후 여러 기능에서 재사용되는 **핵심 기억 데이터 레이어**가 된다.

---

## 3. Daily Core 중심 구조

하루마다 들어오는 입력 데이터의 성격은 달라질 수 있다.

예:

```text
Day A
- Slack 토론 중심
- 기술적 결정 다수

Day B
- GitHub 작업 중심
- 실제 구현 진행사항 다수

Day C
- 질문 / 문제 / blocker 중심

Day D
- 특별한 활동이 거의 없음
```

하지만 최종적으로 생성되는 Daily Core Data는 가능한 한 **정형화된 Schema**를 유지한다.

개념적으로는 다음과 같다.

```text
Variable Input
      ↓
Variable AI Processing
      ↓
Fixed Core Schema
```

Agent의 내부 판단과 처리 방법에는 유연성을 주되, 최종 출력 데이터는 다운스트림 시스템이 안정적으로 사용할 수 있도록 구조화한다.

예시:

```json
{
  "date": "2026-10-05",
  "summary": "...",
  "topics": [],
  "decisions": [],
  "progress": [],
  "issues": [],
  "next_actions": [],
  "entities": [],
  "tags": []
}
```

위 Schema는 현재 예시일 뿐이며 실제 IEUM 구현 전에 별도로 설계한다.

---

# 4. Flue 도입 방향

IEUM의 새로운 AI Processing Layer에는 **Flue Framework** 사용을 우선 검토한다.

Flue의 역할은 기존 Slack 연결이나 데이터 수집을 대체하는 것이 아니다.

다음 영역을 담당하는 Agent Runtime / Orchestration Layer로 사용한다.

```text
입력 데이터
   ↓
Flue Agent
   ├─ 입력 성격 판단
   ├─ 필요한 Skill 선택
   ├─ Tool 사용
   ├─ 필요 시 Subagent 호출
   ├─ 분석
   └─ 구조화
   ↓
Structured Output
```

기존 NexLetter처럼 모든 데이터가 항상 동일한 LLM Step A → B → C를 통과하도록 강제하기보다는, 입력 내용에 따라 필요한 처리 방법을 Agent가 선택할 수 있도록 한다.

---

## 5. Flue에 모든 것을 맡기지는 않는다

IEUM의 전체 Workflow 자체를 하나의 거대한 Agent에게 맡기는 것은 현재 목표가 아니다.

예:

```text
"Slack을 읽고
Core 만들고
검증하고
리포트 쓰고
DB 저장하고
Weekly Report까지 만들어."
```

와 같은 형태는 피한다.

대신 큰 흐름은 시스템이 관리하고, 각 단계 안에서 필요한 AI 판단을 Flue에게 맡긴다.

개념적으로:

```text
Macro Orchestration
→ Supabase / Cron / Application Logic

Micro Orchestration
→ Flue
```

즉:

```text
Supabase:
"지금 Core 생성 단계다."

        ↓

Flue:
"이 Core를 만들기 위해 어떤 분석과 Skill이 필요한가?"
```

와 같은 역할 분리를 목표로 한다.

---

# 6. 인프라 역할 분리

현재 생각하고 있는 기본 역할 분담은 다음과 같다.

## Vercel

주요 역할:

- IEUM Web Application
- Slack 연결
- 데이터 수집 API
- Raw Data 전처리
- 데이터 필터링
- 입력 데이터 압축
- 일반적인 서비스 API

Vercel에서 장시간 AI Agent 작업을 수행하는 것은 가능한 한 피한다.

---

## Supabase

Supabase는 단순 DB 이상의 역할을 담당한다.

주요 역할:

- 중앙 데이터 저장소
- Pipeline 상태 관리
- 단계별 중간 결과 저장
- Core Data 저장
- Report 저장
- Cron 실행
- 다음 처리 대상 선택

즉 IEUM AI Pipeline의 **중앙 상태 머신(State Machine)** 역할도 수행한다.

---

## Cloudflare Workers + Flue

주요 역할:

- AI 작업 실행 환경
- Daily Core 생성
- Core 분석 및 구조화
- Daily Report 생성
- Weekly Report 생성
- Flue Agent Runtime
- Skills / Tools / Subagents 실행

가능하면 긴 LLM 작업을 Vercel보다 Cloudflare Worker 쪽으로 분리한다.

---

# 7. 초기 전체 흐름

현재 생각하고 있는 기본 구조는 다음과 같다.

```text
Supabase Cron
      ↓
Vercel API
      ↓
Slack 데이터 수집
      ↓
전처리 / 압축
      ↓
Supabase 저장
status = compressed
      ↓
─────────────────────────
Supabase Cron
      ↓
compressed 작업 탐색
      ↓
Cloudflare + Flue
      ↓
Daily Core 생성
      ↓
Schema Validation
      ↓
Supabase 저장
status = core_ready
      ↓
─────────────────────────
Supabase Cron
      ↓
core_ready 작업 탐색
      ↓
Cloudflare + Flue
      ↓
Daily Report 생성
      ↓
Supabase 저장
status = daily_report_ready
```

Weekly Report는 별도의 Pipeline으로 구성한다.

```text
Supabase Weekly Cron
        ↓
해당 기간 Daily Core 조회
        ↓
Cloudflare Weekly Report Agent
        ↓
Weekly Report 생성
        ↓
Supabase 저장
```

---

# 8. Daily Report와 Weekly Report

리포트 생성은 Core 생성과 별도의 단계로 분리한다.

## Daily Report

```text
Daily Core
    ↓
Daily Report Agent
    ↓
Daily Report
```

Daily Report Agent는 Raw Slack 데이터를 다시 분석하지 않는다.

Core Data를 신뢰 가능한 입력 데이터로 사용한다.

---

## Weekly Report

```text
Daily Core
Daily Core
Daily Core
Daily Core
Daily Core
    ↓
Weekly Report Agent
    ↓
Weekly Report
```

Weekly Report 역시 Daily Report를 다시 요약하는 방식보다는 **Daily Core들을 직접 읽는 방식**을 우선 고려한다.

이렇게 하면 Daily Report의 문체나 표현 방식이 변경되어도 Weekly Report의 데이터 품질에는 영향을 최소화할 수 있다.

---

## Monthly Report

현재는 보류한다.

Daily / Weekly 구조가 안정적으로 동작한 이후 필요성을 다시 검토한다.

---

# 9. 작업을 단계별로 분리하는 이유

AI 작업을 한 번의 긴 요청으로 처리하지 않는다.

예를 들어:

```text
수집
→ 압축
→ Core 분석
→ Core 구조화
→ 검증
→ Report 작성
→ Review
→ 저장
```

전체를 한 실행에서 처리하면 다음과 같은 문제가 생길 수 있다.

- 실행 시간이 길어진다.
- 실패 시 전체를 다시 실행해야 한다.
- 어느 단계에서 실패했는지 파악하기 어렵다.
- 단계별 비용 분석이 어렵다.
- 특정 단계만 모델을 변경하기 어렵다.
- 장시간 Serverless 실행 부담이 커진다.

따라서 Supabase DB에 단계별 결과와 status를 저장하면서 다음 작업으로 진행한다.

---

# 10. Status 기반 Pipeline

초기에는 다음과 같은 개념을 고려할 수 있다.

```text
collecting
    ↓
compressed
    ↓
core_processing
    ↓
core_ready
    ↓
report_processing
    ↓
daily_report_ready
```

실패 상태도 구분할 수 있다.

```text
core_failed
report_failed
```

하지만 실제로는 Core 생성 및 Report 생성 과정 자체도 여러 작업으로 나눌 수 있다.

예:

```text
compressed
    ↓
core_analyzing
    ↓
core_structuring
    ↓
core_validating
    ↓
core_ready
```

Report 역시:

```text
core_ready
    ↓
report_planning
    ↓
report_writing
    ↓
report_reviewing
    ↓
daily_report_ready
```

처럼 세분화할 수 있다.

---

# 11. 단, 지나친 분할은 피한다

작업을 최대한 많이 쪼개는 것이 목적은 아니다.

예를 들어 다음 작업을 모두 별도 Agent Job으로 나누는 것은 오히려 비효율적일 수 있다.

```text
topic extraction
decision extraction
entity extraction
tag extraction
title generation
importance scoring
```

각 단계마다:

- DB Read / Write
- Worker Invocation
- LLM 호출
- 상태 관리
- 네트워크 통신

등의 오버헤드가 발생하기 때문이다.

따라서 기본 원칙은 다음과 같다.

> **독립적으로 실패하거나 재실행할 가치가 있는 작업이라면 분리한다.**

단순히 논리적으로 나눌 수 있다는 이유만으로 분리하지 않는다.

---

# 12. Flue 내부에서는 더 작은 단위로 처리 가능

Supabase Pipeline에서는 하나의 Job으로 보이더라도, Flue 내부에서는 여러 Skill이나 Tool을 사용할 수 있다.

예:

```text
[Supabase]

status = compressed

      ↓

[Flue Daily Core Agent]

discussion-analysis
decision-extraction
progress-analysis
issue-analysis
entity/tag extraction
optional subagent
structured output

      ↓

[Supabase]

status = core_ready
```

즉 시스템 레벨에서는 하나의 Core Job이지만, Agent 내부에서는 필요에 따라 세부 작업을 자율적으로 수행할 수 있다.

---

# 13. Intermediate Data를 적극적으로 저장한다

각 AI 단계 사이에서 의미 있는 중간 산출물이 있다면 Supabase에 저장한다.

예:

```text
Raw Data
 ↓
Compressed Data
 ↓
Core Analysis
 ↓
Structured Core
 ↓
Daily Report
```

중간 데이터를 저장함으로써:

- 실패 후 재시작
- 특정 단계 재실행
- Agent 결과 비교
- Prompt 변경 테스트
- 모델 변경 테스트
- 디버깅
- 비용 분석

이 쉬워진다.

Raw 데이터를 반복해서 처음부터 다시 분석하는 것을 가능한 한 피한다.

---

# 14. Daily Core의 책임

Daily Core는 예쁜 리포트를 작성하기 위한 문서가 아니다.

가능한 한 다음과 같은 정보 보존에 집중한다.

```text
Facts
Relationships
Decisions
Changes
Progress
Issues
Actions
Context
Evidence
Entities
Topics
```

즉:

> "그날 어떤 일이 있었는가?"

를 이후 Agent가 다시 활용할 수 있는 형태로 보존한다.

---

# 15. Report Agent의 책임

Report Agent는 Core Data를 인간이 읽기 좋은 콘텐츠로 변환한다.

담당 영역은 예를 들면:

```text
무엇을 강조할 것인가
어떤 순서로 설명할 것인가
어떤 흐름으로 연결할 것인가
얼마나 압축할 것인가
어떤 문체를 사용할 것인가
```

Core Data와 Report를 분리함으로써 같은 Core에서 여러 종류의 표현물을 생성할 수 있다.

---

# 16. 초기 구현 범위

첫 번째 목표에서는 욕심내지 않는다.

## Phase 1

```text
하루치 Slack 데이터
       ↓
기존 NexLetter 로직으로 수집 / 압축
       ↓
Supabase 저장
       ↓
Cloudflare + Flue Daily Core Agent
       ↓
Structured Daily Core
       ↓
Schema Validation
       ↓
Supabase 저장
```

여기까지 성공시키는 것을 우선 목표로 한다.

---

## Phase 2

Phase 1이 안정된 뒤:

```text
Daily Core
   ↓
Daily Report Agent
   ↓
Daily Report
```

를 추가한다.

---

## Phase 3

Daily Core들이 충분히 축적되면:

```text
Daily Core × N
   ↓
Weekly Report Agent
   ↓
Weekly Report
```

를 추가한다.

---

# 17. 현재 기술 구성 가설

현재 기준으로 예상하는 구성은 다음과 같다.

```text
Vercel
────────────────
Web App
Slack Integration
Collection API
Preprocessing
Compression


Supabase
────────────────
PostgreSQL
Pipeline State
Intermediate Data
Daily Core
Reports
Cron


Cloudflare Workers
────────────────
Flue Runtime
Daily Core Agent
Daily Report Agent
Weekly Report Agent
AI Jobs
```

필요하다면 Railway 또는 다른 실행 환경을 추가할 수 있다.

하지만 AI 작업이 대부분:

```text
LLM Call
DB Read
DB Write
Tool Call
Validation
```

과 같은 I/O 중심이라면 Cloudflare Workers + Flue만으로 충분한지 먼저 검증한다.

---

# 18. Railway 사용 여부

Railway는 현재 필수 구성으로 확정하지 않는다.

향후 다음과 같은 요구가 생겼을 때 다시 검토한다.

- 장시간 CPU 작업
- Python 중심 Processing
- Native Binary 사용
- 대용량 Batch Processing
- Worker 환경에 적합하지 않은 작업
- 장시간 유지되는 프로세스

현재 단계에서는 Cloudflare + Flue를 우선 테스트한다.

---

# 19. 가장 중요한 설계 원칙

### 1. Core First

Raw Data에서 바로 Report를 만들지 않는다.

```text
Raw → Core → Output
```

구조를 기본으로 한다.

---

### 2. Structured Memory

Daily Core를 IEUM의 재사용 가능한 기억 단위로 만든다.

---

### 3. 작은 Failure Boundary

하나의 거대한 AI 작업보다 의미 있는 단위로 작업을 분리한다.

---

### 4. DB 중심의 상태 관리

Agent 내부 메모리에 전체 Pipeline 상태를 맡기지 않는다.

Supabase에 상태와 중간 결과를 명시적으로 저장한다.

---

### 5. Agent의 자율성은 필요한 곳에만

전체 Workflow는 시스템이 관리한다.

각 단계 내부에서 필요한 판단은 Agent에게 맡긴다.

```text
System determines WHAT stage to run.

Agent determines HOW to perform that stage.
```

---

### 6. 입력은 유연하게, 출력은 엄격하게

```text
Flexible Input
Flexible Processing
Strict Structured Output
```

을 지향한다.

---

### 7. 재실행 가능성

각 Job은 가능한 한 독립적으로 다시 실행할 수 있도록 설계한다.

---

### 8. 기존 자산 재사용

NexLetter에서 이미 잘 동작하는 Slack 연결 및 수집 코드는 불필요하게 다시 만들지 않는다.

---

### 9. 과도한 Agent화 금지

일반 코드로 확실하게 처리할 수 있는 작업까지 억지로 LLM이나 Agent에게 맡기지 않는다.

---

### 10. 구현하면서 계속 수정한다

이 문서의 구조는 초기 가설이다.

실제 구현 중 다음을 계속 확인한다.

- Flue가 정말 필요한가?
- Skill 분리가 효과적인가?
- Subagent가 필요한가?
- 한 Job의 적절한 크기는 얼마인가?
- Supabase Cron Polling이 적절한가?
- Event 기반 처리가 더 나은가?
- Cloudflare Worker가 충분한가?
- Core Schema가 실제 Report 생성에 충분한가?
- 중간 데이터를 어디까지 저장해야 하는가?
- Agent 비용 대비 품질 개선이 충분한가?

현재 설계를 지키는 것이 목표가 아니다.

> **더 단순하고, 안정적이고, 비용 효율적이며, 결과 품질이 좋은 방법이 발견되면 언제든 구조를 변경한다.**

---

# 20. 현재 시점의 핵심 방향

IEUM의 초기 방향을 한 문장으로 정리하면:

> **NexLetter의 데이터 수집 자산은 활용하되, LLM Pipeline은 새로 설계하고, 하루 단위의 구조화된 Core Data를 중심으로 Daily / Weekly Report와 이후의 검색·Agent 기능을 확장한다.**

AI Processing 구조는:

```text
Supabase
→ Macro Orchestration / State

Cloudflare + Flue
→ AI Execution / Micro Orchestration

Vercel
→ Application / Collection
```

의 역할 분리를 우선 검토한다.

단, 이 역시 구현 과정에서 지속적으로 변경 가능한 초기 설계 가설이다.
